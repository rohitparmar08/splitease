from django.urls import path
from .views import (
    GroupListCreateView,
    GroupDetailView,
    GroupMemberAddView,
    GroupMemberRemoveView,
    GroupBalancesView
)

urlpatterns = [
    path('', GroupListCreateView.as_view(), name='group_list_create'),
    path('<int:pk>/', GroupDetailView.as_view(), name='group_detail'),
    path('<int:pk>/members/', GroupMemberAddView.as_view(), name='group_member_add'),
    path('<int:pk>/members/<int:user_id>/', GroupMemberRemoveView.as_view(), name='group_member_remove'),
    path('<int:pk>/balances/', GroupBalancesView.as_view(), name='group_balances'),
]
