CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('operations', 'customer_service', 'maintenance')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  complaint_no VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('monthly_rental_expired', 'unlicensed_vehicle', 'gate_malfunction')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'processing', 'appealing', 'rejected', 'closed')),
  plate_number VARCHAR(20),
  description TEXT NOT NULL,
  parking_lot_id INT NOT NULL DEFAULT 1,
  assignee_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deadline TIMESTAMP NOT NULL
);

CREATE TABLE complaint_timeline (
  id SERIAL PRIMARY KEY,
  complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  operator_id INT NOT NULL REFERENCES users(id),
  operator_name VARCHAR(100) NOT NULL,
  operator_role VARCHAR(30) NOT NULL,
  detail TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE parking_logs (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL,
  direction VARCHAR(5) NOT NULL CHECK (direction IN ('in', 'out')),
  gate_id INT NOT NULL,
  gate_name VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  image_url VARCHAR(500)
);

CREATE TABLE monthly_rentals (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(15) NOT NULL CHECK (status IN ('active', 'expired', 'suspended')),
  parking_lot_id INT NOT NULL DEFAULT 1,
  last_renewed_at TIMESTAMP
);

CREATE TABLE gate_anomalies (
  id SERIAL PRIMARY KEY,
  gate_id INT NOT NULL,
  gate_name VARCHAR(50) NOT NULL,
  anomaly_type VARCHAR(20) NOT NULL CHECK (anomaly_type IN ('stuck_open', 'stuck_closed', 'sensor_error', 'force_open')),
  detected_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(100),
  impact_hours DECIMAL(5,2),
  description TEXT
);

CREATE TABLE evidence_links (
  id SERIAL PRIMARY KEY,
  complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  evidence_type VARCHAR(20) NOT NULL CHECK (evidence_type IN ('parking_log', 'monthly_rental', 'gate_anomaly')),
  evidence_id INT NOT NULL,
  linked_by INT NOT NULL REFERENCES users(id),
  linked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_type ON complaints(type);
CREATE INDEX idx_complaints_assignee ON complaints(assignee_id);
CREATE INDEX idx_complaints_deadline ON complaints(deadline);
CREATE INDEX idx_parking_logs_plate ON parking_logs(plate_number);
CREATE INDEX idx_parking_logs_timestamp ON parking_logs(timestamp);
CREATE INDEX idx_monthly_rentals_plate ON monthly_rentals(plate_number);
CREATE INDEX idx_gate_anomalies_detected ON gate_anomalies(detected_at);
CREATE INDEX idx_evidence_links_complaint ON evidence_links(complaint_id);
