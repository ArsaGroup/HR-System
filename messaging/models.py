from django.db import models
from django.utils import timezone
from users.models import User
from projects.models import Project

class Conversation(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='conversations', null=True, blank=True)
    participants = models.ManyToManyField(User, related_name='conversations')
    subject = models.CharField(max_length=200, blank=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-last_message_at', '-created_at']
        indexes = [
            models.Index(fields=['last_message_at']),
        ]
    
    def __str__(self):
        return f"Conversation {self.id} - {self.subject}"

class Message(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Text'),
        ('file', 'File'),
        ('system', 'System'),
    )
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    attachment = models.FileField(upload_to='message_attachments/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.username} in conversation {self.conversation.id}"

class MessageReadReceipt(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_receipts')
    reader = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['message', 'reader']
    
    def __str__(self):
        return f"{self.reader.username} read message {self.message.id}"
