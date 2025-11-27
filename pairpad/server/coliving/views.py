from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import generics, status, viewsets, filters
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from django.contrib.auth import get_user_model
from datetime import datetime
from django.utils import timezone

User = get_user_model()
from .models import (
    LivingSpace, LivingSpaceMember, Room, LivingSpaceImage,
    RoomApplication, LivingSpaceReview, HouseRules, Task, Expense,
    ShoppingList, ShoppingListItem, Bill, Notification, CalendarEvent,
    LivingSpaceInvitation
)
from matching.models import MatchInteraction, Match
from .serializers import (
    LivingSpaceSerializer, LivingSpaceCreateSerializer, RoomSerializer,
    RoomCreateSerializer, RoomApplicationSerializer, LivingSpaceReviewSerializer,
    LivingSpaceImageSerializer, TaskSerializer, ExpenseSerializer,
    ShoppingListSerializer, ShoppingListItemSerializer, BillSerializer,
    NotificationSerializer, CalendarEventSerializer
)

class LivingSpaceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing living spaces"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['space_type', 'city', 'furnished', 'utilities_included']
    search_fields = ['name', 'description', 'city', 'address']
    ordering_fields = ['created_at', 'total_rent', 'available_from']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter living spaces based on user permissions and public visibility"""
        user = self.request.user

        # Check if this is for "My Spaces" (collaboration spaces only)
        my_spaces_only = self.request.query_params.get('my_spaces_only') == 'true'

        if my_spaces_only:
            # Only return spaces where user is an active member (for collaboration/dashboard)
            user_spaces = LivingSpace.objects.filter(members=user).distinct()
        else:
            # Show public spaces and spaces where user is a member (for browsing)
            user_spaces = LivingSpace.objects.filter(
                Q(is_public=True) | Q(members=user)
            ).distinct()

        # Filter by budget if provided
        min_budget = self.request.query_params.get('min_budget')
        max_budget = self.request.query_params.get('max_budget')

        if min_budget:
            user_spaces = user_spaces.filter(total_rent__gte=min_budget)
        if max_budget:
            user_spaces = user_spaces.filter(total_rent__lte=max_budget)

        return user_spaces.prefetch_related('images', 'rooms', 'house_rules', 'memberships')

    def get_serializer_class(self):
        if self.action == 'create':
            return LivingSpaceCreateSerializer
        return LivingSpaceSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Delete a living space - only creator or admin can delete"""
        living_space = self.get_object()

        # Check if user is the creator or an admin member
        is_creator = living_space.created_by == request.user
        is_admin = LivingSpaceMember.objects.filter(
            living_space=living_space,
            user=request.user,
            role='admin',
            is_active=True
        ).exists()

        if not (is_creator or is_admin):
            return Response(
                {'error': 'Only the creator or admin members can delete this living space'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Delete the living space (will cascade delete members, tasks, etc.)
        living_space.delete()

        return Response(
            {'message': 'Living space deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Apply to join a living space"""
        living_space = self.get_object()

        # Check if user is already a member
        existing_membership = LivingSpaceMember.objects.filter(
            living_space=living_space,
            user=request.user,
            is_active=True
        ).first()

        if existing_membership:
            return Response(
                {'error': 'You are already a member of this living space'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create membership request
        LivingSpaceMember.objects.create(
            living_space=living_space,
            user=request.user,
            role='member'
        )

        return Response({'message': 'Successfully applied to join living space'})

    @action(detail=True, methods=['get'])
    def available_rooms(self, request, pk=None):
        """Get available rooms in this living space"""
        living_space = self.get_object()
        available_rooms = living_space.get_available_rooms()
        serializer = RoomSerializer(available_rooms, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def request_match(self, request, pk=None):
        """Request a match with the host of this living space"""
        living_space = self.get_object()
        host = living_space.created_by

        # Check if user is trying to match with themselves
        if request.user == host:
            return Response(
                {'error': 'You cannot request a match with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already has an interaction with this host
        existing_interaction = MatchInteraction.objects.filter(
            user=request.user,
            target_user=host
        ).first()

        if existing_interaction:
            return Response(
                {'error': 'You have already interacted with this host'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create match interaction
        MatchInteraction.objects.create(
            user=request.user,
            target_user=host,
            interaction_type='like'
        )

        # Check if it's mutual (host has also liked this user)
        mutual_interaction = MatchInteraction.objects.filter(
            user=host,
            target_user=request.user,
            interaction_type='like'
        ).exists()

        if mutual_interaction:
            from matching.views import calculate_compatibility
            from matching.models import Match

            # Create match
            compatibility = calculate_compatibility(request.user, host)
            match, created = Match.objects.get_or_create(
                user1=min(request.user, host, key=lambda x: x.id),
                user2=max(request.user, host, key=lambda x: x.id),
                defaults={
                    'compatibility_score': compatibility,
                    'status': 'mutual'
                }
            )

            return Response({
                'message': 'Match created with host!',
                'match_id': match.id,
                'compatibility_score': compatibility
            })

        return Response({'message': 'Match request sent to host successfully'})

class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for managing rooms"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['room_type', 'is_available', 'has_private_bathroom', 'furnished']
    ordering_fields = ['monthly_rent', 'available_from', 'created_at']
    ordering = ['monthly_rent']

    def get_queryset(self):
        """Filter rooms based on availability and user permissions"""
        # Show available rooms in public spaces or rooms in user's spaces
        user = self.request.user
        return Room.objects.filter(
            Q(living_space__is_public=True, is_available=True) |
            Q(living_space__members=user)
        ).distinct().select_related('living_space', 'current_occupant')

    def get_serializer_class(self):
        if self.action == 'create':
            return RoomCreateSerializer
        return RoomSerializer

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Apply for a room"""
        room = self.get_object()

        # Check if room is available
        if not room.is_available:
            return Response(
                {'error': 'This room is not available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already applied
        existing_application = RoomApplication.objects.filter(
            room=room,
            applicant=request.user
        ).first()

        if existing_application:
            return Response(
                {'error': 'You have already applied for this room'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create application
        serializer = RoomApplicationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            application = serializer.save(room=room)
            return Response(RoomApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def book(self, request, pk=None):
        """Book a room - alias for apply with additional booking data"""
        room = self.get_object()

        # Check if room is available
        if not room.is_available:
            return Response(
                {'error': 'This room is not available'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already applied
        existing_application = RoomApplication.objects.filter(
            room=room,
            applicant=request.user
        ).first()

        if existing_application:
            return Response(
                {'error': 'You have already applied for this room'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create booking application with additional fields
        booking_data = request.data.copy()
        booking_data['applicant'] = request.user.id

        serializer = RoomApplicationSerializer(data=booking_data, context={'request': request})
        if serializer.is_valid():
            application = serializer.save(room=room, applicant=request.user)
            return Response(RoomApplicationSerializer(application).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoomApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing room applications"""
    permission_classes = [IsAuthenticated]
    serializer_class = RoomApplicationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'room__living_space']
    ordering = ['-created_at']

    def get_queryset(self):
        """Show applications for user's rooms or user's own applications"""
        user = self.request.user

        # Applications for rooms in spaces where user is admin
        admin_spaces = LivingSpace.objects.filter(
            memberships__user=user,
            memberships__role='admin',
            memberships__is_active=True
        )

        return RoomApplication.objects.filter(
            Q(applicant=user) |  # User's own applications
            Q(room__living_space__in=admin_spaces)  # Applications for user's spaces
        ).select_related('applicant', 'room', 'room__living_space')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a room application"""
        application = self.get_object()

        # Check if user has permission to approve
        is_admin = LivingSpaceMember.objects.filter(
            living_space=application.room.living_space,
            user=request.user,
            role='admin',
            is_active=True
        ).exists()

        if not is_admin:
            return Response(
                {'error': 'You do not have permission to approve this application'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Approve application
        application.status = 'approved'
        application.reviewed_by = request.user
        application.save()

        # Update room
        room = application.room
        room.current_occupant = application.applicant
        room.is_available = False
        room.save()

        # Add applicant as member
        LivingSpaceMember.objects.get_or_create(
            living_space=room.living_space,
            user=application.applicant,
            defaults={'role': 'member'}
        )

        return Response({'message': 'Application approved successfully'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a room application"""
        application = self.get_object()

        # Check if user has permission to reject
        is_admin = LivingSpaceMember.objects.filter(
            living_space=application.room.living_space,
            user=request.user,
            role='admin',
            is_active=True
        ).exists()

        if not is_admin:
            return Response(
                {'error': 'You do not have permission to reject this application'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Reject application
        application.status = 'rejected'
        application.reviewed_by = request.user
        application.review_message = request.data.get('review_message', '')
        application.save()

        return Response({'message': 'Application rejected'})

class LivingSpaceReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for managing living space reviews"""
    permission_classes = [IsAuthenticated]
    serializer_class = LivingSpaceReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['living_space', 'overall_rating', 'verified_stay']
    ordering = ['-created_at']

    def get_queryset(self):
        return LivingSpaceReview.objects.all().select_related('living_space', 'reviewer')

class LivingSpaceImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing living space images"""
    permission_classes = [IsAuthenticated]
    serializer_class = LivingSpaceImageSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['living_space', 'room', 'image_type', 'is_primary']

    def get_queryset(self):
        return LivingSpaceImage.objects.all().select_related('living_space', 'room', 'uploaded_by')

    def perform_create(self, serializer):
        # Get living_space from request data
        living_space_id = self.request.data.get('living_space')
        if living_space_id:
            try:
                living_space = LivingSpace.objects.get(id=living_space_id)
                serializer.save(uploaded_by=self.request.user, living_space=living_space)
            except LivingSpace.DoesNotExist:
                raise ValidationError({'living_space': 'Living space not found'})
        else:
            serializer.save(uploaded_by=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard(request):
    """Get co-living dashboard data"""
    user = request.user

    # Get user's living spaces
    user_spaces = LivingSpace.objects.filter(members=user)

    # Get recent tasks
    recent_tasks = Task.objects.filter(
        living_space__in=user_spaces,
        assigned_to=user
    ).order_by('-created_at')[:5]

    # Get recent expenses
    recent_expenses = Expense.objects.filter(
        living_space__in=user_spaces
    ).order_by('-created_at')[:5]

    # Get pending room applications (if user is admin)
    admin_spaces = user_spaces.filter(
        memberships__user=user,
        memberships__role='admin',
        memberships__is_active=True
    )

    pending_applications = RoomApplication.objects.filter(
        room__living_space__in=admin_spaces,
        status='pending'
    ).count()

    return Response({
        'user_spaces': LivingSpaceSerializer(user_spaces, many=True).data,
        'recent_tasks': TaskSerializer(recent_tasks, many=True).data,
        'recent_expenses': ExpenseSerializer(recent_expenses, many=True).data,
        'pending_applications': pending_applications,
        'stats': {
            'total_spaces': user_spaces.count(),
            'available_rooms': Room.objects.filter(
                living_space__in=user_spaces,
                is_available=True
            ).count(),
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_spaces(request):
    """Search living spaces with filters"""
    queryset = LivingSpace.objects.filter(is_public=True, is_active=True)

    # Location filters
    city = request.GET.get('city')
    if city:
        queryset = queryset.filter(city__icontains=city)

    # Budget filters
    min_budget = request.GET.get('min_budget')
    max_budget = request.GET.get('max_budget')
    if min_budget:
        queryset = queryset.filter(total_rent__gte=min_budget)
    if max_budget:
        queryset = queryset.filter(total_rent__lte=max_budget)

    # Feature filters
    furnished = request.GET.get('furnished')
    if furnished == 'true':
        queryset = queryset.filter(furnished=True)

    utilities_included = request.GET.get('utilities_included')
    if utilities_included == 'true':
        queryset = queryset.filter(utilities_included=True)

    # Room filters
    available_rooms_only = request.GET.get('available_rooms_only')
    if available_rooms_only == 'true':
        queryset = queryset.filter(rooms__is_available=True).distinct()

    # Compatibility score filter (requires personality profile)
    min_compatibility = request.GET.get('min_compatibility')
    if min_compatibility and hasattr(request.user, 'personality_profile'):
        # This would need additional logic to calculate compatibility
        pass

    # Pagination
    page_size = int(request.GET.get('page_size', 10))
    page = int(request.GET.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size

    total_count = queryset.count()
    results = queryset[start:end]

    serializer = LivingSpaceSerializer(results, many=True, context={'request': request})

    return Response({
        'results': serializer.data,
        'total_count': total_count,
        'page': page,
        'page_size': page_size,
        'has_next': end < total_count,
        'has_previous': page > 1
    })

# Existing views for backward compatibility
class TaskListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        user_spaces = LivingSpace.objects.filter(members=self.request.user)
        return Task.objects.filter(living_space__in=user_spaces)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        user_spaces = LivingSpace.objects.filter(members=self.request.user)
        return Task.objects.filter(living_space__in=user_spaces)

class ExpenseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        user_spaces = LivingSpace.objects.filter(members=self.request.user)
        return Expense.objects.filter(living_space__in=user_spaces)

    def perform_create(self, serializer):
        # If paid_by_id is not provided, default to current user
        paid_by_id = serializer.validated_data.pop('paid_by_id', None)
        if paid_by_id:
            serializer.save(paid_by_id=paid_by_id)
        else:
            serializer.save(paid_by=self.request.user)

class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        user_spaces = LivingSpace.objects.filter(members=self.request.user)
        return Expense.objects.filter(living_space__in=user_spaces)

class BillDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BillSerializer
    lookup_url_kwarg = 'bill_id'

    def get_queryset(self):
        user_spaces = LivingSpace.objects.filter(members=self.request.user)
        return Bill.objects.filter(living_space__in=user_spaces)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def settle_expense_split(request, expense_id, user_id):
    """Mark an expense split as settled/paid"""
    try:
        from coliving.models import ExpenseSplit

        # Get the expense and verify user has access
        expense = Expense.objects.get(id=expense_id)
        user_spaces = LivingSpace.objects.filter(members=request.user)

        if expense.living_space not in user_spaces:
            return Response({'error': 'Access denied'}, status=403)

        # Get the split for this user
        split = ExpenseSplit.objects.get(expense=expense, user_id=user_id)

        # Toggle settlement status
        is_settled = request.data.get('is_settled', True)
        split.is_settled = is_settled

        if is_settled:
            split.amount_paid = split.amount_owed
        else:
            split.amount_paid = 0

        split.save()

        return Response({
            'id': split.id,
            'user_id': split.user_id,
            'is_settled': split.is_settled,
            'amount_paid': str(split.amount_paid)
        })
    except Expense.DoesNotExist:
        return Response({'error': 'Expense not found'}, status=404)
    except ExpenseSplit.DoesNotExist:
        return Response({'error': 'Split not found'}, status=404)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def settle_bill_split(request, bill_id, user_id):
    """Mark a bill split as settled/paid"""
    try:
        from coliving.models import BillSplit

        # Get the bill and verify user has access
        bill = Bill.objects.get(id=bill_id)
        user_spaces = LivingSpace.objects.filter(members=request.user)

        if bill.living_space not in user_spaces:
            return Response({'error': 'Access denied'}, status=403)

        # Get the split for this user
        split = BillSplit.objects.get(bill=bill, user_id=user_id)

        # Toggle settlement status
        is_settled = request.data.get('is_settled', True)
        split.is_settled = is_settled

        if is_settled:
            split.amount_paid = split.amount_owed
        else:
            split.amount_paid = 0

        split.save()

        return Response({
            'id': split.id,
            'user_id': split.user_id,
            'is_settled': split.is_settled,
            'amount_paid': str(split.amount_paid)
        })
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=404)
    except BillSplit.DoesNotExist:
        return Response({'error': 'Split not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shared_dashboard(request, living_space_id):
    """Get comprehensive dashboard data for a shared living space"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id, members=request.user)

        # Get tasks
        tasks = Task.objects.filter(living_space=living_space).order_by('due_date')[:10]
        tasks_data = TaskSerializer(tasks, many=True).data

        # Get expenses
        expenses = Expense.objects.filter(living_space=living_space).order_by('-expense_date')[:10]
        expenses_data = ExpenseSerializer(expenses, many=True).data

        # Get shopping lists
        shopping_lists = ShoppingList.objects.filter(living_space=living_space)
        shopping_data = ShoppingListSerializer(shopping_lists, many=True).data

        # Get bills
        bills = Bill.objects.filter(living_space=living_space, status__in=['pending', 'overdue']).order_by('due_date')
        bills_data = BillSerializer(bills, many=True).data

        # Get calendar events
        from datetime import datetime, timedelta
        now = timezone.now()
        upcoming_events = CalendarEvent.objects.filter(
            living_space=living_space,
            start_datetime__gte=now
        ).order_by('start_datetime')[:10]
        events_data = CalendarEventSerializer(upcoming_events, many=True).data

        # Get notifications
        notifications = Notification.objects.filter(
            user=request.user,
            living_space=living_space,
            is_read=False
        ).order_by('-created_at')[:5]
        notifications_data = NotificationSerializer(notifications, many=True).data

        # Get house rules
        try:
            house_rules = living_space.house_rules
            house_rules_data = {
                'id': house_rules.id,
                'quiet_hours_start': house_rules.quiet_hours_start,
                'quiet_hours_end': house_rules.quiet_hours_end,
                'guests_allowed': house_rules.overnight_guests_allowed,
                'max_guests': house_rules.max_consecutive_guest_nights,
                'smoking_allowed': house_rules.smoking_allowed,
                'pets_allowed': house_rules.pets_allowed,
                'custom_rules': house_rules.custom_rules,
                'created_at': house_rules.created_at,
                'updated_at': house_rules.updated_at,
            }
        except HouseRules.DoesNotExist:
            house_rules_data = None

        return Response({
            'living_space': {
                'id': living_space.id,
                'name': living_space.name,
                'description': living_space.description,
            },
            'tasks': tasks_data,
            'expenses': expenses_data,
            'shopping_lists': shopping_data,
            'bills': bills_data,
            'calendar_events': events_data,
            'notifications': notifications_data,
            'house_rules': house_rules_data,
        })
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

# Shopping List Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_shopping_list(request, living_space_id):
    """Create a new shopping list"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id, members=request.user)
        shopping_list = ShoppingList.objects.create(
            living_space=living_space,
            name=request.data.get('name', 'Shopping List'),
            created_by=request.user
        )
        return Response(ShoppingListSerializer(shopping_list).data, status=status.HTTP_201_CREATED)
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_shopping_item(request, shopping_list_id):
    """Add item to shopping list"""
    try:
        shopping_list = ShoppingList.objects.get(id=shopping_list_id, living_space__members=request.user)
        item = ShoppingListItem.objects.create(
            shopping_list=shopping_list,
            name=request.data.get('name'),
            quantity=request.data.get('quantity', ''),
            category=request.data.get('category', ''),
            added_by=request.user
        )
        return Response(ShoppingListItemSerializer(item).data, status=status.HTTP_201_CREATED)
    except ShoppingList.DoesNotExist:
        return Response({'error': 'Shopping list not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_shopping_item(request, item_id):
    """Mark shopping item as purchased/unpurchased"""
    try:
        item = ShoppingListItem.objects.get(id=item_id, shopping_list__living_space__members=request.user)
        item.is_purchased = not item.is_purchased
        if item.is_purchased:
            item.purchased_by = request.user
            item.purchased_at = timezone.now()
        else:
            item.purchased_by = None
            item.purchased_at = None
        item.save()
        return Response(ShoppingListItemSerializer(item).data)
    except ShoppingListItem.DoesNotExist:
        return Response({'error': 'Shopping item not found'}, status=status.HTTP_404_NOT_FOUND)

# Bill Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_bill(request, living_space_id):
    """Create a new bill"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id, members=request.user)
        bill = Bill.objects.create(
            living_space=living_space,
            title=request.data.get('title'),
            description=request.data.get('description', ''),
            amount=request.data.get('amount'),
            due_date=request.data.get('due_date'),
            recurrence=request.data.get('recurrence', 'none'),
            created_by=request.user
        )
        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_bill_paid(request, bill_id):
    """Mark a bill as paid"""
    try:
        bill = Bill.objects.get(id=bill_id, living_space__members=request.user)
        bill.status = 'paid'
        bill.paid_by = request.user
        bill.paid_at = timezone.now()
        bill.save()
        return Response(BillSerializer(bill).data)
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)

# Calendar Event Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_calendar_event(request, living_space_id):
    """Create a new calendar event"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id, members=request.user)
        event = CalendarEvent.objects.create(
            living_space=living_space,
            title=request.data.get('title'),
            description=request.data.get('description', ''),
            event_type=request.data.get('event_type', 'other'),
            start_datetime=request.data.get('start_datetime'),
            end_datetime=request.data.get('end_datetime'),
            all_day=request.data.get('all_day', False),
            created_by=request.user
        )
        return Response(CalendarEventSerializer(event).data, status=status.HTTP_201_CREATED)
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found'}, status=status.HTTP_404_NOT_FOUND)

# Notification Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get user notifications"""
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:20]
    return Response(NotificationSerializer(notifications, many=True).data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark notification as read"""
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
# House Rules Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_house_rules(request, living_space_id):
    """Create house rules for a living space"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id, members=request.user)
        
        # Check if house rules already exist
        if hasattr(living_space, 'house_rules'):
            return Response({'error': 'House rules already exist for this space'}, status=status.HTTP_400_BAD_REQUEST)
        
        house_rules = HouseRules.objects.create(
            living_space=living_space,
            quiet_hours_start=request.data.get('quiet_hours_start'),
            quiet_hours_end=request.data.get('quiet_hours_end'),
            overnight_guests_allowed=request.data.get('guests_allowed', True),
            max_consecutive_guest_nights=request.data.get('max_guests', 3),
            smoking_allowed=request.data.get('smoking_allowed', False),
            pets_allowed=request.data.get('pets_allowed', False),
            custom_rules=request.data.get('custom_rules', '')
        )
        return Response({
            'id': house_rules.id,
            'quiet_hours_start': house_rules.quiet_hours_start,
            'quiet_hours_end': house_rules.quiet_hours_end,
            'guests_allowed': house_rules.overnight_guests_allowed,
            'max_guests': house_rules.max_consecutive_guest_nights,
            'smoking_allowed': house_rules.smoking_allowed,
            'pets_allowed': house_rules.pets_allowed,
            'custom_rules': house_rules.custom_rules,
            'created_at': house_rules.created_at,
            'updated_at': house_rules.updated_at
        }, status=status.HTTP_201_CREATED)
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_house_rules(request, living_space_id, rules_id):
    """Update house rules for a living space"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id, members=request.user)
        house_rules = HouseRules.objects.get(id=rules_id, living_space=living_space)
        
        # Update fields if provided
        if 'quiet_hours_start' in request.data:
            house_rules.quiet_hours_start = request.data['quiet_hours_start']
        if 'quiet_hours_end' in request.data:
            house_rules.quiet_hours_end = request.data['quiet_hours_end']
        if 'guests_allowed' in request.data:
            house_rules.overnight_guests_allowed = request.data['guests_allowed']
        if 'max_guests' in request.data:
            house_rules.max_consecutive_guest_nights = request.data['max_guests']
        if 'smoking_allowed' in request.data:
            house_rules.smoking_allowed = request.data['smoking_allowed']
        if 'pets_allowed' in request.data:
            house_rules.pets_allowed = request.data['pets_allowed']
        if 'custom_rules' in request.data:
            house_rules.custom_rules = request.data['custom_rules']

        house_rules.save()
        return Response({
            'id': house_rules.id,
            'quiet_hours_start': house_rules.quiet_hours_start,
            'quiet_hours_end': house_rules.quiet_hours_end,
            'guests_allowed': house_rules.overnight_guests_allowed,
            'max_guests': house_rules.max_consecutive_guest_nights,
            'smoking_allowed': house_rules.smoking_allowed,
            'pets_allowed': house_rules.pets_allowed,
            'custom_rules': house_rules.custom_rules,
            'created_at': house_rules.created_at,
            'updated_at': house_rules.updated_at
        })
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found'}, status=status.HTTP_404_NOT_FOUND)
    except HouseRules.DoesNotExist:
        return Response({'error': 'House rules not found'}, status=status.HTTP_404_NOT_FOUND)

# Living Space Invitation Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_to_living_space(request, living_space_id):
    """Invite a user to join a living space"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id)
        
        # Check if requester is an admin member
        membership = LivingSpaceMember.objects.filter(
            living_space=living_space,
            user=request.user,
            role='admin',
            is_active=True
        ).first()
        
        if not membership and living_space.created_by != request.user:
            return Response({'error': 'Only admins can invite members'}, status=status.HTTP_403_FORBIDDEN)
        
        invited_user_id = request.data.get('invited_user_id')
        invited_user = User.objects.get(id=invited_user_id)
        
        # Check if user is already a member
        if LivingSpaceMember.objects.filter(living_space=living_space, user=invited_user, is_active=True).exists():
            return Response({'error': 'User is already a member'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if invitation already exists
        if LivingSpaceInvitation.objects.filter(
            living_space=living_space,
            invited_user=invited_user,
            status='pending'
        ).exists():
            return Response({'error': 'Invitation already sent'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create invitation (expires in 7 days)
        from datetime import timedelta
        invitation = LivingSpaceInvitation.objects.create(
            living_space=living_space,
            invited_by=request.user,
            invited_user=invited_user,
            role=request.data.get('role', 'member'),
            message=request.data.get('message', ''),
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Create notification
        Notification.objects.create(
            user=invited_user,
            notification_type='message',
            title='Living Space Invitation',
            message=f'{request.user.username} invited you to join {living_space.name}',
            living_space=living_space
        )
        
        from coliving.serializers import LivingSpaceInvitationSerializer
        return Response(LivingSpaceInvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_invitations(request):
    """Get invitations for current user"""
    invitations = LivingSpaceInvitation.objects.filter(
        invited_user=request.user,
        status='pending'
    ).order_by('-created_at')
    
    from coliving.serializers import LivingSpaceInvitationSerializer
    return Response(LivingSpaceInvitationSerializer(invitations, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_invitation(request, invitation_id):
    """Accept or decline an invitation"""
    try:
        invitation = LivingSpaceInvitation.objects.get(
            id=invitation_id,
            invited_user=request.user,
            status='pending'
        )
        
        if invitation.is_expired():
            invitation.status = 'expired'
            invitation.save()
            return Response({'error': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        response = request.data.get('response')  # 'accept' or 'decline'
        
        if response == 'accept':
            # Create membership
            LivingSpaceMember.objects.create(
                living_space=invitation.living_space,
                user=request.user,
                role=invitation.role
            )
            invitation.status = 'accepted'
            
            # Notify inviter
            Notification.objects.create(
                user=invitation.invited_by,
                notification_type='message',
                title='Invitation Accepted',
                message=f'{request.user.username} accepted your invitation to join {invitation.living_space.name}',
                living_space=invitation.living_space
            )
        elif response == 'decline':
            invitation.status = 'declined'
        else:
            return Response({'error': 'Invalid response'}, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.responded_at = timezone.now()
        invitation.save()
        
        from coliving.serializers import LivingSpaceInvitationSerializer
        return Response(LivingSpaceInvitationSerializer(invitation).data)
    except LivingSpaceInvitation.DoesNotExist:
        return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_living_space_members(request, living_space_id):
    """Get all members of a living space"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id)
        
        # Check if user is a member
        if not living_space.members.filter(id=request.user.id).exists():
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        members = LivingSpaceMember.objects.filter(
            living_space=living_space,
            is_active=True
        ).select_related('user')
        
        from coliving.serializers import LivingSpaceMemberSerializer
        return Response(LivingSpaceMemberSerializer(members, many=True).data)
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_member(request, living_space_id, member_id):
    """Remove a member from living space"""
    try:
        living_space = LivingSpace.objects.get(id=living_space_id)
        
        # Check if requester is admin or space creator
        requester_membership = LivingSpaceMember.objects.filter(
            living_space=living_space,
            user=request.user,
            role='admin',
            is_active=True
        ).first()
        
        if not requester_membership and living_space.created_by != request.user:
            return Response({'error': 'Only admins can remove members'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get member to remove
        member = LivingSpaceMember.objects.get(
            id=member_id,
            living_space=living_space
        )
        
        # Can't remove creator
        if member.user == living_space.created_by:
            return Response({'error': 'Cannot remove space creator'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark as inactive
        member.is_active = False
        member.left_at = timezone.now()
        member.save()
        
        # Notify removed user
        Notification.objects.create(
            user=member.user,
            notification_type='message',
            title='Removed from Living Space',
            message=f'You have been removed from {living_space.name}',
            living_space=living_space
        )
        
        return Response({'message': 'Member removed successfully'})
    except LivingSpace.DoesNotExist:
        return Response({'error': 'Living space not found'}, status=status.HTTP_404_NOT_FOUND)
    except LivingSpaceMember.DoesNotExist:
        return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
