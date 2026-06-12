from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import (
    Customer, DocumentType, DocumentGap, DocumentSubmission,
    CollectionRecord, RiskSummary, DocumentCategory, RiskLevel, GapStatus,
    DocumentRequirement
)


def create_seed_data():
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        if db.query(DocumentType).count() > 0:
            print("种子数据已存在，跳过创建")
            return
        
        print("开始创建种子数据...")
        
        doc_types = [
            DocumentType(
                name="增值税发票",
                category=DocumentCategory.INVOICE,
                description="增值税专用发票和普通发票",
                is_required=True,
                due_day=10
            ),
            DocumentType(
                name="银行回单",
                category=DocumentCategory.BANK_RECEIPT,
                description="银行对账单和回单",
                is_required=True,
                due_day=10
            ),
            DocumentType(
                name="工资表",
                category=DocumentCategory.SALARY_TABLE,
                description="员工工资发放表",
                is_required=True,
                due_day=15
            ),
            DocumentType(
                name="销售合同",
                category=DocumentCategory.CONTRACT,
                description="销售业务合同",
                is_required=False,
                due_day=20
            ),
            DocumentType(
                name="库存盘点表",
                category=DocumentCategory.INVENTORY_TABLE,
                description="月末库存盘点表",
                is_required=False,
                due_day=25
            ),
        ]
        
        for doc_type in doc_types:
            db.add(doc_type)
        db.commit()
        
        print("资料项配置创建完成")
        
        customer1 = Customer(
            name="长期拖票科技有限公司",
            tax_id="91110000MA00ABCD12",
            contact_person="张经理",
            contact_phone="13800138001"
        )
        
        customer2 = Customer(
            name="只差银行回单贸易有限公司",
            tax_id="91110000MA00EFGH34",
            contact_person="李主管",
            contact_phone="13900139002"
        )
        
        customer3 = Customer(
            name="正常提交客户服务有限公司",
            tax_id="91110000MA00IJKL56",
            contact_person="王总监",
            contact_phone="13700137003"
        )
        
        db.add(customer1)
        db.add(customer2)
        db.add(customer3)
        db.commit()
        
        print("客户创建完成")
        
        current_period = datetime.now().strftime("%Y-%m")
        last_period = (datetime.now() - timedelta(days=30)).strftime("%Y-%m")
        
        print("创建客户资料清单...")
        
        requirements_customer1_current = [
            DocumentRequirement(
                customer_id=customer1.id,
                document_type_id=doc_types[0].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
            DocumentRequirement(
                customer_id=customer1.id,
                document_type_id=doc_types[1].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
            DocumentRequirement(
                customer_id=customer1.id,
                document_type_id=doc_types[2].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
            DocumentRequirement(
                customer_id=customer1.id,
                document_type_id=doc_types[3].id,
                period=current_period,
                is_required=False,
                notes="有销售业务时提交"
            ),
            DocumentRequirement(
                customer_id=customer1.id,
                document_type_id=doc_types[4].id,
                period=current_period,
                is_required=False,
                notes="月末提交"
            ),
        ]
        
        requirements_customer1_last = [
            DocumentRequirement(
                customer_id=customer1.id,
                document_type_id=doc_types[0].id,
                period=last_period,
                is_required=True
            ),
            DocumentRequirement(
                customer_id=customer1.id,
                document_type_id=doc_types[1].id,
                period=last_period,
                is_required=True
            ),
            DocumentRequirement(
                customer_id=customer1.id,
                document_type_id=doc_types[2].id,
                period=last_period,
                is_required=True
            ),
        ]
        
        requirements_customer2_current = [
            DocumentRequirement(
                customer_id=customer2.id,
                document_type_id=doc_types[0].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
            DocumentRequirement(
                customer_id=customer2.id,
                document_type_id=doc_types[1].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
            DocumentRequirement(
                customer_id=customer2.id,
                document_type_id=doc_types[2].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
            DocumentRequirement(
                customer_id=customer2.id,
                document_type_id=doc_types[3].id,
                period=current_period,
                is_required=False,
                notes="有销售业务时提交"
            ),
        ]
        
        requirements_customer3_current = [
            DocumentRequirement(
                customer_id=customer3.id,
                document_type_id=doc_types[0].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
            DocumentRequirement(
                customer_id=customer3.id,
                document_type_id=doc_types[1].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
            DocumentRequirement(
                customer_id=customer3.id,
                document_type_id=doc_types[2].id,
                period=current_period,
                is_required=True,
                notes="每月必须提交"
            ),
        ]
        
        for req in requirements_customer1_current:
            db.add(req)
        for req in requirements_customer1_last:
            db.add(req)
        for req in requirements_customer2_current:
            db.add(req)
        for req in requirements_customer3_current:
            db.add(req)
        db.commit()
        
        print("客户资料清单创建完成")
        
        gaps_customer1 = [
            DocumentGap(
                customer_id=customer1.id,
                document_type_id=doc_types[0].id,
                period=current_period,
                status=GapStatus.OVERDUE,
                risk_level=RiskLevel.HIGH,
                due_date=datetime.now() - timedelta(days=5),
                notes="已逾期5天，多次催交无果"
            ),
            DocumentGap(
                customer_id=customer1.id,
                document_type_id=doc_types[1].id,
                period=current_period,
                status=GapStatus.OVERDUE,
                risk_level=RiskLevel.HIGH,
                due_date=datetime.now() - timedelta(days=5),
                notes="已逾期5天"
            ),
            DocumentGap(
                customer_id=customer1.id,
                document_type_id=doc_types[2].id,
                period=current_period,
                status=GapStatus.PENDING,
                risk_level=RiskLevel.MEDIUM,
                due_date=datetime.now() + timedelta(days=3),
                notes="尚未提交"
            ),
            DocumentGap(
                customer_id=customer1.id,
                document_type_id=doc_types[0].id,
                period=last_period,
                status=GapStatus.OVERDUE,
                risk_level=RiskLevel.HIGH,
                due_date=datetime.now() - timedelta(days=35),
                notes="上月发票仍未提交"
            ),
            DocumentGap(
                customer_id=customer1.id,
                document_type_id=doc_types[1].id,
                period=last_period,
                status=GapStatus.OVERDUE,
                risk_level=RiskLevel.HIGH,
                due_date=datetime.now() - timedelta(days=35),
                notes="上月银行回单仍未提交"
            ),
        ]
        
        for gap in gaps_customer1:
            db.add(gap)
        
        gaps_customer2 = [
            DocumentGap(
                customer_id=customer2.id,
                document_type_id=doc_types[1].id,
                period=current_period,
                status=GapStatus.PENDING,
                risk_level=RiskLevel.MEDIUM,
                due_date=datetime.now() + timedelta(days=2),
                notes="仅差银行回单"
            ),
        ]
        
        for gap in gaps_customer2:
            db.add(gap)
        
        db.commit()
        
        submissions_customer2 = [
            DocumentSubmission(
                customer_id=customer2.id,
                document_type_id=doc_types[0].id,
                period=current_period,
                submission_date=datetime.now() - timedelta(days=2),
                file_name="增值税发票_202606.pdf",
                quantity=15,
                submitted_by="李主管",
                notes="本月发票已全部提交"
            ),
            DocumentSubmission(
                customer_id=customer2.id,
                document_type_id=doc_types[2].id,
                period=current_period,
                submission_date=datetime.now() - timedelta(days=1),
                file_name="工资表_202606.xlsx",
                quantity=1,
                submitted_by="李主管"
            ),
        ]
        
        for submission in submissions_customer2:
            db.add(submission)
        
        submissions_customer3 = [
            DocumentSubmission(
                customer_id=customer3.id,
                document_type_id=doc_types[0].id,
                period=current_period,
                submission_date=datetime.now() - timedelta(days=3),
                file_name="增值税发票_202606.pdf",
                quantity=20,
                submitted_by="王总监"
            ),
            DocumentSubmission(
                customer_id=customer3.id,
                document_type_id=doc_types[1].id,
                period=current_period,
                submission_date=datetime.now() - timedelta(days=3),
                file_name="银行回单_202606.pdf",
                quantity=10,
                submitted_by="王总监"
            ),
            DocumentSubmission(
                customer_id=customer3.id,
                document_type_id=doc_types[2].id,
                period=current_period,
                submission_date=datetime.now() - timedelta(days=2),
                file_name="工资表_202606.xlsx",
                quantity=1,
                submitted_by="王总监"
            ),
        ]
        
        for submission in submissions_customer3:
            db.add(submission)
        
        db.commit()
        
        print("资料缺口和提交记录创建完成")
        
        collection_records = [
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[0].id,
                contact_date=datetime.now() - timedelta(days=5),
                contact_method="电话",
                contact_person_manager="陈经理",
                content="催促提交本月增值税发票",
                customer_response="正在整理，明天提交",
                next_follow_up_date=datetime.now() - timedelta(days=4)
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[0].id,
                contact_date=datetime.now() - timedelta(days=3),
                contact_method="微信",
                contact_person_manager="陈经理",
                content="再次催促提交发票，告知申报截止日期",
                customer_response="财务出差，回来后立即处理",
                next_follow_up_date=datetime.now() - timedelta(days=2)
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[0].id,
                contact_date=datetime.now() - timedelta(days=1),
                contact_method="电话",
                contact_person_manager="陈经理",
                content="紧急催促发票",
                customer_response="正在处理",
                next_follow_up_date=datetime.now()
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[1].id,
                contact_date=datetime.now() - timedelta(days=4),
                contact_method="电话",
                contact_person_manager="陈经理",
                content="催促提交本月银行回单",
                customer_response="正在去银行",
                next_follow_up_date=datetime.now() - timedelta(days=3)
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[1].id,
                contact_date=datetime.now() - timedelta(days=2),
                contact_method="微信",
                contact_person_manager="陈经理",
                content="再次催促银行回单",
                customer_response="银行排队中",
                next_follow_up_date=datetime.now() + timedelta(days=1)
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[2].id,
                contact_date=datetime.now() - timedelta(days=1),
                contact_method="电话",
                contact_person_manager="陈经理",
                content="提醒提交工资表",
                customer_response="工资还没发",
                next_follow_up_date=datetime.now() + timedelta(days=2)
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[3].id,
                contact_date=datetime.now() - timedelta(days=15),
                contact_method="电话",
                contact_person_manager="陈经理",
                content="催促提交上月发票",
                customer_response="已安排人员整理",
                next_follow_up_date=datetime.now() - timedelta(days=10)
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[3].id,
                contact_date=datetime.now() - timedelta(days=8),
                contact_method="微信",
                contact_person_manager="陈经理",
                content="再次催促上月发票",
                customer_response="还在整理",
                next_follow_up_date=datetime.now() - timedelta(days=7)
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[4].id,
                contact_date=datetime.now() - timedelta(days=12),
                contact_method="电话",
                contact_person_manager="陈经理",
                content="催促提交上月银行回单",
                customer_response="财务休年假",
                next_follow_up_date=datetime.now() - timedelta(days=5)
            ),
            CollectionRecord(
                customer_id=customer1.id,
                document_gap_id=gaps_customer1[4].id,
                contact_date=datetime.now() - timedelta(days=4),
                contact_method="电话",
                contact_person_manager="陈经理",
                content="再次催促上月银行回单",
                customer_response="下周回来处理",
                next_follow_up_date=datetime.now() + timedelta(days=3)
            ),
            CollectionRecord(
                customer_id=customer2.id,
                document_gap_id=gaps_customer2[0].id,
                contact_date=datetime.now() - timedelta(days=2),
                contact_method="微信",
                contact_person_manager="刘经理",
                content="提醒提交银行回单",
                customer_response="已去银行打印，今天下午提交",
                next_follow_up_date=datetime.now() - timedelta(days=1)
            ),
            CollectionRecord(
                customer_id=customer2.id,
                document_gap_id=gaps_customer2[0].id,
                contact_date=datetime.now() - timedelta(days=1),
                contact_method="微信",
                contact_person_manager="刘经理",
                content="跟进银行回单提交情况",
                customer_response="已提交，在走审批流程",
                next_follow_up_date=datetime.now() + timedelta(days=1)
            ),
        ]
        
        for record in collection_records:
            db.add(record)
        
        db.commit()
        
        print("催交记录创建完成")
        
        risk_summaries = [
            RiskSummary(
                customer_id=customer1.id,
                period=current_period,
                risk_level=RiskLevel.HIGH,
                risk_description="多个资料项逾期未交，严重影响本月申报进度",
                affected_declaration=True,
                resolution_suggestion="立即安排专人跟进，必要时上门收取资料"
            ),
            RiskSummary(
                customer_id=customer1.id,
                period=last_period,
                risk_level=RiskLevel.HIGH,
                risk_description="上月资料仍未提交，已影响上月申报",
                affected_declaration=True,
                resolution_suggestion="联系客户高层协调解决"
            ),
            RiskSummary(
                customer_id=customer2.id,
                period=current_period,
                risk_level=RiskLevel.MEDIUM,
                risk_description="仅差银行回单，可能影响申报进度",
                affected_declaration=True,
                resolution_suggestion="继续跟进，确保按时提交"
            ),
        ]
        
        for risk in risk_summaries:
            db.add(risk)
        
        db.commit()
        
        print("风险汇总创建完成")
        print("种子数据创建成功！")
        print("\n种子数据概览：")
        print(f"- 客户数量：{db.query(Customer).count()}")
        print(f"- 资料项配置：{db.query(DocumentType).count()}")
        print(f"- 资料清单：{db.query(DocumentRequirement).count()}")
        print(f"- 资料缺口：{db.query(DocumentGap).count()}")
        print(f"- 提交记录：{db.query(DocumentSubmission).count()}")
        print(f"- 催交记录：{db.query(CollectionRecord).count()}")
        print(f"- 风险汇总：{db.query(RiskSummary).count()}")
        
        print("\n示例客户：")
        print(f"1. {customer1.name} - 长期拖票客户，多个资料项逾期")
        print(f"2. {customer2.name} - 只差银行回单的客户")
        print(f"3. {customer3.name} - 正常提交客户")
        
    except Exception as e:
        print(f"创建种子数据时出错：{e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_seed_data()