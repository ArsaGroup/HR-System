from rest_framework import serializers
from .models import Conversation, Message, MessageReadReceipt
from users.serializers import UserSerializer
from projects.serializers import ProjectSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sender', 'created_at', 'is_read', 'read_at')
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True
    )
    project = ProjectSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Conversation
        fields = '__all__'
        read_only_fields = ('last_message_at', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        conversation = Conversation.objects.create(**validated_data)
        if participant_ids:
            from users.models import User
            conversation.participants.set(User.objects.filter(id__in=participant_ids))
        return conversation

class MessageReadReceiptSerializer(serializers.ModelSerializer):
    reader = UserSerializer(read_only=True)
    
    class Meta:
        model = MessageReadReceipt
        fields = '__all__'
        read_only_fields = ('reader', 'read_at')

