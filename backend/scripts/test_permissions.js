const { initDB, getDB } = require('../src/db');
initDB();
const db = getDB();

const { hasPermission, ROLE_PERMISSIONS } = require('../src/statusConstraints');

console.log('========================================');
console.log('  权限矩阵验证测试');
console.log('========================================\n');

const roles = ['admission_consultant', 'coach', 'exam_specialist', 'admin'];
const roleNames = {
  admission_consultant: '招生顾问',
  coach: '教练',
  exam_specialist: '考试专员',
  admin: '管理员',
};

const makeupActions = [
  { action: 'create', desc: '创建补考' },
  { action: 'read', desc: '查看列表/详情' },
  { action: 'review', desc: '补考回看' },
  { action: 'update_fee', desc: '登记缴费' },
  { action: 'book', desc: '预约补考' },
  { action: 'complete', desc: '完成补考' },
  { action: 'cancel', desc: '取消补考' },
  { action: 'delete', desc: '删除补考' },
];

console.log('--- 补考模块权限矩阵 ---');
console.log(`动作            ${roles.map(r => roleNames[r].padEnd(6)).join(' | ')}`);
console.log('-'.repeat(60));
makeupActions.forEach(({ action, desc }) => {
  const results = roles.map(r => hasPermission(r, 'makeup_exams', action) ? '✅' : '❌');
  console.log(`${desc.padEnd(14)} ${results.join('      | ')}`);
});

console.log('\n--- 考试预约模块 book_session 权限 ---');
['exam_specialist', 'admin'].forEach(r => {
  const ok = hasPermission(r, 'exam_bookings', 'book_session');
  console.log(`${roleNames[r]}: ${ok ? '✅ 有权限' : '❌ 无权限'}`);
});

console.log('\n--- 服务层校验 vs 权限表 对齐检查 ---');
const serviceChecks = [
  { module: 'makeup_exams', action: 'create', desc: '创建补考' },
  { module: 'makeup_exams', action: 'read', desc: '查看补考' },
  { module: 'makeup_exams', action: 'review', desc: '补考回看' },
  { module: 'makeup_exams', action: 'update_fee', desc: '登记缴费' },
  { module: 'makeup_exams', action: 'book', desc: '预约补考' },
  { module: 'makeup_exams', action: 'complete', desc: '完成补考' },
  { module: 'makeup_exams', action: 'cancel', desc: '取消补考' },
  { module: 'exam_bookings', action: 'book_session', desc: '预约考试场次' },
];

let allAligned = true;
serviceChecks.forEach(({ module, action, desc }) => {
  const hasAdmin = hasPermission('admin', module, action);
  const hasExam = hasPermission('exam_specialist', module, action);
  const status = hasAdmin ? '✅' : '❌';
  if (!hasAdmin) allAligned = false;
  console.log(`${status} ${desc} (${module}.${action}): 管理员=${hasAdmin ? '有' : '无'}, 考试专员=${hasExam ? '有' : '无'}`);
});

console.log(`\n服务层与权限表对齐: ${allAligned ? '✅ 全部对齐' : '❌ 存在断点'}`);

console.log('\n========================================');
console.log('  实际接口权限验证');
console.log('========================================\n');

const {
  createMakeupExam,
  listMakeupExams,
  getMakeupExamDetail,
  getMakeupReviewData,
  recordMakeupPayment,
  bookMakeupExam,
  completeMakeupExam,
  cancelMakeupExam,
} = require('../src/services/makeupExamService');

const users = {
  admission: db.prepare("SELECT * FROM users WHERE role = 'admission_consultant' LIMIT 1").get(),
  coach: db.prepare("SELECT * FROM users WHERE role = 'coach' LIMIT 1").get(),
  exam: db.prepare("SELECT * FROM users WHERE role = 'exam_specialist' LIMIT 1").get(),
  admin: db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get(),
};

const testMakeupId = db.prepare("SELECT id FROM makeup_exams LIMIT 1").get().id;

const tests = [
  { fn: () => listMakeupExams({}, users.admission.id), name: '招生顾问查看列表', expect: true },
  { fn: () => listMakeupExams({}, users.exam.id), name: '考试专员查看列表', expect: true },
  { fn: () => listMakeupExams({}, users.admin.id), name: '管理员查看列表', expect: true },
  { fn: () => listMakeupExams({}, users.coach.id), name: '教练查看列表', expect: false },

  { fn: () => getMakeupExamDetail(testMakeupId, users.admission.id), name: '招生顾问查看详情', expect: true },
  { fn: () => getMakeupExamDetail(testMakeupId, users.exam.id), name: '考试专员查看详情', expect: true },
  { fn: () => getMakeupExamDetail(testMakeupId, users.admin.id), name: '管理员查看详情', expect: true },

  { fn: () => getMakeupReviewData(testMakeupId, users.admission.id), name: '招生顾问回看', expect: true },
  { fn: () => getMakeupReviewData(testMakeupId, users.exam.id), name: '考试专员回看', expect: true },
  { fn: () => getMakeupReviewData(testMakeupId, users.admin.id), name: '管理员回看', expect: true },
  { fn: () => getMakeupReviewData(testMakeupId, users.coach.id), name: '教练回看', expect: false },

  { fn: () => {
    const pendingPayment = db.prepare("SELECT id FROM makeup_exams WHERE status = 'pending_payment' LIMIT 1").get();
    return pendingPayment ? recordMakeupPayment(pendingPayment.id, { amount: 100 }, users.admin.id) : true;
  }, name: '管理员登记缴费', expect: true },

  { fn: () => {
    const pendingBooking = db.prepare("SELECT id FROM makeup_exams WHERE status = 'pending_booking' LIMIT 1").get();
    if (!pendingBooking) return true;
    const session = db.prepare("SELECT id FROM exam_sessions WHERE subject = (SELECT subject FROM makeup_exams WHERE id = ?) AND status IN ('open', 'full') LIMIT 1").get(pendingBooking.id);
    return session ? bookMakeupExam(pendingBooking.id, { exam_session_id: session.id }, users.admin.id) : true;
  }, name: '管理员预约补考', expect: true },
];

let passCount = 0;
tests.forEach(({ fn, name, expect }) => {
  try {
    fn();
    const ok = expect === true;
    console.log(`${ok ? '✅' : '❌'} ${name}: ${ok ? '通过（有权限）' : '未拒绝（异常）'}`);
    if (ok) passCount++;
  } catch (e) {
    const ok = expect === false;
    console.log(`${ok ? '✅' : '❌'} ${name}: ${ok ? `正确拒绝 [${e.code}]` : `异常 [${e.code}]: ${e.message}`}`);
    if (ok) passCount++;
  }
});

console.log(`\n接口权限测试: ${passCount}/${tests.length} 通过`);

console.log('\n========================================');
console.log('  完整业务流程（管理员）兼容性测试');
console.log('========================================\n');

try {
  const pendingPayment = db.prepare(`
    SELECT m.*, s.name as student_name
    FROM makeup_exams m
    JOIN students s ON m.student_id = s.id
    WHERE m.status = 'pending_payment'
    LIMIT 1
  `).get();
  
  console.log(`测试补考: ${pendingPayment.student_name} 科目${pendingPayment.subject}`);

  const r1 = recordMakeupPayment(pendingPayment.id, { amount: pendingPayment.makeup_fee, payment_method: '现金' }, users.admin.id);
  console.log(`✅ 管理员缴费: 状态=${r1.status_name}, 已缴=${r1.fee_paid}`);

  const session = db.prepare(`
    SELECT id FROM exam_sessions
    WHERE subject = ? AND status IN ('open', 'full')
    LIMIT 1
  `).get(pendingPayment.subject);

  const existingBooking = db.prepare(`
    SELECT id FROM exam_bookings
    WHERE student_id = ? AND subject = ? AND status NOT IN ('passed', 'failed', 'cancelled', 'rejected', 'no_show')
  `).get(pendingPayment.student_id, pendingPayment.subject);
  if (existingBooking) {
    const { cancelBooking } = require('../src/services/examBookingService');
    cancelBooking(existingBooking.id, { reason: '管理员权限测试' }, users.admin.id);
  }

  const r2 = bookMakeupExam(pendingPayment.id, { exam_session_id: session.id }, users.admin.id);
  console.log(`✅ 管理员预约: 状态=${r2.status_name}, 关联预约=${r2.new_booking_status}`);

  const { recordExamResult } = require('../src/services/examBookingService');
  recordExamResult(r2.new_booking_id, { result: 'passed', score: 90 }, users.admin.id);

  const r3 = completeMakeupExam(pendingPayment.id, users.admin.id);
  console.log(`✅ 管理员完成: 状态=${r3.status_name}, 费用=${r3.feeRecord.status}`);

  console.log('\n✅ 管理员完整补考流程兼容测试通过');
} catch (e) {
  console.log(`\n❌ 管理员流程失败: [${e.code}] ${e.message}`);
  console.log(e.stack);
}

console.log('\n========================================');
console.log('  测试完成');
console.log('========================================');
