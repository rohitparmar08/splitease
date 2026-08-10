from django.urls import path
from .views import DashboardAnalyticsView, GroupAnalyticsView

urlpatterns = [
    path('dashboard/', DashboardAnalyticsView.as_view(), name='analytics_dashboard'),
    path('group/<int:group_id>/', GroupAnalyticsView.as_view(), name='analytics_group'),
]
