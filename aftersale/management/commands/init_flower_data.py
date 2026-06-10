from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction

from aftersale.models import (
    EmployeeProfile, Role, ROLE_HANDOFF_ORDER,
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

        role_display = dict(Role.choices)

        # ============================================================
        # 演示单1：完整三棒接力（种植员→销售内勤→包装主管）+ 催促 + 补发完成
        # ============================================================
        self.stdout.write('=== 演示单1：完整流程（催促→种植受理→销售接力→包装接力→补发完成） ===')
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
            current_role=Role.PLANTER,
            current_handler=None,
            created_by=xs_user,
        )
        AfterSaleHistory.objects.create(
            aftersale=as1, action='创建售后单', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售', status_to=AfterSaleStatus.PENDING,
            remark='销售内勤创建售后单，派单至种植员环节；品种：卡罗拉红玫瑰，数量：50枝；问题：客户反馈花头挤压变形，要求补发。',
        )
        send_role_broadcast(
            'urge', f'新售后单AS202606100001DEMO待种植员受理：卡罗拉红玫瑰 50枝，请核查品质与可补发量',
            Role.PLANTER, aftersale=as1,
        )
        # 销售内勤催促（种植员还没受理）
        as1.status = AfterSaleStatus.URGED
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='有人催', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.PENDING, status_to=AfterSaleStatus.URGED,
            remark='客户催得急，请种植员今天上午前确认是否有货可补发。',
        )
        send_role_broadcast(
            'urge', f'售后单AS202606100001DEMO被催：客户催得急，请尽快确认可补发量。',
            Role.PLANTER, aftersale=as1,
        )
        # 种植员受理
        as1.status = AfterSaleStatus.IN_PROGRESS
        as1.current_handler = zz_user
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='受理', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_from=AfterSaleStatus.URGED, status_to=AfterSaleStatus.IN_PROGRESS,
            remark='种植员已受理，正在核查卡罗拉红玫瑰可采数量与品质。',
        )
        # 种植员接力 → 销售内勤
        as1.status = AfterSaleStatus.HANDED_OFF
        as1.current_role = Role.SALES_STAFF
        as1.current_handler = xs_user
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='接力流转', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_from=AfterSaleStatus.IN_PROGRESS, status_to=AfterSaleStatus.HANDED_OFF,
            remark='种植员 → 销售内勤，指定：李销售；A级卡罗拉可采50枝，今日下午出棚，请销售与客户确认补发时间。',
        )
        send_notify(
            'handoff', f'售后单{as1.order_no}接力到您：卡罗拉红玫瑰50枝可采，请与客户确认补发时间。',
            target_role=Role.SALES_STAFF, target_user=xs_user, aftersale=as1,
        )
        # 销售内勤接力 → 包装主管
        as1.current_role = Role.PACKAGE_LEAD
        as1.current_handler = bz_user
        as1.status = AfterSaleStatus.HANDED_OFF
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='接力流转', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.HANDED_OFF, status_to=AfterSaleStatus.HANDED_OFF,
            remark='销售内勤 → 包装主管，指定：张包装；已与客户确认6月11日上午发顺丰冷链，请安排包装发货。',
        )
        send_notify(
            'handoff', f'售后单{as1.order_no}接力到您：卡罗拉红玫瑰50枝，6月11日上午发顺丰冷链。',
            target_role=Role.PACKAGE_LEAD, target_user=bz_user, aftersale=as1,
        )
        # 包装主管补发完成
        as1.status = AfterSaleStatus.COMPLETED
        as1.save()
        AfterSaleHistory.objects.create(
            aftersale=as1, action='补发完成', action_role=Role.PACKAGE_LEAD,
            operator=bz_user, operator_name='张包装',
            status_from=AfterSaleStatus.HANDED_OFF, status_to=AfterSaleStatus.COMPLETED,
            remark='顺丰SF1234567890已发出，已短信通知客户快递单号，预计次日达。',
        )
        self.stdout.write(self.style.SUCCESS('  已创建售后单 AS202606100001DEMO (已完成，三棒接力全链路)'))

        # ============================================================
        # 演示单2：退回 + 补材料状态
        # ============================================================
        self.stdout.write('=== 演示单2：补材料 + 退回 状态示例 ===')
        as2 = AfterSaleOrder.objects.create(
            order_no='AS202606100002DEMO',
            source_order_no='SO20260608B033',
            customer_name='玫瑰之约婚庆',
            customer_phone='139****8899',
            flower_name='戴安娜粉玫瑰',
            quantity=30,
            unit='枝',
            problem_desc='婚庆现场反馈粉色玫瑰颜色与样品有色差，客户要求解释或补发。',
            photos_ref=['/photos/demo2_1.jpg'],
            status=AfterSaleStatus.MATERIAL_NEEDED,
            current_role=Role.PLANTER,
            current_handler=zz_user,
            created_by=xs_user,
        )
        AfterSaleHistory.objects.create(
            aftersale=as2, action='创建售后单', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售', status_to=AfterSaleStatus.PENDING,
            remark='销售内勤创建售后单，派单至种植员环节；婚庆用花，客户反馈色差。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as2, action='受理', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_from=AfterSaleStatus.PENDING, status_to=AfterSaleStatus.IN_PROGRESS,
            remark='种植员已受理，核查当批次戴安娜粉玫瑰出棚记录。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as2, action='有人补材料', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_from=AfterSaleStatus.IN_PROGRESS, status_to=AfterSaleStatus.MATERIAL_NEEDED,
            remark='仅一张照片无法判断批次色差。需补充材料：客户现场与留样对比照片、婚庆公司书面说明；请销售内勤向客户索取。',
        )
        send_role_broadcast(
            'material',
            f'售后单{as2.order_no}需补材料：客户现场对比照片、婚庆公司书面说明，请销售向客户索取。',
            Role.SALES_STAFF, aftersale=as2,
        )
        self.stdout.write(self.style.SUCCESS('  已创建售后单 AS202606100002DEMO (种植员要求补材料，待销售内勤向客户索取)'))

        # ============================================================
        # 演示单3：三棒都走完 → 责任不清 → 转损耗统计
        # ============================================================
        self.stdout.write('=== 演示单3：三棒流转后责任不清 → 转损耗统计 ===')
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
        # 第1棒：种植员
        AfterSaleHistory.objects.create(
            aftersale=as3, action='创建售后单', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售', status_to=AfterSaleStatus.PENDING,
            remark='销售内勤创建售后单，派单至种植员环节；老客户反馈花材腐烂，信誉良好，需优先处理。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as3, action='受理', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_from=AfterSaleStatus.PENDING, status_to=AfterSaleStatus.IN_PROGRESS,
            remark='种植员已受理，核查出棚记录：当日A级洋桔梗，新鲜度达标，采摘后2小时内入冷库。',
        )
        AfterSaleHistory.objects.create(
            aftersale=as3, action='接力流转', action_role=Role.PLANTER,
            operator=zz_user, operator_name='王种植',
            status_from=AfterSaleStatus.IN_PROGRESS, status_to=AfterSaleStatus.HANDED_OFF,
            remark='种植员 → 销售内勤；种植环节品质无异常，出棚记录齐全，请销售核查订单与客户签收情况。',
        )
        # 第2棒：销售内勤
        AfterSaleHistory.objects.create(
            aftersale=as3, action='接力流转', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.HANDED_OFF, status_to=AfterSaleStatus.HANDED_OFF,
            remark='销售内勤 → 包装主管；订单品种数量正确，地址无误，客户正常签收；请包装核查冷链装箱记录。',
        )
        # 第3棒：包装主管 → 退回
        AfterSaleHistory.objects.create(
            aftersale=as3, action='有人退回', action_role=Role.PACKAGE_LEAD,
            operator=bz_user, operator_name='张包装',
            status_from=AfterSaleStatus.HANDED_OFF, status_to=AfterSaleStatus.RETURNED,
            remark='包装退回销售：装箱温度4℃、冷链冰袋足量、顺丰冷链签收记录正常，怀疑装车前或客户签收后置放过久，责任不清。',
        )
        # 销售内勤退回种植员
        try:
            as3.current_role = Role.PLANTER
        except Exception:
            pass
        as3.save()
        AfterSaleHistory.objects.create(
            aftersale=as3, action='有人退回', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.RETURNED, status_to=AfterSaleStatus.RETURNED,
            remark='销售退回种植：订单与客户沟通环节无异常，客户为老客户信誉良好，请种植再核查采摘与预冷环节。',
        )
        # 三方都不认，转损耗统计（由销售内勤发起，当前角色回到销售便于协调）
        as3.current_role = Role.SALES_STAFF
        as3.current_handler = xs_user
        as3.status = AfterSaleStatus.TO_LOSS
        as3.has_loss = True
        as3.save()

        loss1 = LossRecord.objects.create(
            loss_no='LS202606100001DEMO',
            aftersale=as3,
            flower_name='洋桔梗(白)',
            loss_quantity=100,
            unit='枝',
            loss_reason='花材到达后腐烂，种植出棚正常、销售订单正常、包装冷链正常，三方均无过错，责任不清待裁定',
            loss_amount=350.00,
            responsibility=LossResponsibility.UNCLEAR,
            status=LossStatus.PENDING,
            created_by=xs_user,
            extra={
                'inherited_from_aftersale': {
                    'order_no': as3.order_no,
                    'current_handler_id': as3.current_handler_id,
                    'current_role': as3.current_role,
                    'created_by_id': as3.created_by_id,
                    'history_count': 7,
                }
            }
        )
        as3.loss_order = loss1
        as3.save()

        AfterSaleHistory.objects.create(
            aftersale=as3, action='转损耗统计', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_from=AfterSaleStatus.RETURNED, status_to=AfterSaleStatus.TO_LOSS,
            remark=(f'生成损耗单【{loss1.loss_no}】；当前责任人：李销售；当前环节：销售内勤；'
                    f'种植/销售/包装三方各执一词，均无过错记录，责任不清，需上级裁定损失承担方。'),
        )
        LossHistory.objects.create(
            loss=loss1, action='从售后单转入', action_role=Role.SALES_STAFF,
            operator=xs_user, operator_name='李销售',
            status_to=LossStatus.PENDING,
            responsibility_to=LossResponsibility.UNCLEAR,
            remark=(f'来源售后单{as3.order_no}；原售后问题：{as3.problem_desc}'
                    f'；三棒接力链：种植员(王种植)→销售内勤(李销售)→包装主管(张包装)'
                    f'；种植环节：A级出棚、2小时入冷库，无异常'
                    f'；销售环节：订单正确、客户信誉良好，无异常'
                    f'；包装环节：4℃冷链装箱、顺丰冷链签收正常，无异常'
                    f'；结论：三方均无过错，责任不清待裁定'),
        )
        send_role_broadcast(
            'loss',
            f'损耗单{loss1.loss_no}待责任确认：洋桔梗100枝腐烂，种植/销售/包装记录均正常，请上级裁定责任归属。',
            Role.SALES_STAFF, aftersale=as3, loss=loss1,
        )
        self.stdout.write(self.style.SUCCESS(
            f'  已创建售后单 AS202606100003DEMO + 损耗单 {loss1.loss_no} (三棒完整流转后责任不清待核)'
        ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('========== 初始化完成 =========='))
        self.stdout.write('接力顺序：种植员 → 销售内勤 → 包装主管')
        self.stdout.write('')
        self.stdout.write('登录账号（账号 / 密码 / 角色 / 姓名）：')
        for info in EMPLOYEES:
            rd = role_display.get(info['role'], info['role'])
            self.stdout.write(f'  {info["username"]} / {info["password"]}  [{rd}]  {info["real_name"]}')
        self.stdout.write('')
        self.stdout.write('Swagger 文档地址: http://127.0.0.1:8000/api/docs')
