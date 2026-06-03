from ninja import NinjaAPI

api = NinjaAPI(
    title='摄影器材租赁管理系统',
    version='1.0.0',
    description='租期延长与费用结算主链路',
)

from rental.api_rental import router as rental_router
from rental.api_audit import router as audit_router
from rental.api_dashboard import router as dashboard_router

api.add_router('/rental/', rental_router, tags=['租赁业务'])
api.add_router('/audit/', audit_router, tags=['审计日志'])
api.add_router('/dashboard/', dashboard_router, tags=['仪表盘'])
