from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models, schemas, crud
from app.models import UserRole, RentalStatus, EquipmentStatus
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)

def init_mock_data():
    db = SessionLocal()
    
    try:
        users = [
            {"username": "store_clerk_1", "name": "门店店员小李", "role": UserRole.STORE_CLERK},
            {"username": "store_clerk_2", "name": "门店店员小王", "role": UserRole.STORE_CLERK},
            {"username": "equip_admin_1", "name": "器材管理员老张", "role": UserRole.EQUIPMENT_ADMIN},
            {"username": "equip_admin_2", "name": "器材管理员老刘", "role": UserRole.EQUIPMENT_ADMIN},
            {"username": "finance_1", "name": "财务小陈", "role": UserRole.FINANCE},
            {"username": "finance_2", "name": "财务小周", "role": UserRole.FINANCE},
        ]
        
        created_users = {}
        for user_data in users:
            user = crud.get_user_by_username(db, user_data["username"])
            if not user:
                user = crud.create_user(db, schemas.UserCreate(**user_data))
            created_users[user_data["username"]] = user
        
        equipments = [
            {"name": "佳能 EOS R5 全画幅微单", "category": "相机", "model": "EOS R5", "serial_number": "CNR5-2024-001", "daily_rate": 150.0, "deposit_amount": 8000.0, "description": "专业全画幅微单相机，8K视频拍摄"},
            {"name": "索尼 A7S III 微单相机", "category": "相机", "model": "A7S III", "serial_number": "SNS3-2024-002", "daily_rate": 120.0, "deposit_amount": 6000.0, "description": "高感光度视频微单"},
            {"name": "尼康 Z 7II 微单相机", "category": "相机", "model": "Z 7II", "serial_number": "NKZ7-2024-003", "daily_rate": 130.0, "deposit_amount": 7000.0, "description": "高像素专业微单"},
            {"name": "佳能 RF 24-70mm F2.8 镜头", "category": "镜头", "model": "RF 24-70mm F2.8", "serial_number": "CFL2470-004", "daily_rate": 80.0, "deposit_amount": 4000.0, "description": "标准变焦大光圈镜头"},
            {"name": "索尼 FE 70-200mm F2.8 GM 镜头", "category": "镜头", "model": "FE 70-200mm F2.8", "serial_number": "SL70200-005", "daily_rate": 90.0, "deposit_amount": 5000.0, "description": "长焦大光圈镜头"},
            {"name": "DJI Ronin-S 稳定器", "category": "配件", "model": "Ronin-S", "serial_number": "DJIRS-006", "daily_rate": 50.0, "deposit_amount": 2000.0, "description": "专业相机稳定器"},
            {"name": "神牛 AD600 Pro 外拍灯", "category": "灯光", "model": "AD600 Pro", "serial_number": "GNAD600-007", "daily_rate": 60.0, "deposit_amount": 3000.0, "description": "大功率外拍闪光灯"},
            {"name": "SmallHD 7寸 监视器", "category": "配件", "model": "Focus Pro", "serial_number": "SHD7-008", "daily_rate": 40.0, "deposit_amount": 1500.0, "description": "高清专业监视器"},
        ]
        
        created_equipments = []
        for equip_data in equipments:
            equip = db.query(models.Equipment).filter(models.Equipment.serial_number == equip_data["serial_number"]).first()
            if not equip:
                equip = crud.create_equipment(db, schemas.EquipmentCreate(**equip_data))
            created_equipments.append(equip)
        
        now = datetime.now()
        
        rental_data_list = [
            {
                "customer_name": "张三",
                "customer_phone": "13800138001",
                "customer_id_card": "110101199001010001",
                "equipment_idx": 0,
                "start_date": now + timedelta(days=1),
                "end_date": now + timedelta(days=4),
                "status": RentalStatus.PENDING,
                "user_key": "store_clerk_1"
            },
            {
                "customer_name": "李四",
                "customer_phone": "13800138002",
                "customer_id_card": "110101199001010002",
                "equipment_idx": 1,
                "start_date": now + timedelta(days=2),
                "end_date": now + timedelta(days=5),
                "status": RentalStatus.CONFIRMED,
                "user_key": "store_clerk_1"
            },
            {
                "customer_name": "王五",
                "customer_phone": "13800138003",
                "customer_id_card": "110101199001010003",
                "equipment_idx": 3,
                "start_date": now - timedelta(days=1),
                "end_date": now + timedelta(days=2),
                "status": RentalStatus.DEPOSIT_FROZEN,
                "user_key": "store_clerk_2"
            },
            {
                "customer_name": "赵六",
                "customer_phone": "13800138004",
                "customer_id_card": "110101199001010004",
                "equipment_idx": 5,
                "start_date": now - timedelta(days=3),
                "end_date": now - timedelta(days=1),
                "status": RentalStatus.RETURNED,
                "user_key": "store_clerk_1"
            },
        ]
        
        for rental_data in rental_data_list:
            equipment = created_equipments[rental_data["equipment_idx"]]
            rental = crud.get_rental_records_by_customer(db, rental_data["customer_name"])
            
            if not rental:
                rental_create = schemas.RentalRecordCreate(
                    customer_name=rental_data["customer_name"],
                    customer_phone=rental_data["customer_phone"],
                    customer_id_card=rental_data["customer_id_card"],
                    equipment_id=equipment.id,
                    start_date=rental_data["start_date"],
                    end_date=rental_data["end_date"],
                    supplement_note=None
                )
                created_rental = crud.create_rental_record(
                    db, rental_create, created_users[rental_data["user_key"]].id
                )
                
                if rental_data["status"] != RentalStatus.PENDING:
                    crud.change_rental_status(
                        db, created_rental.id, RentalStatus.CONFIRMED,
                        created_users["equip_admin_1"].id, "模拟数据-确认预约"
                    )
                    
                    if rental_data["status"] in [RentalStatus.DEPOSIT_FROZEN, RentalStatus.RETURNED]:
                        crud.change_rental_status(
                            db, created_rental.id, RentalStatus.DEPOSIT_FROZEN,
                            created_users["finance_1"].id, "模拟数据-冻结押金"
                        )
                    
                    if rental_data["status"] == RentalStatus.RETURNED:
                        crud.change_rental_status(
                            db, created_rental.id, RentalStatus.PICKED_UP,
                            created_users["store_clerk_1"].id, "模拟数据-客户取件"
                        )
                        crud.change_rental_status(
                            db, created_rental.id, RentalStatus.RETURNED,
                            created_users["store_clerk_1"].id, "模拟数据-客户归还"
                        )
        
        db.commit()
        print("模拟数据初始化完成!")
        
    except Exception as e:
        db.rollback()
        print(f"初始化数据时出错: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_mock_data()
