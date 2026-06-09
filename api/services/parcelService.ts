import Database from "better-sqlite3";
import { VALID_TRANSITIONS, type ParcelStatus, type ResponsibleType } from "../../shared/types.js";
import { getDb } from "../db.js";

function getOperatorRole(db: Database.Database, operatorId: number): string {
  const row = db.prepare("SELECT role FROM staff WHERE id = ?").get(operatorId) as { role: string } | undefined;
  if (!row) throw new Error(`操作员不存在: ${operatorId}`);
  return row.role;
}

function validateTransition(fromStatus: ParcelStatus, toStatus: ParcelStatus): void {
  const allowed = VALID_TRANSITIONS[fromStatus];
  if (!allowed || !allowed.includes(toStatus)) {
    throw new Error(`不允许的状态变更: ${fromStatus} -> ${toStatus}`);
  }
}

function getResponsibleForStatus(
  toStatus: ParcelStatus,
  operatorId: number,
  operatorRole: string,
  assigneeId?: number | null,
  assigneeType?: "courier" | "station" | null
): { responsibleId: number; responsibleType: ResponsibleType } {
  switch (toStatus) {
    case "arrived_pending":
      return { responsibleId: operatorId, responsibleType: "customer_service" };
    case "dispatched_pending":
      if (!assigneeId) throw new Error("分配状态需要 assigneeId");
      if (assigneeType === "station") {
        return { responsibleId: assigneeId, responsibleType: "station_manager" };
      }
      return { responsibleId: assigneeId, responsibleType: "courier" };
    case "delivering":
      return { responsibleId: operatorId, responsibleType: "courier" };
    case "signed":
      return { responsibleId: operatorId, responsibleType: "courier" };
    case "problem_pending":
      return { responsibleId: operatorId, responsibleType: operatorRole as ResponsibleType };
    case "closed":
      return { responsibleId: operatorId, responsibleType: "customer_service" };
    default:
      throw new Error(`未知状态: ${toStatus}`);
  }
}

export function scanParcel(
  trackingNo: string,
  operatorId: number,
  note?: string
): { id: number; trackingNo: string; status: string } {
  const db = getDb();
  const operatorRole = getOperatorRole(db, operatorId);

  const transaction = db.transaction(() => {
    const existing = db
      .prepare("SELECT id FROM parcels WHERE tracking_no = ?")
      .get(trackingNo) as { id: number } | undefined;
    if (existing) throw new Error(`包裹已存在: ${trackingNo}`);

    const responsible = getResponsibleForStatus("arrived_pending", operatorId, operatorRole);

    const result = db
      .prepare(
        "INSERT INTO parcels (tracking_no, status, responsible_id, responsible_type, scanned_by, arrived_at) VALUES (?, 'arrived_pending', ?, ?, ?, datetime('now', 'localtime'))"
      )
      .run(trackingNo, responsible.responsibleId, responsible.responsibleType, operatorId);

    const parcelId = result.lastInsertRowid as number;

    db.prepare(
      "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, NULL, 'arrived_pending', ?, ?, ?, ?, ?)"
    ).run(parcelId, operatorId, operatorRole, responsible.responsibleId, responsible.responsibleType, note ?? "到件扫描");

    return { id: parcelId, trackingNo, status: "arrived_pending" as const };
  });

  return transaction();
}

export function batchScan(
  items: Array<{ trackingNo: string }>,
  operatorId: number,
  note?: string
): Array<{ id: number; trackingNo: string; status: string }> {
  const db = getDb();
  const operatorRole = getOperatorRole(db, operatorId);

  const transaction = db.transaction(() => {
    const results: Array<{ id: number; trackingNo: string; status: string }> = [];
    for (const item of items) {
      const existing = db
        .prepare("SELECT id FROM parcels WHERE tracking_no = ?")
        .get(item.trackingNo) as { id: number } | undefined;
      if (existing) throw new Error(`包裹已存在: ${item.trackingNo}`);

      const responsible = getResponsibleForStatus("arrived_pending", operatorId, operatorRole);

      const result = db
        .prepare(
          "INSERT INTO parcels (tracking_no, status, responsible_id, responsible_type, scanned_by, arrived_at) VALUES (?, 'arrived_pending', ?, ?, ?, datetime('now', 'localtime'))"
        )
        .run(item.trackingNo, responsible.responsibleId, responsible.responsibleType, operatorId);

      const parcelId = result.lastInsertRowid as number;

      db.prepare(
        "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, NULL, 'arrived_pending', ?, ?, ?, ?, ?)"
      ).run(parcelId, operatorId, operatorRole, responsible.responsibleId, responsible.responsibleType, note ?? "批量到件扫描");

      results.push({ id: parcelId, trackingNo: item.trackingNo, status: "arrived_pending" });
    }
    return results;
  });

  return transaction();
}

export function scanAndDispatch(
  items: Array<{ trackingNo: string }>,
  assigneeId: number,
  assigneeType: "courier" | "station",
  operatorId: number,
  note?: string
): Array<{ id: number; trackingNo: string; status: string }> {
  const db = getDb();
  const operatorRole = getOperatorRole(db, operatorId);

  const transaction = db.transaction(() => {
    const results: Array<{ id: number; trackingNo: string; status: string }> = [];

    for (const item of items) {
      const existing = db
        .prepare("SELECT id FROM parcels WHERE tracking_no = ?")
        .get(item.trackingNo) as { id: number } | undefined;
      if (existing) throw new Error(`包裹已存在: ${item.trackingNo}`);

      const arrivedResponsible = getResponsibleForStatus("arrived_pending", operatorId, operatorRole);
      const dispatchResponsible = getResponsibleForStatus("dispatched_pending", operatorId, operatorRole, assigneeId, assigneeType);

      const result = db
        .prepare(
          "INSERT INTO parcels (tracking_no, status, responsible_id, responsible_type, scanned_by, assignee_id, assignee_type, arrived_at, dispatched_at) VALUES (?, 'dispatched_pending', ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))"
        )
        .run(item.trackingNo, dispatchResponsible.responsibleId, dispatchResponsible.responsibleType, operatorId, assigneeId, assigneeType);

      const parcelId = result.lastInsertRowid as number;

      db.prepare(
        "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, NULL, 'arrived_pending', ?, ?, ?, ?, ?)"
      ).run(parcelId, operatorId, operatorRole, arrivedResponsible.responsibleId, arrivedResponsible.responsibleType, "到件扫描（快速模式）");

      db.prepare(
        "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, 'arrived_pending', 'dispatched_pending', ?, ?, ?, ?, ?)"
      ).run(parcelId, operatorId, operatorRole, dispatchResponsible.responsibleId, dispatchResponsible.responsibleType, note ?? `快速分配给${assigneeType === "courier" ? "派件员" : "驿站"}`);

      results.push({ id: parcelId, trackingNo: item.trackingNo, status: "dispatched_pending" });
    }

    return results;
  });

  return transaction();
}

export function dispatchParcels(
  parcelIds: number[],
  assigneeId: number,
  assigneeType: "courier" | "station",
  note: string | undefined,
  operatorId: number
): Array<{ id: number; status: string }> {
  const db = getDb();
  const operatorRole = getOperatorRole(db, operatorId);

  const transaction = db.transaction(() => {
    const results: Array<{ id: number; status: string }> = [];

    for (const parcelId of parcelIds) {
      const parcel = db
        .prepare("SELECT status FROM parcels WHERE id = ?")
        .get(parcelId) as { status: ParcelStatus } | undefined;
      if (!parcel) throw new Error(`包裹不存在: ${parcelId}`);

      validateTransition(parcel.status, "dispatched_pending");

      const responsible = getResponsibleForStatus("dispatched_pending", operatorId, operatorRole, assigneeId, assigneeType);

      db.prepare(
        "UPDATE parcels SET status = 'dispatched_pending', responsible_id = ?, responsible_type = ?, assignee_id = ?, assignee_type = ?, dispatched_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime') WHERE id = ?"
      ).run(responsible.responsibleId, responsible.responsibleType, assigneeId, assigneeType, parcelId);

      db.prepare(
        "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, ?, 'dispatched_pending', ?, ?, ?, ?, ?)"
      ).run(parcelId, parcel.status, operatorId, operatorRole, responsible.responsibleId, responsible.responsibleType, note ?? `分配给${assigneeType === "courier" ? "派件员" : "驿站"}`);

      results.push({ id: parcelId, status: "dispatched_pending" });
    }

    return results;
  });

  return transaction();
}

export function startDelivery(
  parcelId: number,
  operatorId: number,
  note?: string
): { id: number; status: string } {
  const db = getDb();
  const operatorRole = getOperatorRole(db, operatorId);

  const transaction = db.transaction(() => {
    const parcel = db
      .prepare("SELECT status FROM parcels WHERE id = ?")
      .get(parcelId) as { status: ParcelStatus } | undefined;
    if (!parcel) throw new Error(`包裹不存在: ${parcelId}`);

    validateTransition(parcel.status, "delivering");

    const responsible = getResponsibleForStatus("delivering", operatorId, operatorRole);

    db.prepare(
      "UPDATE parcels SET status = 'delivering', responsible_id = ?, responsible_type = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(responsible.responsibleId, responsible.responsibleType, parcelId);

    db.prepare(
      "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, ?, 'delivering', ?, ?, ?, ?, ?)"
    ).run(parcelId, parcel.status, operatorId, operatorRole, responsible.responsibleId, responsible.responsibleType, note ?? "开始派件");

    return { id: parcelId, status: "delivering" as const };
  });

  return transaction();
}

export function signParcels(
  parcelIds: number[],
  operatorId: number,
  note?: string
): Array<{ id: number; status: string }> {
  const db = getDb();
  const operatorRole = getOperatorRole(db, operatorId);

  const transaction = db.transaction(() => {
    const results: Array<{ id: number; status: string }> = [];

    for (const parcelId of parcelIds) {
      const parcel = db
        .prepare("SELECT status FROM parcels WHERE id = ?")
        .get(parcelId) as { status: ParcelStatus } | undefined;
      if (!parcel) throw new Error(`包裹不存在: ${parcelId}`);

      validateTransition(parcel.status, "signed");

      const responsible = getResponsibleForStatus("signed", operatorId, operatorRole);

      db.prepare(
        "UPDATE parcels SET status = 'signed', responsible_id = ?, responsible_type = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
      ).run(responsible.responsibleId, responsible.responsibleType, parcelId);

      db.prepare(
        "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, ?, 'signed', ?, ?, ?, ?, ?)"
      ).run(parcelId, parcel.status, operatorId, operatorRole, responsible.responsibleId, responsible.responsibleType, note ?? "签收");

      results.push({ id: parcelId, status: "signed" });
    }

    return results;
  });

  return transaction();
}

export function reportProblem(
  parcelId: number,
  problemType: string,
  operatorId: number,
  note?: string
): { id: number; status: string } {
  const db = getDb();
  const operatorRole = getOperatorRole(db, operatorId);

  const transaction = db.transaction(() => {
    const parcel = db
      .prepare("SELECT status FROM parcels WHERE id = ?")
      .get(parcelId) as { status: ParcelStatus } | undefined;
    if (!parcel) throw new Error(`包裹不存在: ${parcelId}`);

    validateTransition(parcel.status, "problem_pending");

    const responsible = getResponsibleForStatus("problem_pending", operatorId, operatorRole);

    db.prepare(
      "UPDATE parcels SET status = 'problem_pending', responsible_id = ?, responsible_type = ?, assignee_id = NULL, assignee_type = NULL, updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(responsible.responsibleId, responsible.responsibleType, parcelId);

    db.prepare(
      "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, ?, 'problem_pending', ?, ?, ?, ?, ?)"
    ).run(parcelId, parcel.status, operatorId, operatorRole, responsible.responsibleId, responsible.responsibleType, note ?? `问题上报: ${problemType}`);

    db.prepare(
      "INSERT INTO problem_parcels (parcel_id, problem_type, reported_by) VALUES (?, ?, ?)"
    ).run(parcelId, problemType, operatorId);

    return { id: parcelId, status: "problem_pending" as const };
  });

  return transaction();
}

export function resolveProblem(
  parcelId: number,
  resolution: "reassign" | "close",
  operatorId: number,
  note?: string
): { id: number; status: string } {
  const db = getDb();
  const operatorRole = getOperatorRole(db, operatorId);

  const toStatus: ParcelStatus = resolution === "reassign" ? "arrived_pending" : "closed";

  const transaction = db.transaction(() => {
    const parcel = db
      .prepare("SELECT status FROM parcels WHERE id = ?")
      .get(parcelId) as { status: ParcelStatus } | undefined;
    if (!parcel) throw new Error(`包裹不存在: ${parcelId}`);

    validateTransition(parcel.status, toStatus);

    const responsible = getResponsibleForStatus(toStatus, operatorId, operatorRole);

    if (resolution === "reassign") {
      db.prepare(
        "UPDATE parcels SET status = 'arrived_pending', responsible_id = ?, responsible_type = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
      ).run(responsible.responsibleId, responsible.responsibleType, parcelId);
    } else {
      db.prepare(
        "UPDATE parcels SET status = 'closed', responsible_id = ?, responsible_type = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
      ).run(responsible.responsibleId, responsible.responsibleType, parcelId);
    }

    db.prepare(
      "INSERT INTO parcel_status_log (parcel_id, from_status, to_status, operator_id, operator_role, responsible_id, responsible_type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(parcelId, parcel.status, toStatus, operatorId, operatorRole, responsible.responsibleId, responsible.responsibleType, note ?? (resolution === "reassign" ? "重新分配" : "关闭处理"));

    db.prepare(
      "UPDATE problem_parcels SET resolution = ?, resolved_by = ?, resolved_at = datetime('now', 'localtime') WHERE parcel_id = ? AND resolved_at IS NULL"
    ).run(resolution === "reassign" ? "重新分配" : "关闭处理", operatorId, parcelId);

    return { id: parcelId, status: toStatus };
  });

  return transaction();
}

export function getParcels(filters: {
  status?: string;
  assigneeId?: number;
  responsibleId?: number;
  responsibleType?: string;
  trackingNo?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): { data: Record<string, unknown>[]; total: number } {
  const db = getDb();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    conditions.push("p.status = ?");
    params.push(filters.status);
  }
  if (filters.assigneeId) {
    conditions.push("p.assignee_id = ?");
    params.push(filters.assigneeId);
  }
  if (filters.responsibleId) {
    conditions.push("p.responsible_id = ?");
    params.push(filters.responsibleId);
  }
  if (filters.responsibleType) {
    conditions.push("p.responsible_type = ?");
    params.push(filters.responsibleType);
  }
  if (filters.trackingNo) {
    conditions.push("p.tracking_no LIKE ?");
    params.push(`%${filters.trackingNo}%`);
  }
  if (filters.startDate) {
    conditions.push("p.arrived_at >= ?");
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push("p.arrived_at <= ?");
    params.push(filters.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM parcels p ${whereClause}`)
    .get(...params) as { total: number };

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const rows = db
    .prepare(
      `SELECT
        p.id, p.tracking_no, p.status,
        p.responsible_id, p.responsible_type,
        p.assignee_id, p.assignee_type,
        p.scanned_by, p.arrived_at, p.dispatched_at,
        p.created_at, p.updated_at,
        s1.name as scanned_by_name,
        s2.name as responsible_name,
        COALESCE(s3.name, st.name) as assignee_name
      FROM parcels p
      LEFT JOIN staff s1 ON p.scanned_by = s1.id
      LEFT JOIN staff s2 ON p.responsible_id = s2.id
      LEFT JOIN staff s3 ON p.assignee_id = s3.id AND p.assignee_type = 'courier'
      LEFT JOIN stations st ON p.assignee_id = st.id AND p.assignee_type = 'station'
      ${whereClause}
      ORDER BY p.updated_at DESC
      LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset) as Record<string, unknown>[];

  return { data: rows, total: countRow.total };
}

export function getParcelAuditLog(parcelId: number): Record<string, unknown>[] {
  const db = getDb();

  return db
    .prepare(
      `SELECT
        l.id, l.parcel_id, l.from_status, l.to_status,
        l.operator_id, l.operator_role,
        l.responsible_id, l.responsible_type,
        l.note, l.created_at,
        s1.name as operator_name,
        s2.name as responsible_name
      FROM parcel_status_log l
      LEFT JOIN staff s1 ON l.operator_id = s1.id
      LEFT JOIN staff s2 ON l.responsible_id = s2.id
      WHERE l.parcel_id = ?
      ORDER BY l.created_at ASC`
    )
    .all(parcelId) as Record<string, unknown>[];
}

export function getProblems(): Record<string, unknown>[] {
  const db = getDb();

  return db
    .prepare(
      `SELECT
        pp.id, pp.parcel_id, pp.problem_type, pp.resolution,
        pp.reported_by, pp.resolved_by, pp.reported_at, pp.resolved_at,
        p.tracking_no, p.status as parcel_status,
        p.responsible_id, p.responsible_type,
        s1.name as reported_by_name,
        s2.name as resolved_by_name,
        s3.name as responsible_name
      FROM problem_parcels pp
      LEFT JOIN parcels p ON pp.parcel_id = p.id
      LEFT JOIN staff s1 ON pp.reported_by = s1.id
      LEFT JOIN staff s2 ON pp.resolved_by = s2.id
      LEFT JOIN staff s3 ON p.responsible_id = s3.id
      ORDER BY pp.reported_at DESC`
    )
    .all() as Record<string, unknown>[];
}

export function getWorkspaceSummary(responsibleId?: number, responsibleType?: string): Record<string, number> {
  const db = getDb();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (responsibleId) {
    conditions.push("responsible_id = ?");
    params.push(responsibleId);
  }
  if (responsibleType) {
    conditions.push("responsible_type = ?");
    params.push(responsibleType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT status, COUNT(*) as count FROM parcels ${whereClause} GROUP BY status`
    )
    .all(...params) as Array<{ status: string; count: number }>;

  const result: Record<string, number> = {
    arrived_pending: 0,
    dispatched_pending: 0,
    delivering: 0,
    signed: 0,
    problem_pending: 0,
    closed: 0,
  };

  for (const row of rows) {
    result[row.status] = row.count;
  }

  return result;
}
