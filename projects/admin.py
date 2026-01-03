from django.contrib import admin
from .models import ProjectCategory, ProjectTemplate, Project, ProjectAttachment, ProjectView

@admin.register(ProjectCategory)
class ProjectCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']

@admin.register(ProjectTemplate)
class ProjectTemplateAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['title', 'description']
    filter_horizontal = ['required_skills']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'category', 'status', 'budget_min', 'budget_max', 'deadline', 'created_at']
    list_filter = ['status', 'category', 'priority', 'is_remote', 'created_at']
    search_fields = ['title', 'description', 'client__username', 'client__email']
    readonly_fields = ['views_count', 'proposals_count', 'created_at', 'updated_at', 'published_at']
    filter_horizontal = ['required_skills']

@admin.register(ProjectAttachment)
class ProjectAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'project', 'file_type', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['file_name', 'project__title']

@admin.register(ProjectView)
class ProjectViewAdmin(admin.ModelAdmin):
    list_display = ['project', 'viewer', 'viewer_ip', 'viewed_at']
    list_filter = ['viewed_at']
    search_fields = ['project__title', 'viewer__username']
