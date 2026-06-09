from django.contrib import admin
from django.urls import path
from equipment_booking.api_root import api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]
