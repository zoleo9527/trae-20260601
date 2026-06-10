import re
from datetime import datetime, timezone
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QHeaderView, QLabel, QGroupBox, QDateEdit, QTextEdit,
    QMessageBox, QDialog, QFormLayout, QComboBox,
)
from PyQt6.QtCore import Qt, QDate
from ..database import get_session
from ..models import (
    FeedingPlan, InventoryRequisition, Staff, FeedingPlanStatus,
    RequisitionStatus, RoleEnum, OperationLog,
)


ROLES = ["全部", RoleEnum.ranch_supervisor.value, RoleEnum.milker.value, RoleEnum.veterinarian.value]


def _elapsed(dt):
    if dt is None:
        return "-"
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    hours = int(diff.total_seconds() // 3600)
    minutes = int((diff.total_seconds() % 3600) // 60)
    if hours >= 24:
        days = hours // 24
        return f"{days}天{hours % 24}时"
    if hours > 0:
        return f"{hours}时{minutes}分"
    return f"{minutes}分钟"


def _urgency_color(hours):
    if hours >= 8:
        return Qt.GlobalColor.red
    if hours >= 4:
        return Qt.GlobalColor.darkYellow
    return Qt.GlobalColor.black


def _feeding_handler(plan):
    if plan.status in [FeedingPlanStatus.draft.value, FeedingPlanStatus.pending_approval.value]:
        if plan.creator:
            return plan.creator.name, plan.creator.role
        return "未知", "-"
    if plan.status in [FeedingPlanStatus.approved.value, FeedingPlanStatus.in_progress.value, FeedingPlanStatus.blocked.value]:
        if plan.assignee:
            return plan.assignee.name, plan.assignee.role
        if plan.approver:
            return plan.approver.name, plan.approver.role
        if plan.creator:
            return plan.creator.name, plan.creator.role
        return "未知", "-"
    return "-", "-"


def _req_handler(req):
    if req.status in [RequisitionStatus.requested.value, RequisitionStatus.pending_approval.value]:
        if req.requester:
            return req.requester.name, req.requester.role
        return "未知", "-"
    if req.status == RequisitionStatus.approved.value:
        return "待出库", "-"
    if req.status in [RequisitionStatus.issuing.value, RequisitionStatus.delayed.value]:
        if req.issuer_ref:
            return req.issuer_ref.name, req.issuer_ref.role
        if req.requester:
            return req.requester.name, req.requester.role
        return "未知", "-"
    return "-", "-"


def _feeding_role(plan):
    _, role = _feeding_handler(plan)
    return role if role != "-" else None


def _req_role(req):
    _, role = _req_handler(req)
    return role if role != "-" else None


def _count_by_role(items, role_fn):
    counts = {RoleEnum.ranch_supervisor.value: 0, RoleEnum.milker.value: 0, RoleEnum.veterinarian.value: 0}
    for item in items:
        role = role_fn(item)
        if role in counts:
            counts[role] += 1
    return counts


def _filter_by_role(items, role_filter, role_fn):
    if role_filter == "全部" or not role_filter:
        return items
    return [item for item in items if role_fn(item) == role_filter]


def _action_item_role(item, active_feeding, incomplete_req):
    fp_match = re.search(r"饲喂计划 #(\d+)", item)
    req_match = re.search(r"领用单 #(\d+)", item)
    if fp_match:
        fp_id = int(fp_match.group(1))
        for p in active_feeding:
            if p.id == fp_id:
                return _feeding_role(p)
    if req_match:
        req_id = int(req_match.group(1))
        for r in incomplete_req:
            if r.id == req_id:
                return _req_role(r)
    return None


class DashboardWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._current_operator_name = ""
        self._current_operator_role = ""
        self._current_operator_id = None
        self._role_filter = "全部"
        self._setup_ui()

    def set_operator(self, name, role, operator_id=None):
        self._current_operator_name = name
        self._current_operator_role = role
        self._current_operator_id = operator_id

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        header = QHBoxLayout()
        header.addWidget(QLabel("<h2>交班看板</h2>"))

        header.addWidget(QLabel("角色筛选:"))
        self.role_combo = QComboBox()
        for r in ROLES:
            self.role_combo.addItem(r, r)
        self.role_combo.currentIndexChanged.connect(self._on_role_changed)
        header.addWidget(self.role_combo)

        btn_refresh = QPushButton("刷新看板")
        btn_refresh.clicked.connect(self._refresh)
        header.addWidget(btn_refresh)
        header.addStretch()
        layout.addLayout(header)

        self.q1_group = QGroupBox("问题一：谁在处理？（牧场主管 / 挤奶员 / 兽医）")
        self.q1_layout = QVBoxLayout()
        self.q1_stats = QLabel("")
        self.q1_stats.setStyleSheet("font-size: 13px; font-weight: bold;")
        self.q1_layout.addWidget(self.q1_stats)
        self.q1_table = QTableWidget(0, 6)
        self.q1_table.setHorizontalHeaderLabels(["类型", "ID", "摘要", "当前处理人", "角色", "停留时长"])
        self.q1_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.q1_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.q1_table.setMaximumHeight(260)
        self.q1_layout.addWidget(self.q1_table)
        self.q1_group.setLayout(self.q1_layout)
        layout.addWidget(self.q1_group)

        self.q2_group = QGroupBox("问题二：饲喂计划卡在哪里？")
        self.q2_layout = QVBoxLayout()
        self.q2_stats = QLabel("")
        self.q2_stats.setStyleSheet("font-size: 13px; font-weight: bold;")
        self.q2_layout.addWidget(self.q2_stats)
        self.q2_table = QTableWidget(0, 7)
        self.q2_table.setHorizontalHeaderLabels(["ID", "计划日期", "牛群", "卡住原因", "阻塞领用单", "卡住时间", "停留时长"])
        self.q2_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.q2_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.q2_table.setMaximumHeight(260)
        self.q2_layout.addWidget(self.q2_table)
        self.q2_group.setLayout(self.q2_layout)
        layout.addWidget(self.q2_group)

        self.q3_group = QGroupBox("问题三：库存领用为什么还没完成？")
        self.q3_layout = QVBoxLayout()
        self.q3_stats = QLabel("")
        self.q3_stats.setStyleSheet("font-size: 13px; font-weight: bold;")
        self.q3_layout.addWidget(self.q3_stats)
        self.q3_table = QTableWidget(0, 7)
        self.q3_table.setHorizontalHeaderLabels(["ID", "物料", "申请/已出库", "状态", "延迟原因", "关联饲喂计划", "停留时长"])
        self.q3_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.q3_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.q3_table.setMaximumHeight(260)
        self.q3_layout.addWidget(self.q3_table)
        self.q3_group.setLayout(self.q3_layout)
        layout.addWidget(self.q3_group)

        handover_row = QHBoxLayout()
        btn_handover = QPushButton("生成交班记录")
        btn_handover.clicked.connect(self._generate_handover)
        handover_row.addWidget(btn_handover)
        handover_row.addStretch()
        layout.addLayout(handover_row)

        self._refresh()

    def _on_role_changed(self):
        self._role_filter = self.role_combo.currentData()
        self._refresh()

    def _refresh(self):
        session = get_session()
        self._load_q1(session)
        self._load_q2(session)
        self._load_q3(session)
        session.close()

    def _load_q1(self, session):
        all_feeding = session.query(FeedingPlan).filter(
            FeedingPlan.status.in_([
                FeedingPlanStatus.draft.value,
                FeedingPlanStatus.pending_approval.value,
                FeedingPlanStatus.approved.value,
                FeedingPlanStatus.in_progress.value,
                FeedingPlanStatus.blocked.value,
            ])
        ).all()
        all_req = session.query(InventoryRequisition).filter(
            InventoryRequisition.status.in_([
                RequisitionStatus.requested.value,
                RequisitionStatus.pending_approval.value,
                RequisitionStatus.approved.value,
                RequisitionStatus.issuing.value,
                RequisitionStatus.delayed.value,
            ])
        ).all()

        all_items = all_feeding + all_req
        counts = _count_by_role(all_feeding, _feeding_role)
        req_counts = _count_by_role(all_req, _req_role)
        for k, v in req_counts.items():
            counts[k] += v

        self.q1_stats.setText(
            f"角色待处理总数: 牧场主管 {counts[RoleEnum.ranch_supervisor.value]} | "
            f"挤奶员 {counts[RoleEnum.milker.value]} | "
            f"兽医 {counts[RoleEnum.veterinarian.value]} | "
            f"合计 {len(all_items)}"
        )

        filtered_feeding = _filter_by_role(all_feeding, self._role_filter, _feeding_role)
        filtered_req = _filter_by_role(all_req, self._role_filter, _req_role)

        rows = []
        for p in filtered_feeding:
            handler, role = _feeding_handler(p)
            elapsed = _elapsed(p.updated_at)
            rows.append(("饲喂计划", str(p.id), f"{p.cattle_group} - {p.feed_formula}({p.status})", handler, role, elapsed))

        for r in filtered_req:
            handler, role = _req_handler(r)
            elapsed = _elapsed(r.updated_at)
            rows.append(("库存领用", str(r.id), f"{r.item_name} {r.quantity_requested}{r.unit}({r.status})", handler, role, elapsed))

        self.q1_table.setRowCount(len(rows))
        for i, row in enumerate(rows):
            for j, val in enumerate(row):
                item = QTableWidgetItem(val)
                if j == 0 and val == "饲喂计划":
                    item.setForeground(Qt.GlobalColor.darkBlue)
                elif j == 0 and val == "库存领用":
                    item.setForeground(Qt.GlobalColor.darkMagenta)
                if j == 3 and val in ["待出库", "待审批"]:
                    item.setForeground(Qt.GlobalColor.darkYellow)
                if j == 5:
                    dt = None
                    if rows[i][0] == "饲喂计划":
                        plan = session.query(FeedingPlan).get(int(rows[i][1]))
                        dt = plan.updated_at if plan else None
                    else:
                        req = session.query(InventoryRequisition).get(int(rows[i][1]))
                        dt = req.updated_at if req else None
                    if dt:
                        now = datetime.now(timezone.utc)
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        hours = (now - dt).total_seconds() / 3600
                        item.setForeground(_urgency_color(hours))
                self.q1_table.setItem(i, j, item)

    def _load_q2(self, session):
        all_blocked = session.query(FeedingPlan).filter(
            FeedingPlan.status == FeedingPlanStatus.blocked.value
        ).all()
        counts = _count_by_role(all_blocked, _feeding_role)

        self.q2_stats.setText(
            f"卡点按角色: 牧场主管 {counts[RoleEnum.ranch_supervisor.value]} | "
            f"挤奶员 {counts[RoleEnum.milker.value]} | "
            f"兽医 {counts[RoleEnum.veterinarian.value]} | "
            f"合计 {len(all_blocked)}"
        )

        blocked = _filter_by_role(all_blocked, self._role_filter, _feeding_role)

        self.q2_table.setRowCount(len(blocked))
        for i, p in enumerate(blocked):
            self.q2_table.setItem(i, 0, QTableWidgetItem(str(p.id)))
            self.q2_table.setItem(i, 1, QTableWidgetItem(p.plan_date))
            self.q2_table.setItem(i, 2, QTableWidgetItem(p.cattle_group))
            reason_item = QTableWidgetItem(p.blocked_reason or "未标注")
            reason_item.setForeground(Qt.GlobalColor.red)
            self.q2_table.setItem(i, 3, reason_item)
            req_ref = f"#{p.blocking_requisition_id}" if p.blocking_requisition_id else "无关联领用单"
            self.q2_table.setItem(i, 4, QTableWidgetItem(req_ref))
            blocked_at = p.blocked_at.strftime("%m-%d %H:%M") if p.blocked_at else "-"
            self.q2_table.setItem(i, 5, QTableWidgetItem(blocked_at))
            elapsed_item = QTableWidgetItem(_elapsed(p.blocked_at))
            if p.blocked_at:
                now = datetime.now(timezone.utc)
                dt = p.blocked_at.replace(tzinfo=timezone.utc) if p.blocked_at.tzinfo is None else p.blocked_at
                hours = (now - dt).total_seconds() / 3600
                elapsed_item.setForeground(_urgency_color(hours))
            self.q2_table.setItem(i, 6, elapsed_item)

    def _load_q3(self, session):
        all_incomplete = session.query(InventoryRequisition).filter(
            InventoryRequisition.status.in_([
                RequisitionStatus.requested.value,
                RequisitionStatus.pending_approval.value,
                RequisitionStatus.approved.value,
                RequisitionStatus.issuing.value,
                RequisitionStatus.delayed.value,
            ])
        ).all()
        counts = _count_by_role(all_incomplete, _req_role)

        self.q3_stats.setText(
            f"未完成按角色: 牧场主管 {counts[RoleEnum.ranch_supervisor.value]} | "
            f"挤奶员 {counts[RoleEnum.milker.value]} | "
            f"兽医 {counts[RoleEnum.veterinarian.value]} | "
            f"合计 {len(all_incomplete)}"
        )

        incomplete = _filter_by_role(all_incomplete, self._role_filter, _req_role)

        self.q3_table.setRowCount(len(incomplete))
        for i, r in enumerate(incomplete):
            self.q3_table.setItem(i, 0, QTableWidgetItem(str(r.id)))
            self.q3_table.setItem(i, 1, QTableWidgetItem(r.item_name))
            self.q3_table.setItem(i, 2, QTableWidgetItem(f"{r.quantity_issued}/{r.quantity_requested} {r.unit}"))
            status_item = QTableWidgetItem(r.status)
            if r.status == RequisitionStatus.delayed.value:
                status_item.setForeground(Qt.GlobalColor.red)
            self.q3_table.setItem(i, 3, status_item)
            delay = r.delay_reason if r.delay_reason else (
                "领用未完成，尚未标注延迟原因" if r.status != RequisitionStatus.completed.value else ""
            )
            delay_item = QTableWidgetItem(delay)
            if r.status == RequisitionStatus.delayed.value:
                delay_item.setForeground(Qt.GlobalColor.red)
            self.q3_table.setItem(i, 4, delay_item)
            if r.feeding_plan_id:
                fp = session.query(FeedingPlan).get(r.feeding_plan_id)
                fp_status = f" #{r.feeding_plan_id}({fp.status})" if fp else f" #{r.feeding_plan_id}"
                fp_ref = fp_status
            else:
                fp_ref = "无关联"
            self.q3_table.setItem(i, 5, QTableWidgetItem(fp_ref))
            elapsed_item = QTableWidgetItem(_elapsed(r.updated_at))
            if r.updated_at:
                now = datetime.now(timezone.utc)
                dt = r.updated_at.replace(tzinfo=timezone.utc) if r.updated_at.tzinfo is None else r.updated_at
                hours = (now - dt).total_seconds() / 3600
                elapsed_item.setForeground(_urgency_color(hours))
            self.q3_table.setItem(i, 6, elapsed_item)

    def _generate_handover(self):
        session = get_session()

        active_feeding = session.query(FeedingPlan).filter(
            FeedingPlan.status.in_([
                FeedingPlanStatus.draft.value,
                FeedingPlanStatus.pending_approval.value,
                FeedingPlanStatus.approved.value,
                FeedingPlanStatus.in_progress.value,
                FeedingPlanStatus.blocked.value,
            ])
        ).all()
        incomplete_req = session.query(InventoryRequisition).filter(
            InventoryRequisition.status.in_([
                RequisitionStatus.requested.value,
                RequisitionStatus.pending_approval.value,
                RequisitionStatus.approved.value,
                RequisitionStatus.issuing.value,
                RequisitionStatus.delayed.value,
            ])
        ).all()

        now = datetime.now(timezone.utc)
        lines = []
        lines.append("=" * 60)
        lines.append(f"交班记录 - {QDate.currentDate().toString('yyyy-MM-dd')}")
        lines.append(f"生成时间: {now.strftime('%Y-%m-%d %H:%M')} UTC")
        lines.append(f"生成人: {self._current_operator_name or '系统'} ({self._current_operator_role or '-'})")
        lines.append("=" * 60)
        lines.append("")

        feeding_counts = _count_by_role(active_feeding, _feeding_role)
        req_counts = _count_by_role(incomplete_req, _req_role)
        total_counts = {}
        for role in ROLES[1:]:
            total_counts[role] = feeding_counts.get(role, 0) + req_counts.get(role, 0)
        lines.append("【角色待处理汇总】")
        lines.append(f"  牧场主管: {total_counts[RoleEnum.ranch_supervisor.value]} 项待处理")
        lines.append(f"  挤奶员: {total_counts[RoleEnum.milker.value]} 项待处理")
        lines.append(f"  兽医: {total_counts[RoleEnum.veterinarian.value]} 项待处理")
        lines.append("")

        lines.append("【按角色 - 牧场主管】")
        sup_feeding = _filter_by_role(active_feeding, RoleEnum.ranch_supervisor.value, _feeding_role)
        sup_req = _filter_by_role(incomplete_req, RoleEnum.ranch_supervisor.value, _req_role)
        if sup_feeding or sup_req:
            for p in sup_feeding:
                handler, role = _feeding_handler(p)
                elapsed = _elapsed(p.updated_at)
                lines.append(f"  饲喂计划 #{p.id} {p.cattle_group}({p.status}): {handler}({role}) [停留{elapsed}]")
            for r in sup_req:
                handler, role = _req_handler(r)
                elapsed = _elapsed(r.updated_at)
                lines.append(f"  领用单 #{r.id} {r.item_name}({r.status}): {handler}({role}) [停留{elapsed}]")
        else:
            lines.append("  无待处理事项")
        lines.append("")

        lines.append("【按角色 - 挤奶员】")
        mlk_feeding = _filter_by_role(active_feeding, RoleEnum.milker.value, _feeding_role)
        mlk_req = _filter_by_role(incomplete_req, RoleEnum.milker.value, _req_role)
        if mlk_feeding or mlk_req:
            for p in mlk_feeding:
                handler, role = _feeding_handler(p)
                elapsed = _elapsed(p.updated_at)
                lines.append(f"  饲喂计划 #{p.id} {p.cattle_group}({p.status}): {handler}({role}) [停留{elapsed}]")
            for r in mlk_req:
                handler, role = _req_handler(r)
                elapsed = _elapsed(r.updated_at)
                lines.append(f"  领用单 #{r.id} {r.item_name}({r.status}): {handler}({role}) [停留{elapsed}]")
        else:
            lines.append("  无待处理事项")
        lines.append("")

        lines.append("【按角色 - 兽医】")
        vet_feeding = _filter_by_role(active_feeding, RoleEnum.veterinarian.value, _feeding_role)
        vet_req = _filter_by_role(incomplete_req, RoleEnum.veterinarian.value, _req_role)
        if vet_feeding or vet_req:
            for p in vet_feeding:
                handler, role = _feeding_handler(p)
                elapsed = _elapsed(p.updated_at)
                lines.append(f"  饲喂计划 #{p.id} {p.cattle_group}({p.status}): {handler}({role}) [停留{elapsed}]")
            for r in vet_req:
                handler, role = _req_handler(r)
                elapsed = _elapsed(r.updated_at)
                lines.append(f"  领用单 #{r.id} {r.item_name}({r.status}): {handler}({role}) [停留{elapsed}]")
        else:
            lines.append("  无待处理事项")
        lines.append("")

        lines.append("【饲喂计划卡点】")
        blocked = [p for p in active_feeding if p.status == FeedingPlanStatus.blocked.value]
        if blocked:
            for p in blocked:
                req_ref = f" ← 领用单 #{p.blocking_requisition_id}" if p.blocking_requisition_id else ""
                elapsed = _elapsed(p.blocked_at)
                role = _feeding_role(p) or "-"
                lines.append(f"  [角色:{role}] #{p.id} {p.cattle_group}: {p.blocked_reason}{req_ref} [卡住{elapsed}]")
        else:
            lines.append("  当前无卡点")
        lines.append("")

        lines.append("【库存领用未完成】")
        if incomplete_req:
            delayed = [r for r in incomplete_req if r.status == RequisitionStatus.delayed.value]
            other = [r for r in incomplete_req if r.status != RequisitionStatus.delayed.value]
            if delayed:
                lines.append("  ⚠ 延迟项:")
                for r in delayed:
                    fp_ref = f"关联饲喂计划 #{r.feeding_plan_id}" if r.feeding_plan_id else "无关联饲喂计划"
                    elapsed = _elapsed(r.delayed_at)
                    role = _req_role(r) or "-"
                    lines.append(f"    [角色:{role}] #{r.id} {r.item_name}: {r.delay_reason} ({fp_ref}) [延迟{elapsed}]")
            if other:
                lines.append("  待处理项:")
                for r in other:
                    delay = r.delay_reason or "进行中"
                    fp_ref = f"关联饲喂计划 #{r.feeding_plan_id}" if r.feeding_plan_id else "无关联饲喂计划"
                    elapsed = _elapsed(r.updated_at)
                    role = _req_role(r) or "-"
                    lines.append(f"    [角色:{role}] #{r.id} {r.item_name}: {r.status} - {delay} ({fp_ref}) [停留{elapsed}]")
        else:
            lines.append("  全部已完成")
        lines.append("")

        lines.append("【待办行动项（按角色分组）】")
        action_items = []
        for p in blocked:
            if p.blocking_requisition_id:
                action_items.append(f"  □ 领用单 #{p.blocking_requisition_id} 恢复出库 → 自动解除饲喂计划 #{p.id} 卡点")
            else:
                action_items.append(f"  □ 饲喂计划 #{p.id} {p.cattle_group}: 确认卡点原因并处理")
        for r in incomplete_req:
            if r.status == RequisitionStatus.delayed.value:
                action_items.append(f"  □ 领用单 #{r.id} {r.item_name}: 解决延迟 ({r.delay_reason})")
            elif r.status == RequisitionStatus.pending_approval.value:
                action_items.append(f"  □ 领用单 #{r.id} {r.item_name}: 等待审批")
            elif r.status == RequisitionStatus.approved.value:
                action_items.append(f"  □ 领用单 #{r.id} {r.item_name}: 等待出库")
        for p in active_feeding:
            if p.status == FeedingPlanStatus.pending_approval.value:
                action_items.append(f"  □ 饲喂计划 #{p.id} {p.cattle_group}: 等待审批")
            if p.status == FeedingPlanStatus.approved.value:
                action_items.append(f"  □ 饲喂计划 #{p.id} {p.cattle_group}: 等待开始执行")

        if action_items:
            by_role = {}
            for item in action_items:
                role = _action_item_role(item, active_feeding, incomplete_req)
                role_key = role if role else "未明确"
                if role_key not in by_role:
                    by_role[role_key] = []
                by_role[role_key].append(item)

            role_order = [
                RoleEnum.ranch_supervisor.value,
                RoleEnum.milker.value,
                RoleEnum.veterinarian.value,
                "未明确",
            ]
            for role in role_order:
                if role in by_role:
                    lines.append(f"  {role}:")
                    for item in by_role[role]:
                        lines.append(item)
        else:
            lines.append("  无待办事项")
        lines.append("")

        lines.append("【责任链追溯】")
        for p in active_feeding:
            creator = p.creator.name if p.creator else "未知"
            approver = p.approver.name if p.approver else "未审批"
            if p.status in [FeedingPlanStatus.draft.value, FeedingPlanStatus.pending_approval.value]:
                assignee = creator
            else:
                if p.assignee:
                    assignee = p.assignee.name
                elif p.approver:
                    assignee = p.approver.name
                elif p.creator:
                    assignee = p.creator.name
                else:
                    assignee = "未知"
            chain = f"创建:{creator} → 审批:{approver} → 执行:{assignee}"
            reqs = session.query(InventoryRequisition).filter(
                InventoryRequisition.feeding_plan_id == p.id
            ).all()
            req_chain = ""
            if reqs:
                parts = []
                for rq in reqs:
                    requester = rq.requester.name if rq.requester else "?"
                    issuer = rq.issuer_ref.name if rq.issuer_ref else "未出库"
                    parts.append(f"领用#{rq.id}(申请:{requester},出库:{issuer},状态:{rq.status})")
                req_chain = " | " + ", ".join(parts)
            lines.append(f"  饲喂计划 #{p.id}: {chain}{req_chain}")

        text = "\n".join(lines)

        log = OperationLog(
            entity_type="system",
            entity_id=0,
            action="生成交班记录",
            operator_name=self._current_operator_name or "系统",
            operator_role=self._current_operator_role or "牧场主管",
            detail=text,
        )
        session.add(log)
        session.commit()
        session.close()

        dialog = QDialog(self)
        dialog.setWindowTitle("交班记录")
        dialog.setMinimumSize(750, 580)
        dlayout = QVBoxLayout(dialog)
        text_edit = QTextEdit()
        text_edit.setPlainText(text)
        text_edit.setReadOnly(True)
        dlayout.addWidget(text_edit)
        btn_close = QPushButton("关闭")
        btn_close.clicked.connect(dialog.accept)
        dlayout.addWidget(btn_close)
        dialog.exec()
