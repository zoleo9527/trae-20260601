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
    RentalContract,
    RentalSuspension,
    SuspensionStatus,
)
from rental import services


class Command(BaseCommand):
    help = "生成种子数据：设备、合同、维保记录、停租处理"

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
            status = "新建" if created else "已存在"
            self.stdout.write(f"  设备 {eq.code}({eq.name}) - {status}")

        today = date.today()

        contracts_data = [
            {"contract_no": "HT-2026-001", "equipment": equipment_objs["EXC-001"], "lessee": "中建三局", "start_date": today - timedelta(days=90), "end_date": today - timedelta(days=5), "daily_rent": Decimal("2500"), "deposit": Decimal("50000"), "is_overdue": True},
            {"contract_no": "HT-2026-002", "equipment": equipment_objs["EXC-002"], "lessee": "中铁十四局", "start_date": today - timedelta(days=60), "end_date": today + timedelta(days=30), "daily_rent": Decimal("2800"), "deposit": Decimal("60000"), "is_overdue": False},
            {"contract_no": "HT-2026-003", "equipment": equipment_objs["CRN-001"], "lessee": "中交二航局", "start_date": today - timedelta(days=45), "end_date": today + timedelta(days=15), "daily_rent": Decimal("3500"), "deposit": Decimal("80000"), "is_overdue": False},
            {"contract_no": "HT-2026-004", "equipment": equipment_objs["BLD-001"], "lessee": "万科建设", "start_date": today - timedelta(days=30), "end_date": today + timedelta(days=60), "daily_rent": Decimal("2300"), "deposit": Decimal("40000"), "is_overdue": False},
            {"contract_no": "HT-2026-005", "equipment": equipment_objs["PMP-001"], "lessee": "碧桂园建设", "start_date": today - timedelta(days=20), "end_date": today + timedelta(days=40), "daily_rent": Decimal("4500"), "deposit": Decimal("100000"), "is_overdue": False},
        ]

        for cd in contracts_data:
            eq = cd.pop("equipment")
            cd["equipment_id"] = eq.id
            contract, created = RentalContract.objects.get_or_create(contract_no=cd["contract_no"], defaults=cd)
            eq.status = EquipmentStatus.RENTED
            eq.save(update_fields=["status", "updated_at"])
            status = "新建" if created else "已存在"
            self.stdout.write(f"  合同 {contract.contract_no}({contract.lessee}) - {status}")

        maintenance_data = [
            {"equipment": equipment_objs["EXC-001"], "contract": RentalContract.objects.get(contract_no="HT-2026-001"), "maintenance_type": MaintenanceType.REPAIR, "status": MaintenanceStatus.COMPLETED, "reported_by": "调度-王明", "assigned_mechanic": "张师傅", "fault_description": "液压系统漏油", "repair_notes": "更换液压油管密封圈，补充液压油", "cost": Decimal("3200"), "cost_bearer": "出租方", "started_at": timezone.make_aware(timezone.datetime(2026, 5, 10, 8, 0)), "completed_at": timezone.make_aware(timezone.datetime(2026, 5, 11, 16, 0))},
            {"equipment": equipment_objs["EXC-001"], "contract": RentalContract.objects.get(contract_no="HT-2026-001"), "maintenance_type": MaintenanceType.ROUTINE, "status": MaintenanceStatus.IN_PROGRESS, "reported_by": "调度-王明", "assigned_mechanic": "李师傅", "fault_description": "定期保养：5000小时", "repair_notes": "更换机油、滤芯，检查履带", "cost": Decimal("1500"), "cost_bearer": "出租方", "started_at": timezone.make_aware(timezone.datetime(2026, 6, 12, 9, 0))},
            {"equipment": equipment_objs["EXC-002"], "contract": RentalContract.objects.get(contract_no="HT-2026-002"), "maintenance_type": MaintenanceType.REPAIR, "status": MaintenanceStatus.PENDING, "reported_by": "中铁十四局-现场刘工", "assigned_mechanic": "", "fault_description": "发动机异响，疑似气门间隙过大", "repair_notes": "", "cost": Decimal("0"), "cost_bearer": ""},
            {"equipment": equipment_objs["CRN-001"], "contract": RentalContract.objects.get(contract_no="HT-2026-003"), "maintenance_type": MaintenanceType.OVERHAUL, "status": MaintenanceStatus.IN_PROGRESS, "reported_by": "调度-王明", "assigned_mechanic": "张师傅", "fault_description": "吊臂回转减速机大修", "repair_notes": "拆检回转减速机，发现齿轮磨损严重，已订购配件", "cost": Decimal("28000"), "cost_bearer": "承租方", "started_at": timezone.make_aware(timezone.datetime(2026, 6, 8, 8, 0))},
            {"equipment": equipment_objs["BLD-001"], "contract": RentalContract.objects.get(contract_no="HT-2026-004"), "maintenance_type": MaintenanceType.ROUTINE, "status": MaintenanceStatus.COMPLETED, "reported_by": "万科建设-现场陈工", "assigned_mechanic": "赵师傅", "fault_description": "日常巡检保养", "repair_notes": "各部件正常，补充润滑脂", "cost": Decimal("600"), "cost_bearer": "出租方", "completed_at": timezone.make_aware(timezone.datetime(2026, 6, 10, 17, 0))},
        ]

        for md in maintenance_data:
            eq = md.pop("equipment")
            md["equipment_id"] = eq.id
            contract = md.pop("contract")
            md["contract_id"] = contract.id
            MaintenanceRecord.objects.create(**md)
            self.stdout.write(f"  维保记录: {eq.code} - {md['fault_description'][:20]}")

        eq_exc001 = equipment_objs["EXC-001"]
        eq_exc001.status = EquipmentStatus.IN_MAINTENANCE
        eq_exc001.save(update_fields=["status", "updated_at"])

        eq_crn001 = equipment_objs["CRN-001"]
        eq_crn001.status = EquipmentStatus.IN_MAINTENANCE
        eq_crn001.save(update_fields=["status", "updated_at"])

        suspension = RentalSuspension.objects.create(
            contract=RentalContract.objects.get(contract_no="HT-2026-001"),
            equipment=equipment_objs["EXC-001"],
            suspension_date=today - timedelta(days=3),
            return_condition="外观正常，履带磨损中等",
            fuel_level="约40%",
            meter_reading="5832小时",
            damage_description="驾驶室左侧玻璃有裂纹",
            deduction_amount=Decimal("1500"),
            deduction_reason="驾驶室玻璃损坏赔偿",
            status=SuspensionStatus.PENDING,
            maintenance_snapshot=services.build_maintenance_snapshot(equipment_objs["EXC-001"]),
        )
        self.stdout.write(f"  停租处理: {suspension.id} - HT-2026-001")

        self.stdout.write(self.style.SUCCESS("种子数据生成完成!"))
        self.stdout.write(f"  设备: {Equipment.objects.count()} 台")
        self.stdout.write(f"  合同: {RentalContract.objects.count()} 份")
        self.stdout.write(f"  维保: {MaintenanceRecord.objects.count()} 条")
        self.stdout.write(f"  停租: {RentalSuspension.objects.count()} 条")
