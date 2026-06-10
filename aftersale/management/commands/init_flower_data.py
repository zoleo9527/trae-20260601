from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction

from aftersale.models import (
    EmployeeProfile, Role,
    AfterSaleOrder, AfterSaleStatus,
    LossRecord, LossStatus, LossResponsibility,
    AfterSaleHistory, LossHistory,
)
from aftersale.permissions import send_role_broadcast, send_notify


EMPLOYEES = [
    {'username': 'admin', 'password': 'admin123', 'role': Role.ADMIN, 'real_name': '系统管理员', 'is_super': True},
    {'username': 'xiaoshou', 'password': 'xs123456', 'role': Role.SALES_STAFF, 'real_name': '李销售', 'is_super': False},
    {'username': 'zhongzhi', 'password': 'zz123456', 'role': Role.PLANTER, 'real_name': '王种植', 'is_super': False},
    {'username': 'baozhuang', 'password': 'bz123456', 'role': Role.PACKAGE_LEAD, 'real_name': '张包装', 'is_super': False},
    {'username': 'xiaoshou2', 'password': 'xs2123456', 'role': Role.SALES_STAFF, 'real_name': '赵内勤', 'is_super': False},
]


class Command(BaseCommand):
    help = '初始化花卉基地售后补发与损耗统计的演示账号和测试数据'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('=== 创建账号与员工档案 ===')
        users = {}
        for info in EMPLOYEES:
            u, created = User.objects.get_or_create(
                username=info['username'],
                defaults={'is_superuser': info['is_super'], 'is_staff': info['is_super']},
            )
            if created:
                u.set_password(info['password'])
                u.save()
                self.stdout.write(self.style.SUCCESS(f'  新建用户: {info["username"]} / {info["password"]} ({info["real_name"]})'))
            else:
                u.set_password(info['password'])
                u.save()
                self.stdout.write(f'  已存在用户: {info["username"]}，已重置密码')
            EmployeeProfile.objects.update_or_create(
                user=u, defaults={'role': info['role'], 'real_name': info['real_name']},
            )
            users[info['username']] = u

        xs_user = users['xiaoshou']
        zz_user = users['zhongzhi']
        bz_user = users['baozhuang']

        self.stdout.write('=== 创建测试售后单1：完整流程（受理→种植接力→催促→包装接力→补发完成）===')
        as1 = AfterSaleOrder.objects.create(
            order_no='AS202606100001DEMO',
            source_order_no='SO20260609A017',
            customer_name='幸福花苑-刘女士',
            customer_phone='138****2211',
            flower_name='卡罗拉红玫瑰',
            quantity=50,
            unit='枝',
            problem_desc='客户反馈收到后发现部分花头挤压变形，要求补发50枝。',
            photos_ref=['/photos/rose_demo1_1.jpg', '/photos/rose_demo1_2.jpg'],
            status=AfterSaleStatus.PENDING,
            current_role=Role.SALES_STAFF,
            current_handler=None,
            created_by=xs_user,
        )
        AfterSaleHistory.objects.create(
            aftersale=as1, action='创建售后单', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售', status_to=AfterSaleStatus.PENDING,
            remark='客户5月10号下单100枝卡罗拉红玫瑰，收到后反馈挤压变形，要求补发50枝。',
        )
        as1.status = AfterSaleStatus.IN_PROGRESS
        as1.current_handler = xs_user
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='受理', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.PENDING, status_to=AfterSaleStatus.IN_PROGRESS,
            remark='已联系客户确认情况，订单属实。转种植员确认是否有货。',
        )
        as1.current_role = Role.PLANTER
        as1.status = AfterSaleStatus.HANDED_OFF
        as1.current_handler = zz_user
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='接力流转', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.IN_PROGRESS, status_to=AfterSaleStatus.HANDED_OFF,
            remark='销售内勤 → 种植员，指定：王种植；请确认卡罗拉红玫瑰可采50枝。',
        )
        send_notify('handoff', f'售后单{as1.order_no}接力到您：卡罗拉红玫瑰50枝，请确认可采情况。',
                    target_role=Role.PLANTER, target_user=zz_user, aftersale=as1)
        as1.status = AfterSaleStatus.URGED
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='有人催', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.HANDED_OFF, status_to=AfterSaleStatus.URGED,
            remark='客户催了，请种植员今天内确认可采数量。',
        )
        as1.status = AfterSaleStatus.HANDED_OFF
        as1.current_role = Role.PACKAGE_LEAD
        as1.current_handler = bz_user
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='接力流转', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_from=AfterSaleStatus.URGED, status_to=AfterSaleStatus.HANDED_OFF,
            remark='种植员 → 包装主管，指定：张包装；今天下午可采A级卡罗拉50枝，6月11日上午发货。',
        )
        send_notify('handoff', f'售后单{as1.order_no}接力到您：卡罗拉红玫瑰50枝，6月11日上午发货。',
                    target_role=Role.PACKAGE_LEAD, target_user=bz_user, aftersale=as1)
        as1.status = AfterSaleStatus.COMPLETED
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='补发完成', action_role=Role.PACKAGE_LEAD,
            operator=bz_user, operator_name='张包装',
            status_from=AfterSaleStatus.HANDED_OFF, status_to=AfterSaleStatus.COMPLETED,
            remark='顺丰SF1234567890已发出，已短信通知客户快递单号。',
        )
        self.stdout.write(self.style.SUCCESS('  已创建售后单 AS202606100001DEMO (已完成)'))

        self.stdout.write('=== 创建测试售后单2：退回 + 补材料状态示例 ===')
        as2 = AfterSaleOrder.objects.create(
            order_no='AS202606100002DEMO',
            source_order_no='SO20260608B033',
            customer_name='玫瑰之约婚庆',
            customer_phone='139****8899',
            flower_name='戴安娜粉玫瑰',
            quantity=30,
            unit='枝',
            problem_desc='婚庆现场反馈粉色玫瑰颜色与样品有色差。',
            photos_ref=['/photos/demo2_1.jpg'],
            status=AfterSaleStatus.MATERIAL_NEEDED,
            current_role=Role.PLANTER,
            current_handler=zz_user,
            created_by=xs_user,
        )
        AfterSaleHistory.objects.create(
            aftersale=as2, action='创建售后单', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售', status_to=AfterSaleStatus.PENDING,
            remark='婚庆用花，客户反馈色差。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as2, action='受理', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.PENDING, status_to=AfterSaleStatus.IN_PROGRESS,
        )
        AfterSaleHistory.objects.create(
            aftersale=as2, action='接力流转', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.IN_PROGRESS, status_to=AfterSaleStatus.HANDED_OFF,
            remark='销售内勤 → 种植员',
        )
        AfterSaleHistory.objects.create(
            aftersale=as2, action='有人退回', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_from=AfterSaleStatus.HANDED_OFF, status_to=AfterSaleStatus.RETURNED,
            remark='未提供客户现场对比照片，无法判断是否为批次色差，请补充材料。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as2, action='有人补材料', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.RETURNED, status_to=AfterSaleStatus.MATERIAL_NEEDED,
            remark='需补充材料：客户现场与留样对比照片、婚庆公司书面说明',
        )
        self.stdout.write(self.style.SUCCESS('  已创建售后单 AS202606100002DEMO (待补材料)'))

        self.stdout.write('=== 创建测试售后单3：转损耗统计（含责任不清场景） ===')
        as3 = AfterSaleOrder.objects.create(
            order_no='AS202606100003DEMO',
            source_order_no='SO20260607C102',
            customer_name='四季鲜花店-陈总',
            customer_phone='137****6677',
            flower_name='洋桔梗(白)',
            quantity=100,
            unit='枝',
            problem_desc='收到花材后发现腐烂严重，怀疑发货时不新鲜或冷链断链，要求补发或赔偿。',
            photos_ref=['/photos/eustoma_rot1.jpg', '/photos/eustoma_rot2.jpg'],
            status=AfterSaleStatus.TO_LOSS,
            current_role=Role.SALES_STAFF,
            current_handler=xs_user,
            has_loss=True,
            created_by=xs_user,
        )
        AfterSaleHistory.objects.create(
            aftersale=as3, action='创建售后单', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售', status_to=AfterSaleStatus.PENDING,
            remark='老客户，信誉良好，反馈严重。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as3, action='受理', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.PENDING, status_to=AfterSaleStatus.IN_PROGRESS,
            remark='已收取照片，初步判断确实腐烂。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as3, action='接力流转', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.IN_PROGRESS, status_to=AfterSaleStatus.HANDED_OFF,
            remark='销售 → 种植，请确认采摘和出库品质。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as3, action='接力流转', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_to=AfterSaleStatus.HANDED_OFF,
            remark='种植 → 包装，洋桔梗采摘当天新鲜度达标，A级出棚记录齐全，请包装主管核查冷链装车记录。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as3, action='有人退回', action_role=Role.PACKAGE_LEAD,
            operator=bz_user, operator_name='张包装',
            status_to=AfterSaleStatus.RETURNED,
            remark='包装环节冷链装箱温度记录正常(4℃)，顺丰冷链签收也正常，怀疑装车前或客户签收后置放过久，责任不清。',
        )
        loss1 = LossRecord.objects.create(
            loss_no='LS202606100001DEMO',
            aftersale=as3,
            flower_name='洋桔梗(白)',
            loss_quantity=100,
            unit='枝',
            loss_reason='花材到达后腐烂，种植、包装、物流各环节记录正常，责任不清',
            loss_amount=350.00,
            responsibility=LossResponsibility.UNCLEAR,
            status=LossStatus.PENDING,
            created_by=xs_user,
        )
        as3.loss_order = loss1
        as3.save()
        AfterSaleHistory.objects.create(
            aftersale=as3, action='转损耗统计', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.RETURNED, status_to=AfterSaleStatus.TO_LOSS,
            remark=f'生成损耗单【{loss1.loss_no}】；当前责任人：李销售；当前环节：销售内勤；三方各执一词，责任不清需上级裁定。',
        )
        LossHistory.objects.create(
            loss=loss1, action='从售后单转入', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_to=LossStatus.PENDING,
            responsibility_to=LossResponsibility.UNCLEAR,
            remark=(f'来源售后单{as3.order_no}；原售后问题：{as3.problem_desc}'
                    f'；原当前环节：销售内勤；原处理人：李销售'
                    f'；说明：种植环节出棚新鲜、包装环节4℃冷链装箱、物流正常，三方均无过错，待责任裁定。'),
        )
        send_role_broadcast(
            'loss', f'损耗单{loss1.loss_no}待责任确认：洋桔梗100枝腐烂，种植/包装/物流记录均正常，请裁定责任。',
            Role.SALES_STAFF, aftersale=as3, loss=loss1,
        )
        self.stdout.write(self.style.SUCCESS(f'  已创建售后单 AS202606100003DEMO + 损耗单 {loss1.loss_no} (责任不清待核)'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('========== 初始化完成 =========='))
        self.stdout.write('登录账号（账号 / 密码 / 角色 / 姓名）：')
        for info in EMPLOYEES:
            role_display = dict(Role.choices)[info['role']]
            self.stdout.write(f'  {info["username"]} / {info["password"]}  [{role_display}]  {info["real_name"]}')
        self.stdout.write('')
        self.stdout.write('Swagger 文档地址: http://127.0.0.1:8000/api/docs')
