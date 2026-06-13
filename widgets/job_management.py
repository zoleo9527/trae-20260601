from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QGroupBox,
    QTableWidget, QTableWidgetItem, QPushButton, QHeaderView,
    QAbstractItemView, QDialog, QFormLayout, QLineEdit, QTextEdit,
    QComboBox, QDateEdit, QDoubleSpinBox, QMessageBox, QTabWidget
)
from PyQt5.QtCore import Qt, QDate
from PyQt5.QtGui import QColor
from datetime import date, datetime

from database import Database
from models import Job, JobStatus
from utils import get_status_color, format_date


class JobDialog(QDialog):
    def __init__(self, db: Database, job: Job = None, parent=None):
        super().__init__(parent)
        self.db = db
        self.job = job
        self.init_ui()
        
    def init_ui(self):
        self.setWindowTitle('添加岗位' if not self.job else '编辑岗位')
        self.setMinimumWidth(600)
        
        layout = QVBoxLayout(self)
        
        form_layout = QFormLayout()
        
        self.title_edit = QLineEdit()
        self.title_edit.setPlaceholderText('请输入岗位名称')
        form_layout.addRow('岗位名称:', self.title_edit)
        
        self.company_edit = QLineEdit()
        self.company_edit.setPlaceholderText('请输入公司名称')
        form_layout.addRow('公司名称:', self.company_edit)
        
        self.location_edit = QLineEdit()
        self.location_edit.setPlaceholderText('请输入工作地点')
        form_layout.addRow('工作地点:', self.location_edit)
        
        self.salary_edit = QLineEdit()
        self.salary_edit.setPlaceholderText('如: 5000-8000')
        form_layout.addRow('薪资范围:', self.salary_edit)
        
        self.requirements_edit = QTextEdit()
        self.requirements_edit.setPlaceholderText('请输入岗位要求')
        self.requirements_edit.setMaximumHeight(80)
        form_layout.addRow('岗位要求:', self.requirements_edit)
        
        self.benefits_edit = QTextEdit()
        self.benefits_edit.setPlaceholderText('请输入福利待遇')
        self.benefits_edit.setMaximumHeight(80)
        form_layout.addRow('福利待遇:', self.benefits_edit)
        
        self.return_fee_condition_edit = QTextEdit()
        self.return_fee_condition_edit.setPlaceholderText('请输入返费条件')
        self.return_fee_condition_edit.setMaximumHeight(80)
        form_layout.addRow('返费条件:', self.return_fee_condition_edit)
        
        self.return_fee_amount_spin = QDoubleSpinBox()
        self.return_fee_amount_spin.setRange(0, 999999)
        self.return_fee_amount_spin.setPrefix('¥')
        form_layout.addRow('返费金额:', self.return_fee_amount_spin)
        
        self.status_combo = QComboBox()
        for status in JobStatus:
            self.status_combo.addItem(status.value, status)
        form_layout.addRow('状态:', self.status_combo)
        
        self.publish_date_edit = QDateEdit()
        self.publish_date_edit.setCalendarPopup(True)
        self.publish_date_edit.setDate(QDate.currentDate())
        form_layout.addRow('发布日期:', self.publish_date_edit)
        
        self.expire_date_edit = QDateEdit()
        self.expire_date_edit.setCalendarPopup(True)
        self.expire_date_edit.setDate(QDate.currentDate().addMonths(1))
        form_layout.addRow('过期日期:', self.expire_date_edit)
        
        self.contact_edit = QLineEdit()
        self.contact_edit.setPlaceholderText('请输入联系人')
        form_layout.addRow('联系人:', self.contact_edit)
        
        self.contact_phone_edit = QLineEdit()
        self.contact_phone_edit.setPlaceholderText('请输入联系电话')
        form_layout.addRow('联系电话:', self.contact_phone_edit)
        
        layout.addLayout(form_layout)
        
        if self.job:
            self.title_edit.setText(self.job.title)
            self.company_edit.setText(self.job.company)
            self.location_edit.setText(self.job.location)
            self.salary_edit.setText(self.job.salary_range)
            self.requirements_edit.setPlainText(self.job.requirements or '')
            self.benefits_edit.setPlainText(self.job.benefits or '')
            self.return_fee_condition_edit.setPlainText(self.job.return_fee_condition or '')
            self.return_fee_amount_spin.setValue(self.job.return_fee_amount)
            self.status_combo.setCurrentText(self.job.status.value)
            self.publish_date_edit.setDate(QDate(self.job.publish_date.year, self.job.publish_date.month, self.job.publish_date.day))
            if self.job.expire_date:
                self.expire_date_edit.setDate(QDate(self.job.expire_date.year, self.job.expire_date.month, self.job.expire_date.day))
            self.contact_edit.setText(self.job.contact_person or '')
            self.contact_phone_edit.setText(self.job.contact_phone or '')
        
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
        title = self.title_edit.text().strip()
        company = self.company_edit.text().strip()
        location = self.location_edit.text().strip()
        salary = self.salary_edit.text().strip()
        
        if not all([title, company, location, salary]):
            QMessageBox.warning(self, '提示', '请填写必要信息')
            return
            
        job = Job(
            id=self.job.id if self.job else None,
            title=title,
            company=company,
            location=location,
            salary_range=salary,
            requirements=self.requirements_edit.toPlainText(),
            benefits=self.benefits_edit.toPlainText(),
            return_fee_condition=self.return_fee_condition_edit.toPlainText(),
            return_fee_amount=self.return_fee_amount_spin.value(),
            status=self.status_combo.currentData(),
            publish_date=self.publish_date_edit.date().toPyDate(),
            expire_date=self.expire_date_edit.date().toPyDate(),
            contact_person=self.contact_edit.text(),
            contact_phone=self.contact_phone_edit.text(),
            created_at=self.job.created_at if self.job else datetime.now(),
            updated_at=datetime.now()
        )
        
        if self.job:
            self.db.update_job(job)
        else:
            self.db.add_job(job)
            
        self.accept()


class JobManagementWidget(QWidget):
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        header_layout = QHBoxLayout()
        
        title = QLabel('岗位发布管理')
        title.setStyleSheet('font-size: 24px; font-weight: bold; color: #2c3e50;')
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        self.filter_combo = QComboBox()
        self.filter_combo.addItems(['全部', '招聘中', '暂停', '已关闭', '已过期'])
        self.filter_combo.currentTextChanged.connect(self.filter_jobs)
        header_layout.addWidget(self.filter_combo)
        
        add_btn = QPushButton('添加岗位')
        add_btn.setStyleSheet('background-color: #27ae60; color: white; padding: 8px 15px;')
        add_btn.clicked.connect(self.add_job)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        
        self.table = QTableWidget()
        self.table.setColumnCount(9)
        self.table.setHorizontalHeaderLabels([
            '岗位名称', '公司', '薪资范围', '返费金额', '返费条件',
            '状态', '发布日期', '过期日期', '操作'
        ])
        
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(1, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(4, QHeaderView.Stretch)
        header.setSectionResizeMode(5, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(6, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(7, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(8, QHeaderView.ResizeToContents)
        
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setAlternatingRowColors(True)
        
        layout.addWidget(self.table)
        
    def refresh(self):
        self.load_jobs()
        
    def filter_jobs(self, status_text: str):
        self.load_jobs(status_text if status_text != '全部' else None)
        
    def load_jobs(self, status_filter: str = None):
        self.table.setRowCount(0)
        
        status = JobStatus(status_filter) if status_filter else None
        jobs = self.db.get_jobs(status)
        
        for job in jobs:
            row = self.table.rowCount()
            self.table.insertRow(row)
            
            self.table.setItem(row, 0, QTableWidgetItem(job.title))
            self.table.setItem(row, 1, QTableWidgetItem(job.company))
            self.table.setItem(row, 2, QTableWidgetItem(job.salary_range))
            self.table.setItem(row, 3, QTableWidgetItem(f'¥{job.return_fee_amount:.0f}'))
            self.table.setItem(row, 4, QTableWidgetItem(job.return_fee_condition or '-'))
            
            status_item = QTableWidgetItem(job.status.value)
            status_item.setBackground(QColor(get_status_color(job.status.value)))
            status_item.setForeground(QColor('white'))
            self.table.setItem(row, 5, status_item)
            
            self.table.setItem(row, 6, QTableWidgetItem(format_date(job.publish_date)))
            
            expire_item = QTableWidgetItem(format_date(job.expire_date))
            if job.expire_date and job.expire_date < date.today():
                expire_item.setForeground(QColor('#e74c3c'))
            self.table.setItem(row, 7, expire_item)
            
            btn_widget = QWidget()
            btn_layout = QHBoxLayout(btn_widget)
            btn_layout.setContentsMargins(5, 2, 5, 2)
            
            edit_btn = QPushButton('编辑')
            edit_btn.setStyleSheet('padding: 3px 8px;')
            edit_btn.clicked.connect(lambda checked, j=job: self.edit_job(j))
            btn_layout.addWidget(edit_btn)
            
            self.table.setCellWidget(row, 8, btn_widget)
            
    def add_job(self):
        dialog = JobDialog(self.db, parent=self)
        if dialog.exec_():
            self.refresh()
            
    def edit_job(self, job: Job):
        dialog = JobDialog(self.db, job, parent=self)
        if dialog.exec_():
            self.refresh()