from datetime import datetime, date, timedelta
from database import Database
from models import (
    Job, Interview, OnboardingReceipt, StabilityTracking, ChangeLog,
    JobStatus, InterviewStatus, ReceiptStatus, StabilityStatus
)


def init_sample_data(db: Database):
    jobs = [
        Job(
            id=None,
            title='仓库分拣员',
            company='京东物流',
            location='上海浦东新区',
            salary_range='5000-7000',
            requirements='身体健康，能适应夜班工作',
            benefits='五险一金，免费住宿，餐补',
            return_fee_condition='入职满30天且无违规记录',
            return_fee_amount=800,
            status=JobStatus.ACTIVE,
            publish_date=date.today() - timedelta(days=10),
            expire_date=date.today() + timedelta(days=5),
            contact_person='张经理',
            contact_phone='13800138001',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Job(
            id=None,
            title='生产线操作工',
            company='富士康科技',
            location='苏州工业园区',
            salary_range='4500-6000',
            requirements='18-40岁，初中以上学历',
            benefits='五险一金，加班费，节日福利',
            return_fee_condition='入职满45天，出勤率达90%',
            return_fee_amount=1200,
            status=JobStatus.ACTIVE,
            publish_date=date.today() - timedelta(days=15),
            expire_date=date.today() + timedelta(days=15),
            contact_person='李主管',
            contact_phone='13900139001',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Job(
            id=None,
            title='快递配送员',
            company='顺丰速运',
            location='杭州西湖区',
            salary_range='6000-9000',
            requirements='自带电动车，熟悉当地路线',
            benefits='五险一金，提成奖励，话费补贴',
            return_fee_condition='入职满60天，日均配送50单以上',
            return_fee_amount=1500,
            status=JobStatus.PAUSED,
            publish_date=date.today() - timedelta(days=20),
            expire_date=date.today() + timedelta(days=10),
            contact_person='王队长',
            contact_phone='13700137001',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Job(
            id=None,
            title='餐厅服务员',
            company='海底捞火锅',
            location='北京朝阳区',
            salary_range='4000-5500',
            requirements='形象端正，有服务意识',
            benefits='五险一金，包吃住，绩效奖金',
            return_fee_condition='入职满30天',
            return_fee_amount=500,
            status=JobStatus.CLOSED,
            publish_date=date.today() - timedelta(days=30),
            expire_date=date.today() - timedelta(days=5),
            contact_person='陈经理',
            contact_phone='13600136001',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]
    
    job_ids = []
    for job in jobs:
        job_id = db.add_job(job)
        job_ids.append(job_id)
        
    interviews = [
        Interview(
            id=None,
            job_id=job_ids[0],
            candidate_name='张三',
            candidate_phone='15000115001',
            interview_time=datetime.now() + timedelta(days=1, hours=10),
            location='京东物流上海浦东仓库',
            interviewer='张经理',
            status=InterviewStatus.SCHEDULED,
            notes='候选人已确认面试时间',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Interview(
            id=None,
            job_id=job_ids[0],
            candidate_name='李四',
            candidate_phone='15000115002',
            interview_time=datetime.now() - timedelta(days=2, hours=14),
            location='京东物流上海浦东仓库',
            interviewer='张经理',
            status=InterviewStatus.NO_SHOW,
            notes='候选人未到场，电话联系未接',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Interview(
            id=None,
            job_id=job_ids[1],
            candidate_name='王五',
            candidate_phone='15000115003',
            interview_time=datetime.now() - timedelta(days=3, hours=9),
            location='富士康苏州园区招聘中心',
            interviewer='李主管',
            status=InterviewStatus.PASSED,
            notes='面试表现良好，已通过',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Interview(
            id=None,
            job_id=job_ids[1],
            candidate_name='赵六',
            candidate_phone='15000115004',
            interview_time=datetime.now() - timedelta(days=5, hours=10),
            location='富士康苏州园区招聘中心',
            interviewer='李主管',
            status=InterviewStatus.PASSED,
            notes='经验丰富，推荐入职',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        Interview(
            id=None,
            job_id=job_ids[1],
            candidate_name='孙七',
            candidate_phone='15000115005',
            interview_time=datetime.now() + timedelta(days=2, hours=11),
            location='富士康苏州园区招聘中心',
            interviewer='李主管',
            status=InterviewStatus.SCHEDULED,
            notes='待面试',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]
    
    interview_ids = []
    for interview in interviews:
        interview_id = db.add_interview(interview)
        interview_ids.append(interview_id)
        
    receipts = [
        OnboardingReceipt(
            id=None,
            interview_id=interview_ids[2],
            candidate_name='王五',
            job_id=job_ids[1],
            company='富士康科技',
            onboarding_date=date.today() - timedelta(days=10),
            receipt_photo=None,
            receipt_number='RC202401001',
            status=ReceiptStatus.PENDING,
            return_fee_due_date=date.today() + timedelta(days=35),
            return_fee_amount=1200,
            notes='入职回执已提交，待核实',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        OnboardingReceipt(
            id=None,
            interview_id=interview_ids[3],
            candidate_name='赵六',
            job_id=job_ids[1],
            company='富士康科技',
            onboarding_date=date.today() - timedelta(days=20),
            receipt_photo=None,
            receipt_number='RC202401002',
            status=ReceiptStatus.VERIFIED,
            return_fee_due_date=date.today() + timedelta(days=25),
            return_fee_amount=1200,
            notes='回执已核实，进入稳定期跟踪',
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]
    
    receipt_ids = []
    for receipt in receipts:
        receipt_id = db.add_receipt(receipt)
        receipt_ids.append(receipt_id)
        
    trackings = [
        StabilityTracking(
            id=None,
            receipt_id=receipt_ids[0],
            candidate_name='王五',
            company='富士康科技',
            onboarding_date=date.today() - timedelta(days=10),
            stability_period_days=45,
            current_work_days=10,
            status=StabilityStatus.IN_PROGRESS,
            last_check_date=date.today() - timedelta(days=3),
            next_check_date=date.today() + timedelta(days=4),
            risk_notes='',
            return_fee_paid=False,
            return_fee_date=None,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
        StabilityTracking(
            id=None,
            receipt_id=receipt_ids[1],
            candidate_name='赵六',
            company='富士康科技',
            onboarding_date=date.today() - timedelta(days=20),
            stability_period_days=45,
            current_work_days=20,
            status=StabilityStatus.RISK,
            last_check_date=date.today() - timedelta(days=2),
            next_check_date=date.today() + timedelta(days=5),
            risk_notes='近期请假较多，需关注',
            return_fee_paid=False,
            return_fee_date=None,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ),
    ]
    
    for tracking in trackings:
        db.add_stability_tracking(tracking)
        
    changes = [
        ChangeLog(
            id=None,
            entity_type='job',
            entity_id=job_ids[0],
            action='创建',
            old_value='',
            new_value='仓库分拣员',
            operator='系统',
            created_at=datetime.now() - timedelta(hours=1)
        ),
        ChangeLog(
            id=None,
            entity_type='interview',
            entity_id=interview_ids[1],
            action='状态变更',
            old_value='待面试',
            new_value='爽约',
            operator='张经理',
            created_at=datetime.now() - timedelta(hours=2)
        ),
        ChangeLog(
            id=None,
            entity_type='receipt',
            entity_id=receipt_ids[1],
            action='状态变更',
            old_value='待处理',
            new_value='已核实',
            operator='运营',
            created_at=datetime.now() - timedelta(hours=3)
        ),
    ]
    
    for change in changes:
        db.add_change_log(change)


if __name__ == '__main__':
    db = Database()
    init_sample_data(db)
    print('样例数据已初始化完成')