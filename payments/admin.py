from django.contrib import admin
from .models import PaymentMethod, Wallet, Transaction, Escrow, Invoice

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'method_type', 'is_default', 'is_active', 'created_at']
    list_filter = ['method_type', 'is_default', 'is_active', 'created_at']
    search_fields = ['user__username', 'billing_name']

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'currency', 'is_active', 'updated_at']
    list_filter = ['currency', 'is_active', 'updated_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'transaction_type', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'currency', 'created_at']
    search_fields = ['user__username', 'description', 'gateway_transaction_id']
    readonly_fields = ['created_at', 'completed_at']

@admin.register(Escrow)
class EscrowAdmin(admin.ModelAdmin):
    list_display = ['project', 'client', 'freelancer', 'amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['project__title', 'client__username', 'freelancer__username']
    readonly_fields = ['created_at', 'updated_at', 'funded_at', 'released_at', 'refunded_at']

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'project', 'client', 'freelancer', 'total_amount', 'status', 'due_date']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['invoice_number', 'project__title', 'client__username', 'freelancer__username']
    readonly_fields = ['created_at', 'updated_at', 'paid_at']
