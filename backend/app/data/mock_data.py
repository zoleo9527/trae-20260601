from datetime import datetime, timedelta
from app.models import User, Order, Accessory, InstallationPhoto, AfterSalesRecord, ResponsibilityResult, RejectionRecord, ProgressTracking, Alert, Question

users_db = {}
orders_db = {}
alerts_db = {}

def init_mock_data():
    users_db["dispatcher001"] = User(
        id="dispatcher001", name="张调度", role="dispatcher", phone="13800138001"
    )
    users_db["technician001"] = User(
        id="technician001", name="李师傅", role="technician", phone="13800138002"
    )
    users_db["technician002"] = User(
        id="technician002", name="王师傅", role="technician", phone="13800138003"
    )
    users_db["service001"] = User(
        id="service001", name="陈客服", role="customer_service", phone="13800138004"
    )

    orders_db["ORD20240101001"] = Order(
        id="ORD20240101001",
        customer_name="刘先生",
        customer_phone="13900139001",
        address="北京市朝阳区幸福小区1号楼201室",
        product_type="花洒套装",
        product_model="HS-2024",
        scheduled_date=datetime.now() - timedelta(days=5),
        status="completed",
        technician_id="technician001",
        dispatcher_id="dispatcher001",
        accessories=[
            Accessory(id="ACC001", name="花洒头", quantity=1, used=True, installed=True),
            Accessory(id="ACC002", name="软管", quantity=1, used=True, installed=True),
            Accessory(id="ACC003", name="生料带", quantity=1, used=True, installed=True),
        ],
        photos=[
            InstallationPhoto(
                id="PHOTO001",
                order_id="ORD20240101001",
                photo_url="https://picsum.photos/seed/photo1/600/400",
                description="安装完成正面照",
                photo_type="after",
                uploaded_at=datetime.now() - timedelta(days=5),
                uploaded_by="technician001"
            )
        ],
        progress_trackings=[
            ProgressTracking(id="PT001", order_id="ORD20240101001", stage="订单创建", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=7), notes="订单已创建"),
            ProgressTracking(id="PT002", order_id="ORD20240101001", stage="师傅分配", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=6), notes="分配李师傅"),
            ProgressTracking(id="PT003", order_id="ORD20240101001", stage="接单", status="completed", operator_id="technician001", operated_at=datetime.now() - timedelta(days=5), notes="已接单"),
            ProgressTracking(id="PT004", order_id="ORD20240101001", stage="安装中", status="completed", operator_id="technician001", operated_at=datetime.now() - timedelta(days=5), notes="安装完成"),
            ProgressTracking(id="PT005", order_id="ORD20240101001", stage="完成", status="completed", operator_id="technician001", operated_at=datetime.now() - timedelta(days=5), notes="安装完成"),
        ],
        created_at=datetime.now() - timedelta(days=7),
        updated_at=datetime.now() - timedelta(days=5)
    )

    orders_db["ORD20240102001"] = Order(
        id="ORD20240102001",
        customer_name="赵女士",
        customer_phone="13900139002",
        address="上海市浦东新区阳光花园3号楼502室",
        product_type="马桶",
        product_model="MT-2024",
        scheduled_date=datetime.now() - timedelta(days=3),
        status="rework_requested",
        technician_id="technician002",
        dispatcher_id="dispatcher001",
        accessories=[
            Accessory(id="ACC004", name="马桶主体", quantity=1, used=True, installed=True),
            Accessory(id="ACC005", name="法兰圈", quantity=1, used=True, installed=True),
            Accessory(id="ACC006", name="螺栓", quantity=2, used=True, installed=True),
        ],
        photos=[
            InstallationPhoto(
                id="PHOTO002",
                order_id="ORD20240102001",
                photo_url="https://picsum.photos/seed/photo2/600/400",
                description="马桶安装完成",
                photo_type="after",
                uploaded_at=datetime.now() - timedelta(days=3),
                uploaded_by="technician002"
            ),
            InstallationPhoto(
                id="PHOTO003",
                order_id="ORD20240102001",
                photo_url="https://picsum.photos/seed/leak1/600/400",
                description="马桶底部漏水",
                photo_type="leakage",
                uploaded_at=datetime.now() - timedelta(days=2),
                uploaded_by="service001"
            )
        ],
        after_sales_records=[
            AfterSalesRecord(
                id="ASR001",
                order_id="ORD20240102001",
                type="leakage",
                description="马桶底部漏水，地面有水渍",
                photos=["https://picsum.photos/seed/leak1/600/400"],
                reported_at=datetime.now() - timedelta(days=2),
                reported_by="service001",
                status="pending"
            )
        ],
        progress_trackings=[
            ProgressTracking(id="PT006", order_id="ORD20240102001", stage="订单创建", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=5)),
            ProgressTracking(id="PT007", order_id="ORD20240102001", stage="师傅分配", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=4)),
            ProgressTracking(id="PT008", order_id="ORD20240102001", stage="接单", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=3)),
            ProgressTracking(id="PT009", order_id="ORD20240102001", stage="安装中", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=3)),
            ProgressTracking(id="PT010", order_id="ORD20240102001", stage="完成", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=3)),
            ProgressTracking(id="PT011", order_id="ORD20240102001", stage="售后报修", status="completed", operator_id="service001", operated_at=datetime.now() - timedelta(days=2), notes="马桶底部漏水"),
            ProgressTracking(id="PT012", order_id="ORD20240102001", stage="返工申请", status="in_progress", operator_id="service001", operated_at=datetime.now() - timedelta(days=1), notes="已发起返工"),
        ],
        questions=[
            Question(
                id="Q001",
                order_id="ORD20240102001",
                question="请问漏水情况是什么时候发现的？漏水程度如何？",
                asked_by="dispatcher001",
                asked_at=datetime.now() - timedelta(hours=5),
                answer="漏水是昨天下午发现的，地面有明显水渍，约1平米范围",
                answered_by="service001",
                answered_at=datetime.now() - timedelta(hours=4)
            )
        ],
        created_at=datetime.now() - timedelta(days=5),
        updated_at=datetime.now() - timedelta(days=1)
    )

    orders_db["ORD20240103001"] = Order(
        id="ORD20240103001",
        customer_name="孙先生",
        customer_phone="13900139003",
        address="广州市天河区珠江新城A座1803室",
        product_type="浴室柜",
        product_model="YG-2024",
        scheduled_date=datetime.now() + timedelta(days=2),
        status="pending",
        dispatcher_id="dispatcher001",
        accessories=[
            Accessory(id="ACC007", name="柜体", quantity=1),
            Accessory(id="ACC008", name="台面", quantity=1),
            Accessory(id="ACC009", name="水龙头", quantity=1),
        ],
        progress_trackings=[
            ProgressTracking(id="PT013", order_id="ORD20240103001", stage="订单创建", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=2)),
        ],
        created_at=datetime.now() - timedelta(days=2),
        updated_at=datetime.now() - timedelta(days=2)
    )

    orders_db["ORD20240104001"] = Order(
        id="ORD20240104001",
        customer_name="周女士",
        customer_phone="13900139004",
        address="深圳市南山区科技园路88号",
        product_type="淋浴屏",
        product_model="LY-2024",
        scheduled_date=datetime.now() - timedelta(days=1),
        status="rework_in_progress",
        technician_id="technician001",
        dispatcher_id="dispatcher001",
        accessories=[
            Accessory(id="ACC010", name="玻璃门", quantity=1, used=True, installed=True),
            Accessory(id="ACC011", name="导轨", quantity=1, used=True, installed=True),
            Accessory(id="ACC012", name="密封胶", quantity=1, used=True, installed=True),
        ],
        photos=[
            InstallationPhoto(
                id="PHOTO004",
                order_id="ORD20240104001",
                photo_url="https://picsum.photos/seed/photo4/600/400",
                description="淋浴屏安装",
                photo_type="after",
                uploaded_at=datetime.now() - timedelta(days=1),
                uploaded_by="technician001"
            ),
            InstallationPhoto(
                id="PHOTO005",
                order_id="ORD20240104001",
                photo_url="https://picsum.photos/seed/leak2/600/400",
                description="淋浴屏底部漏水",
                photo_type="leakage",
                uploaded_at=datetime.now(),
                uploaded_by="service001"
            )
        ],
        after_sales_records=[
            AfterSalesRecord(
                id="ASR002",
                order_id="ORD20240104001",
                type="leakage",
                description="淋浴屏底部密封处漏水",
                photos=["https://picsum.photos/seed/leak2/600/400"],
                reported_at=datetime.now(),
                reported_by="service001",
                status="processing"
            )
        ],
        progress_trackings=[
            ProgressTracking(id="PT014", order_id="ORD20240104001", stage="订单创建", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=3)),
            ProgressTracking(id="PT015", order_id="ORD20240104001", stage="师傅分配", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=2)),
            ProgressTracking(id="PT016", order_id="ORD20240104001", stage="接单", status="completed", operator_id="technician001", operated_at=datetime.now() - timedelta(days=1)),
            ProgressTracking(id="PT017", order_id="ORD20240104001", stage="安装中", status="completed", operator_id="technician001", operated_at=datetime.now() - timedelta(days=1)),
            ProgressTracking(id="PT018", order_id="ORD20240104001", stage="完成", status="completed", operator_id="technician001", operated_at=datetime.now() - timedelta(days=1)),
            ProgressTracking(id="PT019", order_id="ORD20240104001", stage="售后报修", status="completed", operator_id="service001", operated_at=datetime.now(), notes="淋浴屏底部密封处漏水"),
            ProgressTracking(id="PT020", order_id="ORD20240104001", stage="返工申请", status="completed", operator_id="service001", operated_at=datetime.now()),
            ProgressTracking(id="PT021", order_id="ORD20240104001", stage="返工中", status="in_progress", operator_id="technician001", operated_at=datetime.now()),
        ],
        created_at=datetime.now() - timedelta(days=3),
        updated_at=datetime.now()
    )

    orders_db["ORD20240105001"] = Order(
        id="ORD20240105001",
        customer_name="吴先生",
        customer_phone="13900139005",
        address="杭州市西湖区文三路123号",
        product_type="浴缸",
        product_model="YG-2024",
        scheduled_date=datetime.now() - timedelta(days=7),
        status="liability_pending",
        technician_id="technician002",
        dispatcher_id="dispatcher001",
        accessories=[
            Accessory(id="ACC013", name="浴缸主体", quantity=1, used=True, installed=True),
            Accessory(id="ACC014", name="下水器", quantity=1, used=True, installed=True),
            Accessory(id="ACC015", name="密封胶", quantity=1, used=True, installed=True),
        ],
        photos=[
            InstallationPhoto(
                id="PHOTO006",
                order_id="ORD20240105001",
                photo_url="https://picsum.photos/seed/photo6/600/400",
                description="浴缸安装完成",
                photo_type="after",
                uploaded_at=datetime.now() - timedelta(days=7),
                uploaded_by="technician002"
            ),
            InstallationPhoto(
                id="PHOTO007",
                order_id="ORD20240105001",
                photo_url="https://picsum.photos/seed/leak3/600/400",
                description="浴缸下水口漏水",
                photo_type="leakage",
                uploaded_at=datetime.now() - timedelta(days=6),
                uploaded_by="service001"
            )
        ],
        after_sales_records=[
            AfterSalesRecord(
                id="ASR003",
                order_id="ORD20240105001",
                type="leakage",
                description="浴缸下水口漏水",
                photos=["https://picsum.photos/seed/leak3/600/400"],
                reported_at=datetime.now() - timedelta(days=6),
                reported_by="service001",
                status="resolved"
            )
        ],
        progress_trackings=[
            ProgressTracking(id="PT022", order_id="ORD20240105001", stage="订单创建", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=10)),
            ProgressTracking(id="PT023", order_id="ORD20240105001", stage="师傅分配", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=9)),
            ProgressTracking(id="PT024", order_id="ORD20240105001", stage="接单", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=8)),
            ProgressTracking(id="PT025", order_id="ORD20240105001", stage="安装中", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=7)),
            ProgressTracking(id="PT026", order_id="ORD20240105001", stage="完成", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=7)),
            ProgressTracking(id="PT027", order_id="ORD20240105001", stage="售后报修", status="completed", operator_id="service001", operated_at=datetime.now() - timedelta(days=6)),
            ProgressTracking(id="PT028", order_id="ORD20240105001", stage="返工申请", status="completed", operator_id="service001", operated_at=datetime.now() - timedelta(days=5)),
            ProgressTracking(id="PT029", order_id="ORD20240105001", stage="返工中", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=5)),
            ProgressTracking(id="PT030", order_id="ORD20240105001", stage="返工完成", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=5)),
            ProgressTracking(id="PT031", order_id="ORD20240105001", stage="责任判定", status="in_progress", operator_id="service001", operated_at=datetime.now() - timedelta(days=4)),
        ],
        rejection_records=[
            RejectionRecord(
                id="R001",
                liability_id="RES001",
                order_id="ORD20240105001",
                reason="责任判定证据不足，缺少安装过程照片",
                rejected_by="dispatcher001",
                rejected_at=datetime.now() - timedelta(days=4),
                additional_evidence_required=["安装过程照片", "配件使用记录"],
                status="resolved"
            )
        ],
        questions=[
            Question(
                id="Q002",
                order_id="ORD20240105001",
                question="返工修复后是否进行了试水测试？结果如何？",
                asked_by="dispatcher001",
                asked_at=datetime.now() - timedelta(days=3),
            )
        ],
        created_at=datetime.now() - timedelta(days=10),
        updated_at=datetime.now() - timedelta(days=4)
    )

    orders_db["ORD20240106001"] = Order(
        id="ORD20240106001",
        customer_name="郑女士",
        customer_phone="13900139006",
        address="成都市锦江区春熙路88号",
        product_type="智能马桶盖",
        product_model="ZN-2024",
        scheduled_date=datetime.now() - timedelta(days=2),
        status="in_progress",
        technician_id="technician001",
        dispatcher_id="dispatcher001",
        accessories=[
            Accessory(id="ACC016", name="马桶盖主体", quantity=1, used=True, installed=True),
            Accessory(id="ACC017", name="安装支架", quantity=1, used=True, installed=True),
            Accessory(id="ACC018", name="电源线", quantity=1, used=True, installed=True),
        ],
        photos=[
            InstallationPhoto(
                id="PHOTO008",
                order_id="ORD20240106001",
                photo_url="https://picsum.photos/seed/photo8/600/400",
                description="安装前",
                photo_type="before",
                uploaded_at=datetime.now() - timedelta(days=2),
                uploaded_by="technician001"
            ),
            InstallationPhoto(
                id="PHOTO009",
                order_id="ORD20240106001",
                photo_url="https://picsum.photos/seed/photo9/600/400",
                description="安装中",
                photo_type="during",
                uploaded_at=datetime.now() - timedelta(days=2),
                uploaded_by="technician001"
            )
        ],
        progress_trackings=[
            ProgressTracking(id="PT032", order_id="ORD20240106001", stage="订单创建", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=4)),
            ProgressTracking(id="PT033", order_id="ORD20240106001", stage="师傅分配", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=3)),
            ProgressTracking(id="PT034", order_id="ORD20240106001", stage="接单", status="completed", operator_id="technician001", operated_at=datetime.now() - timedelta(days=2)),
            ProgressTracking(id="PT035", order_id="ORD20240106001", stage="安装中", status="in_progress", operator_id="technician001", operated_at=datetime.now() - timedelta(days=2)),
        ],
        created_at=datetime.now() - timedelta(days=4),
        updated_at=datetime.now() - timedelta(days=2)
    )

    orders_db["ORD20240107001"] = Order(
        id="ORD20240107001",
        customer_name="冯先生",
        customer_phone="13900139007",
        address="武汉市江汉区解放大道1234号",
        product_type="洗手盆",
        product_model="XS-2024",
        scheduled_date=datetime.now() + timedelta(days=1),
        status="accepted",
        technician_id="technician002",
        dispatcher_id="dispatcher001",
        accessories=[
            Accessory(id="ACC019", name="洗手盆", quantity=1),
            Accessory(id="ACC020", name="下水器", quantity=1),
            Accessory(id="ACC021", name="水龙头", quantity=1),
        ],
        progress_trackings=[
            ProgressTracking(id="PT036", order_id="ORD20240107001", stage="订单创建", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=1)),
            ProgressTracking(id="PT037", order_id="ORD20240107001", stage="师傅分配", status="completed", operator_id="dispatcher001", operated_at=datetime.now()),
            ProgressTracking(id="PT038", order_id="ORD20240107001", stage="接单", status="completed", operator_id="technician002", operated_at=datetime.now()),
        ],
        created_at=datetime.now() - timedelta(days=1),
        updated_at=datetime.now()
    )

    orders_db["ORD20240108001"] = Order(
        id="ORD20240108001",
        customer_name="许女士",
        customer_phone="13900139008",
        address="南京市鼓楼区中山路100号",
        product_type="淋浴房",
        product_model="LF-2024",
        scheduled_date=datetime.now() - timedelta(days=4),
        status="resolved",
        technician_id="technician002",
        dispatcher_id="dispatcher001",
        accessories=[
            Accessory(id="ACC022", name="玻璃面板", quantity=2, used=True, installed=True),
            Accessory(id="ACC023", name="铝合金框架", quantity=1, used=True, installed=True),
            Accessory(id="ACC024", name="密封条", quantity=2, used=True, installed=True),
        ],
        photos=[
            InstallationPhoto(
                id="PHOTO010",
                order_id="ORD20240108001",
                photo_url="https://picsum.photos/seed/photo10/600/400",
                description="淋浴房安装完成",
                photo_type="after",
                uploaded_at=datetime.now() - timedelta(days=4),
                uploaded_by="technician002"
            ),
            InstallationPhoto(
                id="PHOTO011",
                order_id="ORD20240108001",
                photo_url="https://picsum.photos/seed/leak4/600/400",
                description="淋浴房角落漏水",
                photo_type="leakage",
                uploaded_at=datetime.now() - timedelta(days=3),
                uploaded_by="service001"
            ),
            InstallationPhoto(
                id="PHOTO012",
                order_id="ORD20240108001",
                photo_url="https://picsum.photos/seed/rework1/600/400",
                description="返工修复后",
                photo_type="rework",
                uploaded_at=datetime.now() - timedelta(days=2),
                uploaded_by="technician002"
            )
        ],
        after_sales_records=[
            AfterSalesRecord(
                id="ASR004",
                order_id="ORD20240108001",
                type="leakage",
                description="淋浴房角落漏水",
                photos=["https://picsum.photos/seed/leak4/600/400"],
                reported_at=datetime.now() - timedelta(days=3),
                reported_by="service001",
                status="resolved"
            )
        ],
        responsibility_result=ResponsibilityResult(
            id="RES002",
            order_id="ORD20240108001",
            responsible_party="supplier",
            reason="密封条质量问题导致漏水",
            evidence=["https://picsum.photos/seed/evidence2/600/400"],
            created_at=datetime.now() - timedelta(days=3),
            created_by="service001",
            status="final",
            compensation_amount=500.0
        ),
        progress_trackings=[
            ProgressTracking(id="PT039", order_id="ORD20240108001", stage="订单创建", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=6)),
            ProgressTracking(id="PT040", order_id="ORD20240108001", stage="师傅分配", status="completed", operator_id="dispatcher001", operated_at=datetime.now() - timedelta(days=5)),
            ProgressTracking(id="PT041", order_id="ORD20240108001", stage="接单", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=4)),
            ProgressTracking(id="PT042", order_id="ORD20240108001", stage="安装中", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=4)),
            ProgressTracking(id="PT043", order_id="ORD20240108001", stage="完成", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=4)),
            ProgressTracking(id="PT044", order_id="ORD20240108001", stage="售后报修", status="completed", operator_id="service001", operated_at=datetime.now() - timedelta(days=3)),
            ProgressTracking(id="PT045", order_id="ORD20240108001", stage="返工申请", status="completed", operator_id="service001", operated_at=datetime.now() - timedelta(days=3)),
            ProgressTracking(id="PT046", order_id="ORD20240108001", stage="返工中", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=2)),
            ProgressTracking(id="PT047", order_id="ORD20240108001", stage="返工完成", status="completed", operator_id="technician002", operated_at=datetime.now() - timedelta(days=2)),
            ProgressTracking(id="PT048", order_id="ORD20240108001", stage="责任判定", status="completed", operator_id="service001", operated_at=datetime.now() - timedelta(days=3)),
            ProgressTracking(id="PT049", order_id="ORD20240108001", stage="已解决", status="completed", operator_id="service001", operated_at=datetime.now() - timedelta(days=2)),
        ],
        created_at=datetime.now() - timedelta(days=6),
        updated_at=datetime.now() - timedelta(days=2)
    )

    alerts_db["ALERT001"] = Alert(
        id="ALERT001",
        type="leakage",
        order_id="ORD20240102001",
        message="订单 ORD20240102001 发生漏水报修，需要处理",
        severity="high",
        created_at=datetime.now() - timedelta(days=2),
        is_read=False
    )

    alerts_db["ALERT002"] = Alert(
        id="ALERT002",
        type="pending_liability",
        order_id="ORD20240105001",
        message="订单 ORD20240105001 等待责任判定",
        severity="medium",
        created_at=datetime.now() - timedelta(days=4),
        is_read=False
    )

    alerts_db["ALERT003"] = Alert(
        id="ALERT003",
        type="timeout",
        order_id="ORD20240103001",
        message="订单 ORD20240103001 即将到期，需要尽快分配师傅",
        severity="low",
        created_at=datetime.now() - timedelta(hours=5),
        is_read=False
    )

    alerts_db["ALERT004"] = Alert(
        id="ALERT004",
        type="rejection",
        order_id="ORD20240105001",
        message="订单 ORD20240105001 的责任判定被驳回，需要补充证据",
        severity="high",
        created_at=datetime.now() - timedelta(days=4),
        is_read=True
    )