from django.db import models
from django.contrib.auth.models import User


class Transaction(models.Model):
    CATEGORY_CHOICES = [
        ('food', 'Food'),
        ('transport', 'Transport'),
        ('shopping', 'Shopping'),
        ('entertainment', 'Entertainment'),
        ('health', 'Health'),
        ('utilities', 'Utilities'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    transaction_type = models.CharField(max_length=10, choices=[('expense', 'Expense'), ('income', 'Income')], default='expense')

    def __str__(self):
        return f"{self.user.username} - {self.description} - ₹{self.amount}"

    class Meta:
        ordering = ['-date']


class Budget(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='budget')
    monthly_budget = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.user.username} - ₹{self.monthly_budget}"


class Income(models.Model):
    SOURCE_CHOICES = [
        ('salary', 'Salary'),
        ('freelance', 'Freelance'),
        ('investment', 'Investment'),
        ('bonus', 'Bonus'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incomes')
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.source} - ₹{self.amount}"

    class Meta:
        ordering = ['-date']


class EMI(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emis')
    loan_name = models.CharField(max_length=100)
    monthly_amount = models.DecimalField(max_digits=10, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    remaining_months = models.IntegerField(default=12)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.loan_name} - ₹{self.monthly_amount}"

    class Meta:
        ordering = ['-created_at']


class UPIProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='upi_profile')
    upi_id = models.CharField(max_length=100, unique=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.upi_id} - ₹{self.balance}"


class UPITransaction(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='upi_sent')
    receiver_upi_id = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    transaction_type = models.CharField(max_length=10, choices=[('sent', 'Sent'), ('received', 'Received')])
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} - {self.transaction_type} - ₹{self.amount}"

    class Meta:
        ordering = ['-timestamp']


class UPIRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='upi_requests_sent')
    from_upi = models.CharField(max_length=100)  # UPI ID being asked to pay
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.requester.username} requested ₹{self.amount} from {self.from_upi} [{self.status}]"

    class Meta:
        ordering = ['-created_at']

