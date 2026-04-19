from django.utils import timezone
from transactions.models import Transaction, Income, EMI, Budget


def generate_advice(user):
    today = timezone.now().date()
    month_start = today.replace(day=1)

    expenses = Transaction.objects.filter(user=user, date__gte=month_start, transaction_type='expense')
    incomes = Income.objects.filter(user=user, date__gte=month_start)
    emis = EMI.objects.filter(user=user)

    total_expenses = sum(float(t.amount) for t in expenses)
    total_income = sum(float(i.amount) for i in incomes)
    total_emi = sum(float(e.monthly_amount) for e in emis)
    savings = total_income - total_expenses

    category_totals = {}
    for t in expenses:
        category_totals[t.category] = category_totals.get(t.category, 0) + float(t.amount)

    advice = []

    # Savings ratio check
    if total_income > 0:
        savings_pct = (savings / total_income) * 100
        if savings_pct < 0:
            advice.append({
                'type': 'danger',
                'message': f"You are spending ₹{abs(savings):,.0f} more than you earn this month. Cut non-essential expenses immediately."
            })
        elif savings_pct < 10:
            advice.append({
                'type': 'warning',
                'message': f"Your savings rate is only {savings_pct:.0f}% this month. Aim for at least 20% to build financial security."
            })
        elif savings_pct >= 30:
            advice.append({
                'type': 'success',
                'message': f"Excellent! You are saving {savings_pct:.0f}% of your income this month. Keep it up."
            })

    # Category overspending
    if total_expenses > 0:
        for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
            pct = (amount / total_expenses) * 100
            if pct > 40:
                advice.append({
                    'type': 'warning',
                    'message': f"You are overspending in {category} — it accounts for {pct:.0f}% of your total expenses this month."
                })
            elif pct > 25 and category in ('food', 'entertainment', 'shopping'):
                advice.append({
                    'type': 'info',
                    'message': f"{category.capitalize()} is your second biggest category at {pct:.0f}% of spending."
                })

    # Savings tips by category
    if total_income > 0:
        food_amount = category_totals.get('food', 0)
        entertainment_amount = category_totals.get('entertainment', 0)

        if food_amount > total_income * 0.15:
            saving = food_amount * 0.2
            advice.append({
                'type': 'tip',
                'message': f"Reducing food spending by 20% could save you ₹{saving:,.0f} this month."
            })
        if entertainment_amount > total_income * 0.1:
            saving = entertainment_amount * 0.3
            advice.append({
                'type': 'tip',
                'message': f"Trimming entertainment by 30% would save ₹{saving:,.0f} per month."
            })

    # EMI burden
    if total_income > 0 and total_emi > 0:
        emi_pct = (total_emi / total_income) * 100
        if emi_pct > 40:
            advice.append({
                'type': 'danger',
                'message': f"Your EMI burden is ₹{total_emi:,.0f}/month ({emi_pct:.0f}% of income). This is dangerously high — try prepaying loans."
            })
        elif emi_pct > 30:
            advice.append({
                'type': 'warning',
                'message': f"EMI payments consume {emi_pct:.0f}% of your income. Financial advisors recommend keeping this under 30%."
            })

    # Budget check
    try:
        budget = Budget.objects.get(user=user)
        budget_amount = float(budget.monthly_budget)
        if budget_amount > 0:
            used_pct = (total_expenses / budget_amount) * 100
            remaining = budget_amount - total_expenses
            if used_pct >= 100:
                advice.append({
                    'type': 'danger',
                    'message': f"You have exceeded your monthly budget of ₹{budget_amount:,.0f} by ₹{abs(remaining):,.0f}."
                })
            elif used_pct >= 80:
                advice.append({
                    'type': 'warning',
                    'message': f"You have used {used_pct:.0f}% of your budget. Only ₹{remaining:,.0f} remaining for the rest of the month."
                })
    except Budget.DoesNotExist:
        advice.append({
            'type': 'tip',
            'message': "Set a monthly budget to better track and control your spending."
        })

    if not advice:
        advice.append({
            'type': 'success',
            'message': "Your finances look healthy this month. No concerns detected."
        })

    return {'advice': advice}
