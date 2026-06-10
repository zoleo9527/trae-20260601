from datetime import datetime, timezone
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QHeaderView, QComboBox, QLabel, QDateEdit,
    QDialog, QFormLayout, QTextEdit, QMessageBox, QDoubleSpinBox,
    QGroupBox,
)
from PyQt6.QtCore import Qt, QDate
from ..database import get_session
from ..models import InventoryRequisition, FeedingPlan, FeedingPlanStatus, Staff, RequisitionStatus, OperationLog
from ..state_machine import transition_requisition, REQUISITION_TRANSITIONS


def _req_handler(req, session):
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


class InventoryWidget(QWidget):
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
        for s in RequisitionStatus:
            self.status_filter.addItem(s.value, s.value)
        toolbar.addWidget(QLabel("状态:"))
        toolbar.addWidget(self.status_filter)

        btn_refresh = QPushButton("刷新")
        btn_refresh.clicked.connect(self._refresh)
        toolbar.addWidget(btn_refresh)

        btn_create = QPushButton("新建领用申请")
        btn_create.clicked.connect(self._create_requisition)
        toolbar.addWidget(btn_create)
        toolbar.addStretch()
        layout.addLayout(toolbar)

        self.table = QTableWidget(0, 10)
        self.table.setHorizontalHeaderLabels([
            "ID", "关联饲喂计划", "饲喂计划状态", "物料名称", "规格",
            "申请数量", "已出库数量", "单位", "状态", "操作",
        ])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.table)

        self._refresh()

    def _refresh(self):
        session = get_session()
        query = session.query(InventoryRequisition)
        status_val = self.status_filter.currentData()
        if status_val:
            query = query.filter(InventoryRequisition.status == status_val)
        reqs = query.order_by(InventoryRequisition.id.desc()).all()

        self.table.setRowCount(len(reqs))
        for row, r in enumerate(reqs):
            fp_ref = f"#{r.feeding_plan_id}" if r.feeding_plan_id else "无关联"
            fp_status = ""
            if r.feeding_plan_id:
                fp = session.query(FeedingPlan).get(r.feeding_plan_id)
                fp_status = fp.status if fp else "-"
            self.table.setItem(row, 0, QTableWidgetItem(str(r.id)))
            self.table.setItem(row, 1, QTableWidgetItem(fp_ref))
            fp_status_item = QTableWidgetItem(fp_status)
            if fp_status == FeedingPlanStatus.blocked.value:
                fp_status_item.setForeground(Qt.GlobalColor.red)
            self.table.setItem(row, 2, fp_status_item)
            self.table.setItem(row, 3, QTableWidgetItem(r.item_name))
            self.table.setItem(row, 4, QTableWidgetItem(r.spec or "-"))
            self.table.setItem(row, 5, QTableWidgetItem(str(r.quantity_requested)))
            self.table.setItem(row, 6, QTableWidgetItem(str(r.quantity_issued)))
            self.table.setItem(row, 7, QTableWidgetItem(r.unit))
            status_item = QTableWidgetItem(r.status)
            if r.status == RequisitionStatus.delayed.value:
                status_item.setForeground(Qt.GlobalColor.red)
            elif r.status == RequisitionStatus.completed.value:
                status_item.setForeground(Qt.GlobalColor.darkGreen)
            self.table.setItem(row, 8, status_item)

            btn_widget = QWidget()
            btn_layout = QHBoxLayout(btn_widget)
            btn_layout.setContentsMargins(2, 2, 2, 2)

            btn_transition = QPushButton("变更状态")
            btn_transition.clicked.connect(lambda checked, rid=r.id: self._transition_dialog(rid))
            btn_layout.addWidget(btn_transition)

            btn_record_issuance = QPushButton("登记出库")
            btn_record_issuance.clicked.connect(lambda checked, rid=r.id: self._record_issuance(rid))
            btn_layout.addWidget(btn_record_issuance)

            self.table.setCellWidget(row, 9, btn_widget)
        session.close()

    def _create_requisition(self):
        session = get_session()
        plan_list = session.query(FeedingPlan).filter(
            FeedingPlan.status.in_([
                FeedingPlanStatus.approved.value,
                FeedingPlanStatus.in_progress.value,
            ])
        ).all()
        dialog = _RequisitionDialog(plan_list, parent=self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            data = dialog.get_data()
            req = InventoryRequisition(
                feeding_plan_id=data.get("feeding_plan_id"),
                item_name=data["item_name"],
                spec=data.get("spec"),
                quantity_requested=data["quantity_requested"],
                unit=data["unit"],
                status=RequisitionStatus.requested.value,
                requested_by=self._current_operator_id,
            )
            session.add(req)
            session.commit()

            log = OperationLog(
                entity_type="inventory_requisition",
                entity_id=req.id,
                action="创建领用申请",
                operator_name=self._current_operator_name or "系统",
                operator_role=self._current_operator_role or "牧场主管",
                detail=f"创建领用申请 #{req.id}: {req.item_name} {req.quantity_requested}{req.unit}"
                       + (f" (关联饲喂计划 #{req.feeding_plan_id})" if req.feeding_plan_id else "")
                       + f" | 申请人自动写入: {self._current_operator_name or '系统'}",
            )
            session.add(log)
            session.commit()
            session.close()
            self._refresh()
        else:
            session.close()

    def _transition_dialog(self, req_id):
        session = get_session()
        req = session.query(InventoryRequisition).get(req_id)
        if not req:
            session.close()
            return
        allowed = REQUISITION_TRANSITIONS.get(req.status, [])
        if not allowed:
            QMessageBox.information(self, "提示", f"当前状态 [{req.status}] 无法继续变更")
            session.close()
            return

        dialog = _ReqTransitionDialog(req, allowed, parent=self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            new_status, reason = dialog.get_data()
            ok, msg = transition_requisition(
                req, new_status,
                self._current_operator_name or "系统", self._current_operator_role or "牧场主管",
                reason, operator_id=self._current_operator_id,
            )
            if not ok:
                QMessageBox.warning(self, "状态变更失败", msg)
            else:
                if new_status == RequisitionStatus.delayed.value and req.feeding_plan_id:
                    affected = session.query(FeedingPlan).filter(
                        FeedingPlan.blocking_requisition_id == req.id,
                        FeedingPlan.status == FeedingPlanStatus.blocked.value,
                    ).all()
                    if affected:
                        ids = ", ".join(f"#{p.id}" for p in affected)
                        QMessageBox.information(self, "自动联动", f"已自动卡住关联饲喂计划: {ids}\n领用单恢复出库后饲喂计划将自动解除卡点")
            session.commit()
            session.close()
            self._refresh()
        else:
            session.close()

    def _record_issuance(self, req_id):
        session = get_session()
        req = session.query(InventoryRequisition).get(req_id)
        if not req:
            session.close()
            return
        if req.status not in [RequisitionStatus.approved.value, RequisitionStatus.issuing.value]:
            QMessageBox.warning(self, "无法登记", "只有已审批或出库中的领用单可以登记出库")
            session.close()
            return

        dialog = _IssuanceDialog(req, parent=self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            issued_qty = dialog.get_issued_qty()
            req.quantity_issued += issued_qty
            req.updated_at = datetime.now(timezone.utc)
            if req.quantity_issued >= req.quantity_requested:
                req.status = RequisitionStatus.completed.value
            elif req.status == RequisitionStatus.approved.value:
                req.status = RequisitionStatus.issuing.value
                req.issued_by = self._current_operator_id

            log = OperationLog(
                entity_type="inventory_requisition",
                entity_id=req.id,
                action=f"登记出库 {issued_qty}{req.unit}",
                operator_name=self._current_operator_name or "系统",
                operator_role=self._current_operator_role or "牧场主管",
                detail=f"领用 #{req.id} 出库 {issued_qty}{req.unit}, 累计 {req.quantity_issued}/{req.quantity_requested}"
                       + (f" | 出库人自动写入: {self._current_operator_name or '系统'}" if self._current_operator_id and req.issued_by == self._current_operator_id else ""),
            )
            session.add(log)
            session.commit()
            session.close()
            self._refresh()
        else:
            session.close()


class _RequisitionDialog(QDialog):
    def __init__(self, plan_list, parent=None):
        super().__init__(parent)
        self.setWindowTitle("新建领用申请")
        self.setMinimumWidth(420)
        layout = QFormLayout(self)

        self.feeding_plan = QComboBox()
        self.feeding_plan.addItem("无关联", None)
        for p in plan_list:
            self.feeding_plan.addItem(f"#{p.id} {p.cattle_group} - {p.feed_formula} ({p.status})", p.id)
        layout.addRow("关联饲喂计划:", self.feeding_plan)

        self.item_name = QComboBox()
        self.item_name.setEditable(True)
        self.item_name.addItems(["精料", "粗饲料", "青贮", "矿物补充料", "维生素预混料", "犊牛代乳粉", "药品", "消毒剂"])
        layout.addRow("物料名称:", self.item_name)

        self.spec = QComboBox()
        self.spec.setEditable(True)
        self.spec.addItems(["25kg/包", "50kg/包", "散装", "1L/瓶", "5L/桶"])
        layout.addRow("规格:", self.spec)

        self.quantity_requested = QDoubleSpinBox()
        self.quantity_requested.setRange(0, 99999)
        self.quantity_requested.setDecimals(1)
        self.quantity_requested.setValue(50.0)
        layout.addRow("申请数量:", self.quantity_requested)

        self.unit = QComboBox()
        self.unit.setEditable(True)
        self.unit.addItems(["kg", "吨", "包", "桶", "瓶"])
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
            "feeding_plan_id": self.feeding_plan.currentData(),
            "item_name": self.item_name.currentText(),
            "spec": self.spec.currentText(),
            "quantity_requested": self.quantity_requested.value(),
            "unit": self.unit.currentText(),
        }


class _ReqTransitionDialog(QDialog):
    def __init__(self, req, allowed_statuses, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"领用单 #{req.id} 状态变更")
        self.setMinimumWidth(400)
        layout = QFormLayout(self)

        layout.addRow("当前状态:", QLabel(req.status))
        if req.delay_reason:
            layout.addRow("延迟原因:", QLabel(req.delay_reason))
        if req.feeding_plan_id:
            layout.addRow("关联饲喂计划:", QLabel(f"#{req.feeding_plan_id}"))

        self.new_status = QComboBox()
        for s in allowed_statuses:
            self.new_status.addItem(s, s)
        self.new_status.currentIndexChanged.connect(self._on_status_changed)
        layout.addRow("变更为:", self.new_status)

        self.reason = QTextEdit()
        self.reason.setPlaceholderText("输入原因（延迟时必填，不能为空）")
        self.reason.setMaximumHeight(80)
        layout.addRow("原因:", self.reason)

        self.auto_block_label = QLabel("")
        self.auto_block_label.setWordWrap(True)
        layout.addRow(self.auto_block_label)

        btn_layout = QHBoxLayout()
        btn_ok = QPushButton("确定")
        btn_ok.clicked.connect(self._validate_and_accept)
        btn_cancel = QPushButton("取消")
        btn_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(btn_ok)
        btn_layout.addWidget(btn_cancel)
        layout.addRow(btn_layout)

        self._req = req
        self._on_status_changed()

    def _on_status_changed(self):
        target = self.new_status.currentData()
        if target == RequisitionStatus.delayed.value and self._req.feeding_plan_id:
            self.auto_block_label.setText(
                f"⚠ 标记延迟后，关联饲喂计划 #{self._req.feeding_plan_id} 将被自动卡住。\n"
                "领用单恢复出库后饲喂计划将自动解除卡点。"
            )
            self.auto_block_label.setStyleSheet("color: red;")
        else:
            self.auto_block_label.setText("")

    def _validate_and_accept(self):
        target = self.new_status.currentData()
        if target == RequisitionStatus.delayed.value:
            if not self.reason.toPlainText().strip():
                QMessageBox.warning(self, "必填校验", "延迟原因为必填项，不能为空")
                return
        self.accept()

    def get_data(self):
        return self.new_status.currentData(), self.reason.toPlainText().strip()


class _IssuanceDialog(QDialog):
    def __init__(self, req, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"登记出库 - 领用单 #{req.id}")
        self.setMinimumWidth(300)
        layout = QFormLayout(self)

        layout.addRow("物料:", QLabel(f"{req.item_name} ({req.spec or '-'})"))
        layout.addRow("申请数量:", QLabel(f"{req.quantity_requested} {req.unit}"))
        layout.addRow("已出库:", QLabel(f"{req.quantity_issued} {req.unit}"))

        self.issued_qty = QDoubleSpinBox()
        remaining = req.quantity_requested - req.quantity_issued
        self.issued_qty.setRange(0, remaining)
        self.issued_qty.setDecimals(1)
        self.issued_qty.setValue(remaining)
        layout.addRow("本次出库数量:", self.issued_qty)

        btn_layout = QHBoxLayout()
        btn_ok = QPushButton("确定")
        btn_ok.clicked.connect(self.accept)
        btn_cancel = QPushButton("取消")
        btn_cancel.clicked.connect(self.reject)
        btn_layout.addWidget(btn_ok)
        btn_layout.addWidget(btn_cancel)
        layout.addRow(btn_layout)

    def get_issued_qty(self):
        return self.issued_qty.value()
