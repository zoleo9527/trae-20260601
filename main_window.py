import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QStackedWidget, QFrame, QComboBox, QMessageBox, QDialog
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QFont

from database import Database
from models import UserRole
from widgets.dashboard import DashboardWidget
from widgets.job_management import JobManagementWidget
from widgets.interview_list import InterviewListWidget
from widgets.receipt_handler import ReceiptHandlerWidget
from widgets.stability_tracker import StabilityTrackerWidget


class RoleLoginDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle('选择角色')
        self.setMinimumWidth(300)
        
        layout = QVBoxLayout(self)
        
        title = QLabel('请选择您的角色')
        title.setStyleSheet('font-size: 18px; font-weight: bold; color: #2c3e50;')
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)
        
        self.role_combo = QComboBox()
        for role in UserRole:
            self.role_combo.addItem(role.value, role)
        layout.addWidget(self.role_combo)
        
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        
        confirm_btn = QPushButton('确认')
        confirm_btn.setStyleSheet('background-color: #27ae60; color: white; padding: 8px 20px;')
        confirm_btn.clicked.connect(self.accept)
        btn_layout.addWidget(confirm_btn)
        
        layout.addLayout(btn_layout)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.db = Database()
        self.current_role = None
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle('蓝领招聘平台 - 入职回执与稳定期跟踪系统')
        self.setGeometry(100, 100, 1400, 900)
        self.setMinimumSize(1200, 700)

        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        nav_frame = QFrame()
        nav_frame.setFixedWidth(220)
        nav_frame.setStyleSheet('''
            QFrame {
                background-color: #2c3e50;
            }
            QPushButton {
                background-color: transparent;
                color: #ecf0f1;
                border: none;
                text-align: left;
                padding: 15px 20px;
                font-size: 14px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #34495e;
            }
            QPushButton:checked {
                background-color: #3498db;
            }
            QComboBox {
                background-color: #34495e;
                color: #ecf0f1;
                border: none;
                padding: 8px 15px;
                font-size: 12px;
            }
        ''')
        nav_layout = QVBoxLayout(nav_frame)
        nav_layout.setContentsMargins(0, 0, 0, 0)
        nav_layout.setSpacing(0)

        title_label = QLabel('招聘管理系统')
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setStyleSheet('''
            QLabel {
                color: #ecf0f1;
                font-size: 18px;
                font-weight: bold;
                padding: 20px;
                background-color: #1a252f;
            }
        ''')
        nav_layout.addWidget(title_label)

        self.role_combo = QComboBox()
        for role in UserRole:
            self.role_combo.addItem(role.value, role)
        self.role_combo.currentIndexChanged.connect(self.switch_role)
        nav_layout.addWidget(self.role_combo)

        nav_layout.addStretch(1)

        self.nav_buttons = []
        
        nav_items = [
            ('仪表板', 'dashboard'),
            ('岗位发布', 'jobs'),
            ('面试名单', 'interviews'),
            ('入职回执', 'receipts'),
            ('稳定期跟踪', 'stability'),
        ]

        for text, name in nav_items:
            btn = QPushButton(f'  {text}')
            btn.setCheckable(True)
            btn.setObjectName(name)
            btn.setMinimumHeight(50)
            btn.clicked.connect(lambda checked, n=name: self.switch_page(n))
            nav_layout.addWidget(btn)
            self.nav_buttons.append(btn)

        nav_layout.addStretch(2)

        self.nav_buttons[0].setChecked(True)

        content_frame = QFrame()
        content_frame.setStyleSheet('background-color: #ecf0f1;')
        content_layout = QVBoxLayout(content_frame)
        content_layout.setContentsMargins(20, 20, 20, 20)

        self.stacked_widget = QStackedWidget()

        self.dashboard_widget = DashboardWidget(self.db)
        self.jobs_widget = JobManagementWidget(self.db)
        self.interviews_widget = InterviewListWidget(self.db, self)
        self.receipts_widget = ReceiptHandlerWidget(self.db)
        self.stability_widget = StabilityTrackerWidget(self.db)

        self.stacked_widget.addWidget(self.dashboard_widget)
        self.stacked_widget.addWidget(self.jobs_widget)
        self.stacked_widget.addWidget(self.interviews_widget)
        self.stacked_widget.addWidget(self.receipts_widget)
        self.stacked_widget.addWidget(self.stability_widget)

        content_layout.addWidget(self.stacked_widget)

        main_layout.addWidget(nav_frame)
        main_layout.addWidget(content_frame, 1)
        
        self.apply_role_restrictions(UserRole.OPERATOR)
        self.dashboard_widget.refresh()

    def apply_role_restrictions(self, role: UserRole):
        self.current_role = role
        
        nav_items = [
            ('dashboard', ['运营', '招聘顾问', '企业HR']),
            ('jobs', ['招聘顾问', '运营']),
            ('interviews', ['招聘顾问', '运营']),
            ('receipts', ['运营', '企业HR']),
            ('stability', ['运营', '企业HR']),
        ]
        
        for name, allowed_roles in nav_items:
            for btn in self.nav_buttons:
                if btn.objectName() == name:
                    btn.setVisible(role.value in allowed_roles)
                    break

    def switch_role(self, index):
        role = self.role_combo.itemData(index)
        self.apply_role_restrictions(role)
        
        current_page = None
        for btn in self.nav_buttons:
            if btn.isVisible() and btn.isChecked():
                current_page = btn.objectName()
                break
        
        if not current_page:
            for btn in self.nav_buttons:
                if btn.isVisible():
                    btn.setChecked(True)
                    current_page = btn.objectName()
                    break
        
        if current_page:
            self.switch_page(current_page)

    def switch_page(self, name):
        for btn in self.nav_buttons:
            btn.setChecked(btn.objectName() == name)

        if name == 'dashboard':
            self.stacked_widget.setCurrentWidget(self.dashboard_widget)
            self.dashboard_widget.refresh()
        elif name == 'jobs':
            self.stacked_widget.setCurrentWidget(self.jobs_widget)
            self.jobs_widget.refresh()
        elif name == 'interviews':
            self.stacked_widget.setCurrentWidget(self.interviews_widget)
            self.interviews_widget.refresh()
        elif name == 'receipts':
            self.stacked_widget.setCurrentWidget(self.receipts_widget)
            self.receipts_widget.refresh()
        elif name == 'stability':
            self.stacked_widget.setCurrentWidget(self.stability_widget)
            self.stability_widget.refresh()


def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    
    font = QFont('Microsoft YaHei', 10)
    app.setFont(font)
    
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()