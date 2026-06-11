import { getDb } from '../db/database.js';
import { getUserById } from './userService.js';
import type {
  Inspection,
  Photo,
  StatusLog,
  Dispatch,
  RiskLevel,
  InspectionStatus,
  CreateInspectionRequest
} from '../../shared/types.js';

function mapInspectionRow(row: any): Inspection {
  return {
    id: row.id,
    facilityType: row.facility_type,
    facilityName: row.facility_name,
    location: row.location,
    riskLevel: row.risk_level as RiskLevel,
    description: row.description,
    status: row.status as InspectionStatus,
    discovererId: row.discoverer_id,
    discovererName: row.discoverer_name,
    discoveryTime: row.discovery_time,
    photos: [],
    statusLogs: [],
    dispatches: [],
    reviewResult: row.review_result as 'pass' | 'fail' | undefined,
    reviewRemark: row.review_remark,
    reviewTime: row.review_time,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name
  };
}

export function getInspections(
  filters?: {
    riskLevel?: RiskLevel;
    status?: InspectionStatus;
    facilityType?: string;
  }
): Inspection[] {
  const db = getDb();

  let sql = `
    SELECT i.*,
           u1.name as discoverer_name,
           u2.name as reviewer_name
    FROM inspections i
    LEFT JOIN users u1 ON i.discoverer_id = u1.id
    LEFT JOIN users u2 ON i.reviewer_id = u2.id
  `;

  const whereConditions: string[] = [];
  const params: string[] = [];

  if (filters?.riskLevel) {
    whereConditions.push('i.risk_level = ?');
    params.push(filters.riskLevel);
  }
  if (filters?.status) {
    whereConditions.push('i.status = ?');
    params.push(filters.status);
  }
  if (filters?.facilityType) {
    whereConditions.push('i.facility_type LIKE ?');
    params.push(`%${filters.facilityType}%`);
  }

  if (whereConditions.length > 0) {
    sql += ' WHERE ' + whereConditions.join(' AND ');
  }

  sql += ' ORDER BY i.discovery_time DESC';

  const rows = db.prepare(sql).all(...params) as any[];

  return rows.map(row => {
    const inspection = mapInspectionRow(row);
    inspection.photos = getPhotosByInspectionId(inspection.id);
    inspection.statusLogs = getStatusLogsByInspectionId(inspection.id);
    inspection.dispatches = getDispatchesByInspectionId(inspection.id);
    return inspection;
  });
}

export function getInspectionById(id: string): Inspection | undefined {
  const db = getDb();

  const sql = `
    SELECT i.*,
           u1.name as discoverer_name,
           u2.name as reviewer_name
    FROM inspections i
    LEFT JOIN users u1 ON i.discoverer_id = u1.id
    LEFT JOIN users u2 ON i.reviewer_id = u2.id
    WHERE i.id = ?
  `;

  const row = db.prepare(sql).get(id) as any;
  if (!row) return undefined;

  const inspection = mapInspectionRow(row);
  inspection.photos = getPhotosByInspectionId(inspection.id);
  inspection.statusLogs = getStatusLogsByInspectionId(inspection.id);
  inspection.dispatches = getDispatchesByInspectionId(inspection.id);

  return inspection;
}

function getPhotosByInspectionId(inspectionId: string): Photo[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM photos
    WHERE inspection_id = ?
    ORDER BY upload_time
  `).all(inspectionId) as any[];

  return rows.map(row => ({
    id: row.id,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    description: row.description,
    uploadTime: row.upload_time,
    uploaderId: row.uploader_id
  }));
}

function getStatusLogsByInspectionId(inspectionId: string): StatusLog[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT sl.*, u.name as operator_name
    FROM status_logs sl
    LEFT JOIN users u ON sl.operator_id = u.id
    WHERE sl.inspection_id = ?
    ORDER BY sl.timestamp
  `).all(inspectionId) as any[];

  return rows.map(row => ({
    id: row.id,
    inspectionId: row.inspection_id,
    fromStatus: row.from_status as InspectionStatus | null,
    toStatus: row.to_status as InspectionStatus,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    remark: row.remark,
    timestamp: row.timestamp
  }));
}

function getDispatchesByInspectionId(inspectionId: string): Dispatch[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT d.*,
           u1.name as dispatcher_name,
           u2.name as receiver_name
    FROM dispatches d
    LEFT JOIN users u1 ON d.dispatcher_id = u1.id
    LEFT JOIN users u2 ON d.receiver_id = u2.id
    WHERE d.inspection_id = ?
    ORDER BY d.dispatch_time DESC
  `).all(inspectionId) as any[];

  return rows.map(row => ({
    id: row.id,
    inspectionId: row.inspection_id,
    dispatcherId: row.dispatcher_id,
    dispatcherName: row.dispatcher_name,
    receiverId: row.receiver_id,
    receiverName: row.receiver_name,
    dispatchTime: row.dispatch_time,
    expectedCompletionTime: row.expected_completion_time,
    actualCompletionTime: row.actual_completion_time,
    dispatchRemark: row.dispatch_remark,
    rectificationRemark: row.rectification_remark
  }));
}

export function createInspection(
  data: CreateInspectionRequest,
  discovererId: string
): Inspection {
  const db = getDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const id = `i${Date.now()}`;

  const discoverer = getUserById(discovererId);
  if (!discoverer) {
    throw new Error('Discoverer not found');
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO inspections (
        id, facility_type, facility_name, location, risk_level,
        description, status, discoverer_id, discovery_time
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
    `).run(
      id,
      data.facilityType,
      data.facilityName,
      data.location,
      data.riskLevel,
      data.description,
      discovererId,
      now
    );

    const insertPhoto = db.prepare(`
      INSERT INTO photos (id, inspection_id, url, thumbnail_url, description, upload_time, uploader_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    data.photos.forEach((photo, index) => {
      const photoId = `p${Date.now()}_${index}`;
      insertPhoto.run(
        photoId,
        id,
        photo.url,
        photo.thumbnailUrl,
        photo.description || '',
        now,
        discovererId
      );
    });

    const statusLogId = `s${Date.now()}`;
    db.prepare(`
      INSERT INTO status_logs (id, inspection_id, from_status, to_status, operator_id, remark, timestamp)
      VALUES (?, ?, NULL, 'pending_review', ?, '提交抽检记录', ?)
    `).run(statusLogId, id, discovererId, now);
  });

  tx();

  const inspection = getInspectionById(id);
  if (!inspection) {
    throw new Error('Failed to create inspection');
  }

  return inspection;
}

export function updateInspectionStatus(
  id: string,
  newStatus: InspectionStatus,
  operatorId: string,
  remark?: string
): Inspection | undefined {
  const db = getDb();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const current = getInspectionById(id);
  if (!current) return undefined;

  const operator = getUserById(operatorId);
  if (!operator) {
    throw new Error('Operator not found');
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE inspections SET status = ? WHERE id = ?').run(newStatus, id);

    const statusLogId = `s${Date.now()}`;
    db.prepare(`
      INSERT INTO status_logs (id, inspection_id, from_status, to_status, operator_id, remark, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(statusLogId, id, current.status, newStatus, operatorId, remark || '', now);
  });

  tx();

  return getInspectionById(id);
}

export function getPendingReviewInspections(): Inspection[] {
  return getInspections({ status: 'pending_review_after' as InspectionStatus });
}
