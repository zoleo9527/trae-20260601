import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Circle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { OperationHistory, OPERATION_LABELS, ROLE_LABELS } from '../types';

interface TimelineItemProps {
  operation: OperationHistory;
  isLast: boolean;
}

function TimelineItem({ operation, isLast }: TimelineItemProps) {
  const iconColor = {
    create: 'text-blue-500',
    assign: 'text-blue-500',
    submit_investigation: 'text-green-500',
    approve: 'text-green-500',
    return: 'text-red-500',
    supplement: 'text-yellow-500'
  };

  const bgColor = {
    create: 'bg-blue-50',
    assign: 'bg-blue-50',
    submit_investigation: 'bg-green-50',
    approve: 'bg-green-50',
    return: 'bg-red-50',
    supplement: 'bg-yellow-50'
  };

  const IconComponent = operation.operationType === 'approve' 
    ? CheckCircle2 
    : operation.operationType === 'return' 
      ? XCircle 
      : Circle;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-2 rounded-full ${bgColor[operation.operationType]}`}
        >
          <IconComponent className={`w-4 h-4 ${iconColor[operation.operationType]}`} />
        </motion.div>
        {!isLast && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ delay: 0.3 }}
            className="w-0.5 bg-gray-300 my-2"
          />
        )}
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`flex-1 pb-4 ${bgColor[operation.operationType]} rounded-lg p-3`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">
            {OPERATION_LABELS[operation.operationType]}
          </span>
          <span className="text-xs text-gray-500">
            {format(operation.operationTime, 'yyyy-MM-dd HH:mm')}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <span className="font-medium">{ROLE_LABELS[operation.operatorRole]}</span>
          <ArrowRight className="w-3 h-3" />
          <span>{operation.operatorName}</span>
        </div>
        
        <p className="text-sm text-gray-700">
          {operation.operationContent}
        </p>
        
        {operation.reason && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 p-2 bg-white rounded text-sm text-red-600"
          >
            <span className="font-medium">原因: </span>
            {operation.reason}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

interface WorkflowTimelineProps {
  operations: OperationHistory[];
}

export function WorkflowTimeline({ operations }: WorkflowTimelineProps) {
  if (operations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 text-center">
        <p className="text-gray-500">暂无操作记录</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">操作历史</h3>
      <div className="space-y-0">
        {operations.map((operation, index) => (
          <TimelineItem
            key={operation.id}
            operation={operation}
            isLast={index === operations.length - 1}
          />
        ))}
      </div>
    </div>
  );
}