const STATUS_MAP = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700', icon: '📝' },
  submitted: { label: '已提交', color: 'bg-blue-100 text-blue-700', icon: '📤' },
  in_review: { label: '审核中', color: 'bg-yellow-100 text-yellow-700', icon: '🔍' },
  revision_needed: { label: '客户改版', color: 'bg-orange-100 text-orange-700', icon: '🔄' },
  material_rejected: { label: '素材不合规', color: 'bg-red-100 text-red-700', icon: '❌' },
  scheduled: { label: '已排期', color: 'bg-indigo-100 text-indigo-700', icon: '📅' },
  aired_pending: { label: '已播待确认', color: 'bg-purple-100 text-purple-700', icon: '📺' },
  confirmed: { label: '已确认', color: 'bg-teal-100 text-teal-700', icon: '✅' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700', icon: '🎉' },
};

const MATERIAL_STATUS_MAP = {
  pending_review: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '审核通过', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '审核驳回', color: 'bg-red-100 text-red-700' },
  revision_needed: { label: '需修改', color: 'bg-orange-100 text-orange-700' },
};

const SCHEDULE_STATUS_MAP = {
  scheduled: { label: '已排期', color: 'bg-blue-100 text-blue-700' },
  aired: { label: '已播出', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700' },
  conflict: { label: '排期冲突', color: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status, type = 'order' }) {
  const map = type === 'material' ? MATERIAL_STATUS_MAP : type === 'schedule' ? SCHEDULE_STATUS_MAP : STATUS_MAP;
  const config = map[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: '' };

  return (
    <span className={`badge ${config.color}`}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
}

export { MATERIAL_STATUS_MAP, SCHEDULE_STATUS_MAP, STATUS_MAP };

