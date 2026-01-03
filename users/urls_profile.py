from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('me/', views.UserDetailView.as_view(), name='user-detail'),
    path('search/', views.search_users, name='user-search'),

    # Provider endpoints
    path('providers/', views.browse_providers, name='browse-providers'),
    path('providers/stats/', views.get_provider_stats, name='provider-stats'),
    path('providers/<int:user_id>/', views.get_provider_profile, name='provider-profile'),
    path('providers/mode/', views.update_provider_mode, name='update-provider-mode'),
]
