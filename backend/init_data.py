from database import SessionLocal, engine, Base
import models
from datetime import datetime

Base.metadata.create_all(bind=engine)
db = SessionLocal()

users = [
    {"username": "tech", "name": "张技术", "role": "technician", "hashed_password": "123456"},
    {"username": "warehouse", "name": "李仓管", "role": "warehouse", "hashed_password": "123456"},
    {"username": "manager", "name": "王场长", "role": "manager", "hashed_password": "123456"},
]

for u in users:
    existing = db.query(models.User).filter(models.User.username == u["username"]).first()
    if not existing:
        db_user = models.User(**u)
        db.add(db_user)

db.commit()
print("Users initialized")
db.close()
