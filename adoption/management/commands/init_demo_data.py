from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from adoption.models import (
    Staff, Animal, AdoptionApplication, ApplicationTimeline,
    HomeVisitRecord, FollowUpRecord, MedicalRecord,
    Role, AnimalStatus, AdoptionStatus, VisitResult
)


class Command(BaseCommand):
    help = '初始化演示数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化演示数据...')

        self.create_staff()
        self.create_animals()
        self.create_normal_applications()
        self.create_abnormal_applications()
        self.create_medical_records()
        self.create_completed_application()

        self.stdout.write(self.style.SUCCESS('演示数据初始化完成！'))

    def create_staff(self):
        self.stdout.write('创建工作人员...')
        staff_data = [
            {'username': 'volunteer1', 'name': '张志愿', 'role': Role.VOLUNTEER, 'phone': '13800138001'},
            {'username': 'vet1', 'name': '李兽医', 'role': Role.VET, 'phone': '13800138002'},
            {'username': 'auditor1', 'name': '王审核', 'role': Role.ADOPTION_AUDITOR, 'phone': '13800138003'},
            {'username': 'visitor1', 'name': '赵家访', 'role': Role.HOME_VISITOR, 'phone': '13800138004'},
            {'username': 'admin1', 'name': '孙管理', 'role': Role.ADMIN, 'phone': '13800138005'},
            {'username': 'auditor2', 'name': '钱复核', 'role': Role.ADOPTION_AUDITOR, 'phone': '13800138006'},
        ]

        for data in staff_data:
            user, _ = User.objects.get_or_create(
                username=data['username'],
                defaults={'is_staff': True, 'is_superuser': (data['role'] == Role.ADMIN)}
            )
            Staff.objects.get_or_create(
                user=user,
                defaults={
                    'name': data['name'],
                    'role': data['role'],
                    'phone': data['phone']
                }
            )

    def create_animals(self):
        self.stdout.write('创建救助动物...')
        volunteer = Staff.objects.filter(role=Role.VOLUNTEER).first()
        vet = Staff.objects.filter(role=Role.VET).first()

        animals_data = [
            {
                'name': '小黄', 'species': '狗', 'breed': '中华田园犬',
                'age_months': 12, 'gender': 'male', 'color': '黄色',
                'status': AnimalStatus.AVAILABLE,
                'rescue_date': (timezone.now() - timedelta(days=60)).date(),
                'rescue_location': '朝阳区公园',
                'health_condition': '已绝育，已驱虫，疫苗齐全',
                'medical_cost': 800,
                'description': '性格温顺，亲人，喜欢散步'
            },
            {
                'name': '花花', 'species': '猫', 'breed': '橘猫',
                'age_months': 8, 'gender': 'female', 'color': '橘白',
                'status': AnimalStatus.AVAILABLE,
                'rescue_date': (timezone.now() - timedelta(days=45)).date(),
                'rescue_location': '海淀区小区',
                'health_condition': '已驱虫，疫苗三针已打两针',
                'medical_cost': 500,
                'description': '活泼好动，喜欢玩逗猫棒'
            },
            {
                'name': '黑豆', 'species': '狗', 'breed': '拉布拉多串',
                'age_months': 24, 'gender': 'male', 'color': '黑色',
                'status': AnimalStatus.FOSTERED,
                'rescue_date': (timezone.now() - timedelta(days=90)).date(),
                'rescue_location': '丰台区路边',
                'health_condition': '健康，已绝育',
                'medical_cost': 1200,
                'foster_family': '刘女士家',
                'description': '聪明，训练有素，会基本指令'
            },
            {
                'name': '小白', 'species': '猫', 'breed': '英短串',
                'age_months': 6, 'gender': 'female', 'color': '白色',
                'status': AnimalStatus.IN_TREATMENT,
                'rescue_date': (timezone.now() - timedelta(days=10)).date(),
                'rescue_location': '西城区胡同',
                'health_condition': '猫瘟治疗中，恢复良好',
                'medical_cost': 3500,
                'description': '安静粘人，需要悉心照顾中'
            },
            {
                'name': '旺财', 'species': '狗', 'breed': '柯基串',
                'age_months': 18, 'gender': 'male', 'color': '三色',
                'status': AnimalStatus.ADOPTION_PROCESSING,
                'rescue_date': (timezone.now() - timedelta(days=120)).date(),
                'rescue_location': '通州区工地',
                'health_condition': '健康，已绝育疫苗齐',
                'medical_cost': 950,
                'description': '热情活泼，喜欢和人亲近'
            },
        ]

        for data in animals_data:
            Animal.objects.get_or_create(
                name=data['name'],
                defaults={
                    **data,
                    'rescue_volunteer': volunteer,
                    'vet': vet
                }
            )

    def create_normal_applications(self):
        self.stdout.write('创建正常流程申请...')
        auditor = Staff.objects.get(role=Role.ADOPTION_AUDITOR, user__username='auditor1')
        visitor = Staff.objects.filter(role=Role.HOME_VISITOR).first()

        animals = Animal.objects.filter(status=AnimalStatus.AVAILABLE)[:2]
        if animals.count() < 2:
            animals = Animal.objects.all()[:2]

        app1 = AdoptionApplication.objects.create(
            idempotency_key='demo-normal-001',
            animal=animals[0],
            applicant_name='陈申请人',
            applicant_phone='13900139001',
            applicant_id_card='110101199001011234',
            address='北京市朝阳区某某小区3号楼2单元501',
            housing_type='apartment',
            has_pet_experience=True,
            current_pets='之前养过一只猫，寿终正寝',
            family_members=3,
            has_children=False,
            work_situation='互联网公司，朝九晚五',
            monthly_income='20000',
            reason_for_adoption='一直喜欢小动物，有稳定住所和收入，希望给流浪动物一个温暖的家',
            status=AdoptionStatus.HOME_VISIT_SCHEDULED,
            current_handler=visitor,
            pre_reviewer=auditor,
            home_visitor=visitor,
            submitted_at=timezone.now() - timedelta(days=5),
            deadline_at=timezone.now() + timedelta(days=2)
        )

        ApplicationTimeline.objects.create(
            application=app1,
            action='提交领养申请',
            status_from='',
            status_to=AdoptionStatus.SUBMITTED,
            operator=auditor,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='申请已提交'
        )
        ApplicationTimeline.objects.create(
            application=app1,
            action='确认材料已收到',
            status_from=AdoptionStatus.SUBMITTED,
            status_to=AdoptionStatus.MATERIALS_RECEIVED,
            operator=auditor,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='身份证、工作证明、房产证明齐全'
        )
        ApplicationTimeline.objects.create(
            application=app1,
            action='初审通过',
            status_from=AdoptionStatus.MATERIALS_RECEIVED,
            status_to=AdoptionStatus.PRE_REVIEW_PASS,
            operator=auditor,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='条件符合，安排家访'
        )
        ApplicationTimeline.objects.create(
            application=app1,
            action=f'安排家访: {visitor.name}',
            status_from=AdoptionStatus.PRE_REVIEW_PASS,
            status_to=AdoptionStatus.HOME_VISIT_SCHEDULED,
            operator=auditor,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='预计后天下午家访'
        )

        HomeVisitRecord.objects.create(
            application=app1,
            visitor=visitor,
            scheduled_at=timezone.now() + timedelta(days=2)
        )

    def create_abnormal_applications(self):
        self.stdout.write('创建异常申请单（缺材料、超时、复核不通过）...')
        auditor1 = Staff.objects.get(role=Role.ADOPTION_AUDITOR, user__username='auditor1')
        auditor2 = Staff.objects.get(role=Role.ADOPTION_AUDITOR, user__username='auditor2')
        visitor = Staff.objects.filter(role=Role.HOME_VISITOR).first()
        animals = Animal.objects.all()

        app_missing = AdoptionApplication.objects.create(
            idempotency_key='demo-abnormal-missing-001',
            animal=animals[2] if animals.count() > 2 else animals[0],
            applicant_name='刘某某',
            applicant_phone='13900139002',
            applicant_id_card='',
            address='北京市海淀区某某小区',
            housing_type='apartment',
            has_pet_experience=False,
            current_pets='',
            family_members=2,
            has_children=True,
            work_situation='自由职业',
            monthly_income='15000',
            reason_for_adoption='孩子喜欢小动物，想培养孩子的责任心',
            status=AdoptionStatus.MATERIALS_MISSING,
            current_handler=auditor1,
            pre_reviewer=auditor1,
            submitted_at=timezone.now() - timedelta(days=8),
            deadline_at=timezone.now() - timedelta(days=1),
            remark='缺少身份证复印件和房产证明'
        )
        ApplicationTimeline.objects.create(
            application=app_missing,
            action='提交领养申请',
            status_from='',
            status_to=AdoptionStatus.SUBMITTED,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='申请已提交'
        )
        ApplicationTimeline.objects.create(
            application=app_missing,
            action='标记材料缺失',
            status_from=AdoptionStatus.SUBMITTED,
            status_to=AdoptionStatus.MATERIALS_MISSING,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='缺少身份证复印件、房产证明、收入证明，请于7日内补齐'
        )

        app_timeout = AdoptionApplication.objects.create(
            idempotency_key='demo-abnormal-timeout-001',
            animal=animals[3] if animals.count() > 3 else animals[1],
            applicant_name='周某某',
            applicant_phone='13900139003',
            applicant_id_card='110101198501015678',
            address='北京市丰台区某某家园',
            housing_type='house',
            has_pet_experience=True,
            current_pets='有一只金毛，已养5年',
            family_members=4,
            has_children=True,
            work_situation='国企员工，稳定',
            monthly_income='25000',
            reason_for_adoption='家里有院子，想给孩子再找个伴',
            status=AdoptionStatus.HOME_VISIT_SCHEDULED,
            current_handler=visitor,
            pre_reviewer=auditor1,
            home_visitor=visitor,
            submitted_at=timezone.now() - timedelta(days=15),
            deadline_at=timezone.now() - timedelta(days=5),
            remark='家访安排后申请人一直未联系上'
        )
        ApplicationTimeline.objects.create(
            application=app_timeout,
            action='提交领养申请',
            status_from='',
            status_to=AdoptionStatus.SUBMITTED,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='申请已提交'
        )
        ApplicationTimeline.objects.create(
            application=app_timeout,
            action='确认材料已收到',
            status_from=AdoptionStatus.SUBMITTED,
            status_to=AdoptionStatus.MATERIALS_RECEIVED,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='材料齐全'
        )
        ApplicationTimeline.objects.create(
            application=app_timeout,
            action='初审通过',
            status_from=AdoptionStatus.MATERIALS_RECEIVED,
            status_to=AdoptionStatus.PRE_REVIEW_PASS,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='条件很好，安排家访'
        )
        ApplicationTimeline.objects.create(
            application=app_timeout,
            action=f'安排家访: {visitor.name}',
            status_from=AdoptionStatus.PRE_REVIEW_PASS,
            status_to=AdoptionStatus.HOME_VISIT_SCHEDULED,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='已约定时间，但后续联系不上申请人'
        )
        HomeVisitRecord.objects.create(
            application=app_timeout,
            visitor=visitor,
            scheduled_at=timezone.now() - timedelta(days=8)
        )

        app_recheck_fail = AdoptionApplication.objects.create(
            idempotency_key='demo-abnormal-recheck-001',
            animal=animals[4] if animals.count() > 4 else animals[0],
            applicant_name='吴某某',
            applicant_phone='13900139004',
            applicant_id_card='110101199201019012',
            address='北京市通州区某某公寓',
            housing_type='apartment',
            has_pet_experience=False,
            current_pets='',
            family_members=1,
            has_children=False,
            work_situation='程序员，经常加班',
            monthly_income='30000',
            reason_for_adoption='一个人住太孤单，想有个伴',
            status=AdoptionStatus.RECHECK_REJECT,
            current_handler=auditor2,
            pre_reviewer=auditor1,
            home_visitor=visitor,
            rechecker=auditor2,
            submitted_at=timezone.now() - timedelta(days=20),
            deadline_at=timezone.now() - timedelta(days=10)
        )
        ApplicationTimeline.objects.create(
            application=app_recheck_fail,
            action='提交领养申请',
            status_from='',
            status_to=AdoptionStatus.SUBMITTED,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='申请已提交'
        )
        ApplicationTimeline.objects.create(
            application=app_recheck_fail,
            action='确认材料已收到',
            status_from=AdoptionStatus.SUBMITTED,
            status_to=AdoptionStatus.MATERIALS_RECEIVED,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='材料齐全'
        )
        ApplicationTimeline.objects.create(
            application=app_recheck_fail,
            action='初审通过',
            status_from=AdoptionStatus.MATERIALS_RECEIVED,
            status_to=AdoptionStatus.PRE_REVIEW_PASS,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='收入稳定，通过初审'
        )
        ApplicationTimeline.objects.create(
            application=app_recheck_fail,
            action=f'安排家访: {visitor.name}',
            status_from=AdoptionStatus.PRE_REVIEW_PASS,
            status_to=AdoptionStatus.HOME_VISIT_SCHEDULED,
            operator=auditor1,
            operator_role=Role.ADOPTION_AUDITOR,
            remark=''
        )
        ApplicationTimeline.objects.create(
            application=app_recheck_fail,
            action='家访通过，需复核',
            status_from=AdoptionStatus.HOME_VISIT_SCHEDULED,
            status_to=AdoptionStatus.RECHECK_REQUIRED,
            operator=visitor,
            operator_role=Role.HOME_VISITOR,
            remark='家访整体还行，但申请人经常加班，担心照顾时间不足，需要复核'
        )
        ApplicationTimeline.objects.create(
            application=app_recheck_fail,
            action='复核不通过',
            status_from=AdoptionStatus.RECHECK_REQUIRED,
            status_to=AdoptionStatus.RECHECK_REJECT,
            operator=auditor2,
            operator_role=Role.ADOPTION_AUDITOR,
            remark='经复核：申请人工作时间过长，每天独处时间超过12小时，不适合养幼犬，建议领养成年猫或考虑清楚后再申请'
        )

        hv = HomeVisitRecord.objects.create(
            application=app_recheck_fail,
            visitor=visitor,
            scheduled_at=timezone.now() - timedelta(days=15),
            visited_at=timezone.now() - timedelta(days=14),
            completed_at=timezone.now() - timedelta(days=14),
            result=VisitResult.PASS,
            environment_score=7,
            experience_score=4,
            attitude_score=8,
            total_score=6,
            environment_description='居住环境整洁，有封窗，基本设施齐全',
            family_communication='一个人住，家人不在身边',
            pet_knowledge='了解一些基本养宠知识，但缺乏实际经验',
            concerns='工作太忙，经常加班到很晚，担心陪伴时间不足',
            suggestions='建议考虑领养成年、独立性强的猫',
            recheck_required=True,
            recheck_reason='照顾时间是否充足存疑'
        )

        self.stdout.write(self.style.SUCCESS('  已创建3个异常申请单'))

    def create_medical_records(self):
        self.stdout.write('创建医疗记录...')
        vet = Staff.objects.filter(role=Role.VET).first()
        animals = Animal.objects.all()

        medical_data = [
            {
                'animal': animals[0],
                'visit_date': (timezone.now() - timedelta(days=58)).date(),
                'diagnosis': '常规体检，健康状况良好',
                'treatment': '驱虫',
                'medication': '体内外驱虫药',
                'cost': 200
            },
            {
                'animal': animals[0],
                'visit_date': (timezone.now() - timedelta(days=55)).date(),
                'diagnosis': '疫苗接种',
                'treatment': '狂犬疫苗+多联疫苗',
                'medication': '疫苗',
                'cost': 300
            },
            {
                'animal': animals[0],
                'visit_date': (timezone.now() - timedelta(days=50)).date(),
                'diagnosis': '绝育手术',
                'treatment': '公犬去势手术',
                'medication': '消炎药、止痛药',
                'cost': 300
            },
            {
                'animal': animals[3],
                'visit_date': (timezone.now() - timedelta(days=9)).date(),
                'diagnosis': '猫瘟病毒检测阳性，伴有呕吐腹泻',
                'treatment': '抗病毒治疗、补液、止吐止泻',
                'medication': '干扰素、单抗、电解质液',
                'cost': 1500
            },
            {
                'animal': animals[3],
                'visit_date': (timezone.now() - timedelta(days=6)).date(),
                'diagnosis': '猫瘟治疗复查，精神好转',
                'treatment': '继续治疗，加强营养支持',
                'medication': '继续用药+处方粮',
                'cost': 1200
            },
            {
                'animal': animals[3],
                'visit_date': (timezone.now() - timedelta(days=3)).date(),
                'diagnosis': '猫瘟康复期复查，各项指标正常',
                'treatment': '出院，继续在家调养',
                'medication': '益生菌、营养膏',
                'cost': 800
            },
        ]

        for data in medical_data:
            MedicalRecord.objects.create(
                animal=data['animal'],
                vet=vet,
                visit_date=data['visit_date'],
                diagnosis=data['diagnosis'],
                treatment=data['treatment'],
                medication=data['medication'],
                cost=data['cost']
            )

    def create_completed_application(self):
        self.stdout.write('创建已完成的领养申请（完整闭环示例）...')
        auditor = Staff.objects.filter(role=Role.ADOPTION_AUDITOR, user__username='auditor1').first()
        visitor = Staff.objects.filter(role=Role.HOME_VISITOR).first()
        volunteer = Staff.objects.filter(role=Role.VOLUNTEER).first()
        vet = Staff.objects.filter(role=Role.VET).first()

        animal = Animal.objects.create(
            name='福宝',
            species='猫',
            breed='狸花猫',
            age_months=36,
            gender='female',
            color='虎斑',
            status=AnimalStatus.ADOPTED,
            rescue_date=(timezone.now() - timedelta(days=180)).date(),
            rescue_location='东城区地铁站',
            rescue_volunteer=volunteer,
            vet=vet,
            health_condition='已绝育，已驱虫，疫苗齐全，健康',
            medical_cost=650,
            foster_family='寄养在王阿姨家2个月',
            description='温柔粘人，喜欢蹭人，会用猫砂'
        )

        MedicalRecord.objects.create(
            animal=animal,
            vet=vet,
            visit_date=(timezone.now() - timedelta(days=175)).date(),
            diagnosis='体检+驱虫',
            treatment='常规处理',
            medication='驱虫药',
            cost=150
        )
        MedicalRecord.objects.create(
            animal=animal,
            vet=vet,
            visit_date=(timezone.now() - timedelta(days=170)).date(),
            diagnosis='疫苗接种',
            treatment='猫三联',
            medication='疫苗',
            cost=200
        )
        MedicalRecord.objects.create(
            animal=animal,
            vet=vet,
            visit_date=(timezone.now() - timedelta(days=160)).date(),
            diagnosis='绝育手术',
            treatment='母猫绝育',
            medication='消炎药',
            cost=300
        )

        app = AdoptionApplication.objects.create(
            idempotency_key='demo-completed-001',
            animal=animal,
            applicant_name='郑幸福',
            applicant_phone='13900139005',
            applicant_id_card='110101198801014321',
            address='北京市朝阳区某某花园5号楼3单元101',
            housing_type='house',
            has_pet_experience=True,
            current_pets='之前养过两只猫，均已寿终',
            family_members=2,
            has_children=False,
            work_situation='大学老师，时间自由',
            monthly_income='18000',
            reason_for_adoption='一直喜欢猫，家里有独立阳台，想给猫咪一个温暖的家',
            status=AdoptionStatus.ADOPTION_COMPLETED,
            current_handler=auditor,
            pre_reviewer=auditor,
            home_visitor=visitor,
            rechecker=auditor,
            submitted_at=timezone.now() - timedelta(days=100),
            deadline_at=None,
            remark='领养流程已全部完成，回访正常'
        )

        ApplicationTimeline.objects.create(application=app, action='提交领养申请', status_from='', status_to=AdoptionStatus.SUBMITTED, operator=auditor, operator_role=Role.ADOPTION_AUDITOR, remark='申请已提交')
        ApplicationTimeline.objects.create(application=app, action='直接确认材料齐全', status_from=AdoptionStatus.SUBMITTED, status_to=AdoptionStatus.MATERIALS_RECEIVED, operator=auditor, operator_role=Role.ADOPTION_AUDITOR, remark='材料齐全，申请人条件优秀')
        ApplicationTimeline.objects.create(application=app, action='初审通过', status_from=AdoptionStatus.MATERIALS_RECEIVED, status_to=AdoptionStatus.PRE_REVIEW_PASS, operator=auditor, operator_role=Role.ADOPTION_AUDITOR, remark='完全符合领养条件')
        ApplicationTimeline.objects.create(application=app, action=f'安排家访: {visitor.name}', status_from=AdoptionStatus.PRE_REVIEW_PASS, status_to=AdoptionStatus.HOME_VISIT_SCHEDULED, operator=auditor, operator_role=Role.ADOPTION_AUDITOR, remark='周末家访')
        ApplicationTimeline.objects.create(application=app, action='家访通过', status_from=AdoptionStatus.HOME_VISIT_SCHEDULED, status_to=AdoptionStatus.HOME_VISIT_PASS, operator=visitor, operator_role=Role.HOME_VISITOR, remark='居住环境好，有养猫经验，非常适合')
        ApplicationTimeline.objects.create(application=app, action='审核通过', status_from=AdoptionStatus.HOME_VISIT_PASS, status_to=AdoptionStatus.APPROVED, operator=auditor, operator_role=Role.ADOPTION_AUDITOR, remark='审核通过，可以接猫')
        ApplicationTimeline.objects.create(application=app, action='领养完成', status_from=AdoptionStatus.APPROVED, status_to=AdoptionStatus.ADOPTION_COMPLETED, operator=auditor, operator_role=Role.ADOPTION_AUDITOR, remark='已签署领养协议，猫咪已入住新家')

        HomeVisitRecord.objects.create(
            application=app,
            visitor=visitor,
            scheduled_at=timezone.now() - timedelta(days=95),
            visited_at=timezone.now() - timedelta(days=94),
            completed_at=timezone.now() - timedelta(days=94),
            result=VisitResult.PASS,
            environment_score=9,
            experience_score=10,
            attitude_score=10,
            total_score=10,
            environment_description='独栋房屋，有封窗的独立阳台，猫爬架、猫窝、猫砂盆齐全',
            family_communication='夫妻二人都支持养猫，家人意见一致',
            pet_knowledge='非常了解养猫知识，之前养过多年猫',
            concerns='无',
            suggestions='继续保持',
            recheck_required=False
        )

        FollowUpRecord.objects.create(
            application=app,
            follow_up_date=(timezone.now() - timedelta(days=85)).date(),
            follow_up_type='week1',
            operator=volunteer,
            animal_health='健康，精神好',
            adaptation='适应良好，第二天就开始到处探索了',
            problems='无',
            suggestions='继续观察，按时喂粮',
            next_follow_up_at=(timezone.now() - timedelta(days=70)).date()
        )
        FollowUpRecord.objects.create(
            application=app,
            follow_up_date=(timezone.now() - timedelta(days=68)).date(),
            follow_up_type='month1',
            operator=volunteer,
            animal_health='非常健康，胖了0.5斤',
            adaptation='完全适应，和家人很亲',
            problems='无',
            suggestions='建议做驱虫',
            next_follow_up_at=(timezone.now() - timedelta(days=10)).date()
        )

        fu_gap = FollowUpRecord.objects.create(
            application=app,
            follow_up_date=(timezone.now() - timedelta(days=8)).date(),
            follow_up_type='month3',
            operator=None,
            animal_health='',
            adaptation='',
            problems='',
            suggestions='',
            next_follow_up_at=None,
            is_gap=True,
            gap_reason='申请人电话未接通，微信未回，回访断档，需持续跟进'
        )
        ApplicationTimeline.objects.create(
            application=app,
            action='标记回访断档',
            status_from=AdoptionStatus.ADOPTION_COMPLETED,
            status_to=AdoptionStatus.ADOPTION_COMPLETED,
            operator=volunteer,
            operator_role=Role.VOLUNTEER,
            remark='三月回访联系不上申请人，标记断档'
        )

        self.stdout.write(self.style.SUCCESS('  已创建完整闭环示例（含回访断档）'))
