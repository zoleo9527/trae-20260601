const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'coldchain.db')

let db

function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

function initSchema() {
  const d = getDb()

  d.exec(`
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      shipment_no TEXT UNIQUE NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      shipper_name TEXT NOT NULL,
      consignee_name TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      driver_phone TEXT NOT NULL,
      vehicle_no TEXT NOT NULL,
      temp_min REAL NOT NULL,
      temp_max REAL NOT NULL,
      product_name TEXT NOT NULL,
      product_category TEXT NOT NULL DEFAULT 'drug',
      status TEXT NOT NULL DEFAULT 'created',
      planned_departure TEXT,
      planned_arrival TEXT,
      actual_departure TEXT,
      actual_arrival TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS temperature_samples (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      temperature REAL NOT NULL,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_temp_samples_shipment_time
      ON temperature_samples(shipment_id, recorded_at);

    CREATE TABLE IF NOT EXISTS anomaly_intervals (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      min_temp REAL NOT NULL,
      max_temp REAL NOT NULL,
      temp_lower_bound REAL NOT NULL,
      temp_upper_bound REAL NOT NULL,
      duration_seconds INTEGER NOT NULL,
      sample_count INTEGER NOT NULL DEFAULT 0,
      confirmed INTEGER NOT NULL DEFAULT 0,
      confirmed_by TEXT,
      confirmed_at TEXT,
      status TEXT NOT NULL DEFAULT 'detected',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_anomaly_shipment_time
      ON anomaly_intervals(shipment_id, started_at, ended_at);

    CREATE TABLE IF NOT EXISTS delivery_receipts (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL UNIQUE REFERENCES shipments(id) ON DELETE CASCADE,
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      received_at TEXT NOT NULL,
      temperature_at_delivery REAL,
      photo_urls TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      initiated_by TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      resolution TEXT,
      resolved_by TEXT,
      resolved_at TEXT,
      anomaly_interval_ids TEXT NOT NULL DEFAULT '[]',
      evidence_summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_disputes_shipment
      ON disputes(shipment_id);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT NOT NULL,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      details TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_audit_entity
      ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_time
      ON audit_logs(changed_at);
  `)

  return d
}

function auditLog(d, { entity_type, entity_id, action, old_value, new_value, changed_by, details }) {
  d.prepare(`
    INSERT INTO audit_logs (id, entity_type, entity_id, action, old_value, new_value, changed_by, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    require('uuid').v7(),
    entity_type,
    entity_id,
    action,
    old_value ?? null,
    new_value ?? null,
    changed_by,
    details ? JSON.stringify(details) : null
  )
}

module.exports = { getDb, initSchema, auditLog }
