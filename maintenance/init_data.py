import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maintenance.settings')
django.setup()

from django.contrib.auth.models import User
from parts.models import Customer, SiteSurvey, SurveyItem, Quotation, QuotationItem, HistoryRecord
from datetime import datetime, timedelta
from django.utils import timezone

def create_users():
    users = [
        {'username': 'admin', 'password': 'admin123', 'is_superuser': True, 'is_staff': True},
        {'username': 'project', 'password': 'project123', 'is_staff': True},
        {'username': 'technician', 'password': 'tech123', 'is_staff': True},
        {'username': 'installer', 'password': 'install123', 'is_staff': True},
    ]
    
    for user_data in users:
        if not User.objects.filter(username=user_data['username']).exists():
            user = User.objects.create_user(
                username=user_data['username'],
                password=user_data['password'],
                is_superuser=user_data.get('is_superuser', False),
                is_staff=user_data.get('is_staff', False)
            )
            print(f"Created user: {user.username}")

def create_customers():
    customers = [
        {'name': '上海万达广场', 'contact': '王经理', 'phone': '13800138001', 'address': '上海市浦东新区张江高科技园区'},
        {'name': '北京银泰中心', 'contact': '李总监', 'phone': '13800138002', 'address': '北京市朝阳区建国门外大街'},
        {'name': '深圳华润万象城', 'contact': '张总', 'phone': '13800138003', 'address': '深圳市罗湖区宝安南路'},
        {'name': '杭州银泰城', 'contact': '陈经理', 'phone': '13800138004', 'address': '杭州市拱墅区延安路'},
    ]
    
    for customer_data in customers:
        if not Customer.objects.filter(name=customer_data['name']).exists():
            customer = Customer.objects.create(**customer_data)
            print(f"Created customer: {customer.name}")

def create_sample_data():
    admin = User.objects.get(username='admin')
    technician = User.objects.get(username='technician')
    
    sh_wanda = Customer.objects.get(name='上海万达广场')
    bj_yintai = Customer.objects.get(name='北京银泰中心')
    sz_huarun = Customer.objects.get(name='深圳华润万象城')
    
    survey1 = SiteSurvey.objects.create(
        customer=sh_wanda,
        survey_no='KC202401150001',
        survey_date=timezone.now() - timedelta(days=5),
        location='万达广场B1层',
        building_type='商业综合体',
        floor_count=5,
        wall_material='大理石',
        power_supply=True,
        installation_height=2.5,
        access_condition='正常',
        photos=['photo1.jpg', 'photo2.jpg'],
        notes='现场勘测完成，符合安装条件',
        status='completed',
        surveyor=technician
    )
    print(f"Created survey: {survey1.survey_no}")
    
    SurveyItem.objects.create(
        survey=survey1,
        item_type='sign',
        description='楼层导视牌',
        quantity=10,
        dimensions='60x40cm',
        material_requirements='亚克力',
        installation_requirements='墙面安装'
    )
    
    SurveyItem.objects.create(
        survey=survey1,
        item_type='light_box',
        description='店铺灯箱',
        quantity=5,
        dimensions='120x80cm',
        material_requirements='铝合金边框+亚克力面板',
        installation_requirements='吊顶安装'
    )
    
    quotation1 = Quotation.objects.create(
        survey=survey1,
        quotation_no='BQ202401160001',
        valid_until=timezone.now().date() + timedelta(days=30),
        status='approved',
        total_amount=25000.00,
        discount=10,
        final_amount=22500.00,
        payment_terms='预付款30%，验收后付清',
        delivery_time='7个工作日',
        created_by=admin
    )
    print(f"Created quotation: {quotation1.quotation_no}")
    
    QuotationItem.objects.create(
        quotation=quotation1,
        item_name='楼层导视牌',
        item_type='sign',
        quantity=10,
        unit_price=1500.00,
        total_price=15000.00,
        material='亚克力',
        process='UV打印+丝网印刷',
        installation_fee=2000.00
    )
    
    QuotationItem.objects.create(
        quotation=quotation1,
        item_name='店铺灯箱',
        item_type='light_box',
        quantity=5,
        unit_price=1600.00,
        total_price=8000.00,
        material='铝合金+亚克力',
        process='烤漆+LED光源',
        installation_fee=3000.00
    )
    
    survey2 = SiteSurvey.objects.create(
        customer=bj_yintai,
        survey_no='KC202401180002',
        survey_date=timezone.now() - timedelta(days=2),
        location='银泰中心A座大堂',
        building_type='写字楼',
        floor_count=35,
        wall_material='玻璃幕墙',
        power_supply=True,
        installation_height=3.0,
        access_condition='需要夜间施工',
        photos=['photo3.jpg'],
        notes='建议使用不锈钢材质',
        status='completed',
        surveyor=technician
    )
    print(f"Created survey: {survey2.survey_no}")
    
    quotation2 = Quotation.objects.create(
        survey=survey2,
        quotation_no='BQ202401190002',
        valid_until=timezone.now().date() + timedelta(days=15),
        status='submitted',
        total_amount=18000.00,
        discount=5,
        final_amount=17100.00,
        payment_terms='预付款50%',
        delivery_time='5个工作日',
        created_by=admin
    )
    print(f"Created quotation: {quotation2.quotation_no}")
    
    survey3 = SiteSurvey.objects.create(
        customer=sz_huarun,
        survey_no='KC202401200003',
        survey_date=timezone.now() + timedelta(days=3),
        location='万象城L1层中庭',
        building_type='购物中心',
        floor_count=6,
        wall_material='瓷砖',
        power_supply=True,
        installation_height=4.5,
        access_condition='需要高空作业证',
        notes='待勘测',
        status='pending',
        surveyor=technician
    )
    print(f"Created survey: {survey3.survey_no}")
    
    survey4 = SiteSurvey.objects.create(
        customer=sh_wanda,
        survey_no='KC202401210004',
        survey_date=timezone.now() - timedelta(days=10),
        location='万达广场室外广场',
        building_type='商业综合体',
        floor_count=1,
        wall_material='混凝土',
        power_supply=False,
        installation_height=6.0,
        access_condition='需要外接电源',
        notes='需要确认电源方案',
        status='pending',
        surveyor=technician
    )
    print(f"Created survey: {survey4.survey_no}")
    
    HistoryRecord.objects.create(
        survey=survey1,
        history_type='survey_create',
        description=f'创建勘测单 {survey1.survey_no}',
        operator=technician
    )
    
    HistoryRecord.objects.create(
        survey=survey1,
        history_type='survey_complete',
        description=f'完成勘测 {survey1.survey_no}',
        operator=technician
    )
    
    HistoryRecord.objects.create(
        quotation=quotation1,
        survey=survey1,
        history_type='quotation_create',
        description=f'创建报价单 {quotation1.quotation_no}',
        operator=admin
    )
    
    HistoryRecord.objects.create(
        quotation=quotation1,
        survey=survey1,
        history_type='quotation_submit',
        description=f'提交报价单 {quotation1.quotation_no}',
        operator=admin
    )
    
    HistoryRecord.objects.create(
        quotation=quotation1,
        survey=survey1,
        history_type='quotation_approve',
        description=f'批准报价单 {quotation1.quotation_no}',
        operator=admin
    )

if __name__ == '__main__':
    print("Creating initial data...")
    create_users()
    create_customers()
    create_sample_data()
    print("Initial data created successfully!")