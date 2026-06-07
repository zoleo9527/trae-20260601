CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    status INT DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS booking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_no VARCHAR(32) NOT NULL UNIQUE,
    room_no VARCHAR(20) NOT NULL,
    customer_name VARCHAR(50),
    customer_phone VARCHAR(20),
    member_id BIGINT,
    booking_time TIMESTAMP NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    gift_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    remark VARCHAR(255),
    create_by BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS drink (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    drink_code VARCHAR(32) NOT NULL UNIQUE,
    drink_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    spec VARCHAR(50),
    unit VARCHAR(20),
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    status INT DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS drink_outbound (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outbound_no VARCHAR(32) NOT NULL UNIQUE,
    booking_id BIGINT,
    booking_no VARCHAR(32),
    room_no VARCHAR(20),
    outbound_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) DEFAULT 0,
    remark VARCHAR(255),
    verification_id BIGINT,
    verification_no VARCHAR(32),
    idempotent_key VARCHAR(64) UNIQUE,
    create_by BIGINT,
    handle_by BIGINT,
    handle_time TIMESTAMP,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS drink_outbound_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outbound_id BIGINT NOT NULL,
    drink_id BIGINT NOT NULL,
    drink_name VARCHAR(100),
    spec VARCHAR(50),
    unit VARCHAR(20),
    price DECIMAL(10,2),
    quantity INT NOT NULL,
    amount DECIMAL(10,2),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gift_verification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    verification_no VARCHAR(32) NOT NULL UNIQUE,
    booking_id BIGINT NOT NULL,
    booking_no VARCHAR(32),
    room_no VARCHAR(20),
    customer_name VARCHAR(50),
    member_id BIGINT,
    gift_amount DECIMAL(10,2) NOT NULL,
    historical_used_amount DECIMAL(10,2) DEFAULT 0,
    used_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    outbound_status VARCHAR(20),
    outbound_id BIGINT,
    outbound_no VARCHAR(32),
    remark VARCHAR(255),
    reject_reason VARCHAR(255),
    idempotent_key VARCHAR(64) UNIQUE,
    create_by BIGINT,
    handle_by BIGINT,
    handle_time TIMESTAMP,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gift_verification_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    verification_id BIGINT NOT NULL,
    drink_id BIGINT NOT NULL,
    drink_name VARCHAR(100),
    spec VARCHAR(50),
    unit VARCHAR(20),
    price DECIMAL(10,2),
    quantity INT NOT NULL,
    amount DECIMAL(10,2),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INT DEFAULT 0
);

CREATE INDEX idx_booking_no ON booking(booking_no);
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_outbound_status ON drink_outbound(status);
CREATE INDEX idx_outbound_booking ON drink_outbound(booking_id);
CREATE INDEX idx_verification_status ON gift_verification(status);
CREATE INDEX idx_verification_booking ON gift_verification(booking_id);
CREATE INDEX idx_outbound_idempotent ON drink_outbound(idempotent_key);
CREATE INDEX idx_verification_idempotent ON gift_verification(idempotent_key);
