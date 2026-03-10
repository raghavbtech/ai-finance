import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from transactions.models import Transaction


def predict_next_month(user):
    transactions = Transaction.objects.filter(user=user).values('amount', 'date')

    if len(transactions) < 3:
        return {'error': 'Not enough transactions to make a prediction. Add at least 3.'}

    df = pd.DataFrame(transactions)
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = df['amount'].astype(float)
    df['month'] = df['date'].dt.to_period('M')

    monthly = df.groupby('month')['amount'].sum().reset_index()
    monthly = monthly.sort_values('month')

    if len(monthly) < 2:
        return {'error': 'Need transactions across at least 2 different months for prediction.'}

    X = np.arange(len(monthly)).reshape(-1, 1)
    y = monthly['amount'].values

    model = LinearRegression()
    model.fit(X, y)

    next_month_index = np.array([[len(monthly)]])
    predicted = model.predict(next_month_index)[0]
    last_month_total = float(y[-1])
    if predicted <= 0:
        predicted = last_month_total
    predicted = round(predicted, 2)

    history = [
        {'month': str(row['month']), 'total': round(row['amount'], 2)}
        for _, row in monthly.iterrows()
    ]

    return {
        'history': history,
        'predicted_next_month': predicted,
        'message': f'Predicted next month spending: ₹{predicted}'
    }
