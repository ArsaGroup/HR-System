from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import PortfolioItem
from .serializers import PortfolioItemSerializer

class PortfolioItemList(generics.ListCreateAPIView):
    serializer_class = PortfolioItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return PortfolioItem.objects.filter(user=self.request.user)
        return PortfolioItem.objects.filter(is_public=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PortfolioItemDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PortfolioItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PortfolioItem.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_file(request):
    return Response({'message': 'File upload endpoint'}, status=status.HTTP_200_OK)