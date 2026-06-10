ALTER TABLE complaints ADD COLUMN appeal_reason TEXT;
ALTER TABLE complaints ADD COLUMN appealed_at TIMESTAMP;
ALTER TABLE complaints ADD COLUMN incident_time TIMESTAMP;
ALTER TABLE complaints ADD COLUMN gate_id INT;
ALTER TABLE complaints ADD COLUMN gate_name VARCHAR(50);

ALTER TABLE parking_logs ALTER COLUMN plate_number DROP NOT NULL;

CREATE INDEX idx_complaints_incident_time ON complaints(incident_time);
CREATE INDEX idx_complaints_gate_id ON complaints(gate_id);
CREATE INDEX idx_parking_logs_gate_timestamp ON parking_logs(gate_id, timestamp);
CREATE INDEX idx_gate_anomalies_gate_detected ON gate_anomalies(gate_id, detected_at);
