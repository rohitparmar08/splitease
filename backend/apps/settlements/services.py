from decimal import Decimal
from rest_framework.exceptions import ValidationError
from apps.groups.models import GroupMember
from apps.groups.services import BalanceService

class SettlementService:
    """
    Service enforcing strict financial validation for debt settlements:
    - Positive amount check
    - Self-settlement prevention
    - Group membership verification
    - Over-settlement prevention
    """

    @staticmethod
    def validate_settlement(group, payer_id, receiver_id, amount):
        amount = Decimal(str(amount)).quantize(Decimal('0.01'))

        # 1. Zero/Negative check
        if amount <= Decimal('0.00'):
            raise ValidationError({"amount": "Settlement amount must be strictly greater than 0.00."})

        # 2. Self-settlement check
        if payer_id == receiver_id:
            raise ValidationError({"receiver_id": "Self-settlement is not allowed. Payer and receiver must be different users."})

        # 3. Group membership check
        member_ids = set(GroupMember.objects.filter(group=group).values_list('user_id', flat=True))
        if payer_id not in member_ids:
            raise ValidationError({"payer_id": "Payer is not an active member of this group."})
        if receiver_id not in member_ids:
            raise ValidationError({"receiver_id": "Receiver is not an active member of this group."})

        # 4. Over-settlement check against current raw balances
        raw_balances = BalanceService.calculate_raw_balances(group)
        payer_net = raw_balances.get(payer_id, Decimal('0.00'))

        # Payer net balance is negative when they owe money. E.g. -500.00 means owes 500.00.
        amount_owed = max(Decimal('0.00'), -payer_net)

        if amount > amount_owed + Decimal('0.01'):
            raise ValidationError({
                "amount": f"Settlement amount ({amount}) cannot exceed the amount owed ({amount_owed})."
            })

        return amount
