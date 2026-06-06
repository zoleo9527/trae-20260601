const fs = require('fs');
const orders = JSON.stringify([
  {
    id: 'ORD-2026-0001',
    platform: 'Amazon-US',
    country: 'US',
    currency: 'USD',
    orderAmount: 1299.99,
    orderDate: '2026-05-20',
    settlementDate: '2026-06-05',
    orderRate: 7.25,
    settlementRate: 7.31,
    rateDiff: 0.06,
    diffAmount: 77.99,
    productCost: 4200,
    shippingCost: 380,
    platformFee: 156,
    customsDeclaration: '已完成',
    warehouse: 'LA-01',
    stockStatus: '已出库',
    status: 'normal',
    handler: '张小明',
    department: '北美运营组',
    logs: [
      { time: '2026-05-20 10:23', action: '订单创建', operator: '系统', remark: '平台同步订单' },
      { time: '2026-06-05 16:00', action: '结算到账', operator: '财务系统', remark: '汇率差异需确认' }
    ],
    exceptions: []
  }
], null, 2);
fs.writeFileSync('test-orders.json', orders);
console.log('done');
