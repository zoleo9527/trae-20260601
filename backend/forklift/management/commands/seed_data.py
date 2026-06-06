from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from forklift.models import ForkliftWorkOrder, StatusHistory, WorkOrderStatus, Role


class Command(BaseCommand):
    help = '初始化样例数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化样例数据...')

        ForkliftWorkOrder.objects.all().delete()
        StatusHistory.objects.all().delete()

        now = timezone.now()

        sample_data = [
            {
                'idempotency_key': 'SAMPLE-001-PENDING',
                'vehicle_plate': '沪A12345',
                'driver_name': '张师傅',
                'driver_phone': '13800138001',
                'dock_number': 'A-01',
                'cargo_type': '电子产品',
                'cargo_weight': 25.5,
                'status': WorkOrderStatus.PENDING_DISPATCH,
                'current_role': Role.DISPATCHER,
                'supplementary_notes': '货物需轻拿轻放，含高值商品',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                ],
            },
            {
                'idempotency_key': 'SAMPLE-002-PENDING',
                'vehicle_plate': '苏B67890',
                'driver_name': '李师傅',
                'driver_phone': '13800138002',
                'dock_number': 'B-03',
                'cargo_type': '食品冷链',
                'cargo_weight': 18.0,
                'status': WorkOrderStatus.PENDING_DISPATCH,
                'current_role': Role.DISPATCHER,
                'supplementary_notes': '冷藏车，温度需保持-18℃',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                ],
            },
            {
                'idempotency_key': 'SAMPLE-003-DISPATCHED',
                'vehicle_plate': '浙C11111',
                'driver_name': '王师傅',
                'driver_phone': '13800138003',
                'dock_number': 'A-02',
                'cargo_type': '服装鞋帽',
                'cargo_weight': 12.3,
                'status': WorkOrderStatus.DISPATCHED,
                'current_role': Role.FORKLIFT_LEADER,
                'forklift_number': 'FL-005',
                'operator_name': '赵司机',
                'dispatcher': '刘调度',
                'dispatched_at': now - timedelta(minutes=10),
                'supplementary_notes': '共200箱，分两个区域堆放',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                    (WorkOrderStatus.PENDING_DISPATCH, WorkOrderStatus.DISPATCHED, Role.DISPATCHER, '刘调度', '派工：叉车FL-005，司机赵司机'),
                ],
            },
            {
                'idempotency_key': 'SAMPLE-004-INPROGRESS',
                'vehicle_plate': '粤D22222',
                'driver_name': '陈师傅',
                'driver_phone': '13800138004',
                'dock_number': 'C-01',
                'cargo_type': '机械设备',
                'cargo_weight': 35.0,
                'status': WorkOrderStatus.IN_PROGRESS,
                'current_role': Role.FORKLIFT_LEADER,
                'forklift_number': 'FL-008',
                'operator_name': '孙司机',
                'dispatcher': '周调度',
                'dispatched_at': now - timedelta(minutes=45),
                'work_start_at': now - timedelta(minutes=30),
                'supplementary_notes': '大型设备，需使用吊具配合',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                    (WorkOrderStatus.PENDING_DISPATCH, WorkOrderStatus.DISPATCHED, Role.DISPATCHER, '周调度', '派工：叉车FL-008，司机孙司机'),
                    (WorkOrderStatus.DISPATCHED, WorkOrderStatus.IN_PROGRESS, Role.FORKLIFT_LEADER, '孙司机', '开始作业'),
                ],
            },
            {
                'idempotency_key': 'SAMPLE-005-PENDING-CONFIRM',
                'vehicle_plate': '鲁E33333',
                'driver_name': '刘师傅',
                'driver_phone': '13800138005',
                'dock_number': 'B-01',
                'cargo_type': '日用百货',
                'cargo_weight': 22.0,
                'status': WorkOrderStatus.PENDING_CONFIRM,
                'current_role': Role.WAREHOUSE_CLERK,
                'forklift_number': 'FL-003',
                'operator_name': '吴司机',
                'dispatcher': '郑调度',
                'warehouse_clerk': '钱文员',
                'dispatched_at': now - timedelta(hours=1, minutes=30),
                'work_start_at': now - timedelta(hours=1, minutes=15),
                'work_end_at': now - timedelta(minutes=20),
                'work_duration_minutes': 55,
                'supplementary_notes': '货物完好，数量无误',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                    (WorkOrderStatus.PENDING_DISPATCH, WorkOrderStatus.DISPATCHED, Role.DISPATCHER, '郑调度', '派工：叉车FL-003，司机吴司机'),
                    (WorkOrderStatus.DISPATCHED, WorkOrderStatus.IN_PROGRESS, Role.FORKLIFT_LEADER, '吴司机', '开始作业'),
                    (WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PENDING_CONFIRM, Role.FORKLIFT_LEADER, '吴司机', '结束作业，时长55分钟，提交确认'),
                ],
            },
            {
                'idempotency_key': 'SAMPLE-006-COMPLETED',
                'vehicle_plate': '冀F44444',
                'driver_name': '赵师傅',
                'driver_phone': '13800138006',
                'dock_number': 'A-03',
                'cargo_type': '化工原料',
                'cargo_weight': 28.5,
                'status': WorkOrderStatus.COMPLETED,
                'current_role': None,
                'forklift_number': 'FL-001',
                'operator_name': '冯司机',
                'dispatcher': '陈调度',
                'warehouse_clerk': '孙文员',
                'dispatched_at': now - timedelta(hours=3),
                'work_start_at': now - timedelta(hours=2, minutes=45),
                'work_end_at': now - timedelta(hours=2),
                'work_duration_minutes': 45,
                'supplementary_notes': '已完成，签收单齐全',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                    (WorkOrderStatus.PENDING_DISPATCH, WorkOrderStatus.DISPATCHED, Role.DISPATCHER, '陈调度', '派工：叉车FL-001，司机冯司机'),
                    (WorkOrderStatus.DISPATCHED, WorkOrderStatus.IN_PROGRESS, Role.FORKLIFT_LEADER, '冯司机', '开始作业'),
                    (WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PENDING_CONFIRM, Role.FORKLIFT_LEADER, '冯司机', '结束作业，时长45分钟，提交确认'),
                    (WorkOrderStatus.PENDING_CONFIRM, WorkOrderStatus.COMPLETED, Role.WAREHOUSE_CLERK, '孙文员', '确认完成'),
                ],
            },
            {
                'idempotency_key': 'SAMPLE-007-COMPLETED',
                'vehicle_plate': '豫G55555',
                'driver_name': '孙师傅',
                'driver_phone': '13800138007',
                'dock_number': 'C-02',
                'cargo_type': '家具建材',
                'cargo_weight': 32.0,
                'status': WorkOrderStatus.COMPLETED,
                'current_role': None,
                'forklift_number': 'FL-007',
                'operator_name': '郑司机',
                'dispatcher': '林调度',
                'warehouse_clerk': '周文员',
                'dispatched_at': now - timedelta(hours=5),
                'work_start_at': now - timedelta(hours=4, minutes=40),
                'work_end_at': now - timedelta(hours=3, minutes=50),
                'work_duration_minutes': 50,
                'supplementary_notes': '大件货物，已小心搬运',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                    (WorkOrderStatus.PENDING_DISPATCH, WorkOrderStatus.DISPATCHED, Role.DISPATCHER, '林调度', '派工：叉车FL-007，司机郑司机'),
                    (WorkOrderStatus.DISPATCHED, WorkOrderStatus.IN_PROGRESS, Role.FORKLIFT_LEADER, '郑司机', '开始作业'),
                    (WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PENDING_CONFIRM, Role.FORKLIFT_LEADER, '郑司机', '结束作业，时长50分钟，提交确认'),
                    (WorkOrderStatus.PENDING_CONFIRM, WorkOrderStatus.COMPLETED, Role.WAREHOUSE_CLERK, '周文员', '确认完成'),
                ],
            },
            {
                'idempotency_key': 'SAMPLE-008-EXCEPTION',
                'vehicle_plate': '黑H66666',
                'driver_name': '周师傅',
                'driver_phone': '13800138008',
                'dock_number': 'D-01',
                'cargo_type': '精密仪器',
                'cargo_weight': 8.5,
                'status': WorkOrderStatus.EXCEPTION,
                'current_role': Role.DISPATCHER,
                'forklift_number': 'FL-002',
                'operator_name': '王司机',
                'dispatcher': '吴调度',
                'dispatched_at': now - timedelta(hours=2),
                'work_start_at': now - timedelta(hours=1, minutes=45),
                'exception_note': '设备外包装破损，疑似运输途中损坏，已拍照留证并通知货主',
                'supplementary_notes': '高值精密仪器，原价约50万',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                    (WorkOrderStatus.PENDING_DISPATCH, WorkOrderStatus.DISPATCHED, Role.DISPATCHER, '吴调度', '派工：叉车FL-002，司机王司机'),
                    (WorkOrderStatus.DISPATCHED, WorkOrderStatus.IN_PROGRESS, Role.FORKLIFT_LEADER, '王司机', '开始作业'),
                    (WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.EXCEPTION, Role.DISPATCHER, '吴调度', '异常：设备外包装破损，疑似运输途中损坏，已拍照留证并通知货主'),
                ],
            },
            {
                'idempotency_key': 'SAMPLE-009-RETURNED',
                'vehicle_plate': '湘J77777',
                'driver_name': '吴师傅',
                'driver_phone': '13800138009',
                'dock_number': 'B-02',
                'cargo_type': '生鲜水果',
                'cargo_weight': 15.0,
                'status': WorkOrderStatus.RETURNED,
                'current_role': Role.FORKLIFT_LEADER,
                'forklift_number': 'FL-006',
                'operator_name': '冯司机',
                'dispatcher': '郑调度',
                'warehouse_clerk': '李文员',
                'dispatched_at': now - timedelta(hours=4),
                'work_start_at': now - timedelta(hours=3, minutes=40),
                'work_end_at': now - timedelta(hours=3, minutes=10),
                'work_duration_minutes': 30,
                'return_reason': '抽检发现部分水果有腐烂迹象，不符合收货标准，退回待承运商处理',
                'supplementary_notes': '进口车厘子，对温度敏感',
                'history': [
                    ('', WorkOrderStatus.PENDING_DISPATCH, Role.DISPATCHER, '系统', '创建作业单'),
                    (WorkOrderStatus.PENDING_DISPATCH, WorkOrderStatus.DISPATCHED, Role.DISPATCHER, '郑调度', '派工：叉车FL-006，司机冯司机'),
                    (WorkOrderStatus.DISPATCHED, WorkOrderStatus.IN_PROGRESS, Role.FORKLIFT_LEADER, '冯司机', '开始作业'),
                    (WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.PENDING_CONFIRM, Role.FORKLIFT_LEADER, '冯司机', '结束作业，时长30分钟，提交确认'),
                    (WorkOrderStatus.PENDING_CONFIRM, WorkOrderStatus.RETURNED, Role.WAREHOUSE_CLERK, '李文员', '退回：抽检发现部分水果有腐烂迹象，不符合收货标准，退回待承运商处理'),
                ],
            },
        ]

        for data in sample_data:
            history_list = data.pop('history', [])
            work_order = ForkliftWorkOrder.objects.create(**data)

            for h_data in history_list:
                from_status, to_status, operator_role, operator_name, remark = h_data
                StatusHistory.objects.create(
                    work_order=work_order,
                    from_status=from_status,
                    to_status=to_status,
                    operator_role=operator_role,
                    operator_name=operator_name,
                    remark=remark,
                    created_at=now - timedelta(minutes=len(history_list) - history_list.index(h_data)) * 5,
                )

        self.stdout.write(self.style.SUCCESS(f'成功创建 {len(sample_data)} 条样例作业单'))
        self.stdout.write(self.style.SUCCESS('  - 待派工: 2条 (调度员待办)'))
        self.stdout.write(self.style.SUCCESS('  - 已派工: 1条 (叉车班长待办)'))
        self.stdout.write(self.style.SUCCESS('  - 作业中: 1条 (叉车班长待办)'))
        self.stdout.write(self.style.SUCCESS('  - 待确认: 1条 (仓库文员待办)'))
        self.stdout.write(self.style.SUCCESS('  - 已完成: 2条'))
        self.stdout.write(self.style.SUCCESS('  - 异常: 1条'))
        self.stdout.write(self.style.SUCCESS('  - 已退回: 1条'))
