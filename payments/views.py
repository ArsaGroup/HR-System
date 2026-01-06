from datetime import timedelta
from decimal import Decimal
from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import PaymentMethod, Wallet, Transaction, Escrow, Invoice
from .serializers import (
    PaymentMethodSerializer, WalletSerializer, TransactionSerializer,
    EscrowSerializer, InvoiceSerializer
)

class PaymentMethodList(generics.ListCreateAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PaymentMethodDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

class WalletDetail(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        wallet, created = Wallet.objects.get_or_create(user=self.request.user)
        return wallet

class TransactionList(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['transaction_type', 'status', 'project']
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')

class TransactionDetail(generics.RetrieveAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_escrow(request):
    from projects.models import Project
    from proposals.models import Proposal
    
    project_id = request.data.get('project_id')
    proposal_id = request.data.get('proposal_id')
    
    try:
        project = Project.objects.get(id=project_id, client=request.user)
        proposal = Proposal.objects.get(id=proposal_id, project=project, status='accepted')
        
        # Check if escrow already exists
        if Escrow.objects.filter(project=project).exists():
            return Response({'error': 'Escrow already exists for this project'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate platform fee (e.g., 10%)
        platform_fee_rate = Decimal('0.10')
        platform_fee = proposal.proposed_price * platform_fee_rate
        freelancer_amount = proposal.proposed_price - platform_fee
        
        escrow = Escrow.objects.create(
            project=project,
            proposal=proposal,
            client=request.user,
            freelancer=proposal.freelancer,
            amount=proposal.proposed_price,
            currency=proposal.currency,
            platform_fee=platform_fee,
            freelancer_amount=freelancer_amount,
            status='pending'
        )
        
        serializer = EscrowSerializer(escrow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    except Proposal.DoesNotExist:
        return Response({'error': 'Proposal not found'}, status=status.HTTP_404_NOT_FOUND)

class EscrowDetail(generics.RetrieveAPIView):
    serializer_class = EscrowSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Escrow.objects.filter(
            Q(client=self.request.user) | Q(freelancer=self.request.user)
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def fund_escrow(request, pk):
    try:
        escrow = Escrow.objects.get(pk=pk, client=request.user)
        if escrow.status != 'pending':
            return Response({'error': 'Escrow cannot be funded'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transaction for escrow hold
        transaction = Transaction.objects.create(
            user=request.user,
            transaction_type='escrow_hold',
            status='completed',
            amount=escrow.amount,
            currency=escrow.currency,
            net_amount=escrow.amount,
            project=escrow.project,
            description=f'Escrow hold for project: {escrow.project.title}'
        )
        
        # Update escrow status
        from django.utils import timezone
        escrow.status = 'funded'
        escrow.funded_at = timezone.now()
        escrow.save()
        
        return Response({'message': 'Escrow funded successfully'}, status=status.HTTP_200_OK)
    except Escrow.DoesNotExist:
        return Response({'error': 'Escrow not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def release_escrow(request, pk):
    try:
        escrow = Escrow.objects.get(pk=pk, client=request.user)
        if escrow.status != 'funded':
            return Response({'error': 'Escrow cannot be released'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create transactions
        from django.utils import timezone
        
        # Release to freelancer
        Transaction.objects.create(
            user=escrow.freelancer,
            transaction_type='escrow_release',
            status='completed',
            amount=escrow.freelancer_amount,
            currency=escrow.currency,
            net_amount=escrow.freelancer_amount,
            project=escrow.project,
            description=f'Payment for project: {escrow.project.title}'
        )
        
        # Platform commission
        Transaction.objects.create(
            user=escrow.client,
            transaction_type='commission',
            status='completed',
            amount=escrow.platform_fee,
            currency=escrow.currency,
            net_amount=escrow.platform_fee,
            project=escrow.project,
            description=f'Platform commission for project: {escrow.project.title}'
        )
        
        # Update escrow
        escrow.status = 'released'
        escrow.released_at = timezone.now()
        escrow.save()
        
        # Update project status
        escrow.project.status = 'completed'
        escrow.project.save(update_fields=['status'])
        
        return Response({'message': 'Escrow released successfully'}, status=status.HTTP_200_OK)
    except Escrow.DoesNotExist:
        return Response({'error': 'Escrow not found'}, status=status.HTTP_404_NOT_FOUND)

class InvoiceList(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'project']
    
    def get_queryset(self):
        return Invoice.objects.filter(
            Q(client=self.request.user) | Q(freelancer=self.request.user)
        ).order_by('-created_at')

class InvoiceDetail(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Invoice.objects.filter(
            Q(client=self.request.user) | Q(freelancer=self.request.user)
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def provider_earnings(request):
    """
    Aggregate earnings insights for service providers, including online/offline mode boost.
    """
    if request.user.user_type != 'service_provider':
        return Response({'detail': 'Earnings dashboard is only available to service providers.'},
                        status=status.HTTP_403_FORBIDDEN)
    
    profile = getattr(request.user, 'profile', None)
    payouts = Transaction.objects.filter(
        user=request.user,
        transaction_type='escrow_release',
        status='completed'
    )
    
    total_earnings = payouts.aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')
    last_30_days = payouts.filter(
        created_at__gte=timezone.now() - timedelta(days=30)
    ).aggregate(total=Sum('net_amount'))['total'] or Decimal('0.00')
    
    outstanding = Escrow.objects.filter(
        freelancer=request.user,
        status__in=['funded', 'in_progress']
    ).aggregate(total=Sum('freelancer_amount'))['total'] or Decimal('0.00')
    
    monthly_qs = payouts.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        total=Sum('net_amount')
    ).order_by('month')
    
    top_projects_qs = payouts.filter(
        project__isnull=False
    ).values('project__title').annotate(
        total=Sum('net_amount')
    ).order_by('-total')[:5]
    
    data = {
        'summary': {
            'lifetime': float(total_earnings),
            'last_30_days': float(last_30_days),
            'outstanding': float(outstanding or Decimal('0.00')),
        },
        'mode': {
            'provider_mode': getattr(profile, 'provider_mode', 'offline'),
            'base_hourly_rate': float(getattr(profile, 'base_hourly_rate', Decimal('0.00'))),
            'effective_hourly_rate': float(profile.effective_hourly_rate) if profile else 0.0,
            'mode_multiplier': float(profile.get_mode_multiplier()) if profile else 1.0,
        },
        'monthly_trend': [
            {
                'month': entry['month'].strftime('%Y-%m') if entry['month'] else 'N/A',
                'total': float(entry['total'] or Decimal('0.00'))
            }
            for entry in monthly_qs
        ],
        'top_projects': [
            {
                'title': entry['project__title'] or 'Untitled Project',
                'earned': float(entry['total'] or Decimal('0.00'))
            }
            for entry in top_projects_qs
        ]
    }
    
    return Response(data, status=status.HTTP_200_OK)
