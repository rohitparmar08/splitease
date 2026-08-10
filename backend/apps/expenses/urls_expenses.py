from django.urls import path
from .views import GroupExpenseListCreateView, ExpenseDetailView, ExpenseHistoryView

urlpatterns = [
    path('', ExpenseHistoryView.as_view(), name='expense_history'),
    path('<int:pk>/', ExpenseDetailView.as_view(), name='expense_detail'),
    path('group/<int:group_id>/', GroupExpenseListCreateView.as_view(), name='group_expenses'),
]
