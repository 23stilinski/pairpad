from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import OnboardingProgress

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    # Make lifestyle fields optional since they're set in personality assessment
    smoking_preference = serializers.CharField(required=False, allow_blank=True)
    pets_preference = serializers.CharField(required=False, allow_blank=True)
    guests_preference = serializers.CharField(required=False, allow_blank=True)
    cleanliness_level = serializers.IntegerField(required=False, allow_null=True)
    social_level = serializers.IntegerField(required=False, allow_null=True)
    quiet_hours = serializers.BooleanField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            # Basic account info
            'email', 'username', 'password', 'password_confirm', 'role',
            # Personal information
            'first_name', 'last_name', 'date_of_birth', 'gender', 'phone_number',
            # Professional information
            'occupation', 'education',
            # Location & housing preferences
            'current_city', 'preferred_city', 'budget_min', 'budget_max',
            'move_in_date', 'lease_duration',
            # Lifestyle preferences
            'smoking_preference', 'pets_preference', 'guests_preference',
            'cleanliness_level', 'social_level', 'quiet_hours',
            # Profile information
            'bio', 'interests'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")

        # Validate budget range
        budget_min = attrs.get('budget_min')
        budget_max = attrs.get('budget_max')
        if budget_min and budget_max and budget_min >= budget_max:
            raise serializers.ValidationError("Maximum budget must be greater than minimum budget")

        # Validate age (must be 18+)
        date_of_birth = attrs.get('date_of_birth')
        if date_of_birth:
            from datetime import date
            today = date.today()
            age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
            if age < 18:
                raise serializers.ValidationError("You must be at least 18 years old to register")

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    personalityProfile = serializers.SerializerMethodField()
    verificationStatus = serializers.CharField(source='verification_status', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    fullName = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            # Basic info
            'id', 'email', 'username', 'role', 'verificationStatus',
            'createdAt', 'updatedAt', 'personalityProfile',
            # Personal information
            'first_name', 'last_name', 'fullName', 'date_of_birth', 'age',
            'gender', 'phone_number',
            # Professional information
            'occupation', 'education',
            # Location & housing preferences
            'current_city', 'preferred_city', 'budget_min', 'budget_max',
            'move_in_date', 'lease_duration',
            # Lifestyle preferences
            'smoking_preference', 'pets_preference', 'guests_preference',
            'cleanliness_level', 'social_level', 'quiet_hours',
            # Profile information
            'bio', 'interests'
        )
        read_only_fields = ('id', 'createdAt', 'updatedAt', 'fullName', 'age')

    def get_personalityProfile(self, obj):
        if hasattr(obj, 'personality_profile'):
            from personality.serializers import PersonalityProfileSerializer
            return PersonalityProfileSerializer(obj.personality_profile).data
        return None

    def get_fullName(self, obj):
        return obj.get_full_name()

    def get_age(self, obj):
        return obj.get_age()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['role'] = user.role
        token['email'] = user.email

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add user data to response
        data['user'] = UserSerializer(self.user).data

        return data


class OnboardingProgressSerializer(serializers.ModelSerializer):
    """Serializer for onboarding progress tracking"""

    user = UserSerializer(read_only=True)
    statusDisplay = serializers.CharField(source='get_status_display', read_only=True)
    nextStep = serializers.SerializerMethodField()
    isComplete = serializers.BooleanField(source='is_complete', read_only=True)
    breakdown = serializers.SerializerMethodField()
    profileCompletenessScore = serializers.SerializerMethodField()

    # Camel case field names for frontend
    overallProgress = serializers.IntegerField(source='progress_percentage', read_only=True)
    registrationProgress = serializers.SerializerMethodField()
    assessmentProgress = serializers.SerializerMethodField()
    completedStepsCount = serializers.SerializerMethodField()
    totalSteps = serializers.SerializerMethodField()
    currentStep = serializers.SerializerMethodField()

    # Timestamps
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    completedAt = serializers.DateTimeField(source='completed_at', read_only=True)

    # Individual step completion status for backward compatibility
    accountCreated = serializers.SerializerMethodField()
    personalInfoCompleted = serializers.SerializerMethodField()
    locationPreferencesCompleted = serializers.SerializerMethodField()
    lifestylePreferencesCompleted = serializers.SerializerMethodField()
    assessmentStarted = serializers.SerializerMethodField()
    assessmentCompleted = serializers.SerializerMethodField()

    class Meta:
        model = OnboardingProgress
        fields = [
            'id', 'user', 'status', 'statusDisplay',
            'overallProgress', 'registrationProgress', 'assessmentProgress',
            'completedStepsCount', 'totalSteps', 'currentStep',
            'profileCompletenessScore', 'nextStep', 'isComplete', 'breakdown',
            'accountCreated', 'personalInfoCompleted', 'locationPreferencesCompleted',
            'lifestylePreferencesCompleted', 'assessmentStarted', 'assessmentCompleted',
            'createdAt', 'updatedAt', 'completedAt'
        ]
        read_only_fields = ['id', 'user', 'status']

    def get_nextStep(self, obj):
        """Get the next step in onboarding"""
        return obj.get_next_step_info()

    def get_breakdown(self, obj):
        """Get progress breakdown"""
        return obj.get_progress_breakdown()

    def get_registrationProgress(self, obj):
        """Get registration progress percentage"""
        return obj.get_progress_breakdown()['registration']

    def get_assessmentProgress(self, obj):
        """Get assessment progress percentage"""
        return obj.get_progress_breakdown()['assessment']

    def get_completedStepsCount(self, obj):
        """Get number of completed steps"""
        return obj.get_progress_breakdown()['completed_steps']

    def get_totalSteps(self, obj):
        """Get total number of steps"""
        return obj.get_progress_breakdown()['total_steps']

    def get_currentStep(self, obj):
        """Get current step identifier"""
        return obj.get_current_step()

    def get_profileCompletenessScore(self, obj):
        """Get profile completeness score"""
        return obj.get_profile_completeness()

    # Individual step getters for backward compatibility
    def get_accountCreated(self, obj):
        return obj.is_step_complete(OnboardingProgress.STEP_ACCOUNT)

    def get_personalInfoCompleted(self, obj):
        return obj.is_step_complete(OnboardingProgress.STEP_PERSONAL)

    def get_locationPreferencesCompleted(self, obj):
        return obj.is_step_complete(OnboardingProgress.STEP_LOCATION)

    def get_lifestylePreferencesCompleted(self, obj):
        return obj.is_step_complete(OnboardingProgress.STEP_LIFESTYLE)

    def get_assessmentStarted(self, obj):
        return obj.is_step_complete(OnboardingProgress.STEP_ASSESSMENT_START)

    def get_assessmentCompleted(self, obj):
        return obj.is_step_complete(OnboardingProgress.STEP_ASSESSMENT_DONE)


class OnboardingProgressUpdateSerializer(serializers.Serializer):
    """Serializer for updating onboarding progress steps"""

    step = serializers.ChoiceField(choices=[
        ('account_created', 'Account Created'),
        ('personal_info', 'Personal Info'),
        ('location_preferences', 'Location Preferences'),
        ('lifestyle_preferences', 'Lifestyle Preferences'),
        ('assessment_started', 'Assessment Started'),
        ('assessment_completed', 'Assessment Completed'),
    ])

    def update_progress(self, onboarding_progress):
        """Update the onboarding progress based on the step"""
        step = self.validated_data['step']
        onboarding_progress.mark_step_complete(step)
        return onboarding_progress