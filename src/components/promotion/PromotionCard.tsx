import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag, ChevronRight, Clock } from 'lucide-react';
import type { Promotion } from '@/types';
import { StatusBadge } from '../common/StatusBadge';
import { RoleBadge } from '../common/RoleBadge';
import { formatDate, formatRelativeTime, formatCurrency } from '@/utils/format';

interface PromotionCardProps {
  promotion: Promotion;
  showAction?: boolean;
  onOpen?: () => void;
}

export function PromotionCard({ promotion, showAction = true, onOpen }: PromotionCardProps) {
  const handleClick = () => {
    onOpen?.();
  };

  return (
    <div 
      className="card p-5 animate-fade-in cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-semibold text-navy-500 mb-1 truncate group-hover:text-amber-600 transition-colors">
            {promotion.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {promotion.counter}
            </span>
            <span className="flex items-center gap-1">
              <Tag size={12} />
              {promotion.brand}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(promotion.startDate)} ~ {formatDate(promotion.endDate)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <StatusBadge status={promotion.status} />
          {ChevronRight && (
            <ChevronRight size={16} className="text-slate-400 group-hover:text-navy-500 transition-colors" />
          )}
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
        {promotion.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-500">预算：</span>
            <span className="font-semibold text-navy-600">{formatCurrency(promotion.budget)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={12} />
            {formatRelativeTime(promotion.updatedAt)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={promotion.currentRole} />
          {showAction && promotion.status !== 'completed' && (
            <Link 
              to={`/promotion/${promotion.id}`}
              onClick={(e) => e.stopPropagation()}
              className="btn btn-primary text-xs py-1.5 px-3"
            >
              处理
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
