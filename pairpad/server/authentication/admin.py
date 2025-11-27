from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, OnboardingProgress

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'username', 'email', 'get_full_name', 'role', 'verification_status',
        'current_city', 'age_display', 'is_active', 'date_joined', 'has_personality_profile'
    ]
    list_filter = [
        'role', 'verification_status', 'gender', 'smoking_preference',
        'pets_preference', 'is_active', 'is_staff', 'is_superuser', 'date_joined'
    ]
    search_fields = [
        'username', 'email', 'first_name', 'last_name',
        'current_city', 'preferred_city', 'occupation'
    ]
    ordering = ['-date_joined']

    # Add custom fields to the user form
    fieldsets = BaseUserAdmin.fieldsets + (
        ('PairPad Info', {
            'fields': ('role', 'verification_status')
        }),
        ('Personal Information', {
            'fields': (
                'date_of_birth', 'gender', 'phone_number',
                'occupation', 'education'
            ),
            'classes': ['wide']
        }),
        ('Location & Housing', {
            'fields': (
                'current_city', 'preferred_city',
                'budget_min', 'budget_max',
                'move_in_date', 'lease_duration'
            ),
            'classes': ['wide']
        }),
        ('Lifestyle Preferences', {
            'fields': (
                'smoking_preference', 'pets_preference', 'guests_preference',
                'cleanliness_level', 'social_level', 'quiet_hours'
            ),
            'classes': ['wide']
        }),
        ('Profile', {
            'fields': ('bio', 'interests'),
            'classes': ['wide']
        }),
    )

    # Add custom fields to the add user form
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('PairPad Info', {
            'fields': ('role', 'verification_status')
        }),
        ('Personal Information', {
            'fields': (
                'first_name', 'last_name', 'date_of_birth',
                'gender', 'phone_number'
            ),
            'classes': ['wide']
        }),
    )

    def age_display(self, obj):
        """Display user's age"""
        age = obj.get_age()
        return f"{age} years" if age else "N/A"
    age_display.short_description = 'Age'

    def has_personality_profile(self, obj):
        """Check if user has completed personality profile"""
        return hasattr(obj, 'personality_profile')
    has_personality_profile.boolean = True
    has_personality_profile.short_description = 'Has Profile'

    actions = ['verify_users', 'reject_users']

    def verify_users(self, request, queryset):
        updated = queryset.update(verification_status='verified')
        self.message_user(
            request,
            f'{updated} users were successfully verified.'
        )
    verify_users.short_description = "Mark selected users as verified"

    def reject_users(self, request, queryset):
        updated = queryset.update(verification_status='rejected')
        self.message_user(
            request,
            f'{updated} users were rejected.'
        )
    reject_users.short_description = "Mark selected users as rejected"


@admin.register(OnboardingProgress)
class OnboardingProgressAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'status', 'overall_progress_display', 'registration_progress_display',
        'assessment_progress_display', 'current_step_display', 'completed_steps_display',
        'profile_completeness_display', 'created_at', 'updated_at'
    ]
    list_filter = [
        'status', 'created_at', 'updated_at', 'completed_at'
    ]
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = [
        'created_at', 'updated_at', 'completed_at',
        'progress_percentage', 'completed_steps'
    ]
    ordering = ['-created_at']

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'status')
        }),
        ('Progress Data', {
            'fields': ('completed_steps', 'progress_percentage'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
        }),
    )

    def overall_progress_display(self, obj):
        """Display overall progress with color coding"""
        color = self._get_progress_color(obj.progress_percentage)
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} %</span>',
            color, obj.progress_percentage
        )
    overall_progress_display.short_description = 'Overall Progress'

    def registration_progress_display(self, obj):
        """Display registration progress"""
        breakdown = obj.get_progress_breakdown()
        color = self._get_progress_color(breakdown['registration'])
        return format_html(
            '<span style="color: {};">{} %</span>',
            color, breakdown['registration']
        )
    registration_progress_display.short_description = 'Registration'

    def assessment_progress_display(self, obj):
        """Display assessment progress"""
        breakdown = obj.get_progress_breakdown()
        color = self._get_progress_color(breakdown['assessment'])
        return format_html(
            '<span style="color: {};">{} %</span>',
            color, breakdown['assessment']
        )
    assessment_progress_display.short_description = 'Assessment'

    def current_step_display(self, obj):
        """Display current step"""
        step = obj.get_current_step()
        return step if step else 'Completed'
    current_step_display.short_description = 'Current Step'

    def completed_steps_display(self, obj):
        """Display completed steps out of total"""
        breakdown = obj.get_progress_breakdown()
        return f"{breakdown['completed_steps']} / {breakdown['total_steps']}"
    completed_steps_display.short_description = 'Steps'

    def profile_completeness_display(self, obj):
        """Display profile completeness score"""
        score = obj.get_profile_completeness()
        color = self._get_progress_color(score)
        return format_html(
            '<span style="color: {};">{} %</span>',
            color, score
        )
    profile_completeness_display.short_description = 'Profile Complete'

    def _get_progress_color(self, percentage):
        """Get color based on progress percentage"""
        if percentage >= 100:
            return '#10b981'  # Green
        elif percentage >= 75:
            return '#3b82f6'  # Blue
        elif percentage >= 50:
            return '#f59e0b'  # Orange
        else:
            return '#ef4444'  # Red

    actions = ['mark_assessment_started']

    def mark_assessment_started(self, request, queryset):
        """Mark assessment as started for selected users"""
        count = 0
        for progress in queryset:
            if not progress.is_step_complete(OnboardingProgress.STEP_ASSESSMENT_START):
                progress.mark_step_complete(OnboardingProgress.STEP_ASSESSMENT_START)
                count += 1
        self.message_user(
            request,
            f'Assessment started for {count} users.'
        )
    mark_assessment_started.short_description = "Mark assessment as started"
