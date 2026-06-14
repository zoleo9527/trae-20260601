import { AlertTriangle, X, Send } from 'lucide-react';
import { useState } from 'react';

interface CommunicationExceptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string, nextFollowUp: string) => void;
  studentName: string;
}

const exceptionReasons = [
  { value: 'no_response', label: '家长未回应' },
  { value: 'refuse', label: '拒绝沟通' },
  { value: 'schedule_conflict', label: '时间冲突' },
  { value: 'emergency', label: '紧急情况' },
  { value: 'other', label: '其他' },
];

export function CommunicationExceptionDrawer({ 
  isOpen, 
  onClose, 
  onSubmit,
  studentName 
}: CommunicationExceptionDrawerProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const handleSubmit = () => {
    if (!selectedReason || !description) return;
    onSubmit(selectedReason, description, nextFollowUp);
    setSelectedReason('');
    setDescription('');
    setNextFollowUp('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">沟通异常处理</h2>
              <p className="text-sm text-gray-500">处理与 {studentName} 的沟通异常</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">异常原因</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">请选择异常原因</option>
              {exceptionReasons.map(reason => (
                <option key={reason.value} value={reason.value}>{reason.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">详细说明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述具体情况..."
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">下次跟进时间</label>
            <input
              type="datetime-local"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              处理异常后，该沟通任务将标记为"进行中"并记录异常信息
            </p>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || !description}
            className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            确认处理
          </button>
        </div>
      </div>
    </div>
  );
}