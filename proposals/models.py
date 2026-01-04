from django.db import models
from django.utils import timezone
from users.models import User
from projects.models import Project

class Proposal(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
        ('expired', 'Expired'),
    )
    
    # Basic Information
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proposals')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='proposals')
    
    # Proposal Details
    cover_letter = models.TextField()
    proposed_price = models.DecimalField(max_digits=10, decimal_places=2)
    proposed_timeline = models.IntegerField(help_text="Timeline in days")
    currency = models.CharField(max_length=3, default='USD')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Additional Information
    milestones = models.JSONField(default=list, blank=True, help_text="List of project milestones")
    terms_and_conditions = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['freelancer', 'project']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['project', 'status']),
        ]
    
    def __str__(self):
        return f"{self.freelancer.username} - {self.project.title}"

class ProposalAttachment(models.Model):
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='proposal_attachments/')
    file_name = models.CharField(max_length=200)
    file_type = models.CharField(max_length=50)
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.proposal} - {self.file_name}"

class ProposalComparison(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='comparisons')
    proposals = models.ManyToManyField(Proposal, related_name='comparisons')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Comparison for {self.project.title}"
