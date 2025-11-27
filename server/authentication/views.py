from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    OnboardingProgressSerializer,
    OnboardingProgressUpdateSerializer
)
from .models import OnboardingProgress

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create onboarding progress record
        onboarding_progress = OnboardingProgress.objects.create(user=user)
        onboarding_progress.mark_step_complete(OnboardingProgress.STEP_ACCOUNT)

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        # Add custom claims
        access_token['username'] = user.username
        access_token['role'] = user.role
        access_token['email'] = user.email

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(access_token),
                'refresh': str(refresh)
            },
            'onboarding_progress': OnboardingProgressSerializer(onboarding_progress).data
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class PublicUserProfileView(generics.RetrieveAPIView):
    """
    Public user profile view - allows anyone to view a user's profile
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    lookup_field = 'pk'

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout user by blacklisting the refresh token
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        return Response({
            'message': 'Successfully logged out'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verify_token_view(request):
    """
    Verify if token is valid and return user data
    """
    return Response({
        'user': UserSerializer(request.user).data,
        'message': 'Token is valid'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_onboarding_progress(request):
    """
    Get current user's onboarding progress
    """
    try:
        onboarding_progress = request.user.onboarding_progress
        serializer = OnboardingProgressSerializer(onboarding_progress)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except OnboardingProgress.DoesNotExist:
        # Create onboarding progress if it doesn't exist
        onboarding_progress = OnboardingProgress.objects.create(user=request.user)
        onboarding_progress.mark_step_complete(OnboardingProgress.STEP_ACCOUNT)
        serializer = OnboardingProgressSerializer(onboarding_progress)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_onboarding_progress(request):
    """
    Update onboarding progress step
    """
    try:
        onboarding_progress = request.user.onboarding_progress
    except OnboardingProgress.DoesNotExist:
        onboarding_progress = OnboardingProgress.objects.create(user=request.user)

    serializer = OnboardingProgressUpdateSerializer(data=request.data)
    if serializer.is_valid():
        onboarding_progress = serializer.update_progress(onboarding_progress)
        return Response(
            OnboardingProgressSerializer(onboarding_progress).data,
            status=status.HTTP_200_OK
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
