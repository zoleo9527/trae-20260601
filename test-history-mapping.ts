
import { initDatabase, db } from './api/db/database.js';

initDatabase();

const promotion = db.getPromotionById('p1');
console.log('=== Promotion p1 operationHistory ===');
if (promotion && (promotion as any).operationHistory) {
  (promotion as any).operationHistory.forEach((h: any, i: number) => {
    console.log(`\nHistory item ${i + 1}:`);
    console.log('  keys:', Object.keys(h));
    console.log('  userName:', h.userName);
    console.log('  createdAt:', h.createdAt);
    console.log('  rejectReason:', h.rejectReason);
    console.log('  action:', h.action);
    console.log('  description:', h.description);
  });
}

const inspection = db.getInspectionById('i1');
console.log('\n\n=== Inspection i1 operationHistory ===');
if (inspection && (inspection as any).operationHistory) {
  (inspection as any).operationHistory.forEach((h: any, i: number) => {
    console.log(`\nHistory item ${i + 1}:`);
    console.log('  keys:', Object.keys(h));
    console.log('  userName:', h.userName);
    console.log('  createdAt:', h.createdAt);
    console.log('  rejectReason:', h.rejectReason);
    console.log('  action:', h.action);
    console.log('  description:', h.description);
  });
}

console.log('\n\n=== Test completed ===');
