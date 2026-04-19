from django.utils import timezone
from datetime import timedelta
from transactions.models import Transaction, Income, EMI, Budget


def calculate_health_score(user):
    """
    Calculate financial health score (0-100) based on:
    - Savings ratio (30 points)
    - EMI burden (20 points)
    - Spending consistency (20 points)
    - Anomaly frequency (15 points)
    - Budget adherence (15 points)
    """
    score = 0

    # Get this month's data
    today = timezone.now().date()
    month_start = today.replace(day=1)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    expenses = Transaction.objects.filter(
        user=user,
        date__gte=month_start,
        date__lte=month_end,
        transaction_type='expense'
    )
    incomes = Income.objects.filter(
        user=user,
        date__gte=month_start,
        date__lte=month_end
    )

    total_expenses = sum(float(t.amount) for t in expenses)
    total_income = sum(float(i.amount) for i in incomes)

    # 1. Savings ratio (0-30 points)
    if total_income > 0:
        savings_ratio = (total_income - total_expenses) / total_income
        if savings_ratio >= 0.3:
            score += 30
        elif savings_ratio >= 0.2:
            score += 25
        elif savings_ratio >= 0.1:
            score += 20
        elif savings_ratio >= 0:
            score += 10
    else:
        score += 0

    # 2. EMI burden (0-20 points)
    emis = EMI.objects.filter(user=user)
    total_emi = sum(float(e.monthly_amount) for e in emis)
    if total_income > 0:
        emi_burden = (total_emi / total_income) * 100
        if emi_burden <= 20:
            score += 20
        elif emi_burden <= 30:
            score += 15
        elif emi_burden <= 40:
            score += 10
        else:
            score += 5
    else:
        score += 0

    # 3. Spending consistency (0-20 points)
    # Check last 3 months
    last_3_months = []
    for i in range(3):
        month = month_start - timedelta(days=30 * i)
        month_expenses = Transaction.objects.filter(
            user=user,
            date__month=month.month,
            date__year=month.year,
            transaction_type='expense'
        )
        last_3_months.append(sum(float(t.amount) for t in month_expenses))

    if len(last_3_months) > 1:
        avg_spending = sum(last_3_months) / len(last_3_months)
        variance = sum((x - avg_spending) ** 2 for x in last_3_months) / len(last_3_months)
        std_dev = variance ** 0.5

        if std_dev < avg_spending * 0.1:  # Low variance
            score += 20
        elif std_dev < avg_spending * 0.2:
            score += 15
        elif std_dev < avg_spending * 0.3:
            score += 10
        else:
            score += 5

    # 4. Budget adherence (0-15 points)
    try:
        budget = Budget.objects.get(user=user)
        budget_amount = float(budget.monthly_budget)
        if budget_amount > 0:
            budget_percent = (total_expenses / budget_amount) * 100
            if budget_percent <= 80:
                score += 15
            elif budget_percent <= 100:
                score += 10
            elif budget_percent <= 120:
                score += 5
            else:
                score += 0
    except Budget.DoesNotExist:
        score += 8  # Partial credit if no budget set

    # 5. Anomaly penalty (0-15 points)
    from ml_models.anomaly import detect_anomalies
    anomaly_result = detect_anomalies(user)
    if 'error' in anomaly_result:
        score += 15  # No anomalies detectable yet, give full points
    else:
        anomaly_list = anomaly_result.get('anomalies', [])
        if len(anomaly_list) == 0:
            score += 15
        elif len(anomaly_list) <= 2:
            score += 10
        elif len(anomaly_list) <= 5:
            score += 5
        else:
            score += 0

    # Ensure score is between 0 and 100
    score = min(100, max(0, score))

    # Determine category
    if score >= 80:
        category = 'Excellent'
    elif score >= 60:
        category = 'Good'
    elif score >= 40:
        category = 'Average'
    else:
        category = 'Poor'

    # Build reason string
    reasons = []
    if total_income > 0:
        sr = (total_income - total_expenses) / total_income * 100
        if sr < 10:
            reasons.append('low savings ratio')
        if total_emi > 0:
            eb = (total_emi / total_income) * 100
            if eb > 40:
                reasons.append('high EMI burden')
    if not reasons:
        reasons.append('good overall financial habits')
    reason = 'Score affected by: ' + ' and '.join(reasons) if score < 80 else 'Excellent financial management'

    return {
        'score': round(score, 1),
        'category': category,
        'reason': reason,
        'savings_ratio': round((total_income - total_expenses) / total_income * 100, 1) if total_income > 0 else 0,
        'emi_burden': round((total_emi / total_income) * 100, 1) if total_income > 0 else 0,
        'monthly_income': round(total_income, 2),
        'monthly_expense': round(total_expenses, 2),
    }
