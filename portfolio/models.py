from django.db import models
from django.utils import timezone
from users.models import User

class PortfolioItem(models.Model):
    ITEM_TYPES = (
        ('image', 'Image'),
        ('pdf', 'PDF Document'),
        ('link', 'External Link'),
        ('video', 'Video'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_items')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    item_type = models.CharField(max_length=10, choices=ITEM_TYPES)
    
    # File fields
    image_file = models.ImageField(upload_to='portfolio/images/', blank=True, null=True)
    pdf_file = models.FileField(upload_to='portfolio/documents/', blank=True, null=True)
    video_url = models.URLField(blank=True)
    external_link = models.URLField(blank=True)
    
    # Metadata
    skills_used = models.ManyToManyField('skills.Skill', blank=True, related_name='portfolio_items')
    project_date = models.DateField(blank=True, null=True)
    client_name = models.CharField(max_length=200, blank=True)
    project_duration = models.CharField(max_length=100, blank=True, help_text="e.g., 2 weeks, 1 month")
    
    # Visibility and status
    is_public = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_file_url(self):
        if self.item_type == 'image' and self.image_file:
            return self.image_file.url
        elif self.item_type == 'pdf' and self.pdf_file:
            return self.pdf_file.url
        elif self.item_type == 'video' and self.video_url:
            return self.video_url
        elif self.item_type == 'link' and self.external_link:
            return self.external_link
        return None
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"

class PortfolioView(models.Model):
    portfolio_item = models.ForeignKey(PortfolioItem, on_delete=models.CASCADE, related_name='views')
    viewer_ip = models.GenericIPAddressField()
    viewed_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        indexes = [
            models.Index(fields=['portfolio_item', 'viewed_at']),
        ]
    
    def __str__(self):
        return f"View of {self.portfolio_item.title} at {self.viewed_at}"