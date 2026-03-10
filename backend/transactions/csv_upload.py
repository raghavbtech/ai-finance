import pandas as pd
from datetime import date
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Transaction


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_csv(request):
    file = request.FILES.get('file')

    if not file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    if not file.name.endswith('.csv'):
        return Response({'error': 'File must be a CSV'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_csv(file)
    except Exception:
        return Response({'error': 'Could not read CSV file'}, status=status.HTTP_400_BAD_REQUEST)

    required_columns = {'amount', 'description', 'category', 'date'}
    if not required_columns.issubset(df.columns):
        missing = required_columns - set(df.columns)
        return Response({'error': f'Missing columns: {missing}'}, status=status.HTTP_400_BAD_REQUEST)

    valid_categories = {'food', 'transport', 'shopping', 'entertainment', 'health', 'utilities', 'other'}
    created = 0
    errors = []

    for i, row in df.iterrows():
        try:
            row_date = pd.to_datetime(row['date']).date()
            if row_date > date.today():
                errors.append(f'Row {i + 1}: Date {row_date} is in the future, skipped.')
                continue

            category = str(row['category']).lower().strip()
            if category not in valid_categories:
                category = 'other'

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
