import { Link } from 'react-router-dom';
import { Clock, User, ArrowRight } from 'lucide-react';
import type { Complaint } from '../../shared/types';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { TYPE_LABELS } from '../../shared/types';

interface TodoCardProps {
  complaint: Complaint;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return '刚刚';
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
}

export default function TodoCard({ complaint }: TodoCardProps) {
  const priorityColors = {
    urgent: 'border-l-rose-500',
    high: 'border-l-orange-500',
    medium: 'border-l-blue-500',
    low: 'border-l-gray-400',
  };

  return (
    <Link
      to={`/complaints/${complaint.id}`}
      className={`card p-5 border-l-4 ${priorityColors[complaint.priority]} hover:shadow-md transition-all group block`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
        </div>
        <ArrowRight size={18} className="text-gray-400 group-hover:text-navy-900 transition-colors" />
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-navy-900">
        {complaint.title}
      </h3>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
        {complaint.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User size={14} />
            {complaint.customerName}
          </span>
          <span>{TYPE_LABELS[complaint.type]}</span>
          <span>{complaint.complaintNo}</span>
        </div>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {formatTimeAgo(complaint.createdAt)}
        </span>
      </div>
    </Link>
  );
}
