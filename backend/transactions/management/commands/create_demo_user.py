import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from transactions.models import Budget, Transaction


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

        transactions = [
            # January 2026
            {'amount': '220.00', 'description': 'Swiggy dinner order', 'category': 'food', 'date': datetime.date(2026, 1, 5)},
            {'amount': '150.00', 'description': 'Uber ride to office', 'category': 'transport', 'date': datetime.date(2026, 1, 8)},
            {'amount': '580.00', 'description': 'Amazon electronics order', 'category': 'shopping', 'date': datetime.date(2026, 1, 12)},
            {'amount': '300.00', 'description': 'Apollo pharmacy medicines', 'category': 'health', 'date': datetime.date(2026, 1, 15)},
            {'amount': '820.00', 'description': 'Electricity bill payment', 'category': 'utilities', 'date': datetime.date(2026, 1, 18)},
            {'amount': '180.00', 'description': 'Zomato lunch order', 'category': 'food', 'date': datetime.date(2026, 1, 22)},
            {'amount': '200.00', 'description': 'Ola cab airport drop', 'category': 'transport', 'date': datetime.date(2026, 1, 25)},
            {'amount': '460.00', 'description': 'Myntra clothing purchase', 'category': 'shopping', 'date': datetime.date(2026, 1, 28)},

            # February 2026
            {'amount': '350.00', 'description': 'BigBasket grocery order', 'category': 'food', 'date': datetime.date(2026, 2, 3)},
            {'amount': '180.00', 'description': 'Metro card recharge', 'category': 'transport', 'date': datetime.date(2026, 2, 6)},
            {'amount': '650.00', 'description': 'Netflix and Spotify subscriptions', 'category': 'entertainment', 'date': datetime.date(2026, 2, 10)},
            {'amount': '420.00', 'description': 'Flipkart sale shopping', 'category': 'shopping', 'date': datetime.date(2026, 2, 14)},
            {'amount': '250.00', 'description': 'Doctor consultation fee', 'category': 'health', 'date': datetime.date(2026, 2, 18)},
            {'amount': '750.00', 'description': 'Gas and internet bill', 'category': 'utilities', 'date': datetime.date(2026, 2, 22)},
            {'amount': '280.00', 'description': 'Dominos pizza delivery', 'category': 'food', 'date': datetime.date(2026, 2, 26)},

            # March 2026
            {'amount': '190.00', 'description': 'Swiggy breakfast order', 'category': 'food', 'date': datetime.date(2026, 3, 1)},
            {'amount': '210.00', 'description': 'Rapido bike taxi ride', 'category': 'transport', 'date': datetime.date(2026, 3, 3)},
            {'amount': '340.00', 'description': 'Croma store purchase', 'category': 'shopping', 'date': datetime.date(2026, 3, 5)},
            {'amount': '160.00', 'description': 'MedPlus pharmacy', 'category': 'health', 'date': datetime.date(2026, 3, 7)},
            # Anomaly — very high amount compared to normal spending
            {'amount': '9200.00', 'description': 'IndiGo flight booking', 'category': 'transport', 'date': datetime.date(2026, 3, 8)},
            {'amount': '700.00', 'description': 'Water and electricity bill', 'category': 'utilities', 'date': datetime.date(2026, 3, 9)},
            {'amount': '240.00', 'description': 'Zomato weekend order', 'category': 'food', 'date': datetime.date(2026, 3, 10)},
            {'amount': '380.00', 'description': 'BookMyShow movie tickets', 'category': 'entertainment', 'date': datetime.date(2026, 3, 11)},
        ]

        for t in transactions:
            Transaction.objects.create(user=user, **t)

        Budget.objects.update_or_create(
            user=user,
            defaults={'monthly_budget': Decimal('5000.00')}
        )

        self.stdout.write(self.style.SUCCESS(
            f'Done - {len(transactions)} transactions, budget Rs.5000 set for demo user'
        ))
