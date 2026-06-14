import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowLeft, User, Phone, Clock, Hash } from 'lucide-react';
import { useAppealStore } from '../stores';
import { InfoAggregator } from '../components/InfoAggregator';
import { WorkflowTimeline } from '../components/WorkflowTimeline';
import { OperationPanel } from '../components/OperationPanel';
import { AttachmentList } from '../components/AttachmentList';
import { STATUS_LABELS } from '../types';

export function AppealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const loadAppeals = useAppealStore((state) => state.loadAppeals);
  const appeal = useAppealStore((state) => state.getAppealById(id || ''));
  const operations = useAppealStore((state) => state.getOperationHistoryByAppealId(id || ''));
  const attachments = useAppealStore((state) => state.getAttachmentsByAppealId(id || ''));

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  if (!appeal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">申诉记录不存在</p>
      </div>
    );
  }

  const statusColor = {
    pending_assignment: 'bg-gray-100 text-gray-700',
    pending_investigation: 'bg-blue-100 text-blue-700',
    pending_review: 'bg-yellow-100 text-yellow-700',
    returned: 'bg-red-100 text-red-700',
    approved: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm mb-4 hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">返回工作台</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Hash className="w-5 h-5 text-gray-400" />
                <h1 className="text-xl font-bold text-gray-900">
                  {appeal.appealNumber}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[appeal.status]}`}>
                  {STATUS_LABELS[appeal.status]}
                </span>
                {appeal.isException && (
                  <motion.span
                    animate={{
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity
                    }}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700"
                  >
                    异常
                  </motion.span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{appeal.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{appeal.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>创建于 {format(appeal.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <InfoAggregator appeal={appeal} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <WorkflowTimeline operations={operations} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <OperationPanel appeal={appeal} onBack={() => navigate('/')} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AttachmentList attachments={attachments} />
        </motion.div>
      </div>
    </div>
  );
}