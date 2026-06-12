from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import get_password_hash

Base.metadata.create_all(bind=engine)


def init_data():
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            admin = models.User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                real_name="系统管理员",
                role="admin",
                is_active=True
            )
            staff1 = models.User(
                username="zhangsan",
                hashed_password=get_password_hash("123456"),
                real_name="张三",
                role="staff",
                is_active=True
            )
            staff2 = models.User(
                username="lisi",
                hashed_password=get_password_hash("123456"),
                real_name="李四",
                role="staff",
                is_active=True
            )
            db.add_all([admin, staff1, staff2])
            db.flush()
            print("✅ 用户数据初始化完成")
            print("   管理员: admin / admin123")
            print("   员工: zhangsan / 123456")
            print("   员工: lisi / 123456")

        if db.query(models.Property).count() == 0:
            properties = [
                models.Property(
                    property_no="A-1501",
                    building="国贸大厦A座",
                    floor="15层",
                    room_no="1501",
                    area=280.5,
                    layout="开放式",
                    decoration="精装修",
                    daily_rent=8.5,
                    monthly_rent=71500,
                    status="vacant",
                    vacancy_reason="合同到期，客户退租",
                    vacancy_date=datetime.utcnow() - timedelta(days=30),
                    expected_available_date=datetime.utcnow() + timedelta(days=15),
                    remarks="原客户为科技公司，装修保持良好，可直接入驻。\n需更换门锁，已安排物业处理。\n带看前请提前1小时联系物业开门。",
                    handler_id=2
                ),
                models.Property(
                    property_no="A-1803",
                    building="国贸大厦A座",
                    floor="18层",
                    room_no="1803",
                    area=150.0,
                    layout="3+1格局",
                    decoration="精装修",
                    daily_rent=9.0,
                    monthly_rent=40500,
                    status="vacant",
                    vacancy_reason="客户提前解约",
                    vacancy_date=datetime.utcnow() - timedelta(days=7),
                    expected_available_date=datetime.utcnow() + timedelta(days=3),
                    remarks="客户因业务调整提前退租。\n需要重新粉刷墙面，预计2天后完成。\n有1个固定车位可一起出租。",
                    handler_id=2
                ),
                models.Property(
                    property_no="B-0805",
                    building="国贸大厦B座",
                    floor="8层",
                    room_no="0805",
                    area=500.0,
                    layout="整层可分割",
                    decoration="毛坯",
                    daily_rent=6.5,
                    monthly_rent=97500,
                    status="vacant",
                    vacancy_reason="新交付房源",
                    vacancy_date=datetime.utcnow() - timedelta(days=1),
                    expected_available_date=datetime.utcnow() + timedelta(days=60),
                    remarks="新交付整层房源，可根据客户需求定制装修。\n免租期可谈，最长3个月。\n物业费28元/㎡/月。",
                    handler_id=3
                ),
                models.Property(
                    property_no="A-2201",
                    building="国贸大厦A座",
                    floor="22层",
                    room_no="2201",
                    area=320.0,
                    layout="4+1格局",
                    decoration="精装修带家具",
                    daily_rent=10.0,
                    monthly_rent=96000,
                    status="occupied",
                    expected_available_date=datetime.utcnow() + timedelta(days=90),
                    remarks="现有客户租约还有3个月到期，已确认不续租。\n可提前预约带看，需提前3天通知客户。\n家具可留下，价格另议。",
                    handler_id=3
                ),
                models.Property(
                    property_no="B-1202",
                    building="国贸大厦B座",
                    floor="12层",
                    room_no="1202",
                    area=200.0,
                    layout="2+1格局",
                    decoration="简装修",
                    daily_rent=7.5,
                    monthly_rent=45000,
                    status="vacant",
                    vacancy_reason="装修升级",
                    vacancy_date=datetime.utcnow() - timedelta(days=45),
                    expected_available_date=datetime.utcnow() + timedelta(days=30),
                    remarks="原装修老旧，正在进行全面升级。\n新装修为现代简约风格，配全套办公家具。\n预计下月中可交付。",
                    handler_id=2
                )
            ]
            db.add_all(properties)
            db.flush()
            print("✅ 房源数据初始化完成，共5条房源")

            viewings = [
                models.Viewing(
                    property_id=1,
                    customer_name="王经理",
                    customer_phone="13800138001",
                    viewing_date=datetime.utcnow() + timedelta(days=1, hours=10),
                    viewing_duration=60,
                    status="scheduled",
                    remarks="客户来自互联网公司，需要200-300㎡办公空间。\n重点关注采光和周边配套。\n已发送房源资料给客户。",
                    handler_id=2
                ),
                models.Viewing(
                    property_id=1,
                    customer_name="李总",
                    customer_phone="13900139002",
                    viewing_date=datetime.utcnow() + timedelta(days=2, hours=14),
                    viewing_duration=90,
                    status="scheduled",
                    remarks="金融公司，需要300㎡左右。\n要求有独立老板间和会议室。\n需要看同楼层其他房源对比。",
                    handler_id=3
                ),
                models.Viewing(
                    property_id=2,
                    customer_name="张小姐",
                    customer_phone="13700137003",
                    viewing_date=datetime.utcnow() - timedelta(days=1, hours=9),
                    viewing_duration=45,
                    status="completed",
                    actual_arrival_time=datetime.utcnow() - timedelta(days=1, hours=9, minutes=5),
                    actual_leave_time=datetime.utcnow() - timedelta(days=1, hours=9, minutes=50),
                    intention_level="high",
                    feedback="客户对面积和装修都很满意，觉得价格略高。\n需要回去和合伙人商量，3天内给答复。\n客户提到需要2个固定车位。",
                    follow_up="2天后跟进，确认客户意向。\n可申请1个月免租期作为优惠。",
                    remarks="带看顺利，客户意向较高。",
                    handler_id=2
                ),
                models.Viewing(
                    property_id=3,
                    customer_name="陈总",
                    customer_phone="13600136004",
                    viewing_date=datetime.utcnow() - timedelta(days=3, hours=15),
                    viewing_duration=120,
                    status="completed",
                    actual_arrival_time=datetime.utcnow() - timedelta(days=3, hours=15),
                    actual_leave_time=datetime.utcnow() - timedelta(days=3, hours=17),
                    intention_level="medium",
                    feedback="客户需要整层500㎡，对毛坯可定制装修很感兴趣。\n但觉得免租期太短，希望能延长到4个月。\n已报领导审批中。",
                    follow_up="下周一会给出免租期审批结果，及时跟进。\n准备了整层装修方案供客户参考。",
                    remarks="大客户，重点跟进。",
                    handler_id=3
                ),
                models.Viewing(
                    property_id=5,
                    customer_name="刘经理",
                    customer_phone="13500135005",
                    viewing_date=datetime.utcnow() + timedelta(days=5, hours=11),
                    viewing_duration=60,
                    status="scheduled",
                    remarks="咨询公司，200㎡左右。\n想看装修中的房源，了解装修进度。\n预计下月中入住，时间能否配合？",
                    handler_id=2
                )
            ]
            db.add_all(viewings)
            db.flush()
            print("✅ 带看数据初始化完成，共5条带看记录")

            exceptions = [
                models.ExceptionRecord(
                    property_id=1,
                    exception_type="房源问题",
                    title="门锁损坏",
                    description="1501房间主门锁损坏，无法正常开启。上次带看时发现钥匙插入后无法转动。",
                    severity="high",
                    status="resolved",
                    solution="已联系物业更换新门锁，费用从物业费中扣除。新锁已安装完成。",
                    resolved_at=datetime.utcnow() - timedelta(days=5),
                    remarks="更换的是C级防盗锁，共3把钥匙。\n钥匙已交回前台保管。",
                    handler_id=2
                ),
                models.ExceptionRecord(
                    property_id=3,
                    exception_type="房源问题",
                    title="消防设施检查",
                    description="B座8层整层消防喷淋系统需要重新检查，部分喷头位置需要调整以符合新装修方案。",
                    severity="normal",
                    status="processing",
                    solution="已联系消防公司，明天上午上门检查并给出调整方案。预计3天内完成。",
                    remarks="调整费用需要客户承担还是从物业费中支出，待确认。",
                    handler_id=3
                ),
                models.ExceptionRecord(
                    viewing_id=4,
                    exception_type="客户问题",
                    title="客户迟到",
                    description="陈总原定15:00到现场，因临时会议推迟到15:30才到。现场等待时间过长。",
                    severity="low",
                    status="resolved",
                    solution="已重新安排带看时间，客户当天15:30到达后顺利完成带看。",
                    resolved_at=datetime.utcnow() - timedelta(days=3),
                    remarks="客户表示歉意，后续沟通顺畅。",
                    handler_id=3
                ),
                models.ExceptionRecord(
                    property_id=2,
                    exception_type="物业问题",
                    title="空调故障",
                    description="1803房间中央空调制冷效果差，客户带看时反映温度过高。",
                    severity="high",
                    status="pending",
                    remarks="已通知物业工程部门，待排查原因。\n可能需要清洗滤网或加雪种。",
                    handler_id=2
                )
            ]
            db.add_all(exceptions)
            db.flush()
            print("✅ 异常数据初始化完成，共4条异常记录")

            attachments = [
                models.Attachment(
                    property_id=1,
                    file_name="房源平面图.pdf",
                    file_type="application/pdf",
                    file_size=1024000,
                    storage_type="placeholder",
                    remarks="建筑设计院提供的原始平面图",
                    uploaded_by="张三"
                ),
                models.Attachment(
                    property_id=1,
                    file_name="室内照片1.jpg",
                    file_type="image/jpeg",
                    file_size=2048000,
                    storage_type="placeholder",
                    remarks="办公区全景照片",
                    uploaded_by="张三"
                ),
                models.Attachment(
                    viewing_id=3,
                    file_name="客户需求确认单.pdf",
                    file_type="application/pdf",
                    file_size=512000,
                    storage_type="placeholder",
                    remarks="客户签字确认的需求清单",
                    uploaded_by="李四"
                ),
                models.Attachment(
                    exception_id=1,
                    file_name="门锁维修单.jpg",
                    file_type="image/jpeg",
                    file_size=768000,
                    storage_type="placeholder",
                    remarks="物业维修确认单据",
                    uploaded_by="张三"
                )
            ]
            db.add_all(attachments)
            db.flush()
            print("✅ 附件数据初始化完成，共4条附件占位记录")

            operation_logs = [
                models.OperationLog(
                    target_type="property",
                    target_id=1,
                    operation_type="vacancy_update",
                    old_value="status: occupied; remarks: 原客户租约中",
                    new_value="status: vacant; remarks: 原客户为科技公司，装修保持良好...",
                    remarks="状态变更: occupied -> vacant; 备注: 合同到期，客户退租",
                    operator_id=2,
                    operator_name="张三",
                    created_at=datetime.utcnow() - timedelta(days=30)
                ),
                models.OperationLog(
                    target_type="property",
                    target_id=1,
                    operation_type="add_attachment",
                    new_value="添加附件: 房源平面图.pdf",
                    operator_id=2,
                    operator_name="张三",
                    created_at=datetime.utcnow() - timedelta(days=28)
                ),
                models.OperationLog(
                    target_type="exception",
                    target_id=1,
                    operation_type="create",
                    new_value="创建异常: 房源问题 - 门锁损坏 (房源ID: 1)",
                    remarks="上次带看时发现钥匙插入后无法转动。",
                    operator_id=2,
                    operator_name="张三",
                    created_at=datetime.utcnow() - timedelta(days=10)
                ),
                models.OperationLog(
                    target_type="exception",
                    target_id=1,
                    operation_type="status_update",
                    old_value="status: pending",
                    new_value="status: resolved; solution: 已联系物业更换新门锁...",
                    remarks="状态变更: pending -> resolved; 解决方案: 已联系物业更换新门锁，费用从物业费中扣除。新锁已安装完成。",
                    operator_id=2,
                    operator_name="张三",
                    created_at=datetime.utcnow() - timedelta(days=5)
                ),
                models.OperationLog(
                    target_type="viewing",
                    target_id=1,
                    operation_type="create",
                    new_value="创建带看: 王经理 - 国贸大厦A座 15层 1501 - " + str(datetime.utcnow() + timedelta(days=1, hours=10)),
                    remarks="客户来自互联网公司，需要200-300㎡办公空间。",
                    operator_id=2,
                    operator_name="张三",
                    created_at=datetime.utcnow() - timedelta(hours=2)
                )
            ]
            db.add_all(operation_logs)
            db.flush()
            print("✅ 操作日志初始化完成，共5条日志记录")

        db.commit()
        print("\n🎉 数据初始化全部完成！")
        print("💡 提示: 运行 'python -m uvicorn main:app --reload --port 8000' 启动后端服务")
        print("💡 提示: 访问 http://localhost:8000/docs 查看API文档")

    except Exception as e:
        db.rollback()
        print(f"❌ 数据初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_data()
