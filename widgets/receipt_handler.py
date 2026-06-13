from PyQt5.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QGroupBox,
    QTableWidget, QTableWidgetItem, QPushButton, QHeaderView,
    QAbstractItemView, QDialog, QFormLayout, QLineEdit, QTextEdit,
    QComboBox, QDateEdit, QDoubleSpinBox, QMessageBox, QFileDialog
)
from PyQt5.QtCore import Qt, QDate
from PyQt5.QtGui import QColor
from datetime import date, datetime, timedelta

from database import Database
from models import OnboardingReceipt, ReceiptStatus, Interview, Job
from utils import get_status_color, format_date


class ReceiptDialog(QDialog):
    def __init__(self, db: Database, interviews: list, jobs: dict, receipt: OnboardingReceipt = None, parent=None):
        super().__init__(parent)
        self.db = db
        self.interviews = interviews
        self.jobs = jobs
        self.receipt = receipt
        self.interview_jobs_map = {}
        for interview in interviews:
            self.interview_jobs_map[interview.id] = interview.job_id
        self.init_ui()
        
    def init_ui(self):
        self.setWindowTitle('添加入职回执' if not self.receipt else '编辑入职回执')
        self.setMinimumWidth(550)
        
        layout = QVBoxLayout(self)
        
        form_layout = QFormLayout()
        
        self.interview_combo = QComboBox()
        for interview in self.interviews:
            job = self.jobs.get(interview.job_id)
            self.interview_combo.addItem(
                f'{interview.candidate_name} - {job.title if job else "未知岗位"}',
                interview.id
            )
        form_layout.addRow('关联面试:', self.interview_combo)
        
        self.candidate_edit = QLineEdit()
        self.candidate_edit.setPlaceholderText('请输入候选人姓名')
        form_layout.addRow('候选人姓名:', self.candidate_edit)
        
        self.company_edit = QLineEdit()
        self.company_edit.setPlaceholderText('请输入入职公司')
        form_layout.addRow('入职公司:', self.company_edit)
        
        self.onboarding_date_edit = QDateEdit()
        self.onboarding_date_edit.setCalendarPopup(True)
        self.onboarding_date_edit.setDate(QDate.currentDate())
        form_layout.addRow('入职日期:', self.onboarding_date_edit)
        
        self.receipt_number_edit = QLineEdit()
        self.receipt_number_edit.setPlaceholderText('请输入回执编号')
        form_layout.addRow('回执编号:', self.receipt_number_edit)
        
        self.receipt_photo_btn = QPushButton('选择照片')
        self.receipt_photo_btn.clicked.connect(self.select_photo)
        self.receipt_photo_path = ''
        self.receipt_photo_label = QLabel('未选择')
        photo_layout = QHBoxLayout()
        photo_layout.addWidget(self.receipt_photo_btn)
        photo_layout.addWidget(self.receipt_photo_label)
        photo_layout.addStretch()
        form_layout.addRow('回执照片:', photo_layout)
        
        self.status_combo = QComboBox()
        for status in ReceiptStatus:
            self.status_combo.addItem(status.value, status)
        form_layout.addRow('状态:', self.status_combo)
        
        self.return_fee_amount_spin = QDoubleSpinBox()
        self.return_fee_amount_spin.setRange(0, 999999)
        self.return_fee_amount_spin.setPrefix('¥')
        form_layout.addRow('返费金额:', self.return_fee_amount_spin)
        
        self.return_fee_due_date_edit = QDateEdit()
        self.return_fee_due_date_edit.setCalendarPopup(True)
        self.return_fee_due_date_edit.setDate(QDate.currentDate().addDays(30))
        form_layout.addRow('返费到期日:', self.return_fee_due_date_edit)
        
        self.notes_edit = QTextEdit()
        self.notes_edit.setPlaceholderText('请输入备注')
        self.notes_edit.setMaximumHeight(80)
        form_layout.addRow('备注:', self.notes_edit)
        
        layout.addLayout(form_layout)
        
        if self.receipt:
            idx = self.interview_combo.findData(self.receipt.interview_id)
            if idx >= 0:
                self.interview_combo.setCurrentIndex(idx)
            self.candidate_edit.setText(self.receipt.candidate_name)
            self.company_edit.setText(self.receipt.company)
            self.onboarding_date_edit.setDate(QDate(
                self.receipt.onboarding_date.year,
                self.receipt.onboarding_date.month,
                self.receipt.onboarding_date.day
            ))
            self.receipt_number_edit.setText(self.receipt.receipt_number)
            self.receipt_photo_path = self.receipt.receipt_photo or ''
            self.receipt_photo_label.setText('已选择' if self.receipt_photo_path else '未选择')
            self.status_combo.setCurrentText(self.receipt.status.value)
            self.return_fee_amount_spin.setValue(self.receipt.return_fee_amount)
            if self.receipt.return_fee_due_date:
                self.return_fee_due_date_edit.setDate(QDate(
                    self.receipt.return_fee_due_date.year,
                    self.receipt.return_fee_due_date.month,
                    self.receipt.return_fee_due_date.day
                ))
            self.notes_edit.setPlainText(self.receipt.notes or '')
        
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
        
    def select_photo(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, '选择回执照片', '', 'Images (*.png *.jpg *.jpeg *.bmp)'
        )
        if file_path:
            self.receipt_photo_path = file_path
            self.receipt_photo_label.setText('已选择')
            
    def save(self):
        candidate = self.candidate_edit.text().strip()
        company = self.company_edit.text().strip()
        receipt_number = self.receipt_number_edit.text().strip()
        
        if not all([candidate, company, receipt_number]):
            QMessageBox.warning(self, '提示', '请填写必要信息')
            return
        
        interview_id = self.interview_combo.currentData()
        job_id = self.interview_jobs_map.get(interview_id, 0)
        
        receipt = OnboardingReceipt(
            id=self.receipt.id if self.receipt else None,
            interview_id=interview_id,
            candidate_name=candidate,
            job_id=job_id,
            company=company,
            onboarding_date=self.onboarding_date_edit.date().toPyDate(),
            receipt_photo=self.receipt_photo_path,
            receipt_number=receipt_number,
            status=self.status_combo.currentData(),
            return_fee_due_date=self.return_fee_due_date_edit.date().toPyDate(),
            return_fee_amount=self.return_fee_amount_spin.value(),
            notes=self.notes_edit.toPlainText(),
            created_at=self.receipt.created_at if self.receipt else datetime.now(),
            updated_at=datetime.now()
        )
        
        if self.receipt:
            self.db.update_receipt(receipt)
        else:
            self.db.add_receipt(receipt)
            
        self.accept()


class ReceiptHandlerWidget(QWidget):
    def __init__(self, db: Database):
        super().__init__()
        self.db = db
        self.init_ui()
        
    def init_ui(self):
        layout = QVBoxLayout(self)
        
        header_layout = QHBoxLayout()
        
        title = QLabel('入职回执处理')
        title.setStyleSheet('font-size: 24px; font-weight: bold; color: #2c3e50;')
        header_layout.addWidget(title)
        
        header_layout.addStretch()
        
        self.filter_combo = QComboBox()
        self.filter_combo.addItems(['全部', '待处理', '已核实', '已驳回', '已归档'])
        self.filter_combo.currentTextChanged.connect(self.filter_receipts)
        header_layout.addWidget(self.filter_combo)
        
        add_btn = QPushButton('添加回执')
        add_btn.setStyleSheet('background-color: #27ae60; color: white; padding: 8px 15px;')
        add_btn.clicked.connect(self.add_receipt)
        header_layout.addWidget(add_btn)
        
        layout.addLayout(header_layout)
        
        self.table = QTableWidget()
        self.table.setColumnCount(9)
        self.table.setHorizontalHeaderLabels([
            '候选人', '公司', '入职日期', '回执编号', '返费金额',
            '返费到期', '状态', '创建时间', '操作'
        ])
        
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(1, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(2, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(4, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(5, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(6, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(7, QHeaderView.ResizeToContents)
        header.setSectionResizeMode(8, QHeaderView.ResizeToContents)
        
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setEditTriggers(QAbstractItemView.NoEditTriggers)
        self.table.setAlternatingRowColors(True)
        
        layout.addWidget(self.table)
        
    def refresh(self):
        self.load_receipts()
        
    def filter_receipts(self, status_text: str):
        self.load_receipts(status_text if status_text != '全部' else None)
        
    def load_receipts(self, status_filter: str = None):
        self.table.setRowCount(0)
        
        status = ReceiptStatus(status_filter) if status_filter else None
        receipts = self.db.get_receipts(status)
        
        for receipt in receipts:
            row = self.table.rowCount()
            self.table.insertRow(row)
            
            self.table.setItem(row, 0, QTableWidgetItem(receipt.candidate_name))
            self.table.setItem(row, 1, QTableWidgetItem(receipt.company))
            self.table.setItem(row, 2, QTableWidgetItem(format_date(receipt.onboarding_date)))
            self.table.setItem(row, 3, QTableWidgetItem(receipt.receipt_number))
            self.table.setItem(row, 4, QTableWidgetItem(f'¥{receipt.return_fee_amount:.0f}'))
            self.table.setItem(row, 5, QTableWidgetItem(format_date(receipt.return_fee_due_date)))
            
            status_item = QTableWidgetItem(receipt.status.value)
            status_item.setBackground(QColor(get_status_color(receipt.status.value)))
            status_item.setForeground(QColor('white'))
            self.table.setItem(row, 6, status_item)
            
            self.table.setItem(row, 7, QTableWidgetItem(format_date(receipt.created_at.date())))
            
            btn_widget = QWidget()
            btn_layout = QHBoxLayout(btn_widget)
            btn_layout.setContentsMargins(5, 2, 5, 2)
            
            edit_btn = QPushButton('编辑')
            edit_btn.setStyleSheet('padding: 3px 8px;')
            edit_btn.clicked.connect(lambda checked, r=receipt: self.edit_receipt(r))
            btn_layout.addWidget(edit_btn)
            
            if receipt.status == ReceiptStatus.PENDING:
                verify_btn = QPushButton('核实')
                verify_btn.setStyleSheet('padding: 3px 8px; background-color: #27ae60; color: white;')
                verify_btn.clicked.connect(lambda checked, r=receipt: self.verify_receipt(r))
                btn_layout.addWidget(verify_btn)
                
                reject_btn = QPushButton('驳回')
                reject_btn.setStyleSheet('padding: 3px 8px; background-color: #e74c3c; color: white;')
                reject_btn.clicked.connect(lambda checked, r=receipt: self.reject_receipt(r))
                btn_layout.addWidget(reject_btn)
            
            self.table.setCellWidget(row, 8, btn_widget)
            
    def add_receipt(self):
        interviews = self.db.get_interviews()
        passed_interviews = [i for i in interviews if i.status.value == '通过']
        jobs = {j.id: j for j in self.db.get_jobs()}
        
        dialog = ReceiptDialog(self.db, passed_interviews, jobs, parent=self)
        if dialog.exec_():
            self.refresh()
            
    def edit_receipt(self, receipt: OnboardingReceipt):
        interviews = self.db.get_interviews()
        passed_interviews = [i for i in interviews if i.status.value == '通过']
        
        if receipt.interview_id:
            target_interview = next((i for i in passed_interviews if i.id == receipt.interview_id), None)
            if target_interview and target_interview not in passed_interviews:
                passed_interviews.insert(0, target_interview)
        
        jobs = {j.id: j for j in self.db.get_jobs()}
        
        dialog = ReceiptDialog(self.db, passed_interviews, jobs, receipt, parent=self)
        if dialog.exec_():
            self.refresh()
            
    def verify_receipt(self, receipt: OnboardingReceipt):
        from models import StabilityTracking, StabilityStatus, ChangeLog
        
        trackings = self.db.get_stability_trackings()
        existing = [t for t in trackings if t.receipt_id == receipt.id]
        if existing:
            QMessageBox.warning(self, '提示', '该回执已存在稳定期跟踪记录')
            return
        
        old_status = receipt.status.value
        receipt.status = ReceiptStatus.VERIFIED
        self.db.update_receipt(receipt)
        
        job = self.db.get_job(receipt.job_id)
        stability_days_str = job.return_fee_condition if job else '30天'
        try:
            days = int(''.join(filter(str.isdigit, str(stability_days_str))))
        except:
            days = 30
            
        tracking = StabilityTracking(
            id=None,
            receipt_id=receipt.id,
            candidate_name=receipt.candidate_name,
            company=receipt.company,
            onboarding_date=receipt.onboarding_date,
            stability_period_days=days,
            current_work_days=0,
            status=StabilityStatus.IN_PROGRESS,
            last_check_date=None,
            next_check_date=receipt.onboarding_date + timedelta(days=7),
            risk_notes='',
            return_fee_paid=False,
            return_fee_date=None,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.db.add_stability_tracking(tracking)
        
        change_log = ChangeLog(
            id=None,
            entity_type='receipt',
            entity_id=receipt.id,
            action='核实',
            old_value=old_status,
            new_value=receipt.status.value,
            operator='运营',
            created_at=datetime.now()
        )
        self.db.add_change_log(change_log)
        
        QMessageBox.information(self, '成功', '回执已核实，稳定期跟踪已自动创建')
        self.refresh()
        
    def reject_receipt(self, receipt: OnboardingReceipt):
        receipt.status = ReceiptStatus.REJECTED
        self.db.update_receipt(receipt)
        QMessageBox.information(self, '成功', '回执已驳回')
        self.refresh()