from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from rental.api import router as rental_router

api = NinjaAPI(
    title="工程机械租赁 - 维修保养与停租处理",
    version="1.0.0",
    description="日常工具型后端接口：设备台账、租赁合同、维修保养、停租处理、通知联动",
)
api.add_router("", rental_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
