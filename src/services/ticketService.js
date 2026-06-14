const { getDB, tx, newId, assertFound } = require('../db');
const { AppError } = require('../errors');
const { REGISTRATION_STATUS, addTimeline, pushNotification } = require('./registrationService');

function generateTicketNo(regId) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = regId.slice(0, 8).toUpperCase();
  return `ZKZ${date}${suffix}`;
}

function findAvailableRoom(db, examType) {
  const rooms = db.prepare(`
    SELECT er.*, COUNT(at.id) AS occupied
    FROM exam_rooms er
    LEFT JOIN admission_tickets at ON at.exam_room_id = er.id
    GROUP BY er.id
    HAVING occupied < er.capacity
    ORDER BY er.room_code ASC
    LIMIT 1
  `).all();
  if (rooms.length === 0) return null;
  return rooms[0];
}

function generateAdmissionTicket(registrationId, { operatorId, operatorRole, examRoomId }) {
  const db = getDB();
  const reg = assertFound(
    db.prepare('SELECT * FROM registrations WHERE id = ?').get(registrationId),
    'REGISTRATION_NOT_FOUND'
  );
  if (reg.status !== REGISTRATION_STATUS.APPROVED) {
    throw new AppError('TICKET_NOT_APPROVED');
  }
  const existing = db.prepare('SELECT id FROM admission_tickets WHERE registration_id = ?').get(registrationId);
  if (existing) {
    throw new AppError('TICKET_ALREADY_GENERATED');
  }

  return tx(() => {
    let room;
    if (examRoomId) {
      room = assertFound(db.prepare('SELECT * FROM exam_rooms WHERE id = ?').get(examRoomId), 'EXAM_ROOM_NOT_FOUND');
    } else {
      room = findAvailableRoom(db, reg.exam_type);
      if (!room) throw new AppError('EXAM_ROOM_NOT_FOUND');
    }
    const occupied = db.prepare('SELECT COUNT(*) AS c FROM admission_tickets WHERE exam_room_id = ?').get(room.id).c;
    if (occupied >= room.capacity) throw new AppError('EXAM_ROOM_NOT_FOUND');

    const seatNo = occupied + 1;
    const ticketId = newId();
    const ticketNo = generateTicketNo(registrationId);
    db.prepare(`
      INSERT INTO admission_tickets (id, registration_id, ticket_no, exam_room_id, seat_no, generated_by)
      VALUES (@id, @registrationId, @ticketNo, @examRoomId, @seatNo, @operatorId)
    `).run({ id: ticketId, registrationId, ticketNo, examRoomId: room.id, seatNo, operatorId });
    addTimeline(registrationId, 'generate_ticket', operatorId, operatorRole,
      `生成准考证：${ticketNo}，考场：${room.room_code}，座位号：${seatNo}`);
    pushNotification({
      userRole: 'invigilator',
      registrationId,
      title: '准考证已生成',
      content: `考生 ${reg.candidate_name} 准考证已生成：${ticketNo}，考场：${room.room_code}`,
      type: 'ticket_generated',
    });
    return getTicketDetail(ticketId);
  });
}

function getTicketDetail(ticketId) {
  const db = getDB();
  const ticket = db.prepare(`
    SELECT t.*, r.candidate_name, r.id_card, r.exam_type, r.phone, r.email,
           er.room_code, er.building, er.exam_time, u.name AS generated_by_name
    FROM admission_tickets t
    JOIN registrations r ON t.registration_id = r.id
    LEFT JOIN exam_rooms er ON t.exam_room_id = er.id
    LEFT JOIN users u ON t.generated_by = u.id
    WHERE t.id = ?
  `).get(ticketId);
  assertFound(ticket, 'TICKET_NOT_FOUND');
  return ticket;
}

function getTicketByRegistration(registrationId) {
  const db = getDB();
  const ticket = db.prepare(`
    SELECT t.*, r.candidate_name, r.id_card, r.exam_type,
           er.room_code, er.building, er.exam_time, u.name AS generated_by_name
    FROM admission_tickets t
    JOIN registrations r ON t.registration_id = r.id
    LEFT JOIN exam_rooms er ON t.exam_room_id = er.id
    LEFT JOIN users u ON t.generated_by = u.id
    WHERE t.registration_id = ?
  `).get(registrationId);
  assertFound(ticket, 'TICKET_NOT_FOUND');
  return ticket;
}

function listTickets({ roomCode, offset = 0, limit = 20 } = {}) {
  const db = getDB();
  const conditions = [];
  const params = {};
  if (roomCode) {
    conditions.push('er.room_code = @roomCode');
    params.roomCode = roomCode;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`
    SELECT t.*, r.candidate_name, r.exam_type, er.room_code, er.building
    FROM admission_tickets t
    JOIN registrations r ON t.registration_id = r.id
    LEFT JOIN exam_rooms er ON t.exam_room_id = er.id
    ${where}
    ORDER BY t.generated_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: Number(limit), offset: Number(offset) });
  const total = db.prepare(`SELECT COUNT(*) AS c FROM admission_tickets t
    LEFT JOIN exam_rooms er ON t.exam_room_id = er.id ${where}`).get(params).c;
  return { total, items: rows };
}

module.exports = {
  generateAdmissionTicket,
  getTicketDetail,
  getTicketByRegistration,
  listTickets,
};
