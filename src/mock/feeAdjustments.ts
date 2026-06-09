import type { FeeAdjustment } from '@/types'

export const feeAdjustments: FeeAdjustment[] = [
  {
    id: 'f1',
    orderId: 'o2',
    adjustAmount: -1280,
    adjustReason: '器械生锈属仓库存储问题，全额退款并补偿运费',
    evidenceSummary: '现场拍照3张+客户聊天截图2张，确认收货时已有锈迹',
    screenshotThumbnails: ['img1.jpg', 'img2.jpg'],
    status: 'approved',
    approvedBy: '张敏',
    createdAt: '2026-06-05 14:00',
  },
  {
    id: 'f2',
    orderId: 'o3',
    adjustAmount: -450,
    adjustReason: '色号偏差属供应商质检问题，部分换货+差价补偿',
    evidenceSummary: '色卡对比照4张，供应商确认色号有误并同意补偿',
    screenshotThumbnails: ['img3.jpg', 'img4.jpg', 'img5.jpg'],
    status: 'pending',
    approvedBy: '',
    createdAt: '2026-06-06 11:00',
  },
  {
    id: 'f3',
    orderId: 'o4',
    adjustAmount: -890,
    adjustReason: '发出过期产品属仓库出库未检查，全额退款',
    evidenceSummary: '生产日期照片+有效期标签特写，确认为过期发出',
    screenshotThumbnails: ['img6.jpg'],
    status: 'approved',
    approvedBy: '张敏',
    createdAt: '2026-06-03 15:00',
  },
]
