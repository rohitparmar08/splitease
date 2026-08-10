from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # REST API Modules
    path('api/auth/', include('apps.users.urls_auth')),
    path('api/users/', include('apps.users.urls_users')),
    path('api/groups/', include('apps.groups.urls')),
    path('api/expenses/', include('apps.expenses.urls_expenses')),
    path('api/settlements/', include('apps.settlements.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
