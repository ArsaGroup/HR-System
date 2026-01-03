from django.db import models
from django.utils import timezone
from users.models import User
from skills.models import Skill

class ProjectCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name

class ProjectTemplate(models.Model):
    category = models.ForeignKey(ProjectCategory, on_delete=models.CASCADE, related_name='templates')
    title = models.CharField(max_length=200)
    description = models.TextField()
    default_budget_range = models.CharField(max_length=100, blank=True)
    estimated_duration = models.CharField(max_length=100, blank=True)
    required_skills = models.ManyToManyField(Skill, blank=True)
    template_fields = models.JSONField(default=dict, help_text="JSON structure for form fields")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.category.name} - {self.title}"

class Project(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('on_hold', 'On Hold'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    # Basic Information
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(ProjectCategory, on_delete=models.SET_NULL, null=True, related_name='projects')
    template = models.ForeignKey(ProjectTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Project Details
    budget_min = models.DecimalField(max_digits=10, decimal_places=2)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2)
    budget_currency = models.CharField(max_length=3, default='USD')
    deadline = models.DateTimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Skills and Requirements
    required_skills = models.ManyToManyField(Skill, related_name='required_projects')
    location = models.CharField(max_length=200, blank=True)
    is_remote = models.BooleanField(default=True)
    
    # Status and Visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    proposals_count = models.IntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['category', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.client.username}"

class ProjectAttachment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='project_attachments/')
    file_name = models.CharField(max_length=200)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField(help_text="File size in bytes")
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.project.title} - {self.file_name}"

class ProjectView(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='views')
    viewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    viewer_ip = models.GenericIPAddressField()
    viewed_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        indexes = [
            models.Index(fields=['project', 'viewed_at']),
        ]
