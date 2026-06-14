const { initDB, getDB } = require('../src/db');
const { listExamBookings } = require('../src/services/examBookingService');
const { listMakeupExams } = require('../src/services/makeupExamService');
const { approveBooking, bookExamSession, recordExamResult } = require('../src/services/examBookingService');
const { recordMakeupPayment, bookMakeupExam } = require('../src/services/makeupExamService');

initDB();

let pass = 0;
let fail = 0;

function check(desc, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${desc}`);
    pass++;
  } else {
    console.log(`  ❌ ${desc} ${detail}`);
    fail++;
  }
}

console.log('========================================');
console.log('  待处理摘要能力测试');
console.log('========================================\n');

const dbi = getDB();
const users = dbi.prepare('SELECT * FROM users').all();
const admin = users.find(u => u.role === 'admin');
const examSp = users.find(u => u.role === 'exam_specialist');
const ac = users.find(u => u.role === 'admission_consultant');

console.log('--- 1. 考试预约列表待处理摘要 ---\n');

const allBookings = listExamBookings({ limit: 100 });
check('返回 total', typeof allBookings.total === 'number');
check('返回 list 数组', Array.isArray(allBookings.list));

if (allBookings.list.length > 0) {
  const b = allBookings.list[0];
  check('包含 priority 字段', 'priority' in b);
  check('priority 合法值', ['low', 'normal', 'high', 'urgent'].includes(b.priority));
  check('包含 stuck_reason 字段', 'stuck_reason' in b);
  check('包含 needs_attention 字段', 'needs_attention' in b);
  check('包含 last_operator_name 字段', 'last_operator_name' in b);
  check('包含 last_action_time 字段', 'last_action_time' in b);
  console.log(`    示例: priority=${b.priority}, needs_attention=${b.needs_attention}, last_operator=${b.last_operator_name || 'null'}, stuck=${b.stuck_reason || '无'}`);
}

const pendingBookings = listExamBookings({ status: 'pending', limit: 100 });
if (pendingBookings.list.length > 0) {
  const pending = pendingBookings.list[0];
  check('pending 状态优先级为 urgent', pending.priority === 'urgent');
  check('pending 状态 needs_attention 为 true', pending.needs_attention === true);
  console.log(`    待审核预约: priority=${pending.priority}, needs_attention=${pending.needs_attention}`);
} else {
  console.log('  ⚠️  无 pending 状态预约，跳过优先级验证');
}

const attentionBookings = listExamBookings({ needs_attention: true, limit: 100 });
check('needs_attention=true 过滤有效',
  attentionBookings.list.every(b => b.needs_attention === true),
  `返回 ${attentionBookings.list.length} 条`
);
console.log(`    needs_attention=true 返回 ${attentionBookings.list.length} 条`);

if (attentionBookings.list.length > 0 && allBookings.list.length > attentionBookings.list.length) {
  const notAttentionBookings = listExamBookings({ needs_attention: false, limit: 100 });
  check('needs_attention=false 过滤有效',
    notAttentionBookings.list.every(b => b.needs_attention === false),
    `返回 ${notAttentionBookings.list.length} 条`
  );
  console.log(`    needs_attention=false 返回 ${notAttentionBookings.list.length} 条`);
}

console.log('\n--- 2. 补考列表待处理摘要 ---\n');

const allMakeups = listMakeupExams({ limit: 100 }, admin.id);
check('返回 total', typeof allMakeups.total === 'number');
check('返回 list 数组', Array.isArray(allMakeups.list));

if (allMakeups.list.length > 0) {
  const m = allMakeups.list[0];
  check('包含 priority 字段', 'priority' in m);
  check('priority 合法值', ['low', 'normal', 'high', 'urgent'].includes(m.priority));
  check('包含 stuck_reason 字段', 'stuck_reason' in m);
  check('包含 needs_attention 字段', 'needs_attention' in m);
  check('包含 last_operator_name 字段', 'last_operator_name' in m);
  check('包含 last_action_time 字段', 'last_action_time' in m);
  console.log(`    示例: priority=${m.priority}, needs_attention=${m.needs_attention}, last_operator=${m.last_operator_name || 'null'}, stuck=${m.stuck_reason || '无'}`);
}

const pendingPaymentMakeups = listMakeupExams({ status: 'pending_payment', limit: 100 }, admin.id);
if (pendingPaymentMakeups.list.length > 0) {
  const ppm = pendingPaymentMakeups.list[0];
  check('pending_payment 状态优先级为 high', ppm.priority === 'high');
  check('pending_payment 状态 needs_attention 为 true', ppm.needs_attention === true);
  console.log(`    待缴费补考: priority=${ppm.priority}, needs_attention=${ppm.needs_attention}`);
} else {
  console.log('  ⚠️  无 pending_payment 状态补考，跳过验证');
}

const pendingBookingMakeups = listMakeupExams({ status: 'pending_booking', limit: 100 }, admin.id);
if (pendingBookingMakeups.list.length > 0) {
  const pbm = pendingBookingMakeups.list[0];
  check('pending_booking 状态优先级为 high', pbm.priority === 'high');
  check('pending_booking 状态 needs_attention 为 true', pbm.needs_attention === true);
  console.log(`    待约考补考: priority=${pbm.priority}, needs_attention=${pbm.needs_attention}`);
} else {
  console.log('  ⚠️  无 pending_booking 状态补考，跳过验证');
}

const attentionMakeups = listMakeupExams({ needs_attention: true, limit: 100 }, admin.id);
check('needs_attention=true 过滤有效',
  attentionMakeups.list.every(m => m.needs_attention === true),
  `返回 ${attentionMakeups.list.length} 条`
);
console.log(`    needs_attention=true 返回 ${attentionMakeups.list.length} 条`);

console.log('\n--- 3. 操作后 last_operator_name/last_action_time 更新验证 ---\n');

if (pendingPaymentMakeups.list.length > 0 && ac) {
  const testMakeup = pendingPaymentMakeups.list[0];
  console.log(`  测试补考: ${testMakeup.student_name} 科目${testMakeup.subject}`);
  console.log(`    更新前: last_operator=${testMakeup.last_operator_name || '无'}`);

  const result = recordMakeupPayment(testMakeup.id, { amount: testMakeup.makeup_fee, payment_method: '微信' }, ac.id);
  const updated = listMakeupExams({ limit: 1 }, admin.id).list.find(m => m.id === testMakeup.id)
    || listMakeupExams({ status: 'pending_booking', limit: 100 }, admin.id).list.find(m => m.id === testMakeup.id);

  if (updated) {
    check('缴费后 last_operator_name 更新为招生顾问', updated.last_operator_name === ac.name);
    check('缴费后 last_action_time 已更新', !!updated.last_action_time);
    check('缴费后状态推进到 pending_booking 优先级 high', updated.priority === 'high');
    console.log(`    更新后: last_operator=${updated.last_operator_name}, time=${updated.last_action_time}, priority=${updated.priority}`);
  }
}

console.log('\n========================================');
console.log('  测试完成');
console.log('========================================');
console.log(`通过: ${pass}, 失败: ${fail}`);
if (fail === 0) {
  console.log('✅ 全部通过');
  process.exit(0);
} else {
  console.log('❌ 有失败项');
  process.exit(1);
}
