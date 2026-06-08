from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Container(Base):
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    container_no = Column(String(20), unique=True, nullable=False, index=True)
    size = Column(String(10), nullable=False)
    type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="待进")
    yard_block = Column(String(20), nullable=True)
    yard_slot = Column(String(20), nullable=True)
    vessel = Column(String(50), nullable=True)
    voyage = Column(String(50), nullable=True)
    bill_of_lading = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    gate_releases = relationship("GateRelease", back_populates="container")
    fleet_appointments = relationship("FleetAppointment", back_populates="container")


class GateRelease(Base):
    __tablename__ = "gate_releases"

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=False)
    release_type = Column(String(10), nullable=False)
    truck_company = Column(String(100), nullable=True)
    truck_plate = Column(String(20), nullable=True)
    driver_name = Column(String(50), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, default="待处理")
    notes = Column(Text, nullable=True)
    operator = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)

    container = relationship("Container", back_populates="gate_releases")
    fleet_appointments = relationship("FleetAppointment", back_populates="gate_release")


class FleetAppointment(Base):
    __tablename__ = "fleet_appointments"

    id = Column(Integer, primary_key=True, index=True)
    gate_release_id = Column(Integer, ForeignKey("gate_releases.id"), nullable=True)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=True)
    truck_company = Column(String(100), nullable=True)
    truck_plate = Column(String(20), nullable=True)
    driver_name = Column(String(50), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    appointment_time = Column(String(10), nullable=True)
    appointment_date = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, default="待确认")
    notes = Column(Text, nullable=True)
    operator = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    gate_release = relationship("GateRelease", back_populates="fleet_appointments")
    container = relationship("Container", back_populates="fleet_appointments")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(30), nullable=False)
    entity_id = Column(Integer, nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    operator = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ExceptionRecord(Base):
    __tablename__ = "exception_records"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(30), nullable=False)
    entity_id = Column(Integer, nullable=False, index=True)
    exception_type = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="待处理")
    handler = Column(String(50), nullable=True)
    handled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(30), nullable=False)
    entity_id = Column(Integer, nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_by = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
