from django.contrib import admin
from django.utils.html import format_html
from .models import Match, MatchInteraction, CompatibilityScore, UserPreferences

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = [
        'user1', 'user2', 'compatibility_score', 'status',
        'created_at', 'updated_at'
    ]
    list_filter = ['status', 'created_at', 'compatibility_score']
    search_fields = ['user1__username', 'user2__username', 'user1__email', 'user2__email']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-compatibility_score', '-created_at']

    fieldsets = (
        ('Match Details', {
            'fields': ('user1', 'user2', 'compatibility_score', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user1', 'user2')

    actions = ['mark_as_mutual', 'mark_as_rejected']

    def mark_as_mutual(self, request, queryset):
        updated = queryset.update(status='mutual')
        self.message_user(request, f'{updated} matches were marked as mutual.')
    mark_as_mutual.short_description = "Mark selected matches as mutual"

    def mark_as_rejected(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} matches were marked as rejected.')
    mark_as_rejected.short_description = "Mark selected matches as rejected"

@admin.register(MatchInteraction)
class MatchInteractionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'target_user', 'interaction_type', 'created_at'
    ]
    list_filter = ['interaction_type', 'created_at']
    search_fields = ['user__username', 'target_user__username']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'target_user')

@admin.register(CompatibilityScore)
class CompatibilityScoreAdmin(admin.ModelAdmin):
    list_display = [
        'user1', 'user2', 'overall_score', 'personality_score',
        'lifestyle_score', 'communication_score', 'location_score',
        'calculated_at'
    ]
    list_filter = ['overall_score', 'calculated_at']
    search_fields = ['user1__username', 'user2__username']
    readonly_fields = ['calculated_at']
    ordering = ['-overall_score', '-calculated_at']

    fieldsets = (
        ('Users', {
            'fields': ('user1', 'user2')
        }),
        ('Compatibility Breakdown', {
            'fields': (
                'personality_score', 'lifestyle_score', 'communication_score', 'location_score'
            ),
            'classes': ['wide']
        }),
        ('Overall Score', {
            'fields': ('overall_score',)
        }),
        ('Metadata', {
            'fields': ('calculated_at',),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user1', 'user2')

@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'min_age', 'max_age', 'preferred_gender',
        'max_distance_km', 'smoking_preference', 'pets_preference',
        'created_at'
    ]
    list_filter = [
        'preferred_gender', 'smoking_preference', 'pets_preference', 'created_at'
    ]
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Age Preferences', {
            'fields': ('min_age', 'max_age'),
            'classes': ['wide']
        }),
        ('Matching Preferences', {
            'fields': (
                'preferred_gender', 'max_distance_km',
                'smoking_preference', 'pets_preference'
            ),
            'classes': ['wide']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')