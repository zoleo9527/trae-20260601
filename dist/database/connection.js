"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = getConnection;
exports.initDatabase = initDatabase;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'egg_farm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
async function getConnection() {
    return await pool.getConnection();
}
async function initDatabase() {
    const conn = await pool.getConnection();
    try {
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role ENUM('breeder', 'sorter', 'manager') NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS egg_grade_records (
        id VARCHAR(36) PRIMARY KEY,
        batch_number VARCHAR(50) NOT NULL,
        grade ENUM('A', 'B', 'C') NOT NULL,
        quantity INT NOT NULL,
        weight DECIMAL(10,2) NOT NULL,
        breeder_id VARCHAR(36) NOT NULL,
        breeder_name VARCHAR(100) NOT NULL,
        sorter_id VARCHAR(36),
        sorter_name VARCHAR(100),
        status ENUM('pending', 'verified', 'packed') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_batch_number (batch_number),
        INDEX idx_status (status),
        INDEX idx_breeder_id (breeder_id),
        INDEX idx_sorter_id (sorter_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS packing_records (
        id VARCHAR(36) PRIMARY KEY,
        egg_grade_record_id VARCHAR(36) NOT NULL,
        batch_number VARCHAR(50) NOT NULL,
        box_count INT NOT NULL,
        eggs_per_box INT NOT NULL,
        total_eggs INT NOT NULL,
        destination VARCHAR(200) NOT NULL,
        transporter VARCHAR(100),
        manager_id VARCHAR(36) NOT NULL,
        manager_name VARCHAR(100) NOT NULL,
        sorted_by_id VARCHAR(36) NOT NULL,
        sorted_by_name VARCHAR(100) NOT NULL,
        status ENUM('confirmed', 'shipped') DEFAULT 'confirmed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_egg_grade_record_id (egg_grade_record_id),
        INDEX idx_batch_number (batch_number),
        INDEX idx_status (status),
        INDEX idx_manager_id (manager_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS action_logs (
        id VARCHAR(36) PRIMARY KEY,
        target_type ENUM('grade', 'packing') NOT NULL,
        target_id VARCHAR(36) NOT NULL,
        action VARCHAR(100) NOT NULL,
        operator_id VARCHAR(36) NOT NULL,
        operator_name VARCHAR(100) NOT NULL,
        operator_role ENUM('breeder', 'sorter', 'manager') NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        details TEXT,
        INDEX idx_target_type (target_type),
        INDEX idx_target_id (target_id),
        INDEX idx_operator_id (operator_id),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        await conn.execute(`
      INSERT IGNORE INTO users (id, name, role) VALUES 
      ('breeder001', '张饲养', 'breeder'),
      ('breeder002', '李饲养', 'breeder'),
      ('sorter001', '王分拣', 'sorter'),
      ('sorter002', '赵分拣', 'sorter'),
      ('manager001', '刘场长', 'manager');
    `);
        console.log('Database initialized successfully');
    }
    finally {
        conn.release();
    }
}
