from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base


class CargoOrder(Base):
    __tablename__ = "cargo_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    flight_no = Column(String(20), nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    goods_name = Column(String(200), nullable=False)
    goods_type = Column(String(50), nullable=False)
    weight_kg = Column(Float, nullable=False)
    consignee = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    status = Column(String(50), nullable=False, default="created")
    is_urgent = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class LocationAllocation(Base):
    __tablename__ = "location_allocations"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("cargo_orders.id"), nullable=False)
    zone = Column(String(20), nullable=False)
    shelf = Column(String(20), nullable=False)
    position = Column(String(20), nullable=False)
    full_location = Column(String(60), nullable=False)
    allocated_by = Column(String(50), nullable=False)
    allocated_at = Column(DateTime, server_default=func.now())
    status = Column(String(50), nullable=False, default="active")
    notes = Column(Text, default="")
    version = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PickupAppointment(Base):
    __tablename__ = "pickup_appointments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("cargo_orders.id"), nullable=False)
    allocation_id = Column(Integer, ForeignKey("location_allocations.id"), nullable=True)
    appointee = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    appointment_time = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False, default="pending")
    notes = Column(Text, default="")
    allocation_snapshot = Column(Text, default="")
    allocation_changed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StatusChangeLog(Base):
    __tablename__ = "status_change_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    changed_by = Column(String(50), nullable=False)
    role = Column(String(50), nullable=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
