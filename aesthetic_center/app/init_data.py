import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app import models
from datetime import datetime, timedelta

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    users = [
        models.User(name="王咨询师", role="consultant", department="咨询部", phone="13800000001"),
        models.User(name="李咨询师", role="consultant", department="咨询部", phone="13800000002"),
        models.User(name="张医生", role="doctor", department="整形外科", phone="13800000003"),
        models.User(name="刘护士长", role="nurse", department="护理部", phone="13800000004"),
        models.User(name="陈经理", role="manager", department="运营部", phone="13800000005"),
    ]
    db.add_all(users)
    db.commit()

    customers = [
        models.Customer(name="赵女士", phone="13900001111", gender="女", age=28, consultation_type="手术", source_channel="朋友推荐"),
        models.Customer(name="孙女士", phone="13900002222", gender="女", age=35, consultation_type="微整形", source_channel="抖音"),
        models.Customer(name="周女士", phone="13900003333", gender="女", age=42, consultation_type="抗衰", source_channel="小红书"),
        models.Customer(name="吴女士", phone="13900004444", gender="女", age=30, consultation_type="手术", source_channel="美团"),
        models.Customer(name="郑女士", phone="13900005555", gender="女", age=26, consultation_type="皮肤美容", source_channel="线下活动"),
    ]
    db.add_all(customers)
    db.commit()

    consultations = [
        models.ConsultationRecord(
            customer_id=1,
            consultation_date=datetime.now() - timedelta(days=15),
            consultant_id=1,
            consultant_name="王咨询师",
            chief_complaint="鼻子不够挺，想要自然款隆鼻",
            aesthetic_expectation="自然、挺翘，不想要太夸张",
            recommended_projects=["假体隆鼻", "耳软骨垫鼻尖"],
            promised_caliber="假体采用进口硅胶，术后7天拆线，1个月恢复自然",
            risk_notes="可能出现假体移位、感染等风险，术前已告知",
            status="confirmed",
            current_version=2,
        ),
        models.ConsultationRecord(
            customer_id=2,
            consultation_date=datetime.now() - timedelta(days=10),
            consultant_id=2,
            consultant_name="李咨询师",
            chief_complaint="面部松弛，法令纹深",
            aesthetic_expectation="紧致提升，年轻化5岁左右",
            recommended_projects=["线雕提升", "玻尿酸填充"],
            promised_caliber="采用PDO蛋白线，维持1-2年，玻尿酸用乔雅登",
            status="confirmed",
            current_version=1,
        ),
        models.ConsultationRecord(
            customer_id=3,
            consultation_date=datetime.now() - timedelta(days=5),
            consultant_id=1,
            consultant_name="王咨询师",
            chief_complaint="眼袋明显，显老",
            aesthetic_expectation="去除眼袋，皮肤紧致",
            recommended_projects=["外切去眼袋"],
            promised_caliber="外切法去除眼袋脂肪，收紧皮肤，术后5天拆线",
            status="draft",
            current_version=1,
        ),
    ]
    db.add_all(consultations)
    db.commit()

    consultation_versions = [
        models.ConsultationRecordVersion(
            record_id=1, version=1,
            chief_complaint="鼻子不够挺，想要自然款隆鼻",
            recommended_projects=["假体隆鼻"],
            promised_caliber="假体采用国产硅胶，术后7天拆线",
            change_reason="初始创建",
            created_by=1, created_by_name="王咨询师",
            created_at=datetime.now() - timedelta(days=15),
        ),
        models.ConsultationRecordVersion(
            record_id=1, version=2,
            chief_complaint="鼻子不够挺，想要自然款隆鼻",
            recommended_projects=["假体隆鼻", "耳软骨垫鼻尖"],
            promised_caliber="假体采用进口硅胶，术后7天拆线，1个月恢复自然",
            change_reason="客户要求增加鼻尖塑形，假体升级为进口材料",
            created_by=1, created_by_name="王咨询师",
            created_at=datetime.now() - timedelta(days=14),
        ),
        models.ConsultationRecordVersion(
            record_id=2, version=1,
            chief_complaint="面部松弛，法令纹深",
            recommended_projects=["线雕提升", "玻尿酸填充"],
            promised_caliber="采用PDO蛋白线，维持1-2年，玻尿酸用乔雅登",
            change_reason="初始创建",
            created_by=2, created_by_name="李咨询师",
            created_at=datetime.now() - timedelta(days=10),
        ),
    ]
    db.add_all(consultation_versions)
    db.commit()

    quotations = [
        models.QuotationScheme(
            customer_id=1,
            consultation_record_id=1,
            scheme_name="鼻综合整形方案",
            total_amount=38000,
            discount_amount=3000,
            actual_amount=35000,
            payment_method="installment",
            installment_months=12,
            installment_amount=2917,
            project_items=[
                {"name": "进口硅胶假体隆鼻", "price": 25000},
                {"name": "耳软骨垫鼻尖", "price": 8000},
                {"name": "鼻部综合塑形", "price": 5000},
            ],
            promised_services=["术后1周拆线护理", "术后1月、3月复查", "1年内假体问题免费修复"],
            special_notes="分期付款12期免息",
            status="confirmed",
            current_version=3,
            created_by=1, created_by_name="王咨询师",
        ),
        models.QuotationScheme(
            customer_id=2,
            consultation_record_id=2,
            scheme_name="面部年轻化方案",
            total_amount=45000,
            discount_amount=5000,
            actual_amount=40000,
            payment_method="full",
            project_items=[
                {"name": "全面部线雕提升", "price": 28000},
                {"name": "乔雅登玻尿酸2支", "price": 17000},
            ],
            promised_services=["术后冰敷护理", "1周后复查", "3个月补线优惠"],
            status="confirmed",
            current_version=1,
            created_by=2, created_by_name="李咨询师",
        ),
        models.QuotationScheme(
            customer_id=3,
            consultation_record_id=3,
            scheme_name="眼袋去除方案",
            total_amount=15000,
            discount_amount=0,
            actual_amount=15000,
            payment_method=None,
            project_items=[
                {"name": "外切去眼袋", "price": 15000},
            ],
            promised_services=["术后换药", "5天拆线", "1月复查"],
            special_notes="需预约张医生手术",
            status="draft",
            current_version=1,
            created_by=1, created_by_name="王咨询师",
        ),
    ]
    db.add_all(quotations)
    db.commit()

    quotation_versions = [
        models.QuotationSchemeVersion(
            scheme_id=1, version=1,
            total_amount=32000, discount_amount=0, actual_amount=32000,
            project_items=[{"name": "国产硅胶假体隆鼻", "price": 32000}],
            promised_services=["术后拆线", "复查"],
            change_reason="初始创建（基础方案）",
            created_by=1, created_by_name="王咨询师",
            created_at=datetime.now() - timedelta(days=15),
        ),
        models.QuotationSchemeVersion(
            scheme_id=1, version=2,
            total_amount=38000, discount_amount=0, actual_amount=38000,
            project_items=[{"name": "进口硅胶假体隆鼻", "price": 25000}, {"name": "耳软骨垫鼻尖", "price": 13000}],
            promised_services=["术后拆线", "复查", "免费修复"],
            change_reason="增加耳软骨项目，假体升级为进口",
            created_by=1, created_by_name="王咨询师",
            created_at=datetime.now() - timedelta(days=14),
        ),
        models.QuotationSchemeVersion(
            scheme_id=1, version=3,
            total_amount=38000, discount_amount=3000, actual_amount=35000,
            project_items=[{"name": "进口硅胶假体隆鼻", "price": 25000}, {"name": "耳软骨垫鼻尖", "price": 8000}, {"name": "鼻部综合塑形", "price": 5000}],
            promised_services=["术后1周拆线护理", "术后1月、3月复查", "1年内假体问题免费修复"],
            change_reason="客户选择12期分期，给予3000元优惠，增加综合塑形服务",
            created_by=1, created_by_name="王咨询师",
            created_at=datetime.now() - timedelta(days=13),
        ),
        models.QuotationSchemeVersion(
            scheme_id=2, version=1,
            total_amount=45000, discount_amount=5000, actual_amount=40000,
            project_items=[{"name": "全面部线雕提升", "price": 28000}, {"name": "乔雅登玻尿酸2支", "price": 17000}],
            promised_services=["术后冰敷护理", "1周后复查", "3个月补线优惠"],
            change_reason="初始创建",
            created_by=2, created_by_name="李咨询师",
            created_at=datetime.now() - timedelta(days=10),
        ),
    ]
    db.add_all(quotation_versions)
    db.commit()

    follow_ups = [
        models.PostOperativeFollowUp(
            customer_id=1,
            surgery_date=datetime.now() - timedelta(days=8),
            surgery_projects=["假体隆鼻", "耳软骨垫鼻尖"],
            surgeon="张医生",
            follow_up_stage="day3",
            follow_up_date=datetime.now() - timedelta(days=5),
            follow_up_type="phone",
            follow_up_person_id=4,
            follow_up_person_name="刘护士长",
            recovery_status="normal",
            customer_feedback="还有点肿，不太疼，每天都在冰敷",
            skin_condition={"swelling": "moderate", "bruising": "mild"},
            pain_level=2,
            swelling_level="medium",
            handling_advice="继续冰敷，注意休息，饮食清淡",
            next_follow_up_date=datetime.now() - timedelta(days=1),
            status="completed",
            current_version=1,
        ),
        models.PostOperativeFollowUp(
            customer_id=1,
            surgery_date=datetime.now() - timedelta(days=8),
            surgery_projects=["假体隆鼻", "耳软骨垫鼻尖"],
            surgeon="张医生",
            follow_up_stage="week1",
            follow_up_date=datetime.now() - timedelta(days=1),
            follow_up_type="clinic",
            follow_up_person_id=4,
            follow_up_person_name="刘护士长",
            recovery_status="need_review",
            customer_feedback="拆线后发现鼻尖有点红，担心感染",
            skin_condition={"swelling": "mild", "redness": "nose_tip"},
            pain_level=1,
            swelling_level="mild",
            abnormal_symptoms="鼻尖发红，轻微压痛",
            handling_advice="外涂红霉素软膏，每日2次，3天后复诊",
            has_discomfort=True,
            status="need_review",
            current_version=2,
        ),
        models.PostOperativeFollowUp(
            customer_id=2,
            surgery_date=datetime.now() - timedelta(days=3),
            surgery_projects=["全面部线雕提升"],
            surgeon="张医生",
            follow_up_stage="day1",
            follow_up_date=datetime.now() - timedelta(days=2),
            follow_up_type="wechat",
            follow_up_person_id=4,
            follow_up_person_name="刘护士长",
            recovery_status="normal",
            customer_feedback="有点胀，说话不太方便，其他还好",
            skin_condition={"swelling": "moderate"},
            pain_level=3,
            swelling_level="medium",
            handling_advice="正常现象，注意不要做夸张表情",
            next_follow_up_date=datetime.now() + timedelta(days=5),
            status="completed",
            current_version=1,
        ),
        models.PostOperativeFollowUp(
            customer_id=4,
            surgery_date=datetime.now() - timedelta(days=2),
            surgery_projects=["双眼皮切开"],
            surgeon="张医生",
            follow_up_stage="day1",
            follow_up_date=datetime.now(),
            follow_up_type="phone",
            follow_up_person_id=4,
            follow_up_person_name="刘护士长",
            recovery_status="normal",
            customer_feedback="眼皮肿得厉害，有点担心",
            skin_condition={"swelling": "severe", "bruising": "moderate"},
            pain_level=4,
            swelling_level="high",
            handling_advice="继续冷敷，睡觉时垫高枕头",
            next_follow_up_date=datetime.now() + timedelta(days=6),
            status="pending",
            current_version=1,
        ),
    ]
    db.add_all(follow_ups)
    db.commit()

    follow_up_versions = [
        models.FollowUpVersion(
            follow_up_id=1, version=1,
            recovery_status="normal",
            customer_feedback="还有点肿，不太疼，每天都在冰敷",
            abnormal_symptoms=None,
            handling_advice="继续冰敷，注意休息，饮食清淡",
            status="completed",
            change_reason="初始创建",
            created_by=4, created_by_name="刘护士长",
            created_at=datetime.now() - timedelta(days=5),
        ),
        models.FollowUpVersion(
            follow_up_id=2, version=1,
            recovery_status="normal",
            customer_feedback="拆线后感觉还可以",
            abnormal_symptoms=None,
            handling_advice="注意护理",
            status="completed",
            change_reason="初始创建",
            created_by=4, created_by_name="刘护士长",
            created_at=datetime.now() - timedelta(days=1),
        ),
        models.FollowUpVersion(
            follow_up_id=2, version=2,
            recovery_status="need_review",
            customer_feedback="拆线后发现鼻尖有点红，担心感染",
            abnormal_symptoms="鼻尖发红，轻微压痛",
            handling_advice="外涂红霉素软膏，每日2次，3天后复诊",
            status="need_review",
            change_reason="客户微信反馈鼻尖发红，担心感染，修改回访记录",
            created_by=4, created_by_name="刘护士长",
            created_at=datetime.now() - timedelta(hours=12),
        ),
        models.FollowUpVersion(
            follow_up_id=3, version=1,
            recovery_status="normal",
            customer_feedback="有点胀，说话不太方便，其他还好",
            abnormal_symptoms=None,
            handling_advice="正常现象，注意不要做夸张表情",
            status="completed",
            change_reason="初始创建",
            created_by=4, created_by_name="刘护士长",
            created_at=datetime.now() - timedelta(days=2),
        ),
    ]
    db.add_all(follow_up_versions)
    db.commit()

    discomforts = [
        models.DiscomfortReport(
            customer_id=1,
            report_date=datetime.now() - timedelta(days=1),
            reporter="赵女士（客户本人）",
            reporter_phone="13900001111",
            discomfort_type="infection_risk",
            discomfort_symptoms="鼻尖发红，按压有疼痛感，拆线后第2天出现",
            severity="medium",
            related_projects=["假体隆鼻", "耳软骨垫鼻尖"],
            related_surgery_date=datetime.now() - timedelta(days=8),
            first_handler_id=4,
            first_handler_name="刘护士长",
            first_handling_time=datetime.now() - timedelta(days=1),
            first_handling_notes="已电话安抚客户，指导外用红霉素软膏，观察3天",
            current_handler_id=3,
            current_handler_name="张医生",
            abnormal_description="客户担心假体感染，情绪有些焦虑",
            status="processing",
        ),
        models.DiscomfortReport(
            customer_id=2,
            report_date=datetime.now() - timedelta(hours=6),
            reporter="孙女士（客户本人）",
            reporter_phone="13900002222",
            discomfort_type="asymmetry",
            discomfort_symptoms="感觉两边脸提升效果不一样，左边好像比右边紧",
            severity="low",
            related_projects=["全面部线雕提升"],
            related_surgery_date=datetime.now() - timedelta(days=3),
            first_handler_id=2,
            first_handler_name="李咨询师",
            first_handling_time=datetime.now() - timedelta(hours=5),
            first_handling_notes="已解释术后肿胀不均属正常现象，建议观察1周",
            current_handler_id=2,
            current_handler_name="李咨询师",
            abnormal_description="客户对效果有些担心，需要后续跟进",
            status="processing",
        ),
        models.DiscomfortReport(
            customer_id=3,
            report_date=datetime.now() - timedelta(days=10),
            reporter="周女士（客户本人）",
            reporter_phone="13900003333",
            discomfort_type="price_dispute",
            discomfort_symptoms="认为报价不透明，实际收费比当初说的多了2000元，分期款项对不上",
            severity="high",
            related_projects=["外切去眼袋"],
            first_handler_id=5,
            first_handler_name="陈经理",
            first_handling_time=datetime.now() - timedelta(days=10),
            current_handler_id=5,
            current_handler_name="陈经理",
            status="pending",
        ),
    ]
    db.add_all(discomforts)
    db.commit()

    handling_records = [
        models.HandlingRecord(
            discomfort_report_id=1,
            handler_id=4,
            handler_name="刘护士长",
            handling_action="电话安抚",
            handling_notes="客户来电反映鼻尖发红，已耐心安抚，解释术后正常反应，指导外用红霉素软膏，每日2次",
            previous_status="pending",
            new_status="processing",
            next_step="3天后电话回访，如无好转安排医生面诊",
            notify_customer=True,
            notify_method="phone",
            created_at=datetime.now() - timedelta(days=1),
        ),
        models.HandlingRecord(
            discomfort_report_id=1,
            handler_id=4,
            handler_name="刘护士长",
            handling_action="移交医生",
            handling_notes="客户情绪仍有焦虑，担心感染问题，移交手术医生张医生跟进评估",
            previous_status="processing",
            new_status="processing",
            next_step="张医生电话回访评估是否需要面诊",
            notify_customer=True,
            notify_method="wechat",
            created_at=datetime.now() - timedelta(hours=18),
        ),
        models.HandlingRecord(
            discomfort_report_id=2,
            handler_id=2,
            handler_name="李咨询师",
            handling_action="微信回访",
            handling_notes="客户微信反馈左右脸感觉不对称，已发送术后注意事项，解释肿胀不均是正常现象，一侧肿胀会先消",
            previous_status="pending",
            new_status="processing",
            next_step="下周复诊时请医生评估",
            notify_customer=True,
            notify_method="wechat",
            created_at=datetime.now() - timedelta(hours=5),
        ),
    ]
    db.add_all(handling_records)
    db.commit()

    audit_logs = [
        models.AuditLog(entity_type="consultation_record", entity_id=1, action="create", operator_id=1, operator_name="王咨询师", change_reason="创建咨询记录"),
        models.AuditLog(entity_type="consultation_record", entity_id=1, action="update", field_name="recommended_projects", old_value='["假体隆鼻"]', new_value='["假体隆鼻", "耳软骨垫鼻尖"]', change_reason="客户要求增加鼻尖塑形", operator_id=1, operator_name="王咨询师"),
        models.AuditLog(entity_type="consultation_record", entity_id=1, action="update", field_name="promised_caliber", old_value="假体采用国产硅胶", new_value="假体采用进口硅胶，术后7天拆线，1个月恢复自然", change_reason="假体升级为进口材料", operator_id=1, operator_name="王咨询师"),
        models.AuditLog(entity_type="quotation_scheme", entity_id=1, action="create", operator_id=1, operator_name="王咨询师", change_reason="创建报价方案"),
        models.AuditLog(entity_type="quotation_scheme", entity_id=1, action="update", field_name="actual_amount", old_value="32000", new_value="38000", change_reason="增加耳软骨项目", operator_id=1, operator_name="王咨询师"),
        models.AuditLog(entity_type="quotation_scheme", entity_id=1, action="update", field_name="actual_amount", old_value="38000", new_value="35000", change_reason="客户选择12期分期，给予3000元优惠", operator_id=1, operator_name="王咨询师"),
        models.AuditLog(entity_type="follow_up", entity_id=2, action="update", field_name="recovery_status", old_value="normal", new_value="need_review", change_reason="客户微信反馈鼻尖发红", operator_id=4, operator_name="刘护士长"),
        models.AuditLog(entity_type="discomfort_report", entity_id=1, action="handle", field_name="status", old_value="pending", new_value="processing", change_reason="电话安抚客户，指导用药", operator_id=4, operator_name="刘护士长"),
        models.AuditLog(entity_type="discomfort_report", entity_id=2, action="handle", field_name="status", old_value="pending", new_value="processing", change_reason="微信回访解释术后现象", operator_id=2, operator_name="李咨询师"),
    ]
    db.add_all(audit_logs)
    db.commit()

    print("✅ 样例数据初始化完成！")
    print("\n📋 样例数据概览：")
    print(f"  用户：{len(users)} 人（咨询师、医生、护士、经理）")
    print(f"  客户：{len(customers)} 人")
    print(f"  咨询记录：{len(consultations)} 条（含版本变更追溯）")
    print(f"  方案报价：{len(quotations)} 份（含分期款项变更记录）")
    print(f"  术后回访：{len(follow_ups)} 条（含异常症状记录）")
    print(f"  不适/投诉：{len(discomforts)} 条（含处理流程追溯）")
    print(f"  审计日志：{len(audit_logs)} 条")

finally:
    db.close()
