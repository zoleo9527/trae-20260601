from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QScrollArea,
    QGridLayout, QGroupBox, QTableWidget, QTableWidgetItem, QPushButton,
    QHeaderView, QAbstractItemView
)
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QFont, QColor
from datetime import date, datetime, timedelta

from database import Database
from utils import get_status_color, format_date, format_datetime


class StatCard(QFrame):
    def __init__(self, title: str, count: int, color: str, parent=None):
        super().__init__(parent)
        self.setFixedHeight(100)
        self.setStyleSheet(f'''
            QFrame {{
                background-color: {color};
                border-radius: 10px;
            }}
        ''')
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 15, 20, 15)
        
        title_label = QLabel(title)
        title_label.setStyleSheet('color: white; font-size: 14px; font-weight: bold;')
        layout.addWidget(title_label)
        
        count_label = QLabel(str(count))
        count_label.setStyleSheet('color: white; font-size: 32px; font-weight: bold;')
        layout.addWidget(count_label)
        
        layout.addStretch()


class DashboardWidget(QWidget):
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        self.init_ui()
        
    def init_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setSpacing(20)
        
        title = QLabel('仪表板')
        title.setStyleSheet('font-size: 24px; font-weight: bold; color: #2c3e50;')
        main_layout.addWidget(title)
        
        self.stat_cards_layout = QHBoxLayout()
        self.stat_cards_layout.setSpacing(15)
        main_layout.addLayout(self.stat_cards_layout)
        
        content_layout = QHBoxLayout()
        content_layout.setSpacing(15)
        
        left_panel = QVBoxLayout()
        left_panel.setSpacing(15)
        
        pending_group = QGroupBox('待处理事项')
        pending_group.setStyleSheet('''
            QGroupBox {
                font-size: 16px;
                font-weight: bold;
                border: 2px solid #bdc3c7;
                border-radius: 8px;
                margin-top: 10px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 15px;
                padding: 0 5px;
            }
        ''')
        pending_layout = QVBoxLayout(pending_group)
        
        self.pending_table = QTableWidget()
        self.pending_table.setColumnCount(4)
        self.pending_table.setHorizontalHeaderLabels(['类型', '内容', '状态', '操作'])
        self.pending_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.pending_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.pending_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeToContents)
        self.pending_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self.pending_table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.pending_table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        pending_layout.addWidget(self.pending_table)
        
        left_panel.addWidget(pending_group)
        
        risk_group = QGroupBox('风险预警')
        risk_group.setStyleSheet('''
            QGroupBox {
                font-size: 16px;
                font-weight: bold;
                border: 2px solid #e74c3c;
                border-radius: 8px;
                margin-top: 10px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 15px;
                padding: 0 5px;
                color: #e74c3c;
            }
        ''')
        risk_layout = QVBoxLayout(risk_group)
        
        self.risk_table = QTableWidget()
        self.risk_table.setColumnCount(4)
        self.risk_table.setHorizontalHeaderLabels(['姓名', '公司', '风险说明', '入职天数'])
        self.risk_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.risk_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.risk_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
        self.risk_table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeToContents)
        self.risk_table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.risk_table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        risk_layout.addWidget(self.risk_table)
        
        left_panel.addWidget(risk_group)
        
        content_layout.addLayout(left_panel, 2)
        
        right_panel = QVBoxLayout()
        right_panel.setSpacing(15)
        
        changes_group = QGroupBox('最近变更')
        changes_group.setStyleSheet('''
            QGroupBox {
                font-size: 16px;
                font-weight: bold;
                border: 2px solid #3498db;
                border-radius: 8px;
                margin-top: 10px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 15px;
                padding: 0 5px;
                color: #3498db;
            }
        ''')
        changes_layout = QVBoxLayout(changes_group)
        
        self.changes_table = QTableWidget()
        self.changes_table.setColumnCount(3)
        self.changes_table.setHorizontalHeaderLabels(['时间', '操作', '详情'])
        self.changes_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeToContents)
        self.changes_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeToContents)
        self.changes_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.Stretch)
        self.changes_table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.changes_table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        changes_layout.addWidget(self.changes_table)
        
        right_panel.addWidget(changes_group)
        
        expiring_group = QGroupBox('即将过期岗位')
        expiring_group.setStyleSheet('''
            QGroupBox {
                font-size: 16px;
                font-weight: bold;
                border: 2px solid #f39c12;
                border-radius: 8px;
                margin-top: 10px;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 15px;
                padding: 0 5px;
                color: #f39c12;
            }
        ''')
        expiring_layout = QVBoxLayout(expiring_group)
        
        self.expiring_table = QTableWidget()
        self.expiring_table.setColumnCount(3)
        self.expiring_table.setHorizontalHeaderLabels(['岗位', '公司', '过期日期'])
        self.expiring_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.expiring_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.expiring_table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeToContents)
        self.expiring_table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.expiring_table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        expiring_layout.addWidget(self.expiring_table)
        
        right_panel.addWidget(expiring_group)
        
        content_layout.addLayout(right_panel, 1)
        
        main_layout.addLayout(content_layout)
        
    def refresh(self):
        self.load_stat_cards()
        self.load_pending_items()
        self.load_risk_items()
        self.load_recent_changes()
        self.load_expiring_jobs()
        
    def load_stat_cards(self):
        for i in reversed(range(self.stat_cards_layout.count())):
            self.stat_cards_layout.itemAt(i).widget().setParent(None)
            
        counts = self.db.get_pending_items_count()
        
        cards = [
            ('待处理回执', counts['pending_receipts'], '#e74c3c'),
            ('待面试', counts['pending_interviews'], '#3498db'),
            ('风险预警', counts['risk_trackings'], '#e67e22'),
            ('在招岗位', counts['active_jobs'], '#27ae60'),
        ]
        
        for title, count, color in cards:
            card = StatCard(title, count, color)
            self.stat_cards_layout.addWidget(card)
            
    def load_pending_items(self):
        self.pending_table.setRowCount(0)
        
        receipts = self.db.get_receipts()
        pending_receipts = [r for r in receipts if r.status.value == '待处理']
        
        for receipt in pending_receipts[:5]:
            row = self.pending_table.rowCount()
            self.pending_table.insertRow(row)
            
            self.pending_table.setItem(row, 0, QTableWidgetItem('入职回执'))
            self.pending_table.setItem(row, 1, QTableWidgetItem(f'{receipt.candidate_name} - {receipt.company}'))
            
            status_item = QTableWidgetItem('待处理')
            status_item.setBackground(QColor(get_status_color('待处理')))
            status_item.setForeground(QColor('white'))
            self.pending_table.setItem(row, 2, status_item)
            
            self.pending_table.setItem(row, 3, QTableWidgetItem('查看'))
            
        interviews = self.db.get_interviews()
        today = datetime.now()
        pending_interviews = [
            i for i in interviews 
            if i.status.value == '待面试' and i.interview_time.date() <= today.date()
        ]
        
        for interview in pending_interviews[:3]:
            row = self.pending_table.rowCount()
            self.pending_table.insertRow(row)
            
            self.pending_table.setItem(row, 0, QTableWidgetItem('面试'))
            self.pending_table.setItem(row, 1, QTableWidgetItem(f'{interview.candidate_name} - {interview.location}'))
            
            status_item = QTableWidgetItem('待面试')
            status_item.setBackground(QColor(get_status_color('待面试')))
            status_item.setForeground(QColor('white'))
            self.pending_table.setItem(row, 2, status_item)
            
            self.pending_table.setItem(row, 3, QTableWidgetItem('查看'))
            
    def load_risk_items(self):
        self.risk_table.setRowCount(0)
        
        trackings = self.db.get_stability_trackings()
        risk_items = [t for t in trackings if t.status.value == '风险预警']
        
        for tracking in risk_items:
            row = self.risk_table.rowCount()
            self.risk_table.insertRow(row)
            
            self.risk_table.setItem(row, 0, QTableWidgetItem(tracking.candidate_name))
            self.risk_table.setItem(row, 1, QTableWidgetItem(tracking.company))
            self.risk_table.setItem(row, 2, QTableWidgetItem(tracking.risk_notes or '无说明'))
            self.risk_table.setItem(row, 3, QTableWidgetItem(f'{tracking.current_work_days}天'))
            
    def load_recent_changes(self):
        self.changes_table.setRowCount(0)
        
        changes = self.db.get_recent_changes(15)
        
        for change in changes:
            row = self.changes_table.rowCount()
            self.changes_table.insertRow(row)
            
            self.changes_table.setItem(row, 0, QTableWidgetItem(format_datetime(change.created_at)))
            self.changes_table.setItem(row, 1, QTableWidgetItem(change.action))
            self.changes_table.setItem(row, 2, QTableWidgetItem(f'{change.old_value} → {change.new_value}'))
            
    def load_expiring_jobs(self):
        self.expiring_table.setRowCount(0)
        
        jobs = self.db.get_jobs()
        today = date.today()
        expiring_jobs = [
            j for j in jobs 
            if j.expire_date and j.status.value == '招聘中' and 
            0 <= (j.expire_date - today).days <= 7
        ]
        
        for job in expiring_jobs:
            row = self.expiring_table.rowCount()
            self.expiring_table.insertRow(row)
            
            self.expiring_table.setItem(row, 0, QTableWidgetItem(job.title))
            self.expiring_table.setItem(row, 1, QTableWidgetItem(job.company))
            
            expire_item = QTableWidgetItem(format_date(job.expire_date))
            expire_item.setForeground(QColor('#e74c3c'))
            self.expiring_table.setItem(row, 2, expire_item)