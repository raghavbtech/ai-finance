import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from transactions.models import Budget, Transaction, Income, EMI, UPIProfile


class Command(BaseCommand):
    help = 'Create demo user with sample transactions across multiple months'

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(username='demo')
        if created:
            user.set_password('demo123')
            user.save()
            self.stdout.write('Demo user created')
        else:
            user.set_password('demo123')
            user.save()
            self.stdout.write('Demo user already exists, resetting data')

        Transaction.objects.filter(user=user).delete()
        Income.objects.filter(user=user).delete()
        EMI.objects.filter(user=user).delete()
        UPIProfile.objects.filter(user=user).delete()

        # Sample expenses
        transactions = [
            # January 2026
            {'amount': '220.00', 'description': 'Swiggy dinner order', 'category': 'food', 'date': datetime.date(2026, 1, 5), 'transaction_type': 'expense'},
            {'amount': '150.00', 'description': 'Uber ride to office', 'category': 'transport', 'date': datetime.date(2026, 1, 8), 'transaction_type': 'expense'},
            {'amount': '580.00', 'description': 'Amazon electronics order', 'category': 'shopping', 'date': datetime.date(2026, 1, 12), 'transaction_type': 'expense'},
            {'amount': '300.00', 'description': 'Apollo pharmacy medicines', 'category': 'health', 'date': datetime.date(2026, 1, 15), 'transaction_type': 'expense'},
            {'amount': '820.00', 'description': 'Electricity bill payment', 'category': 'utilities', 'date': datetime.date(2026, 1, 18), 'transaction_type': 'expense'},
            {'amount': '180.00', 'description': 'Zomato lunch order', 'category': 'food', 'date': datetime.date(2026, 1, 22), 'transaction_type': 'expense'},
            {'amount': '200.00', 'description': 'Ola cab airport drop', 'category': 'transport', 'date': datetime.date(2026, 1, 25), 'transaction_type': 'expense'},
            {'amount': '460.00', 'description': 'Myntra clothing purchase', 'category': 'shopping', 'date': datetime.date(2026, 1, 28), 'transaction_type': 'expense'},

            # February 2026
            {'amount': '350.00', 'description': 'BigBasket grocery order', 'category': 'food', 'date': datetime.date(2026, 2, 3), 'transaction_type': 'expense'},
            {'amount': '180.00', 'description': 'Metro card recharge', 'category': 'transport', 'date': datetime.date(2026, 2, 6), 'transaction_type': 'expense'},
            {'amount': '650.00', 'description': 'Netflix and Spotify subscriptions', 'category': 'entertainment', 'date': datetime.date(2026, 2, 10), 'transaction_type': 'expense'},
            {'amount': '420.00', 'description': 'Flipkart sale shopping', 'category': 'shopping', 'date': datetime.date(2026, 2, 14), 'transaction_type': 'expense'},
            {'amount': '250.00', 'description': 'Doctor consultation fee', 'category': 'health', 'date': datetime.date(2026, 2, 18), 'transaction_type': 'expense'},
            {'amount': '750.00', 'description': 'Gas and internet bill', 'category': 'utilities', 'date': datetime.date(2026, 2, 22), 'transaction_type': 'expense'},
            {'amount': '280.00', 'description': 'Dominos pizza delivery', 'category': 'food', 'date': datetime.date(2026, 2, 26), 'transaction_type': 'expense'},

            # March 2026
            {'amount': '190.00', 'description': 'Swiggy breakfast order', 'category': 'food', 'date': datetime.date(2026, 3, 1), 'transaction_type': 'expense'},
            {'amount': '210.00', 'description': 'Rapido bike taxi ride', 'category': 'transport', 'date': datetime.date(2026, 3, 3), 'transaction_type': 'expense'},
            {'amount': '340.00', 'description': 'Croma store purchase', 'category': 'shopping', 'date': datetime.date(2026, 3, 5), 'transaction_type': 'expense'},
            {'amount': '160.00', 'description': 'MedPlus pharmacy', 'category': 'health', 'date': datetime.date(2026, 3, 7), 'transaction_type': 'expense'},
            # Anomaly — very high amount compared to normal spending
            {'amount': '9200.00', 'description': 'IndiGo flight booking', 'category': 'transport', 'date': datetime.date(2026, 3, 8), 'transaction_type': 'expense'},
            {'amount': '700.00', 'description': 'Water and electricity bill', 'category': 'utilities', 'date': datetime.date(2026, 3, 9), 'transaction_type': 'expense'},
            {'amount': '240.00', 'description': 'Zomato weekend order', 'category': 'food', 'date': datetime.date(2026, 3, 10), 'transaction_type': 'expense'},
            {'amount': '380.00', 'description': 'BookMyShow movie tickets', 'category': 'entertainment', 'date': datetime.date(2026, 3, 11), 'transaction_type': 'expense'},
        ]

        for t in transactions:
            Transaction.objects.create(user=user, **t)

        # Sample incomes
        incomes = [
            {'source': 'salary', 'amount': Decimal('50000.00'), 'date': datetime.date(2026, 1, 1)},
            {'source': 'salary', 'amount': Decimal('50000.00'), 'date': datetime.date(2026, 2, 1)},
            {'source': 'salary', 'amount': Decimal('50000.00'), 'date': datetime.date(2026, 3, 1)},
            {'source': 'freelance', 'amount': Decimal('5000.00'), 'date': datetime.date(2026, 3, 15)},
        ]

        for inc in incomes:
            Income.objects.create(user=user, **inc)

        # Sample EMIs
        emis = [
            {'loan_name': 'Car Loan', 'monthly_amount': Decimal('8000.00'), 'interest_rate': Decimal('8.5'), 'remaining_months': 36},
            {'loan_name': 'Personal Loan', 'monthly_amount': Decimal('5000.00'), 'interest_rate': Decimal('12.0'), 'remaining_months': 24},
        ]

        for emi in emis:
            EMI.objects.create(user=user, **emi)

        # Create UPI Profile
        UPIProfile.objects.update_or_create(
            user=user,
            defaults={'upi_id': 'demo@upi', 'balance': Decimal('10000.00')}
        )

        Budget.objects.update_or_create(
            user=user,
            defaults={'monthly_budget': Decimal('5000.00')}
        )

        self.stdout.write(self.style.SUCCESS(
            f'Done - {len(transactions)} transactions, {len(incomes)} incomes, {len(emis)} EMIs, UPI profile created for demo user'
        ))

