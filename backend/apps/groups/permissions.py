from rest_framework import permissions
from .models import GroupMember

class IsGroupMember(permissions.BasePermission):
    """
    Custom permission to only allow active members of a group to view or modify group data.
    """
    def has_object_permission(self, request, view, obj):
        group = getattr(obj, 'group', obj)
        return GroupMember.objects.filter(group=group, user=request.user).exists()

class IsGroupAdmin(permissions.BasePermission):
    """
    Custom permission to only allow group admins to remove members or delete groups.
    """
    def has_object_permission(self, request, view, obj):
        group = getattr(obj, 'group', obj)
        return GroupMember.objects.filter(group=group, user=request.user, role='ADMIN').exists()
