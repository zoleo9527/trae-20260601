import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Appeal, OperationHistory, Attachment } from '../types';
import { WorkflowTimeline } from './WorkflowTimeline';
import { AttachmentList } from './AttachmentList';

interface DetailModalProps {
  appeal: Appeal | null;
  operations: OperationHistory[];
  attachments: Attachment[];
  onClose: () => void;
}

export function DetailModal({ appeal, operations, attachments, onClose }: DetailModalProps) {
  if (!appeal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              申诉详情 - {appeal.appealNumber}
            </h2>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">客户姓名:</span>
                    <p className="text-sm text-gray-900 mt-1">{appeal.customerName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">联系电话:</span>
                    <p className="text-sm text-gray-900 mt-1">{appeal.customerPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-700">申诉内容:</span>
                    <p className="text-sm text-gray-900 mt-1">{appeal.appealContent}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-700">旧台账信息:</span>
                    <p className="text-sm text-gray-900 mt-1">{appeal.oldLedgerInfo}</p>
                  </div>
                  {appeal.siteRecord && (
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-gray-700">现场记录:</span>
                      <p className="text-sm text-gray-900 mt-1">{appeal.siteRecord}</p>
                    </div>
                  )}
                  {appeal.professionalOpinion && (
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-gray-700">专业意见:</span>
                      <p className="text-sm text-gray-900 mt-1">{appeal.professionalOpinion}</p>
                    </div>
                  )}
                  {appeal.returnReason && (
                    <div className="col-span-2 bg-red-50 rounded p-3">
                      <span className="text-sm font-medium text-red-700">退回原因:</span>
                      <p className="text-sm text-red-900 mt-1">{appeal.returnReason}</p>
                    </div>
                  )}
                  {appeal.supplementNote && (
                    <div className="col-span-2 bg-yellow-50 rounded p-3">
                      <span className="text-sm font-medium text-yellow-700">补充备注:</span>
                      <p className="text-sm text-yellow-900 mt-1">{appeal.supplementNote}</p>
                    </div>
                  )}
                  {appeal.reviewConclusion && (
                    <div className="col-span-2 bg-green-50 rounded p-3">
                      <span className="text-sm font-medium text-green-700">复核结论:</span>
                      <p className="text-sm text-green-900 mt-1">{appeal.reviewConclusion}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <WorkflowTimeline operations={operations} />
            
            <AttachmentList attachments={attachments} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}