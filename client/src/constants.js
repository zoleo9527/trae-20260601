export const STATUS_MAP = {
  pending: { text: '待处理', color: 'default' },
  notified: { text: '已通知', color: 'blue' },
  scheduled: { text: '待复查', color: 'cyan' },
  unreachable: { text: '联系不上', color: 'purple' },
  refused: { text: '拒不整改', color: 'magenta' },
  partial: { text: '部分整改', color: 'gold' },
  rectified: { text: '已整改', color: 'green' },
  waived: { text: '可忽略', color: 'gray' },
  closed: { text: '已结案', color: 'green' }
};

export const SEVERITY_MAP = {
  high: { text: '严重', color: 'red' },
  medium: { text: '一般', color: 'orange' },
  low: { text: '轻微', color: 'green' }
};

export const PLAN_STATUS_MAP = {
  pending: { text: '待执行', color: 'default' },
  in_progress: { text: '进行中', color: 'processing' },
  completed: { text: '已完成', color: 'success' }
};

export const VISIT_STATUS_MAP = {
  pending: { text: '待上门', color: 'default' },
  completed: { text: '已完成', color: 'green' },
  missed: { text: '未遇', color: 'orange' }
};

export const APPOINTMENT_STATUS_MAP = {
  pending: { text: '待确认', color: 'default' },
  scheduled: { text: '已预约', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
  missed: { text: '未遇', color: 'orange' },
  refused: { text: '用户爽约', color: 'magenta' },
  partial: { text: '部分整改', color: 'gold' },
  rescheduled: { text: '已改期', color: 'purple' }
};

export const VISIT_METHOD_MAP = {
  phone: '电话',
  onsite: '上门',
  sms: '短信',
  wechat: '微信',
  email: '邮件'
};

export const NOTICE_METHOD_MAP = {
  onsite: '当面送达',
  phone: '电话告知',
  sms: '短信通知',
  sticker: '门上贴条',
  registered: '挂号信'
};

export const VISIT_PURPOSE_MAP = {
  hazard_warning: '隐患告知',
  satisfaction: '满意度回访',
  safety_education: '安全教育',
  contact_retry: '再次联系',
  complaint_handle: '投诉处理',
  other: '其他'
};

export const HAZARD_CATEGORY_MAP = {
  '软管类': '#ff7a45',
  '报警类': '#eb2f96',
  '阀门类': '#fa541c',
  '管道类': '#faad14',
  '灶具类': '#13c2c2',
  '环境类': '#1677ff',
  '表具类': '#722ed1',
  '其他': '#8c8c8c'
};
