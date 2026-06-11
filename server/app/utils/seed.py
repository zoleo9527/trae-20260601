from sqlalchemy.orm import Session

from ..database import Base, engine, SessionLocal
from ..models import (
    User,
    UserRole,
    Customer,
    VisitRegistration,
    VisitType,
    VisitStatus,
    FollowUpRecord,
    Subscription,
    OwnershipRecord,
    OwnershipStatus,
)
from .helpers import gen_visit_no, gen_subscription_no


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_users(db)
        _seed_demo_data(db)
    finally:
        db.close()


def _seed_users(db: Session):
    if db.query(User).count() > 0:
        return
    users = [
        User(username="manager01", full_name="张经理", role=UserRole.MANAGER, phone="13800000001"),
        User(username="agent01", full_name="李置业", role=UserRole.AGENT, phone="13800000002"),
        User(username="agent02", full_name="王置业", role=UserRole.AGENT, phone="13800000003"),
        User(username="agent03", full_name="赵置业", role=UserRole.AGENT, phone="13800000004"),
        User(username="controller01", full_name="陈销控", role=UserRole.CONTROLLER, phone="13800000005"),
    ]
    db.add_all(users)
    db.commit()


def _seed_demo_data(db: Session):
    if db.query(Customer).count() > 0:
        return
    manager = db.query(User).filter(User.role == UserRole.MANAGER).first()
    agent1 = db.query(User).filter(User.username == "agent01").first()
    agent2 = db.query(User).filter(User.username == "agent02").first()
    controller = db.query(User).filter(User.role == UserRole.CONTROLLER).first()

    c1 = Customer(name="刘先生", phone="13900001111", gender="男", source_channel="朋友介绍", remark="改善型需求")
    c2 = Customer(name="周女士", phone="13900002222", gender="女", source_channel="线上广告", remark="首次置业")
    c3 = Customer(name="吴先生", phone="13900003333", gender="男", source_channel="自然到访", remark="投资需求")
    db.add_all([c1, c2, c3])
    db.flush()

    v1 = VisitRegistration(
        visit_no=gen_visit_no(),
        customer_id=c1.id,
        visit_type=VisitType.FIRST,
        status=VisitStatus.FOLLOWING,
        intent_level="高意向",
        interested_house_type="三居室",
        accompany_number=2,
        registered_by=manager.id,
        assigned_agent_id=agent1.id,
        assigned_at=__import__("datetime").datetime.utcnow(),
        assigned_by=manager.id,
        remark="看了样板间，比较满意",
    )
    v2 = VisitRegistration(
        visit_no=gen_visit_no(),
        customer_id=c2.id,
        visit_type=VisitType.FIRST,
        status=VisitStatus.SUBSCRIBED,
        intent_level="高意向",
        interested_house_type="两居室",
        accompany_number=1,
        registered_by=manager.id,
        assigned_agent_id=agent2.id,
        assigned_at=__import__("datetime").datetime.utcnow(),
        assigned_by=manager.id,
    )
    v3 = VisitRegistration(
        visit_no=gen_visit_no(),
        customer_id=c3.id,
        visit_type=VisitType.REPEAT,
        status=VisitStatus.ASSIGNED,
        intent_level="中意向",
        interested_house_type="四居室",
        accompany_number=0,
        registered_by=manager.id,
        assigned_agent_id=agent1.id,
        assigned_at=__import__("datetime").datetime.utcnow(),
        assigned_by=manager.id,
    )
    db.add_all([v1, v2, v3])
    db.flush()

    fu1 = FollowUpRecord(
        visit_id=v1.id,
        customer_id=c1.id,
        agent_id=agent1.id,
        follow_channel="微信",
        content="发送了户型图和报价单，客户反馈比较满意，约定周末复访",
        next_follow_plan="电话确认复访时间",
        customer_response="积极回应",
    )
    db.add(fu1)
    db.flush()

    sub = Subscription(
        subscription_no=gen_subscription_no(),
        visit_id=v2.id,
        customer_id=c2.id,
        building_no="3号楼",
        unit_no="2单元",
        room_no="1502",
        area=89.5,
        total_price=2680000,
        deposit_amount=50000,
        created_by=controller.id,
    )
    db.add(sub)
    db.flush()

    own = OwnershipRecord(
        visit_id=v2.id,
        customer_id=c2.id,
        subscription_id=sub.id,
        claimed_agent_id=agent2.id,
        confirm_agent_id=agent2.id,
        confirmed_by=controller.id,
        status=OwnershipStatus.CONFIRMED,
        ownership_reason="首次接待并全程跟进，成功认购",
        commission_ratio=0.003,
        commission_amount=8040,
        confirmed_at=__import__("datetime").datetime.utcnow(),
    )
    db.add(own)
    db.commit()
