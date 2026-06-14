"""
审计日志系统
重点解决：责任追溯、操作记录、争议处理
"""

from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from models import (
    AuditLog, StateTransition, ResponsibilityChain,
    UserRole
)
import uuid
import json


class AuditService:
    def __init__(self):
        self.audit_logs: List[AuditLog] = []
        self.state_transitions: List[StateTransition] = []
        self.responsibility_chains: List[ResponsibilityChain] = []
    
    def log_operation(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        old_value: Optional[Any],
        new_value: Optional[Any],
        operator_id: str,
        operator_role: UserRole,
        notes: Optional[str] = None
    ) -> AuditLog:
        log_id = str(uuid.uuid4())
        
        old_value_str = json.dumps(old_value, ensure_ascii=False) if old_value else None
        new_value_str = json.dumps(new_value, ensure_ascii=False) if new_value else None
        
        log = AuditLog(
            id=log_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            old_value=old_value_str,
            new_value=new_value_str,
            operator_id=operator_id,
            operator_role=operator_role,
            timestamp=datetime.now(),
            notes=notes
        )
        
        self.audit_logs.append(log)
        return log
    
    def log_state_change(
        self,
        entity_type: str,
        entity_id: str,
        from_status: str,
        to_status: str,
        triggered_by: str,
        trigger_role: UserRole,
        reason: Optional[str] = None
    ) -> StateTransition:
        transition_id = str(uuid.uuid4())
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
        return transition
    
    def record_responsibility(
        self,
        pawn_item_id: str,
        stage: str,
        handler_id: str,
        handler_role: UserRole,
        notes: Optional[str] = None
    ) -> ResponsibilityChain:
        chain_id = str(uuid.uuid4())
        chain = ResponsibilityChain(
            id=chain_id,
            pawn_item_id=pawn_item_id,
            stage=stage,
            handler_id=handler_id,
            handler_role=handler_role,
            start_time=datetime.now(),
            notes=notes
        )
        
        self.responsibility_chains.append(chain)
        return chain
    
    def complete_responsibility(
        self,
        chain_id: str,
        notes: Optional[str] = None
    ) -> Optional[ResponsibilityChain]:
        for chain in self.responsibility_chains:
            if chain.id == chain_id:
                chain.end_time = datetime.now()
                chain.status = "completed"
                if notes:
                    chain.notes = notes
                return chain
        return None
    
    def query_audit_logs(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        operator_id: Optional[str] = None,
        operator_role: Optional[UserRole] = None,
        action: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[AuditLog]:
        results = []
        
        for log in self.audit_logs:
            if entity_type and log.entity_type != entity_type:
                continue
            if entity_id and log.entity_id != entity_id:
                continue
            if operator_id and log.operator_id != operator_id:
                continue
            if operator_role and log.operator_role != operator_role:
                continue
            if action and log.action != action:
                continue
            if start_date and log.timestamp.date() < start_date:
                continue
            if end_date and log.timestamp.date() > end_date:
                continue
            
            results.append(log)
        
        return sorted(results, key=lambda x: x.timestamp, reverse=True)
    
    def query_state_transitions(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        triggered_by: Optional[str] = None,
        trigger_role: Optional[UserRole] = None,
        from_status: Optional[str] = None,
        to_status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[StateTransition]:
        results = []
        
        for transition in self.state_transitions:
            if entity_type and transition.entity_type != entity_type:
                continue
            if entity_id and transition.entity_id != entity_id:
                continue
            if triggered_by and transition.triggered_by != triggered_by:
                continue
            if trigger_role and transition.trigger_role != trigger_role:
                continue
            if from_status and transition.from_status != from_status:
                continue
            if to_status and transition.to_status != to_status:
                continue
            if start_date and transition.timestamp.date() < start_date:
                continue
            if end_date and transition.timestamp.date() > end_date:
                continue
            
            results.append(transition)
        
        return sorted(results, key=lambda x: x.timestamp, reverse=True)
    
    def query_responsibility_chains(
        self,
        pawn_item_id: Optional[str] = None,
        stage: Optional[str] = None,
        handler_id: Optional[str] = None,
        handler_role: Optional[UserRole] = None,
        status: Optional[str] = None
    ) -> List[ResponsibilityChain]:
        results = []
        
        for chain in self.responsibility_chains:
            if pawn_item_id and chain.pawn_item_id != pawn_item_id:
                continue
            if stage and chain.stage != stage:
                continue
            if handler_id and chain.handler_id != handler_id:
                continue
            if handler_role and chain.handler_role != handler_role:
                continue
            if status and chain.status != status:
                continue
            
            results.append(chain)
        
        return sorted(results, key=lambda x: x.start_time, reverse=True)
    
    def get_entity_audit_trail(
        self,
        entity_type: str,
        entity_id: str
    ) -> Dict[str, Any]:
        audit_logs = self.query_audit_logs(entity_type=entity_type, entity_id=entity_id)
        state_transitions = self.query_state_transitions(entity_type=entity_type, entity_id=entity_id)
        
        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "audit_logs": [
                {
                    "id": log.id,
                    "action": log.action,
                    "old_value": log.old_value,
                    "new_value": log.new_value,
                    "operator_id": log.operator_id,
                    "operator_role": log.operator_role.value,
                    "timestamp": log.timestamp.isoformat(),
                    "notes": log.notes
                }
                for log in audit_logs
            ],
            "state_transitions": [
                {
                    "id": transition.id,
                    "from_status": transition.from_status,
                    "to_status": transition.to_status,
                    "triggered_by": transition.triggered_by,
                    "trigger_role": transition.trigger_role.value,
                    "timestamp": transition.timestamp.isoformat(),
                    "reason": transition.reason
                }
                for transition in state_transitions
            ]
        }
    
    def get_responsibility_report(
        self,
        pawn_item_id: str
    ) -> Dict[str, Any]:
        chains = self.query_responsibility_chains(pawn_item_id=pawn_item_id)
        
        stages = {}
        for chain in chains:
            stage_name = chain.stage.value if hasattr(chain.stage, 'value') else chain.stage
            if stage_name not in stages:
                stages[stage_name] = []
            
            duration = None
            if chain.end_time:
                duration = (chain.end_time - chain.start_time).total_seconds()
            
            stages[stage_name].append({
                "handler_id": chain.handler_id,
                "handler_role": chain.handler_role.value,
                "start_time": chain.start_time.isoformat(),
                "end_time": chain.end_time.isoformat() if chain.end_time else None,
                "duration_seconds": duration,
                "status": chain.status,
                "notes": chain.notes
            })
        
        return {
            "pawn_item_id": pawn_item_id,
            "responsibility_stages": stages,
            "total_handlers": len(chains),
            "active_handlers": len([c for c in chains if c.status == "active"]),
            "completed_handlers": len([c for c in chains if c.status == "completed"])
        }
    
    def get_dispute_evidence(
        self,
        entity_type: str,
        entity_id: str
    ) -> Dict[str, Any]:
        audit_trail = self.get_entity_audit_trail(entity_type, entity_id)
        
        all_logs = self.query_audit_logs(entity_type=entity_type, entity_id=entity_id)
        dispute_logs = [log for log in all_logs if log.action in ["DISPUTE", "REJECT", "RECALCULATE"]]
        
        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "audit_trail": audit_trail,
            "dispute_records": [
                {
                    "action": log.action,
                    "timestamp": log.timestamp.isoformat(),
                    "operator_id": log.operator_id,
                    "operator_role": log.operator_role.value,
                    "details": log.notes
                }
                for log in dispute_logs
            ],
            "timeline": sorted(
                audit_trail["audit_logs"] + audit_trail["state_transitions"],
                key=lambda x: x["timestamp"]
            )
        }
    
    def export_audit_logs(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        entity_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        logs = self.query_audit_logs(
            entity_type=entity_type,
            start_date=start_date,
            end_date=end_date
        )
        
        return [
            {
                "id": log.id,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "action": log.action,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "operator_id": log.operator_id,
                "operator_role": log.operator_role.value,
                "timestamp": log.timestamp.isoformat(),
                "notes": log.notes
            }
            for log in logs
        ]
    
    def get_statistics(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        logs = self.query_audit_logs(start_date=start_date, end_date=end_date)
        transitions = self.query_state_transitions(start_date=start_date, end_date=end_date)
        
        action_counts = {}
        for log in logs:
            action_counts[log.action] = action_counts.get(log.action, 0) + 1
        
        operator_counts = {}
        for log in logs:
            operator_counts[log.operator_id] = operator_counts.get(log.operator_id, 0) + 1
        
        role_counts = {}
        for log in logs:
            role_name = log.operator_role.value
            role_counts[role_name] = role_counts.get(role_name, 0) + 1
        
        status_transitions = {}
        for transition in transitions:
            key = f"{transition.from_status} -> {transition.to_status}"
            status_transitions[key] = status_transitions.get(key, 0) + 1
        
        return {
            "total_operations": len(logs),
            "total_transitions": len(transitions),
            "action_breakdown": action_counts,
            "operator_breakdown": operator_counts,
            "role_breakdown": role_counts,
            "status_transition_breakdown": status_transitions,
            "date_range": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            }
        }