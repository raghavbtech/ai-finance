from django.utils import timezone
from datetime import timedelta
from transactions.models import Transaction, Income, EMI, Budget


CATEGORY_KEYWORDS = {
    'food': ['food', 'eating', 'restaurant', 'meal', 'lunch', 'dinner', 'breakfast', 'groceries', 'grocery'],
    'transport': ['transport', 'travel', 'commute', 'fuel', 'petrol', 'cab', 'uber', 'ola', 'bus', 'train', 'auto'],
    'shopping': ['shopping', 'clothes', 'clothing', 'fashion', 'purchase', 'buy', 'bought'],
    'entertainment': ['entertainment', 'movies', 'movie', 'streaming', 'netflix', 'subscription', 'fun', 'outing'],
    'health': ['health', 'medical', 'medicine', 'doctor', 'hospital', 'pharmacy', 'gym'],
    'utilities': ['utilities', 'electricity', 'water', 'internet', 'phone', 'bill', 'recharge'],
}


def _get_period(q):
    today = timezone.now().date()

    if 'last month' in q or 'previous month' in q:
        first_of_this = today.replace(day=1)
        end = first_of_this - timedelta(days=1)
        start = end.replace(day=1)
        label = 'last month'
    elif 'this year' in q or 'current year' in q:
        start = today.replace(month=1, day=1)
        end = today
        label = 'this year'
    else:
        start = today.replace(day=1)
        end = today
        label = 'this month'

    return start, end, label


def answer_query(user, query: str) -> str:
    q = query.lower().strip()
    period_start, period_end, period_label = _get_period(q)

    expenses = Transaction.objects.filter(
        user=user, transaction_type='expense',
        date__gte=period_start, date__lte=period_end
    )
    incomes = Income.objects.filter(user=user, date__gte=period_start, date__lte=period_end)
    emis = EMI.objects.filter(user=user)

    total_expenses = sum(float(t.amount) for t in expenses)
    total_income = sum(float(i.amount) for i in incomes)
    total_emi = sum(float(e.monthly_amount) for e in emis)

    # Category-specific spending
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in q for kw in keywords):
            if any(w in q for w in ['spend', 'spent', 'much', 'cost', 'paid', 'total', 'how']):
                cat_total = sum(float(t.amount) for t in expenses if t.category == category)
                return f"You spent ₹{cat_total:,.0f} on {category} {period_label}."

    # Income
    if any(w in q for w in ['income', 'earn', 'earned', 'salary', 'how much did i make', 'how much i made']):
        return f"Your total income {period_label} is ₹{total_income:,.0f}."

    # Savings
    if any(w in q for w in ['save', 'saving', 'savings', 'saved', 'how much left']):
        savings = total_income - total_expenses
        if savings >= 0:
            return f"You saved ₹{savings:,.0f} {period_label}."
        else:
            return f"You overspent by ₹{abs(savings):,.0f} {period_label}."

    # EMI
    if any(w in q for w in ['emi', 'loan', 'installment', 'emi burden']):
        count = emis.count()
        if count == 0:
            return "You have no active EMIs."
        return f"Your total EMI is ₹{total_emi:,.0f}/month across {count} loan(s)."

    # General expenses
    if any(w in q for w in ['spend', 'spent', 'expense', 'expenses', 'spending', 'paid', 'total expense']):
        return f"You spent ₹{total_expenses:,.0f} {period_label}."

    # Transaction count
    if any(w in q for w in ['how many', 'count', 'number of transactions', 'transactions']):
        count = expenses.count()
        return f"You made {count} expense transaction(s) {period_label}."

    # Budget
    if any(w in q for w in ['budget', 'remaining', 'left in budget', 'budget left']):
        try:
            budget = Budget.objects.get(user=user)
            budget_amount = float(budget.monthly_budget)
            remaining = budget_amount - total_expenses
            pct = (total_expenses / budget_amount * 100) if budget_amount > 0 else 0
            if remaining >= 0:
                return f"You have ₹{remaining:,.0f} remaining in your budget {period_label} ({pct:.0f}% used)."
            else:
                return f"You have exceeded your budget by ₹{abs(remaining):,.0f} {period_label}."
        except Budget.DoesNotExist:
            return "You haven't set a monthly budget yet. Set one from the dashboard."

    # Top category
    if any(phrase in q for phrase in ['top category', 'most spend', 'biggest category', 'where did i spend most']):
        category_totals = {}
        for t in expenses:
            category_totals[t.category] = category_totals.get(t.category, 0) + float(t.amount)
        if category_totals:
            top = max(category_totals, key=category_totals.get)
            return f"Your biggest spending category {period_label} is {top} (₹{category_totals[top]:,.0f})."
        return f"No expense data found for {period_label}."

    # Net worth / balance
    if any(w in q for w in ['net', 'balance', 'overall']):
        net = total_income - total_expenses - total_emi
        return f"Your net balance {period_label}: Income ₹{total_income:,.0f} − Expenses ₹{total_expenses:,.0f} − EMI ₹{total_emi:,.0f} = ₹{net:,.0f}."

    return (
        "I couldn't understand that. Try asking: "
        "'How much did I spend on food?', "
        "'What is my total EMI?', "
        "'How much did I save this month?', or "
        "'What is my remaining budget?'"
    )
