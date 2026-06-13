from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QGroupBox,
    QTableWidget, QTableWidgetItem, QPushButton, QHeaderView,
    QAbstractItemView, QDialog, QFormLayout, QLineEdit, QTextEdit,
    QComboBox, QDateEdit, QSpinBox, QCheckBox, QMessageBox, QProgressBar
)
from PyQt5.QtCore import Qt, QDate
from PyQt5.QtGui import QColor
from datetime import date, datetime, timedelta

from database import Database
from models import StabilityTracking, StabilityStatus
from utils import get_status_color, format_date, get_stability_progress


class StabilityDialog(QDialog):
    def __init__(self, db: Database, tracking: StabilityTracking, parent=None):
        super().__init__(parent)
        self.db = db
        self.tracking = tracking
        self.init_ui()
        
    def init_ui(self):
        self.setWindowTitle('更新稳定期跟踪')
        self.setMinimumWidth(500)
        
        layout = QVBoxLayout(self)
        
        info_layout = QFormLayout()
        
        self.candidate_label = QLabel(self.tracking.candidate_name)
        info_layout.addRow('候选人:', self.candidate_label)
        
        self.company_label = QLabel(self.tracking.company)
        info_layout.addRow('公司:', self.company_label)
        
        self.onboarding_label = QLabel(format_date(self.tracking.onboarding_date))
        info_layout.addRow('入职日期:', self.onboarding_label)
        
        self.period_label = QLabel(f'{self.tracking.stability_period_days}天')
        info_layout.addRow('稳定期:', self.period_label)
        
        layout.addLayout(info_layout)
        
        form_layout = QFormLayout()
        
        self.current_days_spin = QSpinBox()
        self.current_days_spin.setRange(0, 999)
        self.current_days_spin.setValue(self.tracking.current_work_days)
        form_layout.addRow('当前工作天数:', self.current_days_spin)
        
        self.status_combo = QComboBox()
        for status in StabilityStatus:
            self.status_combo.addItem(status.value, status)
        self.status_combo.setCurrentText(self.tracking.status.value)
        form_layout.addRow('状态:', self.status_combo)
        
        self.last_check_edit = QDateEdit()
        self.last_check_edit.setCalendarPopup(True)
        if self.tracking.last_check_date:
            self.last_check_edit.setDate(QDate(
                self.tracking.last_check_date.year,
                self.tracking.last_check_date.month,
                self.tracking.last_check_date.day
            ))
        else:
            self.last_check_edit.setDate(QDate.currentDate())
        form_layout.addRow('上次检查日期:', self.last_check_edit)
        
        self.next_check_edit = QDateEdit()
        self.next_check_edit.setCalendarPopup(True)
        if self.tracking.next_check_date:
            self.next_check_edit.setDate(QDate(
                self.tracking.next_check_date.year,
                self.tracking.next_check_date.month,
                self.tracking.next_check_date.day
            ))
        else:
            self.next_check_edit.setDate(QDate.currentDate().addDays(7))
        form_layout.addRow('下次检查日期:', self.next_check_edit)
        
        self.risk_notes_edit = QTextEdit()
        self.risk_notes_edit.setPlainText(self.tracking.risk_notes or '')
        self.risk_notes_edit.setMaximumHeight(80)
        form_layout.addRow('风险说明:', self.risk_notes_edit)
        
        self.return_fee_paid_check = QCheckBox('已支付返费')
        self.return_fee_paid_check.setChecked(self.tracking.return_fee_paid)
        form_layout.addRow('', self.return_fee_paid_check)
        
        self.return_fee_date_edit = QDateEdit()
        self.return_fee_date_edit.setCalendarPopup(True)
        if self.tracking.return_fee_date:
            self.return_fee_date_edit.setDate(QDate(
                self.tracking.return_fee_date.year,
                self.tracking.return_fee_date.month,
                self.tracking.return_fee_date.day
            ))
        else:
            self.return_fee_date_edit.setDate(QDate.currentDate())
        form_layout.addRow('返费支付日期:', self.return_fee_date_edit)
        
        layout.addLayout(form_layout)
        
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        
        save_btn = QPushButton('保存')
        save_btn.setStyleSheet('background-color: #27ae60; color: white; padding: 8px 20px;')
        save_btn.clicked.connect(self.save)
        btn_layout.addWidget(save_btn)
        
        cancel_btn = QPushButton('取消')
        cancel_btn.setStyleSheet('padding: 8px 20px;')
        cancel_btn.clicked.connect(self.reject)
        btn_layout.addWidget(cancel_btn)
        
        layout.addLayout(btn_layout)
        
    def save(self):
        self.tracking.current_work_days = self.current_days_spin.value()
        self.tracking.status = self.status_combo.currentData()
        self.tracking.last_check_date = self.last_check_edit.date().toPyDate()
        self.tracking.next_check_date = self.next_check_edit.date().toPyDate()
        self.tracking.risk_notes = self.risk_notes_edit.toPlainText()
        self.tracking.return_fee_paid = self.return_fee_paid_check.isChecked()
        self.tracking.return_fee_date = self.return_fee_date_edit.date().toPyDate()
        self.tracking.updated_at = datetime.now()
        
        self.db.update_stability_tracking(self.tracking)
        self.accept()


class StabilityTrackerWidget(QWidget):
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        header_layout = QHBoxLayout()
        
        title = QLabel('稳定期跟踪')
        title.setStyleSheet('font-size: 24px; font-weight: bold; color: #2c3e50;')
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        self.filter_combo = QComboBox()
        self.filter_combo.addItems(['全部', '稳定期中', '已完成', '提前离职', '风险预警'])
        self.filter_combo.currentTextChanged.connect(self.filter_trackings)
        header_layout.addWidget(self.filter_combo)
        
        refresh_btn = QPushButton('刷新')
        refresh_btn.clicked.connect(self.refresh)
        header_layout.addWidget(refresh_btn)
        
        layout.addLayout(header_layout)
        
        self.table = QTableWidget()
        self.table.setColumnCount(10)
        self.table.setHorizontalHeaderLabels([
            '候选人', '公司', '入职日期', '稳定期', '当前天数',
            '进度', '状态', '下次检查', '返费', '操作'
        ])
        
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(1, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(4, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(5, QHeaderView.Stretch)
        header.setSectionResizeMode(6, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(7, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(8, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(9, QHeaderView.ResizeToContents)
        
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setAlternatingRowColors(True)
        
        layout.addWidget(self.table)
        
    def refresh(self):
        self.load_trackings()
        
    def filter_trackings(self, status_text: str):
        self.load_trackings(status_text if status_text != '全部' else None)
        
    def load_trackings(self, status_filter: str = None):
        self.table.setRowCount(0)
        
        status = StabilityStatus(status_filter) if status_filter else None
        trackings = self.db.get_stability_trackings(status)
        
        for tracking in trackings:
            row = self.table.rowCount()
            self.table.insertRow(row)
            
            self.table.setItem(row, 0, QTableWidgetItem(tracking.candidate_name))
            self.table.setItem(row, 1, QTableWidgetItem(tracking.company))
            self.table.setItem(row, 2, QTableWidgetItem(format_date(tracking.onboarding_date)))
            self.table.setItem(row, 3, QTableWidgetItem(f'{tracking.stability_period_days}天'))
            self.table.setItem(row, 4, QTableWidgetItem(f'{tracking.current_work_days}天'))
            
            progress = get_stability_progress(tracking.current_work_days, tracking.stability_period_days)
            progress_bar = QProgressBar()
            progress_bar.setValue(int(progress))
            progress_bar.setTextVisible(True)
            progress_bar.setFormat(f'{progress:.1f}%')
            if progress >= 100:
                progress_bar.setStyleSheet('QProgressBar::chunk { background-color: #27ae60; }')
            elif progress >= 70:
                progress_bar.setStyleSheet('QProgressBar::chunk { background-color: #3498db; }')
            elif progress >= 50:
                progress_bar.setStyleSheet('QProgressBar::chunk { background-color: #f39c12; }')
            else:
                progress_bar.setStyleSheet('QProgressBar::chunk { background-color: #e74c3c; }')
            self.table.setCellWidget(row, 5, progress_bar)
            
            status_item = QTableWidgetItem(tracking.status.value)
            status_item.setBackground(QColor(get_status_color(tracking.status.value)))
            status_item.setForeground(QColor('white'))
            self.table.setItem(row, 6, status_item)
            
            next_check_item = QTableWidgetItem(format_date(tracking.next_check_date))
            if tracking.next_check_date and tracking.next_check_date < date.today():
                next_check_item.setForeground(QColor('#e74c3c'))
            self.table.setItem(row, 7, next_check_item)
            
            return_fee_text = '已支付' if tracking.return_fee_paid else '未支付'
            return_fee_item = QTableWidgetItem(return_fee_text)
            return_fee_item.setForeground(QColor('#27ae60') if tracking.return_fee_paid else QColor('#e74c3c'))
            self.table.setItem(row, 8, return_fee_item)
            
            btn_widget = QWidget()
            btn_layout = QHBoxLayout(btn_widget)
            btn_layout.setContentsMargins(5, 2, 5, 2)
            
            update_btn = QPushButton('更新')
            update_btn.setStyleSheet('padding: 3px 8px;')
            update_btn.clicked.connect(lambda checked, t=tracking: self.update_tracking(t))
            btn_layout.addWidget(update_btn)
            
            if tracking.status == StabilityStatus.IN_PROGRESS:
                complete_btn = QPushButton('完成')
                complete_btn.setStyleSheet('padding: 3px 8px; background-color: #27ae60; color: white;')
                complete_btn.clicked.connect(lambda checked, t=tracking: self.complete_tracking(t))
                btn_layout.addWidget(complete_btn)
                
                risk_btn = QPushButton('风险')
                risk_btn.setStyleSheet('padding: 3px 8px; background-color: #e67e22; color: white;')
                risk_btn.clicked.connect(lambda checked, t=tracking: self.mark_risk(t))
                btn_layout.addWidget(risk_btn)
            
            self.table.setCellWidget(row, 9, btn_widget)
            
    def update_tracking(self, tracking: StabilityTracking):
        dialog = StabilityDialog(self.db, tracking, parent=self)
        if dialog.exec_():
            self.refresh()
            
    def complete_tracking(self, tracking: StabilityTracking):
        tracking.status = StabilityStatus.COMPLETED
        tracking.updated_at = datetime.now()
        self.db.update_stability_tracking(tracking)
        QMessageBox.information(self, '成功', '稳定期已完成')
        self.refresh()
        
    def mark_risk(self, tracking: StabilityTracking):
        tracking.status = StabilityStatus.RISK
        tracking.risk_notes = '需要关注'
        tracking.updated_at = datetime.now()
        self.db.update_stability_tracking(tracking)
        QMessageBox.information(self, '成功', '已标记为风险预警')
        self.refresh()