import db, { initDb } from './db';
import type {
	Delivery,
	DeliveryDetail,
	DamageReport,
	RepairFollowup,
	StatusLog,
	User,
	Payment,
	TimelineEvent,
	DeliveryStatus,
	UserRole
} from './types';

initDb();

const ALLOWED_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
	PENDING_RETURN: ['RETURNED', 'DAMAGE_IDENTIFIED', 'MATERIALS_MISSING'],
	RETURNED: ['DAMAGE_IDENTIFIED', 'MATERIALS_MISSING', 'CLOSED'],
	DAMAGE_IDENTIFIED: ['MATERIALS_MISSING', 'REVIEW_REJECTED', 'REPAIR_PENDING'],
	MATERIALS_MISSING: ['DAMAGE_IDENTIFIED', 'REVIEW_REJECTED', 'REPAIR_PENDING'],
	PENDING_REVIEW: ['REPAIR_PENDING', 'REVIEW_REJECTED'],
	REVIEW_REJECTED: ['DAMAGE_IDENTIFIED', 'MATERIALS_MISSING'],
	REPAIR_PENDING: ['REPAIR_IN_PROGRESS'],
	REPAIR_IN_PROGRESS: ['REPAIR_COMPLETED'],
	REPAIR_COMPLETED: ['FINANCIAL_CONFIRMED'],
	FINANCIAL_CONFIRMED: ['CLOSED'],
	OVERDUE: ['FINANCIAL_CONFIRMED'],
	CLOSED: []
};

function isTransitionAllowed(from: DeliveryStatus, to: DeliveryStatus): boolean {
	if (from === to) return true;
	return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

function enforceRole(userId: number, allowedRoles: UserRole[]): User {
	const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
	if (!user) throw new Error('用户不存在');
	if (!allowedRoles.includes(user.role)) throw new Error(`${user.name}（${user.role}）无权执行此操作，需要：${allowedRoles.join('/')}`);
	return user;
}

function enforceDeliveryStatus(deliveryId: number, allowedStatuses: DeliveryStatus[]): Delivery {
	const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(deliveryId) as Delivery | undefined;
	if (!delivery) throw new Error('租赁单不存在');
	if (!allowedStatuses.includes(delivery.status as DeliveryStatus)) throw new Error(`当前状态「${delivery.status}」不允许此操作，需要：${allowedStatuses.join('/')}`);
	return delivery;
}

export function getUsers(): User[] {
	return db.prepare('SELECT * FROM users ORDER BY id').all() as User[];
}

export function getUserById(id: number): User | undefined {
	return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

function computeDisplayStatus(delivery: Delivery): DeliveryStatus {
	if (['MATERIALS_MISSING', 'REVIEW_REJECTED', 'REPAIR_PENDING', 'REPAIR_IN_PROGRESS'].includes(delivery.status)) {
		return delivery.status as DeliveryStatus;
	}
	if (['FINANCIAL_CONFIRMED', 'CLOSED', 'PENDING_RETURN', 'OVERDUE'].includes(delivery.status)) {
		return delivery.status as DeliveryStatus;
	}
	const today = new Date().toISOString().split('T')[0];
	if (delivery.expected_return_date < today && delivery.status !== 'PENDING_RETURN') return 'OVERDUE';
	return delivery.status as DeliveryStatus;
}

export function getDeliveries(status?: DeliveryStatus): Delivery[] {
	let sql = `SELECT d.* FROM deliveries d`;
	const params: unknown[] = [];

	if (status) {
		if (status === 'OVERDUE') {
			sql += ` WHERE d.status IN ('RETURNED', 'DAMAGE_IDENTIFIED', 'PENDING_REVIEW', 'REPAIR_COMPLETED') AND d.expected_return_date < DATE('now')`;
		} else {
			sql += ' WHERE d.status = ?';
			params.push(status);
		}
	}

	sql += ' ORDER BY d.created_at DESC';

	const rows = db.prepare(sql).all(...params) as Delivery[];

	return rows.map((row) => ({
		...row,
		status: computeDisplayStatus(row)
	}));
}

export function getDeliveryById(id: number): Delivery | undefined {
	return db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id) as Delivery | undefined;
}

export function getDeliveryDetail(id: number): DeliveryDetail | undefined {
	const delivery = getDeliveryById(id);
	if (!delivery) return undefined;

	const displayStatus = computeDisplayStatus(delivery);

	const damageReports = db
		.prepare(
			`
		SELECT dr.*,
			u1.name as reporter_name, u1.role as reporter_role,
			u2.name as reviewer_name, u2.role as reviewer_role
		FROM damage_reports dr
		LEFT JOIN users u1 ON dr.reported_by = u1.id
		LEFT JOIN users u2 ON dr.reviewed_by = u2.id
		WHERE dr.delivery_id = ?
		ORDER BY dr.created_at DESC
	`
		)
		.all(id) as Array<
		DamageReport & {
			reporter_name: string;
			reporter_role: string;
			reviewer_name: string | null;
			reviewer_role: string | null;
		}
	>;

	const damageReportsWithRepairs = damageReports.map((dr) => {
		const repairs = db
			.prepare(
				`
			SELECT rf.*,
				u1.name as assignee_name, u1.role as assignee_role,
				u2.name as creator_name, u2.role as creator_role
			FROM repair_followups rf
			LEFT JOIN users u1 ON rf.assigned_to = u1.id
			LEFT JOIN users u2 ON rf.created_by = u2.id
			WHERE rf.damage_report_id = ?
			ORDER BY rf.created_at DESC
		`
			)
			.all(dr.id) as Array<
			RepairFollowup & {
				assignee_name: string;
				assignee_role: string;
				creator_name: string;
				creator_role: string;
			}
		>;

		return {
			...dr,
			reporter: { name: dr.reporter_name, role: dr.reporter_role } as User,
			reviewer: dr.reviewer_name
				? ({ name: dr.reviewer_name, role: dr.reviewer_role } as User)
				: undefined,
			repair_followups: repairs.map((r) => ({
				...r,
				assignee: { name: r.assignee_name, role: r.assignee_role } as User,
				creator: { name: r.creator_name, role: r.creator_role } as User
			}))
		};
	});

	const statusLogs = db
		.prepare(
			`
		SELECT sl.*, u.name as changer_name, u.role as changer_role
		FROM status_logs sl
		LEFT JOIN users u ON sl.changed_by = u.id
		WHERE sl.delivery_id = ?
		ORDER BY sl.created_at ASC
	`
		)
		.all(id) as Array<StatusLog & { changer_name: string; changer_role: string }>;

	const payments = db
		.prepare(
			`
		SELECT p.*, u.name as confirmer_name, u.role as confirmer_role
		FROM payments p
		LEFT JOIN users u ON p.confirmed_by = u.id
		WHERE p.delivery_id = ?
		ORDER BY p.confirmed_at DESC
	`
		)
		.all(id) as Array<Payment & { confirmer_name: string; confirmer_role: string }>;

	return {
		...delivery,
		status: displayStatus,
		damage_reports: damageReportsWithRepairs,
		status_logs: statusLogs.map((sl) => ({
			...sl,
			changer: { name: sl.changer_name, role: sl.changer_role } as User
		})),
		payments: payments.map((p) => ({
			...p,
			confirmer: { name: p.confirmer_name, role: p.confirmer_role } as User
		}))
	};
}

export function createDamageReport(data: {
	delivery_id: number;
	reported_by: number;
	damage_type: string;
	description: string;
	severity: 'minor' | 'moderate' | 'severe';
	estimated_cost?: number;
	materials_provided?: string;
	materials_missing?: string;
}): number {
	enforceRole(data.reported_by, ['store_clerk']);
	enforceDeliveryStatus(data.delivery_id, ['PENDING_RETURN', 'RETURNED', 'DAMAGE_IDENTIFIED', 'MATERIALS_MISSING', 'REVIEW_REJECTED']);

	const tx = db.transaction(() => {
		const reportId = db
			.prepare(
				`
			INSERT INTO damage_reports (
				delivery_id, reported_by, damage_type, description, severity,
				estimated_cost, materials_provided, materials_missing, status
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW')
		`
			)
			.run(
				data.delivery_id,
				data.reported_by,
				data.damage_type,
				data.description,
				data.severity,
				data.estimated_cost ?? null,
				data.materials_provided ?? null,
				data.materials_missing ?? null
			).lastInsertRowid as number;

		const delivery = getDeliveryById(data.delivery_id)!;
		const newStatus: DeliveryStatus = data.materials_missing ? 'MATERIALS_MISSING' : 'DAMAGE_IDENTIFIED';

		if (!isTransitionAllowed(delivery.status as DeliveryStatus, newStatus)) {
			throw new Error(`状态流转不允许：${delivery.status} → ${newStatus}`);
		}

		updateDeliveryStatus(data.delivery_id, newStatus, data.reported_by, `提交损坏鉴定: ${data.damage_type}`);

		return reportId;
	});

	return tx();
}

export function reviewDamageReport(
	damageId: number,
	reviewerId: number,
	approved: boolean,
	reviewComment: string
): void {
	enforceRole(reviewerId, ['equipment_manager']);

	const tx = db.transaction(() => {
		const damage = db
			.prepare('SELECT * FROM damage_reports WHERE id = ?')
			.get(damageId) as DamageReport;
		if (!damage) throw new Error('损坏报告不存在');
		if (damage.status !== 'PENDING_REVIEW') throw new Error(`损坏报告当前状态「${damage.status}」不允许复核，需为 PENDING_REVIEW`);

		const delivery = getDeliveryById(damage.delivery_id)!;
		if (!['DAMAGE_IDENTIFIED', 'MATERIALS_MISSING', 'PENDING_REVIEW'].includes(delivery.status)) {
			throw new Error(`租赁单当前状态「${delivery.status}」不允许复核`);
		}

		db.prepare(
			`
			UPDATE damage_reports
			SET status = ?, reviewed_by = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`
		).run(approved ? 'APPROVED' : 'REVIEW_REJECTED', reviewerId, reviewComment, damageId);

		const newStatus: DeliveryStatus = approved ? 'REPAIR_PENDING' : 'REVIEW_REJECTED';

		if (!isTransitionAllowed(delivery.status as DeliveryStatus, newStatus)) {
			throw new Error(`状态流转不允许：${delivery.status} → ${newStatus}`);
		}

		if (approved) {
			updateDeliveryStatus(
				damage.delivery_id,
				'REPAIR_PENDING',
				reviewerId,
				`损坏鉴定通过: ${reviewComment}`
			);
		} else {
			updateDeliveryStatus(
				damage.delivery_id,
				'REVIEW_REJECTED',
				reviewerId,
				`复核不通过: ${reviewComment}`
			);
		}
	});

	tx();
}

export function createRepairFollowup(data: {
	damage_report_id: number;
	assigned_to: number;
	repair_type: string;
	repair_description: string;
	created_by: number;
}): number {
	enforceRole(data.created_by, ['equipment_manager']);

	const tx = db.transaction(() => {
		const damage = db
			.prepare('SELECT * FROM damage_reports WHERE id = ?')
			.get(data.damage_report_id) as DamageReport;
		if (!damage) throw new Error('损坏报告不存在');
		if (damage.status !== 'APPROVED') throw new Error(`损坏报告状态「${damage.status}」不允许安排维修，需为 APPROVED`);

		const delivery = getDeliveryById(damage.delivery_id)!;
		if (delivery.status !== 'REPAIR_PENDING') {
			throw new Error(`租赁单当前状态「${delivery.status}」不允许安排维修，需为 REPAIR_PENDING`);
		}

		const repairId = db
			.prepare(
				`
			INSERT INTO repair_followups (
				damage_report_id, assigned_to, repair_type, repair_description,
				repair_status, created_by
			) VALUES (?, ?, ?, ?, 'PENDING', ?)
		`
			)
			.run(
				data.damage_report_id,
				data.assigned_to,
				data.repair_type,
				data.repair_description,
				data.created_by
			).lastInsertRowid as number;

		db.prepare(
			`
			INSERT INTO status_logs (delivery_id, old_status, new_status, changed_by, change_reason)
			VALUES (?, ?, ?, ?, ?)
		`
		).run(delivery.id, delivery.status, delivery.status, data.created_by, `安排维修: ${data.repair_type}`);

		return repairId;
	});

	return tx();
}

export function updateRepairStatus(
	repairId: number,
	status: 'PENDING' | 'IN_PROGRESS' | 'REPAIR_COMPLETED' | 'CANCELLED',
	userId: number,
	notes?: string,
	actualCost?: number
): void {
	enforceRole(userId, ['equipment_manager']);

	const tx = db.transaction(() => {
		const repair = db
			.prepare('SELECT * FROM repair_followups WHERE id = ?')
			.get(repairId) as RepairFollowup;
		if (!repair) throw new Error('维修记录不存在');

		const validTransitions: Record<string, string[]> = {
			PENDING: ['IN_PROGRESS', 'CANCELLED'],
			IN_PROGRESS: ['REPAIR_COMPLETED'],
			REPAIR_COMPLETED: [],
			CANCELLED: []
		};
		if (!validTransitions[repair.repair_status]?.includes(status)) {
			throw new Error(`维修状态流转不允许：${repair.repair_status} → ${status}`);
		}

		const damage = db
			.prepare('SELECT * FROM damage_reports WHERE id = ?')
			.get(repair.damage_report_id) as DamageReport;
		const delivery = getDeliveryById(damage.delivery_id)!;

		const updateData: Record<string, unknown> = {
			repair_status: status
		};

		if (notes) updateData.repair_notes = notes;
		if (actualCost !== undefined) updateData.actual_cost = actualCost;

		let deliveryNewStatus: DeliveryStatus | null = null;

		if (status === 'IN_PROGRESS') {
			updateData.repair_start_date = new Date().toISOString().split('T')[0];
			if (delivery.status === 'REPAIR_PENDING') {
				deliveryNewStatus = 'REPAIR_IN_PROGRESS';
			}
		} else if (status === 'REPAIR_COMPLETED') {
			updateData.repair_complete_date = new Date().toISOString().split('T')[0];
			if (delivery.status === 'REPAIR_IN_PROGRESS') {
				deliveryNewStatus = 'REPAIR_COMPLETED';
			}
		}

		const fields = Object.keys(updateData).map((k) => `${k} = ?`).join(', ');
		const values = [...Object.values(updateData), repairId];

		db.prepare(`UPDATE repair_followups SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
			...values
		);

		if (deliveryNewStatus) {
			if (!isTransitionAllowed(delivery.status as DeliveryStatus, deliveryNewStatus)) {
				throw new Error(`状态流转不允许：${delivery.status} → ${deliveryNewStatus}`);
			}
			const reason = status === 'IN_PROGRESS'
				? `维修开始: ${notes || repair.repair_type}`
				: `维修完成: ${notes || repair.repair_type}`;
			updateDeliveryStatus(damage.delivery_id, deliveryNewStatus, userId, reason);
		}
	});

	tx();
}

export function confirmPayment(data: {
	delivery_id: number;
	amount: number;
	payment_type: string;
	confirmed_by: number;
	notes?: string;
}): number {
	enforceRole(data.confirmed_by, ['finance']);

	const delivery = getDeliveryById(data.delivery_id)!;
	const dbStatus = delivery.status as DeliveryStatus;
	if (!['REPAIR_COMPLETED', 'OVERDUE'].includes(dbStatus)) {
		throw new Error(`当前状态「${delivery.status}」不允许财务确认，需为 REPAIR_COMPLETED 或 OVERDUE`);
	}

	const tx = db.transaction(() => {
		const paymentId = db
			.prepare(
				`
			INSERT INTO payments (delivery_id, amount, payment_type, confirmed_by, notes)
			VALUES (?, ?, ?, ?, ?)
		`
			)
			.run(
				data.delivery_id,
				data.amount,
				data.payment_type,
				data.confirmed_by,
				data.notes ?? null
			).lastInsertRowid as number;

		if (!isTransitionAllowed(dbStatus, 'FINANCIAL_CONFIRMED')) {
			throw new Error(`状态流转不允许：${dbStatus} → FINANCIAL_CONFIRMED`);
		}

		updateDeliveryStatus(
			data.delivery_id,
			'FINANCIAL_CONFIRMED',
			data.confirmed_by,
			`财务确认: ${data.payment_type}, 金额 ¥${data.amount}`
		);

		return paymentId;
	});

	return tx();
}

export function closeDelivery(deliveryId: number, userId: number, reason: string): void {
	enforceRole(userId, ['store_clerk', 'equipment_manager', 'finance']);

	const delivery = getDeliveryById(deliveryId)!;
	if (delivery.status !== 'FINANCIAL_CONFIRMED') {
		throw new Error(`当前状态「${delivery.status}」不允许结案，需为 FINANCIAL_CONFIRMED`);
	}

	if (!isTransitionAllowed(delivery.status as DeliveryStatus, 'CLOSED')) {
		throw new Error(`状态流转不允许：${delivery.status} → CLOSED`);
	}

	updateDeliveryStatus(deliveryId, 'CLOSED', userId, reason);
}

function updateDeliveryStatus(
	deliveryId: number,
	newStatus: DeliveryStatus,
	changedBy: number,
	reason: string
): void {
	const delivery = getDeliveryById(deliveryId);
	if (!delivery) throw new Error('租赁单不存在');

	const oldStatus = delivery.status;

	db.prepare(
		`
		UPDATE deliveries
		SET status = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`
	).run(newStatus, deliveryId);

	db.prepare(
		`
		INSERT INTO status_logs (delivery_id, old_status, new_status, changed_by, change_reason)
		VALUES (?, ?, ?, ?, ?)
	`
	).run(deliveryId, oldStatus, newStatus, changedBy, reason);
}

export function getTimelineEvents(deliveryId: number): TimelineEvent[] {
	const detail = getDeliveryDetail(deliveryId);
	if (!detail) return [];

	const events: TimelineEvent[] = [];

	detail.status_logs.forEach((log) => {
		events.push({
			id: `status-${log.id}`,
			type: 'status',
			title: `状态变更`,
			description: log.change_reason || '',
			operator: log.changer?.name || '未知',
			operator_role: log.changer?.role || '',
			timestamp: log.created_at,
			metadata: {
				old_status: log.old_status,
				new_status: log.new_status
			}
		});
	});

	detail.damage_reports.forEach((dr) => {
		events.push({
			id: `damage-${dr.id}`,
			type: 'damage',
			title: `损坏鉴定提交: ${dr.damage_type}`,
			description: dr.description,
			operator: dr.reporter?.name || '未知',
			operator_role: dr.reporter?.role || '',
			timestamp: dr.created_at,
			metadata: {
				severity: dr.severity,
				estimated_cost: dr.estimated_cost,
				damage_status: dr.status,
				materials_missing: dr.materials_missing
			}
		});

		if (dr.reviewed_at) {
			events.push({
				id: `damage-review-${dr.id}`,
				type: 'damage',
				title: `损坏${dr.status === 'APPROVED' ? '鉴定通过' : '复核不通过'}`,
				description: dr.review_comment || '',
				operator: dr.reviewer?.name || '未知',
				operator_role: dr.reviewer?.role || '',
				timestamp: dr.reviewed_at,
				metadata: {
					damage_status: dr.status
				}
			});
		}

		dr.repair_followups?.forEach((rf) => {
			events.push({
				id: `repair-${rf.id}`,
				type: 'repair',
				title: `维修安排: ${rf.repair_type || '维修'}`,
				description: rf.repair_description || '',
				operator: rf.creator?.name || '未知',
				operator_role: rf.creator?.role || '',
				timestamp: rf.created_at,
				metadata: {
					repair_status: rf.repair_status,
					assigned_to: rf.assignee?.name,
					actual_cost: rf.actual_cost
				}
			});

			if (rf.repair_start_date && rf.repair_status !== 'PENDING') {
				events.push({
					id: `repair-start-${rf.id}`,
					type: 'repair',
					title: `维修开始`,
					description: rf.repair_description || '',
					operator: rf.assignee?.name || '未知',
					operator_role: rf.assignee?.role || '',
					timestamp: rf.repair_start_date + 'T09:00:00',
					metadata: {
						repair_status: 'IN_PROGRESS'
					}
				});
			}

			if (rf.repair_complete_date) {
				events.push({
					id: `repair-complete-${rf.id}`,
					type: 'repair',
					title: `维修完成`,
					description: rf.repair_notes || rf.repair_description || '',
					operator: rf.assignee?.name || '未知',
					operator_role: rf.assignee?.role || '',
					timestamp: rf.repair_complete_date + 'T17:00:00',
					metadata: {
						actual_cost: rf.actual_cost
					}
				});
			}
		});
	});

	detail.payments.forEach((p) => {
		events.push({
			id: `payment-${p.id}`,
			type: 'payment',
			title: `财务确认: ${p.payment_type}`,
			description: p.notes || `金额 ¥${p.amount}`,
			operator: p.confirmer?.name || '未知',
			operator_role: p.confirmer?.role || '',
			timestamp: p.confirmed_at,
			metadata: {
				amount: p.amount,
				payment_type: p.payment_type
			}
		});
	});

	events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

	return events;
}
