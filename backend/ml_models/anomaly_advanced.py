import numpy as np
from sklearn.ensemble import IsolationForest
from transactions.models import Transaction


def detect_anomalies_advanced(user):
    transactions = list(
        Transaction.objects.filter(user=user, transaction_type='expense')
        .values('id', 'amount', 'description', 'category', 'date')
    )

    if len(transactions) < 5:
        return {'error': 'Not enough transactions to detect anomalies. Add at least 5 expense transactions.'}

    amounts = [float(t['amount']) for t in transactions]
    mean_amount = np.mean(amounts)
    std_amount = np.std(amounts) if np.std(amounts) > 0 else 1

    # Category frequency analysis
    category_counts = {}
    for t in transactions:
        category_counts[t['category']] = category_counts.get(t['category'], 0) + 1

    X = np.array(amounts).reshape(-1, 1)
    model = IsolationForest(contamination=0.2, random_state=42)
    predictions = model.fit_predict(X)

    anomalies = []
    for i, t in enumerate(transactions):
        if predictions[i] == -1:
            amount = float(t['amount'])
            deviation = (amount - mean_amount) / std_amount

            cat_freq = category_counts.get(t['category'], 0) / len(transactions)

            if deviation > 3 or amount > mean_amount * 4:
                risk = 'High'
                reason = f"High risk: Transaction is {amount / mean_amount:.1f}x your average spending of ₹{mean_amount:,.0f}"
            elif deviation > 1.5 or amount > mean_amount * 2.5:
                risk = 'Medium'
                reason = f"Medium risk: Amount is significantly above your usual spending pattern"
            elif cat_freq < 0.05:
                risk = 'Medium'
                reason = f"Medium risk: Unusual category — you rarely spend on {t['category']}"
            else:
                risk = 'Low'
                reason = f"Low risk: Slightly unusual {t['category']} transaction"

            anomalies.append({
                'id': t['id'],
                'amount': amount,
                'description': t['description'],
                'category': t['category'],
                'date': str(t['date']),
                'risk': risk,
                'reason': reason,
            })

    risk_order = {'High': 0, 'Medium': 1, 'Low': 2}
    anomalies.sort(key=lambda x: risk_order[x['risk']])

    high_count = sum(1 for a in anomalies if a['risk'] == 'High')
    medium_count = sum(1 for a in anomalies if a['risk'] == 'Medium')

    return {
        'total_transactions': len(transactions),
        'anomalies_found': len(anomalies),
        'high_risk': high_count,
        'medium_risk': medium_count,
        'anomalies': anomalies,
    }
