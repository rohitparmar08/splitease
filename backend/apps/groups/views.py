from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from drf_spectacular.utils import extend_schema

from .models import Group, GroupMember
from .serializers import (
    GroupSerializer,
    GroupDetailSerializer,
    AddGroupMemberSerializer,
    GroupMemberSerializer
)
from .permissions import IsGroupMember, IsGroupAdmin
from .services import BalanceService
from apps.notifications.models import Notification

User = get_user_model()

class GroupListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GroupSerializer

    def get_queryset(self):
        return Group.objects.filter(memberships__user=self.request.user).order_by('-updated_at')

    @transaction.atomic
    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        # Creator automatically becomes ADMIN in GroupMember
        GroupMember.objects.create(group=group, user=self.request.user, role='ADMIN')

class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]
    serializer_class = GroupDetailSerializer
    queryset = Group.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), IsGroupMember(), IsGroupAdmin()]
        return [permissions.IsAuthenticated(), IsGroupMember()]

class GroupMemberAddView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    @extend_schema(request=AddGroupMemberSerializer)
    def post(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        self.check_object_permissions(request, group)

        serializer = AddGroupMemberSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "message": "Invalid input.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['username_or_email']
        target_user = User.objects.filter(email__iexact=identifier).first() or User.objects.filter(username__iexact=identifier).first()

        if not target_user:
            return Response({
                "success": False,
                "message": f"User '{identifier}' not found.",
                "errors": {"username_or_email": ["No registered user found with this email or username."]}
            }, status=status.HTTP_404_NOT_FOUND)

        if GroupMember.objects.filter(group=group, user=target_user).exists():
            return Response({
                "success": False,
                "message": f"{target_user.full_name} is already a member of this group.",
                "errors": {}
            }, status=status.HTTP_400_BAD_REQUEST)

        member = GroupMember.objects.create(group=group, user=target_user, role='MEMBER')

        # Trigger notification
        Notification.objects.create(
            user=target_user,
            message=f"You were added to the group '{group.name}' by {request.user.full_name}.",
            notification_type='MEMBER_ADDED',
            related_object_id=str(group.id)
        )

        return Response({
            "success": True,
            "message": f"Added {target_user.full_name} to {group.name}.",
            "member": GroupMemberSerializer(member).data
        }, status=status.HTTP_201_CREATED)

class GroupMemberRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember, IsGroupAdmin]

    def delete(self, request, pk, user_id):
        group = get_object_or_404(Group, pk=pk)
        self.check_object_permissions(request, group)

        target_member = get_object_or_404(GroupMember, group=group, user_id=user_id)
        
        # Don't allow removing creator if creator
        if target_member.user == group.created_by and request.user != group.created_by:
            return Response({
                "success": False,
                "message": "Cannot remove group creator.",
                "errors": {}
            }, status=status.HTTP_400_BAD_REQUEST)

        user_name = target_member.user.full_name
        removed_user = target_member.user
        target_member.delete()

        Notification.objects.create(
            user=removed_user,
            message=f"You were removed from the group '{group.name}' by {request.user.full_name}.",
            notification_type='MEMBER_REMOVED',
            related_object_id=str(group.id)
        )

        return Response({
            "success": True,
            "message": f"Removed {user_name} from group."
        }, status=status.HTTP_200_OK)

class GroupBalancesView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        self.check_object_permissions(request, group)

        raw_balances = BalanceService.calculate_raw_balances(group)
        simplified_debts = BalanceService.simplify_debts(group)

        # Build list of member net balance details
        members = GroupMember.objects.filter(group=group).select_related('user')
        member_balances = []
        for m in members:
            net = raw_balances.get(m.user.id, 0)
            member_balances.append({
                "user_id": m.user.id,
                "username": m.user.username,
                "full_name": m.user.full_name,
                "email": m.user.email,
                "avatar": m.user.avatar.url if m.user.avatar else None,
                "net_balance": str(net),
            })

        # Enrich simplified debts with user names & avatars
        users_map = {m.user.id: m.user for m in members}
        enriched_debts = []
        for d in simplified_debts:
            from_u = users_map.get(d['from_user_id'])
            to_u = users_map.get(d['to_user_id'])
            if from_u and to_u:
                enriched_debts.append({
                    "from_user": {
                        "id": from_u.id,
                        "full_name": from_u.full_name,
                        "username": from_u.username,
                        "avatar": from_u.avatar.url if from_u.avatar else None
                    },
                    "to_user": {
                        "id": to_u.id,
                        "full_name": to_u.full_name,
                        "username": to_u.username,
                        "avatar": to_u.avatar.url if to_u.avatar else None
                    },
                    "amount": str(d['amount'])
                })

        return Response({
            "success": True,
            "group_id": group.id,
            "group_name": group.name,
            "member_balances": member_balances,
            "simplified_debts": enriched_debts
        }, status=status.HTTP_200_OK)
