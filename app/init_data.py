from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    User,
    Area,
    Store,
    ActivityMaterial,
    StoreFeedback,
    ProcessingRecord,
    Alert,
    UserRole,
    MaterialStatus,
    FeedbackStatus,
    AlertType,
    AlertLevel,
)
import hashlib

def simple_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def init_test_data():
    print("创建数据库表...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        if db.query(User).first():
            print("测试数据已存在，跳过初始化")
            return

        print("开始初始化测试数据...")

        area1 = Area(name="城东片区", description="城东区域所有门店")
        area2 = Area(name="城西片区", description="城西区域所有门店")
        db.add_all([area1, area2])
        db.commit()

        store1 = Store(
            name="幸福路彩票店",
            code="STORE001",
            area_id=area1.id,
            address="幸福路123号",
            contact_phone="13800138001",
        )
        store2 = Store(
            name="人民广场彩票店",
            code="STORE002",
            area_id=area1.id,
            address="人民广场东侧",
            contact_phone="13800138002",
        )
        store3 = Store(
            name="科技园彩票店",
            code="STORE003",
            area_id=area2.id,
            address="科技园A区",
            contact_phone="13800138003",
        )
        db.add_all([store1, store2, store3])
        db.commit()

        admin1 = User(
            username="admin1",
            hashed_password=simple_hash("admin123"),
            real_name="张管理员",
            role=UserRole.AREA_ADMIN,
            area_id=area1.id,
            phone="13900139001",
        )
        admin2 = User(
            username="admin2",
            hashed_password=simple_hash("admin123"),
            real_name="李管理员",
            role=UserRole.AREA_ADMIN,
            area_id=area2.id,
            phone="13900139002",
        )

        manager1 = User(
            username="manager1",
            hashed_password=simple_hash("manager123"),
            real_name="王店长",
            role=UserRole.STORE_MANAGER,
            store_id=store1.id,
            phone="13900139003",
        )
        manager2 = User(
            username="manager2",
            hashed_password=simple_hash("manager123"),
            real_name="赵店长",
            role=UserRole.STORE_MANAGER,
            store_id=store2.id,
            phone="13900139004",
        )
        manager3 = User(
            username="manager3",
            hashed_password=simple_hash("manager123"),
            real_name="孙店长",
            role=UserRole.STORE_MANAGER,
            store_id=store3.id,
            phone="13900139005",
        )

        clerk1 = User(
            username="clerk1",
            hashed_password=simple_hash("clerk123"),
            real_name="周店员",
            role=UserRole.CLERK,
            store_id=store1.id,
            phone="13900139006",
        )
        clerk2 = User(
            username="clerk2",
            hashed_password=simple_hash("clerk123"),
            real_name="吴店员",
            role=UserRole.CLERK,
            store_id=store2.id,
            phone="13900139007",
        )
        clerk3 = User(
            username="clerk3",
            hashed_password=simple_hash("clerk123"),
            real_name="郑店员",
            role=UserRole.CLERK,
            store_id=store3.id,
            phone="13900139008",
        )

        db.add_all([admin1, admin2, manager1, manager2, manager3, clerk1, clerk2, clerk3])
        db.commit()

        material1 = ActivityMaterial(
            name="春节促销海报",
            code="MAT001",
            description="2024年春节促销活动海报，A1尺寸",
            quantity=10,
            store_id=store1.id,
            status=MaterialStatus.COMPLETED,
            distributed_at=datetime.now() - timedelta(days=10),
            received_at=datetime.now() - timedelta(days=9),
            expected_complete_date=datetime.now() - timedelta(days=5),
            actual_complete_date=datetime.now() - timedelta(days=5),
            current_handler_id=clerk1.id,
            status_changed_at=datetime.now() - timedelta(days=5),
        )
        material2 = ActivityMaterial(
            name="元宵节宣传单",
            code="MAT002",
            description="元宵节促销宣传单，A4尺寸",
            quantity=100,
            store_id=store1.id,
            status=MaterialStatus.IN_USE,
            distributed_at=datetime.now() - timedelta(days=5),
            received_at=datetime.now() - timedelta(days=4),
            expected_complete_date=datetime.now() + timedelta(days=3),
            current_handler_id=clerk1.id,
            status_changed_at=datetime.now() - timedelta(days=4),
        )
        material3 = ActivityMaterial(
            name="会员卡充值活动物料",
            code="MAT003",
            description="会员卡充值活动相关物料",
            quantity=50,
            store_id=store2.id,
            status=MaterialStatus.STUCK,
            distributed_at=datetime.now() - timedelta(days=7),
            received_at=datetime.now() - timedelta(days=6),
            expected_complete_date=datetime.now() - timedelta(days=2),
            current_handler_id=clerk2.id,
            stuck_reason="物料损坏，等待补发",
            status_changed_at=datetime.now() - timedelta(days=6),
        )
        material4 = ActivityMaterial(
            name="新游戏上线宣传展架",
            code="MAT004",
            description="新游戏上线宣传展架",
            quantity=2,
            store_id=store3.id,
            status=MaterialStatus.DISTRIBUTED,
            distributed_at=datetime.now() - timedelta(days=2),
            expected_complete_date=datetime.now() + timedelta(days=5),
            current_handler_id=manager3.id,
            status_changed_at=datetime.now() - timedelta(days=2),
        )
        material5 = ActivityMaterial(
            name="周末抽奖活动物料",
            code="MAT005",
            description="周末抽奖活动物料",
            quantity=30,
            store_id=store1.id,
            status=MaterialStatus.PENDING,
            expected_complete_date=datetime.now() + timedelta(days=10),
            status_changed_at=datetime.now(),
        )

        db.add_all([material1, material2, material3, material4, material5])
        db.commit()

        feedback1 = StoreFeedback(
            material_id=material2.id,
            store_id=store1.id,
            title="海报展示位置问题",
            content="店内空间有限，海报展示位置不够显眼，建议增加展示架",
            feedback_type="建议",
            status=FeedbackStatus.RESOLVED,
            priority=2,
            current_handler_id=manager1.id,
            resolution="已申请增加展示架，预计下周到货",
            resolved_at=datetime.now() - timedelta(days=2),
            status_changed_at=datetime.now() - timedelta(days=2),
        )
        feedback2 = StoreFeedback(
            material_id=material3.id,
            store_id=store2.id,
            title="物料数量不足",
            content="活动物料数量不足，无法满足活动需求",
            feedback_type="问题",
            status=FeedbackStatus.PROCESSING,
            priority=1,
            current_handler_id=clerk2.id,
            stuck_reason="等待门店确认具体需求",
            status_changed_at=datetime.now() - timedelta(days=5),
        )
        feedback3 = StoreFeedback(
            material_id=material4.id,
            store_id=store3.id,
            title="展架安装困难",
            content="展架安装说明不清晰，安装困难",
            feedback_type="问题",
            status=FeedbackStatus.PENDING,
            priority=2,
            status_changed_at=datetime.now(),
        )

        db.add_all([feedback1, feedback2, feedback3])
        db.commit()

        record1 = ProcessingRecord(
            material_id=material1.id,
            handler_id=admin1.id,
            from_status=None,
            to_status=MaterialStatus.PENDING.value,
            action="创建活动物料",
            notes="春节促销活动物料",
        )
        record2 = ProcessingRecord(
            material_id=material1.id,
            handler_id=admin1.id,
            from_status=MaterialStatus.PENDING.value,
            to_status=MaterialStatus.DISTRIBUTED.value,
            action="发放物料",
            notes="已发放至幸福路彩票店",
        )
        record3 = ProcessingRecord(
            material_id=material1.id,
            handler_id=clerk1.id,
            from_status=MaterialStatus.DISTRIBUTED.value,
            to_status=MaterialStatus.RECEIVED.value,
            action="确认接收",
            notes="物料已接收，数量正确",
        )
        record4 = ProcessingRecord(
            material_id=material1.id,
            handler_id=clerk1.id,
            from_status=MaterialStatus.RECEIVED.value,
            to_status=MaterialStatus.IN_USE.value,
            action="开始使用",
            notes="物料已开始使用",
        )
        record5 = ProcessingRecord(
            material_id=material1.id,
            handler_id=clerk1.id,
            from_status=MaterialStatus.IN_USE.value,
            to_status=MaterialStatus.COMPLETED.value,
            action="完成使用",
            notes="活动已结束，物料使用完毕",
        )
        record6 = ProcessingRecord(
            material_id=material3.id,
            handler_id=admin1.id,
            from_status=None,
            to_status=MaterialStatus.PENDING.value,
            action="创建活动物料",
            notes="会员卡充值活动物料",
        )
        record7 = ProcessingRecord(
            material_id=material3.id,
            handler_id=admin1.id,
            from_status=MaterialStatus.PENDING.value,
            to_status=MaterialStatus.DISTRIBUTED.value,
            action="发放物料",
            notes="已发放至人民广场彩票店",
        )
        record8 = ProcessingRecord(
            material_id=material3.id,
            handler_id=clerk2.id,
            from_status=MaterialStatus.DISTRIBUTED.value,
            to_status=MaterialStatus.RECEIVED.value,
            action="确认接收",
            notes="物料已接收",
        )
        record9 = ProcessingRecord(
            material_id=material3.id,
            handler_id=clerk2.id,
            from_status=MaterialStatus.RECEIVED.value,
            to_status=MaterialStatus.STUCK.value,
            action="标记为卡住",
            notes="物料损坏，等待补发",
        )

        feedback_record1 = ProcessingRecord(
            feedback_id=feedback1.id,
            handler_id=clerk1.id,
            from_status=None,
            to_status=FeedbackStatus.PENDING.value,
            action="提交反馈",
            notes="海报展示位置问题",
            created_at=datetime.now() - timedelta(days=4),
        )
        feedback_record2 = ProcessingRecord(
            feedback_id=feedback1.id,
            handler_id=clerk1.id,
            from_status=FeedbackStatus.PENDING.value,
            to_status=FeedbackStatus.PROCESSING.value,
            action="开始处理",
            notes="正在确认展示架位置",
            created_at=datetime.now() - timedelta(days=3),
        )
        feedback_record3 = ProcessingRecord(
            feedback_id=feedback1.id,
            handler_id=manager1.id,
            from_status=FeedbackStatus.PROCESSING.value,
            to_status=FeedbackStatus.RESOLVED.value,
            action="处理完成",
            notes="已申请增加展示架，预计下周到货",
            created_at=datetime.now() - timedelta(days=2),
        )
        feedback_record4 = ProcessingRecord(
            feedback_id=feedback2.id,
            handler_id=clerk2.id,
            from_status=None,
            to_status=FeedbackStatus.PENDING.value,
            action="提交反馈",
            notes="物料数量不足",
            created_at=datetime.now() - timedelta(days=6),
        )
        feedback_record5 = ProcessingRecord(
            feedback_id=feedback2.id,
            handler_id=clerk2.id,
            from_status=FeedbackStatus.PENDING.value,
            to_status=FeedbackStatus.PROCESSING.value,
            action="开始处理",
            notes="正在与门店沟通确认需求",
            created_at=datetime.now() - timedelta(days=5),
        )
        feedback_record6 = ProcessingRecord(
            feedback_id=feedback3.id,
            handler_id=clerk3.id,
            from_status=None,
            to_status=FeedbackStatus.PENDING.value,
            action="提交反馈",
            notes="展架安装困难",
            created_at=datetime.now(),
        )

        db.add_all([record1, record2, record3, record4, record5, record6, record7, record8, record9,
                     feedback_record1, feedback_record2, feedback_record3, feedback_record4,
                     feedback_record5, feedback_record6])
        db.commit()

        alert1 = Alert(
            alert_type=AlertType.STUCK,
            alert_level=AlertLevel.WARNING,
            title="活动物料卡住: 会员卡充值活动物料",
            message="活动物料 会员卡充值活动物料 (编号: MAT003) 已卡住超过3天，请及时处理。",
            material_id=material3.id,
        )
        alert2 = Alert(
            alert_type=AlertType.UNCLEAR_RESPONSIBILITY,
            alert_level=AlertLevel.ERROR,
            title="门店反馈责任不清: 展架安装困难",
            message="门店反馈 展架安装困难 当前状态为 pending 但无明确处理人。",
            feedback_id=feedback3.id,
        )

        db.add_all([alert1, alert2])
        db.commit()

        print("测试数据初始化完成！")
        print("\n测试账号信息：")
        print("片区管理员: admin1/admin123, admin2/admin123")
        print("店长: manager1/manager123, manager2/manager123, manager3/manager123")
        print("店员: clerk1/clerk123, clerk2/clerk123, clerk3/clerk123")

    except Exception as e:
        print(f"初始化测试数据失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_test_data()