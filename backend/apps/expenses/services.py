from decimal import Decimal, ROUND_HALF_UP
from rest_framework.exceptions import ValidationError

class ExpenseService:
    """
    Authoritative backend engine for validating expense split inputs and
    calculating individual Decimal shares with exact penny discrepancy allocation.
    """

    @staticmethod
    def validate_and_calculate_shares(amount, split_method, paid_by_id, participants_data, group_member_ids):
        """
        Args:
            amount (Decimal): Total expense amount.
            split_method (str): 'EQUAL', 'EXACT', 'PERCENTAGE', or 'SHARES'.
            paid_by_id (int): User ID who paid the expense.
            participants_data (list of dicts): [
                {'user_id': int, 'amount': Decimal, 'percentage': Decimal, 'shares': Decimal}
            ]
            group_member_ids (set/list): Set of valid user IDs belonging to the group.

        Returns:
            list of dicts: [
                {'user_id': int, 'amount': Decimal, 'percentage': Decimal, 'shares': Decimal}
            ]
        """
        amount = Decimal(str(amount)).quantize(Decimal('0.01'))

        if amount <= Decimal('0.00'):
            raise ValidationError({"amount": "Expense amount must be strictly greater than 0.00."})

        if paid_by_id not in group_member_ids:
            raise ValidationError({"paid_by": "The payer must be an active member of the group."})

        if not participants_data:
            raise ValidationError({"participants": "An expense must involve at least one participant."})

        # Ensure all participant user IDs are group members
        participant_uids = [p['user_id'] for p in participants_data]
        if len(participant_uids) != len(set(participant_uids)):
            raise ValidationError({"participants": "Duplicate participants are not allowed."})

        for uid in participant_uids:
            if uid not in group_member_ids:
                raise ValidationError({"participants": f"User ID {uid} is not a member of this group."})

        num_participants = len(participants_data)
        calculated_shares = []

        if split_method == 'EQUAL':
            # Equal split calculation with penny discrepancy allocation
            base_share = (amount / Decimal(num_participants)).quantize(Decimal('0.01'))
            allocated = base_share * num_participants
            diff_pennies = int((amount - allocated) * Decimal('100')) # e.g. 2 pennies discrepancy

            for idx, p in enumerate(participants_data):
                extra = Decimal('0.01') if idx < diff_pennies else Decimal('0.00')
                user_amount = base_share + extra
                pct = ((user_amount / amount) * Decimal('100')).quantize(Decimal('0.01'))
                calculated_shares.append({
                    'user_id': p['user_id'],
                    'amount': user_amount,
                    'percentage': pct,
                    'shares': Decimal('1.00')
                })

        elif split_method == 'EXACT':
            # Exact amount split calculation
            total_exact = Decimal('0.00')
            for p in participants_data:
                exact_amt = Decimal(str(p.get('amount', '0.00'))).quantize(Decimal('0.01'))
                if exact_amt < Decimal('0.00'):
                    raise ValidationError({"participants": "Individual exact share cannot be negative."})
                total_exact += exact_amt

            if total_exact != amount:
                raise ValidationError({
                    "split_method": f"Exact split total ({total_exact}) does not equal total expense amount ({amount})."
                })

            for p in participants_data:
                exact_amt = Decimal(str(p.get('amount', '0.00'))).quantize(Decimal('0.01'))
                pct = ((exact_amt / amount) * Decimal('100')).quantize(Decimal('0.01'))
                calculated_shares.append({
                    'user_id': p['user_id'],
                    'amount': exact_amt,
                    'percentage': pct,
                    'shares': None
                })

        elif split_method == 'PERCENTAGE':
            # Percentage split calculation
            total_pct = Decimal('0.00')
            for p in participants_data:
                pct = Decimal(str(p.get('percentage', '0.00'))).quantize(Decimal('0.01'))
                if pct < Decimal('0.00'):
                    raise ValidationError({"participants": "Percentage share cannot be negative."})
                total_pct += pct

            if total_pct != Decimal('100.00'):
                raise ValidationError({
                    "split_method": f"Percentage total ({total_pct}%) must strictly equal 100.00%."
                })

            raw_amounts = []
            sum_amounts = Decimal('0.00')
            for p in participants_data:
                pct = Decimal(str(p.get('percentage', '0.00'))).quantize(Decimal('0.01'))
                exact_val = (amount * pct) / Decimal('100')
                quantized_val = exact_val.quantize(Decimal('0.01'))
                sum_amounts += quantized_val
                raw_amounts.append({
                    'user_id': p['user_id'],
                    'amount': quantized_val,
                    'percentage': pct,
                    'remainder': exact_val - quantized_val
                })

            # Allocate penny discrepancy based on largest fractional remainder
            diff_pennies = int((amount - sum_amounts) * Decimal('100'))
            if diff_pennies != 0:
                raw_amounts.sort(key=lambda x: x['remainder'], reverse=True)
                for i in range(abs(diff_pennies)):
                    adj = Decimal('0.01') if diff_pennies > 0 else Decimal('-0.01')
                    raw_amounts[i]['amount'] += adj

            for item in raw_amounts:
                calculated_shares.append({
                    'user_id': item['user_id'],
                    'amount': item['amount'],
                    'percentage': item['percentage'],
                    'shares': None
                })

        elif split_method == 'SHARES':
            # Proportional shares split calculation
            total_shares = Decimal('0.00')
            for p in participants_data:
                sh = Decimal(str(p.get('shares', '0'))).quantize(Decimal('0.01'))
                if sh <= Decimal('0.00'):
                    raise ValidationError({"participants": "Shares must be strictly positive."})
                total_shares += sh

            if total_shares <= Decimal('0.00'):
                raise ValidationError({"split_method": "Total shares must be greater than 0."})

            raw_amounts = []
            sum_amounts = Decimal('0.00')
            for p in participants_data:
                sh = Decimal(str(p.get('shares', '0'))).quantize(Decimal('0.01'))
                exact_val = (amount * sh) / total_shares
                quantized_val = exact_val.quantize(Decimal('0.01'))
                sum_amounts += quantized_val
                raw_amounts.append({
                    'user_id': p['user_id'],
                    'amount': quantized_val,
                    'shares': sh,
                    'remainder': exact_val - quantized_val
                })

            diff_pennies = int((amount - sum_amounts) * Decimal('100'))
            if diff_pennies != 0:
                raw_amounts.sort(key=lambda x: x['remainder'], reverse=True)
                for i in range(abs(diff_pennies)):
                    adj = Decimal('0.01') if diff_pennies > 0 else Decimal('-0.01')
                    raw_amounts[i]['amount'] += adj

            for item in raw_amounts:
                pct = ((item['amount'] / amount) * Decimal('100')).quantize(Decimal('0.01'))
                calculated_shares.append({
                    'user_id': item['user_id'],
                    'amount': item['amount'],
                    'percentage': pct,
                    'shares': item['shares']
                })

        else:
            raise ValidationError({"split_method": f"Invalid split method '{split_method}'."})

        # Final assertion to guarantee sum of calculated shares equals total expense amount
        share_sum = sum(s['amount'] for s in calculated_shares)
        if share_sum != amount:
            raise ValidationError({"split_method": f"Calculation error: share sum ({share_sum}) does not equal total ({amount})."})

        return calculated_shares
