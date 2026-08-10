from django.db import models
from django.conf import settings

class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='groups/', null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_groups'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class GroupMember(models.Model):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MEMBER', 'Member'),
    )

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='MEMBER')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.group.name} ({self.role})"
