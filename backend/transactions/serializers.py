from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Transaction, Budget, Income, EMI, UPIProfile, UPITransaction, UPIRequest


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'description', 'category', 'date', 'transaction_type', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Transaction date cannot be in the future.")
        return value


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['monthly_budget']

    def create(self, validated_data):
        return Budget.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.monthly_budget = validated_data['monthly_budget']
        instance.save()
        return instance


class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = ['id', 'source', 'amount', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Income date cannot be in the future.")
        return value


class EMISerializer(serializers.ModelSerializer):
    class Meta:
        model = EMI
        fields = ['id', 'loan_name', 'monthly_amount', 'interest_rate', 'remaining_months', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_monthly_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Monthly amount must be greater than 0.")
        return value


class UPIProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UPIProfile
        fields = ['upi_id', 'balance']
        read_only_fields = ['balance']


class UPITransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UPITransaction
        fields = ['id', 'receiver_upi_id', 'amount', 'description', 'status', 'transaction_type', 'timestamp']
        read_only_fields = ['id', 'timestamp', 'status']


class UPIRequestSerializer(serializers.ModelSerializer):
    requester_upi = serializers.SerializerMethodField()

    class Meta:
        model = UPIRequest
        fields = ['id', 'requester_upi', 'from_upi', 'amount', 'description', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at', 'requester_upi']

    def get_requester_upi(self, obj):
        try:
            return obj.requester.upi_profile.upi_id
        except Exception:
            return obj.requester.username + '@upi'

