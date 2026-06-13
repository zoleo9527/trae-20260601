import sqlite3
from datetime import datetime, date, timedelta
from typing import List, Optional
from models import (
    Job, Interview, OnboardingReceipt, StabilityTracking, ChangeLog,
    JobStatus, InterviewStatus, ReceiptStatus, StabilityStatus
)


class Database:
    def __init__(self, db_path: str = "recruitment.db"):
        self.db_path = db_path
        self.init_database()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT NOT NULL,
                salary_range TEXT NOT NULL,
                requirements TEXT,
                benefits TEXT,
                return_fee_condition TEXT,
                return_fee_amount REAL DEFAULT 0,
                status TEXT DEFAULT '招聘中',
                publish_date TEXT NOT NULL,
                expire_date TEXT,
                contact_person TEXT,
                contact_phone TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS interviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                candidate_name TEXT NOT NULL,
                candidate_phone TEXT NOT NULL,
                interview_time TEXT NOT NULL,
                location TEXT NOT NULL,
                interviewer TEXT NOT NULL,
                status TEXT DEFAULT '待面试',
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS onboarding_receipts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interview_id INTEGER NOT NULL,
                candidate_name TEXT NOT NULL,
                job_id INTEGER NOT NULL,
                company TEXT NOT NULL,
                onboarding_date TEXT NOT NULL,
                receipt_photo TEXT,
                receipt_number TEXT NOT NULL,
                status TEXT DEFAULT '待处理',
                return_fee_due_date TEXT,
                return_fee_amount REAL DEFAULT 0,
                notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (interview_id) REFERENCES interviews(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stability_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_id INTEGER NOT NULL,
                candidate_name TEXT NOT NULL,
                company TEXT NOT NULL,
                onboarding_date TEXT NOT NULL,
                stability_period_days INTEGER DEFAULT 30,
                current_work_days INTEGER DEFAULT 0,
                status TEXT DEFAULT '稳定期中',
                last_check_date TEXT,
                next_check_date TEXT,
                risk_notes TEXT,
                return_fee_paid INTEGER DEFAULT 0,
                return_fee_date TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (receipt_id) REFERENCES onboarding_receipts(id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS change_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                entity_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                operator TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')

        conn.commit()
        conn.close()

    def add_job(self, job: Job) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO jobs (title, company, location, salary_range, requirements,
                benefits, return_fee_condition, return_fee_amount, status,
                publish_date, expire_date, contact_person, contact_phone,
                created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (job.title, job.company, job.location, job.salary_range,
              job.requirements, job.benefits, job.return_fee_condition,
              job.return_fee_amount, job.status.value, job.publish_date.isoformat(),
              job.expire_date.isoformat() if job.expire_date else None,
              job.contact_person, job.contact_phone, now, now))
        job_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return job_id

    def get_jobs(self, status: Optional[JobStatus] = None) -> List[Job]:
        conn = self.get_connection()
        cursor = conn.cursor()
        if status:
            cursor.execute('SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC', (status.value,))
        else:
            cursor.execute('SELECT * FROM jobs ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_job(row) for row in rows]

    def get_job(self, job_id: int) -> Optional[Job]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM jobs WHERE id = ?', (job_id,))
        row = cursor.fetchone()
        conn.close()
        return self._row_to_job(row) if row else None

    def update_job(self, job: Job) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            UPDATE jobs SET title=?, company=?, location=?, salary_range=?,
                requirements=?, benefits=?, return_fee_condition=?, return_fee_amount=?,
                status=?, expire_date=?, contact_person=?, contact_phone=?, updated_at=?
            WHERE id=?
        ''', (job.title, job.company, job.location, job.salary_range,
              job.requirements, job.benefits, job.return_fee_condition,
              job.return_fee_amount, job.status.value,
              job.expire_date.isoformat() if job.expire_date else None,
              job.contact_person, job.contact_phone, now, job.id))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success

    def add_interview(self, interview: Interview) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO interviews (job_id, candidate_name, candidate_phone,
                interview_time, location, interviewer, status, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (interview.job_id, interview.candidate_name, interview.candidate_phone,
              interview.interview_time.isoformat(), interview.location,
              interview.interviewer, interview.status.value, interview.notes, now, now))
        interview_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return interview_id

    def get_interviews(self, status: Optional[InterviewStatus] = None, job_id: Optional[int] = None) -> List[Interview]:
        conn = self.get_connection()
        cursor = conn.cursor()
        query = 'SELECT * FROM interviews WHERE 1=1'
        params = []
        if status:
            query += ' AND status = ?'
            params.append(status.value)
        if job_id:
            query += ' AND job_id = ?'
            params.append(job_id)
        query += ' ORDER BY interview_time DESC'
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_interview(row) for row in rows]

    def update_interview(self, interview: Interview) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            UPDATE interviews SET candidate_name=?, candidate_phone=?,
                interview_time=?, location=?, interviewer=?, status=?, notes=?, updated_at=?
            WHERE id=?
        ''', (interview.candidate_name, interview.candidate_phone,
              interview.interview_time.isoformat(), interview.location,
              interview.interviewer, interview.status.value, interview.notes, now, interview.id))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success

    def add_receipt(self, receipt: OnboardingReceipt) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO onboarding_receipts (interview_id, candidate_name, job_id,
                company, onboarding_date, receipt_photo, receipt_number, status,
                return_fee_due_date, return_fee_amount, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (receipt.interview_id, receipt.candidate_name, receipt.job_id,
              receipt.company, receipt.onboarding_date.isoformat(),
              receipt.receipt_photo, receipt.receipt_number, receipt.status.value,
              receipt.return_fee_due_date.isoformat() if receipt.return_fee_due_date else None,
              receipt.return_fee_amount, receipt.notes, now, now))
        receipt_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return receipt_id

    def get_receipts(self, status: Optional[ReceiptStatus] = None) -> List[OnboardingReceipt]:
        conn = self.get_connection()
        cursor = conn.cursor()
        if status:
            cursor.execute('SELECT * FROM onboarding_receipts WHERE status = ? ORDER BY created_at DESC', (status.value,))
        else:
            cursor.execute('SELECT * FROM onboarding_receipts ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_receipt(row) for row in rows]

    def update_receipt(self, receipt: OnboardingReceipt) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            UPDATE onboarding_receipts SET interview_id=?, candidate_name=?, job_id=?,
                company=?, onboarding_date=?, receipt_photo=?, receipt_number=?, 
                status=?, return_fee_due_date=?, return_fee_amount=?, notes=?, updated_at=?
            WHERE id=?
        ''', (receipt.interview_id, receipt.candidate_name, receipt.job_id,
              receipt.company, receipt.onboarding_date.isoformat(),
              receipt.receipt_photo, receipt.receipt_number, receipt.status.value,
              receipt.return_fee_due_date.isoformat() if receipt.return_fee_due_date else None,
              receipt.return_fee_amount, receipt.notes, now, receipt.id))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success

    def add_stability_tracking(self, tracking: StabilityTracking) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO stability_tracking (receipt_id, candidate_name, company,
                onboarding_date, stability_period_days, current_work_days, status,
                last_check_date, next_check_date, risk_notes, return_fee_paid,
                return_fee_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (tracking.receipt_id, tracking.candidate_name, tracking.company,
              tracking.onboarding_date.isoformat(), tracking.stability_period_days,
              tracking.current_work_days, tracking.status.value,
              tracking.last_check_date.isoformat() if tracking.last_check_date else None,
              tracking.next_check_date.isoformat() if tracking.next_check_date else None,
              tracking.risk_notes, 1 if tracking.return_fee_paid else 0,
              tracking.return_fee_date.isoformat() if tracking.return_fee_date else None,
              now, now))
        tracking_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return tracking_id

    def get_stability_trackings(self, status: Optional[StabilityStatus] = None) -> List[StabilityTracking]:
        conn = self.get_connection()
        cursor = conn.cursor()
        if status:
            cursor.execute('SELECT * FROM stability_tracking WHERE status = ? ORDER BY onboarding_date DESC', (status.value,))
        else:
            cursor.execute('SELECT * FROM stability_tracking ORDER BY onboarding_date DESC')
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_stability(row) for row in rows]

    def update_stability_tracking(self, tracking: StabilityTracking) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute('''
            UPDATE stability_tracking SET current_work_days=?, status=?,
                last_check_date=?, next_check_date=?, risk_notes=?, return_fee_paid=?,
                return_fee_date=?, updated_at=?
            WHERE id=?
        ''', (tracking.current_work_days, tracking.status.value,
              tracking.last_check_date.isoformat() if tracking.last_check_date else None,
              tracking.next_check_date.isoformat() if tracking.next_check_date else None,
              tracking.risk_notes, 1 if tracking.return_fee_paid else 0,
              tracking.return_fee_date.isoformat() if tracking.return_fee_date else None,
              now, tracking.id))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success

    def add_change_log(self, log: ChangeLog) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO change_logs (entity_type, entity_id, action, old_value, new_value, operator, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (log.entity_type, log.entity_id, log.action, log.old_value, log.new_value,
              log.operator, log.created_at.isoformat()))
        log_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return log_id

    def get_recent_changes(self, limit: int = 20) -> List[ChangeLog]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM change_logs ORDER BY created_at DESC LIMIT ?', (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_change_log(row) for row in rows]

    def get_pending_items_count(self) -> dict:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        pending_receipts = cursor.execute(
            'SELECT COUNT(*) FROM onboarding_receipts WHERE status = ?', ('待处理',)
        ).fetchone()[0]
        
        pending_interviews = cursor.execute(
            'SELECT COUNT(*) FROM interviews WHERE status = ?', ('待面试',)
        ).fetchone()[0]
        
        risk_trackings = cursor.execute(
            'SELECT COUNT(*) FROM stability_tracking WHERE status = ?', ('风险预警',)
        ).fetchone()[0]
        
        active_jobs = cursor.execute(
            'SELECT COUNT(*) FROM jobs WHERE status = ?', ('招聘中',)
        ).fetchone()[0]
        
        conn.close()
        return {
            'pending_receipts': pending_receipts,
            'pending_interviews': pending_interviews,
            'risk_trackings': risk_trackings,
            'active_jobs': active_jobs
        }

    def _row_to_job(self, row) -> Job:
        return Job(
            id=row['id'],
            title=row['title'],
            company=row['company'],
            location=row['location'],
            salary_range=row['salary_range'],
            requirements=row['requirements'],
            benefits=row['benefits'],
            return_fee_condition=row['return_fee_condition'],
            return_fee_amount=row['return_fee_amount'],
            status=JobStatus(row['status']),
            publish_date=date.fromisoformat(row['publish_date']),
            expire_date=date.fromisoformat(row['expire_date']) if row['expire_date'] else None,
            contact_person=row['contact_person'],
            contact_phone=row['contact_phone'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def _row_to_interview(self, row) -> Interview:
        return Interview(
            id=row['id'],
            job_id=row['job_id'],
            candidate_name=row['candidate_name'],
            candidate_phone=row['candidate_phone'],
            interview_time=datetime.fromisoformat(row['interview_time']),
            location=row['location'],
            interviewer=row['interviewer'],
            status=InterviewStatus(row['status']),
            notes=row['notes'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def _row_to_receipt(self, row) -> OnboardingReceipt:
        return OnboardingReceipt(
            id=row['id'],
            interview_id=row['interview_id'],
            candidate_name=row['candidate_name'],
            job_id=row['job_id'],
            company=row['company'],
            onboarding_date=date.fromisoformat(row['onboarding_date']),
            receipt_photo=row['receipt_photo'],
            receipt_number=row['receipt_number'],
            status=ReceiptStatus(row['status']),
            return_fee_due_date=date.fromisoformat(row['return_fee_due_date']) if row['return_fee_due_date'] else None,
            return_fee_amount=row['return_fee_amount'],
            notes=row['notes'],
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def _row_to_stability(self, row) -> StabilityTracking:
        return StabilityTracking(
            id=row['id'],
            receipt_id=row['receipt_id'],
            candidate_name=row['candidate_name'],
            company=row['company'],
            onboarding_date=date.fromisoformat(row['onboarding_date']),
            stability_period_days=row['stability_period_days'],
            current_work_days=row['current_work_days'],
            status=StabilityStatus(row['status']),
            last_check_date=date.fromisoformat(row['last_check_date']) if row['last_check_date'] else None,
            next_check_date=date.fromisoformat(row['next_check_date']) if row['next_check_date'] else None,
            risk_notes=row['risk_notes'],
            return_fee_paid=bool(row['return_fee_paid']),
            return_fee_date=date.fromisoformat(row['return_fee_date']) if row['return_fee_date'] else None,
            created_at=datetime.fromisoformat(row['created_at']),
            updated_at=datetime.fromisoformat(row['updated_at'])
        )

    def _row_to_change_log(self, row) -> ChangeLog:
        return ChangeLog(
            id=row['id'],
            entity_type=row['entity_type'],
            entity_id=row['entity_id'],
            action=row['action'],
            old_value=row['old_value'],
            new_value=row['new_value'],
            operator=row['operator'],
            created_at=datetime.fromisoformat(row['created_at'])
        )