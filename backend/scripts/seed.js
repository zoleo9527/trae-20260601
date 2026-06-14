const { initDB, getDB, tx, newId } = require('../src/db');

initDB();
const db = getDB();

const seed = () => {
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM operation_logs;
    DELETE FROM fee_records;
    DELETE FROM makeup_exams;
    DELETE FROM exam_bookings;
    DELETE FROM exam_sessions;
    DELETE FROM coach_schedules;
    DELETE FROM coaches;
    DELETE FROM students;
    DELETE FROM users;
  `);

  const admission1 = newId();
  const admission2 = newId();
  const coach1 = newId();
  const coach2 = newId();
  const exam1 = newId();
  const exam2 = newId();
  const admin1 = newId();

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, name, role, phone) VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run(admission1, 'admission_zhang', '张顾问', 'admission_consultant', '13800138001');
  insertUser.run(admission2, 'admission_li', '李顾问', 'admission_consultant', '13800138002');
  insertUser.run(coach1, 'coach_wang', '王教练', 'coach', '13800138003');
  insertUser.run(coach2, 'coach_zhao', '赵教练', 'coach', '13800138004');
  insertUser.run(exam1, 'exam_chen', '陈专员', 'exam_specialist', '13800138005');
  insertUser.run(exam2, 'exam_liu', '刘专员', 'exam_specialist', '13800138006');
  insertUser.run(admin1, 'admin_sun', '孙管理员', 'admin', '13800138007');

  const coachInfo1 = newId();
  const coachInfo2 = newId();
  const insertCoach = db.prepare(`
    INSERT INTO coaches (id, user_id, license_no, subjects, car_model, car_plate, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);
  insertCoach.run(coachInfo1, coach1, 'A123456789', '2,3', '大众朗逸', '京A12345');
  insertCoach.run(coachInfo2, coach2, 'B987654321', '2,3', '丰田卡罗拉', '京B67890');

  const students = [
    ['周小明', '110101200001011234', '13900139001', 'male', 'C1', '2026-03-01', coach1, 1, 'studying'],
    ['吴小红', '110101200002022345', '13900139002', 'female', 'C2', '2026-03-15', coach1, 2, 'studying'],
    ['郑小强', '110101199903033456', '13900139003', 'male', 'C1', '2026-02-10', coach2, 3, 'studying'],
    ['王小丽', '110101199904044567', '13900139004', 'female', 'C1', '2026-01-20', coach2, 1, 'studying'],
    ['孙大伟', '110101199805055678', '13900139005', 'male', 'C2', '2026-04-01', coach1, 2, 'studying'],
    ['马小芳', '110101200006066789', '13900139006', 'female', 'C1', '2026-04-15', null, 1, 'studying'],
    ['朱志强', '110101199707077890', '13900139007', 'male', 'C1', '2026-02-28', coach2, 4, 'studying'],
    ['胡雅婷', '110101199808088901', '13900139008', 'female', 'C2', '2026-03-20', coach1, 2, 'studying'],
  ];

  const studentIds = [];
  const insertStudent = db.prepare(`
    INSERT INTO students
    (id, name, id_card, phone, gender, license_type, enroll_date, coach_id, current_subject, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  students.forEach(s => {
    const id = newId();
    studentIds.push(id);
    insertStudent.run(id, ...s, admission1);
  });

  const examSessions = [
    [1, '2026-06-20', '09:00', '京南车管所理论考场', 100],
    [1, '2026-06-27', '14:00', '京南车管所理论考场', 100],
    [2, '2026-06-21', '08:00', '京北驾考中心科目二考场', 30],
    [2, '2026-06-28', '08:00', '京北驾考中心科目二考场', 30],
    [3, '2026-06-22', '07:30', '京北驾考中心科目三考场', 25],
    [3, '2026-06-29', '07:30', '京北驾考中心科目三考场', 25],
    [4, '2026-06-23', '09:00', '京南车管所理论考场', 100],
    [4, '2026-06-30', '14:00', '京南车管所理论考场', 100],
  ];

  const sessionIds = [];
  const insertSession = db.prepare(`
    INSERT INTO exam_sessions
    (id, subject, exam_date, exam_time, exam_location, total_quota, booked_count, status)
    VALUES (?, ?, ?, ?, ?, ?, 0, 'open')
  `);
  examSessions.forEach(es => {
    const id = newId();
    sessionIds.push(id);
    insertSession.run(id, ...es);
  });

  const booking1 = newId();
  const booking2 = newId();
  const booking3 = newId();
  const booking4 = newId();

  const insertBooking = db.prepare(`
    INSERT INTO exam_bookings
    (id, student_id, subject, exam_session_id, status, is_makeup, apply_time, approve_time, approve_by, created_by)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?)
  `);
  insertBooking.run(booking1, studentIds[1], 2, sessionIds[2], 'booked', 0, exam1, admission1);
  insertBooking.run(booking2, studentIds[2], 3, sessionIds[4], 'booked', 0, exam1, admission1);
  insertBooking.run(booking3, studentIds[4], 2, sessionIds[3], 'approved', 0, exam2, admission2);
  insertBooking.run(booking4, studentIds[6], 4, sessionIds[6], 'booked', 0, exam1, admission1);

  const pendingBooking1 = newId();
  const pendingBooking2 = newId();
  db.prepare(`
    INSERT INTO exam_bookings
    (id, student_id, subject, status, is_makeup, apply_time, created_by)
    VALUES (?, ?, ?, 'pending', 0, datetime('now', '-2 hours'), ?)
  `).run(pendingBooking1, studentIds[0], 1, admission1);
  db.prepare(`
    INSERT INTO exam_bookings
    (id, student_id, subject, status, is_makeup, apply_time, created_by)
    VALUES (?, ?, ?, 'pending', 0, datetime('now', '-30 minutes'), ?)
  `).run(pendingBooking2, studentIds[3], 1, admission2);

  const failedBooking1 = newId();
  db.prepare(`
    INSERT INTO exam_bookings
    (id, student_id, subject, exam_session_id, status, is_makeup, exam_result, exam_score, result_time, apply_time, approve_time, approve_by, created_by)
    VALUES (?, ?, ?, ?, 'failed', 0, '未通过', 65, datetime('now', '-3 days'), datetime('now', '-10 days'), datetime('now', '-7 days'), ?, ?)
  `).run(failedBooking1, studentIds[5], 1, sessionIds[0], exam1, admission1);

  const makeup1 = newId();
  db.prepare(`
    INSERT INTO makeup_exams
    (id, student_id, failed_booking_id, subject, failed_date, fail_reason, makeup_fee, fee_paid, status, created_by)
    VALUES (?, ?, ?, 1, date('now', '-3 days'), '理论考试未通过，得分65分', 100, 0, 'pending_payment', ?)
  `).run(makeup1, studentIds[5], failedBooking1, exam1);

  const makeup2 = newId();
  db.prepare(`
    INSERT INTO makeup_exams
    (id, student_id, failed_booking_id, subject, failed_date, fail_reason, makeup_fee, fee_paid, fee_paid_time, status, created_by)
    VALUES (?, ?, ?, 2, date('now', '-5 days'), '场地考试扣分过多', 250, 1, datetime('now', '-1 days'), 'pending_booking', ?)
  `).run(makeup2, studentIds[1], booking1, admission1);

  const fee1 = newId();
  const fee2 = newId();
  const fee3 = newId();
  const insertFee = db.prepare(`
    INSERT INTO fee_records
    (id, student_id, type, amount, paid_amount, status, remark, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFee.run(fee1, studentIds[0], 'tuition', 4800, 4800, 'paid', 'C1驾照学费', admission1);
  insertFee.run(fee2, studentIds[1], 'tuition', 5200, 3000, 'partial', 'C2驾照学费，已交部分', admission1);
  insertFee.run(fee3, studentIds[3], 'tuition', 4800, 0, 'unpaid', 'C1驾照学费', admission2);

  const scheduleDates = ['2026-06-14', '2026-06-15', '2026-06-16'];
  const timeSlots = [
    ['08:00', '10:00'],
    ['10:00', '12:00'],
    ['14:00', '16:00'],
    ['16:00', '18:00'],
  ];

  scheduleDates.forEach((date, di) => {
    timeSlots.forEach((slot, si) => {
      if (di === 0 && si < 2) {
        const scheduleId = newId();
        const studentIndex = si === 0 ? 1 : 4;
        db.prepare(`
          INSERT INTO coach_schedules
          (id, coach_id, schedule_date, start_time, end_time, type, student_id, status)
          VALUES (?, ?, ?, ?, ?, 'practice', ?, 'booked')
        `).run(scheduleId, coachInfo1, date, slot[0], slot[1], studentIds[studentIndex]);
      } else {
        const scheduleId1 = newId();
        db.prepare(`
          INSERT INTO coach_schedules
          (id, coach_id, schedule_date, start_time, end_time, type, status)
          VALUES (?, ?, ?, ?, ?, 'practice', 'available')
        `).run(scheduleId1, coachInfo1, date, slot[0], slot[1]);

        const scheduleId2 = newId();
        db.prepare(`
          INSERT INTO coach_schedules
          (id, coach_id, schedule_date, start_time, end_time, type, status)
          VALUES (?, ?, ?, ?, ?, 'practice', 'available')
        `).run(scheduleId2, coachInfo2, date, slot[0], slot[1]);
      }
    });
  });

  console.log('✅ 种子数据已创建完成：');
  console.log('');
  console.log('  === 用户 ===');
  const users = db.prepare('SELECT id, username, name, role, phone FROM users ORDER BY role').all();
  users.forEach(u => {
    const roleNames = {
      admission_consultant: '招生顾问',
      coach: '教练',
      exam_specialist: '考试专员',
      admin: '管理员',
    };
    console.log(`  ${roleNames[u.role].padEnd(6)} ${u.id}  →  ${u.name}（${u.username}）`);
  });
  console.log('');
  console.log('  === 教练 ===');
  console.log('  王教练 - 带教学员：吴小红、孙大伟、胡雅婷 | 可教科目：2、3');
  console.log('  赵教练 - 带教学员：郑小强、朱志强 | 可教科目：2、3');
  console.log('');
  console.log('  === 学员 ===');
  console.log('  共 8 名学员，涵盖科目1-4各阶段');
  console.log('  周小明 - 科目1待考 | 吴小红 - 科目2已约考');
  console.log('  郑小强 - 科目3已约考 | 王小丽 - 科目1待审核');
  console.log('  孙大伟 - 科目2待约考 | 马小芳 - 科目1理论学习（未分配教练）');
  console.log('  朱志强 - 科目4已约考 | 胡雅婷 - 科目2学习中');
  console.log('');
  console.log('  === 考试预约 ===');
  console.log('  待审核：2 条（周小明科目1、王小丽科目1）');
  console.log('  已约考：3 条（吴小红科目2、郑小强科目3、朱志强科目4）');
  console.log('  已通过/待缴费补考：1 条（马小芳科目1未通过，待缴补考费）');
  console.log('');
  console.log('  === 补考跟进 ===');
  console.log('  待缴费：1 条（马小芳，科目1，¥100）');
  console.log('  待约考：1 条（吴小红，科目2，已缴费¥250）');
  console.log('');
  console.log('  === 考试场次 ===');
  console.log('  共 8 个场次，涵盖科目1-4，日期 6月20日-30日');
  console.log('');
  console.log('  === 教练排班 ===');
  console.log('  6月14日-16日，每日8个时段（王教练4个、赵教练4个）');
  console.log('  已预约：2 个时段（吴小红、孙大伟）');
  console.log('');
  console.log('  === 费用 ===');
  console.log('  已缴清：周小明 ¥4800');
  console.log('  部分缴费：吴小红 ¥3000/¥5200');
  console.log('  未缴费：王小丽 ¥4800');
  console.log('');
  console.log('  使用示例（设置请求头）：');
  console.log(`  X-User-Id: ${admission1}  X-User-Role: admission_consultant  # 张顾问`);
  console.log(`  X-User-Id: ${coach1}      X-User-Role: coach                 # 王教练`);
  console.log(`  X-User-Id: ${exam1}       X-User-Role: exam_specialist       # 陈专员`);
  console.log(`  X-User-Id: ${admin1}      X-User-Role: admin                 # 孙管理员`);
};

db.transaction(seed)();
