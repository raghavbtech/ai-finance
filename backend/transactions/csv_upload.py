import pandas as pd
from datetime import date
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Transaction
from ml_models.category_classifier import predict_category


def is_bank_statement(columns):
    bank_cols = {'date', 'details', 'debit'}
    return bank_cols.issubset(set(c.lower().strip() for c in columns))


def normalize_bank_statement(df):
    df.columns = [c.lower().strip() for c in df.columns]

    rows = []
    for _, row in df.iterrows():
        debit = row.get('debit', '')
        if pd.isna(debit) or str(debit).strip() == '':
            continue

        try:
            amount = float(str(debit).replace(',', '').strip())
            if amount <= 0:
                continue
        except ValueError:
            continue

        description = str(row.get('details', '')).strip()
        if not description:
            continue

        rows.append({
            'date': row['date'],
            'description': description,
            'amount': amount,
            'category': predict_category(description),
        })

    return pd.DataFrame(rows)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_csv(request):
    if request.user.username == 'demo':
        from rest_framework import status as drf_status
        return Response(
            {'demo': True, 'error': 'This is a demo account. Create your own account for real interactions.'},
            status=drf_status.HTTP_403_FORBIDDEN
        )
    file = request.FILES.get('file')

    if not file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    if not file.name.endswith('.csv'):
        return Response({'error': 'File must be a CSV'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_csv(file)
    except Exception:
        return Response({'error': 'Could not read CSV file'}, status=status.HTTP_400_BAD_REQUEST)

    if is_bank_statement(df.columns):
        df = normalize_bank_statement(df)
        if df.empty:
            return Response({'error': 'No debit transactions found in bank statement'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        required_columns = {'amount', 'description', 'category', 'date'}
        if not required_columns.issubset(df.columns):
            missing = required_columns - set(df.columns)
            return Response({'error': f'Missing columns: {missing}'}, status=status.HTTP_400_BAD_REQUEST)

    valid_categories = {'food', 'transport', 'shopping', 'entertainment', 'health', 'utilities', 'other'}
    created = 0
    errors = []

    for i, row in df.iterrows():
        try:
            row_date = pd.to_datetime(row['date'], dayfirst=True).date()
            if row_date > date.today():
                errors.append(f'Row {i + 1}: Date {row_date} is in the future, skipped.')
                continue

            category = str(row.get('category', 'other')).lower().strip()
            if category not in valid_categories:
                category = predict_category(str(row.get('description', '')))

            Transaction.objects.create(
                user=request.user,
                amount=row['amount'],
                description=str(row['description']).strip(),
                category=category,
                date=row_date,
            )
            created += 1
        except Exception as e:
            errors.append(f'Row {i + 1}: {str(e)}')

    return Response({
        'message': f'{created} transactions imported successfully',
        'errors': errors
    }, status=status.HTTP_201_CREATED)
