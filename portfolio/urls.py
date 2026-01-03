from django.urls import path
from . import views

urlpatterns = [
    path('items/', views.PortfolioItemList.as_view(), name='portfolio-item-list'),
    path('items/<int:pk>/', views.PortfolioItemDetail.as_view(), name='portfolio-item-detail'),
    path('upload/', views.upload_file, name='portfolio-upload'),
]