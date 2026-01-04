from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Max
from .models import Conversation, Message, MessageReadReceipt
from .serializers import ConversationSerializer, MessageSerializer, MessageReadReceiptSerializer

class ConversationList(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        conversations = Conversation.objects.filter(participants=user).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time', '-created_at')
        
        # Add unread count and last message to each conversation
        for conv in conversations:
            conv.unread_count = Message.objects.filter(
                conversation=conv,
                is_read=False
            ).exclude(sender=user).count()
            
            last_msg = Message.objects.filter(conversation=conv).order_by('-created_at').first()
            conv.last_message = last_msg
        
        return conversations
    
    def perform_create(self, serializer):
        conversation = serializer.save()
        # Add current user to participants
        conversation.participants.add(self.request.user)

class ConversationDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

class MessageList(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation', None)
        if conversation_id:
            # Verify user is participant
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    participants=self.request.user
                )
                return Message.objects.filter(conversation=conversation).order_by('created_at')
            except Conversation.DoesNotExist:
                return Message.objects.none()
        return Message.objects.none()
    
    def perform_create(self, serializer):
        message = serializer.save()
        # Update conversation last message time
        conversation = message.conversation
        from django.utils import timezone
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])
        
        # Mark as read for sender
        MessageReadReceipt.objects.get_or_create(
            message=message,
            reader=self.request.user,
            defaults={'read_at': timezone.now()}
        )
        message.is_read = True
        message.save(update_fields=['is_read'])

class MessageDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.filter(
            conversation__participants=self.request.user
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_message_read(request, pk):
    try:
        message = Message.objects.get(
            pk=pk,
            conversation__participants=request.user
        )
        if message.sender != request.user:
            MessageReadReceipt.objects.get_or_create(
                message=message,
                reader=request.user
            )
            message.is_read = True
            from django.utils import timezone
            message.read_at = timezone.now()
            message.save(update_fields=['is_read', 'read_at'])
            return Response({'message': 'Message marked as read'}, status=status.HTTP_200_OK)
        return Response({'error': 'Cannot mark own message as read'}, status=status.HTTP_400_BAD_REQUEST)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    count = Message.objects.filter(
        conversation__participants=request.user,
        is_read=False
    ).exclude(sender=request.user).count()
    return Response({'unread_count': count}, status=status.HTTP_200_OK)
