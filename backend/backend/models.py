from datetime import datetime
from enum import Enum
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db

class Role(str, Enum):
    STORE_MANAGER = 'store_manager'
    OPERATION_SUPERVISOR = 'operation_supervisor'
    INVESTMENT_MANAGER = 'investment_manager'

class DiscountStatus(str, Enum):
    DRAFT = 'draft'
    PENDING_REVIEW = 'pending_review'
    REVIEWING = 'reviewing'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    EXCEPTION = 'exception'
    ARCHIVED = 'archived'

class PriceReportStatus(str, Enum):
    PENDING = 'pending'
    REPORTED = 'reported'
    VERIFIED = 'verified'
    REJECTED = 'rejected'
    EXCEPTION = 'exception'

class RecordType(str, Enum):
    OLD_LEDGER = 'old_ledger'
    ON_SITE = 'on_site'
    SCREENSHOT = 'screenshot'
    COMMUNICATION = 'communication'

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    store_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'role': self.role,
            'store_name': self.store_name,
            'created_at': self.created_at.isoformat()
        }

class DiscountCampaign(db.Model):
    __tablename__ = 'discount_campaigns'

    id = db.Column(db.Integer, primary_key=True)
    campaign_no = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    brand_name = db.Column(db.String(100), nullable=False)
    store_name = db.Column(db.String(100), nullable=False)
    discount_type = db.Column(db.String(50))
    discount_rate = db.Column(db.Float)
    min_amount = db.Column(db.Float)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default=DiscountStatus.DRAFT.value, nullable=False)
    exception_reason = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    review_comment = db.Column(db.Text)
    approval_comment = db.Column(db.Text)
    reject_reason = db.Column(db.Text)

    creator = db.relationship('User', foreign_keys=[created_by], backref='created_campaigns')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], backref='reviewed_campaigns')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_campaigns')
    price_reports = db.relationship('PriceReport', backref='campaign', lazy='dynamic', cascade='all, delete-orphan')
    records = db.relationship('AttachmentRecord', backref='campaign', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'campaign_no': self.campaign_no,
            'title': self.title,
            'brand_name': self.brand_name,
            'store_name': self.store_name,
            'discount_type': self.discount_type,
            'discount_rate': self.discount_rate,
            'min_amount': self.min_amount,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'description': self.description,
            'status': self.status,
            'exception_reason': self.exception_reason,
            'created_by': self.created_by,
            'creator_name': self.creator.name if self.creator else None,
            'reviewer_name': self.reviewer.name if self.reviewer else None,
            'approver_name': self.approver.name if self.approver else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'review_comment': self.review_comment,
            'approval_comment': self.approval_comment,
            'reject_reason': self.reject_reason,
            'price_report_count': self.price_reports.count()
        }
        if include_details:
            data['price_reports'] = [pr.to_dict() for pr in self.price_reports]
            data['records'] = [r.to_dict() for r in self.records]
        return data

class PriceReport(db.Model):
    __tablename__ = 'price_reports'

    id = db.Column(db.Integer, primary_key=True)
    report_no = db.Column(db.String(50), unique=True, nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('discount_campaigns.id'), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)
    product_code = db.Column(db.String(50))
    original_price = db.Column(db.Float, nullable=False)
    discount_price = db.Column(db.Float, nullable=False)
    discount_rate = db.Column(db.Float)
    report_date = db.Column(db.Date)
    status = db.Column(db.String(20), default=PriceReportStatus.PENDING.value, nullable=False)
    exception_reason = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verify_comment = db.Column(db.Text)
    reject_reason = db.Column(db.Text)

    creator = db.relationship('User', foreign_keys=[created_by], backref='created_reports')
    verifier = db.relationship('User', foreign_keys=[verified_by], backref='verified_reports')

    def to_dict(self):
        return {
            'id': self.id,
            'report_no': self.report_no,
            'campaign_id': self.campaign_id,
            'campaign_title': self.campaign.title if self.campaign else None,
            'product_name': self.product_name,
            'product_code': self.product_code,
            'original_price': self.original_price,
            'discount_price': self.discount_price,
            'discount_rate': self.discount_rate,
            'report_date': self.report_date.isoformat() if self.report_date else None,
            'status': self.status,
            'exception_reason': self.exception_reason,
            'creator_name': self.creator.name if self.creator else None,
            'verifier_name': self.verifier.name if self.verifier else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'verify_comment': self.verify_comment,
            'reject_reason': self.reject_reason
        }

class AttachmentRecord(db.Model):
    __tablename__ = 'attachment_records'

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('discount_campaigns.id'))
    price_report_id = db.Column(db.Integer, db.ForeignKey('price_reports.id'))
    record_type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)
    file_url = db.Column(db.String(500))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    remark = db.Column(db.Text)

    creator = db.relationship('User', backref='created_records')

    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'price_report_id': self.price_report_id,
            'record_type': self.record_type,
            'title': self.title,
            'content': self.content,
            'file_url': self.file_url,
            'creator_name': self.creator.name if self.creator else None,
            'created_at': self.created_at.isoformat(),
            'remark': self.remark
        }

class OperationLog(db.Model):
    __tablename__ = 'operation_logs'

    id = db.Column(db.Integer, primary_key=True)
    module = db.Column(db.String(50), nullable=False)
    operation = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.Integer)
    target_type = db.Column(db.String(50))
    operator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    operator_role = db.Column(db.String(20))
    old_status = db.Column(db.String(20))
    new_status = db.Column(db.String(20))
    detail = db.Column(db.Text)
    ip_address = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    operator = db.relationship('User', backref='operation_logs')

    def to_dict(self):
        return {
            'id': self.id,
            'module': self.module,
            'operation': self.operation,
            'target_id': self.target_id,
            'target_type': self.target_type,
            'operator_id': self.operator_id,
            'operator_name': self.operator.name if self.operator else None,
            'operator_role': self.operator_role,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'detail': self.detail,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat()
        }

def init_test_data():
    if User.query.count() == 0:
        users = [
            {'username': 'store1', 'name': '品牌店长-李宁', 'role': Role.STORE_MANAGER.value, 'store_name': '李宁专卖店', 'password': '123456'},
            {'username': 'store2', 'name': '品牌店长-耐克', 'role': Role.STORE_MANAGER.value, 'store_name': '耐克专卖店', 'password': '123456'},
            {'username': 'supervisor1', 'name': '营运督导-张三', 'role': Role.OPERATION_SUPERVISOR.value, 'password': '123456'},
            {'username': 'supervisor2', 'name': '营运督导-李四', 'role': Role.OPERATION_SUPERVISOR.value, 'password': '123456'},
            {'username': 'manager1', 'name': '招商经理-王五', 'role': Role.INVESTMENT_MANAGER.value, 'password': '123456'},
        ]
        for u in users:
            user = User(
                username=u['username'],
                name=u['name'],
                role=u['role'],
                store_name=u.get('store_name')
            )
            user.set_password(u['password'])
            db.session.add(user)
        db.session.commit()
