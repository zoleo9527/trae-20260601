from sqlalchemy.orm import Session
from . import models, schemas, crud
from .database import engine, SessionLocal
from .auth import get_password_hash


def init_db():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            _create_users(db)
            _create_tenants(db)
            _create_licenses(db)
            _create_activities(db)
            _create_complaints(db)
            _create_history_records(db)
    finally:
        db.close()


def _create_users(db: Session):
    users = [
        schemas.UserCreate(username="admin", password="admin123", role="admin", name="系统管理员"),
        schemas.UserCreate(username="operation", password="op123", role="operation", name="营运专员小李"),
        schemas.UserCreate(username="service", password="sv123", role="customer_service", name="客服台小王"),
        schemas.UserCreate(username="engineering", password="en123", role="engineering", name="工程部老张"),
    ]
    for user in users:
        crud.create_user(db, user)
    print("Users created successfully")


def _create_tenants(db: Session):
    tenants = [
        {"name": "优衣库", "shop_number": "1F-001", "contact": "张经理", "phone": "13800138001", "status": "settled", "created_by": 1},
        {"name": "海底捞", "shop_number": "4F-001", "contact": "李店长", "phone": "13800138002", "status": "settled", "created_by": 2},
        {"name": "星巴克", "shop_number": "1F-002", "contact": "王主管", "phone": "13800138003", "status": "approved", "created_by": 1},
        {"name": "小米之家", "shop_number": "2F-001", "contact": "赵经理", "phone": "13800138004", "status": "pending", "created_by": 2},
        {"name": "耐克旗舰店", "shop_number": "3F-001", "contact": "陈店长", "phone": "13800138005", "status": "rejected", "created_by": 1},
    ]
    for tenant_data in tenants:
        tenant = schemas.TenantCreate(**{k: v for k, v in tenant_data.items() if k != "created_by" and k != "status"})
        db_tenant = crud.create_tenant(db, tenant, tenant_data["created_by"])
        db_tenant.status = tenant_data["status"]
        db.commit()
        db.refresh(db_tenant)
    print("Tenants created successfully")


def _create_licenses(db: Session):
    licenses = [
        {"tenant_id": 1, "license_type": "营业执照", "license_number": "91110000MA001ABC01", "expire_date": "2028-12-31", "status": "approved"},
        {"tenant_id": 1, "license_type": "食品经营许可证", "license_number": "JY1110105001234", "expire_date": "2027-06-30", "status": "approved"},
        {"tenant_id": 2, "license_type": "营业执照", "license_number": "91110000MA002DEF02", "expire_date": "2029-03-15", "status": "approved"},
        {"tenant_id": 2, "license_type": "餐饮服务许可证", "license_number": "CY110105005678", "expire_date": "2026-11-20", "status": "need_reupload"},
        {"tenant_id": 3, "license_type": "营业执照", "license_number": "91110000MA003GHI03", "expire_date": "2028-08-01", "status": "pending"},
        {"tenant_id": 4, "license_type": "营业执照", "license_number": "91110000MA004JKL04", "expire_date": "2027-01-10", "status": "rejected"},
    ]
    for license_data in licenses:
        license = schemas.LicenseCreate(**{k: v for k, v in license_data.items() if k != "status"})
        db_license = crud.create_license(db, license)
        db_license.status = license_data["status"]
        db.commit()
        db.refresh(db_license)
    print("Licenses created successfully")


def _create_activities(db: Session):
    activities = [
        {"tenant_id": 1, "title": "夏季新品促销", "content": "优衣库夏季新品上市，全场满300减50", "start_date": "2026-06-15", "end_date": "2026-06-30", "status": "approved"},
        {"tenant_id": 2, "title": "店庆特惠活动", "content": "海底捞开业一周年，全场菜品8折", "start_date": "2026-07-01", "end_date": "2026-07-07", "status": "pending"},
        {"tenant_id": 3, "title": "咖啡品鉴会", "content": "星巴克新品咖啡品鉴，邀请会员参与", "start_date": "2026-06-20", "end_date": "2026-06-21", "status": "pending"},
        {"tenant_id": 4, "title": "米粉节特惠", "content": "小米之家米粉节，多款产品直降", "start_date": "2026-08-01", "end_date": "2026-08-10", "status": "rejected"},
    ]
    for activity_data in activities:
        activity = schemas.ActivityCreate(**{k: v for k, v in activity_data.items() if k != "status"})
        db_activity = crud.create_activity(db, activity)
        db_activity.status = activity_data["status"]
        db.commit()
        db.refresh(db_activity)
    print("Activities created successfully")


def _create_complaints(db: Session):
    complaints = [
        {"tenant_id": 1, "title": "空调温度过低", "content": "店内空调温度设置过低，顾客反映寒冷", "status": "resolved", "handler": 4},
        {"tenant_id": 2, "title": "排烟系统故障", "content": "厨房排烟系统出现故障，影响周边店铺", "status": "processing", "handler": 4},
        {"tenant_id": 3, "title": "休息区座椅不足", "content": "顾客休息区座椅数量不足，高峰期无法满足需求", "status": "pending", "handler": None},
        {"tenant_id": 1, "title": "扶梯停运", "content": "一楼扶梯临时停运，影响顾客通行", "status": "resolved", "handler": 4},
    ]
    for complaint_data in complaints:
        complaint = schemas.ComplaintCreate(**{k: v for k, v in complaint_data.items() if k != "status" and k != "handler"})
        db_complaint = crud.create_complaint(db, complaint)
        db_complaint.status = complaint_data["status"]
        db_complaint.handler = complaint_data["handler"]
        db.commit()
        db.refresh(db_complaint)
    print("Complaints created successfully")


def _create_history_records(db: Session):
    records = [
        {"related_type": "tenant", "related_id": 1, "action": "提交入驻申请", "remark": "优衣库提交入驻申请，铺位1F-001", "operator_name": "营运专员小李"},
        {"related_type": "tenant", "related_id": 1, "action": "审核通过", "remark": "资料齐全，符合入驻条件，品牌资质审核通过", "operator_name": "系统管理员"},
        {"related_type": "tenant", "related_id": 1, "action": "已入驻", "remark": "已完成入驻手续，铺位交付使用", "operator_name": "系统管理员"},

        {"related_type": "tenant", "related_id": 2, "action": "提交入驻申请", "remark": "海底捞提交入驻申请，铺位4F-001", "operator_name": "营运专员小李"},
        {"related_type": "tenant", "related_id": 2, "action": "审核通过", "remark": "餐饮类租户，需额外办理餐饮服务许可证", "operator_name": "系统管理员"},
        {"related_type": "tenant", "related_id": 2, "action": "已入驻", "remark": "已完成入驻手续及装修验收", "operator_name": "营运专员小李"},

        {"related_type": "tenant", "related_id": 3, "action": "提交入驻申请", "remark": "星巴克提交入驻申请，铺位1F-002", "operator_name": "系统管理员"},
        {"related_type": "tenant", "related_id": 3, "action": "审核通过", "remark": "品牌资质合规，待确认入驻日期", "operator_name": "营运专员小李"},

        {"related_type": "tenant", "related_id": 5, "action": "提交入驻申请", "remark": "耐克旗舰店提交入驻申请，铺位3F-001", "operator_name": "系统管理员"},
        {"related_type": "tenant", "related_id": 5, "action": "审核驳回", "remark": "品牌资质不符合商场定位，该铺位已预留给其他品牌", "operator_name": "系统管理员"},

        {"related_type": "license", "related_id": 1, "action": "提交证照", "remark": "提交优衣库营业执照，证号91110000MA001ABC01", "operator_name": "营运专员小李"},
        {"related_type": "license", "related_id": 1, "action": "证照审核通过", "remark": "营业执照有效期内，信息与入驻资料一致", "operator_name": "营运专员小李"},

        {"related_type": "license", "related_id": 2, "action": "提交证照", "remark": "提交优衣库食品经营许可证，证号JY1110105001234", "operator_name": "营运专员小李"},
        {"related_type": "license", "related_id": 2, "action": "证照审核通过", "remark": "食品经营许可证有效，经营范围符合要求", "operator_name": "营运专员小李"},

        {"related_type": "license", "related_id": 3, "action": "提交证照", "remark": "提交海底捞营业执照，证号91110000MA002DEF02", "operator_name": "营运专员小李"},
        {"related_type": "license", "related_id": 3, "action": "证照审核通过", "remark": "营业执照有效期内", "operator_name": "系统管理员"},

        {"related_type": "license", "related_id": 4, "action": "提交证照", "remark": "提交海底捞餐饮服务许可证，证号CY110105005678", "operator_name": "营运专员小李"},
        {"related_type": "license", "related_id": 4, "action": "证照审核通过", "remark": "许可证有效期内", "operator_name": "系统管理员"},
        {"related_type": "license", "related_id": 4, "action": "要求补录/重新上传", "remark": "餐饮许可证将于2026-11-20到期，请提前准备续期材料并重新上传", "operator_name": "营运专员小李"},

        {"related_type": "license", "related_id": 6, "action": "提交证照", "remark": "提交小米之家营业执照，证号91110000MA004JKL04", "operator_name": "营运专员小李"},
        {"related_type": "license", "related_id": 6, "action": "证照审核驳回", "remark": "营业执照注册地址与实际铺位地址不一致，请重新提交正确的营业执照", "operator_name": "营运专员小李"},

        {"related_type": "activity", "related_id": 1, "action": "提交活动申请", "remark": "优衣库申请夏季新品促销活动", "operator_name": "营运专员小李"},
        {"related_type": "activity", "related_id": 1, "action": "活动审核通过", "remark": "活动方案合理，场地可用，1F区域客流承载充足", "operator_name": "工程部老张"},

        {"related_type": "activity", "related_id": 4, "action": "提交活动申请", "remark": "小米之家申请米粉节特惠活动", "operator_name": "客服台小王"},
        {"related_type": "activity", "related_id": 4, "action": "活动审核驳回", "remark": "活动期间客流量预估过大，2F消防通道需保持畅通，建议缩小活动规模后重新申请", "operator_name": "工程部老张"},

        {"related_type": "complaint", "related_id": 1, "action": "登记投诉", "remark": "顾客反映优衣库店内空调温度过低", "operator_name": "客服台小王"},
        {"related_type": "complaint", "related_id": 1, "action": "开始处理投诉", "remark": "已通知工程部检查空调温控系统", "operator_name": "工程部老张"},
        {"related_type": "complaint", "related_id": 1, "action": "投诉已解决", "remark": "已调整空调温度至26度，经顾客确认体感舒适", "operator_name": "工程部老张"},

        {"related_type": "complaint", "related_id": 2, "action": "登记投诉", "remark": "海底捞厨房排烟系统故障，油烟影响周边店铺", "operator_name": "客服台小王"},
        {"related_type": "complaint", "related_id": 2, "action": "开始处理投诉", "remark": "已现场查看排烟管道，发现风机电机异常", "operator_name": "工程部老张"},

        {"related_type": "complaint", "related_id": 4, "action": "登记投诉", "remark": "一楼扶梯临时停运，影响顾客通行", "operator_name": "客服台小王"},
        {"related_type": "complaint", "related_id": 4, "action": "开始处理投诉", "remark": "已联系维保单位，安排紧急检修", "operator_name": "工程部老张"},
        {"related_type": "complaint", "related_id": 4, "action": "投诉已解决", "remark": "扶梯已修复并恢复正常运行，同时安排了临时引导标识", "operator_name": "工程部老张"},
    ]
    for record_data in records:
        record = schemas.HistoryRecordCreate(**record_data)
        crud.create_history_record(db, record)
    print("History records created successfully")
