from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q
from drf_spectacular.utils import extend_schema

from .models import Expense, ExpenseShare
from .serializers import ExpenseSerializer, ExpenseCreateUpdateSerializer
from .services import ExpenseService
from apps.groups.models import Group, GroupMember
from apps.groups.permissions import IsGroupMember
from apps.notifications.models import Notification

class GroupExpenseListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    @extend_schema(responses={200: ExpenseSerializer(many=True)})
    def get(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        self.check_object_permissions(request, group)

        queryset = Expense.objects.filter(group=group).select_related('paid_by', 'created_by', 'group').prefetch_related('shares__user').order_by('-expense_date', '-created_at')

        # Optional filters
        search = request.query_params.get('search', '').strip()
        category = request.query_params.get('category', '').strip()

        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(notes__icontains=search))
        if category:
            queryset = queryset.filter(category=category)

        serializer = ExpenseSerializer(queryset, many=True)
        return Response({"success": True, "expenses": serializer.data}, status=status.HTTP_200_OK)

    @extend_schema(request=ExpenseCreateUpdateSerializer, responses={201: ExpenseSerializer})
    @transaction.atomic
    def post(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        self.check_object_permissions(request, group)

        serializer = ExpenseCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "message": "Invalid expense payload.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        member_ids = set(GroupMember.objects.filter(group=group).values_list('user_id', flat=True))

        # Validate and compute shares strictly via ExpenseService backend engine
        calculated_shares = ExpenseService.validate_and_calculate_shares(
            amount=data['amount'],
            split_method=data['split_method'],
            paid_by_id=data['paid_by_id'],
            participants_data=data['participants'],
            group_member_ids=member_ids
        )

        expense = Expense.objects.create(
            group=group,
            title=data['title'],
            amount=data['amount'],
            paid_by_id=data['paid_by_id'],
            category=data['category'],
            split_method=data['split_method'],
            notes=data.get('notes', ''),
            expense_date=data['expense_date'],
            created_by=request.user
        )

        # Save individual calculated shares
        share_objects = [
            ExpenseShare(
                expense=expense,
                user_id=s['user_id'],
                amount=s['amount'],
                percentage=s['percentage'],
                shares=s['shares']
            )
            for s in calculated_shares
        ]
        ExpenseShare.objects.bulk_create(share_objects)

        # Notify participants
        for s in calculated_shares:
            if s['user_id'] != request.user.id:
                Notification.objects.create(
                    user_id=s['user_id'],
                    message=f"{request.user.full_name} added an expense '{expense.title}' ({expense.amount}) in '{group.name}'.",
                    notification_type='EXPENSE_ADDED',
                    related_object_id=str(expense.id)
                )

        return Response({
            "success": True,
            "message": "Expense created successfully.",
            "expense": ExpenseSerializer(expense).data
        }, status=status.HTTP_201_CREATED)

class ExpenseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        expense = get_object_or_404(Expense, pk=pk)
        # Verify user is member of expense group
        if not GroupMember.objects.filter(group=expense.group, user=self.request.user).exists():
            self.permission_denied(self.request, message="You are not a member of this group.")
        return expense

    @extend_schema(responses={200: ExpenseSerializer})
    def get(self, request, pk):
        expense = self.get_object(pk)
        return Response({"success": True, "expense": ExpenseSerializer(expense).data}, status=status.HTTP_200_OK)

    @extend_schema(request=ExpenseCreateUpdateSerializer, responses={200: ExpenseSerializer})
    @transaction.atomic
    def patch(self, request, pk):
        expense = self.get_object(pk)

        serializer = ExpenseCreateUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"success": False, "message": "Invalid expense payload.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        member_ids = set(GroupMember.objects.filter(group=expense.group).values_list('user_id', flat=True))

        amount = data.get('amount', expense.amount)
        split_method = data.get('split_method', expense.split_method)
        paid_by_id = data.get('paid_by_id', expense.paid_by_id)
        participants = data.get('participants', [
            {'user_id': s.user_id, 'amount': s.amount, 'percentage': s.percentage, 'shares': s.shares}
            for s in expense.shares.all()
        ])

        calculated_shares = ExpenseService.validate_and_calculate_shares(
            amount=amount,
            split_method=split_method,
            paid_by_id=paid_by_id,
            participants_data=participants,
            group_member_ids=member_ids
        )

        expense.title = data.get('title', expense.title)
        expense.amount = amount
        expense.paid_by_id = paid_by_id
        expense.category = data.get('category', expense.category)
        expense.split_method = split_method
        expense.notes = data.get('notes', expense.notes)
        expense.expense_date = data.get('expense_date', expense.expense_date)
        expense.save()

        # Re-create shares to update balance calculations atomically
        expense.shares.all().delete()
        share_objects = [
            ExpenseShare(
                expense=expense,
                user_id=s['user_id'],
                amount=s['amount'],
                percentage=s['percentage'],
                shares=s['shares']
            )
            for s in calculated_shares
        ]
        ExpenseShare.objects.bulk_create(share_objects)

        # Notify participants of update
        for s in calculated_shares:
            if s['user_id'] != request.user.id:
                Notification.objects.create(
                    user_id=s['user_id'],
                    message=f"{request.user.full_name} updated the expense '{expense.title}' in '{expense.group.name}'.",
                    notification_type='EXPENSE_UPDATED',
                    related_object_id=str(expense.id)
                )

        return Response({
            "success": True,
            "message": "Expense updated successfully.",
            "expense": ExpenseSerializer(expense).data
        }, status=status.HTTP_200_OK)

    @transaction.atomic
    def delete(self, request, pk):
        expense = self.get_object(pk)
        title = expense.title
        group_name = expense.group.name
        expense.delete()
        return Response({
            "success": True,
            "message": f"Expense '{title}' deleted from '{group_name}'."
        }, status=status.HTTP_200_OK)

class ExpenseHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        user_group_ids = GroupMember.objects.filter(user=self.request.user).values_list('group_id', flat=True)
        queryset = Expense.objects.filter(group_id__in=user_group_ids).select_related('paid_by', 'created_by', 'group').prefetch_related('shares__user')

        group_id = self.request.query_params.get('group', '').strip()
        category = self.request.query_params.get('category', '').strip()
        search = self.request.query_params.get('search', '').strip()
        sort_by = self.request.query_params.get('sort', '-expense_date').strip()

        if group_id:
            queryset = queryset.filter(group_id=group_id)
        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(notes__icontains=search))

        allowed_sorts = ['expense_date', '-expense_date', 'amount', '-amount', 'created_at', '-created_at']
        if sort_by in allowed_sorts:
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by('-expense_date', '-created_at')

        return queryset
