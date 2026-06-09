import type { TimelineEvent } from '@/types'

export const timeline: TimelineEvent[] = [
  { id: 't1', orderId: 'o1', action: '创建退换申请', operator: '王芳', role: 'sales_clerk', remark: '客户反映批次号不一致', timestamp: '2026-06-07 09:15' },
  { id: 't2', orderId: 'o1', action: '补充备注', operator: '王芳', role: 'sales_clerk', remark: '客户反映批次号与下单时不一致，要求换货', timestamp: '2026-06-07 09:30' },

  { id: 't3', orderId: 'o2', action: '创建退换申请', operator: '王芳', role: 'sales_clerk', remark: '器械生锈，客户要求退货', timestamp: '2026-06-05 10:00' },
  { id: 't4', orderId: 'o2', action: '审核通过', operator: '张敏', role: 'after_sales', remark: '确认为仓库存储不当', timestamp: '2026-06-05 11:00' },
  { id: 't5', orderId: 'o2', action: '发起费用调整', operator: '张敏', role: 'after_sales', remark: '全额退款+运费补偿', timestamp: '2026-06-05 14:00' },
  { id: 't6', orderId: 'o2', action: '待入库确认', operator: '李强', role: 'warehouse', remark: '已安排退回入库，等待实物到仓', timestamp: '2026-06-05 16:00' },

  { id: 't7', orderId: 'o3', action: '创建退换申请', operator: '王芳', role: 'sales_clerk', remark: '色号偏差，要求全部换货', timestamp: '2026-06-06 08:30' },
  { id: 't8', orderId: 'o3', action: '补充备注', operator: '王芳', role: 'sales_clerk', remark: '客户要求全部换货并补偿差价', timestamp: '2026-06-06 09:00' },
  { id: 't9', orderId: 'o3', action: '发起费用调整', operator: '张敏', role: 'after_sales', remark: '部分换货+差价补偿', timestamp: '2026-06-06 11:00' },

  { id: 't10', orderId: 'o4', action: '创建退换申请', operator: '王芳', role: 'sales_clerk', remark: '收到过期产品', timestamp: '2026-06-03 09:00' },
  { id: 't11', orderId: 'o4', action: '审核通过', operator: '张敏', role: 'after_sales', remark: '确认为仓库出库未检查', timestamp: '2026-06-03 10:00' },
  { id: 't12', orderId: 'o4', action: '确认入库', operator: '李强', role: 'warehouse', remark: '已入库并复核库存批次', timestamp: '2026-06-03 17:00' },
  { id: 't13', orderId: 'o4', action: '费用调整完成', operator: '张敏', role: 'after_sales', remark: '全额退款已确认', timestamp: '2026-06-04 10:00' },

  { id: 't14', orderId: 'o5', action: '创建退换申请', operator: '王芳', role: 'sales_clerk', remark: '包装破损导致产品变形', timestamp: '2026-06-08 09:00' },
  { id: 't15', orderId: 'o5', action: '审核通过', operator: '张敏', role: 'after_sales', remark: '物流运输损坏，安排换货', timestamp: '2026-06-08 10:30' },

  { id: 't16', orderId: 'o6', action: '创建退换申请', operator: '王芳', role: 'sales_clerk', remark: '功能故障无法修复', timestamp: '2026-06-04 13:00' },
  { id: 't17', orderId: 'o6', action: '补充备注', operator: '王芳', role: 'sales_clerk', remark: '客户报修后确认无法修复，申请退货退款', timestamp: '2026-06-04 14:00' },

  { id: 't18', orderId: 'o7', action: '创建退换申请', operator: '王芳', role: 'sales_clerk', remark: '数量短缺', timestamp: '2026-06-08 14:00' },
  { id: 't19', orderId: 'o7', action: '审核通过', operator: '张敏', role: 'after_sales', remark: '核实出库记录', timestamp: '2026-06-08 15:00' },
  { id: 't20', orderId: 'o7', action: '正在核实', operator: '李强', role: 'warehouse', remark: '正在核实出库记录', timestamp: '2026-06-08 16:00' },
]
