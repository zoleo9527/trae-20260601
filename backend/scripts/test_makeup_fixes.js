const { initDB, getDB } = require('../src/db');
initDB();
const db = getDB();

const { recordMakeupPayment, bookMakeupExam, cancelMakeupExam, completeMakeupExam } = require('../src/services/makeupExamService');
const { getMakeupFeeBySubject } = require('../src/services/examBookingService');

console.log('========================================');
console.log('  补考链路修复验证测试 (Node.js)');
console.log('========================================\n');

const admissionConsultant = db.prepare("SELECT * FROM users WHERE role = 'admission_consultant' LIMIT 1").get();
const examSpecialist = db.prepare("SELECT * FROM users WHERE role = 'exam_specialist' LIMIT 1").get();
console.log(`测试用户: ${admissionConsultant.name} (${admissionConsultant.role}), ${examSpecialist.name} (${examSpecialist.role})\n`);

console.log('========================================');
console.log('  修复1: 登记补考费按实收金额更新');
console.log('========================================\n');

const makeupPendingPayment = db.prepare(`
  SELECT m.*, s.name as student_name
  FROM makeup_exams m
  JOIN students s ON m.student_id = s.id
  WHERE m.status = 'pending_payment'
  LIMIT 1
`).get();
console.log(`测试补考: ${makeupPendingPayment.student_name} 科目${makeupPendingPayment.subject}，补考费 ¥${makeupPendingPayment.makeup_fee}`);

console.log('\n--- 1.1 部分缴费(50/100) - 不应推进到待约考 ---');
const result1 = recordMakeupPayment(makeupPendingPayment.id, { amount: 50, payment_method: '微信' }, admissionConsultant.id);
console.log(`  缴费后状态: ${result1.status_name} (期望: 待缴费)`);
console.log(`  是否已缴清: ${result1.fee_paid} (期望: false)`);
console.log(`  费用状态: ${result1.feeRecord.status} (期望: partial)`);
console.log(`  已缴金额: ¥${result1.feeRecord.paid_amount}/¥${result1.feeRecord.amount}`);
const pass1_1 = result1.status === 'pending_payment' && result1.fee_paid === false && result1.feeRecord.status === 'partial';
console.log(`  验证结果: ${pass1_1 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n--- 1.2 缴清剩余费用(50/100) - 应推进到待约考 ---');
const result1_2 = recordMakeupPayment(makeupPendingPayment.id, { amount: 50, payment_method: '微信' }, admissionConsultant.id);
console.log(`  缴费后状态: ${result1_2.status_name} (期望: 待约考)`);
console.log(`  是否已缴清: ${result1_2.fee_paid} (期望: true)`);
console.log(`  费用状态: ${result1_2.feeRecord.status} (期望: paid)`);
console.log(`  已缴金额: ¥${result1_2.feeRecord.paid_amount}/¥${result1_2.feeRecord.amount}`);
const pass1_2 = result1_2.status === 'pending_booking' && result1_2.fee_paid === true && result1_2.feeRecord.status === 'paid';
console.log(`  验证结果: ${pass1_2 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n--- 1.3 验证时间线回写 ---');
console.log(`  时间线记录数: ${result1_2.timeline.length}`);
result1_2.timeline.forEach(t => {
  console.log(`    ${t.created_at} - ${t.operator_name}: ${t.detail}`);
});
const pass1_3 = result1_2.timeline.length >= 2;
console.log(`  验证结果: ${pass1_3 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n========================================');
console.log('  修复2: 预约补考同步推进状态和名额');
console.log('========================================\n');

const examSession = db.prepare(`
  SELECT * FROM exam_sessions WHERE subject = ? AND status IN ('open', 'full') LIMIT 1
`).get(makeupPendingPayment.subject);

const bookedCountBefore = examSession.booked_count;
console.log(`测试场次: ${examSession.exam_date} ${examSession.exam_time}，当前预约: ${bookedCountBefore}/${examSession.total_quota}`);

console.log('\n--- 2.1 预约补考 ---');
const result2 = bookMakeupExam(makeupPendingPayment.id, { exam_session_id: examSession.id }, examSpecialist.id);
console.log(`  补考状态: ${result2.status_name} (期望: 已约考)`);
console.log(`  关联预约ID: ${result2.new_booking_id}`);
console.log(`  关联预约状态: ${result2.new_booking_status} (期望: booked)`);
const pass2_1 = result2.status === 'booked' && result2.new_booking_status === 'booked';
console.log(`  验证结果: ${pass2_1 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n--- 2.2 验证场次名额已扣减 ---');
const sessionAfter = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(examSession.id);
console.log(`  预约后名额: ${sessionAfter.booked_count}/${sessionAfter.total_quota} (期望: ${bookedCountBefore + 1}/${sessionAfter.total_quota})`);
const pass2_2 = sessionAfter.booked_count === bookedCountBefore + 1;
console.log(`  验证结果: ${pass2_2 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n========================================');
console.log('  修复3: 完成/取消补考状态同步');
console.log('========================================\n');

console.log('--- 3.1 录入补考成绩（通过） ---');
const { recordExamResult } = require('../src/services/examBookingService');
const result3_1 = recordExamResult(result2.new_booking_id, { result: 'passed', score: 95 }, examSpecialist.id);
console.log(`  成绩录入: ${result3_1.status_name}，分数: ${result3_1.exam_score}`);

console.log('\n--- 3.2 完成补考（考试专员权限验证） ---');
const result3_2 = completeMakeupExam(makeupPendingPayment.id, examSpecialist.id);
console.log(`  补考状态: ${result3_2.status_name} (期望: 已完成)`);
console.log(`  费用状态: ${result3_2.feeRecord.status} (期望: paid)`);
console.log(`  关联预约状态: ${result3_2.new_booking_status} (期望: passed)`);
const pass3_2 = result3_2.status === 'completed' && result3_2.feeRecord.status === 'paid' && result3_2.new_booking_status === 'passed';
console.log(`  验证结果: ${pass3_2 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n--- 3.3 验证补考回看状态一致 ---');
const { getMakeupReviewData } = require('../src/services/makeupExamService');
const review = getMakeupReviewData(makeupPendingPayment.id);
console.log(`  费用状态一致: ${review.makeup.fee_paid === (review.makeup.feeRecord.status === 'paid')}`);
console.log(`  约考状态一致: ${review.makeup.status === 'completed' && review.makeup.new_booking_status === 'passed'}`);
console.log(`  时间线记录数: ${review.makeup.timeline.length}`);
console.log('  --- 完整时间线 ---');
review.makeup.timeline.forEach(t => {
  console.log(`    ${t.created_at} | ${t.operator_name}(${t.operator_role}) | ${t.action}`);
  console.log(`      ${t.detail}`);
});
const pass3_3 = review.makeup.timeline.length >= 4;
console.log(`  验证结果: ${pass3_3 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n--- 3.4 测试取消补考（释放名额） ---');
const makeupPendingBooking = db.prepare(`
  SELECT m.*, s.name as student_name
  FROM makeup_exams m
  JOIN students s ON m.student_id = s.id
  WHERE m.status = 'pending_booking'
  LIMIT 1
`).get();

const existingBooking = db.prepare(`
  SELECT id FROM exam_bookings
  WHERE student_id = ? AND subject = ? AND status NOT IN ('passed', 'failed', 'cancelled', 'rejected', 'no_show')
`).get(makeupPendingBooking.student_id, makeupPendingBooking.subject);
if (existingBooking) {
  console.log(`  先取消该学员已有的科目${makeupPendingBooking.subject}考试预约`);
  const { cancelBooking } = require('../src/services/examBookingService');
  cancelBooking(existingBooking.id, { reason: '测试补考预约' }, examSpecialist.id);
}

const sessionForCancel = db.prepare(`
  SELECT * FROM exam_sessions WHERE subject = ? AND status IN ('open', 'full') LIMIT 1
`).get(makeupPendingBooking.subject);
const countBeforeCancel = sessionForCancel.booked_count;
console.log(`\n  测试补考: ${makeupPendingBooking.student_name} 科目${makeupPendingBooking.subject}`);
console.log(`  测试场次: ${sessionForCancel.exam_date}，当前名额: ${countBeforeCancel}/${sessionForCancel.total_quota}`);

const bookedForCancel = bookMakeupExam(makeupPendingBooking.id, { exam_session_id: sessionForCancel.id }, examSpecialist.id);
const sessionAfterBook = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(sessionForCancel.id);
console.log(`  预约后名额: ${sessionAfterBook.booked_count}/${sessionAfterBook.total_quota}`);

const cancelledResult = cancelMakeupExam(makeupPendingBooking.id, { reason: '测试取消' }, examSpecialist.id);
const sessionAfterCancel = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(sessionForCancel.id);
console.log(`  取消后名额: ${sessionAfterCancel.booked_count}/${sessionAfterCancel.total_quota} (期望: ${countBeforeCancel}/${sessionAfterCancel.total_quota})`);
console.log(`  补考状态: ${cancelledResult.status_name} (期望: 已取消)`);
console.log(`  关联预约状态: ${cancelledResult.new_booking_status || 'None'}`);
const pass3_4 = sessionAfterCancel.booked_count === countBeforeCancel && cancelledResult.status === 'cancelled';
console.log(`  验证结果: ${pass3_4 ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n--- 3.5 权限控制测试 ---');
let pass3_5 = true;
try {
  completeMakeupExam(makeupPendingPayment.id, admissionConsultant.id);
  console.log('  ❌ 招生顾问完成补考未被拒绝');
  pass3_5 = false;
} catch (e) {
  console.log(`  ✅ 招生顾问完成补考正确拒绝: [${e.code}] ${e.message}`);
}

try {
  cancelMakeupExam(makeupPendingBooking.id, { reason: '测试' }, admissionConsultant.id);
  console.log('  ❌ 招生顾问取消补考未被拒绝');
  pass3_5 = false;
} catch (e) {
  console.log(`  ✅ 招生顾问取消补考正确拒绝: [${e.code}] ${e.message}`);
}

console.log('\n========================================');
console.log('  测试结果汇总');
console.log('========================================\n');
const allPassed = pass1_1 && pass1_2 && pass1_3 && pass2_1 && pass2_2 && pass3_2 && pass3_3 && pass3_4 && pass3_5;
console.log(`1.1 部分缴费不推进状态: ${pass1_1 ? '✅' : '❌'}`);
console.log(`1.2 缴清后推进状态: ${pass1_2 ? '✅' : '❌'}`);
console.log(`1.3 时间线回写: ${pass1_3 ? '✅' : '❌'}`);
console.log(`2.1 预约补考状态正确: ${pass2_1 ? '✅' : '❌'}`);
console.log(`2.2 场次名额扣减: ${pass2_2 ? '✅' : '❌'}`);
console.log(`3.2 完成补考状态同步: ${pass3_2 ? '✅' : '❌'}`);
console.log(`3.3 回看状态一致: ${pass3_3 ? '✅' : '❌'}`);
console.log(`3.4 取消释放名额: ${pass3_4 ? '✅' : '❌'}`);
console.log(`3.5 权限控制: ${pass3_5 ? '✅' : '❌'}`);
console.log(`\n总体结果: ${allPassed ? '✅ 全部通过' : '❌ 存在失败'}`);
