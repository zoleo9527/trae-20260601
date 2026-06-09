from ninja import NinjaAPI
from equipment_booking.exceptions import BizError, ErrorCode, ERROR_HTTP_MAP
from equipment_booking.schemas import ErrorResponse

api = NinjaAPI(
    title='康复治疗中心-器械预约与使用记录',
    version='1.0.0',
    description='治疗师→前台→主任接力流程，器械预约非终点，使用记录内嵌预约单，异常自动暴露',
    urls_namespace='equipment_booking_api',
)


@api.exception_handler(BizError)
def biz_error_handler(request, exc: BizError):
    return api.create_response(
        request,
        {'code': exc.biz_code, 'message': exc.biz_message, 'detail': exc.biz_detail},
        status_code=ERROR_HTTP_MAP.get(exc.biz_code, 500),
    )


from equipment_booking.api import router as booking_router
api.add_router('/booking/', booking_router)
