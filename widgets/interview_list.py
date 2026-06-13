from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QGroupBox,
    QTableWidget, QTableWidgetItem, QPushButton, QHeaderView,
    QAbstractItemView, QDialog, QFormLayout, QLineEdit, QTextEdit,
    QComboBox, QDateTimeEdit, QMessageBox
)
from PyQt5.QtCore import Qt, QDateTime
from PyQt5.QtGui import QColor
from datetime import datetime, date, timedelta

from database import Database
from models import Interview, InterviewStatus, Job
from utils import get_status_color, format_datetime


class InterviewDialog(QDialog):
    def __init__(self, db: Database, jobs: list, interview: Interview = None, parent=None):
        super().__init__(parent)
        self.db = db
        self.jobs = jobs
        self.interview = interview
        self.init_ui()
        
    def init_ui(self):
        self.setWindowTitle('添加面试' if not self.interview else '编辑面试')
        self.setMinimumWidth(500)
        
        layout = QVBoxLayout(self)
        
        form_layout = QFormLayout()
        
        self.job_combo = QComboBox()
        for job in self.jobs:
            self.job_combo.addItem(f'{job.title} - {job.company}', job.id)
        form_layout.addRow('岗位:', self.job_combo)
        
        self.candidate_edit = QLineEdit()
        self.candidate_edit.setPlaceholderText('请输入候选人姓名')
        form_layout.addRow('候选人:', self.candidate_edit)
        
        self.phone_edit = QLineEdit()
        self.phone_edit.setPlaceholderText('请输入联系电话')
        form_layout.addRow('电话:', self.phone_edit)
        
        self.time_edit = QDateTimeEdit()
        self.time_edit.setCalendarPopup(True)
        self.time_edit.setDateTime(QDateTime.currentDateTime())
        form_layout.addRow('面试时间:', self.time_edit)
        
        self.location_edit = QLineEdit()
        self.location_edit.setPlaceholderText('请输入面试地点')
        form_layout.addRow('面试地点:', self.location_edit)
        
        self.interviewer_edit = QLineEdit()
        self.interviewer_edit.setPlaceholderText('请输入面试官')
        form_layout.addRow('面试官:', self.interviewer_edit)
        
        self.status_combo = QComboBox()
        for status in InterviewStatus:
            self.status_combo.addItem(status.value, status)
        form_layout.addRow('状态:', self.status_combo)
        
        self.notes_edit = QTextEdit()
        self.notes_edit.setPlaceholderText('请输入备注')
        self.notes_edit.setMaximumHeight(80)
        form_layout.addRow('备注:', self.notes_edit)
        
        layout.addLayout(form_layout)
        
        if self.interview:
            idx = self.job_combo.findData(self.interview.job_id)
            if idx >= 0:
                self.job_combo.setCurrentIndex(idx)
            self.candidate_edit.setText(self.interview.candidate_name)
            self.phone_edit.setText(self.interview.candidate_phone)
            self.time_edit.setDateTime(QDateTime(
                self.interview.interview_time.year,
                self.interview.interview_time.month,
                self.interview.interview_time.day,
                self.interview.interview_time.hour,
                self.interview.interview_time.minute
            ))
            self.location_edit.setText(self.interview.location)
            self.interviewer_edit.setText(self.interview.interviewer)
            self.status_combo.setCurrentText(self.interview.status.value)
            self.notes_edit.setPlainText(self.interview.notes or '')
        
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
        candidate = self.candidate_edit.text().strip()
        phone = self.phone_edit.text().strip()
        location = self.location_edit.text().strip()
        interviewer = self.interviewer_edit.text().strip()
        
        if not all([candidate, phone, location, interviewer]):
            QMessageBox.warning(self, '提示', '请填写必要信息')
            return
            
        interview = Interview(
            id=self.interview.id if self.interview else None,
            job_id=self.job_combo.currentData(),
            candidate_name=candidate,
            candidate_phone=phone,
            interview_time=self.time_edit.dateTime().toPyDateTime(),
            location=location,
            interviewer=interviewer,
            status=self.status_combo.currentData(),
            notes=self.notes_edit.toPlainText(),
            created_at=self.interview.created_at if self.interview else datetime.now(),
            updated_at=datetime.now()
        )
        
        if self.interview:
            self.db.update_interview(interview)
        else:
            self.db.add_interview(interview)
            
        self.accept()


class InterviewListWidget(QWidget):
    def __init__(self, db: Database, parent_window=None):
        super().__init__()
        self.db = db
        self.parent_window = parent_window
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        header_layout = QHBoxLayout()
        
        title = QLabel('面试名单管理')
        title.setStyleSheet('font-size: 24px; font-weight: bold; color: #2c3e50;')
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        self.filter_combo = QComboBox()
        self.filter_combo.addItems(['全部', '待面试', '已面试', '爽约', '通过', '未通过'])
        self.filter_combo.currentTextChanged.connect(self.filter_interviews)
        header_layout.addWidget(self.filter_combo)
        
        add_btn = QPushButton('添加面试')
        add_btn.setStyleSheet('background-color: #27ae60; color: white; padding: 8px 15px;')
        add_btn.clicked.connect(self.add_interview)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        
        self.table = QTableWidget()
        self.table.setColumnCount(8)
        self.table.setHorizontalHeaderLabels([
            '候选人', '联系电话', '岗位', '面试时间', '地点', '面试官', '状态', '操作'
        ])
        
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(1, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, QHeaderView.Stretch)
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(4, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(5, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(6, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(7, QHeaderView.ResizeToContents)
        
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setAlternatingRowColors(True)
        
        layout.addWidget(self.table)
        
    def refresh(self):
        self.load_interviews()
        
    def filter_interviews(self, status_text: str):
        self.load_interviews(status_text if status_text != '全部' else None)
        
    def load_interviews(self, status_filter: str = None):
        self.table.setRowCount(0)
        
        status = InterviewStatus(status_filter) if status_filter else None
        interviews = self.db.get_interviews(status)
        
        jobs = {j.id: j for j in self.db.get_jobs()}
        
        for interview in interviews:
            row = self.table.rowCount()
            self.table.insertRow(row)
            
            self.table.setItem(row, 0, QTableWidgetItem(interview.candidate_name))
            self.table.setItem(row, 1, QTableWidgetItem(interview.candidate_phone))
            
            job = jobs.get(interview.job_id)
            self.table.setItem(row, 2, QTableWidgetItem(job.title if job else '-'))
            
            self.table.setItem(row, 3, QTableWidgetItem(format_datetime(interview.interview_time)))
            self.table.setItem(row, 4, QTableWidgetItem(interview.location))
            self.table.setItem(row, 5, QTableWidgetItem(interview.interviewer))
            
            status_item = QTableWidgetItem(interview.status.value)
            status_item.setBackground(QColor(get_status_color(interview.status.value)))
            status_item.setForeground(QColor('white'))
            self.table.setItem(row, 6, status_item)
            
            btn_widget = QWidget()
            btn_layout = QHBoxLayout(btn_widget)
            btn_layout.setContentsMargins(5, 2, 5, 2)
            
            edit_btn = QPushButton('编辑')
            edit_btn.setStyleSheet('padding: 3px 8px;')
            edit_btn.clicked.connect(lambda checked, i=interview: self.edit_interview(i))
            btn_layout.addWidget(edit_btn)
            
            if interview.status == InterviewStatus.PASSED:
                receipt_btn = QPushButton('入职')
                receipt_btn.setStyleSheet('padding: 3px 8px; background-color: #27ae60; color: white;')
                receipt_btn.clicked.connect(lambda checked, i=interview: self.create_receipt(i))
                btn_layout.addWidget(receipt_btn)
            
            self.table.setCellWidget(row, 7, btn_widget)
            
    def add_interview(self):
        jobs = self.db.get_jobs()
        dialog = InterviewDialog(self.db, jobs, parent=self)
        if dialog.exec_():
            self.refresh()
            
    def edit_interview(self, interview: Interview):
        jobs = self.db.get_jobs()
        dialog = InterviewDialog(self.db, jobs, interview, parent=self)
        if dialog.exec_():
            self.refresh()
            
    def create_receipt(self, interview: Interview):
        from widgets.receipt_handler import ReceiptDialog
        
        jobs = {j.id: j for j in self.db.get_jobs()}
        job = jobs.get(interview.job_id)
        
        if self.parent_window:
            self.parent_window.switch_page('receipts')
            
        dialog = ReceiptDialog(self.db, [interview], jobs, parent=self)
        dialog.candidate_edit.setText(interview.candidate_name)
        if job:
            dialog.company_edit.setText(job.company)
            dialog.return_fee_amount_spin.setValue(job.return_fee_amount)
            stability_days = job.return_fee_condition if job.return_fee_condition else 30
            try:
                days = int(''.join(filter(str.isdigit, str(stability_days))))
                due_date = date.today() + timedelta(days=days)
                dialog.return_fee_due_date_edit.setDate(QDate(due_date.year, due_date.month, due_date.day))
            except:
                pass
        
        if dialog.exec_():
            self.refresh()