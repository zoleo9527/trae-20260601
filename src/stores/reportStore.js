import { writable, derived } from 'svelte/store'

export const roles = {
  RECEPTION: { id: 'reception', name: '前台导检', color: '#1890ff' },
  DOCTOR: { id: 'doctor', name: '科室医生', color: '#52c41a' },
  AUDITOR: { id: 'auditor', name: '报告审核员', color: '#722ed1' },
  DELIVER: { id: 'deliver', name: '发放登记员', color: '#fa8c16' }
}

export const auditStatus = {
  PENDING_RECEPTION: { id: 'pending_reception', name: '待前台导检', color: '#faad14', handler: 'reception' },
  PENDING_DEPARTMENT: { id: 'pending_department', name: '待科室检查', color: '#faad14', handler: 'doctor' },
  DEPARTMENT_REVIEW: { id: 'department_review', name: '科室医生审核', color: '#1890ff', handler: 'doctor' },
  PRIMARY_AUDIT: { id: 'primary_audit', name: '初审中', color: '#1890ff', handler: 'auditor' },
  SECONDARY_AUDIT: { id: 'secondary_audit', name: '复审中', color: '#722ed1', handler: 'auditor' },
  FINAL_AUDIT: { id: 'final_audit', name: '终审中', color: '#eb2f96', handler: 'auditor' },
  AUDIT_COMPLETE: { id: 'audit_complete', name: '审核完成', color: '#52c41a', handler: null },
  PENDING_DELIVERY: { id: 'pending_delivery', name: '待发放', color: '#fa8c16', handler: 'deliver' },
  DELIVERY_SCHEDULED: { id: 'delivery_scheduled', name: '已预约发放', color: '#13c2c2', handler: 'deliver' },
  DELIVERED: { id: 'delivered', name: '已发放', color: '#52c41a', handler: null },
  EXCEPTION: { id: 'exception', name: '异常', color: '#f5222d', handler: 'auditor' }
}

const initialReports = [
  {
    id: 'RPT20260601001',
    patientName: '张伟',
    patientAge: 45,
    patientGender: '男',
    examType: '年度体检套餐A',
    examDate: '2026-06-01',
    currentStatus: 'primary_audit',
    currentHandler: 'auditor',
    assignee: '李审核员',
    priority: 'high',
    stuckReason: null,
    isStuck: false,
    auditNotes: [
      {
        id: 'n1',
        type: 'department',
        role: 'doctor',
        author: '王医生',
        department: '内科',
        content: '血压偏高，建议复查。血常规指标基本正常。',
        timestamp: '2026-06-01 14:30',
        carryToDelivery: true
      },
      {
        id: 'n2',
        type: 'audit',
        role: 'auditor',
        author: '李审核员',
        content: '内科检查结果已确认，建议在发放时提醒患者注意血压监测。',
        timestamp: '2026-06-01 16:45',
        carryToDelivery: true
      }
    ],
    deliveryRecords: [],
    operationLogs: [
      { time: '2026-06-01 08:00', operator: '张导检', action: '前台登记完成', role: 'reception' },
      { time: '2026-06-01 09:30', operator: '王医生', action: '内科检查完成', role: 'doctor' },
      { time: '2026-06-01 10:15', operator: '刘技师', action: '检验科样本接收', role: 'doctor' },
      { time: '2026-06-01 14:30', operator: '王医生', action: '科室医生审核通过', role: 'doctor' },
      { time: '2026-06-01 16:45', operator: '李审核员', action: '提交初审，待复审', role: 'auditor' }
    ],
    lastModified: '2026-06-01 16:45',
    lastModifier: '李审核员',
    exception: null
  },
  {
    id: 'RPT20260601002',
    patientName: '李娜',
    patientAge: 32,
    patientGender: '女',
    examType: '入职体检套餐',
    examDate: '2026-06-01',
    currentStatus: 'department_review',
    currentHandler: 'doctor',
    assignee: '陈医生',
    priority: 'urgent',
    stuckReason: '检验科结果异常，需医生确认',
    isStuck: true,
    auditNotes: [
      {
        id: 'n1',
        type: 'department',
        role: 'doctor',
        author: '陈医生',
        department: '放射科',
        content: '胸片正常，心肺无异常发现。',
        timestamp: '2026-06-01 11:20',
        carryToDelivery: false
      },
      {
        id: 'n2',
        type: 'exception',
        role: 'auditor',
        author: '系统',
        content: '【检验科预警】谷丙转氨酶（ALT）值85U/L，超出参考范围（0-40U/L），需科室医生确认。',
        timestamp: '2026-06-01 15:10',
        carryToDelivery: true
      }
    ],
    deliveryRecords: [],
    operationLogs: [
      { time: '2026-06-01 07:30', operator: '张导检', action: '前台登记完成', role: 'reception' },
      { time: '2026-06-01 08:45', operator: '陈医生', action: '放射科检查完成', role: 'doctor' },
      { time: '2026-06-01 09:00', operator: '刘技师', action: '检验科样本接收', role: 'doctor' },
      { time: '2026-06-01 15:10', operator: '系统', action: '检验科结果异常，触发预警', role: 'system' }
    ],
    lastModified: '2026-06-01 15:10',
    lastModifier: '系统',
    exception: { type: 'lab_result', level: 'warning', description: '谷丙转氨酶异常，待医生确认' }
  },
  {
    id: 'RPT20260531003',
    patientName: '王强',
    patientAge: 58,
    patientGender: '男',
    examType: '高端深度体检',
    examDate: '2026-05-31',
    currentStatus: 'pending_delivery',
    currentHandler: 'deliver',
    assignee: '赵发放员',
    priority: 'normal',
    stuckReason: null,
    isStuck: false,
    auditNotes: [
      {
        id: 'n1',
        type: 'department',
        role: 'doctor',
        author: '孙医生',
        department: '心内科',
        content: '心电图显示窦性心律，偶发早搏。建议定期复查。',
        timestamp: '2026-05-31 15:00',
        carryToDelivery: true
      },
      {
        id: 'n2',
        type: 'audit',
        role: 'auditor',
        author: '李审核员',
        content: '各项检查结果已复核，建议发放时提醒患者心内科随访。',
        timestamp: '2026-06-01 09:00',
        carryToDelivery: true
      },
      {
        id: 'n3',
        type: 'audit',
        role: 'auditor',
        author: '周主任',
        content: '终审通过，可进入发放流程。',
        timestamp: '2026-06-01 10:30',
        carryToDelivery: false
      }
    ],
    deliveryRecords: [
      {
        id: 'd1',
        type: 'sms_notification',
        operator: '系统',
        content: '已发送短信通知：您的体检报告已完成，请携带身份证领取。',
        timestamp: '2026-06-01 10:35'
      }
    ],
    operationLogs: [
      { time: '2026-05-31 07:00', operator: '张导检', action: '前台登记完成', role: 'reception' },
      { time: '2026-05-31 08:00', operator: '孙医生', action: '心内科检查完成', role: 'doctor' },
      { time: '2026-05-31 15:00', operator: '孙医生', action: '科室医生审核通过', role: 'doctor' },
      { time: '2026-06-01 09:00', operator: '李审核员', action: '初审通过', role: 'auditor' },
      { time: '2026-06-01 10:30', operator: '周主任', action: '终审通过', role: 'auditor' },
      { time: '2026-06-01 10:35', operator: '系统', action: '发送领取短信通知', role: 'system' }
    ],
    lastModified: '2026-06-01 10:35',
    lastModifier: '周主任',
    exception: null
  },
  {
    id: 'RPT20260530004',
    patientName: '刘芳',
    patientAge: 28,
    patientGender: '女',
    examType: '孕前检查套餐',
    examDate: '2026-05-30',
    currentStatus: 'pending_delivery',
    currentHandler: 'deliver',
    assignee: '赵发放员',
    priority: 'high',
    stuckReason: '患者电话无人接听，已短信留言，待回电确认',
    isStuck: true,
    auditNotes: [
      {
        id: 'n1',
        type: 'department',
        role: 'doctor',
        author: '吴医生',
        department: '妇科',
        content: '妇科检查正常，建议补充叶酸。',
        timestamp: '2026-05-30 14:00',
        carryToDelivery: true
      },
      {
        id: 'n2',
        type: 'audit',
        role: 'auditor',
        author: '李审核员',
        content: '各项指标符合孕前要求，已备注发放时详细告知注意事项。',
        timestamp: '2026-05-31 11:00',
        carryToDelivery: true
      }
    ],
    deliveryRecords: [
      {
        id: 'd1',
        type: 'phone_call',
        operator: '赵发放员',
        content: '首次电话联系，无人接听',
        timestamp: '2026-05-31 14:00'
      },
      {
        id: 'd2',
        type: 'sms_notification',
        operator: '赵发放员',
        content: '已发送短信：请回电确认体检报告领取方式，电话：010-88888888',
        timestamp: '2026-05-31 14:05'
      },
      {
        id: 'd3',
        type: 'phone_call',
        operator: '赵发放员',
        content: '第二次电话联系，仍无人接听',
        timestamp: '2026-06-01 09:30'
      }
    ],
    operationLogs: [
      { time: '2026-05-30 08:00', operator: '张导检', action: '前台登记完成', role: 'reception' },
      { time: '2026-05-30 10:00', operator: '吴医生', action: '妇科检查完成', role: 'doctor' },
      { time: '2026-05-30 14:00', operator: '吴医生', action: '科室医生审核通过', role: 'doctor' },
      { time: '2026-05-31 11:00', operator: '李审核员', action: '审核完成', role: 'auditor' },
      { time: '2026-05-31 14:00', operator: '赵发放员', action: '开始发放登记流程', role: 'deliver' }
    ],
    lastModified: '2026-06-01 09:30',
    lastModifier: '赵发放员',
    exception: { type: 'delivery_failed', level: 'warning', description: '联系不上患者，发放受阻' }
  },
  {
    id: 'RPT20260528005',
    patientName: '陈明',
    patientAge: 50,
    patientGender: '男',
    examType: '肿瘤筛查套餐',
    examDate: '2026-05-28',
    currentStatus: 'secondary_audit',
    currentHandler: 'auditor',
    assignee: '周主任',
    priority: 'urgent',
    stuckReason: '发现异常指标，需主任复核后给出明确诊断建议',
    isStuck: true,
    auditNotes: [
      {
        id: 'n1',
        type: 'department',
        role: 'doctor',
        author: '郑医生',
        department: '检验科',
        content: '肿瘤标志物AFP值偏高，建议进一步检查。',
        timestamp: '2026-05-29 16:00',
        carryToDelivery: true
      },
      {
        id: 'n2',
        type: 'audit',
        role: 'auditor',
        author: '李审核员',
        content: 'AFP 42ng/ml，超出参考范围。已标记为紧急，建议CT增强扫描确认。',
        timestamp: '2026-05-30 09:00',
        carryToDelivery: true
      },
      {
        id: 'n3',
        type: 'exception',
        role: 'auditor',
        author: '李审核员',
        content: '【重大异常预警】AFP持续升高，需立即通知患者并安排进一步检查。请主任复核。',
        timestamp: '2026-05-30 09:15',
        carryToDelivery: true
      }
    ],
    deliveryRecords: [],
    operationLogs: [
      { time: '2026-05-28 07:30', operator: '张导检', action: '前台登记完成', role: 'reception' },
      { time: '2026-05-28 09:00', operator: '刘技师', action: '检验科样本接收', role: 'doctor' },
      { time: '2026-05-29 16:00', operator: '郑医生', action: '检验科结果出具，标记异常', role: 'doctor' },
      { time: '2026-05-30 09:00', operator: '李审核员', action: '初审发现异常，提交主任复审', role: 'auditor' },
      { time: '2026-05-30 09:15', operator: '李审核员', action: '触发重大异常预警流程', role: 'auditor' }
    ],
    lastModified: '2026-05-30 09:15',
    lastModifier: '李审核员',
    exception: { type: 'critical_abnormality', level: 'danger', description: '肿瘤标志物异常，紧急待处理' }
  },
  {
    id: 'RPT20260525006',
    patientName: '赵丽',
    patientAge: 40,
    patientGender: '女',
    examType: '妇科专项检查',
    examDate: '2026-05-25',
    currentStatus: 'delivered',
    currentHandler: null,
    assignee: null,
    priority: 'normal',
    stuckReason: null,
    isStuck: false,
    auditNotes: [
      {
        id: 'n1',
        type: 'department',
        role: 'doctor',
        author: '吴医生',
        department: '妇科',
        content: 'TCT检查正常，HPV阴性。建议每年复查。',
        timestamp: '2026-05-26 11:00',
        carryToDelivery: true
      },
      {
        id: 'n2',
        type: 'audit',
        role: 'auditor',
        author: '李审核员',
        content: '各项检查正常，已告知患者领取方式。',
        timestamp: '2026-05-27 09:00',
        carryToDelivery: true
      }
    ],
    deliveryRecords: [
      {
        id: 'd1',
        type: 'sms_notification',
        operator: '系统',
        content: '已发送领取短信通知',
        timestamp: '2026-05-27 09:05'
      },
      {
        id: 'd2',
        type: 'phone_confirm',
        operator: '赵发放员',
        content: '电话确认患者选择邮寄方式',
        timestamp: '2026-05-27 10:00'
      },
      {
        id: 'd3',
        type: 'delivery_complete',
        operator: '赵发放员',
        content: '顺丰快递寄出，单号：SF1234567890',
        recipient: '赵丽',
        recipientId: '110101********1234',
        deliveryMethod: '邮寄',
        timestamp: '2026-05-27 14:30'
      }
    ],
    operationLogs: [
      { time: '2026-05-25 08:30', operator: '张导检', action: '前台登记完成', role: 'reception' },
      { time: '2026-05-25 10:00', operator: '吴医生', action: '妇科检查完成', role: 'doctor' },
      { time: '2026-05-26 11:00', operator: '吴医生', action: '科室医生审核通过', role: 'doctor' },
      { time: '2026-05-27 09:00', operator: '李审核员', action: '审核完成', role: 'auditor' },
      { time: '2026-05-27 14:30', operator: '赵发放员', action: '发放完成（邮寄）', role: 'deliver' }
    ],
    lastModified: '2026-05-27 14:30',
    lastModifier: '赵发放员',
    exception: null
  }
]

export const reports = writable(initialReports)

export const pendingCount = derived(reports, $reports => 
  $reports.filter(r => r.currentHandler).length
)

export const stuckCount = derived(reports, $reports => 
  $reports.filter(r => r.isStuck).length
)

export const urgentCount = derived(reports, $reports => 
  $reports.filter(r => r.priority === 'urgent').length
)

export function addAuditNote(reportId, note) {
  reports.update(list => list.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        auditNotes: [...r.auditNotes, {
          id: 'n' + Date.now(),
          ...note,
          timestamp: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }).replace(/\//g, '-')
        }],
        lastModified: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }).replace(/\//g, '-'),
        lastModifier: note.author
      }
    }
    return r
  }))
}

export function updateReportStatus(reportId, statusId, handler, operator, action) {
  reports.update(list => list.map(r => {
    if (r.id === reportId) {
      const newStatus = auditStatus[statusId.toUpperCase()] || auditStatus[statusId]
      return {
        ...r,
        currentStatus: statusId,
        currentHandler: newStatus?.handler || null,
        assignee: handler,
        operationLogs: [...r.operationLogs, {
          time: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }).replace(/\//g, '-'),
          operator,
          action,
          role: newStatus?.handler || 'system'
        }],
        lastModified: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }).replace(/\//g, '-'),
        lastModifier: operator,
        isStuck: false,
        stuckReason: null
      }
    }
    return r
  }))
}

export function addDeliveryRecord(reportId, record) {
  reports.update(list => list.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        deliveryRecords: [...r.deliveryRecords, {
          id: 'd' + Date.now(),
          ...record,
          timestamp: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }).replace(/\//g, '-')
        }],
        lastModified: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }).replace(/\//g, '-'),
        lastModifier: record.operator
      }
    }
    return r
  }))
}

export function markAsStuck(reportId, reason, operator) {
  reports.update(list => list.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        isStuck: true,
        stuckReason: reason,
        operationLogs: [...r.operationLogs, {
          time: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }).replace(/\//g, '-'),
          operator,
          action: `标记卡住：${reason}`,
          role: r.currentHandler
        }],
        lastModified: new Date().toLocaleString('zh-CN', { 
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }).replace(/\//g, '-'),
        lastModifier: operator
      }
    }
    return r
  }))
}
