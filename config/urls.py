from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from locker_system.api import router as locker_router
from locker_system.schemas import ErrorResponse

api = NinjaAPI(
    title="洗浴中心储物柜异常与赔付系统",
    version="1.0.0",
    description="前台-楼层主管-财务接力处理流程",
)

api.add_router("/locker", locker_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
