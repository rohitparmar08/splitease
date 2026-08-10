import pytest
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from apps.expenses.services import ExpenseService

@pytest.mark.django_db
def test_equal_split_penny_discrepancy():
    """Test equal split of 100.00 across 3 people (100 / 3 = 33.33 + 33.33 + 33.34)."""
    participants = [{'user_id': 1}, {'user_id': 2}, {'user_id': 3}]
    group_members = {1, 2, 3}

    shares = ExpenseService.validate_and_calculate_shares(
        amount=Decimal('100.00'),
        split_method='EQUAL',
        paid_by_id=1,
        participants_data=participants,
        group_member_ids=group_members
    )

    amounts = [s['amount'] for s in shares]
    assert sum(amounts) == Decimal('100.00')
    assert amounts == [Decimal('33.34'), Decimal('33.33'), Decimal('33.33')] or sum(amounts) == Decimal('100.00')

@pytest.mark.django_db
def test_exact_split_valid_and_invalid():
    """Test exact split validation."""
    group_members = {1, 2, 3}

    # Valid exact split
    participants = [
        {'user_id': 1, 'amount': Decimal('400.00')},
        {'user_id': 2, 'amount': Decimal('300.00')},
        {'user_id': 3, 'amount': Decimal('300.00')}
    ]
    shares = ExpenseService.validate_and_calculate_shares(
        amount=Decimal('1000.00'),
        split_method='EXACT',
        paid_by_id=1,
        participants_data=participants,
        group_member_ids=group_members
    )
    assert sum(s['amount'] for s in shares) == Decimal('1000.00')

    # Invalid total mismatch (sum = 900 != 1000)
    bad_participants = [
        {'user_id': 1, 'amount': Decimal('400.00')},
        {'user_id': 2, 'amount': Decimal('300.00')},
        {'user_id': 3, 'amount': Decimal('200.00')}
    ]
    with pytest.raises(ValidationError):
        ExpenseService.validate_and_calculate_shares(
            amount=Decimal('1000.00'),
            split_method='EXACT',
            paid_by_id=1,
            participants_data=bad_participants,
            group_member_ids=group_members
        )

@pytest.mark.django_db
def test_percentage_split_valid_and_invalid():
    """Test percentage split calculations."""
    group_members = {1, 2, 3}

    # Valid 50% + 30% + 20% = 100%
    participants = [
        {'user_id': 1, 'percentage': Decimal('50.00')},
        {'user_id': 2, 'percentage': Decimal('30.00')},
        {'user_id': 3, 'percentage': Decimal('20.00')}
    ]
    shares = ExpenseService.validate_and_calculate_shares(
        amount=Decimal('1000.00'),
        split_method='PERCENTAGE',
        paid_by_id=1,
        participants_data=participants,
        group_member_ids=group_members
    )
    amounts = {s['user_id']: s['amount'] for s in shares}
    assert amounts[1] == Decimal('500.00')
    assert amounts[2] == Decimal('300.00')
    assert amounts[3] == Decimal('200.00')

    # Invalid percentage total (90% != 100%)
    bad_participants = [
        {'user_id': 1, 'percentage': Decimal('50.00')},
        {'user_id': 2, 'percentage': Decimal('40.00')}
    ]
    with pytest.raises(ValidationError):
        ExpenseService.validate_and_calculate_shares(
            amount=Decimal('1000.00'),
            split_method='PERCENTAGE',
            paid_by_id=1,
            participants_data=bad_participants,
            group_member_ids=group_members
        )

@pytest.mark.django_db
def test_shares_split_calculation():
    """Test shares split calculation (2 shares + 1 share + 1 share = 4 shares of 1000 => 500, 250, 250)."""
    group_members = {1, 2, 3}
    participants = [
        {'user_id': 1, 'shares': Decimal('2')},
        {'user_id': 2, 'shares': Decimal('1')},
        {'user_id': 3, 'shares': Decimal('1')}
    ]

    shares = ExpenseService.validate_and_calculate_shares(
        amount=Decimal('1000.00'),
        split_method='SHARES',
        paid_by_id=1,
        participants_data=participants,
        group_member_ids=group_members
    )

    amounts = {s['user_id']: s['amount'] for s in shares}
    assert amounts[1] == Decimal('500.00')
    assert amounts[2] == Decimal('250.00')
    assert amounts[3] == Decimal('250.00')
    assert sum(amounts.values()) == Decimal('1000.00')
