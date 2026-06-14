import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ChevronRight, Clock, User, Hash } from 'lucide-react';
import { Appeal, STATUS_LABELS } from '../types';

interface HistoryCardProps {
  appeal: Appeal;
  onClick: () => void;
}

function HistoryCard({ appeal, onClick }: HistoryCardProps) {
  const statusColor = {
    pending_assignment: 'bg-gray-400',
    pending_investigation: 'bg-blue-500',
    pending_review: 'bg-yellow-500',
    returned: 'bg-red-500',
    approved: 'bg-green-500',
    archived: 'bg-gray-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      onClick={onClick}
      className="relative bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor[appeal.status]}`} />
      
      <div className="p-4 pl-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {appeal.appealNumber}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {STATUS_LABELS[appeal.status]}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User className="w-4 h-4" />
              <span>{appeal.customerName}</span>
              <span className="text-gray-400">{appeal.customerPhone}</span>
            </div>
            
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              {appeal.appealContent}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>创建: {format(appeal.createdAt, 'yyyy-MM-dd HH:mm')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>更新: {format(appeal.updatedAt, 'yyyy-MM-dd HH:mm')}</span>
              </div>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </motion.div>
  );
}

interface HistoryListProps {
  appeals: Appeal[];
  onCardClick: (appeal: Appeal) => void;
}

export function HistoryList({ appeals, onCardClick }: HistoryListProps) {
  if (appeals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">未找到符合条件的记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appeals.map((appeal, index) => (
        <motion.div
          key={appeal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <HistoryCard appeal={appeal} onClick={() => onCardClick(appeal)} />
        </motion.div>
      ))}
    </div>
  );
}