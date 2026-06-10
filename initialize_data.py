import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'feed_analysis.settings')
django.setup()

from complaint.models import Recipe, FeedingRecord, Complaint, BatchAnalysis, AuditLog, ErrorCode
from datetime import datetime, timedelta

def create_error_codes():
    error_codes = [
        {'code': 'ERR-001', 'description': '投料偏差超限', 'solution': '检查投料设备，校准计量器具，重新投料', 'severity': 'high'},
        {'code': 'ERR-002', 'description': '批次标签错误', 'solution': '核对标签信息，重新打印正确标签', 'severity': 'medium'},
        {'code': 'ERR-003', 'description': '增重缓慢投诉', 'solution': '分析配方营养成分，检查原料质量，调整饲喂方案', 'severity': 'critical'},
        {'code': 'ERR-004', 'description': '配方单未审核', 'solution': '通知配方师审核配方单', 'severity': 'medium'},
        {'code': 'ERR-005', 'description': '原料批次过期', 'solution': '更换新鲜原料，检查库存管理', 'severity': 'high'},
        {'code': 'ERR-006', 'description': '混合均匀度不达标', 'solution': '检查混合设备运行状态，延长混合时间', 'severity': 'high'},
        {'code': 'ERR-007', 'description': '成品水分超标', 'solution': '调整干燥参数，检查烘干设备', 'severity': 'medium'},
        {'code': 'ERR-008', 'description': '客户投诉未及时处理', 'solution': '立即安排专人跟进处理', 'severity': 'critical'},
    ]
    
    for ec in error_codes:
        ErrorCode.objects.get_or_create(code=ec['code'], defaults=ec)
    print(f"Created {len(error_codes)} error codes")

def create_sample_recipes():
    recipes = [
        {
            'recipe_code': 'RC-001',
            'name': '蛋鸡育雏期配合饲料',
            'ingredients': {
                '玉米': 60.0,
                '豆粕': 25.0,
                '麸皮': 8.0,
                '鱼粉': 3.0,
                '预混料': 2.0,
                '油脂': 2.0
            },
            'specifications': {
                'crude_protein': 20.0,
                'metabolizable_energy': 2800,
                'lysine': 1.0,
                'max_deviation': 3.0
            },
            'status': 'approved',
            'created_by': '李配方师',
            'approved_by': '王主管',
            'approved_at': datetime.now() - timedelta(days=5)
        },
        {
            'recipe_code': 'RC-002',
            'name': '肉猪育肥期配合饲料',
            'ingredients': {
                '玉米': 65.0,
                '豆粕': 20.0,
                '麸皮': 6.0,
                '鱼粉': 2.0,
                '预混料': 2.0,
                '油脂': 5.0
            },
            'specifications': {
                'crude_protein': 18.0,
                'metabolizable_energy': 3200,
                'lysine': 0.9,
                'max_deviation': 3.0
            },
            'status': 'approved',
            'created_by': '李配方师',
            'approved_by': '王主管',
            'approved_at': datetime.now() - timedelta(days=3)
        },
        {
            'recipe_code': 'RC-003',
            'name': '肉鸡后期配合饲料',
            'ingredients': {
                '玉米': 62.0,
                '豆粕': 22.0,
                '麸皮': 5.0,
                '鱼粉': 4.0,
                '预混料': 2.0,
                '油脂': 5.0
            },
            'specifications': {
                'crude_protein': 19.0,
                'metabolizable_energy': 3000,
                'lysine': 1.1,
                'max_deviation': 3.0
            },
            'status': 'draft',
            'created_by': '张配方师'
        }
    ]
    
    for r in recipes:
        Recipe.objects.get_or_create(recipe_code=r['recipe_code'], defaults=r)
    print(f"Created {len(recipes)} recipes")

def create_sample_feeding_records():
    recipe1 = Recipe.objects.get(recipe_code='RC-001')
    recipe2 = Recipe.objects.get(recipe_code='RC-002')
    
    records = [
        {
            'batch_number': 'B20240115001',
            'recipe': recipe1,
            'feeding_data': {
                '玉米': 60.2,
                '豆粕': 24.8,
                '麸皮': 8.1,
                '鱼粉': 3.0,
                '预混料': 2.0,
                '油脂': 1.9
            },
            'deviation': 0.8,
            'is_deviation_exceeded': False,
            'status': 'verified',
            'created_by': '赵班长',
            'confirmed_by': '孙质检',
            'confirmed_at': datetime.now() - timedelta(days=5)
        },
        {
            'batch_number': 'B20240115002',
            'recipe': recipe1,
            'feeding_data': {
                '玉米': 58.5,
                '豆粕': 26.0,
                '麸皮': 7.5,
                '鱼粉': 3.0,
                '预混料': 2.0,
                '油脂': 3.0
            },
            'deviation': 4.2,
            'is_deviation_exceeded': True,
            'status': 'confirmed',
            'created_by': '赵班长',
            'confirmed_by': '孙质检',
            'confirmed_at': datetime.now() - timedelta(days=5)
        },
        {
            'batch_number': 'B20240116001',
            'recipe': recipe2,
            'feeding_data': {
                '玉米': 64.8,
                '豆粕': 20.2,
                '麸皮': 5.8,
                '鱼粉': 2.1,
                '预混料': 2.0,
                '油脂': 5.1
            },
            'deviation': 0.5,
            'is_deviation_exceeded': False,
            'status': 'pending',
            'created_by': '钱班长'
        },
        {
            'batch_number': 'B20240117001',
            'recipe': recipe2,
            'feeding_data': {
                '玉米': 66.5,
                '豆粕': 18.5,
                '麸皮': 6.2,
                '鱼粉': 2.0,
                '预混料': 2.0,
                '油脂': 4.8
            },
            'deviation': 3.5,
            'is_deviation_exceeded': True,
            'status': 'pending',
            'created_by': '钱班长'
        }
    ]
    
    for r in records:
        FeedingRecord.objects.get_or_create(batch_number=r['batch_number'], defaults=r)
    print(f"Created {len(records)} feeding records")

def create_sample_complaints():
    record1 = FeedingRecord.objects.get(batch_number='B20240115002')
    record2 = FeedingRecord.objects.get(batch_number='B20240117001')
    
    complaints = [
        {
            'complaint_code': 'COMP-20240115-0001',
            'customer_name': '张养殖户',
            'contact_info': '13800138001',
            'batch_number': 'B20240115002',
            'complaint_type': 'weight_gain',
            'severity': 'critical',
            'description': '使用该批次饲料后，蛋鸡增重缓慢，比正常情况低15%',
            'status': 'pending',
            'related_feeding_record': record1,
            'created_by': '客服小李'
        },
        {
            'complaint_code': 'COMP-20240116-0002',
            'customer_name': '李养殖户',
            'contact_info': '13800138002',
            'batch_number': 'B20240115001',
            'complaint_type': 'label_error',
            'severity': 'medium',
            'description': '饲料标签上的生产日期打印错误',
            'status': 'processing',
            'created_by': '客服小王',
            'processed_by': '质检员老孙',
            'processed_at': datetime.now() - timedelta(hours=2)
        },
        {
            'complaint_code': 'COMP-20240117-0003',
            'customer_name': '王养殖户',
            'contact_info': '13800138003',
            'batch_number': 'B20240117001',
            'complaint_type': 'ingredient_deviation',
            'severity': 'high',
            'description': '怀疑配料比例有问题，饲料颜色异常',
            'status': 'pending',
            'related_feeding_record': record2,
            'created_by': '客服小李'
        },
        {
            'complaint_code': 'COMP-20240118-0004',
            'customer_name': '赵养殖户',
            'contact_info': '13800138004',
            'batch_number': 'B20240115002',
            'complaint_type': 'weight_gain',
            'severity': 'high',
            'description': '肉鸡采食量正常但增重不理想',
            'status': 'analyzed',
            'created_by': '客服小王',
            'processed_by': '质检员老孙',
            'processed_at': datetime.now() - timedelta(days=1)
        }
    ]
    
    for c in complaints:
        Complaint.objects.get_or_create(complaint_code=c['complaint_code'], defaults=c)
    print(f"Created {len(complaints)} complaints")

def create_sample_analysis():
    complaint = Complaint.objects.get(complaint_code='COMP-20240118-0004')
    recipe = Recipe.objects.get(recipe_code='RC-002')
    record = FeedingRecord.objects.get(batch_number='B20240115002')
    
    analysis = {
        'analysis_code': 'ANA-20240118-0001',
        'complaint': complaint,
        'batch_number': 'B20240115002',
        'recipe': recipe,
        'feeding_record': record,
        'analysis_data': {
            'protein_content': 17.8,
            'energy_content': 3150,
            'ingredient_check': {
                '玉米': '合格',
                '豆粕': '合格',
                '鱼粉': '合格',
                '预混料': '合格'
            },
            'deviation_analysis': '投料偏差在允许范围内'
        },
        'conclusion': '经分析，该批次饲料营养成分符合配方要求，建议检查养殖环境和饲喂管理',
        'result': 'normal',
        'recommendations': '1. 检查鸡舍温度和通风条件\n2. 确认饲喂量和频次\n3. 观察鸡群健康状况',
        'status': 'completed',
        'created_by': '分析员小陈'
    }
    
    BatchAnalysis.objects.get_or_create(analysis_code=analysis['analysis_code'], defaults=analysis)
    print("Created 1 batch analysis")

if __name__ == '__main__':
    create_error_codes()
    create_sample_recipes()
    create_sample_feeding_records()
    create_sample_complaints()
    create_sample_analysis()
    print("Data initialization complete!")
