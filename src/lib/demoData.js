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
  performAction(record1.id, WorkflowActions.MANAGER_FINAL_REVIEW, {
    liabilityConfirmed: {
      liabilityParty: '计量误差',
      liabilityDescription: '差异在±0.3%范围内，属于正常计量误差',
      handlingMeasures: '正常核销，纳入月度损耗统计'
    }
  });
  
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
  performAction(record3.id, WorkflowActions.MANAGER_RETURN_TO_EDIT, { comment: '请补充罐车铅封照片和司机行驶证信息' });
  
  const record4 = createOilIntakeRecord({
    oilType: '98#汽油',
    quantity: 15000,
    tankerNo: '京D11111',
    driverName: '赵师傅',
    sourceDepot: '中石化北京油库',
    deliveryOrderNo: 'CK20240604009',
    tankNo: '4#罐'
  });
  
  performAction(record4.id, WorkflowActions.SUBMIT_FOR_APPROVAL, {});
  performAction(record4.id, WorkflowActions.MANAGER_APPROVE, {});
  
  currentRole.set('cashier');
  performAction(record4.id, WorkflowActions.CASHIER_ENTER, {
    cashierData: {
      actualPrice: 8.52,
      totalAmount: 127800,
      invoiceNo: 'FP20240604011',
      paymentMethod: '银行转账'
    }
  });
  
  currentRole.set('measurer');
  performAction(record4.id, WorkflowActions.MEASURER_VERIFY, {
    measurerData: {
      beforeLevel: 40,
      afterLevel: 78,
      actualVolume: 14850,
      temperature: 21,
      density: 0.748,
      difference: -150,
      differenceRate: -1.0,
      verificationComment: '差异略大，但在可接受范围内'
    }
  });
  
  currentRole.set('manager');
  performAction(record4.id, WorkflowActions.MANAGER_RETURN_TO_MEASURER, { comment: '请提供更详细的检尺记录照片，差异原因需要说明' });
  
  currentRole.set('measurer');
  performAction(record4.id, WorkflowActions.SUPPLEMENT_INFO, {
    measurerData: {
      beforeLevel: 40,
      afterLevel: 78,
      actualVolume: 14850,
      temperature: 21,
      density: 0.748,
      difference: -150,
      differenceRate: -1.0,
      verificationComment: '已补充检尺记录照片3张，差异原因主要是由于油罐底部有少量水杂，实际油品体积略小于计算值。'
    },
    supplementaryData: {
      supplementaryContent: '已补充检尺记录照片3张，差异原因主要是由于油罐底部有少量水杂，实际油品体积略小于计算值。'
    },
    comment: '已补充检尺记录'
  });
  
  currentRole.set('manager');
}
