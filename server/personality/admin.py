from django.contrib import admin
from django.utils.html import format_html
from .models import PersonalityProfile, AssessmentQuestion, AssessmentResponse

@admin.register(PersonalityProfile)
class PersonalityProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'communication_style', 'openness', 'conscientiousness',
        'extraversion', 'agreeableness', 'neuroticism', 'completed_at'
    ]
    list_filter = [
        'communication_style', 'completed_at', 'quiet_hours',
        'pets_allowed', 'smoking_allowed'
    ]
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['completed_at', 'updated_at']
    ordering = ['-completed_at']

    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Big Five Personality Traits', {
            'fields': (
                'openness', 'conscientiousness', 'extraversion',
                'agreeableness', 'neuroticism'
            ),
            'classes': ['wide']
        }),
        ('Lifestyle Preferences', {
            'fields': (
                'cleanliness_level', 'social_level', 'quiet_hours',
                'pets_allowed', 'smoking_allowed'
            ),
            'classes': ['wide']
        }),
        ('Communication', {
            'fields': ('communication_style',)
        }),
        ('Metadata', {
            'fields': ('completed_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(admin.ModelAdmin):
    list_display = [
        'order', 'question_text_short', 'trait', 'question_type',
        'reverse_scored', 'is_active'
    ]
    list_filter = ['trait', 'question_type', 'reverse_scored', 'is_active']
    search_fields = ['question_text']
    ordering = ['order']
    list_editable = ['is_active', 'reverse_scored']
    list_display_links = ['order', 'question_text_short']

    def question_text_short(self, obj):
        """Display shortened question text"""
        return obj.question_text[:50] + "..." if len(obj.question_text) > 50 else obj.question_text
    question_text_short.short_description = 'Question'

    actions = ['activate_questions', 'deactivate_questions']

    def activate_questions(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} questions were activated.')
    activate_questions.short_description = "Activate selected questions"

    def deactivate_questions(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} questions were deactivated.')
    deactivate_questions.short_description = "Deactivate selected questions"

@admin.register(AssessmentResponse)
class AssessmentResponseAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'question_short', 'response_value',
        'response_boolean', 'created_at'
    ]
    list_filter = [
        'question__trait', 'question__question_type', 'created_at'
    ]
    search_fields = ['user__username', 'question__question_text']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

    def question_short(self, obj):
        """Display shortened question text"""
        return obj.question.question_text[:30] + "..."
    question_short.short_description = 'Question'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'question')
