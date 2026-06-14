import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ChevronRight, Clock, User, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppealStore, useRoleStore } from '../stores';
import { Appeal, STATUS_LABELS } from '../types';

interface TodoCardProps {
  appeal: Appeal;
}

function TodoCard({ appeal }: TodoCardProps) {
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
      className="relative bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor[appeal.status]}`} />
      
      {appeal.isException && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity
          }}
          className="absolute top-2 right-2"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
        </motion.div>
      )}
      
      <Link to={`/appeal/${appeal.id}`} className="block p-4 pl-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-900">
                {appeal.appealNumber}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                appeal.isException 
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
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
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{format(appeal.createdAt, 'yyyy-MM-dd HH:mm')}</span>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Link>
    </motion.div>
  );
}

export function TodoList() {
  const currentRole = useRoleStore((state) => state.currentRole);
  const todoList = useAppealStore((state) => state.getTodoList(currentRole));

  if (todoList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">暂无待办事项</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todoList.map((appeal, index) => (
        <motion.div
          key={appeal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <TodoCard appeal={appeal} />
        </motion.div>
      ))}
    </div>
  );
}