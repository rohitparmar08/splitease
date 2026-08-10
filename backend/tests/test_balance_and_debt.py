import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from apps.groups.models import Group, GroupMember
from apps.expenses.models import Expense, ExpenseShare
from apps.groups.services import BalanceService

User = get_user_model()

@pytest.mark.django_db
def test_greedy_debt_simplification():
    """
    Test transitive debt simplification:
    Scenario:
    User A (Rahul) pays 1000 for dinner split with User B (Amit).
    User B (Amit) pays 1000 for lunch split with User C (Priya).
    Result:
    A is +500 (creditor)
    B is 0 (paid 1000, owed 500 in dinner, owed 500 in lunch => net 0)
    C is -500 (debtor)
    
    Greedy debt simplification reduces (A owes B 500, B owes C 500) down to:
    C owes A 500!
    """
    user_a = User.objects.create_user(email='a@example.com', username='usera', full_name='User A', password='Password123')
    user_b = User.objects.create_user(email='b@example.com', username='userb', full_name='User B', password='Password123')
    user_c = User.objects.create_user(email='c@example.com', username='userc', full_name='User C', password='Password123')

    group = Group.objects.create(name='Trip', created_by=user_a)
    GroupMember.objects.create(group=group, user=user_a, role='ADMIN')
    GroupMember.objects.create(group=group, user=user_b, role='MEMBER')
    GroupMember.objects.create(group=group, user=user_c, role='MEMBER')

    # Expense 1: A pays 1000 for A and B (500 each)
    exp1 = Expense.objects.create(group=group, title='Dinner', amount=Decimal('1000.00'), paid_by=user_a, category='food', split_method='EQUAL', expense_date='2026-08-01', created_by=user_a)
    ExpenseShare.objects.create(expense=exp1, user=user_a, amount=Decimal('500.00'))
    ExpenseShare.objects.create(expense=exp1, user=user_b, amount=Decimal('500.00'))

    # Expense 2: B pays 1000 for B and C (500 each)
    exp2 = Expense.objects.create(group=group, title='Lunch', amount=Decimal('1000.00'), paid_by=user_b, category='food', split_method='EQUAL', expense_date='2026-08-02', created_by=user_b)
    ExpenseShare.objects.create(expense=exp2, user=user_b, amount=Decimal('500.00'))
    ExpenseShare.objects.create(expense=exp2, user=user_c, amount=Decimal('500.00'))

    # Verify raw net balances
    raw_balances = BalanceService.calculate_raw_balances(group)
    assert raw_balances[user_a.id] == Decimal('500.00')
    assert raw_balances[user_b.id] == Decimal('0.00')
    assert raw_balances[user_c.id] == Decimal('-500.00')

    # Verify simplified debts
    simplified = BalanceService.simplify_debts(group)
    assert len(simplified) == 1
    assert simplified[0]['from_user_id'] == user_c.id
    assert simplified[0]['to_user_id'] == user_a.id
    assert simplified[0]['amount'] == Decimal('500.00')
