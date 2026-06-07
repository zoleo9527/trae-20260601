from datetime import datetime, timedelta
from app.database import db
from app.constants import (
    UserRole, ROLE_NAMES,
    OrderStatus, ORDER_STATUS_NAMES,
    DeliveryStatus, DELIVERY_STATUS_NAMES
)


def populate_sample_data():
    users = [
        {
            "id": "u_manager_001",
            "name": "张店长",
            "role": UserRole.STORE_MANAGER.value,
            "role_name": ROLE_NAMES[UserRole.STORE_MANAGER],
            "phone": "13800138001"
        },
        {
            "id": "u_manager_002",
            "name": "李店长",
            "role": UserRole.STORE_MANAGER.value,
            "role_name": ROLE_NAMES[UserRole.STORE_MANAGER],
            "phone": "13800138002"
        },
        {
            "id": "u_supervisor_001",
            "name": "王督导",
            "role": UserRole.SUPERVISOR.value,
            "role_name": ROLE_NAMES[UserRole.SUPERVISOR],
            "phone": "13900139001"
        },
        {
            "id": "u_product_001",
            "name": "赵商品",
            "role": UserRole.PRODUCT_SPECIALIST.value,
            "role_name": ROLE_NAMES[UserRole.PRODUCT_SPECIALIST],
            "phone": "13700137001"
        },
        {
            "id": "u_product_002",
            "name": "陈商品",
            "role": UserRole.PRODUCT_SPECIALIST.value,
            "role_name": ROLE_NAMES[UserRole.PRODUCT_SPECIALIST],
            "phone": "13700137002"
        }
    ]
    for u in users:
        if not db.get_by_id("users", u["id"]):
            db.add("users", u)
    
    stores = [
        {
            "id": "s_001",
            "name": "便利店-中心店",
            "code": "ZX001",
            "address": "市中心商业街88号",
            "manager_id": "u_manager_001",
            "supervisor_id": "u_supervisor_001"
        },
        {
            "id": "s_002",
            "name": "便利店-社区店",
            "code": "SQ002",
            "address": "阳光花园小区东门",
            "manager_id": "u_manager_002",
            "supervisor_id": "u_supervisor_001"
        }
    ]
    for s in stores:
        if not db.get_by_id("stores", s["id"]):
            db.add("stores", s)
    
    products = [
        {"id": "p_001", "name": "农夫山泉550ml", "sku": "SKU0001", "category": "饮料", "unit": "瓶", "price": 2.0},
        {"id": "p_002", "name": "康师傅红烧牛肉面", "sku": "SKU0002", "category": "方便食品", "unit": "桶", "price": 5.5},
        {"id": "p_003", "name": "奥利奥原味饼干", "sku": "SKU0003", "category": "零食", "unit": "盒", "price": 12.0},
        {"id": "p_004", "name": "蒙牛纯牛奶250ml", "sku": "SKU0004", "category": "乳品", "unit": "盒", "price": 3.5},
        {"id": "p_005", "name": "可口可乐330ml", "sku": "SKU0005", "category": "饮料", "unit": "罐", "price": 2.5},
        {"id": "p_006", "name": "乐事原味薯片", "sku": "SKU0006", "category": "零食", "unit": "袋", "price": 8.0},
        {"id": "p_007", "name": "统一冰红茶500ml", "sku": "SKU0007", "category": "饮料", "unit": "瓶", "price": 3.0},
        {"id": "p_008", "name": "德芙巧克力", "sku": "SKU0008", "category": "零食", "unit": "块", "price": 15.0}
    ]
    for p in products:
        if not db.get_by_id("products", p["id"]):
            db.add("products", p)
    
    _create_sample_order_1_full_completed()
    _create_sample_order_2_waiting_supervisor()
    _create_sample_order_3_waiting_product()
    _create_sample_order_4_partial_delivered()
    _create_sample_order_5_cancelled()


def _add_order_log(order_id, action, action_name, operator, from_status=None, to_status=None, remark=None, created_at=None):
    log = {
        "order_id": order_id,
        "action": action,
        "action_name": action_name,
        "operator_id": operator["id"],
        "operator_name": operator["name"],
        "operator_role": operator["role"],
        "operator_role_name": operator["role_name"],
        "from_status": from_status.value if from_status else None,
        "to_status": to_status.value if to_status else None,
        "remark": remark
    }
    if created_at:
        log["created_at"] = created_at
        log["updated_at"] = created_at
    db.add("order_logs", log)


def _create_sample_order_1_full_completed():
    manager = db.get_by_id("users", "u_manager_001")
    supervisor = db.get_by_id("users", "u_supervisor_001")
    product = db.get_by_id("users", "u_product_001")
    
    order_id = "order_001"
    base_time = datetime.now() - timedelta(days=3)
    
    items = [
        {"product_id": "p_001", "product_name": "农夫山泉550ml", "sku": "SKU0001", "quantity": 50, "unit_price": 2.0, "confirmed_quantity": 50, "delivered_quantity": 50},
        {"product_id": "p_002", "product_name": "康师傅红烧牛肉面", "sku": "SKU0002", "quantity": 30, "unit_price": 5.5, "confirmed_quantity": 30, "delivered_quantity": 30},
        {"product_id": "p_004", "product_name": "蒙牛纯牛奶250ml", "sku": "SKU0004", "quantity": 40, "unit_price": 3.5, "confirmed_quantity": 40, "delivered_quantity": 40}
    ]
    
    order = {
        "id": order_id,
        "order_no": "DZX001202606040001",
        "store_id": "s_001",
        "store_name": "便利店-中心店",
        "store_code": "ZX001",
        "manager_id": manager["id"],
        "manager_name": manager["name"],
        "supervisor_id": supervisor["id"],
        "supervisor_name": supervisor["name"],
        "product_specialist_id": product["id"],
        "product_specialist_name": product["name"],
        "status": OrderStatus.FULL_DELIVERED.value,
        "items": items,
        "total_amount": 50 * 2.0 + 30 * 5.5 + 40 * 3.5,
        "total_quantity": 120,
        "delivery_address": "市中心商业街88号",
        "expected_delivery_date": (base_time + timedelta(days=1)).strftime("%Y-%m-%d"),
        "created_at": base_time.isoformat(),
        "updated_at": base_time.isoformat()
    }
    db.add("store_orders", order)
    
    t0 = base_time
    t1 = base_time + timedelta(minutes=15)
    t2 = base_time + timedelta(hours=1)
    t3 = base_time + timedelta(hours=2)
    t4 = base_time + timedelta(hours=3)
    t5 = base_time + timedelta(hours=5)
    t6 = base_time + timedelta(hours=8)
    t7 = base_time + timedelta(hours=10)
    t8 = base_time + timedelta(days=1, hours=2)
    t9 = base_time + timedelta(days=1, hours=4)
    
    _add_order_log(order_id, "create", "创建订单", manager, None, OrderStatus.DRAFT,
                   "周一定期补货，矿泉水和牛奶库存告急", t0.isoformat())
    _add_order_log(order_id, "edit", "修改订单", manager, OrderStatus.DRAFT, OrderStatus.DRAFT,
                   "调整了方便面数量，从20桶增加到30桶，周末促销备货", t1.isoformat())
    _add_order_log(order_id, "submit", "提交订单", manager, OrderStatus.DRAFT, OrderStatus.SUBMITTED,
                   "订单确认无误，提交审核", t2.isoformat())
    _add_order_log(order_id, "supervisor_approve", "督导审核通过", supervisor, OrderStatus.SUBMITTED, OrderStatus.SUPERVISOR_APPROVED,
                   "订货量合理，符合门店历史销售数据，同意", t3.isoformat())
    _add_order_log(order_id, "product_confirm", "商品确认", product, OrderStatus.SUPERVISOR_APPROVED, OrderStatus.PRODUCT_REVIEWED,
                   "库存充足，全部确认，安排明天发货", t4.isoformat())
    _add_order_log(order_id, "assign_delivery", "分配配货", product, OrderStatus.PRODUCT_REVIEWED, OrderStatus.DELIVERY_ASSIGNED,
                   "创建配货单 PH20260604000001，中心仓出库", t5.isoformat())
    _add_order_log(order_id, "picking_start", "开始拣货", product, None, None,
                   "仓库开始拣货，预计2小时完成", t6.isoformat())
    _add_order_log(order_id, "packed", "打包完成", product, None, None,
                   "商品已打包，待物流发货", (t6 + timedelta(hours=1)).isoformat())
    _add_order_log(order_id, "shipped", "已发货", product, None, None,
                   "物流已发车，预计上午10点送达", t7.isoformat())
    _add_order_log(order_id, "received", "门店收货", manager, None, None,
                   "已收到全部商品，数量核对无误", t8.isoformat())
    _add_order_log(order_id, "delivery_confirmed", "配货完成确认", product, None, None,
                   "本次配货完成，订单结束", t9.isoformat())
    
    delivery = {
        "id": "delivery_001",
        "delivery_no": "PH20260604000001",
        "order_id": order_id,
        "order_no": order["order_no"],
        "store_id": "s_001",
        "store_name": "便利店-中心店",
        "status": DeliveryStatus.CONFIRMED.value,
        "items": [
            {"product_id": "p_001", "product_name": "农夫山泉550ml", "sku": "SKU0001", "quantity": 50, "unit_price": 2.0},
            {"product_id": "p_002", "product_name": "康师傅红烧牛肉面", "sku": "SKU0002", "quantity": 30, "unit_price": 5.5},
            {"product_id": "p_004", "product_name": "蒙牛纯牛奶250ml", "sku": "SKU0004", "quantity": 40, "unit_price": 3.5}
        ],
        "total_quantity": 120,
        "total_amount": order["total_amount"],
        "operator_id": product["id"],
        "operator_name": product["name"],
        "warehouse": "中心仓",
        "shipped_at": t7.isoformat(),
        "received_at": t8.isoformat(),
        "created_at": t5.isoformat(),
        "updated_at": t9.isoformat()
    }
    db.add("deliveries", delivery)


def _create_sample_order_2_waiting_supervisor():
    manager = db.get_by_id("users", "u_manager_002")
    supervisor = db.get_by_id("users", "u_supervisor_001")
    
    order_id = "order_002"
    base_time = datetime.now() - timedelta(hours=2)
    
    items = [
        {"product_id": "p_003", "product_name": "奥利奥原味饼干", "sku": "SKU0003", "quantity": 20, "unit_price": 12.0, "confirmed_quantity": None, "delivered_quantity": None},
        {"product_id": "p_005", "product_name": "可口可乐330ml", "sku": "SKU0005", "quantity": 60, "unit_price": 2.5, "confirmed_quantity": None, "delivered_quantity": None},
        {"product_id": "p_006", "product_name": "乐事原味薯片", "sku": "SKU0006", "quantity": 25, "unit_price": 8.0, "confirmed_quantity": None, "delivered_quantity": None}
    ]
    
    order = {
        "id": order_id,
        "order_no": "DSQ002202606070001",
        "store_id": "s_002",
        "store_name": "便利店-社区店",
        "store_code": "SQ002",
        "manager_id": manager["id"],
        "manager_name": manager["name"],
        "supervisor_id": supervisor["id"],
        "supervisor_name": supervisor["name"],
        "product_specialist_id": None,
        "product_specialist_name": None,
        "status": OrderStatus.SUBMITTED.value,
        "items": items,
        "total_amount": 20 * 12.0 + 60 * 2.5 + 25 * 8.0,
        "total_quantity": 105,
        "delivery_address": "阳光花园小区东门",
        "expected_delivery_date": datetime.now().strftime("%Y-%m-%d"),
        "created_at": base_time.isoformat(),
        "updated_at": (base_time + timedelta(minutes=30)).isoformat()
    }
    db.add("store_orders", order)
    
    t0 = base_time
    t1 = base_time + timedelta(minutes=10)
    t2 = base_time + timedelta(minutes=30)
    
    _add_order_log(order_id, "create", "创建订单", manager, None, OrderStatus.DRAFT,
                   "儿童节零食备货，预计周末客流大", t0.isoformat())
    _add_order_log(order_id, "edit", "修改订单", manager, OrderStatus.DRAFT, OrderStatus.DRAFT,
                   "追加了10箱可乐，天气热了饮料卖得快", t1.isoformat())
    _add_order_log(order_id, "submit", "提交订单", manager, OrderStatus.DRAFT, OrderStatus.SUBMITTED,
                   "请督导尽快审核，希望今天能发货", t2.isoformat())


def _create_sample_order_3_waiting_product():
    manager = db.get_by_id("users", "u_manager_001")
    supervisor = db.get_by_id("users", "u_supervisor_001")
    product = db.get_by_id("users", "u_product_002")
    
    order_id = "order_003"
    base_time = datetime.now() - timedelta(days=1, hours=3)
    
    items = [
        {"product_id": "p_007", "product_name": "统一冰红茶500ml", "sku": "SKU0007", "quantity": 100, "unit_price": 3.0, "confirmed_quantity": None, "delivered_quantity": None},
        {"product_id": "p_008", "product_name": "德芙巧克力", "sku": "SKU0008", "quantity": 15, "unit_price": 15.0, "confirmed_quantity": None, "delivered_quantity": None}
    ]
    
    order = {
        "id": order_id,
        "order_no": "DZX001202606060001",
        "store_id": "s_001",
        "store_name": "便利店-中心店",
        "store_code": "ZX001",
        "manager_id": manager["id"],
        "manager_name": manager["name"],
        "supervisor_id": supervisor["id"],
        "supervisor_name": supervisor["name"],
        "product_specialist_id": None,
        "product_specialist_name": None,
        "status": OrderStatus.SUPERVISOR_APPROVED.value,
        "items": items,
        "total_amount": 100 * 3.0 + 15 * 15.0,
        "total_quantity": 115,
        "delivery_address": "市中心商业街88号",
        "expected_delivery_date": datetime.now().strftime("%Y-%m-%d"),
        "created_at": base_time.isoformat(),
        "updated_at": (base_time + timedelta(hours=2)).isoformat()
    }
    db.add("store_orders", order)
    
    t0 = base_time
    t1 = base_time + timedelta(hours=1)
    t2 = base_time + timedelta(hours=2)
    
    _add_order_log(order_id, "create", "创建订单", manager, None, OrderStatus.DRAFT,
                   "高温天气，冰红茶需求量大", t0.isoformat())
    _add_order_log(order_id, "submit", "提交订单", manager, OrderStatus.DRAFT, OrderStatus.SUBMITTED,
                   "紧急订单，请优先处理", t1.isoformat())
    _add_order_log(order_id, "supervisor_approve", "督导审核通过", supervisor, OrderStatus.SUBMITTED, OrderStatus.SUPERVISOR_APPROVED,
                   "情况属实，近期气温35度+，同意加急处理", t2.isoformat())


def _create_sample_order_4_partial_delivered():
    manager = db.get_by_id("users", "u_manager_002")
    supervisor = db.get_by_id("users", "u_supervisor_001")
    product = db.get_by_id("users", "u_product_001")
    
    order_id = "order_004"
    base_time = datetime.now() - timedelta(days=2)
    
    items = [
        {"product_id": "p_001", "product_name": "农夫山泉550ml", "sku": "SKU0001", "quantity": 80, "unit_price": 2.0, "confirmed_quantity": 80, "delivered_quantity": 50},
        {"product_id": "p_002", "product_name": "康师傅红烧牛肉面", "sku": "SKU0002", "quantity": 40, "unit_price": 5.5, "confirmed_quantity": 40, "delivered_quantity": 40}
    ]
    
    order = {
        "id": order_id,
        "order_no": "DSQ002202606050001",
        "store_id": "s_002",
        "store_name": "便利店-社区店",
        "store_code": "SQ002",
        "manager_id": manager["id"],
        "manager_name": manager["name"],
        "supervisor_id": supervisor["id"],
        "supervisor_name": supervisor["name"],
        "product_specialist_id": product["id"],
        "product_specialist_name": product["name"],
        "status": OrderStatus.PARTIAL_DELIVERED.value,
        "items": items,
        "total_amount": 80 * 2.0 + 40 * 5.5,
        "total_quantity": 120,
        "delivery_address": "阳光花园小区东门",
        "expected_delivery_date": (base_time + timedelta(days=1)).strftime("%Y-%m-%d"),
        "created_at": base_time.isoformat(),
        "updated_at": (base_time + timedelta(days=1, hours=5)).isoformat()
    }
    db.add("store_orders", order)
    
    t0 = base_time
    t1 = base_time + timedelta(minutes=20)
    t2 = base_time + timedelta(hours=1)
    t3 = base_time + timedelta(hours=3)
    t4 = base_time + timedelta(hours=5)
    t5 = base_time + timedelta(days=1, hours=2)
    
    _add_order_log(order_id, "create", "创建订单", manager, None, OrderStatus.DRAFT,
                   "周末促销备货", t0.isoformat())
    _add_order_log(order_id, "submit", "提交订单", manager, OrderStatus.DRAFT, OrderStatus.SUBMITTED,
                   "", t1.isoformat())
    _add_order_log(order_id, "supervisor_approve", "督导审核通过", supervisor, OrderStatus.SUBMITTED, OrderStatus.SUPERVISOR_APPROVED,
                   "", t2.isoformat())
    _add_order_log(order_id, "product_adjust", "商品调整", product, OrderStatus.SUPERVISOR_APPROVED, OrderStatus.PRODUCT_REVIEWED,
                   "农夫山泉库存紧张，先确认能发50瓶，剩余30瓶后天补送", t3.isoformat())
    _add_order_log(order_id, "assign_delivery", "分配配货", product, OrderStatus.PRODUCT_REVIEWED, OrderStatus.DELIVERY_ASSIGNED,
                   "先发送有货的部分，配货单 PH20260605000002", t4.isoformat())
    _add_order_log(order_id, "shipped", "已发货", product, None, None,
                   "部分商品已发出，矿泉水30瓶欠发", t5.isoformat())
    
    delivery = {
        "id": "delivery_002",
        "delivery_no": "PH20260605000002",
        "order_id": order_id,
        "order_no": order["order_no"],
        "store_id": "s_002",
        "store_name": "便利店-社区店",
        "status": DeliveryStatus.SHIPPED.value,
        "items": [
            {"product_id": "p_001", "product_name": "农夫山泉550ml", "sku": "SKU0001", "quantity": 50, "unit_price": 2.0},
            {"product_id": "p_002", "product_name": "康师傅红烧牛肉面", "sku": "SKU0002", "quantity": 40, "unit_price": 5.5}
        ],
        "total_quantity": 90,
        "total_amount": 50 * 2.0 + 40 * 5.5,
        "operator_id": product["id"],
        "operator_name": product["name"],
        "warehouse": "中心仓",
        "shipped_at": t5.isoformat(),
        "received_at": None,
        "created_at": t4.isoformat(),
        "updated_at": t5.isoformat()
    }
    db.add("deliveries", delivery)


def _create_sample_order_5_cancelled():
    manager = db.get_by_id("users", "u_manager_001")
    supervisor = db.get_by_id("users", "u_supervisor_001")
    
    order_id = "order_005"
    base_time = datetime.now() - timedelta(days=5)
    
    items = [
        {"product_id": "p_008", "product_name": "德芙巧克力", "sku": "SKU0008", "quantity": 50, "unit_price": 15.0, "confirmed_quantity": None, "delivered_quantity": None}
    ]
    
    order = {
        "id": order_id,
        "order_no": "DZX001202606020001",
        "store_id": "s_001",
        "store_name": "便利店-中心店",
        "store_code": "ZX001",
        "manager_id": manager["id"],
        "manager_name": manager["name"],
        "supervisor_id": supervisor["id"],
        "supervisor_name": supervisor["name"],
        "product_specialist_id": None,
        "product_specialist_name": None,
        "status": OrderStatus.CANCELLED.value,
        "items": items,
        "total_amount": 50 * 15.0,
        "total_quantity": 50,
        "delivery_address": "市中心商业街88号",
        "expected_delivery_date": (base_time + timedelta(days=1)).strftime("%Y-%m-%d"),
        "created_at": base_time.isoformat(),
        "updated_at": (base_time + timedelta(hours=3)).isoformat()
    }
    db.add("store_orders", order)
    
    t0 = base_time
    t1 = base_time + timedelta(hours=1)
    t2 = base_time + timedelta(hours=2)
    t3 = base_time + timedelta(hours=3)
    
    _add_order_log(order_id, "create", "创建订单", manager, None, OrderStatus.DRAFT,
                   "情人节备货，巧克力促销", t0.isoformat())
    _add_order_log(order_id, "submit", "提交订单", manager, OrderStatus.DRAFT, OrderStatus.SUBMITTED,
                   "", t1.isoformat())
    _add_order_log(order_id, "supervisor_reject", "督导驳回", supervisor, OrderStatus.SUBMITTED, OrderStatus.DRAFT,
                   "订货量过大，历史同期只卖了20块，建议订30块", t2.isoformat())
    _add_order_log(order_id, "cancel", "取消订单", manager, OrderStatus.DRAFT, OrderStatus.CANCELLED,
                   "算了，先不订了，等下次再说", t3.isoformat())
