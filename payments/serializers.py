from rest_framework import serializers
from .models import PaymentMethod, Wallet, Transaction, Escrow, Invoice
from users.serializers import UserSerializer
from projects.serializers import ProjectSerializer
from proposals.serializers import ProposalSerializer

class PaymentMethodSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PaymentMethod
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class WalletSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Wallet
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class TransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    proposal = ProposalSerializer(read_only=True)
    payment_method = PaymentMethodSerializer(read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'completed_at')

class EscrowSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    proposal = ProposalSerializer(read_only=True)
    client = UserSerializer(read_only=True)
    freelancer = UserSerializer(read_only=True)
    
    class Meta:
        model = Escrow
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'funded_at', 'released_at', 'refunded_at')

class InvoiceSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    proposal = ProposalSerializer(read_only=True)
    client = UserSerializer(read_only=True)
    freelancer = UserSerializer(read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('invoice_number', 'created_at', 'updated_at', 'paid_at')

