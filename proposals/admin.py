from django.contrib import admin
from .models import Proposal, ProposalAttachment, ProposalComparison

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['freelancer', 'project', 'status', 'proposed_price', 'proposed_timeline', 'created_at']
    list_filter = ['status', 'created_at', 'submitted_at']
    search_fields = ['freelancer__username', 'project__title', 'cover_letter']
    readonly_fields = ['created_at', 'updated_at', 'submitted_at', 'responded_at']

@admin.register(ProposalAttachment)
class ProposalAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'proposal', 'file_type', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['file_name', 'proposal__project__title']

@admin.register(ProposalComparison)
class ProposalComparisonAdmin(admin.ModelAdmin):
    list_display = ['project', 'created_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['project__title', 'created_by__username']
    filter_horizontal = ['proposals']
