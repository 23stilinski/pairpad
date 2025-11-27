from rest_framework import serializers
from .models import (
    LivingSpace, LivingSpaceMember, Room, LivingSpaceImage,
    RoomApplication, LivingSpaceReview, HouseRules, Task, Expense,
    ShoppingList, ShoppingListItem, Bill, BillSplit, Notification, CalendarEvent,
    LivingSpaceInvitation
)
from authentication.serializers import UserSerializer

class HouseRulesSerializer(serializers.ModelSerializer):
    # Format quiet hours as a readable string
    quiet_hours = serializers.SerializerMethodField()
    guests_allowed = serializers.BooleanField(source='overnight_guests_allowed')
    additional_rules = serializers.CharField(source='custom_rules')

    class Meta:
        model = HouseRules
        fields = [
            'smoking_allowed', 'pets_allowed', 'guests_allowed', 'quiet_hours',
            'additional_rules', 'cleaning_schedule', 'shared_chores_rotation',
            'guest_notification_required', 'max_consecutive_guest_nights'
        ]

    def get_quiet_hours(self, obj):
        """Format quiet hours as readable string"""
        if obj.quiet_hours_start and obj.quiet_hours_end:
            return f"{obj.quiet_hours_start.strftime('%I:%M %p')} - {obj.quiet_hours_end.strftime('%I:%M %p')}"
        return None

class LivingSpaceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LivingSpaceImage
        fields = [
            'id', 'image', 'image_type', 'caption', 'is_primary', 'order'
        ]

class RoomSerializer(serializers.ModelSerializer):
    images = LivingSpaceImageSerializer(many=True, read_only=True)
    compatibility_score = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'name', 'room_type', 'description', 'size_sqft',
            'has_private_bathroom', 'has_balcony', 'has_closet',
            'furnished', 'air_conditioning', 'is_available',
            'monthly_rent', 'security_deposit', 'available_from',
            'current_occupant', 'images', 'compatibility_score'
        ]

    def get_compatibility_score(self, obj):
        """Calculate compatibility score for the requesting user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.calculate_compatibility_score(request.user)
        return None

class LivingSpaceMemberSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = LivingSpaceMember
        fields = [
            'id', 'user', 'user_id', 'role', 'joined_at', 'is_active'
        ]

class LivingSpaceSerializer(serializers.ModelSerializer):
    images = LivingSpaceImageSerializer(many=True, read_only=True)
    rooms = RoomSerializer(many=True, read_only=True)
    house_rules = HouseRulesSerializer(read_only=True)
    members = LivingSpaceMemberSerializer(source='memberships', many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    available_rooms_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = LivingSpace
        fields = [
            'id', 'name', 'space_type', 'description', 'address',
            'city', 'state', 'zip_code', 'country', 'latitude', 'longitude',
            'total_bedrooms', 'total_bathrooms', 'total_rent', 'utilities_included',
            'furnished', 'parking_available', 'available_from', 'lease_duration_months',
            'created_by', 'created_at', 'is_active', 'is_public',
            'images', 'rooms', 'house_rules', 'members', 'average_rating',
            'available_rooms_count', 'member_count', 'role'
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_average_rating(self, obj):
        """Calculate average rating from reviews"""
        reviews = obj.reviews.all()
        if reviews:
            return sum(review.overall_rating for review in reviews) / len(reviews)
        return None

    def get_available_rooms_count(self, obj):
        """Get count of available rooms"""
        return obj.get_available_rooms().count()

    def get_member_count(self, obj):
        """Get count of active members"""
        return obj.memberships.filter(is_active=True).count()

    def get_role(self, obj):
        """Get the requesting user's role in this living space"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user, is_active=True).first()
            if membership:
                return membership.role
        return None

class LivingSpaceCreateSerializer(serializers.ModelSerializer):
    house_rules = HouseRulesSerializer(required=False)

    class Meta:
        model = LivingSpace
        fields = [
            'name', 'space_type', 'description', 'address',
            'city', 'state', 'zip_code', 'country', 'latitude', 'longitude',
            'total_bedrooms', 'total_bathrooms', 'total_rent', 'utilities_included',
            'furnished', 'parking_available', 'available_from', 'lease_duration_months',
            'is_public', 'house_rules'
        ]

    def create(self, validated_data):
        house_rules_data = validated_data.pop('house_rules', None)
        living_space = LivingSpace.objects.create(**validated_data)

        # Create house rules if provided
        if house_rules_data:
            HouseRules.objects.create(living_space=living_space, **house_rules_data)

        # Add the creator as an admin member
        LivingSpaceMember.objects.create(
            living_space=living_space,
            user=self.context['request'].user,
            role='admin'
        )

        return living_space

class RoomCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            'living_space', 'name', 'room_type', 'description', 'size_sqft',
            'has_private_bathroom', 'has_balcony', 'has_closet',
            'furnished', 'air_conditioning', 'is_available',
            'monthly_rent', 'security_deposit', 'available_from'
        ]

    def validate_living_space(self, value):
        """Ensure user has permission to add rooms to this space"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = LivingSpaceMember.objects.filter(
                living_space=value,
                user=request.user,
                role='admin',
                is_active=True
            ).first()
            if not membership:
                raise serializers.ValidationError(
                    "You don't have permission to add rooms to this living space."
                )
        return value

class RoomApplicationSerializer(serializers.ModelSerializer):
    applicant = serializers.StringRelatedField(read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    living_space_name = serializers.CharField(source='room.living_space.name', read_only=True)

    class Meta:
        model = RoomApplication
        fields = [
            'id', 'room', 'applicant', 'message', 'move_in_date',
            'lease_duration_months', 'contact_email', 'contact_phone',
            'employment_status', 'monthly_income', 'references',
            'status', 'review_message', 'created_at', 'room_name', 'living_space_name'
        ]
        read_only_fields = ['applicant', 'status', 'review_message']

    def create(self, validated_data):
        validated_data['applicant'] = self.context['request'].user
        return super().create(validated_data)

class LivingSpaceReviewSerializer(serializers.ModelSerializer):
    reviewer = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = LivingSpaceReview
        fields = [
            'id', 'living_space', 'reviewer', 'overall_rating',
            'cleanliness_rating', 'location_rating', 'value_rating',
            'roommate_compatibility', 'review_text', 'pros', 'cons',
            'verified_stay', 'created_at'
        ]
        read_only_fields = ['reviewer', 'verified_stay']

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, attrs):
        # Prevent users from reviewing the same space multiple times
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            existing_review = LivingSpaceReview.objects.filter(
                living_space=attrs['living_space'],
                reviewer=request.user
            ).first()
            if existing_review:
                raise serializers.ValidationError(
                    "You have already reviewed this living space."
                )
        return attrs

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = serializers.StringRelatedField(required=False, allow_null=True)
    assigned_to_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    created_by = serializers.StringRelatedField()

    class Meta:
        model = Task
        fields = [
            'id', 'living_space', 'title', 'description', 'category',
            'assigned_to', 'assigned_to_id', 'created_by', 'due_date', 'recurrence',
            'status', 'completed_at', 'created_at'
        ]
        read_only_fields = ['created_by', 'completed_at']

class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = serializers.CharField(source='paid_by.username', read_only=True, required=False, allow_null=True)
    paid_by_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of user IDs to split this expense with"
    )
    participant_percentages = serializers.DictField(
        child=serializers.FloatField(),
        write_only=True,
        required=False,
        help_text="Dictionary of user_id: percentage for percentage splits"
    )
    participant_amounts = serializers.DictField(
        child=serializers.FloatField(),
        write_only=True,
        required=False,
        help_text="Dictionary of user_id: custom_amount for custom splits"
    )
    participants = serializers.SerializerMethodField()
    splits = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id', 'living_space', 'title', 'description', 'category',
            'amount', 'paid_by', 'paid_by_id', 'split_type', 'receipt_image',
            'expense_date', 'created_at', 'participant_ids', 'participant_percentages',
            'participant_amounts', 'participants', 'splits'
        ]
        read_only_fields = []

    def get_participants(self, obj):
        """Get list of participants in this expense"""
        return [{'id': user.id, 'username': user.username} for user in obj.participants.all()]

    def get_splits(self, obj):
        """Get expense split details"""
        splits = obj.splits.all()
        return [{
            'user_id': split.user.id,
            'username': split.user.username,
            'amount_owed': str(split.amount_owed),
            'amount_paid': str(split.amount_paid),
            'is_settled': split.is_settled
        } for split in splits]

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        participant_percentages = validated_data.pop('participant_percentages', {})
        participant_amounts = validated_data.pop('participant_amounts', {})
        expense = super().create(validated_data)

        # If participants are specified, create expense splits
        if participant_ids:
            from coliving.models import ExpenseSplit
            from decimal import Decimal

            # Calculate split amount based on split_type
            if expense.split_type == 'equal':
                split_amount = Decimal(expense.amount) / len(participant_ids)
                # Create splits for each participant
                for user_id in participant_ids:
                    ExpenseSplit.objects.create(
                        expense=expense,
                        user_id=user_id,
                        amount_owed=split_amount
                    )
            elif expense.split_type == 'percentage' and participant_percentages:
                # Use custom percentages for each participant
                for user_id in participant_ids:
                    user_id_str = str(user_id)
                    percentage = Decimal(participant_percentages.get(user_id_str, 0))
                    amount_owed = (Decimal(expense.amount) * percentage) / Decimal(100)
                    ExpenseSplit.objects.create(
                        expense=expense,
                        user_id=user_id,
                        amount_owed=amount_owed
                    )
            elif expense.split_type == 'custom' and participant_amounts:
                # Use custom amounts for each participant
                for user_id in participant_ids:
                    user_id_str = str(user_id)
                    amount_owed = Decimal(participant_amounts.get(user_id_str, 0))
                    ExpenseSplit.objects.create(
                        expense=expense,
                        user_id=user_id,
                        amount_owed=amount_owed
                    )
            else:
                # Default to equal split for other types
                split_amount = Decimal(expense.amount) / len(participant_ids)
                for user_id in participant_ids:
                    ExpenseSplit.objects.create(
                        expense=expense,
                        user_id=user_id,
                        amount_owed=split_amount
                    )

        return expense

    def update(self, instance, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        participant_percentages = validated_data.pop('participant_percentages', {})
        participant_amounts = validated_data.pop('participant_amounts', {})

        # Update the expense
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Delete existing splits
        instance.splits.all().delete()

        # Create new splits if participants are specified
        if participant_ids:
            from coliving.models import ExpenseSplit
            from decimal import Decimal

            # Calculate split amount based on split_type
            if instance.split_type == 'equal':
                split_amount = Decimal(instance.amount) / len(participant_ids)
                for user_id in participant_ids:
                    ExpenseSplit.objects.create(
                        expense=instance,
                        user_id=user_id,
                        amount_owed=split_amount
                    )
            elif instance.split_type == 'percentage' and participant_percentages:
                for user_id in participant_ids:
                    user_id_str = str(user_id)
                    percentage = Decimal(participant_percentages.get(user_id_str, 0))
                    amount_owed = (Decimal(instance.amount) * percentage) / Decimal(100)
                    ExpenseSplit.objects.create(
                        expense=instance,
                        user_id=user_id,
                        amount_owed=amount_owed
                    )
            elif instance.split_type == 'custom' and participant_amounts:
                for user_id in participant_ids:
                    user_id_str = str(user_id)
                    amount_owed = Decimal(participant_amounts.get(user_id_str, 0))
                    ExpenseSplit.objects.create(
                        expense=instance,
                        user_id=user_id,
                        amount_owed=amount_owed
                    )
            else:
                # Default to equal split for other types
                split_amount = Decimal(instance.amount) / len(participant_ids)
                for user_id in participant_ids:
                    ExpenseSplit.objects.create(
                        expense=instance,
                        user_id=user_id,
                        amount_owed=split_amount
                    )

        return instance

class ShoppingListItemSerializer(serializers.ModelSerializer):
    added_by = serializers.StringRelatedField()
    purchased_by = serializers.StringRelatedField()

    class Meta:
        model = ShoppingListItem
        fields = [
            'id', 'name', 'quantity', 'category', 'is_purchased',
            'purchased_by', 'purchased_at', 'added_by', 'created_at'
        ]
        read_only_fields = ['added_by', 'purchased_by', 'purchased_at']

class ShoppingListSerializer(serializers.ModelSerializer):
    items = ShoppingListItemSerializer(many=True, read_only=True)
    created_by = serializers.StringRelatedField()

    class Meta:
        model = ShoppingList
        fields = ['id', 'living_space', 'name', 'items', 'created_by', 'created_at']
        read_only_fields = ['created_by']

class BillSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source='created_by.username', read_only=True)
    paid_by = serializers.CharField(source='paid_by.username', read_only=True, required=False, allow_null=True)
    paid_by_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of user IDs to split this bill with"
    )
    participant_percentages = serializers.DictField(
        child=serializers.FloatField(),
        write_only=True,
        required=False,
        help_text="Dictionary of user_id: percentage for percentage splits"
    )
    participant_amounts = serializers.DictField(
        child=serializers.FloatField(),
        write_only=True,
        required=False,
        help_text="Dictionary of user_id: custom_amount for custom splits"
    )
    participants = serializers.SerializerMethodField()
    splits = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            'id', 'living_space', 'title', 'description', 'amount',
            'due_date', 'recurrence', 'status', 'split_type', 'paid_by', 'paid_by_id', 'paid_at',
            'created_by', 'created_at', 'participant_ids', 'participant_percentages',
            'participant_amounts', 'participants', 'splits'
        ]
        read_only_fields = ['created_by', 'paid_at']

    def get_participants(self, obj):
        """Get list of participants in this bill"""
        return [{'id': user.id, 'username': user.username} for user in obj.participants.all()]

    def get_splits(self, obj):
        """Get bill split details"""
        splits = obj.splits.all()
        return [{
            'user_id': split.user.id,
            'username': split.user.username,
            'amount_owed': str(split.amount_owed),
            'amount_paid': str(split.amount_paid),
            'is_settled': split.is_settled
        } for split in splits]

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        participant_percentages = validated_data.pop('participant_percentages', {})
        participant_amounts = validated_data.pop('participant_amounts', {})
        bill = super().create(validated_data)

        # If participants are specified, create bill splits
        if participant_ids:
            from decimal import Decimal

            # Calculate split amount based on split_type
            if bill.split_type == 'equal':
                split_amount = Decimal(bill.amount) / len(participant_ids)
                for user_id in participant_ids:
                    BillSplit.objects.create(
                        bill=bill,
                        user_id=user_id,
                        amount_owed=split_amount
                    )
            elif bill.split_type == 'percentage' and participant_percentages:
                for user_id in participant_ids:
                    user_id_str = str(user_id)
                    percentage = Decimal(participant_percentages.get(user_id_str, 0))
                    amount_owed = (Decimal(bill.amount) * percentage) / Decimal(100)
                    BillSplit.objects.create(
                        bill=bill,
                        user_id=user_id,
                        amount_owed=amount_owed
                    )
            elif bill.split_type == 'custom' and participant_amounts:
                for user_id in participant_ids:
                    user_id_str = str(user_id)
                    amount_owed = Decimal(participant_amounts.get(user_id_str, 0))
                    BillSplit.objects.create(
                        bill=bill,
                        user_id=user_id,
                        amount_owed=amount_owed
                    )
            else:
                # Default to equal split
                split_amount = Decimal(bill.amount) / len(participant_ids)
                for user_id in participant_ids:
                    BillSplit.objects.create(
                        bill=bill,
                        user_id=user_id,
                        amount_owed=split_amount
                    )

        return bill

    def update(self, instance, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        participant_percentages = validated_data.pop('participant_percentages', {})
        participant_amounts = validated_data.pop('participant_amounts', {})

        # Update the bill
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Delete existing splits
        instance.splits.all().delete()

        # Create new splits if participants are specified
        if participant_ids:
            from decimal import Decimal

            # Calculate split amount based on split_type
            if instance.split_type == 'equal':
                split_amount = Decimal(instance.amount) / len(participant_ids)
                for user_id in participant_ids:
                    BillSplit.objects.create(
                        bill=instance,
                        user_id=user_id,
                        amount_owed=split_amount
                    )
            elif instance.split_type == 'percentage' and participant_percentages:
                for user_id in participant_ids:
                    user_id_str = str(user_id)
                    percentage = Decimal(participant_percentages.get(user_id_str, 0))
                    amount_owed = (Decimal(instance.amount) * percentage) / Decimal(100)
                    BillSplit.objects.create(
                        bill=instance,
                        user_id=user_id,
                        amount_owed=amount_owed
                    )
            elif instance.split_type == 'custom' and participant_amounts:
                for user_id in participant_ids:
                    user_id_str = str(user_id)
                    amount_owed = Decimal(participant_amounts.get(user_id_str, 0))
                    BillSplit.objects.create(
                        bill=instance,
                        user_id=user_id,
                        amount_owed=amount_owed
                    )
            else:
                # Default to equal split
                split_amount = Decimal(instance.amount) / len(participant_ids)
                for user_id in participant_ids:
                    BillSplit.objects.create(
                        bill=instance,
                        user_id=user_id,
                        amount_owed=split_amount
                    )

        return instance

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'created_at', 'task', 'expense', 'bill', 'living_space'
        ]
        read_only_fields = ['created_at']

class CalendarEventSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()

    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'living_space', 'title', 'description', 'event_type',
            'start_datetime', 'end_datetime', 'all_day',
            'task', 'bill', 'created_by', 'created_at'
        ]
        read_only_fields = ['created_by']
class LivingSpaceInvitationSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.CharField(source='invited_by.username', read_only=True)
    invited_user_name = serializers.CharField(source='invited_user.username', read_only=True)
    living_space_name = serializers.CharField(source='living_space.name', read_only=True)
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = LivingSpaceInvitation
        fields = [
            'id', 'living_space', 'living_space_name', 'invited_by', 'invited_by_name',
            'invited_user', 'invited_user_name', 'status', 'role', 'message',
            'created_at', 'updated_at', 'expires_at', 'responded_at', 'is_expired'
        ]
        read_only_fields = ['invited_by', 'created_at', 'updated_at', 'responded_at']
    
    def get_is_expired(self, obj):
        return obj.is_expired()

class LivingSpaceMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.fullName', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = LivingSpaceMember
        fields = [
            'id', 'user', 'username', 'full_name', 'email', 'role',
            'joined_at', 'left_at', 'is_active'
        ]
        read_only_fields = ['joined_at', 'left_at']
