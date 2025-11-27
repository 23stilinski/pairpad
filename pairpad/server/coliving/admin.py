from django.contrib import admin
from django.utils.html import format_html
from .models import (
    LivingSpace, LivingSpaceMember, Task, Expense,
    ExpenseSplit, HouseRules, Room, LivingSpaceImage,
    RoomApplication, LivingSpaceReview
)

class LivingSpaceMemberInline(admin.TabularInline):
    model = LivingSpaceMember
    extra = 0
    readonly_fields = ['joined_at']
    fields = ['user', 'role', 'is_active', 'joined_at', 'left_at']

@admin.register(LivingSpace)
class LivingSpaceAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'space_type', 'created_by', 'member_count',
        'is_active', 'created_at'
    ]
    list_filter = ['space_type', 'is_active', 'created_at']
    search_fields = ['name', 'address', 'created_by__username', 'members__username']
    readonly_fields = ['created_at', 'updated_at', 'member_count']
    ordering = ['-created_at']
    inlines = [LivingSpaceMemberInline]

    fieldsets = (
        ('Space Details', {
            'fields': ('name', 'space_type', 'address', 'created_by')
        }),
        ('Status', {
            'fields': ('is_active', 'member_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def member_count(self, obj):
        count = obj.memberships.filter(is_active=True).count()
        return format_html(
            '<strong>{}</strong> active member{}',
            count,
            's' if count != 1 else ''
        )
    member_count.short_description = 'Members'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by').prefetch_related('memberships')

    actions = ['activate_spaces', 'deactivate_spaces']

    def activate_spaces(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} living spaces were activated.')
    activate_spaces.short_description = "Activate selected living spaces"

    def deactivate_spaces(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} living spaces were deactivated.')
    deactivate_spaces.short_description = "Deactivate selected living spaces"

@admin.register(LivingSpaceMember)
class LivingSpaceMemberAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'living_space', 'role', 'is_active',
        'joined_at', 'left_at'
    ]
    list_filter = ['role', 'is_active', 'joined_at']
    search_fields = ['user__username', 'living_space__name']
    readonly_fields = ['joined_at']
    ordering = ['-joined_at']

    fieldsets = (
        ('Membership', {
            'fields': ('living_space', 'user', 'role', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('joined_at', 'left_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'living_space')

    actions = ['promote_to_admin', 'demote_to_member', 'remove_members']

    def promote_to_admin(self, request, queryset):
        updated = queryset.update(role='admin')
        self.message_user(request, f'{updated} members were promoted to admin.')
    promote_to_admin.short_description = "Promote selected members to admin"

    def demote_to_member(self, request, queryset):
        updated = queryset.update(role='member')
        self.message_user(request, f'{updated} members were demoted to member.')
    demote_to_member.short_description = "Demote selected members to member"

    def remove_members(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_active=False, left_at=timezone.now())
        self.message_user(request, f'{updated} members were removed.')
    remove_members.short_description = "Remove selected members"

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'living_space', 'assigned_to', 'category',
        'status', 'due_date', 'recurrence', 'created_at'
    ]
    list_filter = ['category', 'status', 'recurrence', 'due_date', 'created_at']
    search_fields = [
        'title', 'description', 'living_space__name',
        'assigned_to__username', 'created_by__username'
    ]
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    ordering = ['due_date', '-created_at']
    list_editable = ['status']

    fieldsets = (
        ('Task Details', {
            'fields': ('title', 'description', 'category', 'living_space')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'created_by'),
            'classes': ['wide']
        }),
        ('Scheduling', {
            'fields': ('due_date', 'recurrence'),
            'classes': ['wide']
        }),
        ('Status', {
            'fields': ('status', 'completed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'living_space', 'assigned_to', 'created_by'
        )

    actions = ['mark_completed', 'mark_pending', 'mark_overdue']

    def mark_completed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='completed', completed_at=timezone.now())
        self.message_user(request, f'{updated} tasks were marked as completed.')
    mark_completed.short_description = "Mark selected tasks as completed"

    def mark_pending(self, request, queryset):
        updated = queryset.update(status='pending', completed_at=None)
        self.message_user(request, f'{updated} tasks were marked as pending.')
    mark_pending.short_description = "Mark selected tasks as pending"

    def mark_overdue(self, request, queryset):
        updated = queryset.update(status='overdue')
        self.message_user(request, f'{updated} tasks were marked as overdue.')
    mark_overdue.short_description = "Mark selected tasks as overdue"

class ExpenseSplitInline(admin.TabularInline):
    model = ExpenseSplit
    extra = 0
    readonly_fields = ['remaining_amount']
    fields = ['user', 'amount_owed', 'amount_paid', 'remaining_amount', 'is_settled', 'paid_at']

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'living_space', 'amount', 'paid_by',
        'category', 'split_type', 'expense_date', 'created_at'
    ]
    list_filter = ['category', 'split_type', 'expense_date', 'created_at']
    search_fields = [
        'title', 'description', 'living_space__name',
        'paid_by__username', 'participants__username'
    ]
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-expense_date']
    inlines = [ExpenseSplitInline]

    fieldsets = (
        ('Expense Details', {
            'fields': ('title', 'description', 'category', 'living_space')
        }),
        ('Payment Info', {
            'fields': ('amount', 'paid_by', 'split_type'),
            'classes': ['wide']
        }),
        ('Receipt', {
            'fields': ('receipt_image',),
            'classes': ['collapse']
        }),
        ('Dates', {
            'fields': ('expense_date', 'created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'living_space', 'paid_by'
        ).prefetch_related('participants')

    actions = ['mark_all_splits_settled']

    def mark_all_splits_settled(self, request, queryset):
        total_updated = 0
        for expense in queryset:
            splits_updated = expense.splits.update(is_settled=True)
            total_updated += splits_updated
        self.message_user(request, f'{total_updated} expense splits were marked as settled.')
    mark_all_splits_settled.short_description = "Mark all splits as settled for selected expenses"

@admin.register(ExpenseSplit)
class ExpenseSplitAdmin(admin.ModelAdmin):
    list_display = [
        'expense_info', 'user', 'amount_owed', 'amount_paid',
        'remaining_amount', 'is_settled', 'paid_at'
    ]
    list_filter = ['is_settled', 'paid_at']
    search_fields = [
        'expense__title', 'user__username',
        'expense__living_space__name'
    ]
    readonly_fields = ['remaining_amount']
    ordering = ['-expense__expense_date']

    def expense_info(self, obj):
        return f"{obj.expense.title} (${obj.expense.amount})"
    expense_info.short_description = 'Expense'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'expense', 'user', 'expense__living_space'
        )

    actions = ['mark_settled', 'mark_unsettled']

    def mark_settled(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_settled=True, paid_at=timezone.now())
        self.message_user(request, f'{updated} expense splits were marked as settled.')
    mark_settled.short_description = "Mark selected splits as settled"

    def mark_unsettled(self, request, queryset):
        updated = queryset.update(is_settled=False, paid_at=None)
        self.message_user(request, f'{updated} expense splits were marked as unsettled.')
    mark_unsettled.short_description = "Mark selected splits as unsettled"

@admin.register(HouseRules)
class HouseRulesAdmin(admin.ModelAdmin):
    list_display = [
        'living_space', 'quiet_hours_display', 'overnight_guests_allowed',
        'smoking_allowed', 'pets_allowed', 'updated_at'
    ]
    list_filter = [
        'overnight_guests_allowed', 'smoking_allowed', 'pets_allowed',
        'alcohol_allowed', 'guest_notification_required', 'updated_at'
    ]
    search_fields = ['living_space__name', 'custom_rules']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Living Space', {
            'fields': ('living_space',)
        }),
        ('Quiet Hours', {
            'fields': ('quiet_hours_start', 'quiet_hours_end'),
            'classes': ['wide']
        }),
        ('Guest Policies', {
            'fields': (
                'overnight_guests_allowed', 'max_consecutive_guest_nights',
                'guest_notification_required'
            ),
            'classes': ['wide']
        }),
        ('Cleaning Policies', {
            'fields': ('cleaning_schedule', 'shared_chores_rotation'),
            'classes': ['wide']
        }),
        ('General Rules', {
            'fields': ('smoking_allowed', 'pets_allowed', 'alcohol_allowed'),
            'classes': ['wide']
        }),
        ('Custom Rules', {
            'fields': ('custom_rules',),
            'classes': ['wide']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def quiet_hours_display(self, obj):
        if obj.quiet_hours_start and obj.quiet_hours_end:
            return f"{obj.quiet_hours_start.strftime('%H:%M')} - {obj.quiet_hours_end.strftime('%H:%M')}"
        return "Not set"
    quiet_hours_display.short_description = 'Quiet Hours'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('living_space')

class RoomInline(admin.TabularInline):
    model = Room
    extra = 0
    readonly_fields = ['created_at']
    fields = ['name', 'room_type', 'is_available', 'monthly_rent', 'current_occupant', 'created_at']

class LivingSpaceImageInline(admin.TabularInline):
    model = LivingSpaceImage
    extra = 0
    readonly_fields = ['created_at']
    fields = ['image', 'image_type', 'caption', 'is_primary', 'order', 'uploaded_by', 'created_at']

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'living_space', 'room_type', 'monthly_rent',
        'is_available', 'current_occupant', 'created_at'
    ]
    list_filter = ['room_type', 'is_available', 'has_private_bathroom', 'furnished', 'created_at']
    search_fields = ['name', 'living_space__name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Room Details', {
            'fields': ('living_space', 'name', 'room_type', 'description')
        }),
        ('Features', {
            'fields': (
                'size_sqft', 'has_private_bathroom', 'has_balcony',
                'has_closet', 'furnished', 'air_conditioning'
            ),
            'classes': ['wide']
        }),
        ('Availability & Pricing', {
            'fields': (
                'is_available', 'monthly_rent', 'security_deposit',
                'available_from', 'current_occupant'
            ),
            'classes': ['wide']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('living_space', 'current_occupant')

    actions = ['mark_available', 'mark_unavailable']

    def mark_available(self, request, queryset):
        updated = queryset.update(is_available=True)
        self.message_user(request, f'{updated} rooms were marked as available.')
    mark_available.short_description = "Mark selected rooms as available"

    def mark_unavailable(self, request, queryset):
        updated = queryset.update(is_available=False)
        self.message_user(request, f'{updated} rooms were marked as unavailable.')
    mark_unavailable.short_description = "Mark selected rooms as unavailable"

@admin.register(LivingSpaceImage)
class LivingSpaceImageAdmin(admin.ModelAdmin):
    list_display = [
        'living_space', 'room', 'image_type', 'caption',
        'is_primary', 'order', 'uploaded_by', 'created_at'
    ]
    list_filter = ['image_type', 'is_primary', 'created_at']
    search_fields = ['living_space__name', 'room__name', 'caption']
    readonly_fields = ['created_at']
    ordering = ['living_space', 'order', 'created_at']
    list_editable = ['order', 'is_primary']

    fieldsets = (
        ('Image Details', {
            'fields': ('living_space', 'room', 'image', 'image_type', 'caption')
        }),
        ('Display Settings', {
            'fields': ('is_primary', 'order'),
            'classes': ['wide']
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'created_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('living_space', 'room', 'uploaded_by')

@admin.register(RoomApplication)
class RoomApplicationAdmin(admin.ModelAdmin):
    list_display = [
        'applicant', 'room_info', 'move_in_date', 'status',
        'reviewed_by', 'created_at'
    ]
    list_filter = ['status', 'move_in_date', 'created_at', 'reviewed_at']
    search_fields = [
        'applicant__username', 'room__name', 'room__living_space__name', 'message'
    ]
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Application Details', {
            'fields': ('room', 'applicant', 'message', 'move_in_date', 'lease_duration_months')
        }),
        ('Review', {
            'fields': ('status', 'reviewed_by', 'review_message', 'reviewed_at'),
            'classes': ['wide']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def room_info(self, obj):
        return f"{obj.room.name} in {obj.room.living_space.name}"
    room_info.short_description = 'Room'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'applicant', 'room', 'room__living_space', 'reviewed_by'
        )

    actions = ['approve_applications', 'reject_applications']

    def approve_applications(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='approved', reviewed_by=request.user, reviewed_at=timezone.now())
        self.message_user(request, f'{updated} applications were approved.')
    approve_applications.short_description = "Approve selected applications"

    def reject_applications(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='rejected', reviewed_by=request.user, reviewed_at=timezone.now())
        self.message_user(request, f'{updated} applications were rejected.')
    reject_applications.short_description = "Reject selected applications"

@admin.register(LivingSpaceReview)
class LivingSpaceReviewAdmin(admin.ModelAdmin):
    list_display = [
        'living_space', 'reviewer', 'overall_rating', 'verified_stay',
        'created_at'
    ]
    list_filter = ['overall_rating', 'verified_stay', 'created_at']
    search_fields = ['living_space__name', 'reviewer__username', 'review_text']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Review Details', {
            'fields': ('living_space', 'reviewer', 'verified_stay')
        }),
        ('Ratings', {
            'fields': (
                'overall_rating', 'cleanliness_rating', 'location_rating',
                'value_rating', 'roommate_compatibility'
            ),
            'classes': ['wide']
        }),
        ('Review Content', {
            'fields': ('review_text', 'pros', 'cons'),
            'classes': ['wide']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('living_space', 'reviewer')

# Update the existing LivingSpaceAdmin to include the new inlines
LivingSpaceAdmin.inlines = [LivingSpaceMemberInline, RoomInline, LivingSpaceImageInline]