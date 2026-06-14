export const createTables = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('registrar', 'coach', 'safety_officer')),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    id_card VARCHAR(18) UNIQUE NOT NULL,
    phone VARCHAR(20),
    enrollment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'training', 'gear_issued', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS training_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    trainer_id INTEGER REFERENCES users(id),
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS gear_issues (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    issuer_id INTEGER REFERENCES users(id),
    training_record_id INTEGER REFERENCES training_records(id),
    helmet BOOLEAN DEFAULT false,
    jacket BOOLEAN DEFAULT false,
    gloves BOOLEAN DEFAULT false,
    boots BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'returned')),
    issued_at TIMESTAMP,
    returned_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
