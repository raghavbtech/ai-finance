from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from transactions.models import Transaction
from .anomaly import detect_anomalies
from .prediction import predict_next_month


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def anomalies(request):
    result = detect_anomalies(request.user)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def predictions(request):
    result = predict_next_month(request.user)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    today = timezone.now().date()
    all_transactions = Transaction.objects.filter(user=request.user)
    this_month = all_transactions.filter(date__year=today.year, date__month=today.month)

    total_spending = sum(float(t.amount) for t in this_month)
    transaction_count = this_month.count()

    category_totals = {}
    for t in this_month:
        category_totals[t.category] = category_totals.get(t.category, 0) + float(t.amount)
    top_category = max(category_totals, key=category_totals.get) if category_totals else 'N/A'

    prediction_result = predict_next_month(request.user)
    prediction = prediction_result.get('predicted_next_month', 0)

    return Response({
        'total_spending': round(total_spending, 2),
        'transaction_count': transaction_count,
        'top_category': top_category.capitalize(),
        'prediction': prediction,
    })
