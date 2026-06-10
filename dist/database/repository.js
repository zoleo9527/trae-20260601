"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEggGradeRecord = createEggGradeRecord;
exports.verifyEggGradeRecord = verifyEggGradeRecord;
exports.getEggGradeRecordById = getEggGradeRecordById;
exports.getEggGradeRecords = getEggGradeRecords;
exports.updateEggGradeRecordStatus = updateEggGradeRecordStatus;
exports.createPackingRecord = createPackingRecord;
exports.shipPackingRecord = shipPackingRecord;
exports.getPackingRecordById = getPackingRecordById;
exports.getPackingRecords = getPackingRecords;
exports.createActionLog = createActionLog;
exports.getActionLogs = getActionLogs;
exports.getUserById = getUserById;
exports.getUsersByRole = getUsersByRole;
const connection_1 = require("./connection");
const helpers_1 = require("../utils/helpers");
async function createEggGradeRecord(record) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const id = crypto.randomUUID();
        const now = new Date();
        await conn.execute('INSERT INTO egg_grade_records (id, batch_number, grade, quantity, weight, breeder_id, breeder_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, record.batchNumber, record.grade, record.quantity, record.weight, record.breederId, record.breederName, 'pending', now, now]);
        return { ...record, id, sorterId: null, sorterName: null, status: 'pending', createdAt: now, updatedAt: now };
    }
    finally {
        conn.release();
    }
}
async function verifyEggGradeRecord(id, sorterId, sorterName) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const [rows] = await conn.execute('UPDATE egg_grade_records SET sorter_id = ?, sorter_name = ?, status = ?, updated_at = ? WHERE id = ? AND status = ?', [sorterId, sorterName, 'verified', new Date(), id, 'pending']);
        const result = rows;
        if (result.affectedRows === 0)
            return null;
        const [records] = await conn.execute('SELECT * FROM egg_grade_records WHERE id = ?', [id]);
        const record = records[0];
        return record ? (0, helpers_1.snakeToCamel)(record) : null;
    }
    finally {
        conn.release();
    }
}
async function getEggGradeRecordById(id) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const [rows] = await conn.execute('SELECT * FROM egg_grade_records WHERE id = ?', [id]);
        const record = rows[0];
        return record ? (0, helpers_1.snakeToCamel)(record) : null;
    }
    finally {
        conn.release();
    }
}
async function getEggGradeRecords(filter, pageRequest) {
    const conn = await (0, connection_1.getConnection)();
    try {
        let query = 'SELECT * FROM egg_grade_records WHERE 1=1';
        const params = [];
        if (filter.batchNumber) {
            query += ' AND batch_number LIKE ?';
            params.push(`%${filter.batchNumber}%`);
        }
        if (filter.grade) {
            query += ' AND grade = ?';
            params.push(filter.grade);
        }
        if (filter.status) {
            query += ' AND status = ?';
            params.push(filter.status);
        }
        if (filter.breederId) {
            query += ' AND breeder_id = ?';
            params.push(filter.breederId);
        }
        if (filter.sorterId) {
            query += ' AND sorter_id = ?';
            params.push(filter.sorterId);
        }
        if (filter.startDate) {
            query += ' AND created_at >= ?';
            params.push(filter.startDate);
        }
        if (filter.endDate) {
            query += ' AND created_at <= ?';
            params.push(filter.endDate);
        }
        query += ' ORDER BY created_at DESC';
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countRows] = await conn.execute(countQuery, params);
        const total = countRows[0]?.total || 0;
        const offset = (pageRequest.page - 1) * pageRequest.pageSize;
        query += ' LIMIT ? OFFSET ?';
        params.push(pageRequest.pageSize, offset);
        const [rows] = await conn.execute(query, params);
        return {
            data: (0, helpers_1.snakeToCamel)(rows),
            total,
            page: pageRequest.page,
            pageSize: pageRequest.pageSize
        };
    }
    finally {
        conn.release();
    }
}
async function updateEggGradeRecordStatus(id, status) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const [result] = await conn.execute('UPDATE egg_grade_records SET status = ?, updated_at = ? WHERE id = ?', [status, new Date(), id]);
        return result.affectedRows > 0;
    }
    finally {
        conn.release();
    }
}
async function createPackingRecord(record) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const id = crypto.randomUUID();
        const now = new Date();
        await conn.execute('INSERT INTO packing_records (id, egg_grade_record_id, batch_number, box_count, eggs_per_box, total_eggs, destination, transporter, manager_id, manager_name, sorted_by_id, sorted_by_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, record.eggGradeRecordId, record.batchNumber, record.boxCount, record.eggsPerBox, record.totalEggs, record.destination, record.transporter, record.managerId, record.managerName, record.sortedById, record.sortedByName, 'confirmed', now, now]);
        return { ...record, id, createdAt: now, updatedAt: now };
    }
    finally {
        conn.release();
    }
}
async function shipPackingRecord(id) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const [result] = await conn.execute('UPDATE packing_records SET status = ?, updated_at = ? WHERE id = ? AND status = ?', ['shipped', new Date(), id, 'confirmed']);
        const affected = result.affectedRows;
        if (affected === 0)
            return null;
        const [records] = await conn.execute('SELECT * FROM packing_records WHERE id = ?', [id]);
        const record = records[0];
        return record ? (0, helpers_1.snakeToCamel)(record) : null;
    }
    finally {
        conn.release();
    }
}
async function getPackingRecordById(id) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const [rows] = await conn.execute('SELECT * FROM packing_records WHERE id = ?', [id]);
        const record = rows[0];
        return record ? (0, helpers_1.snakeToCamel)(record) : null;
    }
    finally {
        conn.release();
    }
}
async function getPackingRecords(filter, pageRequest) {
    const conn = await (0, connection_1.getConnection)();
    try {
        let query = 'SELECT * FROM packing_records WHERE 1=1';
        const params = [];
        if (filter.batchNumber) {
            query += ' AND batch_number LIKE ?';
            params.push(`%${filter.batchNumber}%`);
        }
        if (filter.destination) {
            query += ' AND destination LIKE ?';
            params.push(`%${filter.destination}%`);
        }
        if (filter.status) {
            query += ' AND status = ?';
            params.push(filter.status);
        }
        if (filter.managerId) {
            query += ' AND manager_id = ?';
            params.push(filter.managerId);
        }
        if (filter.startDate) {
            query += ' AND created_at >= ?';
            params.push(filter.startDate);
        }
        if (filter.endDate) {
            query += ' AND created_at <= ?';
            params.push(filter.endDate);
        }
        query += ' ORDER BY created_at DESC';
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countRows] = await conn.execute(countQuery, params);
        const total = countRows[0]?.total || 0;
        const offset = (pageRequest.page - 1) * pageRequest.pageSize;
        query += ' LIMIT ? OFFSET ?';
        params.push(pageRequest.pageSize, offset);
        const [rows] = await conn.execute(query, params);
        return {
            data: (0, helpers_1.snakeToCamel)(rows),
            total,
            page: pageRequest.page,
            pageSize: pageRequest.pageSize
        };
    }
    finally {
        conn.release();
    }
}
async function createActionLog(log) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const id = crypto.randomUUID();
        const now = new Date();
        await conn.execute('INSERT INTO action_logs (id, target_type, target_id, action, operator_id, operator_name, operator_role, timestamp, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, log.targetType, log.targetId, log.action, log.operatorId, log.operatorName, log.operatorRole, now, log.details]);
        return { ...log, id, timestamp: now };
    }
    finally {
        conn.release();
    }
}
async function getActionLogs(targetType, targetId) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const [rows] = await conn.execute('SELECT * FROM action_logs WHERE target_type = ? AND target_id = ? ORDER BY timestamp DESC', [targetType, targetId]);
        return (0, helpers_1.snakeToCamel)(rows);
    }
    finally {
        conn.release();
    }
}
async function getUserById(id) {
    const conn = await (0, connection_1.getConnection)();
    try {
        const [rows] = await conn.execute('SELECT * FROM users WHERE id = ?', [id]);
        const record = rows[0];
        return record ? (0, helpers_1.snakeToCamel)(record) : null;
    }
    finally {
        conn.release();
    }
}
async function getUsersByRole(role) {
    const conn = await (0, connection_1.getConnection)();
    try {
        let query = 'SELECT * FROM users';
        const params = [];
        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }
        const [rows] = await conn.execute(query, params);
        return (0, helpers_1.snakeToCamel)(rows);
    }
    finally {
        conn.release();
    }
}
