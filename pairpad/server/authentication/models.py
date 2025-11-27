from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('professional', 'Young Professional'),
        ('admin', 'Administrator'),
        ('coordinator', 'Housing Coordinator'),
    ]

    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('non_binary', 'Non-binary'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    SMOKING_CHOICES = [
        ('no_preference', 'No Preference'),
        ('smoker', 'I smoke'),
        ('non_smoker', 'Non-smoker only'),
    ]

    PETS_CHOICES = [
        ('no_preference', 'No Preference'),
        ('has_pets', 'I have pets'),
        ('no_pets', 'No pets'),
        ('loves_pets', 'Love pets but don\'t have any'),
    ]

    GUESTS_CHOICES = [
        ('rarely', 'Rarely have guests'),
        ('occasionally', 'Occasionally have guests'),
        ('frequently', 'Frequently have guests'),
        ('no_guests', 'No overnight guests'),
    ]

    LEASE_DURATION_CHOICES = [
        ('3_months', '3 months'),
        ('6_months', '6 months'),
        ('12_months', '12 months'),
        ('18_months', '18 months'),
        ('24_months', '24+ months'),
        ('flexible', 'Flexible'),
    ]

    # Basic Fields
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending'
    )

    # Personal Information
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)

    # Professional Information
    occupation = models.CharField(max_length=100, blank=True)
    education = models.CharField(max_length=100, blank=True)

    # Location & Housing Preferences
    current_city = models.CharField(max_length=100, blank=True)
    preferred_city = models.CharField(max_length=100, blank=True)
    budget_min = models.IntegerField(null=True, blank=True, help_text="Minimum monthly budget in dollars")
    budget_max = models.IntegerField(null=True, blank=True, help_text="Maximum monthly budget in dollars")
    move_in_date = models.DateField(null=True, blank=True)
    lease_duration = models.CharField(max_length=20, choices=LEASE_DURATION_CHOICES, blank=True)

    # Lifestyle Preferences
    smoking_preference = models.CharField(max_length=20, choices=SMOKING_CHOICES, default='no_preference')
    pets_preference = models.CharField(max_length=20, choices=PETS_CHOICES, default='no_preference')
    guests_preference = models.CharField(max_length=20, choices=GUESTS_CHOICES, default='occasionally')
    cleanliness_level = models.IntegerField(default=50, help_text="Cleanliness preference from 0-100")
    social_level = models.IntegerField(default=50, help_text="Social preference from 0-100")
    quiet_hours = models.BooleanField(default=False)

    # Profile Information
    bio = models.TextField(blank=True, help_text="Personal bio for roommate matching")
    interests = models.TextField(blank=True, help_text="Interests and hobbies")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.username} ({self.email})"

    def get_full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()

    def get_age(self):
        """Calculate and return the user's age."""
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None

    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class OnboardingProgress(models.Model):
    """Track user onboarding progress through registration and assessment"""

    STEP_ACCOUNT = 'account_created'
    STEP_PERSONAL = 'personal_info'
    STEP_LOCATION = 'location_preferences'
    STEP_LIFESTYLE = 'lifestyle_preferences'
    STEP_ASSESSMENT_START = 'assessment_started'
    STEP_ASSESSMENT_DONE = 'assessment_completed'

    ONBOARDING_STEPS = [
        STEP_ACCOUNT,
        STEP_PERSONAL,
        STEP_LOCATION,
        STEP_LIFESTYLE,
        STEP_ASSESSMENT_START,
        STEP_ASSESSMENT_DONE,
    ]

    STATUS_NOT_STARTED = 'not_started'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'

    STATUS_CHOICES = [
        (STATUS_NOT_STARTED, 'Not Started'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    # Core fields
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='onboarding_progress')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NOT_STARTED)

    # Store completion status in JSON for flexibility
    completed_steps = models.JSONField(default=dict, help_text="Dictionary of completed steps")

    # Progress metrics (calculated dynamically)
    progress_percentage = models.IntegerField(default=0, help_text="Overall progress 0-100")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Onboarding Progress'
        verbose_name_plural = 'Onboarding Progress Records'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_status_display()} ({self.progress_percentage}%)"

    def _ensure_steps_dict(self):
        """Ensure completed_steps is properly initialized"""
        if not isinstance(self.completed_steps, dict):
            self.completed_steps = {}
        for step in self.ONBOARDING_STEPS:
            if step not in self.completed_steps:
                self.completed_steps[step] = False

    def mark_step_complete(self, step):
        """Mark a specific step as complete"""
        if step not in self.ONBOARDING_STEPS:
            raise ValueError(f"Invalid step: {step}")

        self._ensure_steps_dict()
        self.completed_steps[step] = True
        self._recalculate()
        self.save()

    def is_step_complete(self, step):
        """Check if a specific step is complete"""
        self._ensure_steps_dict()
        return self.completed_steps.get(step, False)

    def _recalculate(self):
        """Recalculate progress and status"""
        self._ensure_steps_dict()

        # Count completed steps
        completed_count = sum(1 for completed in self.completed_steps.values() if completed)
        total_steps = len(self.ONBOARDING_STEPS)

        # Calculate percentage
        self.progress_percentage = int((completed_count / total_steps) * 100)

        # Update status
        if self.progress_percentage == 100:
            self.status = self.STATUS_COMPLETED
            if not self.completed_at:
                self.completed_at = timezone.now()
        elif self.progress_percentage > 0:
            self.status = self.STATUS_IN_PROGRESS
        else:
            self.status = self.STATUS_NOT_STARTED

    def get_current_step(self):
        """Get the current/next incomplete step"""
        self._ensure_steps_dict()
        for step in self.ONBOARDING_STEPS:
            if not self.completed_steps.get(step, False):
                return step
        return None

    def get_next_step_info(self):
        """Get information about the next step"""
        step_info = {
            self.STEP_ACCOUNT: {'title': 'Create Account', 'url': '/register'},
            self.STEP_PERSONAL: {'title': 'Personal Information', 'url': '/register'},
            self.STEP_LOCATION: {'title': 'Location & Budget', 'url': '/register'},
            self.STEP_LIFESTYLE: {'title': 'Lifestyle Preferences', 'url': '/register'},
            self.STEP_ASSESSMENT_START: {'title': 'Start Assessment', 'url': '/personality/assessment'},
            self.STEP_ASSESSMENT_DONE: {'title': 'Complete Assessment', 'url': '/personality/assessment'},
        }

        current_step = self.get_current_step()
        if current_step:
            info = step_info[current_step]
            info['step'] = current_step
            return info
        return {'step': 'completed', 'title': 'Onboarding Complete', 'url': '/dashboard'}

    def get_progress_breakdown(self):
        """Get detailed progress breakdown"""
        self._ensure_steps_dict()

        # Registration steps (first 4)
        registration_steps = self.ONBOARDING_STEPS[:4]
        registration_completed = sum(1 for s in registration_steps if self.completed_steps.get(s, False))
        registration_progress = int((registration_completed / len(registration_steps)) * 100)

        # Assessment steps (last 2)
        assessment_steps = self.ONBOARDING_STEPS[4:]
        assessment_completed = sum(1 for s in assessment_steps if self.completed_steps.get(s, False))
        assessment_progress = int((assessment_completed / len(assessment_steps)) * 100)

        return {
            'registration': registration_progress,
            'assessment': assessment_progress,
            'total_steps': len(self.ONBOARDING_STEPS),
            'completed_steps': sum(1 for completed in self.completed_steps.values() if completed),
        }

    def get_profile_completeness(self):
        """Calculate profile completeness score"""
        user = self.user
        fields = [
            user.first_name, user.last_name, user.date_of_birth, user.gender,
            user.phone_number, user.occupation, user.education, user.current_city,
            user.preferred_city, user.budget_min, user.budget_max, user.move_in_date,
            user.lease_duration, user.bio, user.interests
        ]
        filled = sum(1 for field in fields if field)
        return int((filled / len(fields)) * 100)

    @property
    def is_complete(self):
        """Check if onboarding is complete"""
        return self.status == self.STATUS_COMPLETED
