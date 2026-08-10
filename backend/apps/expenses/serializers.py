from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Expense, ExpenseShare
from apps.users.serializers import UserSerializer

User = get_user_model()

class ExpenseShareSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ExpenseShare
        fields = ['id', 'user', 'amount', 'percentage', 'shares']

class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    shares = ExpenseShareSerializer(many=True, read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'group', 'group_name', 'title', 'amount',
            'paid_by', 'category', 'split_method', 'notes',
            'expense_date', 'created_by', 'created_at', 'updated_at',
            'shares'
        ]

class ParticipantInputSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    shares = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True)

class ExpenseCreateUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    paid_by_id = serializers.IntegerField(required=True)
    category = serializers.ChoiceField(choices=Expense.CATEGORY_CHOICES, default='food')
    split_method = serializers.ChoiceField(choices=Expense.SPLIT_METHOD_CHOICES, default='EQUAL')
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    expense_date = serializers.DateField(required=True)
    participants = ParticipantInputSerializer(many=True, required=True)
