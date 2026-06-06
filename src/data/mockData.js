export const statusTypes = {
  NORMAL: 'normal',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  DISPUTE: 'dispute'
}

export const statusLabels = {
  normal: '正常推进',
  returned: '退回补充',
  overdue: '逾期未处理',
  dispute: '责任争议'
}

export const statusColors = {
  normal: '#10b981',
  returned: '#f59e0b',
  overdue: '#ef4444',
  dispute: '#8b5cf6'
}

export const exchangeRates = {
  '2026-06-06': { USD: 7.31, EUR: 7.92, GBP: 9.20, JPY: 0.0492 }
}

export const orders = [
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
  },
  {
    id: 'ORD-2026-0002',
    platform: 'Amazon-EU',
    country: 'DE',
    currency: 'EUR',
    orderAmount: 899.5,
    orderDate: '2026-05-18',
    settlementDate: '2026-06-03',
    orderRate: 7.85,
    settlementRate: 7.92,
    rateDiff: 0.07,
    diffAmount: 62.97,
    productCost: 2800,
    shippingCost: 420,
    platformFee: 134.93,
    customsDeclaration: '待补充',
    warehouse: 'DE-02',
    stockStatus: '已签收',
    status: 'returned',
    handler: '王芳芳',
    department: '欧洲运营组',
    logs: [
      { time: '2026-05-18 15:42', action: '订单创建', operator: '系统', remark: '平台同步订单' }
    ],
    exceptions: [
      { type: '报关资料', desc: '缺少原产地证明文件', createdAt: '2026-05-25', resolved: false }
    ]
  },
  {
    id: 'ORD-2026-0003',
    platform: 'Shopify-UK',
    country: 'UK',
    currency: 'GBP',
    orderAmount: 649.99,
    orderDate: '2026-05-10',
    settlementDate: '2026-05-28',
    orderRate: 9.12,
    settlementRate: 9.15,
    rateDiff: 0.03,
    diffAmount: 19.5,
    productCost: 2100,
    shippingCost: 290,
    platformFee: 97.5,
    customsDeclaration: '已完成',
    warehouse: 'UK-01',
    stockStatus: '退件中',
    status: 'overdue',
    handler: '赵伟',
    department: '欧洲运营组',
    logs: [
      { time: '2026-05-10 08:30', action: '订单创建', operator: '系统', remark: '独立站订单' }
    ],
    exceptions: [
      { type: '退件处理', desc: '退件原因未说明，已逾期5天', createdAt: '2026-05-20', resolved: false }
    ]
  },
  {
    id: 'ORD-2026-0004',
    platform: 'Amazon-JP',
    country: 'JP',
    currency: 'JPY',
    orderAmount: 258000,
    orderDate: '2026-05-05',
    settlementDate: '2026-05-22',
    orderRate: 0.048,
    settlementRate: 0.0492,
    rateDiff: 0.0012,
    diffAmount: 309.6,
    productCost: 5800,
    shippingCost: 950,
    platformFee: 387,
    customsDeclaration: '已完成',
    warehouse: 'JP-01',
    stockStatus: '超卖',
    status: 'dispute',
    handler: '孙丽',
    department: '亚太运营组',
    logs: [
      { time: '2026-05-05 12:00', action: '订单创建', operator: '系统', remark: '平台同步订单' }
    ],
    exceptions: [
      { type: '库存超卖', desc: '海外仓系统库存与平台不同步', createdAt: '2026-05-08', resolved: false },
      { type: '责任划分', desc: '运营与技术对超卖原因存争议', createdAt: '2026-05-15', resolved: false }
    ]
  }
]

export function calculateProfit(order) {
  if (!order.settlementRate) return null
  const revenueRMB = order.orderAmount * order.settlementRate
  const totalCost = order.productCost + order.shippingCost + order.platformFee
  const profit = revenueRMB - totalCost
  const profitRate = (profit / revenueRMB * 100).toFixed(2)
  return {
    revenueRMB: revenueRMB.toFixed(2),
    totalCost: totalCost.toFixed(2),
    profit: profit.toFixed(2),
    profitRate: profitRate
  }
}
