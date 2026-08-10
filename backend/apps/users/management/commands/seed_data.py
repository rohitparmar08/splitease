from decimal import Decimal
from datetime import date
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.groups.models import Group, GroupMember
from apps.expenses.models import Expense, ExpenseShare
from apps.expenses.services import ExpenseService
from apps.settlements.models import Settlement
from apps.settlements.services import SettlementService

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds realistic production-quality demo data for SplitEase application.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Clearing old data...'))
        Settlement.objects.all().delete()
        ExpenseShare.objects.all().delete()
        Expense.objects.all().delete()
        GroupMember.objects.all().delete()
        Group.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write(self.style.SUCCESS('Creating demo users...'))
        password = 'Password123'
        users_data = [
            {'email': 'rahul@example.com', 'username': 'rahul', 'full_name': 'Rahul Sharma'},
            {'email': 'amit@example.com', 'username': 'amit', 'full_name': 'Amit Patel'},
            {'email': 'priya@example.com', 'username': 'priya', 'full_name': 'Priya Singh'},
            {'email': 'mohit@example.com', 'username': 'mohit', 'full_name': 'Mohit Verma'},
        ]

        users = {}
        for udata in users_data:
            user = User.objects.create_user(
                email=udata['email'],
                username=udata['username'],
                full_name=udata['full_name'],
                password=password
            )
            users[udata['username']] = user
            self.stdout.write(f"  Created user: {user.full_name} ({user.email})")

        self.stdout.write(self.style.SUCCESS('Creating demo groups...'))
        group_goa = Group.objects.create(
            name='Goa Vacation Trip',
            description='Sun, beach, seafood, and shared expenses for the 4-day Goa getaway.',
            created_by=users['rahul']
        )
        group_flat = Group.objects.create(
            name='Flat 402 Apartment Expenses',
            description='Shared rent, groceries, wifi bills, and maid expenses for roommates.',
            created_by=users['rahul']
        )

        # Add Group Memberships
        for u in [users['rahul'], users['amit'], users['priya'], users['mohit']]:
            role = 'ADMIN' if u == users['rahul'] else 'MEMBER'
            GroupMember.objects.create(group=group_goa, user=u, role=role)

        for u in [users['rahul'], users['amit'], users['priya']]:
            role = 'ADMIN' if u == users['rahul'] else 'MEMBER'
            GroupMember.objects.create(group=group_flat, user=u, role=role)

        self.stdout.write(self.style.SUCCESS('Adding realistic demo expenses across all 4 split methods...'))
        member_ids_goa = set(GroupMember.objects.filter(group=group_goa).values_list('user_id', flat=True))

        # 1. Equal Split: Dinner at Fisherman's Wharf (₹4,000.00)
        expense1_data = {
            'title': "Seafood Dinner at Fisherman's Wharf",
            'amount': Decimal('4000.00'),
            'paid_by_id': users['rahul'].id,
            'category': 'food',
            'split_method': 'EQUAL',
            'notes': 'Beachside dinner with grilled fish and drinks.',
            'expense_date': date(2026, 8, 1),
            'participants': [
                {'user_id': users['rahul'].id},
                {'user_id': users['amit'].id},
                {'user_id': users['priya'].id},
                {'user_id': users['mohit'].id},
            ]
        }
        shares1 = ExpenseService.validate_and_calculate_shares(
            amount=expense1_data['amount'],
            split_method=expense1_data['split_method'],
            paid_by_id=expense1_data['paid_by_id'],
            participants_data=expense1_data['participants'],
            group_member_ids=member_ids_goa
        )
        exp1 = Expense.objects.create(
            group=group_goa,
            title=expense1_data['title'],
            amount=expense1_data['amount'],
            paid_by_id=expense1_data['paid_by_id'],
            category=expense1_data['category'],
            split_method=expense1_data['split_method'],
            notes=expense1_data['notes'],
            expense_date=expense1_data['expense_date'],
            created_by=users['rahul']
        )
        ExpenseShare.objects.bulk_create([
            ExpenseShare(expense=exp1, user_id=s['user_id'], amount=s['amount'], percentage=s['percentage'], shares=s['shares'])
            for s in shares1
        ])

        # 2. Exact Split: Beach Market Snacks & Souvenirs (₹1,500.00)
        expense2_data = {
            'title': 'Baga Beach Snacks & Water Sports',
            'amount': Decimal('1500.00'),
            'paid_by_id': users['amit'].id,
            'category': 'entertainment',
            'split_method': 'EXACT',
            'notes': 'Parasailing for Rahul & Priya, drinks for Amit.',
            'expense_date': date(2026, 8, 2),
            'participants': [
                {'user_id': users['rahul'].id, 'amount': Decimal('600.00')},
                {'user_id': users['priya'].id, 'amount': Decimal('600.00')},
                {'user_id': users['amit'].id, 'amount': Decimal('300.00')},
            ]
        }
        shares2 = ExpenseService.validate_and_calculate_shares(
            amount=expense2_data['amount'],
            split_method=expense2_data['split_method'],
            paid_by_id=expense2_data['paid_by_id'],
            participants_data=expense2_data['participants'],
            group_member_ids=member_ids_goa
        )
        exp2 = Expense.objects.create(
            group=group_goa,
            title=expense2_data['title'],
            amount=expense2_data['amount'],
            paid_by_id=expense2_data['paid_by_id'],
            category=expense2_data['category'],
            split_method=expense2_data['split_method'],
            notes=expense2_data['notes'],
            expense_date=expense2_data['expense_date'],
            created_by=users['amit']
        )
        ExpenseShare.objects.bulk_create([
            ExpenseShare(expense=exp2, user_id=s['user_id'], amount=s['amount'], percentage=s['percentage'], shares=s['shares'])
            for s in shares2
        ])

        # 3. Percentage Split: Beach Resort Villa (₹12,000.00)
        expense3_data = {
            'title': 'Luxury Beach Villa Booking (3 Nights)',
            'amount': Decimal('12000.00'),
            'paid_by_id': users['priya'].id,
            'category': 'hotel',
            'split_method': 'PERCENTAGE',
            'notes': 'Master bedroom taken by Priya (40%), shared bedrooms for others.',
            'expense_date': date(2026, 8, 3),
            'participants': [
                {'user_id': users['priya'].id, 'percentage': Decimal('40.00')},
                {'user_id': users['rahul'].id, 'percentage': Decimal('30.00')},
                {'user_id': users['amit'].id, 'percentage': Decimal('15.00')},
                {'user_id': users['mohit'].id, 'percentage': Decimal('15.00')},
            ]
        }
        shares3 = ExpenseService.validate_and_calculate_shares(
            amount=expense3_data['amount'],
            split_method=expense3_data['split_method'],
            paid_by_id=expense3_data['paid_by_id'],
            participants_data=expense3_data['participants'],
            group_member_ids=member_ids_goa
        )
        exp3 = Expense.objects.create(
            group=group_goa,
            title=expense3_data['title'],
            amount=expense3_data['amount'],
            paid_by_id=expense3_data['paid_by_id'],
            category=expense3_data['category'],
            split_method=expense3_data['split_method'],
            notes=expense3_data['notes'],
            expense_date=expense3_data['expense_date'],
            created_by=users['priya']
        )
        ExpenseShare.objects.bulk_create([
            ExpenseShare(expense=exp3, user_id=s['user_id'], amount=s['amount'], percentage=s['percentage'], shares=s['shares'])
            for s in shares3
        ])

        # 4. Shares Split: SUV Car Rental & Fuel (₹3,600.00)
        expense4_data = {
            'title': 'Thar SUV Rental & Diesel Fuel',
            'amount': Decimal('3600.00'),
            'paid_by_id': users['mohit'].id,
            'category': 'transport',
            'split_method': 'SHARES',
            'notes': 'Drivers Mohit & Rahul take 2 shares each; passengers 1 share.',
            'expense_date': date(2026, 8, 4),
            'participants': [
                {'user_id': users['mohit'].id, 'shares': Decimal('2')},
                {'user_id': users['rahul'].id, 'shares': Decimal('2')},
                {'user_id': users['amit'].id, 'shares': Decimal('1')},
                {'user_id': users['priya'].id, 'shares': Decimal('1')},
            ]
        }
        shares4 = ExpenseService.validate_and_calculate_shares(
            amount=expense4_data['amount'],
            split_method=expense4_data['split_method'],
            paid_by_id=expense4_data['paid_by_id'],
            participants_data=expense4_data['participants'],
            group_member_ids=member_ids_goa
        )
        exp4 = Expense.objects.create(
            group=group_goa,
            title=expense4_data['title'],
            amount=expense4_data['amount'],
            paid_by_id=expense4_data['paid_by_id'],
            category=expense4_data['category'],
            split_method=expense4_data['split_method'],
            notes=expense4_data['notes'],
            expense_date=expense4_data['expense_date'],
            created_by=users['mohit']
        )
        ExpenseShare.objects.bulk_create([
            ExpenseShare(expense=exp4, user_id=s['user_id'], amount=s['amount'], percentage=s['percentage'], shares=s['shares'])
            for s in shares4
        ])

        self.stdout.write(self.style.SUCCESS('Adding demo settlement...'))
        # Settlement: Amit pays ₹500.00 to Priya in Goa Trip
        Settlement.objects.create(
            group=group_goa,
            payer=users['amit'],
            receiver=users['priya'],
            amount=Decimal('500.00'),
            note='Partial settlement via UPI for beach villa stay.',
            settlement_date=date(2026, 8, 5),
            created_by=users['amit']
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo database!'))
        self.stdout.write('--------------------------------------------------')
        self.stdout.write(f'  Demo Login Password for all users: {password}')
        self.stdout.write('  Users:')
        for u in users.values():
            self.stdout.write(f'   - Email: {u.email} | Username: {u.username}')
        self.stdout.write('--------------------------------------------------')
