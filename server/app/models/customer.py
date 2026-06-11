from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from ..database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), index=True, nullable=False)
    id_card = Column(String(20))
    gender = Column(String(10))
    source_channel = Column(String(100))
    remark = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
