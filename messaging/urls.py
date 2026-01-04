from django.urls import path
from . import views

urlpatterns = [
    # Conversations
    path('conversations/', views.ConversationList.as_view(), name='conversation-list'),
    path('conversations/<int:pk>/', views.ConversationDetail.as_view(), name='conversation-detail'),
    
    # Messages
    path('messages/', views.MessageList.as_view(), name='message-list'),
    path('messages/<int:pk>/', views.MessageDetail.as_view(), name='message-detail'),
    path('messages/<int:pk>/read/', views.mark_message_read, name='message-mark-read'),
    path('unread-count/', views.unread_count, name='unread-count'),
]

