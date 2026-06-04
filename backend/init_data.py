import uuid
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import Base, engine, SessionLocal
from backend import models


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        patients_data = [
            {
                "id": str(uuid.uuid4()),
                "name": "张明华",
                "gender": "男",
                "age": 58,
                "phone": "13800138001",
                "id_card": "310101196605151234",
                "surgery_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                "surgery_type": "白内障超声乳化吸除+人工晶体植入术",
                "surgeon_name": "李医生",
                "eye": "右眼"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "李桂芳",
                "gender": "女",
                "age": 65,
                "phone": "13800138002",
                "id_card": "310101195903205678",
                "surgery_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
                "surgery_type": "全飞秒激光近视矫正术",
                "surgeon_name": "李医生",
                "eye": "双眼"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "王建国",
                "gender": "男",
                "age": 72,
                "phone": "13800138003",
                "id_card": "310101195211109012",
                "surgery_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                "surgery_type": "青光眼小梁切除术",
                "surgeon_name": "李医生",
                "eye": "左眼"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "陈秀英",
                "gender": "女",
                "age": 60,
                "phone": "13800138004",
                "id_card": "310101196408083456",
                "surgery_date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
                "surgery_type": "玻璃体切割术",
                "surgeon_name": "李医生",
                "eye": "左眼"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "刘伟强",
                "gender": "男",
                "age": 45,
                "phone": "13800138005",
                "id_card": "310101197906257890",
                "surgery_date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
                "surgery_type": "白内障超声乳化吸除+人工晶体植入术",
                "surgeon_name": "李医生",
                "eye": "右眼"
            }
        ]

        patients = []
        for p_data in patients_data:
            p = models.Patient(**p_data)
            db.add(p)
            patients.append(p)
        db.flush()

        medication_tasks_data = [
            {
                "patient": patients[0],
                "status": "pending",
                "items": [
                    {"id": str(uuid.uuid4()), "name": "左氧氟沙星滴眼液", "specification": "5ml:24.4mg", "dosage": "1-2滴", "frequency": "每日4次", "duration": "1周", "notes": "术后24小时开始使用"},
                    {"id": str(uuid.uuid4()), "name": "妥布霉素地塞米松滴眼液", "specification": "5ml", "dosage": "1-2滴", "frequency": "每日4次", "duration": "2周", "notes": "逐渐减量"},
                    {"id": str(uuid.uuid4()), "name": "普拉洛芬滴眼液", "specification": "5ml", "dosage": "1-2滴", "frequency": "每日4次", "duration": "2周", "notes": ""}
                ]
            },
            {
                "patient": patients[1],
                "status": "nurse_confirmed",
                "nurse_name": "张护士",
                "items": [
                    {"id": str(uuid.uuid4()), "name": "氟米龙滴眼液", "specification": "5ml", "dosage": "1-2滴", "frequency": "每日4次", "duration": "2周", "notes": ""},
                    {"id": str(uuid.uuid4()), "name": "玻璃酸钠滴眼液", "specification": "10ml", "dosage": "1-2滴", "frequency": "每日4次", "duration": "1个月", "notes": "缓解干眼"}
                ]
            },
            {
                "patient": patients[2],
                "status": "surgeon_verified",
                "nurse_name": "张护士",
                "has_risk": True,
                "risk_reason": "患者有青霉素过敏史，需谨慎用药",
                "items": [
                    {"id": str(uuid.uuid4()), "name": "布林佐胺滴眼液", "specification": "5ml", "dosage": "1滴", "frequency": "每日3次", "duration": "长期", "notes": "降眼压"},
                    {"id": str(uuid.uuid4()), "name": "左氧氟沙星滴眼液", "specification": "5ml", "dosage": "1-2滴", "frequency": "每日4次", "duration": "1周", "notes": ""}
                ]
            },
            {
                "patient": patients[3],
                "status": "completed",
                "nurse_name": "张护士",
                "items": [
                    {"id": str(uuid.uuid4()), "name": "复方托吡卡胺滴眼液", "specification": "5ml", "dosage": "1滴", "frequency": "每晚1次", "duration": "2周", "notes": "活动瞳孔"},
                    {"id": str(uuid.uuid4()), "name": "泼尼松龙滴眼液", "specification": "5ml", "dosage": "1-2滴", "frequency": "每日4次", "duration": "4周", "notes": "逐渐减量"}
                ]
            },
            {
                "patient": patients[4],
                "status": "patient_acknowledged",
                "nurse_name": "张护士",
                "items": [
                    {"id": str(uuid.uuid4()), "name": "左氧氟沙星滴眼液", "specification": "5ml", "dosage": "1-2滴", "frequency": "每日4次", "duration": "1周", "notes": ""},
                    {"id": str(uuid.uuid4()), "name": "妥布霉素地塞米松滴眼液", "specification": "5ml", "dosage": "1-2滴", "frequency": "每日4次", "duration": "2周", "notes": ""}
                ]
            }
        ]

        medication_status_map = {
            "pending": "待护士核对",
            "nurse_confirmed": "护士已核对，待医生复核",
            "surgeon_verified": "医生已复核，待患者确认",
            "patient_acknowledged": "患者已确认",
            "completed": "已完成"
        }

        for mt_data in medication_tasks_data:
            mt = models.MedicationTask(
                id=str(uuid.uuid4()),
                patient_id=mt_data["patient"].id,
                surgeon_name=mt_data["patient"].surgeon_name,
                status=mt_data["status"],
                nurse_name=mt_data.get("nurse_name"),
                has_risk=mt_data.get("has_risk", False),
                risk_reason=mt_data.get("risk_reason")
            )
            db.add(mt)
            db.flush()

            for item_data in mt_data["items"]:
                item = models.MedicationItem(
                    **item_data,
                    task_id=mt.id
                )
                db.add(item)

            if mt_data["status"] == "pending":
                log = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建术后用药任务，当前状态：{medication_status_map[mt_data['status']]}",
                    old_status=None,
                    new_status=mt_data["status"],
                    remark="手术完成，自动生成用药指导任务"
                )
                db.add(log)
            elif mt_data["status"] == "nurse_confirmed":
                log1 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建术后用药任务，当前状态：{medication_status_map[mt_data['status']]}",
                    old_status=None,
                    new_status="pending",
                    remark="手术完成，自动生成用药指导任务"
                )
                db.add(log1)
                log2 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="张护士",
                    operator_role="手术护士",
                    action="护士核对用药",
                    description=f"手术护士张护士核对用药，状态从【待护士核对】变更为【护士已核对，待医生复核】",
                    old_status="pending",
                    new_status="nurse_confirmed",
                    remark="已核对所有药品，剂量和用法均正确，无配伍禁忌"
                )
                db.add(log2)
            elif mt_data["status"] == "surgeon_verified":
                log1 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建术后用药任务，当前状态：{medication_status_map[mt_data['status']]}",
                    old_status=None,
                    new_status="pending",
                    remark="手术完成，自动生成用药指导任务"
                )
                db.add(log1)
                log2 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="张护士",
                    operator_role="手术护士",
                    action="护士核对用药",
                    description=f"手术护士张护士核对用药，状态从【待护士核对】变更为【护士已核对，待医生复核】",
                    old_status="pending",
                    new_status="nurse_confirmed",
                    remark="已核对所有药品"
                )
                db.add(log2)
                log3 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="李医生",
                    operator_role="主刀医生",
                    action="医生复核用药",
                    description=f"主刀医生李医生复核用药，状态从【护士已核对，待医生复核】变更为【医生已复核，待患者确认】",
                    old_status="nurse_confirmed",
                    new_status="surgeon_verified",
                    remark="用药方案确认无误，注意患者有青霉素过敏史，需密切观察"
                )
                db.add(log3)
            elif mt_data["status"] == "completed":
                log1 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建术后用药任务",
                    old_status=None,
                    new_status="pending",
                    remark="手术完成，自动生成用药指导任务"
                )
                db.add(log1)
                log2 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="张护士",
                    operator_role="手术护士",
                    action="护士核对用药",
                    description=f"手术护士张护士核对用药",
                    old_status="pending",
                    new_status="nurse_confirmed",
                    remark="已核对所有药品"
                )
                db.add(log2)
                log3 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="李医生",
                    operator_role="主刀医生",
                    action="医生复核用药",
                    description=f"主刀医生李医生复核用药",
                    old_status="nurse_confirmed",
                    new_status="surgeon_verified",
                    remark="用药方案确认无误"
                )
                db.add(log3)
                log4 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="陈秀英",
                    operator_role="患者",
                    action="患者确认用药",
                    description=f"患者确认已收到用药指导",
                    old_status="surgeon_verified",
                    new_status="patient_acknowledged",
                    remark="已了解用药方法和注意事项"
                )
                db.add(log4)
                log5 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="王专员",
                    operator_role="随访专员",
                    action="完成用药指导",
                    description=f"随访专员王专员完成用药指导",
                    old_status="patient_acknowledged",
                    new_status="completed",
                    remark="患者用药依从性良好，无不良反应"
                )
                db.add(log5)
            elif mt_data["status"] == "patient_acknowledged":
                log1 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建术后用药任务",
                    old_status=None,
                    new_status="pending",
                    remark="手术完成，自动生成用药指导任务"
                )
                db.add(log1)
                log2 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="张护士",
                    operator_role="手术护士",
                    action="护士核对用药",
                    description=f"手术护士张护士核对用药",
                    old_status="pending",
                    new_status="nurse_confirmed",
                    remark="已核对所有药品"
                )
                db.add(log2)
                log3 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="李医生",
                    operator_role="主刀医生",
                    action="医生复核用药",
                    description=f"主刀医生李医生复核用药",
                    old_status="nurse_confirmed",
                    new_status="surgeon_verified",
                    remark="用药方案确认无误"
                )
                db.add(log3)
                log4 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    medication_task_id=mt.id,
                    task_type="medication",
                    operator_name="刘伟强",
                    operator_role="患者",
                    action="患者确认用药",
                    description=f"患者确认已收到用药指导",
                    old_status="surgeon_verified",
                    new_status="patient_acknowledged",
                    remark="已了解用药方法"
                )
                db.add(log4)

        db.flush()

        followup_tasks_data = [
            {
                "patient": patients[0],
                "scheduled_date": datetime.now().strftime("%Y-%m-%d"),
                "scheduled_time": "09:00",
                "followup_type": "术后1天",
                "content": "检查视力、眼压、角膜情况，确认伤口愈合良好",
                "status": "pending",
                "previous_idx": None
            },
            {
                "patient": patients[0],
                "scheduled_date": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d"),
                "scheduled_time": "10:00",
                "followup_type": "术后1周",
                "content": "复查视力、眼压，调整用药方案",
                "status": "pending",
                "previous_idx": 0
            },
            {
                "patient": patients[1],
                "scheduled_date": datetime.now().strftime("%Y-%m-%d"),
                "scheduled_time": "14:00",
                "followup_type": "术后1天",
                "content": "检查视力、角膜瓣复位情况",
                "status": "notified",
                "specialist_name": "王专员",
                "previous_idx": None
            },
            {
                "patient": patients[1],
                "scheduled_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
                "scheduled_time": "09:30",
                "followup_type": "术后1周",
                "content": "复查视力、角膜情况",
                "status": "pending",
                "previous_idx": 2
            },
            {
                "patient": patients[2],
                "scheduled_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
                "scheduled_time": "08:30",
                "followup_type": "术后1天",
                "content": "重点监测眼压变化，检查滤过泡",
                "status": "pending",
                "has_risk": True,
                "risk_reason": "青光眼术后高眼压风险",
                "previous_idx": None
            },
            {
                "patient": patients[3],
                "scheduled_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                "scheduled_time": "09:30",
                "followup_type": "术后1天",
                "content": "检查眼底、视网膜复位情况",
                "status": "completed",
                "specialist_name": "王专员",
                "previous_idx": None
            },
            {
                "patient": patients[3],
                "scheduled_date": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
                "scheduled_time": "10:30",
                "followup_type": "术后1周",
                "content": "复查眼底，确认视网膜复位良好",
                "status": "pending",
                "previous_idx": 5
            },
            {
                "patient": patients[4],
                "scheduled_date": (datetime.now() - timedelta(days=4)).strftime("%Y-%m-%d"),
                "scheduled_time": "11:00",
                "followup_type": "术后1天",
                "content": "常规术后检查",
                "status": "completed",
                "specialist_name": "王专员",
                "previous_idx": None
            },
            {
                "patient": patients[4],
                "scheduled_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
                "scheduled_time": "09:00",
                "followup_type": "术后1周",
                "content": "复查视力、眼压，评估恢复情况",
                "status": "confirmed",
                "specialist_name": "王专员",
                "previous_idx": 7
            }
        ]

        followup_tasks = []
        for ft_data in followup_tasks_data:
            ft = models.FollowupTask(
                id=str(uuid.uuid4()),
                patient_id=ft_data["patient"].id,
                scheduled_date=ft_data["scheduled_date"],
                scheduled_time=ft_data["scheduled_time"],
                followup_type=ft_data["followup_type"],
                content=ft_data["content"],
                status=ft_data["status"],
                specialist_name=ft_data.get("specialist_name"),
                has_risk=ft_data.get("has_risk", False),
                risk_reason=ft_data.get("risk_reason"),
                previous_task_id=None
            )
            db.add(ft)
            followup_tasks.append(ft)

        db.flush()

        for i, ft_data in enumerate(followup_tasks_data):
            if ft_data.get("previous_idx") is not None:
                prev_idx = ft_data["previous_idx"]
                followup_tasks[i].previous_task_id = followup_tasks[prev_idx].id

        db.flush()

        followup_status_map = {
            "pending": "待联系",
            "notified": "已通知待确认",
            "confirmed": "已确认待复诊",
            "completed": "复诊完成",
            "rescheduled": "已改期",
            "missed": "未到诊"
        }

        for i, ft_data in enumerate(followup_tasks_data):
            ft = followup_tasks[i]

            if ft_data["status"] == "pending":
                log = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建复诊提醒任务，当前状态：{followup_status_map[ft_data['status']]}",
                    old_status=None,
                    new_status=ft_data["status"],
                    remark=f"{ft_data['followup_type']}复诊安排，{ft_data['scheduled_date']} {ft_data['scheduled_time']}"
                )
                db.add(log)
            elif ft_data["status"] == "notified":
                log1 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建复诊提醒任务",
                    old_status=None,
                    new_status="pending",
                    remark=f"{ft_data['followup_type']}复诊安排"
                )
                db.add(log1)
                log2 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="王专员",
                    operator_role="随访专员",
                    action="通知患者",
                    description=f"随访专员王专员通知患者，状态从【待联系】变更为【已通知待确认】",
                    old_status="pending",
                    new_status="notified",
                    remark="已电话通知患者明日下午2点来院复诊，患者表示知晓并会准时参加"
                )
                db.add(log2)
            elif ft_data["status"] == "confirmed":
                log1 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建复诊提醒任务",
                    old_status=None,
                    new_status="pending",
                    remark=f"{ft_data['followup_type']}复诊安排"
                )
                db.add(log1)
                log2 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="王专员",
                    operator_role="随访专员",
                    action="通知患者",
                    description=f"随访专员王专员通知患者",
                    old_status="pending",
                    new_status="notified",
                    remark="已短信通知患者"
                )
                db.add(log2)
                log3 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="王专员",
                    operator_role="随访专员",
                    action="确认到诊",
                    description=f"患者确认到诊，状态从【已通知待确认】变更为【已确认待复诊】",
                    old_status="notified",
                    new_status="confirmed",
                    remark="患者回电确认会准时到诊，无特殊不适"
                )
                db.add(log3)
            elif ft_data["status"] == "completed":
                log1 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="系统",
                    operator_role="系统",
                    action="创建任务",
                    description=f"系统自动创建复诊提醒任务",
                    old_status=None,
                    new_status="pending",
                    remark=f"{ft_data['followup_type']}复诊安排"
                )
                db.add(log1)
                log2 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="王专员",
                    operator_role="随访专员",
                    action="通知患者",
                    description=f"随访专员王专员通知患者",
                    old_status="pending",
                    new_status="notified",
                    remark="已电话通知患者"
                )
                db.add(log2)
                log3 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="王专员",
                    operator_role="随访专员",
                    action="确认到诊",
                    description=f"患者确认到诊",
                    old_status="notified",
                    new_status="confirmed",
                    remark="患者确认准时到诊"
                )
                db.add(log3)
                log4 = models.OperationLog(
                    id=str(uuid.uuid4()),
                    followup_task_id=ft.id,
                    task_type="followup",
                    operator_name="王专员",
                    operator_role="随访专员",
                    action="完成复诊",
                    description=f"复诊完成，状态从【已确认待复诊】变更为【复诊完成】",
                    old_status="confirmed",
                    new_status="completed",
                    remark="复诊顺利完成，患者恢复良好，无并发症，已安排下次复诊"
                )
                db.add(log4)

        db.commit()

        print("数据库初始化完成，已插入模拟数据")

    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
