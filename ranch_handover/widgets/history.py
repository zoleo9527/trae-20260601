from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTableWidget, QTableWidgetItem,
    QPushButton, QHeaderView, QLabel, QComboBox, QTextEdit, QDateEdit,
)
from PyQt6.QtCore import Qt, QDate
from ..database import get_session
from ..models import OperationLog


class HistoryWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)

        toolbar = QHBoxLayout()
        toolbar.addWidget(QLabel("实体类型:"))
        self.type_filter = QComboBox()
        self.type_filter.addItem("全部", "")
        self.type_filter.addItem("饲喂计划", "feeding_plan")
        self.type_filter.addItem("库存领用", "inventory_requisition")
        self.type_filter.addItem("系统", "system")
        toolbar.addWidget(self.type_filter)

        toolbar.addWidget(QLabel("起始日期:"))
        self.start_date = QDateEdit()
        self.start_date.setCalendarPopup(True)
        self.start_date.setDate(QDate.currentDate().addDays(-7))
        self.start_date.setDisplayFormat("yyyy-MM-dd")
        toolbar.addWidget(self.start_date)

        toolbar.addWidget(QLabel("截止日期:"))
        self.end_date = QDateEdit()
        self.end_date.setCalendarPopup(True)
        self.end_date.setDate(QDate.currentDate())
        self.end_date.setDisplayFormat("yyyy-MM-dd")
        toolbar.addWidget(self.end_date)

        btn_refresh = QPushButton("查询")
        btn_refresh.clicked.connect(self._refresh)
        toolbar.addWidget(btn_refresh)
        toolbar.addStretch()
        layout.addLayout(toolbar)

        self.table = QTableWidget(0, 6)
        self.table.setHorizontalHeaderLabels(["时间", "操作人", "角色", "类型", "操作", "详情"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self.table)

        self._refresh()

    def _refresh(self):
        session = get_session()
        query = session.query(OperationLog)

        type_val = self.type_filter.currentData()
        if type_val:
            query = query.filter(OperationLog.entity_type == type_val)

        start_str = self.start_date.date().toString("yyyy-MM-dd")
        end_str = self.end_date.date().toString("yyyy-MM-dd")
        query = query.filter(
            OperationLog.created_at >= f"{start_str} 00:00:00",
            OperationLog.created_at <= f"{end_str} 23:59:59",
        )

        logs = query.order_by(OperationLog.id.desc()).limit(500).all()
        self.table.setRowCount(len(logs))
        for row, log in enumerate(logs):
            time_str = log.created_at.strftime("%m-%d %H:%M") if log.created_at else "-"
            self.table.setItem(row, 0, QTableWidgetItem(time_str))
            self.table.setItem(row, 1, QTableWidgetItem(log.operator_name))
            self.table.setItem(row, 2, QTableWidgetItem(log.operator_role))
            type_map = {"feeding_plan": "饲喂计划", "inventory_requisition": "库存领用", "system": "系统"}
            self.table.setItem(row, 3, QTableWidgetItem(type_map.get(log.entity_type, log.entity_type)))
            self.table.setItem(row, 4, QTableWidgetItem(log.action))
            self.table.setItem(row, 5, QTableWidgetItem(log.detail or ""))

        session.close()
