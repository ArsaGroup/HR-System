from django.urls import path
from . import views

urlpatterns = [
    # Proposals CRUD
    path('', views.ProposalList.as_view(), name='proposal-list'),
    path('<int:pk>/', views.ProposalDetail.as_view(), name='proposal-detail'),

    # My proposals (shortcut for current user)
    path('my/', views.my_proposals, name='my-proposals'),

    # Proposal actions
    path('<int:pk>/submit/', views.submit_proposal, name='proposal-submit'),
    path('<int:pk>/accept/', views.accept_proposal, name='proposal-accept'),
    path('<int:pk>/reject/', views.reject_proposal, name='proposal-reject'),
    path('<int:pk>/withdraw/', views.withdraw_proposal, name='proposal-withdraw'),

    # Get proposals for a specific project (project owner only)
    path('project/<int:project_id>/', views.project_proposals, name='project-proposals'),

    # Comparisons
    path('comparisons/', views.ProposalComparisonList.as_view(), name='proposal-comparison-list'),
    path('comparisons/<int:pk>/', views.ProposalComparisonDetail.as_view(), name='proposal-comparison-detail'),
]
