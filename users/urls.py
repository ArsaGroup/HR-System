from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('send-verification/', views.send_verification_code, name='send-verification'),
    path('verify-code/', views.verify_code, name='verify-code'),
]