import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.groups.models import Group, GroupMember

User = get_user_model()

@pytest.mark.django_db
def test_group_permission_isolation():
    user1 = User.objects.create_user(email='u1@example.com', username='u1', full_name='User 1', password='Password123')
    user2 = User.objects.create_user(email='u2@example.com', username='u2', full_name='User 2', password='Password123')

    group1 = Group.objects.create(name='Private Group 1', created_by=user1)
    GroupMember.objects.create(group=group1, user=user1, role='ADMIN')

    client = APIClient()
    client.force_authenticate(user=user2)

    # User 2 attempts to access Group 1 detail endpoint
    res = client.get(f'/api/groups/{group1.id}/')
    assert res.status_code == 403 or res.status_code == 404
