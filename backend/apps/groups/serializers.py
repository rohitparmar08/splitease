from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Sum
from .models import Group, GroupMember
from apps.users.serializers import UserSerializer

User = get_user_model()

class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = GroupMember
        fields = ['id', 'user', 'role', 'joined_at']

class GroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    total_expenses = serializers.SerializerMethodField()
    user_net_balance = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'image',
            'created_by', 'created_at', 'updated_at',
            'members_count', 'total_expenses', 'user_net_balance'
        ]

    def get_members_count(self, obj):
        return obj.memberships.count()

    def get_total_expenses(self, obj):
        from apps.expenses.models import Expense
        total = Expense.objects.filter(group=obj).aggregate(total=Sum('amount'))['total']
        return str(total) if total is not None else "0.00"

    def get_user_net_balance(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .services import BalanceService
            raw_balances = BalanceService.calculate_raw_balances(obj)
            net = raw_balances.get(request.user.id, 0)
            return str(net)
        return "0.00"

class GroupDetailSerializer(GroupSerializer):
    members = GroupMemberSerializer(source='memberships', many=True, read_only=True)

    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields + ['members']

class AddGroupMemberSerializer(serializers.Serializer):
    username_or_email = serializers.CharField(required=True)
