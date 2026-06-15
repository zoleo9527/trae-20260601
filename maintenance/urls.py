from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from parts.views import login, index

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', login, name='login'),
    path('app/', index, name='index'),
    path('api/token/', obtain_auth_token, name='api_token_auth'),
    path('api/', include('parts.api.urls')),
]