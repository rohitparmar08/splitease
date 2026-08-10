from rest_framework import serializers
from .models import Settlement
from apps.users.serializers import UserSerializer

class SettlementSerializer(serializers.ModelSerializer):
    payer = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Settlement
        fields = [
            'id', 'group', 'group_name', 'payer', 'receiver',
            'amount', 'note', 'settlement_date', 'created_by', 'created_at'
        ]

class SettlementCreateSerializer(serializers.Serializer):
    payer_id = serializers.IntegerField(required=True)
    receiver_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')
    settlement_date = serializers.DateField(required=True)
