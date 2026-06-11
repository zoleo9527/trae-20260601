export const DISCOUNT_STATUS = {
  draft: { label: '草稿', class: 'status-draft' },
  pending_review: { label: '待审核', class: 'status-pending' },
  reviewing: { label: '审核中', class: 'status-reviewing' },
  approved: { label: '已通过', class: 'status-approved' },
  rejected: { label: '已退回', class: 'status-rejected' },
  exception: { label: '异常', class: 'status-exception' },
  archived: { label: '已归档', class: 'status-draft' }
}

export const PRICE_REPORT_STATUS = {
  pending: { label: '待报备', class: 'status-draft' },
  reported: { label: '已报备', class: 'status-reported' },
  verified: { label: '已核实', class: 'status-verified' },
  rejected: { label: '已退回', class: 'status-rejected' },
  exception: { label: '异常', class: 'status-exception' }
}

export const ROLE_LABELS = {
  store_manager: '品牌店长',
  operation_supervisor: '营运督导',
  investment_manager: '招商经理'
}

export const RECORD_TYPES = {
  old_ledger: '旧台账',
  on_site: '现场记录',
  screenshot: '沟通截图',
  communication: '沟通记录'
}

export const DISCOUNT_TYPES = [
  { value: 'direct_discount', label: '直接折扣' },
  { value: 'full_reduction', label: '满减' },
  { value: 'buy_gift', label: '买赠' },
  { value: 'member_only', label: '会员专享' },
  { value: 'flash_sale', label: '限时特卖' },
  { value: 'other', label: '其他' }
]
