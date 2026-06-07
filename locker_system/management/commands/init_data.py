from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from datetime import datetime, timedelta
from decimal import Decimal

from locker_system.models import (
    StaffProfile, LockerArea, Locker, Wristband, Technician, TechnicianSchedule,
    LockerAbnormal, Compensation, RoleType
)


class Command(BaseCommand):
    help = "初始化测试数据"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("开始初始化数据...")

        user_admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={"is_superuser": True, "is_staff": True, "first_name": "系统", "last_name": "管理员"}
        )
        user_admin.set_password("admin123456")
        user_admin.save()

        user_reception, _ = User.objects.get_or_create(
            username="reception",
            defaults={"is_staff": True, "first_name": "张", "last_name": "前台"}
        )
        user_reception.set_password("123456")
        user_reception.save()

        user_supervisor, _ = User.objects.get_or_create(
            username="supervisor",
            defaults={"is_staff": True, "first_name": "李", "last_name": "主管"}
        )
        user_supervisor.set_password("123456")
        user_supervisor.save()

        user_finance, _ = User.objects.get_or_create(
            username="finance",
            defaults={"is_staff": True, "first_name": "王", "last_name": "财务"}
        )
        user_finance.set_password("123456")
        user_finance.save()

        StaffProfile.objects.get_or_create(
            user=user_admin,
            defaults={"role": RoleType.ADMIN, "employee_id": "ADM001", "phone": "13800000000"}
        )
        StaffProfile.objects.get_or_create(
            user=user_reception,
            defaults={"role": RoleType.RECEPTION, "employee_id": "REC001", "phone": "13800000001"}
        )
        StaffProfile.objects.get_or_create(
            user=user_supervisor,
            defaults={"role": RoleType.FLOOR_SUPERVISOR, "employee_id": "SUP001", "phone": "13800000002"}
        )
        StaffProfile.objects.get_or_create(
            user=user_finance,
            defaults={"role": RoleType.FINANCE, "employee_id": "FIN001", "phone": "13800000003"}
        )

        area1, _ = LockerArea.objects.get_or_create(
            name="男宾区", defaults={"floor": 1, "description": "一楼男宾储物柜"}
        )
        area2, _ = LockerArea.objects.get_or_create(
            name="女宾区", defaults={"floor": 1, "description": "一楼女宾储物柜"}
        )
        area3, _ = LockerArea.objects.get_or_create(
            name="VIP区", defaults={"floor": 2, "description": "二楼VIP储物柜"}
        )

        lockers = []
        for i in range(1, 21):
            locker, _ = Locker.objects.get_or_create(
                locker_no=f"M{i:03d}",
                defaults={"area": area1, "status": Locker.Status.AVAILABLE}
            )
            lockers.append(locker)
        for i in range(1, 21):
            locker, _ = Locker.objects.get_or_create(
                locker_no=f"F{i:03d}",
                defaults={"area": area2, "status": Locker.Status.AVAILABLE}
            )
            lockers.append(locker)
        for i in range(1, 11):
            locker, _ = Locker.objects.get_or_create(
                locker_no=f"V{i:03d}",
                defaults={"area": area3, "status": Locker.Status.AVAILABLE}
            )
            lockers.append(locker)

        for i in range(1, 31):
            Wristband.objects.get_or_create(
                code=f"W{i:03d}",
                defaults={"status": Wristband.Status.IDLE}
            )

        tech1, _ = Technician.objects.get_or_create(
            employee_id="T001", defaults={"name": "赵师傅", "phone": "13900000001"}
        )
        tech2, _ = Technician.objects.get_or_create(
            employee_id="T002", defaults={"name": "钱师傅", "phone": "13900000002"}
        )
        tech3, _ = Technician.objects.get_or_create(
            employee_id="T003", defaults={"name": "孙师傅", "phone": "13900000003"}
        )

        now = datetime.now()
        today = now.date()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)

        area1 = LockerArea.objects.get(name="男宾区")
        area2 = LockerArea.objects.get(name="女宾区")
        area3 = LockerArea.objects.get(name="VIP区")

        TechnicianSchedule.objects.get_or_create(
            technician=tech1, shift_date=today,
            defaults={"shift_type": "早班", "assigned_area": area1, "remark": "负责男宾区储物柜巡检"}
        )
        TechnicianSchedule.objects.get_or_create(
            technician=tech1, shift_date=yesterday,
            defaults={"shift_type": "中班", "assigned_area": area1, "remark": "负责男宾区储物柜巡检"}
        )
        TechnicianSchedule.objects.get_or_create(
            technician=tech2, shift_date=today,
            defaults={"shift_type": "中班", "assigned_area": area2, "remark": "负责女宾区储物柜巡检"}
        )
        TechnicianSchedule.objects.get_or_create(
            technician=tech2, shift_date=two_days_ago,
            defaults={"shift_type": "晚班", "assigned_area": area1, "remark": "负责男宾区储物柜巡检"}
        )
        TechnicianSchedule.objects.get_or_create(
            technician=tech3, shift_date=today,
            defaults={"shift_type": "晚班", "assigned_area": area3, "remark": "负责VIP区储物柜巡检"}
        )

        reception_staff = StaffProfile.objects.get(role=RoleType.RECEPTION)
        supervisor_staff = StaffProfile.objects.get(role=RoleType.FLOOR_SUPERVISOR)
        finance_staff = StaffProfile.objects.get(role=RoleType.FINANCE)

        Locker1 = Locker.objects.get(locker_no="M005")
        abnormal1 = LockerAbnormal.objects.create(
            locker=Locker1,
            abnormal_type=LockerAbnormal.Type.CANNOT_OPEN,
            status=LockerAbnormal.Status.PENDING,
            priority=2,
            customer_name="张三",
            customer_phone="13811111111",
            description="客人反映手牌刷不开柜门",
            reported_by=reception_staff,
            expected_deadline=datetime.combine(today, datetime(2000, 1, 1, 12, 0).time()),
        )

        Locker2 = Locker.objects.get(locker_no="F008")
        abnormal2 = LockerAbnormal.objects.create(
            locker=Locker2,
            abnormal_type=LockerAbnormal.Type.ITEM_MISSING,
            status=LockerAbnormal.Status.PROCESSING,
            priority=3,
            customer_name="李四",
            customer_phone="13822222222",
            description="客人称钱包遗失在柜中不见",
            reported_by=reception_staff,
            assigned_to=supervisor_staff,
            assigned_at=now - timedelta(hours=2),
            expected_deadline=datetime.combine(yesterday, datetime(2000, 1, 1, 18, 0).time()),
            related_technician=tech1,
        )

        Locker3 = Locker.objects.get(locker_no="V003")
        abnormal3 = LockerAbnormal.objects.create(
            locker=Locker3,
            abnormal_type=LockerAbnormal.Type.LOCKER_DAMAGE,
            status=LockerAbnormal.Status.RETURNED,
            priority=1,
            customer_name="王五",
            description="柜门铰链损坏，门无法关严",
            reported_by=reception_staff,
            assigned_to=supervisor_staff,
            assigned_at=now - timedelta(hours=5),
            return_reason="需要工程部配合维修，请先联系工程部",
            returned_by=supervisor_staff,
            returned_at=now - timedelta(hours=1),
            expected_deadline=datetime.combine(today, datetime(2000, 1, 1, 17, 0).time()),
        )

        Locker4 = Locker.objects.get(locker_no="M012")
        abnormal4 = LockerAbnormal.objects.create(
            locker=Locker4,
            abnormal_type=LockerAbnormal.Type.ITEM_MISSING,
            status=LockerAbnormal.Status.NEED_COMPENSATION,
            priority=4,
            customer_name="赵六",
            customer_phone="13844444444",
            description="客人手机遗失，价值约5000元",
            reported_by=reception_staff,
            assigned_to=supervisor_staff,
            assigned_at=now - timedelta(hours=8),
            processed_by=supervisor_staff,
            processed_at=now - timedelta(hours=3),
            process_result="确认柜内确无手机，调监控显示无外人开过此柜，建议赔付",
            expected_deadline=datetime.combine(two_days_ago, datetime(2000, 1, 1, 20, 0).time()),
            related_technician=tech2,
        )

        comp1 = Compensation.objects.create(
            abnormal=abnormal4,
            customer_name="赵六",
            customer_phone="13844444444",
            item_description="iPhone 14 Pro 256G",
            estimated_value=Decimal("5000.00"),
            compensation_amount=Decimal("3000.00"),
            status=Compensation.Status.PENDING_REVIEW,
            proposed_by=supervisor_staff,
        )

        Locker5 = Locker.objects.get(locker_no="F015")
        abnormal5 = LockerAbnormal.objects.create(
            locker=Locker5,
            abnormal_type=LockerAbnormal.Type.WRONG_ITEM,
            status=LockerAbnormal.Status.RESOLVED,
            priority=1,
            customer_name="孙七",
            description="客人把物品放错柜子了",
            reported_by=reception_staff,
            assigned_to=supervisor_staff,
            assigned_at=now - timedelta(days=1),
            processed_by=supervisor_staff,
            processed_at=now - timedelta(days=1, hours=2),
            process_result="已帮客人找到物品并归位",
        )

        Locker6 = Locker.objects.get(locker_no="M002")
        abnormal6 = LockerAbnormal.objects.create(
            locker=Locker6,
            abnormal_type=LockerAbnormal.Type.WRISTBAND_LOST,
            status=LockerAbnormal.Status.PROCESSING,
            priority=3,
            customer_name="周八",
            customer_phone="13866666666",
            description="客人手牌遗失，需要开柜",
            reported_by=reception_staff,
            assigned_to=supervisor_staff,
            assigned_at=now - timedelta(minutes=30),
            expected_deadline=datetime.combine(today, datetime(2000, 1, 1, 15, 0).time()),
        )

        self.stdout.write(self.style.SUCCESS("数据初始化完成！"))
        self.stdout.write("登录账号：admin / admin123456")
        self.stdout.write("前台：reception / 123456")
        self.stdout.write("楼层主管：supervisor / 123456")
        self.stdout.write("财务：finance / 123456")
