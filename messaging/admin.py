from django.contrib import admin
from .models import Conversation, Message, MessageReadReceipt

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'last_message_at', 'created_at']
    list_filter = ['created_at', 'last_message_at']
    search_fields = ['subject']
    filter_horizontal = ['participants']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'message_type', 'is_read', 'created_at']
    list_filter = ['message_type', 'is_read', 'created_at']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['created_at', 'read_at']

@admin.register(MessageReadReceipt)
class MessageReadReceiptAdmin(admin.ModelAdmin):
    list_display = ['message', 'reader', 'read_at']
    list_filter = ['read_at']
    search_fields = ['message__content', 'reader__username']
