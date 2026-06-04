import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, datetime, timedelta
from app.database import engine, SessionLocal, Base
from app.models import User, Patient, CheckupRecord, CheckupItem, AbnormalIndicator, FollowUpRecommendation, Notification, Report


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        guide1 = User(username="guide_wang", name="王导检", role="guide", department="前台导检")
        doctor1 = User(username="doctor_li", name="李医生", role="doctor", department="内科")
        doctor2 = User(username="doctor_zhao", name="赵医生", role="doctor", department="检验科")
        reviewer1 = User(username="reviewer_chen", name="陈审核", role="reviewer", department="质控科")
        db.add_all([guide1, doctor1, doctor2, reviewer1])
        db.flush()

        patient1 = Patient(name="张三", gender="男", age=45, phone="13800001111", id_number="310101197801011234")
        patient2 = Patient(name="李四", gender="男", age=52, phone="13800002222", id_number="310101197301022345")
        patient3 = Patient(name="王五", gender="女", age=38, phone="13800003333", id_number="310101198701033456")
        db.add_all([patient1, patient2, patient3])
        db.flush()

        today = date.today()

        # === 样例1: 漏检后补做 ===
        # 张三体检，B超漏检，导检通知后补做完成
        record1 = CheckupRecord(patient_id=patient1.id, checkup_date=today - timedelta(days=2), status="in_progress")
        db.add(record1)
        db.flush()

        item1_1 = CheckupItem(record_id=record1.id, item_name="血常规", department="检验科", status="completed", result="正常", operator_id=doctor2.id, completed_at=datetime.now() - timedelta(days=2))
        item1_2 = CheckupItem(record_id=record1.id, item_name="尿常规", department="检验科", status="completed", result="正常", operator_id=doctor2.id, completed_at=datetime.now() - timedelta(days=2))
        item1_3 = CheckupItem(record_id=record1.id, item_name="B超", department="超声科", status="missed")
        item1_4 = CheckupItem(record_id=record1.id, item_name="心电图", department="功能科", status="completed", result="窦性心律", operator_id=doctor1.id, completed_at=datetime.now() - timedelta(days=2))
        db.add_all([item1_1, item1_2, item1_3, item1_4])
        db.flush()

        notification1 = Notification(
            record_id=record1.id, patient_id=patient1.id,
            type="missed_item", channel="phone",
            status="sent", content="张三您好，您的B超项目尚未完成，请尽快到超声科补做。",
            sent_by=guide1.id, sent_at=datetime.now() - timedelta(days=1)
        )
        db.add(notification1)

        indicator1_1 = AbnormalIndicator(
            item_id=item1_1.id, record_id=record1.id,
            indicator_name="血红蛋白", indicator_value="162 g/L",
            reference_range="120-160 g/L", severity="mild",
            discovered_at=datetime.now() - timedelta(days=2)
        )
        db.add(indicator1_1)
        db.flush()

        rec1_1 = FollowUpRecommendation(
            indicator_id=indicator1_1.id, record_id=record1.id,
            recommendation="3个月后复查血常规", follow_up_type="recheck",
            deadline=today + timedelta(days=90),
            created_by=doctor1.id, created_at=datetime.now() - timedelta(hours=17),
            is_completed=0
        )
        db.add(rec1_1)

        report1 = Report(record_id=record1.id, status="draft")
        db.add(report1)

        # === 样例2: 指标异常但未复查 ===
        # 李四空腹血糖偏高，医生给了建议但李四还没来复查
        record2 = CheckupRecord(patient_id=patient2.id, checkup_date=today - timedelta(days=5), status="completed")
        db.add(record2)
        db.flush()

        item2_1 = CheckupItem(record_id=record2.id, item_name="血常规", department="检验科", status="completed", result="白细胞偏高", operator_id=doctor2.id, completed_at=datetime.now() - timedelta(days=5))
        item2_2 = CheckupItem(record_id=record2.id, item_name="空腹血糖", department="检验科", status="completed", result="8.2 mmol/L", operator_id=doctor2.id, completed_at=datetime.now() - timedelta(days=5))
        item2_3 = CheckupItem(record_id=record2.id, item_name="B超", department="超声科", status="completed", result="脂肪肝", operator_id=doctor1.id, completed_at=datetime.now() - timedelta(days=5))
        item2_4 = CheckupItem(record_id=record2.id, item_name="心电图", department="功能科", status="completed", result="窦性心动过速", operator_id=doctor1.id, completed_at=datetime.now() - timedelta(days=5))
        db.add_all([item2_1, item2_2, item2_3, item2_4])
        db.flush()

        indicator2_1 = AbnormalIndicator(
            item_id=item2_2.id, record_id=record2.id,
            indicator_name="空腹血糖", indicator_value="8.2 mmol/L",
            reference_range="3.9-6.1 mmol/L", severity="moderate",
            discovered_at=datetime.now() - timedelta(days=5)
        )
        indicator2_2 = AbnormalIndicator(
            item_id=item2_3.id, record_id=record2.id,
            indicator_name="脂肪肝", indicator_value="中度",
            reference_range="未见", severity="moderate",
            discovered_at=datetime.now() - timedelta(days=5)
        )
        indicator2_3 = AbnormalIndicator(
            item_id=item2_1.id, record_id=record2.id,
            indicator_name="白细胞", indicator_value="12.5×10^9/L",
            reference_range="4.0-10.0×10^9/L", severity="mild",
            discovered_at=datetime.now() - timedelta(days=5)
        )
        db.add_all([indicator2_1, indicator2_2, indicator2_3])
        db.flush()

        rec2_1 = FollowUpRecommendation(
            indicator_id=indicator2_1.id, record_id=record2.id,
            recommendation="2周后复查空腹血糖及糖化血红蛋白，建议内分泌科就诊", follow_up_type="specialist",
            deadline=today + timedelta(days=14),
            created_by=doctor1.id, created_at=datetime.now() - timedelta(days=4),
            is_completed=0
        )
        rec2_2 = FollowUpRecommendation(
            indicator_id=indicator2_2.id, record_id=record2.id,
            recommendation="控制饮食、增加运动，3个月后复查B超", follow_up_type="recheck",
            deadline=today + timedelta(days=90),
            created_by=doctor1.id, created_at=datetime.now() - timedelta(days=4),
            is_completed=0
        )
        db.add_all([rec2_1, rec2_2])

        notification2_1 = Notification(
            record_id=record2.id, patient_id=patient2.id,
            type="abnormal_indicator", channel="sms",
            status="sent", content="李四先生，您的体检发现空腹血糖偏高，请尽快来院复查。",
            sent_by=guide1.id, sent_at=datetime.now() - timedelta(days=3)
        )
        notification2_2 = Notification(
            record_id=record2.id, patient_id=patient2.id,
            type="follow_up", channel="phone",
            status="pending", content="李四先生，您的复查期限将至，请安排时间来院复查。",
            sent_by=guide1.id
        )
        db.add_all([notification2_1, notification2_2])

        report2 = Report(record_id=record2.id, status="draft")
        db.add(report2)

        # === 样例3: 报告已审核待发放 ===
        # 王五体检完成，报告审核员已审核通过，但还没发放
        record3 = CheckupRecord(patient_id=patient3.id, checkup_date=today - timedelta(days=3), status="completed")
        db.add(record3)
        db.flush()

        item3_1 = CheckupItem(record_id=record3.id, item_name="血常规", department="检验科", status="completed", result="正常", operator_id=doctor2.id, completed_at=datetime.now() - timedelta(days=3))
        item3_2 = CheckupItem(record_id=record3.id, item_name="尿常规", department="检验科", status="completed", result="正常", operator_id=doctor2.id, completed_at=datetime.now() - timedelta(days=3))
        item3_3 = CheckupItem(record_id=record3.id, item_name="B超", department="超声科", status="completed", result="甲状腺结节", operator_id=doctor1.id, completed_at=datetime.now() - timedelta(days=3))
        item3_4 = CheckupItem(record_id=record3.id, item_name="心电图", department="功能科", status="completed", result="正常", operator_id=doctor1.id, completed_at=datetime.now() - timedelta(days=3))
        db.add_all([item3_1, item3_2, item3_3, item3_4])
        db.flush()

        indicator3_1 = AbnormalIndicator(
            item_id=item3_3.id, record_id=record3.id,
            indicator_name="甲状腺结节", indicator_value="可见，0.8cm",
            reference_range="未见", severity="mild",
            discovered_at=datetime.now() - timedelta(days=3)
        )
        db.add(indicator3_1)
        db.flush()

        rec3_1 = FollowUpRecommendation(
            indicator_id=indicator3_1.id, record_id=record3.id,
            recommendation="6个月后复查甲状腺B超及甲功，建议内分泌科随诊", follow_up_type="specialist",
            deadline=today + timedelta(days=180),
            created_by=doctor1.id, created_at=datetime.now() - timedelta(days=2),
            is_completed=0
        )
        db.add(rec3_1)

        notification3 = Notification(
            record_id=record3.id, patient_id=patient3.id,
            type="abnormal_indicator", channel="wechat",
            status="confirmed", content="王五女士，您的体检发现甲状腺结节，建议定期复查。",
            sent_by=guide1.id, sent_at=datetime.now() - timedelta(days=2),
            confirmed_at=datetime.now() - timedelta(days=1)
        )
        db.add(notification3)

        report3 = Report(
            record_id=record3.id, status="approved",
            reviewed_by=reviewer1.id, reviewed_at=datetime.now() - timedelta(days=1),
            review_comment="所有项目已完成，异常指标均有复查建议，可以发放。"
        )
        db.add(report3)

        db.commit()
        print("=== 初始化完成，已创建样例数据 ===")
        print()
        print("用户:")
        for u in db.query(User).all():
            print(f"  [{u.id}] {u.name} ({u.role}) - {u.department}")
        print()
        print("患者:")
        for p in db.query(Patient).all():
            print(f"  [{p.id}] {p.name} ({p.gender}, {p.age}岁) 手机:{p.phone}")
        print()
        print("体检记录:")
        for r in db.query(CheckupRecord).all():
            p = db.get(Patient, r.patient_id)
            print(f"  [记录{r.id}] {p.name} - {r.checkup_date} - 状态:{r.status}")
        print()
        print("样例说明:")
        print("  1. 张三(记录1): B超漏检→导检已通知但尚未补做→血常规有轻微异常→医生已给建议→报告草稿")
        print("  2. 李四(记录2): 血糖偏高+脂肪肝→医生已给建议→通知已发但未复查→报告草稿")
        print("  3. 王五(记录3): 甲状腺结节→医生已给建议→通知已确认→报告已审核待发放")

    except Exception as e:
        print(f"初始化失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
