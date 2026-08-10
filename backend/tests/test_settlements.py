import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from apps.groups.models import Group, GroupMember
from apps.expenses.models import Expense, ExpenseShare
from apps.settlements.services import SettlementService

User = get_user_model()

@pytest.mark.django_db
def test_settlement_validations():
    user_a = User.objects.create_user(email='sa@example.com', username='suser_a', full_name='User SA', password='Password123')
    user_b = User.objects.create_user(email='sb@example.com', username='suser_b', full_name='User SB', password='Password123')
    user_outside = User.objects.create_user(email='out@example.com', username='outuser', full_name='Out User', password='Password123')

    group = Group.objects.create(name='Settlement Group', created_by=user_a)
    GroupMember.objects.create(group=group, user=user_a, role='ADMIN')
    GroupMember.objects.create(group=group, user=user_b, role='MEMBER')

    # A pays 1000 split equally with B (B owes A 500)
    exp = Expense.objects.create(group=group, title='Resort', amount=Decimal('1000.00'), paid_by=user_a, category='hotel', split_method='EQUAL', expense_date='2026-08-01', created_by=user_a)
    ExpenseShare.objects.create(expense=exp, user=user_a, amount=Decimal('500.00'))
    ExpenseShare.objects.create(expense=exp, user=user_b, amount=Decimal('500.00'))

    # 1. Non-positive amount raises error
    with pytest.raises(ValidationError):
        SettlementService.validate_settlement(group, user_b.id, user_a.id, Decimal('0.00'))
    with pytest.raises(ValidationError):
        SettlementService.validate_settlement(group, user_b.id, user_a.id, Decimal('-100.00'))

    # 2. Self settlement raises error
    with pytest.raises(ValidationError):
        SettlementService.validate_settlement(group, user_a.id, user_a.id, Decimal('500.00'))

    # 3. Non-member settlement raises error
    with pytest.raises(ValidationError):
        SettlementService.validate_settlement(group, user_outside.id, user_a.id, Decimal('500.00'))

    # 4. Over settlement raises error (B owes 500, trying to settle 600)
    with pytest.raises(ValidationError):
        SettlementService.validate_settlement(group, user_b.id, user_a.id, Decimal('600.00'))

    # 5. Valid settlement of 500 succeeds
    val_amount = SettlementService.validate_settlement(group, user_b.id, user_a.id, Decimal('500.00'))
    assert val_amount == Decimal('500.00')
