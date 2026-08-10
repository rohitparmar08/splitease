from decimal import Decimal
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Avg, Max, Count
from django.db.models.functions import TruncMonth
from drf_spectacular.utils import extend_schema

from apps.groups.models import Group, GroupMember
from apps.groups.services import BalanceService
from apps.groups.permissions import IsGroupMember
from apps.expenses.models import Expense, ExpenseShare
from apps.expenses.serializers import ExpenseSerializer

class DashboardAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        user_groups = Group.objects.filter(memberships__user=user)

        total_expenses = Decimal('0.00')
        you_owe = Decimal('0.00')
        you_are_owed = Decimal('0.00')
        pending_settlements = []

        for group in user_groups:
            # Aggregate total group expenses
            grp_total = Expense.objects.filter(group=group).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            total_expenses += Decimal(str(grp_total))

            raw_balances = BalanceService.calculate_raw_balances(group)
            user_net = raw_balances.get(user.id, Decimal('0.00'))

            if user_net < Decimal('-0.005'):
                you_owe += (-user_net)
            elif user_net > Decimal('0.005'):
                you_are_owed += user_net

            # Get simplified debt transfers involving this user
            simplified = BalanceService.simplify_debts(group)
            members_map = {m.user.id: m.user for m in GroupMember.objects.filter(group=group).select_related('user')}

            for d in simplified:
                if d['from_user_id'] == user.id:
                    to_u = members_map.get(d['to_user_id'])
                    pending_settlements.append({
                        "type": "YOU_OWE",
                        "group_id": group.id,
                        "group_name": group.name,
                        "counterparty": {
                            "id": to_u.id,
                            "full_name": to_u.full_name,
                            "username": to_u.username,
                            "avatar": to_u.avatar.url if to_u.avatar else None
                        },
                        "amount": str(d['amount'])
                    })
                elif d['to_user_id'] == user.id:
                    from_u = members_map.get(d['from_user_id'])
                    pending_settlements.append({
                        "type": "OWED_TO_YOU",
                        "group_id": group.id,
                        "group_name": group.name,
                        "counterparty": {
                            "id": from_u.id,
                            "full_name": from_u.full_name,
                            "username": from_u.username,
                            "avatar": from_u.avatar.url if from_u.avatar else None
                        },
                        "amount": str(d['amount'])
                    })

        net_balance = (you_are_owed - you_owe).quantize(Decimal('0.01'))

        # Recent expenses for user's groups
        user_group_ids = [g.id for g in user_groups]
        recent_qs = Expense.objects.filter(group_id__in=user_group_ids).select_related('paid_by', 'created_by', 'group').prefetch_related('shares__user').order_by('-expense_date', '-created_at')[:5]
        recent_serialized = ExpenseSerializer(recent_qs, many=True).data

        # Category spending distribution
        category_qs = Expense.objects.filter(group_id__in=user_group_ids).values('category').annotate(total=Sum('amount')).order_by('-total')
        category_spending = [
            {"category": item['category'], "total": str(item['total'])}
            for item in category_qs
        ]

        # Monthly spending breakdown
        monthly_qs = Expense.objects.filter(group_id__in=user_group_ids).annotate(month=TruncMonth('expense_date')).values('month').annotate(total=Sum('amount')).order_by('month')
        monthly_spending = [
            {"month": item['month'].strftime('%b %Y') if item['month'] else 'Unknown', "total": str(item['total'])}
            for item in monthly_qs
        ]

        return Response({
            "success": True,
            "summary": {
                "total_expenses": str(total_expenses.quantize(Decimal('0.01'))),
                "you_owe": str(you_owe.quantize(Decimal('0.01'))),
                "you_are_owed": str(you_are_owed.quantize(Decimal('0.01'))),
                "net_balance": str(net_balance)
            },
            "recent_expenses": recent_serialized,
            "pending_settlements": pending_settlements,
            "category_spending": category_spending,
            "monthly_spending": monthly_spending
        }, status=status.HTTP_200_OK)

class GroupAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGroupMember]

    def get(self, request, group_id):
        group = get_object_or_404(Group, pk=group_id)
        self.check_object_permissions(request, group)

        expenses_qs = Expense.objects.filter(group=group)
        total_spending = expenses_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        avg_expense = expenses_qs.aggregate(avg=Avg('amount'))['avg'] or Decimal('0.00')
        max_expense_obj = expenses_qs.order_by('-amount').first()

        highest_expense = {
            "title": max_expense_obj.title,
            "amount": str(max_expense_obj.amount),
            "paid_by": max_expense_obj.paid_by.full_name
        } if max_expense_obj else None

        most_exp_cat = expenses_qs.values('category').annotate(total=Sum('amount')).order_by('-total').first()
        most_expensive_category = most_exp_cat['category'] if most_exp_cat else "None"

        # Member spending breakdown
        members = GroupMember.objects.filter(group=group).select_related('user')
        raw_balances = BalanceService.calculate_raw_balances(group)
        spending_by_member = []
        for m in members:
            paid = expenses_qs.filter(paid_by=m.user).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            owed = ExpenseShare.objects.filter(expense__group=group, user=m.user).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            spending_by_member.append({
                "user_id": m.user.id,
                "full_name": m.user.full_name,
                "username": m.user.username,
                "total_paid": str(paid),
                "total_owed": str(owed),
                "net_balance": str(raw_balances.get(m.user.id, 0))
            })

        # Category breakdown
        category_qs = expenses_qs.values('category').annotate(total=Sum('amount')).order_by('-total')
        spending_by_category = [
            {"category": item['category'], "total": str(item['total'])}
            for item in category_qs
        ]

        # Monthly breakdown
        monthly_qs = expenses_qs.annotate(month=TruncMonth('expense_date')).values('month').annotate(total=Sum('amount')).order_by('month')
        monthly_spending = [
            {"month": item['month'].strftime('%b %Y') if item['month'] else 'Unknown', "total": str(item['total'])}
            for item in monthly_qs
        ]

        return Response({
            "success": True,
            "group_id": group.id,
            "group_name": group.name,
            "metrics": {
                "total_spending": str(total_spending),
                "average_expense": str(Decimal(str(avg_expense)).quantize(Decimal('0.01'))),
                "highest_expense": highest_expense,
                "most_expensive_category": most_expensive_category
            },
            "spending_by_member": spending_by_member,
            "spending_by_category": spending_by_category,
            "monthly_spending": monthly_spending
        }, status=status.HTTP_200_OK)
