from .users import router as users_router
from .repairs import router as repairs_router
from .spare_parts import router as spare_parts_router
from .records import router as records_router

router = [users_router, repairs_router, spare_parts_router, records_router]
