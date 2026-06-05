from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.database import engine, Base
from app.models import (
    User, UserRole, FlowerMaterial, Order, OrderItem,
    OrderStatus, QualityInspection, InspectionResult,
    AnomalyRecord, AnomalyType, AnomalySeverity, AnomalyStatus,
)


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_db(db: Session):
    if db.query(User).first():
        return

    admin = User(username="admin", display_name="管理员", role=UserRole.ADMIN)
    florist1 = User(username="florist_zhang", display_name="张花艺", role=UserRole.FLORIST)
    florist2 = User(username="florist_li", display_name="李花艺", role=UserRole.FLORIST)
    inspector1 = User(username="inspector_wang", display_name="王质检", role=UserRole.INSPECTOR)
    delivery1 = User(username="delivery_chen", display_name="陈配送", role=UserRole.DELIVERY)
    db.add_all([admin, florist1, florist2, inspector1, delivery1])
    db.flush()

    rose = FlowerMaterial(name="红玫瑰", category="主花", unit="枝", is_available=True)
    lily = FlowerMaterial(name="白百合", category="主花", unit="枝", is_available=True)
    carnation = FlowerMaterial(name="粉康乃馨", category="主花", unit="枝", is_available=True)
    baby_breath = FlowerMaterial(name="满天星", category="配花", unit="扎", is_available=True)
    eucalyptus = FlowerMaterial(name="尤加利叶", category="配叶", unit="枝", is_available=True)
    wrapping = FlowerMaterial(name="包装纸", category="耗材", unit="张", is_available=True)
    ribbon = FlowerMaterial(name="丝带", category="耗材", unit="米", is_available=True)
    db.add_all([rose, lily, carnation, baby_breath, eucalyptus, wrapping, ribbon])
    db.flush()

    now = datetime.utcnow()
    order1 = Order(
        order_no="FL20260605001",
        customer_name="刘女士",
        customer_phone="13800001111",
        delivery_address="幸福路88号3单元501",
        greeting_card_text="祝生日快乐，永远年轻！",
        greeting_card_verified=True,
        promised_delivery_time=now + timedelta(hours=3),
        status=OrderStatus.PENDING,
        created_by=florist1.id,
    )
    db.add(order1)
    db.flush()

    db.add_all([
        OrderItem(order_id=order1.id, material_id=rose.id, planned_qty=11, actual_qty=None),
        OrderItem(order_id=order1.id, material_id=baby_breath.id, planned_qty=2, actual_qty=None),
        OrderItem(order_id=order1.id, material_id=wrapping.id, planned_qty=3, actual_qty=None),
        OrderItem(order_id=order1.id, material_id=ribbon.id, planned_qty=2, actual_qty=None),
    ])

    order2 = Order(
        order_no="FL20260605002",
        customer_name="王先生",
        customer_phone="13900002222",
        delivery_address="科技园B座1208",
        greeting_card_text="感谢一路相伴，感恩有你。",
        greeting_card_verified=False,
        promised_delivery_time=now + timedelta(hours=2),
        status=OrderStatus.IN_PRODUCTION,
        created_by=florist2.id,
    )
    db.add(order2)
    db.flush()

    db.add_all([
        OrderItem(
            order_id=order2.id, material_id=lily.id,
            planned_qty=6, actual_qty=6,
            is_substituted=False,
        ),
        OrderItem(
            order_id=order2.id, material_id=eucalyptus.id,
            planned_qty=3, actual_qty=3,
            is_substituted=False,
        ),
    ])

    order3 = Order(
        order_no="FL20260605003",
        customer_name="赵同学",
        customer_phone="13700003333",
        delivery_address="大学城南区6栋302",
        greeting_card_text="毕业快乐，前程似锦！",
        greeting_card_verified=True,
        promised_delivery_time=now - timedelta(hours=1),
        status=OrderStatus.DELIVERING,
        created_by=florist1.id,
    )
    db.add(order3)
    db.flush()

    db.add_all([
        OrderItem(
            order_id=order3.id, material_id=carnation.id,
            planned_qty=19, actual_qty=19,
        ),
        OrderItem(
            order_id=order3.id, material_id=baby_breath.id,
            planned_qty=3, actual_qty=2,
            is_substituted=True,
            substituted_with="小雏菊",
            substitution_reason="满天星库存不足，客户同意替换",
        ),
        OrderItem(
            order_id=order3.id, material_id=wrapping.id,
            planned_qty=2, actual_qty=2,
        ),
    ])

    anomaly1 = AnomalyRecord(
        order_id=order3.id,
        anomaly_type=AnomalyType.DELIVERY_TIMEOUT,
        description="订单FL20260605003已超过承诺配送时间1小时仍未送达",
        severity=AnomalySeverity.HIGH,
        status=AnomalyStatus.OPEN,
        created_by=inspector1.id,
    )
    db.add(anomaly1)

    order4 = Order(
        order_no="FL20260605004",
        customer_name="孙经理",
        customer_phone="13600004444",
        delivery_address="商务中心A栋16层",
        greeting_card_text="祝贺开业大吉！",
        greeting_card_verified=False,
        promised_delivery_time=now + timedelta(days=1),
        status=OrderStatus.INSPECTING,
        created_by=florist2.id,
    )
    db.add(order4)
    db.flush()

    db.add_all([
        OrderItem(
            order_id=order4.id, material_id=rose.id,
            planned_qty=33, actual_qty=33,
        ),
        OrderItem(
            order_id=order4.id, material_id=lily.id,
            planned_qty=10, actual_qty=8,
            is_substituted=True,
            substituted_with="向日葵",
            substitution_reason=None,
        ),
    ])

    anomaly2 = AnomalyRecord(
        order_id=order4.id,
        anomaly_type=AnomalyType.MATERIAL_SUBSTITUTION_UNEXPLAINED,
        description="百合替换为向日葵未填写替换原因",
        severity=AnomalySeverity.MEDIUM,
        status=AnomalyStatus.OPEN,
        created_by=inspector1.id,
    )
    db.add(anomaly2)

    order5 = Order(
        order_no="FL20260605005",
        customer_name="周女士",
        customer_phone="13500005555",
        delivery_address="花园小区2号楼1801",
        greeting_card_text="妈妈，母亲节快乐！",
        greeting_card_verified=True,
        promised_delivery_time=now + timedelta(hours=5),
        status=OrderStatus.PASSED,
        created_by=florist1.id,
    )
    db.add(order5)
    db.flush()

    db.add_all([
        OrderItem(
            order_id=order5.id, material_id=carnation.id,
            planned_qty=20, actual_qty=20,
        ),
        OrderItem(
            order_id=order5.id, material_id=baby_breath.id,
            planned_qty=2, actual_qty=2,
        ),
    ])

    insp5 = QualityInspection(
        order_id=order5.id,
        inspector_id=inspector1.id,
        card_text_correct=True,
        flower_freshness_ok=True,
        arrangement_matches_spec=True,
        overall_result=InspectionResult.PASS,
        notes="花材新鲜、插花符合规格、贺卡正确",
    )
    db.add(insp5)

    db.commit()
