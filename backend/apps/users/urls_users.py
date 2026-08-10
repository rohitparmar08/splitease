from django.urls import path
from .views import UserProfileView, ChangePasswordView, UserSearchView

urlpatterns = [
    path('me/', UserProfileView.as_view(), name='user_me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='user_change_password'),
    path('search/', UserSearchView.as_view(), name='user_search'),
]
