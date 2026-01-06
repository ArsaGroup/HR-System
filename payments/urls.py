from django.urls import path
from . import views

urlpatterns = [
    # Payment Methods
    path('methods/', views.PaymentMethodList.as_view(), name='payment-method-list'),
    path('methods/<int:pk>/', views.PaymentMethodDetail.as_view(), name='payment-method-detail'),
    
    # Wallet
    path('wallet/', views.WalletDetail.as_view(), name='wallet-detail'),
    
    # Transactions
    path('transactions/', views.TransactionList.as_view(), name='transaction-list'),
    path('transactions/<int:pk>/', views.TransactionDetail.as_view(), name='transaction-detail'),
    
    # Escrow
    path('escrow/', views.create_escrow, name='escrow-create'),
    path('escrow/<int:pk>/', views.EscrowDetail.as_view(), name='escrow-detail'),
    path('escrow/<int:pk>/fund/', views.fund_escrow, name='escrow-fund'),
    path('escrow/<int:pk>/release/', views.release_escrow, name='escrow-release'),
    
    # Invoices
    path('invoices/', views.InvoiceList.as_view(), name='invoice-list'),
    path('invoices/<int:pk>/', views.InvoiceDetail.as_view(), name='invoice-detail'),
    
    # Earnings
    path('earnings/', views.provider_earnings, name='provider-earnings'),
]

