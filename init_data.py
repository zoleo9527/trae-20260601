from app.database import SessionLocal, engine, Base
from app import models
from datetime import datetime, timedelta
import hashlib
import os

def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + hashed.hex()

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    users_data = [
        {"username": "zhanzhang", "full_name": "王站长", "role": "station_manager", "password": "123456"},
        {"username": "shouyinyuan", "full_name": "李收银员", "role": "cashier", "password": "123456"},
        {"username": "jiliangyuan", "full_name": "张计量员", "role": "meter_reader", "password": "123456"},
    ]

    users = {}
    for ud in users_data:
        existing = db.query(models.User).filter(models.User.username == ud["username"]).first()
        if not existing:
            hashed = get_password_hash(ud["password"])
            user = models.User(
                username=ud["username"],
                full_name=ud["full_name"],
                role=ud["role"],
                hashed_password=hashed
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            users[ud["username"]] = user
            print(f"创建用户: {ud['username']} / {ud['password']} ({ud['full_name']} - {ud['role']})")
        else:
            users[ud["username"]] = existing
            print(f"用户已存在: {ud['username']}")

    zhanzhang = users["zhanzhang"]
    shouyinyuan = users["shouyinyuan"]
    jiliangyuan = users["jiliangyuan"]

    sample_recharges = [
        {
            "member_name": "张三",
            "member_phone": "13800138001",
            "member_card_no": "VIP001",
            "recharge_amount": 1000.0,
            "payment_method": "微信",
            "recharge_time": datetime.now() - timedelta(hours=2),
            "status": "pending",
            "created_by": shouyinyuan.id,
            "remark": "老客户，每月固定充值"
        },
        {
            "member_name": "李四",
            "member_phone": "13800138002",
            "member_card_no": "VIP002",
            "recharge_amount": 500.0,
            "payment_method": "支付宝",
            "recharge_time": datetime.now() - timedelta(hours=5),
            "status": "verified",
            "created_by": shouyinyuan.id,
            "handled_by": jiliangyuan.id,
            "remark": "新客户首次充值"
        },
        {
            "member_name": "王五",
            "member_phone": "13800138003",
            "member_card_no": "VIP003",
            "recharge_amount": 2000.0,
            "payment_method": "银行卡",
            "recharge_time": datetime.now() - timedelta(days=1),
            "status": "confirmed",
            "created_by": shouyinyuan.id,
            "handled_by": zhanzhang.id,
            "remark": "大额充值，已到账"
        },
        {
            "member_name": "赵六",
            "member_phone": "13800138004",
            "member_card_no": "VIP004",
            "recharge_amount": 300.0,
            "payment_method": "现金",
            "recharge_time": datetime.now() - timedelta(hours=1),
            "status": "rejected",
            "created_by": shouyinyuan.id,
            "handled_by": jiliangyuan.id,
            "remark": "现金金额不符，需要重新核对"
        },
        {
            "member_name": "钱七",
            "member_phone": "13800138005",
            "member_card_no": "VIP005",
            "recharge_amount": 1500.0,
            "payment_method": "微信",
            "recharge_time": datetime.now() - timedelta(minutes=30),
            "status": "pending",
            "created_by": shouyinyuan.id,
            "remark": ""
        },
    ]

    recharges = []
    for sr in sample_recharges:
        existing = db.query(models.MemberRecharge).filter(
            models.MemberRecharge.member_card_no == sr["member_card_no"],
            models.MemberRecharge.recharge_amount == sr["recharge_amount"]
        ).first()
        if not existing:
            recharge = models.MemberRecharge(**sr)
            db.add(recharge)
            db.commit()
            db.refresh(recharge)
            recharges.append(recharge)

            log_action = "创建会员充值记录"
            log = models.FlowLog(
                recharge_id=recharge.id,
                action="create",
                action_desc=log_action,
                to_status=recharge.status,
                operator_id=recharge.created_by
            )
            db.add(log)

            if sr["status"] != "pending" and sr.get("handled_by"):
                status_map = {
                    "verified": "审核充值记录",
                    "confirmed": "确认充值到账",
                    "rejected": "驳回充值申请"
                }
                log2 = models.FlowLog(
                    recharge_id=recharge.id,
                    action="update_status",
                    action_desc=status_map.get(sr["status"], "更新充值状态"),
                    from_status="pending",
                    to_status=sr["status"],
                    operator_id=sr["handled_by"],
                    remark=sr.get("remark")
                )
                db.add(log2)

            db.commit()
            print(f"创建充值记录: {recharge.member_name} - ¥{recharge.recharge_amount} [{recharge.status}]")
        else:
            recharges.append(existing)

    sample_invoices = [
        {
            "recharge_idx": 2,
            "invoice_title": "某某科技有限公司",
            "tax_no": "91110101MA00ABCD12",
            "invoice_amount": 2000.0,
            "invoice_type": "增值税专用发票",
            "recipient_email": "finance@example.com",
            "recipient_phone": "13900139001",
            "status": "completed",
            "created_by": shouyinyuan.id,
            "handled_by": zhanzhang.id,
            "return_reason": None,
            "supplement_remark": "已开具并发送邮件"
        },
        {
            "recharge_idx": 1,
            "invoice_title": "某某贸易有限公司",
            "tax_no": "91110101MA00ABCD34",
            "invoice_amount": 500.0,
            "invoice_type": "增值税普通发票",
            "recipient_email": "account@trade.com",
            "recipient_phone": "13900139002",
            "status": "processing",
            "created_by": shouyinyuan.id,
            "handled_by": zhanzhang.id,
            "return_reason": None,
            "supplement_remark": None
        },
        {
            "recharge_idx": 0,
            "invoice_title": "张三",
            "tax_no": "",
            "invoice_amount": 1000.0,
            "invoice_type": "个人普通发票",
            "recipient_email": "zhangsan@example.com",
            "recipient_phone": "13800138001",
            "status": "returned",
            "created_by": shouyinyuan.id,
            "handled_by": zhanzhang.id,
            "return_reason": "税号为空，个人发票请确认是否需要身份证号",
            "supplement_remark": None
        },
        {
            "recharge_idx": 4,
            "invoice_title": "钱七",
            "tax_no": "",
            "invoice_amount": 1500.0,
            "invoice_type": "个人普通发票",
            "recipient_email": None,
            "recipient_phone": "13800138005",
            "status": "pending",
            "created_by": shouyinyuan.id,
            "handled_by": None,
            "return_reason": None,
            "supplement_remark": None
        },
    ]

    for si in sample_invoices:
        recharge = recharges[si["recharge_idx"]]
        existing = db.query(models.InvoiceReissue).filter(
            models.InvoiceReissue.recharge_id == recharge.id,
            models.InvoiceReissue.invoice_title == si["invoice_title"]
        ).first()
        if not existing:
            invoice = models.InvoiceReissue(
                recharge_id=recharge.id,
                invoice_title=si["invoice_title"],
                tax_no=si["tax_no"],
                invoice_amount=si["invoice_amount"],
                invoice_type=si["invoice_type"],
                recipient_email=si["recipient_email"],
                recipient_phone=si["recipient_phone"],
                status=si["status"],
                created_by=si["created_by"],
                handled_by=si["handled_by"],
                return_reason=si["return_reason"],
                supplement_remark=si["supplement_remark"]
            )
            db.add(invoice)
            db.commit()
            db.refresh(invoice)

            log = models.FlowLog(
                recharge_id=recharge.id,
                invoice_id=invoice.id,
                action="create",
                action_desc="创建发票补开申请",
                to_status=invoice.status if invoice.status == "pending" else "pending",
                operator_id=invoice.created_by
            )
            db.add(log)

            if si["status"] != "pending" and si.get("handled_by"):
                status_map = {
                    "processing": "开始处理发票补开",
                    "returned": "退回发票补开申请",
                    "completed": "完成发票补开"
                }
                log2 = models.FlowLog(
                    recharge_id=recharge.id,
                    invoice_id=invoice.id,
                    action="update_status",
                    action_desc=status_map.get(si["status"], "更新发票状态"),
                    from_status="pending",
                    to_status=si["status"],
                    operator_id=si["handled_by"],
                    remark=si.get("return_reason") or si.get("supplement_remark")
                )
                db.add(log2)

            db.commit()
            print(f"创建发票记录: {invoice.invoice_title} - ¥{invoice.invoice_amount} [{invoice.status}]")

    print("\n=== 初始化完成 ===")
    print("\n测试账号:")
    print("  站长: zhanzhang / 123456")
    print("  收银员: shouyinyuan / 123456")
    print("  计量员: jiliangyuan / 123456")
    print("\n数据状态说明（故意不完美闭环）:")
    print("  - 2条充值待审核 (张三、钱七)")
    print("  - 1条充值已审核待确认 (李四)")
    print("  - 1条充值已驳回 (赵六) - 责任未闭环")
    print("  - 1条发票待处理 (钱七)")
    print("  - 1条发票处理中 (李四)")
    print("  - 1条发票被退回 (张三) - 需收银员补充信息，责任未闭环")
    print("  - 1条发票已完成 (王五)")

except Exception as e:
    print(f"错误: {e}")
    db.rollback()
finally:
    db.close()
