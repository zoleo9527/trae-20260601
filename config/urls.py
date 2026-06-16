"""
母婴零售店 - URL配置
"""
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from store.api import router as store_router

api = NinjaAPI(urls_namespace='api')

api.add_router('/store', store_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]
