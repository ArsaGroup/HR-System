from rest_framework import serializers
from .models import PortfolioItem

class PortfolioItemSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PortfolioItem
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        # Handle file uploads
        image_file = self.context['request'].FILES.get('image_file', None)
        pdf_file = self.context['request'].FILES.get('pdf_file', None)
        
        if image_file:
            validated_data['image_file'] = image_file
        if pdf_file:
            validated_data['pdf_file'] = pdf_file
        
        # Handle external links
        external_link = self.context['request'].data.get('external_link', '')
        video_url = self.context['request'].data.get('video_url', '')
        
        if external_link:
            validated_data['external_link'] = external_link
        if video_url:
            validated_data['video_url'] = video_url
        
        return super().create(validated_data)