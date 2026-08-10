from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from drf_spectacular.utils import extend_schema

from .models import Settlement
from .serializers import SettlementSerializer, SettlementCreateSerializer
from .services import SettlementService
from apps.groups.models import Group, GroupMember
from apps.groups.permissions import IsGroupMember
from apps.notifications.models import Notification

class GroupSettlementListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    @extend_schema(responses={200: SettlementSerializer(many=True)})
    def get(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        self.check_object_permissions(request, group)

        settlements = Settlement.objects.filter(group=group).select_related('payer', 'receiver', 'created_by', 'group').order_by('-settlement_date', '-created_at')
        serializer = SettlementSerializer(settlements, many=True)
        return Response({"success": True, "settlements": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(request=SettlementCreateSerializer, responses={201: SettlementSerializer})
    @transaction.atomic
    def post(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        self.check_object_permissions(request, group)

        serializer = SettlementCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "message": "Invalid settlement payload.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Enforce non-negative, non-self, member, and over-settlement validations
        validated_amount = SettlementService.validate_settlement(
            group=group,
            payer_id=data['payer_id'],
            receiver_id=data['receiver_id'],
            amount=data['amount']
        )

        settlement = Settlement.objects.create(
            group=group,
            payer_id=data['payer_id'],
            receiver_id=data['receiver_id'],
            amount=validated_amount,
            note=data.get('note', ''),
            settlement_date=data['settlement_date'],
            created_by=request.user
        )

        # Notify receiver
        Notification.objects.create(
            user_id=data['receiver_id'],
            message=f"{settlement.payer.full_name} settled {settlement.amount} with you in '{group.name}'.",
            notification_type='SETTLEMENT_ADDED',
            related_object_id=str(settlement.id)
        )

        return Response({
            "success": True,
            "message": "Settlement recorded successfully.",
            "settlement": SettlementSerializer(settlement).data
        }, status=status.HTTP_201_CREATED)

class UserSettlementListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SettlementSerializer

    def get_queryset(self):
        user = self.request.user
        return Settlement.objects.filter(
            group__memberships__user=user
        ).select_related('payer', 'receiver', 'created_by', 'group').order_by('-settlement_date', '-created_at').distinct()
