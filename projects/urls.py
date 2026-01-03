from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.ProjectCategoryList.as_view(), name='project-category-list'),

    # Templates
    path('templates/', views.ProjectTemplateList.as_view(), name='project-template-list'),
    path('templates/<int:pk>/', views.ProjectTemplateDetail.as_view(), name='project-template-detail'),

    # Project Statistics
    path('stats/', views.project_stats, name='project-stats'),

    # My Projects (must be before <int:pk>/ to avoid conflict)
    path('my/', views.my_projects, name='my-projects'),

    # Projects
    path('', views.ProjectList.as_view(), name='project-list'),
    path('<int:pk>/', views.ProjectDetail.as_view(), name='project-detail'),
    path('<int:pk>/publish/', views.publish_project, name='project-publish'),
    path('<int:pk>/unpublish/', views.unpublish_project, name='project-unpublish'),
]
