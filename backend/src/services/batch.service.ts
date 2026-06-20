import db from '../config/database';
import { InboundBatch, BatchStatus, MaterialType } from '../types';
import { generateId, generateBatchNo, formatDate } from '../utils/helpers';

interface CreateBatchInput {
  source: string;
  supplier: string;
  vehicle_plate: string;
  material_type: MaterialType;
  gross_weight: number;
  tare_weight: number;
  weigher_id: string;
  weigher_name: string;
  remark?: string;
}

export const createInboundBatch = (input: CreateBatchInput): InboundBatch => {
  const id = generateId();
  const batch_no = generateBatchNo();
  const net_weight = input.gross_weight - input.tare_weight;
  const now = formatDate();

  const stmt = db.prepare(`
    INSERT INTO inbound_batches (
      id, batch_no, source, supplier, vehicle_plate, material_type,
      gross_weight, tare_weight, net_weight, weigher_id, weigher_name,
      status, remark, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, batch_no, input.source, input.supplier, input.vehicle_plate, input.material_type,
    input.gross_weight, input.tare_weight, net_weight, input.weigher_id, input.weigher_name,
    'created', input.remark || '', now, now
  );

  return getInboundBatchById(id)!;
};

export const getInboundBatchById = (id: string): InboundBatch | undefined => {
  const stmt = db.prepare('SELECT * FROM inbound_batches WHERE id = ?');
  return stmt.get(id) as InboundBatch | undefined;
};

export const getInboundBatchByNo = (batchNo: string): InboundBatch | undefined => {
  const stmt = db.prepare('SELECT * FROM inbound_batches WHERE batch_no = ?');
  return stmt.get(batchNo) as InboundBatch | undefined;
};

export const getAllInboundBatches = (status?: BatchStatus): InboundBatch[] => {
  let sql = 'SELECT * FROM inbound_batches';
  const params: string[] = [];
  
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as InboundBatch[];
};

export const updateBatchStatus = (id: string, status: BatchStatus): boolean => {
  const stmt = db.prepare(`
    UPDATE inbound_batches 
    SET status = ?, updated_at = ?
    WHERE id = ?
  `);
  const result = stmt.run(status, formatDate(), id);
  return result.changes > 0;
};

export const getBatchStatistics = () => {
  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(net_weight) as total_weight
    FROM inbound_batches
    GROUP BY status
  `).all();
  
  return stats;
};
