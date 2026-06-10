import sys
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTabWidget, QLabel, QComboBox, QPushButton, QStatusBar,
    QMessageBox,
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

from .database import get_session
from .models import Staff, RoleEnum
from .widgets.dashboard import DashboardWidget
from .widgets.feeding_plan import FeedingPlanWidget
from .widgets.inventory import InventoryWidget
from .widgets.history import HistoryWidget
from .widgets.batch_entry import BatchEntryWidget


class RanchHandoverWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("牧场运营 - 饲喂计划与库存领用交班系统")
        self.setMinimumSize(1100, 750)
        self._current_operator_name = ""
        self._current_operator_role = ""
        self._setup_ui()

    def _setup_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)

        operator_bar = QHBoxLayout()
        operator_bar.addWidget(QLabel("当前操作人:"))
        self.operator_combo = QComboBox()
        self._load_operators()
        self.operator_combo.currentIndexChanged.connect(self._on_operator_changed)
        operator_bar.addWidget(self.operator_combo)
        operator_bar.addStretch()
        main_layout.addLayout(operator_bar)

        self.tabs = QTabWidget()
        self.tabs.setFont(QFont("PingFang SC", 10))

        self.dashboard = DashboardWidget()
        self.tabs.addTab(self.dashboard, "交班看板")

        self.feeding_plan = FeedingPlanWidget()
        self.tabs.addTab(self.feeding_plan, "饲喂计划")

        self.inventory = InventoryWidget()
        self.tabs.addTab(self.inventory, "库存领用")

        self.batch_entry = BatchEntryWidget()
        self.tabs.addTab(self.batch_entry, "批量录入")

        self.history = HistoryWidget()
        self.tabs.addTab(self.history, "操作历史")

        main_layout.addWidget(self.tabs)

        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("就绪 - 请先选择当前操作人")

    def _load_operators(self):
        session = get_session()
        staff_list = session.query(Staff).order_by(Staff.id).all()
        self.operator_combo.addItem("-- 请选择操作人 --", None)
        for s in staff_list:
            self.operator_combo.addItem(f"{s.name} ({s.role} - {s.shift})", s.id)
        session.close()

    def _on_operator_changed(self, index):
        staff_id = self.operator_combo.currentData()
        if staff_id is None:
            self._current_operator_name = ""
            self._current_operator_role = ""
            self.status_bar.showMessage("请选择当前操作人")
            return
        session = get_session()
        staff = session.query(Staff).get(staff_id)
        if staff:
            self._current_operator_name = staff.name
            self._current_operator_role = staff.role
            self.status_bar.showMessage(f"当前操作人: {staff.name} ({staff.role})")

            self.dashboard.set_operator(staff.name, staff.role)
            self.feeding_plan.set_operator(staff.name, staff.role)
            self.inventory.set_operator(staff.name, staff.role)
            self.batch_entry.set_operator(staff.name, staff.role)
        session.close()


def run():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")

    font = QFont("PingFang SC", 10)
    app.setFont(font)

    window = RanchHandoverWindow()
    window.show()
    sys.exit(app.exec())
