from .auth import router as auth_router
from .batches import router as batches_router
from .grading import router as grading_router
from .inventory import router as inventory_router
from .reservations import router as reservations_router
from .complaints import router as complaints_router
from .picking_loss import router as picking_loss_router
from .logs import router as logs_router
from .system import router as system_router

__all__ = [
    "auth_router", "batches_router", "grading_router",
    "inventory_router", "reservations_router", "complaints_router",
    "picking_loss_router", "logs_router", "system_router",
]
