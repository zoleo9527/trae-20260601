"""
典当行续当赎当与费用计算系统 - 样例数据
包含四种场景：正常推进、退回补充、逾期未处理、责任争议
"""

from datetime import date, datetime
from decimal import Decimal
from models import (
    PawnItem, RenewalRecord, RedemptionRecord, FeeCalculation,
    ResponsibilityChain, AuditLog, StateTransition, User,
    PawnStatus, RenewalStatus, RedemptionStatus, FeeCalculationStatus,
    UserRole, ResponsibilityStage
)


class SampleDataGenerator:
    def __init__(self):
        self.users = self._create_users()
        self.pawn_items = {}
        self.renewals = {}
        self.redemptions = {}
        self.fee_calculations = {}
        self.responsibility_chains = {}
        self.audit_logs = []
        self.state_transitions = []
    
    def _create_users(self) -> dict:
        return {
            "assessor_001": User(
                id="assessor_001",
                name="张评估师",
                role=UserRole.ASSESSOR,
                department="评估部"
            ),
            "warehouse_001": User(
                id="warehouse_001",
                name="李库管",
                role=UserRole.WAREHOUSE,
                department="仓储部"
            ),
            "finance_001": User(
                id="finance_001",
                name="王财务",
                role=UserRole.FINANCE,
                department="财务部"
            ),
            "manager_001": User(
                id="manager_001",
                name="赵经理",
                role=UserRole.MANAGER,
                department="管理层"
            )
        }
    
    def generate_normal_progress_scenario(self):
        """
        场景1：正常推进
        典当品从评估到续当再到赎当，流程顺畅
        """
        pawn_item = PawnItem(
            id="pawn_001",
            customer_id="customer_001",
            item_name="黄金项链",
            item_description="18K金项链，重50克",
            appraised_value=Decimal("15000.00"),
            loan_amount=Decimal("10000.00"),
            interest_rate=Decimal("0.36"),
            term_days=180,
            start_date=date(2024, 1, 1),
            due_date=date(2024, 6, 30),
            status=PawnStatus.ACTIVE,
            assessor_id="assessor_001",
            warehouse_id="warehouse_001"
        )
        self.pawn_items["pawn_001"] = pawn_item
        
        renewal = RenewalRecord(
            id="renewal_001",
            pawn_item_id="pawn_001",
            original_due_date=date(2024, 6, 30),
            new_due_date=date(2024, 12, 31),
            renewal_fee=Decimal("500.00"),
            status=RenewalStatus.APPROVED,
            current_handler=UserRole.FINANCE,
            assessor_id="assessor_001",
            assessor_notes="物品状态良好，同意续当",
            finance_id="finance_001",
            finance_notes="费用计算准确，批准续当",
            fee_calculation_id="fee_001"
        )
        self.renewals["renewal_001"] = renewal
        
        fee_calculation = FeeCalculation(
            id="fee_001",
            pawn_item_id="pawn_001",
            calculation_date=date(2024, 6, 14),
            principal=Decimal("10000.00"),
            interest_amount=Decimal("1800.00"),
            service_fee=Decimal("100.00"),
            storage_fee=Decimal("900.00"),
            penalty_fee=Decimal("0.00"),
            total_fee=Decimal("2800.00"),
            status=FeeCalculationStatus.APPROVED,
            calculator_id="finance_001",
            reviewer_id="finance_001",
            review_notes="计算无误，批准"
        )
        self.fee_calculations["fee_001"] = fee_calculation
        
        redemption = RedemptionRecord(
            id="redemption_001",
            pawn_item_id="pawn_001",
            redemption_date=date(2024, 12, 31),
            total_amount=Decimal("12800.00"),
            status=RedemptionStatus.COMPLETED,
            current_handler=UserRole.FINANCE,
            finance_id="finance_001",
            finance_notes="费用结算完成",
            warehouse_id="warehouse_001",
            warehouse_notes="物品完好，已取出",
            customer_confirmation=True,
            fee_calculation_id="fee_002"
        )
        self.redemptions["redemption_001"] = redemption
        
        self._add_responsibility_chain(
            pawn_item_id="pawn_001",
            stage=ResponsibilityStage.APPRAISAL,
            handler_id="assessor_001",
            handler_role=UserRole.ASSESSOR,
            notes="初始评估完成"
        )
        
        self._add_responsibility_chain(
            pawn_item_id="pawn_001",
            stage=ResponsibilityStage.FEE_CALCULATION,
            handler_id="finance_001",
            handler_role=UserRole.FINANCE,
            notes="续当费用计算"
        )
        
        self._add_responsibility_chain(
            pawn_item_id="pawn_001",
            stage=ResponsibilityStage.SETTLEMENT,
            handler_id="finance_001",
            handler_role=UserRole.FINANCE,
            notes="赎当结算完成"
        )
        
        self._add_audit_log(
            entity_type="PawnItem",
            entity_id="pawn_001",
            action="CREATE",
            old_value=None,
            new_value="典当品创建",
            operator_id="assessor_001",
            operator_role=UserRole.ASSESSOR
        )
        
        self._add_audit_log(
            entity_type="RenewalRecord",
            entity_id="renewal_001",
            action="APPROVE",
            old_value="pending_finance",
            new_value="approved",
            operator_id="finance_001",
            operator_role=UserRole.FINANCE,
            notes="正常续当批准"
        )
        
        self._add_state_transition(
            entity_type="PawnItem",
            entity_id="pawn_001",
            from_status="active",
            to_status="renewal_approved",
            triggered_by="finance_001",
            trigger_role=UserRole.FINANCE,
            reason="续当批准"
        )
        
        return {
            "pawn_item": pawn_item,
            "renewal": renewal,
            "fee_calculation": fee_calculation,
            "redemption": redemption
        }
    
    def generate_return_and_supplement_scenario(self):
        """
        场景2：退回补充
        续当申请被评估师退回，需要补充材料后重新提交
        """
        pawn_item = PawnItem(
            id="pawn_002",
            customer_id="customer_002",
            item_name="翡翠手镯",
            item_description="A货翡翠手镯",
            appraised_value=Decimal("20000.00"),
            loan_amount=Decimal("15000.00"),
            interest_rate=Decimal("0.36"),
            term_days=90,
            start_date=date(2024, 3, 1),
            due_date=date(2024, 5, 30),
            status=PawnStatus.ACTIVE,
            assessor_id="assessor_001",
            warehouse_id="warehouse_001"
        )
        self.pawn_items["pawn_002"] = pawn_item
        
        renewal_draft = RenewalRecord(
            id="renewal_002_draft",
            pawn_item_id="pawn_002",
            original_due_date=date(2024, 5, 30),
            new_due_date=date(2024, 8, 30),
            renewal_fee=Decimal("0.00"),
            status=RenewalStatus.DRAFT,
            current_handler=UserRole.ASSESSOR
        )
        self.renewals["renewal_002_draft"] = renewal_draft
        
        renewal_rejected = RenewalRecord(
            id="renewal_002_rejected",
            pawn_item_id="pawn_002",
            original_due_date=date(2024, 5, 30),
            new_due_date=date(2024, 8, 30),
            renewal_fee=Decimal("0.00"),
            status=RenewalStatus.REJECTED,
            current_handler=UserRole.ASSESSOR,
            assessor_id="assessor_001",
            assessor_notes="缺少物品鉴定证书，退回补充材料"
        )
        self.renewals["renewal_002_rejected"] = renewal_rejected
        
        renewal_resubmitted = RenewalRecord(
            id="renewal_002_resubmitted",
            pawn_item_id="pawn_002",
            original_due_date=date(2024, 5, 30),
            new_due_date=date(2024, 8, 30),
            renewal_fee=Decimal("750.00"),
            status=RenewalStatus.PENDING_FINANCE,
            current_handler=UserRole.FINANCE,
            assessor_id="assessor_001",
            assessor_notes="已补充鉴定证书，同意续当"
        )
        self.renewals["renewal_002_resubmitted"] = renewal_resubmitted
        
        self._add_audit_log(
            entity_type="RenewalRecord",
            entity_id="renewal_002_draft",
            action="CREATE",
            old_value=None,
            new_value="续当申请创建",
            operator_id="assessor_001",
            operator_role=UserRole.ASSESSOR
        )
        
        self._add_audit_log(
            entity_type="RenewalRecord",
            entity_id="renewal_002_draft",
            action="REJECT",
            old_value="pending_assessor",
            new_value="rejected",
            operator_id="assessor_001",
            operator_role=UserRole.ASSESSOR,
            notes="缺少鉴定证书，退回补充"
        )
        
        self._add_audit_log(
            entity_type="RenewalRecord",
            entity_id="renewal_002_resubmitted",
            action="RESUBMIT",
            old_value="rejected",
            new_value="pending_assessor",
            operator_id="assessor_001",
            operator_role=UserRole.ASSESSOR,
            notes="已补充鉴定证书，重新提交"
        )
        
        self._add_state_transition(
            entity_type="RenewalRecord",
            entity_id="renewal_002_draft",
            from_status="pending_assessor",
            to_status="rejected",
            triggered_by="assessor_001",
            trigger_role=UserRole.ASSESSOR,
            reason="缺少鉴定证书"
        )
        
        return {
            "pawn_item": pawn_item,
            "renewal_draft": renewal_draft,
            "renewal_rejected": renewal_rejected,
            "renewal_resubmitted": renewal_resubmitted
        }
    
    def generate_overdue_unhandled_scenario(self):
        """
        场景3：逾期未处理
        典当品已逾期，但客户未续当也未赎当
        """
        pawn_item = PawnItem(
            id="pawn_003",
            customer_id="customer_003",
            item_name="钻石戒指",
            item_description="1克拉钻石戒指",
            appraised_value=Decimal("50000.00"),
            loan_amount=Decimal("30000.00"),
            interest_rate=Decimal("0.36"),
            term_days=60,
            start_date=date(2024, 2, 1),
            due_date=date(2024, 4, 1),
            status=PawnStatus.OVERDUE,
            assessor_id="assessor_001",
            warehouse_id="warehouse_001"
        )
        self.pawn_items["pawn_003"] = pawn_item
        
        fee_calculation_overdue = FeeCalculation(
            id="fee_003",
            pawn_item_id="pawn_003",
            calculation_date=date(2024, 6, 14),
            principal=Decimal("30000.00"),
            interest_amount=Decimal("5400.00"),
            service_fee=Decimal("300.00"),
            storage_fee=Decimal("3000.00"),
            penalty_fee=Decimal("1500.00"),
            total_fee=Decimal("10200.00"),
            status=FeeCalculationStatus.DRAFT,
            calculator_id="finance_001"
        )
        self.fee_calculations["fee_003"] = fee_calculation_overdue
        
        self._add_responsibility_chain(
            pawn_item_id="pawn_003",
            stage=ResponsibilityStage.WAREHOUSE_CUSTODY,
            handler_id="warehouse_001",
            handler_role=UserRole.WAREHOUSE,
            notes="逾期物品保管中"
        )
        
        self._add_audit_log(
            entity_type="PawnItem",
            entity_id="pawn_003",
            action="OVERDUE",
            old_value="active",
            new_value="overdue",
            operator_id="system",
            operator_role=UserRole.MANAGER,
            notes="系统自动标记逾期"
        )
        
        self._add_state_transition(
            entity_type="PawnItem",
            entity_id="pawn_003",
            from_status="active",
            to_status="overdue",
            triggered_by="system",
            trigger_role=UserRole.MANAGER,
            reason="到期未处理"
        )
        
        return {
            "pawn_item": pawn_item,
            "fee_calculation": fee_calculation_overdue
        }
    
    def generate_dispute_scenario(self):
        """
        场景4：责任争议
        费用计算存在争议，各方对责任划分有分歧
        """
        pawn_item = PawnItem(
            id="pawn_004",
            customer_id="customer_004",
            item_name="古董瓷器",
            item_description="清代青花瓷瓶",
            appraised_value=Decimal("80000.00"),
            loan_amount=Decimal("50000.00"),
            interest_rate=Decimal("0.36"),
            term_days=120,
            start_date=date(2024, 1, 1),
            due_date=date(2024, 5, 1),
            status=PawnStatus.DISPUTED,
            assessor_id="assessor_001",
            warehouse_id="warehouse_001"
        )
        self.pawn_items["pawn_004"] = pawn_item
        
        fee_calculation_disputed = FeeCalculation(
            id="fee_004",
            pawn_item_id="pawn_004",
            calculation_date=date(2024, 6, 14),
            principal=Decimal("50000.00"),
            interest_amount=Decimal("9000.00"),
            service_fee=Decimal("500.00"),
            storage_fee=Decimal("4800.00"),
            penalty_fee=Decimal("2500.00"),
            total_fee=Decimal("16800.00"),
            status=FeeCalculationStatus.DISPUTED,
            calculator_id="finance_001",
            dispute_reason="评估师认为利息计算偏高，财务认为计算正确"
        )
        self.fee_calculations["fee_004"] = fee_calculation_disputed
        
        redemption_disputed = RedemptionRecord(
            id="redemption_004",
            pawn_item_id="pawn_004",
            redemption_date=date(2024, 6, 14),
            total_amount=Decimal("66800.00"),
            status=RedemptionStatus.DISPUTED,
            current_handler=UserRole.FINANCE,
            finance_id="finance_001",
            finance_notes="费用计算完成，等待争议解决",
            dispute_reason="客户对滞纳金金额有异议",
            fee_calculation_id="fee_004"
        )
        self.redemptions["redemption_004"] = redemption_disputed
        
        self._add_responsibility_chain(
            pawn_item_id="pawn_004",
            stage=ResponsibilityStage.FEE_CALCULATION,
            handler_id="finance_001",
            handler_role=UserRole.FINANCE,
            notes="费用计算争议中"
        )
        
        self._add_responsibility_chain(
            pawn_item_id="pawn_004",
            stage=ResponsibilityStage.REDEMPTION_PROCESSING,
            handler_id="assessor_001",
            handler_role=UserRole.ASSESSOR,
            notes="评估师提出异议"
        )
        
        self._add_audit_log(
            entity_type="FeeCalculation",
            entity_id="fee_004",
            action="DISPUTE",
            old_value="pending_review",
            new_value="disputed",
            operator_id="assessor_001",
            operator_role=UserRole.ASSESSOR,
            notes="评估师认为利息计算偏高"
        )
        
        self._add_audit_log(
            entity_type="RedemptionRecord",
            entity_id="redemption_004",
            action="DISPUTE",
            old_value="pending_finance",
            new_value="disputed",
            operator_id="customer_004",
            operator_role=UserRole.MANAGER,
            notes="客户对滞纳金有异议"
        )
        
        self._add_state_transition(
            entity_type="FeeCalculation",
            entity_id="fee_004",
            from_status="pending_review",
            to_status="disputed",
            triggered_by="assessor_001",
            trigger_role=UserRole.ASSESSOR,
            reason="利息计算争议"
        )
        
        self._add_state_transition(
            entity_type="PawnItem",
            entity_id="pawn_004",
            from_status="redemption_pending",
            to_status="disputed",
            triggered_by="customer_004",
            trigger_role=UserRole.MANAGER,
            reason="赎当争议"
        )
        
        return {
            "pawn_item": pawn_item,
            "fee_calculation": fee_calculation_disputed,
            "redemption": redemption_disputed
        }
    
    def _add_responsibility_chain(
        self,
        pawn_item_id: str,
        stage: ResponsibilityStage,
        handler_id: str,
        handler_role: UserRole,
        notes: str
    ):
        chain_id = f"chain_{len(self.responsibility_chains) + 1}"
        chain = ResponsibilityChain(
            id=chain_id,
            pawn_item_id=pawn_item_id,
            stage=stage,
            handler_id=handler_id,
            handler_role=handler_role,
            start_time=datetime.now(),
            notes=notes
        )
        self.responsibility_chains[chain_id] = chain
    
    def _add_audit_log(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        old_value: str,
        new_value: str,
        operator_id: str,
        operator_role: UserRole,
        notes: str = None
    ):
        log_id = f"log_{len(self.audit_logs) + 1}"
        log = AuditLog(
            id=log_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_value,
            new_value=new_value,
            operator_id=operator_id,
            operator_role=operator_role,
            timestamp=datetime.now(),
            notes=notes
        )
        self.audit_logs.append(log)
    
    def _add_state_transition(
        self,
        entity_type: str,
        entity_id: str,
        from_status: str,
        to_status: str,
        triggered_by: str,
        trigger_role: UserRole,
        reason: str
    ):
        transition_id = f"transition_{len(self.state_transitions) + 1}"
        transition = StateTransition(
            id=transition_id,
            entity_type=entity_type,
            entity_id=entity_id,
            from_status=from_status,
            to_status=to_status,
            triggered_by=triggered_by,
            trigger_role=trigger_role,
            timestamp=datetime.now(),
            reason=reason
        )
        self.state_transitions.append(transition)
    
    def generate_all_scenarios(self):
        """生成所有场景的样例数据"""
        normal = self.generate_normal_progress_scenario()
        return_supplement = self.generate_return_and_supplement_scenario()
        overdue = self.generate_overdue_unhandled_scenario()
        dispute = self.generate_dispute_scenario()
        
        return {
            "normal_progress": normal,
            "return_and_supplement": return_supplement,
            "overdue_unhandled": overdue,
            "dispute": dispute,
            "summary": {
                "total_pawn_items": len(self.pawn_items),
                "total_renewals": len(self.renewals),
                "total_redemptions": len(self.redemptions),
                "total_fee_calculations": len(self.fee_calculations),
                "total_responsibility_chains": len(self.responsibility_chains),
                "total_audit_logs": len(self.audit_logs),
                "total_state_transitions": len(self.state_transitions)
            }
        }
    
    def get_scenario_summary(self):
        """获取场景摘要"""
        return {
            "scenario_1_normal": {
                "description": "正常推进场景",
                "pawn_item_id": "pawn_001",
                "status": "已赎当",
                "key_events": [
                    "典当品评估",
                    "续当申请",
                    "费用计算",
                    "赎当完成"
                ],
                "responsibility_flow": [
                    "评估师 → 财务 → 库管 → 客户"
                ]
            },
            "scenario_2_return": {
                "description": "退回补充场景",
                "pawn_item_id": "pawn_002",
                "status": "待财务审核",
                "key_events": [
                    "续当申请",
                    "评估师退回（缺少材料）",
                    "补充材料",
                    "重新提交"
                ],
                "responsibility_flow": [
                    "评估师退回 → 客户补充 → 评估师审核 → 财务"
                ]
            },
            "scenario_3_overdue": {
                "description": "逾期未处理场景",
                "pawn_item_id": "pawn_003",
                "status": "逾期",
                "key_events": [
                    "典当品到期",
                    "系统标记逾期",
                    "费用计算（含滞纳金）",
                    "等待处理"
                ],
                "responsibility_flow": [
                    "系统自动标记 → 财务计算费用 → 等待客户处理"
                ]
            },
            "scenario_4_dispute": {
                "description": "责任争议场景",
                "pawn_item_id": "pawn_004",
                "status": "争议中",
                "key_events": [
                    "费用计算争议",
                    "评估师异议",
                    "客户异议",
                    "争议处理"
                ],
                "responsibility_flow": [
                    "财务计算 → 评估师异议 → 客户异议 → 管理层调解"
                ]
            }
        }


def generate_sample_data():
    """生成样例数据的便捷函数"""
    generator = SampleDataGenerator()
    all_data = generator.generate_all_scenarios()
    summary = generator.get_scenario_summary()
    
    return {
        "data": all_data,
        "summary": summary,
        "users": generator.users,
        "pawn_items": generator.pawn_items,
        "renewals": generator.renewals,
        "redemptions": generator.redemptions,
        "fee_calculations": generator.fee_calculations,
        "responsibility_chains": generator.responsibility_chains,
        "audit_logs": generator.audit_logs,
        "state_transitions": generator.state_transitions
    }


if __name__ == "__main__":
    sample_data = generate_sample_data()
    
    print("=" * 80)
    print("典当行续当赎当与费用计算系统 - 样例数据")
    print("=" * 80)
    
    print("\n场景摘要:")
    for scenario_id, scenario_info in sample_data["summary"].items():
        print(f"\n{scenario_id}: {scenario_info['description']}")
        print(f"  典当品ID: {scenario_info['pawn_item_id']}")
        print(f"  状态: {scenario_info['status']}")
        print(f"  关键事件: {', '.join(scenario_info['key_events'])}")
        print(f"  责任流转: {', '.join(scenario_info['responsibility_flow'])}")
    
    print("\n数据统计:")
    stats = sample_data["data"]["summary"]
    print(f"  典当品总数: {stats['total_pawn_items']}")
    print(f"  续当记录总数: {stats['total_renewals']}")
    print(f"  赎当记录总数: {stats['total_redemptions']}")
    print(f"  费用计算总数: {stats['total_fee_calculations']}")
    print(f"  责任链总数: {stats['total_responsibility_chains']}")
    print(f"  审计日志总数: {stats['total_audit_logs']}")
    print(f"  状态转换总数: {stats['total_state_transitions']}")
    
    print("\n用户信息:")
    for user_id, user in sample_data["users"].items():
        print(f"  {user_id}: {user.name} ({user.role.value}) - {user.department}")
    
    print("\n" + "=" * 80)
    print("样例数据生成完成")
    print("=" * 80)