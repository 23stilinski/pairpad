from django.contrib import admin
from django.utils.html import format_html, strip_tags
from .models import Conversation, Message, MessageReadStatus, ConversationMember

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'participants_list', 'last_message_preview',
        'match', 'is_active', 'created_at', 'updated_at'
    ]
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['participants__username', 'match__user1__username', 'match__user2__username']
    readonly_fields = ['created_at', 'updated_at', 'last_message_preview']
    ordering = ['-updated_at']
    filter_horizontal = ['participants']

    def participants_list(self, obj):
        participants = obj.participants.all()
        if participants.count() <= 3:
            return ', '.join([p.username for p in participants])
        else:
            first_three = ', '.join([p.username for p in participants[:3]])
            return f"{first_three} (+{participants.count() - 3} more)"
    participants_list.short_description = 'Participants'

    def last_message_preview(self, obj):
        last_msg = obj.last_message
        if last_msg:
            preview = strip_tags(last_msg.content)[:50]
            if len(last_msg.content) > 50:
                preview += "..."
            return f"{last_msg.sender.username}: {preview}"
        return "No messages"
    last_message_preview.short_description = 'Last Message'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('participants')

    actions = ['deactivate_conversations', 'activate_conversations']

    def deactivate_conversations(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} conversations were deactivated.')
    deactivate_conversations.short_description = "Deactivate selected conversations"

    def activate_conversations(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} conversations were activated.')
    activate_conversations.short_description = "Activate selected conversations"

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'sender', 'conversation_info', 'message_type',
        'content_preview', 'is_edited', 'is_deleted', 'created_at'
    ]
    list_filter = ['message_type', 'is_edited', 'is_deleted', 'created_at']
    search_fields = ['sender__username', 'content', 'conversation__participants__username']
    readonly_fields = ['created_at', 'edited_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Message Details', {
            'fields': ('conversation', 'sender', 'message_type', 'content')
        }),
        ('File Attachment', {
            'fields': ('file_attachment',),
            'classes': ['collapse']
        }),
        ('Status', {
            'fields': ('is_edited', 'is_deleted'),
            'classes': ['wide']
        }),
        ('Timestamps', {
            'fields': ('created_at', 'edited_at'),
            'classes': ['collapse']
        }),
    )

    def conversation_info(self, obj):
        participants = obj.conversation.participants.all()
        if participants.count() <= 2:
            names = [p.username for p in participants]
            return f"Conv: {' & '.join(names)}"
        return f"Conv: {participants.count()} participants"
    conversation_info.short_description = 'Conversation'

    def content_preview(self, obj):
        if obj.is_deleted:
            return format_html('<em style="color: #999;">Message deleted</em>')
        preview = strip_tags(obj.content)[:100]
        if len(obj.content) > 100:
            preview += "..."
        return preview
    content_preview.short_description = 'Content'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('sender', 'conversation').prefetch_related('conversation__participants')

    actions = ['soft_delete_messages', 'restore_messages']

    def soft_delete_messages(self, request, queryset):
        updated = queryset.update(is_deleted=True)
        self.message_user(request, f'{updated} messages were soft deleted.')
    soft_delete_messages.short_description = "Soft delete selected messages"

    def restore_messages(self, request, queryset):
        updated = queryset.update(is_deleted=False)
        self.message_user(request, f'{updated} messages were restored.')
    restore_messages.short_description = "Restore selected messages"

@admin.register(MessageReadStatus)
class MessageReadStatusAdmin(admin.ModelAdmin):
    list_display = ['message_info', 'user', 'read_at']
    list_filter = ['read_at']
    search_fields = ['user__username', 'message__sender__username', 'message__content']
    readonly_fields = ['read_at']
    ordering = ['-read_at']

    def message_info(self, obj):
        preview = strip_tags(obj.message.content)[:30]
        if len(obj.message.content) > 30:
            preview += "..."
        return f"#{obj.message.id}: {preview}"
    message_info.short_description = 'Message'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'message', 'message__sender')

@admin.register(ConversationMember)
class ConversationMemberAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'conversation_info', 'is_active',
        'unread_count_display', 'joined_at', 'left_at'
    ]
    list_filter = ['is_active', 'joined_at', 'left_at']
    search_fields = ['user__username', 'conversation__participants__username']
    readonly_fields = ['joined_at', 'unread_count_display']
    ordering = ['-joined_at']

    fieldsets = (
        ('Membership', {
            'fields': ('conversation', 'user', 'is_active')
        }),
        ('Message Tracking', {
            'fields': ('last_seen_message', 'unread_count_display'),
            'classes': ['wide']
        }),
        ('Timestamps', {
            'fields': ('joined_at', 'left_at'),
            'classes': ['collapse']
        }),
    )

    def conversation_info(self, obj):
        participants = obj.conversation.participants.all()
        if participants.count() <= 2:
            names = [p.username for p in participants if p != obj.user]
            return f"With: {', '.join([p.username for p in names])}"
        return f"Group: {participants.count()} participants"
    conversation_info.short_description = 'Conversation'

    def unread_count_display(self, obj):
        try:
            count = obj.get_unread_count()
            if count > 0:
                return format_html('<strong style="color: #ff5722;">{}</strong>', count)
            return count
        except:
            return "N/A"
    unread_count_display.short_description = 'Unread Count'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'conversation').prefetch_related('conversation__participants')

    actions = ['mark_as_active', 'mark_as_inactive']

    def mark_as_active(self, request, queryset):
        updated = queryset.update(is_active=True, left_at=None)
        self.message_user(request, f'{updated} memberships were marked as active.')
    mark_as_active.short_description = "Mark selected memberships as active"

    def mark_as_inactive(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_active=False, left_at=timezone.now())
        self.message_user(request, f'{updated} memberships were marked as inactive.')
    mark_as_inactive.short_description = "Mark selected memberships as inactive"