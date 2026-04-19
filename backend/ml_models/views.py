from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from transactions.models import Transaction, Income, EMI
from .anomaly import detect_anomalies
from .prediction import predict_next_month
from .health_score import calculate_health_score
from .advisor import generate_advice
from .anomaly_advanced import detect_anomalies_advanced
from .nlp_query import answer_query


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
    all_transactions = Transaction.objects.filter(user=request.user, transaction_type='expense')
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_score(request):
    result = calculate_health_score(request.user)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_advisor(request):
    result = generate_advice(request.user)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_anomalies(request):
    result = detect_anomalies_advanced(request.user)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_health_score(request):
    result = calculate_health_score(request.user)
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_query(request):
    query = request.data.get('query', '').strip()
    if not query:
        return Response({'error': 'Query cannot be empty'}, status=400)
    answer = answer_query(request.user, query)
    return Response({'answer': answer})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def financial_summary(request):
    today = timezone.now().date()
    month_start = today.replace(day=1)

    expenses = Transaction.objects.filter(
        user=request.user,
        date__gte=month_start,
        transaction_type='expense'
    )
    incomes = Income.objects.filter(
        user=request.user,
        date__gte=month_start
    )
    emis = EMI.objects.filter(user=request.user)

    total_expenses = sum(float(t.amount) for t in expenses)
    total_income = sum(float(i.amount) for i in incomes)
    total_emi = sum(float(e.monthly_amount) for e in emis)
    net_savings = total_income - total_expenses - total_emi

    return Response({
        'total_income': round(total_income, 2),
        'total_expenses': round(total_expenses, 2),
        'total_emi': round(total_emi, 2),
        'net_savings': round(net_savings, 2),
        'emi_count': emis.count(),
    })

