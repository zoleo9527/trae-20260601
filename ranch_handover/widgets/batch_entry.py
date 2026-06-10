from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QHeaderView, QLabel, QComboBox, QDoubleSpinBox,
    QDateEdit, QMessageBox, QDialog, QFormLayout, QLineEdit, QTextEdit,
)
from PyQt6.QtCore import Qt, QDate
from ..database import get_session
from ..models import (
    FeedingPlan, InventoryRequisition, Staff, FeedingPlanStatus,
    RequisitionStatus, OperationLog,
)


class BatchEntryWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._current_operator_name = ""
        self._current_operator_role = ""
        self._setup_ui()

    def set_operator(self, name, role):
        self._current_operator_name = name
        self._current_operator_role = role

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        header = QHBoxLayout()
        header.addWidget(QLabel("<h3>批量录入</h3>"))
        header.addStretch()
        layout.addLayout(header)

        batch_type_layout = QHBoxLayout()
        batch_type_layout.addWidget(QLabel("批量类型:"))
        self.batch_type = QComboBox()
        self.batch_type.addItem("饲喂计划", "feeding_plan")
        self.batch_type.addItem("库存领用", "inventory_requisition")
        self.batch_type.currentIndexChanged.connect(self._on_type_changed)
        batch_type_layout.addWidget(self.batch_type)
        batch_type_layout.addStretch()
        layout.addLayout(batch_type_layout)

        self.entry_table = QTableWidget(5, 6)
        self._setup_feeding_columns()
        self.entry_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        layout.addWidget(self.entry_table)

        btn_layout = QHBoxLayout()
        btn_add_row = QPushButton("添加行")
        btn_add_row.clicked.connect(self._add_row)
        btn_layout.addWidget(btn_add_row)

        btn_submit = QPushButton("提交批量数据")
        btn_submit.clicked.connect(self._submit)
        btn_layout.addWidget(btn_submit)

        btn_clear = QPushButton("清空")
        btn_clear.clicked.connect(self._clear)
        btn_layout.addWidget(btn_clear)
        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        self.result_label = QLabel("")
        layout.addWidget(self.result_label)

    def _setup_feeding_columns(self):
        self.entry_table.setColumnCount(6)
        self.entry_table.setHorizontalHeaderLabels([
            "计划日期", "牛群", "饲料配方", "数量", "单位", "指派给",
        ])
        for row in range(self.entry_table.rowCount()):
            self._set_feeding_row_widgets(row)

    def _setup_requisition_columns(self):
        self.entry_table.setColumnCount(7)
        self.entry_table.setHorizontalHeaderLabels([
            "关联计划ID", "物料名称", "规格", "申请数量", "单位", "申请人", "备注",
        ])
        for row in range(self.entry_table.rowCount()):
            self._set_requisition_row_widgets(row)

    def _on_type_changed(self):
        self._clear()

    def _set_feeding_row_widgets(self, row):
        date_edit = QDateEdit()
        date_edit.setCalendarPopup(True)
        date_edit.setDate(QDate.currentDate())
        date_edit.setDisplayFormat("yyyy-MM-dd")
        self.entry_table.setCellWidget(row, 0, date_edit)

        cattle = QComboBox()
        cattle.setEditable(True)
        cattle.addItems(["泌乳牛群", "干奶牛群", "育成牛群", "犊牛群", "病牛群"])
        self.entry_table.setCellWidget(row, 1, cattle)

        formula = QComboBox()
        formula.setEditable(True)
        formula.addItems(["TMR全混合日粮", "精料补充料", "粗饲料为主", "犊牛代乳料", "病牛特配料"])
        self.entry_table.setCellWidget(row, 2, formula)

        qty = QDoubleSpinBox()
        qty.setRange(0, 99999)
        qty.setDecimals(1)
        qty.setValue(100.0)
        self.entry_table.setCellWidget(row, 3, qty)

        unit = QComboBox()
        unit.setEditable(True)
        unit.addItems(["kg", "吨", "包", "桶"])
        self.entry_table.setCellWidget(row, 4, unit)

        session = get_session()
        staff_list = session.query(Staff).all()
        session.close()
        assign = QComboBox()
        assign.addItem("未指派", None)
        for s in staff_list:
            assign.addItem(f"{s.name}({s.role})", s.id)
        self.entry_table.setCellWidget(row, 5, assign)

    def _set_requisition_row_widgets(self, row):
        fp_id = QComboBox()
        fp_id.setEditable(True)
        session = get_session()
        plans = session.query(FeedingPlan).filter(
            FeedingPlan.status.in_([FeedingPlanStatus.approved.value, FeedingPlanStatus.in_progress.value])
        ).all()
        session.close()
        fp_id.addItem("无", None)
        for p in plans:
            fp_id.addItem(f"#{p.id} {p.cattle_group}({p.status})", p.id)
        self.entry_table.setCellWidget(row, 0, fp_id)

        item_name = QComboBox()
        item_name.setEditable(True)
        item_name.addItems(["精料", "粗饲料", "青贮", "矿物补充料", "维生素预混料", "犊牛代乳粉", "药品", "消毒剂"])
        self.entry_table.setCellWidget(row, 1, item_name)

        spec = QComboBox()
        spec.setEditable(True)
        spec.addItems(["25kg/包", "50kg/包", "散装", "1L/瓶", "5L/桶"])
        self.entry_table.setCellWidget(row, 2, spec)

        qty = QDoubleSpinBox()
        qty.setRange(0, 99999)
        qty.setDecimals(1)
        qty.setValue(50.0)
        self.entry_table.setCellWidget(row, 3, qty)

        unit = QComboBox()
        unit.setEditable(True)
        unit.addItems(["kg", "吨", "包", "桶", "瓶"])
        self.entry_table.setCellWidget(row, 4, unit)

        session = get_session()
        staff_list = session.query(Staff).all()
        session.close()
        requester = QComboBox()
        requester.addItem("未选择", None)
        for s in staff_list:
            requester.addItem(f"{s.name}({s.role})", s.id)
        self.entry_table.setCellWidget(row, 5, requester)

        note = QLineEdit()
        note.setPlaceholderText("可选")
        self.entry_table.setCellWidget(row, 6, note)

    def _add_row(self):
        row = self.entry_table.rowCount()
        self.entry_table.insertRow(row)
        batch_type = self.batch_type.currentData()
        if batch_type == "feeding_plan":
            self._set_feeding_row_widgets(row)
        else:
            self._set_requisition_row_widgets(row)

    def _clear(self):
        self.entry_table.setRowCount(5)
        batch_type = self.batch_type.currentData()
        if batch_type == "feeding_plan":
            self._setup_feeding_columns()
        else:
            self._setup_requisition_columns()
        self.result_label.setText("")

    def _submit(self):
        batch_type = self.batch_type.currentData()
        if batch_type == "feeding_plan":
            self._submit_feeding()
        else:
            self._submit_requisition()

    def _submit_feeding(self):
        session = get_session()
        count = 0
        errors = []
        for row in range(self.entry_table.rowCount()):
            date_widget = self.entry_table.cellWidget(row, 0)
            cattle_widget = self.entry_table.cellWidget(row, 1)
            formula_widget = self.entry_table.cellWidget(row, 2)
            qty_widget = self.entry_table.cellWidget(row, 3)
            unit_widget = self.entry_table.cellWidget(row, 4)
            assign_widget = self.entry_table.cellWidget(row, 5)

            if not date_widget or not cattle_widget:
                continue

            plan = FeedingPlan(
                plan_date=date_widget.date().toString("yyyy-MM-dd"),
                cattle_group=cattle_widget.currentText(),
                feed_formula=formula_widget.currentText(),
                quantity=qty_widget.value(),
                unit=unit_widget.currentText(),
                status=FeedingPlanStatus.draft.value,
                assigned_to=assign_widget.currentData(),
            )
            if not plan.cattle_group.strip():
                errors.append(f"第{row+1}行: 牛群不能为空")
                continue
            session.add(plan)
            session.flush()
            log = OperationLog(
                entity_type="feeding_plan",
                entity_id=plan.id,
                action="批量创建饲喂计划",
                operator_name=self._current_operator_name or "系统",
                operator_role=self._current_operator_role or "牧场主管",
                detail=f"批量创建饲喂计划 #{plan.id}: {plan.cattle_group} {plan.feed_formula}",
            )
            session.add(log)
            count += 1

        session.commit()
        session.close()

        msg = f"成功创建 {count} 条饲喂计划"
        if errors:
            msg += f"\n失败 {len(errors)} 条:\n" + "\n".join(errors)
        self.result_label.setText(msg)

    def _submit_requisition(self):
        session = get_session()
        count = 0
        errors = []
        warnings = []
        for row in range(self.entry_table.rowCount()):
            fp_widget = self.entry_table.cellWidget(row, 0)
            item_widget = self.entry_table.cellWidget(row, 1)
            spec_widget = self.entry_table.cellWidget(row, 2)
            qty_widget = self.entry_table.cellWidget(row, 3)
            unit_widget = self.entry_table.cellWidget(row, 4)
            requester_widget = self.entry_table.cellWidget(row, 5)

            if not item_widget:
                continue

            item_name = item_widget.currentText().strip()
            if not item_name:
                errors.append(f"第{row+1}行: 物料名称不能为空")
                continue

            fp_id = None
            if fp_widget:
                fp_id = fp_widget.currentData()
                if fp_id:
                    fp = session.query(FeedingPlan).get(fp_id)
                    if not fp:
                        errors.append(f"第{row+1}行: 饲喂计划 #{fp_id} 不存在")
                        continue
                    if fp.status not in [FeedingPlanStatus.approved.value, FeedingPlanStatus.in_progress.value]:
                        warnings.append(f"第{row+1}行: 饲喂计划 #{fp_id} 状态为{fp.status}，建议关联已审批/执行中的计划")

            req = InventoryRequisition(
                feeding_plan_id=fp_id,
                item_name=item_name,
                spec=spec_widget.currentText() if spec_widget else None,
                quantity_requested=qty_widget.value() if qty_widget else 0,
                unit=unit_widget.currentText() if unit_widget else "kg",
                status=RequisitionStatus.requested.value,
                requested_by=requester_widget.currentData() if requester_widget else None,
            )
            session.add(req)
            session.flush()
            log = OperationLog(
                entity_type="inventory_requisition",
                entity_id=req.id,
                action="批量创建领用申请",
                operator_name=self._current_operator_name or "系统",
                operator_role=self._current_operator_role or "牧场主管",
                detail=f"批量创建领用申请 #{req.id}: {req.item_name}"
                       + (f" (关联饲喂计划 #{fp_id})" if fp_id else ""),
            )
            session.add(log)
            count += 1

        session.commit()
        session.close()

        msg = f"成功创建 {count} 条领用申请"
        if warnings:
            msg += f"\n警告 {len(warnings)} 条:\n" + "\n".join(warnings)
        if errors:
            msg += f"\n失败 {len(errors)} 条:\n" + "\n".join(errors)
        self.result_label.setText(msg)
