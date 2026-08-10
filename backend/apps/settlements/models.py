from django.db import models
from django.conf import settings
from apps.groups.models import Group

class Settlement(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='settlements')
    payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='settlements_paid')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='settlements_received')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.TextField(blank=True, default='')
    settlement_date = models.DateField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_settlements')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.payer.username} settled {self.amount} to {self.receiver.username} in {self.group.name}"
