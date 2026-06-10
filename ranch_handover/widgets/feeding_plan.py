from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QHeaderView, QComboBox, QLabel, QLineEdit,
    QDialog, QFormLayout, QDateEdit, QTextEdit, QMessageBox, QGroupBox,
    QSpinBox, QDoubleSpinBox,
)
from PyQt6.QtCore import Qt, QDate
from ..database import get_session
from ..models import FeedingPlan, InventoryRequisition, Staff, RoleEnum, FeedingPlanStatus, RequisitionStatus, OperationLog
from ..state_machine import transition_feeding, FEEDING_TRANSITIONS, check_feeding_completion


def _feeding_handler(plan, session):
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


class FeedingPlanWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._current_operator_name = ""
        self._current_operator_role = ""
        self._current_operator_id = None
        self._setup_ui()

    def set_operator(self, name, role, operator_id=None):
        self._current_operator_name = name
        self._current_operator_role = role
        self._current_operator_id = operator_id

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        toolbar = QHBoxLayout()
        toolbar.addWidget(QLabel("日期筛选:"))
        self.date_filter = QDateEdit()
        self.date_filter.setCalendarPopup(True)
        self.date_filter.setDate(QDate.currentDate())
        self.date_filter.setDisplayFormat("yyyy-MM-dd")
        toolbar.addWidget(self.date_filter)

        self.status_filter = QComboBox()
        self.status_filter.addItem("全部状态", "")
        for s in FeedingPlanStatus:
            self.status_filter.addItem(s.value, s.value)
        toolbar.addWidget(QLabel("状态:"))
        toolbar.addWidget(self.status_filter)

        btn_refresh = QPushButton("刷新")
        btn_refresh.clicked.connect(self._refresh)
        toolbar.addWidget(btn_refresh)

        btn_create = QPushButton("新建饲喂计划")
        btn_create.clicked.connect(self._create_plan)
        toolbar.addWidget(btn_create)
        toolbar.addStretch()
        layout.addLayout(toolbar)

        self.table = QTableWidget(0, 9)
        self.table.setHorizontalHeaderLabels([
            "ID", "计划日期", "牛群", "饲料配方", "数量/单位",
            "状态", "负责人", "关联领用单", "操作",
        ])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.table)

        self._refresh()

    def _refresh(self):
        session = get_session()
        query = session.query(FeedingPlan)
        date_str = self.date_filter.date().toString("yyyy-MM-dd")
        status_val = self.status_filter.currentData()
        query = query.filter(FeedingPlan.plan_date == date_str)
        if status_val:
            query = query.filter(FeedingPlan.status == status_val)
        plans = query.order_by(FeedingPlan.id.desc()).all()

        self.table.setRowCount(len(plans))
        for row, p in enumerate(plans):
            handler, handler_role = _feeding_handler(p, session)
            self.table.setItem(row, 0, QTableWidgetItem(str(p.id)))
            self.table.setItem(row, 1, QTableWidgetItem(p.plan_date))
            self.table.setItem(row, 2, QTableWidgetItem(p.cattle_group))
            self.table.setItem(row, 3, QTableWidgetItem(p.feed_formula))
            self.table.setItem(row, 4, QTableWidgetItem(f"{p.quantity} {p.unit}"))
            status_item = QTableWidgetItem(p.status)
            if p.status == FeedingPlanStatus.blocked.value:
                status_item.setForeground(Qt.GlobalColor.red)
            elif p.status == FeedingPlanStatus.completed.value:
                status_item.setForeground(Qt.GlobalColor.darkGreen)
            self.table.setItem(row, 5, status_item)
            self.table.setItem(row, 6, QTableWidgetItem(handler))

            delayed = 0
            reqs = session.query(InventoryRequisition).filter(
                InventoryRequisition.feeding_plan_id == p.id
            ).all()
            if reqs:
                completed = sum(1 for r in reqs if r.status == RequisitionStatus.completed.value)
                delayed = sum(1 for r in reqs if r.status == RequisitionStatus.delayed.value)
                parts = [f"{completed}/{len(reqs)}完成"]
                if delayed:
                    parts.append(f"{delayed}延迟")
                req_summary = ", ".join(parts)
            else:
                req_summary = "无"
            req_item = QTableWidgetItem(req_summary)
            if delayed > 0:
                req_item.setForeground(Qt.GlobalColor.red)
            self.table.setItem(row, 7, req_item)

            btn_widget = QWidget()
            btn_layout = QHBoxLayout(btn_widget)
            btn_layout.setContentsMargins(2, 2, 2, 2)

            btn_transition = QPushButton("变更状态")
            btn_transition.clicked.connect(lambda checked, pid=p.id: self._transition_dialog(pid))
            btn_layout.addWidget(btn_transition)

            if p.status == FeedingPlanStatus.blocked.value:
                btn_resolve = QPushButton("解除卡点")
                btn_resolve.clicked.connect(lambda checked, pid=p.id: self._resolve_blockage(pid))
                btn_layout.addWidget(btn_resolve)

            if reqs and p.status in [FeedingPlanStatus.in_progress.value, FeedingPlanStatus.approved.value]:
                btn_check = QPushButton("检查领用")
                btn_check.clicked.connect(lambda checked, pid=p.id: self._check_requisitions(pid))
                btn_layout.addWidget(btn_check)

            self.table.setCellWidget(row, 8, btn_widget)
        session.close()

    def _create_plan(self):
        session = get_session()
        dialog = _FeedingPlanDialog(parent=self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_data()
            plan = FeedingPlan(
                plan_date=data["plan_date"],
                cattle_group=data["cattle_group"],
                feed_formula=data["feed_formula"],
                quantity=data["quantity"],
                unit=data["unit"],
                status=FeedingPlanStatus.draft.value,
                created_by=self._current_operator_id,
            )
            session.add(plan)
            session.commit()

            log = OperationLog(
                entity_type="feeding_plan",
                entity_id=plan.id,
                action="创建饲喂计划",
                operator_name=self._current_operator_name or "系统",
                operator_role=self._current_operator_role or "牧场主管",
                detail=f"创建饲喂计划 #{plan.id}: {plan.cattle_group} {plan.feed_formula} {plan.quantity}{plan.unit} | 创建人自动写入: {self._current_operator_name or '系统'}",
            )
            session.add(log)
            session.commit()
            session.close()
            self._refresh()
        else:
            session.close()

    def _transition_dialog(self, plan_id):
        session = get_session()
        plan = session.query(FeedingPlan).get(plan_id)
        if not plan:
            session.close()
            return
        allowed = FEEDING_TRANSITIONS.get(plan.status, [])
        if not allowed:
            QMessageBox.information(self, "提示", f"当前状态 [{plan.status}] 无法继续变更")
            session.close()
            return

        reqs = session.query(InventoryRequisition).filter(
            InventoryRequisition.feeding_plan_id == plan.id
        ).all()
        dialog = _TransitionDialog(plan, allowed, reqs, parent=self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            new_status, reason, blocking_req_id = dialog.get_data()
            ok, msg = transition_feeding(
                plan, new_status,
                self._current_operator_name or "系统", self._current_operator_role or "牧场主管",
                reason, blocking_req_id,
                operator_id=self._current_operator_id,
            )
            if not ok:
                QMessageBox.warning(self, "状态变更失败", msg)
            session.commit()
            session.close()
            self._refresh()
        else:
            session.close()

    def _resolve_blockage(self, plan_id):
        session = get_session()
        plan = session.query(FeedingPlan).get(plan_id)
        if not plan:
            session.close()
            return
        ok, msg = transition_feeding(
            plan, FeedingPlanStatus.in_progress.value,
            self._current_operator_name or "系统", self._current_operator_role or "牧场主管",
            reason="解除卡点，恢复执行",
            operator_id=self._current_operator_id,
        )
        if not ok:
            QMessageBox.warning(self, "解除失败", msg)
        session.commit()
        session.close()
        self._refresh()

    def _check_requisitions(self, plan_id):
        session = get_session()
        ok, msg = check_feeding_completion(session.query(FeedingPlan).get(plan_id), session)
        if ok:
            QMessageBox.information(self, "检查结果", "所有关联领用单已完成，饲喂计划可以标记完成")
        else:
            QMessageBox.warning(self, "检查结果", f"存在未完成领用单，无法标记完成:\n{msg}")
        session.close()


class _FeedingPlanDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("新建饲喂计划")
        self.setMinimumWidth(400)
        layout = QFormLayout(self)

        self.plan_date = QDateEdit()
        self.plan_date.setCalendarPopup(True)
        self.plan_date.setDate(QDate.currentDate())
        self.plan_date.setDisplayFormat("yyyy-MM-dd")
        layout.addRow("计划日期:", self.plan_date)

        self.cattle_group = QComboBox()
        self.cattle_group.setEditable(True)
        self.cattle_group.addItems(["泌乳牛群", "干奶牛群", "育成牛群", "犊牛群", "病牛群"])
        layout.addRow("牛群:", self.cattle_group)

        self.feed_formula = QComboBox()
        self.feed_formula.setEditable(True)
        self.feed_formula.addItems(["TMR全混合日粮", "精料补充料", "粗饲料为主", "犊牛代乳料", "病牛特配料"])
        layout.addRow("饲料配方:", self.feed_formula)

        self.quantity = QDoubleSpinBox()
        self.quantity.setRange(0, 99999)
        self.quantity.setDecimals(1)
        self.quantity.setValue(100.0)
        layout.addRow("数量:", self.quantity)

        self.unit = QComboBox()
        self.unit.setEditable(True)
        self.unit.addItems(["kg", "吨", "包", "桶"])
        layout.addRow("单位:", self.unit)

        btn_layout = QHBoxLayout()
        btn_ok = QPushButton("确定")
        btn_ok.clicked.connect(self.accept)
        btn_cancel = QPushButton("取消")
        btn_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(btn_ok)
        btn_layout.addWidget(btn_cancel)
        layout.addRow(btn_layout)

    def get_data(self):
        return {
            "plan_date": self.plan_date.date().toString("yyyy-MM-dd"),
            "cattle_group": self.cattle_group.currentText(),
            "feed_formula": self.feed_formula.currentText(),
            "quantity": self.quantity.value(),
            "unit": self.unit.currentText(),
        }


class _TransitionDialog(QDialog):
    def __init__(self, plan, allowed_statuses, requisitions, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"饲喂计划 #{plan.id} 状态变更")
        self.setMinimumWidth(400)
        layout = QFormLayout(self)

        layout.addRow("当前状态:", QLabel(plan.status))
        if plan.blocked_reason:
            layout.addRow("卡住原因:", QLabel(plan.blocked_reason))
        if plan.blocking_requisition_id:
            layout.addRow("阻塞领用单:", QLabel(f"#{plan.blocking_requisition_id}"))

        self.new_status = QComboBox()
        for s in allowed_statuses:
            self.new_status.addItem(s, s)
        self.new_status.currentIndexChanged.connect(self._on_status_changed)
        layout.addRow("变更为:", self.new_status)

        self.reason = QTextEdit()
        self.reason.setPlaceholderText("输入原因（卡住时必填，不能为空）")
        self.reason.setMaximumHeight(80)
        layout.addRow("原因:", self.reason)

        self.blocking_req_combo = QComboBox()
        self.blocking_req_combo.addItem("无关联领用单", None)
        for r in requisitions:
            self.blocking_req_combo.addItem(f"#{r.id} {r.item_name} ({r.status})", r.id)
        self.blocking_req_label = QLabel("阻塞领用单:")
        layout.addRow(self.blocking_req_label, self.blocking_req_combo)
        self.blocking_req_combo.setVisible(False)
        self.blocking_req_label.setVisible(False)

        if requisitions:
            req_summary = ", ".join(f"#{r.id}({r.status})" for r in requisitions)
            layout.addRow("关联领用单状态:", QLabel(req_summary))

        btn_layout = QHBoxLayout()
        btn_ok = QPushButton("确定")
        btn_ok.clicked.connect(self._validate_and_accept)
        btn_cancel = QPushButton("取消")
        btn_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(btn_ok)
        btn_layout.addWidget(btn_cancel)
        layout.addRow(btn_layout)

        self._on_status_changed()

    def _on_status_changed(self):
        target = self.new_status.currentData()
        is_blocked = target == FeedingPlanStatus.blocked.value
        self.blocking_req_combo.setVisible(is_blocked)
        self.blocking_req_label.setVisible(is_blocked)

    def _validate_and_accept(self):
        target = self.new_status.currentData()
        if target == FeedingPlanStatus.blocked.value:
            if not self.reason.toPlainText().strip():
                QMessageBox.warning(self, "必填校验", "卡点原因为必填项，不能为空")
                return
        self.accept()

    def get_data(self):
        return self.new_status.currentData(), self.reason.toPlainText().strip(), self.blocking_req_combo.currentData()
