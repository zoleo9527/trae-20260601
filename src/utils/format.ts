import type { Complaint, ComplaintPriority, ComplaintStatus, TimelineNode } from '../types';

export const statusMap: Record<ComplaintStatus, { label: string; color: string }> = {
  pending: { label: '待派单', color: 'text-amber-500 bg-amber-50 border-amber-200' },
  assigned: { label: '已派单', color: 'text-blue-500 bg-blue-50 border-blue-200' },
  processing: { label: '处理中', color: 'text-purple-500 bg-purple-50 border-purple-200' },
  completed: { label: '待关闭', color: 'text-orange-500 bg-orange-50 border-orange-200' },
  closed: { label: '已关闭', color: 'text-green-500 bg-green-50 border-green-200' }
};

export const priorityMap: Record<ComplaintPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-500 bg-gray-50 border-gray-200' },
  medium: { label: '中', color: 'text-blue-500 bg-blue-50 border-blue-200' },
  high: { label: '高', color: 'text-orange-500 bg-orange-50 border-orange-200' },
  urgent: { label: '紧急', color: 'text-red-500 bg-red-50 border-red-200' }
};

export const generateTimeline = (complaint: Complaint): TimelineNode[] => {
  const nodes: TimelineNode[] = [];

  nodes.push({
    type: 'report',
    title: '投诉上报',
    description: `来源：${complaint.source}`,
    time: complaint.createTime,
    completed: true
  });

  if (complaint.assignTime) {
    nodes.push({
      type: 'assign',
      title: '工单派发',
      description: complaint.assignee ? `派给：${complaint.assignee}` : undefined,
      time: complaint.assignTime,
      operator: complaint.assignee,
      completed: true
    });
  }

  if (complaint.arriveTime) {
    nodes.push({
      type: 'arrive',
      title: '到场处理',
      time: complaint.arriveTime,
      operator: complaint.assignee,
      completed: true
    });
  }

  if (complaint.processTime) {
    nodes.push({
      type: 'process',
      title: '处理完成',
      description: complaint.processNote,
      time: complaint.processTime,
      operator: complaint.assignee,
      completed: true
    });
  }

  if (complaint.closeTime) {
    nodes.push({
      type: 'close',
      title: '反馈关闭',
      description: complaint.closeReason,
      time: complaint.closeTime,
      completed: true
    });
  }

  if (complaint.status === 'pending') {
    nodes.push({
      type: 'assign',
      title: '等待派单',
      time: '—',
      completed: false
    });
  } else if (complaint.status === 'assigned') {
    nodes.push({
      type: 'arrive',
      title: '等待到场',
      time: '—',
      completed: false
    });
  } else if (complaint.status === 'processing') {
    nodes.push({
      type: 'process',
      title: '处理中...',
      time: '—',
      completed: false
    });
  } else if (complaint.status === 'completed') {
    nodes.push({
      type: 'close',
      title: '等待关闭确认',
      time: '—',
      completed: false
    });
  }

  return nodes;
};

export const formatTime = (timeStr: string): string => {
  if (timeStr === '—') return timeStr;
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return timeStr.split(' ')[0];
};

export const getDuration = (start: string, end: string): string => {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  const diff = endDate - startDate;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours === 0) return `${minutes}分钟`;
  return `${hours}小时${minutes}分钟`;
};
