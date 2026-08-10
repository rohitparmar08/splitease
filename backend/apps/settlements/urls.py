from django.urls import path
from .views import GroupSettlementListCreateView, UserSettlementListView

urlpatterns = [
    path('', UserSettlementListView.as_view(), name='user_settlements'),
    path('group/<int:group_id>/', GroupSettlementListCreateView.as_view(), name='group_settlements'),
]
