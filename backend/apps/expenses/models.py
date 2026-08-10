from django.db import models
from django.conf import settings
from apps.groups.models import Group

class Expense(models.Model):
    CATEGORY_CHOICES = (
        ('food', 'Food'),
        ('travel', 'Travel'),
        ('shopping', 'Shopping'),
        ('entertainment', 'Entertainment'),
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('groceries', 'Groceries'),
        ('hotel', 'Hotel'),
        ('transport', 'Transport'),
        ('medical', 'Medical'),
        ('other', 'Other'),
    )

    SPLIT_METHOD_CHOICES = (
        ('EQUAL', 'Equal'),
        ('EXACT', 'Exact'),
        ('PERCENTAGE', 'Percentage'),
        ('SHARES', 'Shares'),
    )

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses')
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='expenses_paid')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='food')
    split_method = models.CharField(max_length=20, choices=SPLIT_METHOD_CHOICES, default='EQUAL')
    notes = models.TextField(blank=True, default='')
    expense_date = models.DateField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_expenses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.amount}) in {self.group.name}"

class ExpenseShare(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='shares')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expense_shares')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    shares = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    class Meta:
        unique_together = ('expense', 'user')

    def __str__(self):
        return f"{self.user.username} share for {self.expense.title}: {self.amount}"
