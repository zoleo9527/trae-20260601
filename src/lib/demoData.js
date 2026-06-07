import { get } from 'svelte/store';
import { oilIntakeRecords, currentRole } from '$lib/stores';
import { createOilIntakeRecord, performAction, WorkflowActions } from '$lib/workflow';

export function initDemoData() {
  if (get(oilIntakeRecords).length > 0) return;
  
  currentRole.set('manager');
  
  const record1 = createOilIntakeRecord({
    oilType: '92#汽油',
    quantity: 25000,
    tankerNo: '京A88888',
    driverName: '张师傅',
    sourceDepot: '中石化北京油库',
    deliveryOrderNo: 'CK20240601001',
    tankNo: '1#罐'
  });
  
  performAction(record1.id, WorkflowActions.SUBMIT_FOR_APPROVAL, {});
  performAction(record1.id, WorkflowActions.MANAGER_APPROVE, {});
  
  currentRole.set('cashier');
  performAction(record1.id, WorkflowActions.CASHIER_ENTER, {
    cashierData: {
      actualPrice: 7.45,
      totalAmount: 186250,
      invoiceNo: 'FP20240601001',
      paymentMethod: '银行转账'
    }
  });
  
  currentRole.set('measurer');
  performAction(record1.id, WorkflowActions.MEASURER_VERIFY, {
    measurerData: {
      beforeLevel: 35,
      afterLevel: 82,
      actualVolume: 24920,
      temperature: 22.5,
      density: 0.745,
      difference: -80,
      differenceRate: -0.32,
      verificationComment: '差异在合理范围内，建议通过'
    }
  });
  
  currentRole.set('manager');
  performAction(record1.id, WorkflowActions.MANAGER_FINAL_REVIEW, {});
  
  const record2 = createOilIntakeRecord({
    oilType: '0#柴油',
    quantity: 30000,
    tankerNo: '京B66666',
    driverName: '李师傅',
    sourceDepot: '中石油顺义油库',
    deliveryOrderNo: 'CK20240602003',
    tankNo: '3#罐'
  });
  
  performAction(record2.id, WorkflowActions.SUBMIT_FOR_APPROVAL, {});
  performAction(record2.id, WorkflowActions.MANAGER_APPROVE, {});
  
  currentRole.set('cashier');
  performAction(record2.id, WorkflowActions.CASHIER_ENTER, {
    cashierData: {
      actualPrice: 7.12,
      totalAmount: 213600,
      invoiceNo: 'FP20240602005',
      paymentMethod: '月结'
    }
  });
  
  currentRole.set('measurer');
  performAction(record2.id, WorkflowActions.MEASURER_FLAG_DISPUTE, {
    measurerData: {
      beforeLevel: 28,
      afterLevel: 70,
      actualVolume: 29100,
      temperature: 20,
      density: 0.835,
      difference: -900,
      differenceRate: -3.0,
      verificationComment: '差异超过正常范围，怀疑运输途中有问题，需站长调查'
    }
  });
  
  const record3 = createOilIntakeRecord({
    oilType: '95#汽油',
    quantity: 20000,
    tankerNo: '京C99999',
    driverName: '王师傅',
    sourceDepot: '中石化亦庄油库',
    deliveryOrderNo: 'CK20240603007',
    tankNo: '2#罐'
  });
  
  performAction(record3.id, WorkflowActions.SUBMIT_FOR_APPROVAL, {});
  performAction(record3.id, WorkflowActions.MANAGER_RETURN, { comment: '请补充罐车铅封照片' });
  
  const record4 = createOilIntakeRecord({
    oilType: '98#汽油',
    quantity: 15000,
    tankerNo: '京D11111',
    driverName: '赵师傅',
    sourceDepot: '中石化北京油库',
    deliveryOrderNo: 'CK20240604009',
    tankNo: '4#罐'
  });
  
  currentRole.set('manager');
}
