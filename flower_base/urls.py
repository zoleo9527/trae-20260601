from django.contrib import admin
from django.urls import path
from aftersale.api import api as aftersale_api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', aftersale_api.urls),
]
