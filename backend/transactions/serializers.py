from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Transaction, Budget


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
        fields = ['id', 'amount', 'description', 'category', 'date', 'created_at']
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
