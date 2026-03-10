from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Transaction, Budget
from .serializers import RegisterSerializer, TransactionSerializer, BudgetSerializer
from ml_models.category_classifier import predict_category


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Account created successfully',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def transactions(request):
    if request.method == 'GET':
        user_transactions = Transaction.objects.filter(user=request.user)
        serializer = TransactionSerializer(user_transactions, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        data = request.data.copy()
        if not data.get('category') or data.get('category') == 'other':
            data['category'] = predict_category(data.get('description', ''))
        serializer = TransactionSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_transaction(request, pk):
    try:
        t = Transaction.objects.get(pk=pk, user=request.user)
    except Transaction.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    t.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def budget_alert(request):
    if request.method == 'POST':
        try:
            budget_obj = Budget.objects.get(user=request.user)
            serializer = BudgetSerializer(budget_obj, data=request.data)
        except Budget.DoesNotExist:
            serializer = BudgetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({'message': 'Budget saved successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        budget_obj = Budget.objects.get(user=request.user)
    except Budget.DoesNotExist:
        return Response({'warning': None, 'budget_set': False})

    today = timezone.now().date()
    this_month = Transaction.objects.filter(
        user=request.user,
        date__year=today.year,
        date__month=today.month
    )
    spent = sum(float(t.amount) for t in this_month)
    budget = float(budget_obj.monthly_budget)
    percent = (spent / budget) * 100 if budget > 0 else 0

    warning = None
    if percent >= 100:
        warning = f"You have exceeded your monthly budget of ₹{budget:.0f}!"
    elif percent >= 80:
        warning = f"Warning: You have used {percent:.0f}% of your monthly budget (₹{budget:.0f})."

    return Response({
        'budget_set': True,
        'monthly_budget': budget,
        'spent_this_month': round(spent, 2),
        'percent_used': round(percent, 1),
        'warning': warning,
    })
