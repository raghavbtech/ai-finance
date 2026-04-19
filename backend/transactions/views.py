from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Transaction, Budget, Income, EMI, UPIProfile, UPITransaction, UPIRequest
from .serializers import RegisterSerializer, TransactionSerializer, BudgetSerializer, IncomeSerializer, EMISerializer, UPITransactionSerializer, UPIRequestSerializer
from ml_models.category_classifier import predict_category

DEMO_BLOCKED = Response(
    {'demo': True, 'error': 'This is a demo account. Create your own account for real interactions.'},
    status=status.HTTP_403_FORBIDDEN
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        UPIProfile.objects.create(
            user=user,
            upi_id=f"{user.username}@upi",
            balance=0
        )
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
        if request.user.username == 'demo':
            return DEMO_BLOCKED
        data = request.data.copy()
        data['transaction_type'] = 'expense'
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
    if request.user.username == 'demo':
        return DEMO_BLOCKED
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
        if request.user.username == 'demo':
            return DEMO_BLOCKED
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
        date__month=today.month,
        transaction_type='expense'
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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def incomes(request):
    if request.method == 'GET':
        user_incomes = Income.objects.filter(user=request.user)
        serializer = IncomeSerializer(user_incomes, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        if request.user.username == 'demo':
            return DEMO_BLOCKED
        serializer = IncomeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_income(request, pk):
    if request.user.username == 'demo':
        return DEMO_BLOCKED
    try:
        income_obj = Income.objects.get(pk=pk, user=request.user)
    except Income.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    income_obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def emis(request):
    if request.method == 'GET':
        user_emis = EMI.objects.filter(user=request.user)
        serializer = EMISerializer(user_emis, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        if request.user.username == 'demo':
            return DEMO_BLOCKED
        serializer = EMISerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE', 'PUT'])
@permission_classes([IsAuthenticated])
def emi_detail(request, pk):
    if request.user.username == 'demo':
        return DEMO_BLOCKED
    try:
        emi_obj = EMI.objects.get(pk=pk, user=request.user)
    except EMI.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        emi_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == 'PUT':
        serializer = EMISerializer(emi_obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upi_send(request):
    if request.user.username == 'demo':
        return DEMO_BLOCKED

    receiver_upi = request.data.get('receiver_upi_id')
    amount = float(request.data.get('amount', 0))

    if amount <= 0:
        return Response({'error': 'Amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

    sender_profile, _ = UPIProfile.objects.get_or_create(
        user=request.user,
        defaults={'upi_id': f"{request.user.username}@upi", 'balance': 0}
    )

    total_income = sum(float(i.amount) for i in Income.objects.filter(user=request.user))
    total_sent = sum(float(t.amount) for t in UPITransaction.objects.filter(sender=request.user, transaction_type='sent', status='success'))
    available_balance = max(0, total_income - total_sent)

    if available_balance < amount:
        return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)

    description = request.data.get('description', '')

    # Debit sender
    UPITransaction.objects.create(
        sender=request.user,
        receiver_upi_id=receiver_upi,
        amount=amount,
        description=description,
        transaction_type='sent',
        status='success'
    )
    Transaction.objects.create(
        user=request.user,
        amount=amount,
        description=f"UPI to {receiver_upi}",
        category='other',
        date=timezone.now().date(),
        transaction_type='expense'
    )

    # Credit receiver if they exist on this platform
    try:
        receiver_profile = UPIProfile.objects.get(upi_id=receiver_upi)
        receiver_user = receiver_profile.user
        UPITransaction.objects.create(
            sender=receiver_user,
            receiver_upi_id=receiver_upi,
            amount=amount,
            description=description or f"From {sender_profile.upi_id}",
            transaction_type='received',
            status='success'
        )
        Income.objects.create(
            user=receiver_user,
            source='other',
            amount=amount,
            date=timezone.now().date()
        )
    except UPIProfile.DoesNotExist:
        pass  # External UPI ID, no receiver to credit

    sender_tx = UPITransaction.objects.filter(
        sender=request.user, receiver_upi_id=receiver_upi, transaction_type='sent'
    ).order_by('-timestamp').first()
    serializer = UPITransactionSerializer(sender_tx)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upi_receive(request):
    if request.user.username == 'demo':
        return DEMO_BLOCKED

    profile, _ = UPIProfile.objects.get_or_create(
        user=request.user,
        defaults={'upi_id': f"{request.user.username}@upi", 'balance': 0}
    )

    amount = float(request.data.get('amount', 0))
    if amount <= 0:
        return Response({'error': 'Amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

    transaction = UPITransaction.objects.create(
        sender=request.user,
        receiver_upi_id=profile.upi_id,
        amount=amount,
        description=request.data.get('description', 'Money Received'),
        transaction_type='received',
        status='success'
    )

    Transaction.objects.create(
        user=request.user,
        amount=amount,
        description=f"UPI from {request.data.get('from_upi', 'Unknown')}",
        category='other',
        date=timezone.now().date(),
        transaction_type='income'
    )

    Income.objects.create(
        user=request.user,
        source='other',
        amount=amount,
        date=timezone.now().date()
    )

    serializer = UPITransactionSerializer(transaction)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upi_history(request):
    transactions = UPITransaction.objects.filter(sender=request.user)
    serializer = UPITransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upi_request_money(request):
    """Create a payment request to another UPI ID."""
    if request.user.username == 'demo':
        return DEMO_BLOCKED

    from_upi = request.data.get('from_upi', '').strip()
    amount = float(request.data.get('amount', 0))
    description = request.data.get('description', '').strip()

    if not from_upi:
        return Response({'error': 'Provide a UPI ID to request from'}, status=status.HTTP_400_BAD_REQUEST)
    if amount <= 0:
        return Response({'error': 'Amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

    requester_profile, _ = UPIProfile.objects.get_or_create(
        user=request.user,
        defaults={'upi_id': f"{request.user.username}@upi", 'balance': 0}
    )
    if from_upi == requester_profile.upi_id:
        return Response({'error': 'You cannot request money from yourself'}, status=status.HTTP_400_BAD_REQUEST)

    upi_req = UPIRequest.objects.create(
        requester=request.user,
        from_upi=from_upi,
        amount=amount,
        description=description,
    )
    serializer = UPIRequestSerializer(upi_req)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upi_incoming_requests(request):
    """Get pending payment requests directed at the current user's UPI ID."""
    profile, _ = UPIProfile.objects.get_or_create(
        user=request.user,
        defaults={'upi_id': f"{request.user.username}@upi", 'balance': 0}
    )
    requests = UPIRequest.objects.filter(from_upi=profile.upi_id, status='pending')
    serializer = UPIRequestSerializer(requests, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upi_respond_request(request, pk):
    """Accept or reject an incoming payment request."""
    if request.user.username == 'demo':
        return DEMO_BLOCKED

    profile, _ = UPIProfile.objects.get_or_create(
        user=request.user,
        defaults={'upi_id': f"{request.user.username}@upi", 'balance': 0}
    )

    try:
        upi_req = UPIRequest.objects.get(pk=pk, from_upi=profile.upi_id, status='pending')
    except UPIRequest.DoesNotExist:
        return Response({'error': 'Request not found or already responded'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    if action not in ('accept', 'reject'):
        return Response({'error': 'action must be accept or reject'}, status=status.HTTP_400_BAD_REQUEST)

    if action == 'reject':
        upi_req.status = 'rejected'
        upi_req.save()
        return Response({'message': 'Request rejected'})

    # Accept: check payer's balance
    total_income = sum(float(i.amount) for i in Income.objects.filter(user=request.user))
    total_sent = sum(float(t.amount) for t in UPITransaction.objects.filter(
        sender=request.user, transaction_type='sent', status='success'
    ))
    available = max(0, total_income - total_sent)

    if available < float(upi_req.amount):
        return Response({'error': 'Insufficient balance to accept this request'}, status=status.HTTP_400_BAD_REQUEST)

    # Debit payer
    UPITransaction.objects.create(
        sender=request.user,
        receiver_upi_id=upi_req.requester.upi_profile.upi_id if hasattr(upi_req.requester, 'upi_profile') else f"{upi_req.requester.username}@upi",
        amount=upi_req.amount,
        description=upi_req.description or f"Request from {upi_req.requester.username}",
        transaction_type='sent',
        status='success',
    )
    Transaction.objects.create(
        user=request.user,
        amount=upi_req.amount,
        description=f"UPI request paid to {upi_req.requester.username}",
        category='other',
        date=timezone.now().date(),
        transaction_type='expense',
    )

    # Credit requester
    UPITransaction.objects.create(
        sender=upi_req.requester,
        receiver_upi_id=profile.upi_id,
        amount=upi_req.amount,
        description=upi_req.description or f"Received from {request.user.username}",
        transaction_type='received',
        status='success',
    )
    Income.objects.create(
        user=upi_req.requester,
        source='other',
        amount=upi_req.amount,
        date=timezone.now().date(),
    )

    upi_req.status = 'accepted'
    upi_req.save()
    return Response({'message': 'Request accepted and payment processed'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upi_my_requests(request):
    """Get all requests the current user has sent (to track status)."""
    my_requests = UPIRequest.objects.filter(requester=request.user)
    serializer = UPIRequestSerializer(my_requests, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upi_profile(request):
    profile, _ = UPIProfile.objects.get_or_create(
        user=request.user,
        defaults={'upi_id': f"{request.user.username}@upi", 'balance': 0}
    )
    total_income = sum(float(i.amount) for i in Income.objects.filter(user=request.user))
    total_sent = sum(float(t.amount) for t in UPITransaction.objects.filter(sender=request.user, transaction_type='sent', status='success'))
    balance = max(0, total_income - total_sent)
    return Response({'upi_id': profile.upi_id, 'balance': round(balance, 2)})


