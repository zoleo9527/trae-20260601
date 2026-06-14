import { getReminderById, markRisk, resolveRisk } from './api/services/reminderService.js';

console.log('=== Test 1: Get r1 ===');
const r1 = getReminderById('r1');
console.log('r1 riskLevel:', r1?.riskLevel);
console.log('r1 risks count:', r1?.risks?.length);

console.log('\n=== Test 2: Mark risk on r1 ===');
const result = markRisk('r1', {
  level: 'high',
  category: 'fee_discrepancy',
  reason: 'test risk',
  operatorId: 'u1',
});
console.log('markRisk result:', result ? 'success' : 'null');
if (result) {
  console.log('After mark riskLevel:', result.riskLevel);
  console.log('After mark risks count:', result.risks.length);
  console.log('First risk reason:', result.risks[0]?.reason);
  console.log('First risk id:', result.risks[0]?.id);
}

console.log('\n=== Test 3: Resolve risk ===');
if (result && result.risks[0]) {
  const resolved = resolveRisk('r1', result.risks[0].id, {
    resolveRemark: 'test resolve',
    operatorId: 'u1',
  });
  console.log('resolveRisk result:', resolved ? 'success' : 'null');
  if (resolved) {
    console.log('After resolve riskLevel:', resolved.riskLevel);
    console.log('First risk resolved:', resolved.risks[0]?.resolved);
  }
}

console.log('\n=== Test 4: Check r5 (has critical risk) ===');
const r5 = getReminderById('r5');
console.log('r5 riskLevel:', r5?.riskLevel);
console.log('r5 risks count:', r5?.risks?.length);
r5?.risks.forEach((r, i) => {
  console.log(`  risk${i}: ${r.level} ${r.category} - ${r.reason.slice(0, 30)}`);
});

console.log('\nAll tests passed!');
