from decimal import Decimal
from django.db.models import Sum
from apps.groups.models import GroupMember

class BalanceService:
    """
    Centralized backend service responsible for calculating net financial balances
    and computing simplified minimum cash-flow debt transfers across group members.
    """

    @staticmethod
    def calculate_raw_balances(group):
        """
        Derives raw net balances for all members of a group.
        Net Balance = (Amount Paid in Expenses) - (Amount Owed in Expense Shares)
                      + (Settlements Received) - (Settlements Paid)

        Returns:
            dict: {user_id: Decimal('net_balance')}
        """
        from apps.expenses.models import Expense, ExpenseShare
        from apps.settlements.models import Settlement

        members = GroupMember.objects.filter(group=group).select_related('user')
        balances = {member.user_id: Decimal('0.00') for member in members}

        # 1. Add amounts paid by users for expenses
        paid_agg = Expense.objects.filter(group=group).values('paid_by').annotate(total_paid=Sum('amount'))
        for item in paid_agg:
            user_id = item['paid_by']
            if user_id in balances:
                balances[user_id] += Decimal(str(item['total_paid']))

        # 2. Subtract amounts owed by users for expense shares
        shares_agg = ExpenseShare.objects.filter(expense__group=group).values('user').annotate(total_owed=Sum('amount'))
        for item in shares_agg:
            user_id = item['user']
            if user_id in balances:
                balances[user_id] -= Decimal(str(item['total_owed']))

        # 3. Add settlements received
        rec_agg = Settlement.objects.filter(group=group).values('receiver').annotate(total_rec=Sum('amount'))
        for item in rec_agg:
            user_id = item['receiver']
            if user_id in balances:
                balances[user_id] += Decimal(str(item['total_rec']))

        # 4. Subtract settlements paid
        paid_set_agg = Settlement.objects.filter(group=group).values('payer').annotate(total_set_paid=Sum('amount'))
        for item in paid_set_agg:
            user_id = item['payer']
            if user_id in balances:
                balances[user_id] -= Decimal(str(item['total_set_paid']))

        # Quantize all balances to 2 decimal places
        for uid in balances:
            balances[uid] = balances[uid].quantize(Decimal('0.01'))

        return balances

    @staticmethod
    def simplify_debts(group):
        """
        Greedy Minimum Cash Flow Graph Reduction Algorithm.
        
        Transforms raw net balances into a minimal list of direct peer-to-peer transfers.
        
        Returns:
            list of dicts: [
                {
                    "from_user_id": int,
                    "to_user_id": int,
                    "amount": Decimal
                }
            ]
        """
        raw_balances = BalanceService.calculate_raw_balances(group)

        debtors = []   # Users with negative net balance (owe money)
        creditors = [] # Users with positive net balance (is owed money)

        for user_id, net in raw_balances.items():
            if net < Decimal('-0.005'):
                debtors.append({'user_id': user_id, 'balance': net}) # net is negative
            elif net > Decimal('0.005'):
                creditors.append({'user_id': user_id, 'balance': net}) # net is positive

        # Sort debtors ascending (most negative first)
        debtors.sort(key=lambda x: x['balance'])
        # Sort creditors descending (most positive first)
        creditors.sort(key=lambda x: x['balance'], reverse=True)

        simplified_transactions = []
        d_idx = 0
        c_idx = 0

        while d_idx < len(debtors) and c_idx < len(creditors):
            debtor = debtors[d_idx]
            creditor = creditors[c_idx]

            debt_amount = -debtor['balance']
            credit_amount = creditor['balance']

            settle_amount = min(debt_amount, credit_amount).quantize(Decimal('0.01'))

            if settle_amount > Decimal('0.00'):
                simplified_transactions.append({
                    "from_user_id": debtor['user_id'],
                    "to_user_id": creditor['user_id'],
                    "amount": settle_amount
                })

            debtor['balance'] += settle_amount
            creditor['balance'] -= settle_amount

            if abs(debtor['balance']) < Decimal('0.005'):
                d_idx += 1
            if abs(creditor['balance']) < Decimal('0.005'):
                c_idx += 1

        return simplified_transactions
