from decimal import Decimal
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from rental.models import (
    Equipment,
    EquipmentStatus,
    MaintenanceRecord,
    MaintenanceStatus,
    MaintenanceType,
    NotificationLog,
    RentalContract,
    RentalSuspension,
    StatusChangeLog,
    SuspensionStatus,
    Role,
)
from rental import services


class Command(BaseCommand):
    help = "生成种子数据：设备、合同、维保记录、停租处理（可重复执行）"

    def _safe_log_status_change(self, entity_type, entity_id, old_status, new_status, changed_by="", reason=""):
        if old_status == new_status:
            return
        StatusChangeLog.objects.get_or_create(
            entity_type=entity_type,
            entity_id=entity_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            defaults={"reason": reason},
        )

    def handle(self, *args, **options):
        self.stdout.write("开始生成种子数据...")

        equipments_data = [
            {"code": "EXC-001", "name": "小松PC200挖掘机", "category": "挖掘机", "model_spec": "PC200-8", "daily_rent": Decimal("2500"), "fuel_type": "柴油", "current_project": "滨江新城项目"},
            {"code": "EXC-002", "name": "卡特320挖掘机", "category": "挖掘机", "model_spec": "CAT320D", "daily_rent": Decimal("2800"), "fuel_type": "柴油", "current_project": "地铁3号线"},
            {"code": "CRN-001", "name": "徐工QY25K5起重机", "category": "起重机", "model_spec": "QY25K5-I", "daily_rent": Decimal("3500"), "fuel_type": "柴油", "current_project": "高铁站项目"},
            {"code": "BLD-001", "name": "三一SY215C挖掘机", "category": "挖掘机", "model_spec": "SY215C", "daily_rent": Decimal("2300"), "fuel_type": "柴油", "current_project": "工业园项目"},
            {"code": "RLL-001", "name": "戴纳派克CC624压路机", "category": "压路机", "model_spec": "CC624", "daily_rent": Decimal("1800"), "fuel_type": "柴油", "current_project": ""},
            {"code": "PMP-001", "name": "中联ZLJ5440THB泵车", "category": "泵车", "model_spec": "56X-6RZ", "daily_rent": Decimal("4500"), "fuel_type": "柴油", "current_project": "商业广场项目"},
        ]

        equipment_objs = {}
        for ed in equipments_data:
            eq, created = Equipment.objects.get_or_create(code=ed["code"], defaults=ed)
            equipment_objs[ed["code"]] = eq
            if created:
                self._safe_log_status_change(
                    "equipment", eq.id, "", EquipmentStatus.AVAILABLE, "seed", "创建设备，初始状态为空闲"
                )
            status = "新建" if created else "已存在"
            self.stdout.write(f"  设备 {eq.code}({eq.name}) - {status}")

        today = date.today()

        contracts_data = [
            {"contract_no": "HT-2026-001", "equipment_code": "EXC-001", "lessee": "中建三局", "start_date": today - timedelta(days=90), "end_date": today - timedelta(days=5), "daily_rent": Decimal("2500"), "deposit": Decimal("50000"), "is_overdue": True, "remarks": "合同已到期，设备仍未归还，已标记超期"},
            {"contract_no": "HT-2026-002", "equipment_code": "EXC-002", "lessee": "中铁十四局", "start_date": today - timedelta(days=60), "end_date": today + timedelta(days=30), "daily_rent": Decimal("2800"), "deposit": Decimal("60000"), "is_overdue": False, "remarks": "租期内"},
            {"contract_no": "HT-2026-003", "equipment_code": "CRN-001", "lessee": "中交二航局", "start_date": today - timedelta(days=45), "end_date": today + timedelta(days=15), "daily_rent": Decimal("3500"), "deposit": Decimal("80000"), "is_overdue": False, "remarks": "租期内"},
            {"contract_no": "HT-2026-004", "equipment_code": "BLD-001", "lessee": "万科建设", "start_date": today - timedelta(days=30), "end_date": today + timedelta(days=60), "daily_rent": Decimal("2300"), "deposit": Decimal("40000"), "is_overdue": False, "remarks": "租期内"},
            {"contract_no": "HT-2026-005", "equipment_code": "PMP-001", "lessee": "碧桂园建设", "start_date": today - timedelta(days=20), "end_date": today + timedelta(days=40), "daily_rent": Decimal("4500"), "deposit": Decimal("100000"), "is_overdue": False, "remarks": "租期内"},
        ]

        for cd in contracts_data:
            eq = equipment_objs[cd.pop("equipment_code")]
            cd["equipment_id"] = eq.id
            contract, created = RentalContract.objects.get_or_create(contract_no=cd["contract_no"], defaults=cd)
            status = "新建" if created else "已存在"
            self.stdout.write(f"  合同 {contract.contract_no}({contract.lessee}) - {status}")

        maintenance_seed_key = [
            ("EXC-001", MaintenanceType.REPAIR, "液压系统漏油"),
            ("EXC-001", MaintenanceType.ROUTINE, "定期保养：5000小时"),
            ("EXC-002", MaintenanceType.REPAIR, "发动机异响，疑似气门间隙过大"),
            ("CRN-001", MaintenanceType.OVERHAUL, "吊臂回转减速机大修"),
            ("BLD-001", MaintenanceType.ROUTINE, "日常巡检保养"),
        ]

        maintenance_data = [
            {"equipment_code": "EXC-001", "contract_no": "HT-2026-001", "maintenance_type": MaintenanceType.REPAIR, "status": MaintenanceStatus.COMPLETED, "reported_by": "调度-王明", "assigned_mechanic": "张师傅", "fault_description": "液压系统漏油", "repair_notes": "更换液压油管密封圈，补充液压油", "cost": Decimal("3200"), "cost_bearer": "出租方", "started_at": timezone.make_aware(timezone.datetime(2026, 5, 10, 8, 0)), "completed_at": timezone.make_aware(timezone.datetime(2026, 5, 11, 16, 0))},
            {"equipment_code": "EXC-001", "contract_no": "HT-2026-001", "maintenance_type": MaintenanceType.ROUTINE, "status": MaintenanceStatus.IN_PROGRESS, "reported_by": "调度-王明", "assigned_mechanic": "李师傅", "fault_description": "定期保养：5000小时", "repair_notes": "更换机油、滤芯，检查履带", "cost": Decimal("1500"), "cost_bearer": "出租方", "started_at": timezone.make_aware(timezone.datetime(2026, 6, 12, 9, 0))},
            {"equipment_code": "EXC-002", "contract_no": "HT-2026-002", "maintenance_type": MaintenanceType.REPAIR, "status": MaintenanceStatus.PENDING, "reported_by": "中铁十四局-现场刘工", "assigned_mechanic": "", "fault_description": "发动机异响，疑似气门间隙过大", "repair_notes": "", "cost": Decimal("0"), "cost_bearer": ""},
            {"equipment_code": "CRN-001", "contract_no": "HT-2026-003", "maintenance_type": MaintenanceType.OVERHAUL, "status": MaintenanceStatus.IN_PROGRESS, "reported_by": "调度-王明", "assigned_mechanic": "张师傅", "fault_description": "吊臂回转减速机大修", "repair_notes": "拆检回转减速机，发现齿轮磨损严重，已订购配件", "cost": Decimal("28000"), "cost_bearer": "承租方", "started_at": timezone.make_aware(timezone.datetime(2026, 6, 8, 8, 0))},
            {"equipment_code": "BLD-001", "contract_no": "HT-2026-004", "maintenance_type": MaintenanceType.ROUTINE, "status": MaintenanceStatus.COMPLETED, "reported_by": "万科建设-现场陈工", "assigned_mechanic": "赵师傅", "fault_description": "日常巡检保养", "repair_notes": "各部件正常，补充润滑脂", "cost": Decimal("600"), "cost_bearer": "出租方", "completed_at": timezone.make_aware(timezone.datetime(2026, 6, 10, 17, 0))},
        ]

        for idx, md in enumerate(maintenance_data):
            eq = equipment_objs[md.pop("equipment_code")]
            contract = RentalContract.objects.get(contract_no=md.pop("contract_no"))
            seed_key = maintenance_seed_key[idx]
            lookup = {
                "equipment": eq,
                "maintenance_type": seed_key[1],
                "fault_description": seed_key[2],
            }
            md["equipment_id"] = eq.id
            md["contract_id"] = contract.id
            record, created = MaintenanceRecord.objects.get_or_create(defaults=md, **lookup)
            if created:
                if record.status != MaintenanceStatus.PENDING:
                    self._safe_log_status_change(
                        "maintenance", record.id, MaintenanceStatus.PENDING, record.status,
                        "seed", f"种子数据初始化，直接设置为{record.get_status_display()}"
                    )
            status = "新建" if created else "已存在"
            self.stdout.write(f"  维保记录: {eq.code} - {md['fault_description'][:20]} - {status}")

        for code in ("EXC-001", "CRN-001", "EXC-002"):
            eq = equipment_objs[code]
            old_status = eq.status
            services._recalculate_equipment_status(eq, "seed", "种子数据初始化后重算设备状态")
            eq.refresh_from_db()
            if old_status != eq.status:
                self.stdout.write(f"  设备 {eq.code} 状态重算: {old_status} -> {eq.status}")

        contract_001 = RentalContract.objects.get(contract_no="HT-2026-001")
        eq_exc001 = equipment_objs["EXC-001"]
        suspension_lookup = {
            "contract": contract_001,
            "equipment": eq_exc001,
            "suspension_date": today - timedelta(days=3),
        }
        suspension_defaults = {
            "return_condition": "外观正常，履带磨损中等",
            "fuel_level": "约40%",
            "meter_reading": "5832小时",
            "damage_description": "驾驶室左侧玻璃有裂纹",
            "deduction_amount": Decimal("1500"),
            "deduction_reason": "驾驶室玻璃损坏赔偿",
            "status": SuspensionStatus.PENDING,
            "maintenance_snapshot": services.build_maintenance_snapshot(eq_exc001),
        }
        suspension, created = RentalSuspension.objects.get_or_create(defaults=suspension_defaults, **suspension_lookup)
        if created:
            self._safe_log_status_change(
                "suspension", suspension.id, "", SuspensionStatus.PENDING, "seed", "种子数据创建停租处理"
            )
            NotificationLog.objects.get_or_create(
                notification_type="suspension_created",
                target_role=Role.RENTAL_MANAGER,
                title=f"新停租申请: {contract_001.contract_no}",
                defaults={
                    "content": f"设备 {eq_exc001.code} 的停租申请已创建，请审核。",
                    "related_suspension": suspension,
                    "related_equipment": eq_exc001,
                },
            )
            old_status = eq_exc001.status
            services._recalculate_equipment_status(eq_exc001, "seed", "创建停租处理")
            eq_exc001.refresh_from_db()
            if old_status != eq_exc001.status:
                self.stdout.write(f"  设备 {eq_exc001.code} 状态: {old_status} -> {eq_exc001.status} (停租创建)")
        status = "新建" if created else "已存在"
        self.stdout.write(f"  停租处理: {suspension.id} - HT-2026-001 - {status}")

        eq_remaining = ["EXC-002", "CRN-001", "BLD-001", "PMP-001", "RLL-001"]
        for code in eq_remaining:
            eq = equipment_objs[code]
            old_status = eq.status
            services._recalculate_equipment_status(eq, "seed", "种子数据收尾重算")
            eq.refresh_from_db()
            if old_status != eq.status:
                self.stdout.write(f"  设备 {eq.code} 状态: {old_status} -> {eq.status}")

        self.stdout.write(self.style.SUCCESS("种子数据生成完成!"))
        self.stdout.write(f"  设备: {Equipment.objects.count()} 台")
        self.stdout.write(f"  合同: {RentalContract.objects.count()} 份")
        self.stdout.write(f"  维保: {MaintenanceRecord.objects.count()} 条")
        self.stdout.write(f"  停租: {RentalSuspension.objects.count()} 条")
        self.stdout.write(f"  通知: {NotificationLog.objects.count()} 条")
        self.stdout.write(f"  状态变更日志: {StatusChangeLog.objects.count()} 条")
