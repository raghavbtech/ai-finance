import numpy as np
from sklearn.ensemble import IsolationForest
from transactions.models import Transaction


def detect_anomalies(user):
    transactions = Transaction.objects.filter(user=user).values('id', 'amount', 'description', 'category', 'date')

    if len(transactions) < 5:
        return {'error': 'Not enough transactions to detect anomalies. Add at least 5.'}

    amounts = np.array([float(t['amount']) for t in transactions]).reshape(-1, 1)

    model = IsolationForest(contamination=0.2, random_state=42)
    predictions = model.fit_predict(amounts)

    anomalies = []
    for i, t in enumerate(transactions):
        if predictions[i] == -1:
            anomalies.append({
                'id': t['id'],
                'amount': float(t['amount']),
                'description': t['description'],
                'category': t['category'],
                'date': str(t['date']),
                'reason': 'Unusual transaction amount detected'
            })

    return {
        'total_transactions': len(transactions),
        'anomalies_found': len(anomalies),
        'anomalies': anomalies
    }
