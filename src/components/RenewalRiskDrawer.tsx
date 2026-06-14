import { AlertTriangle, X, Send, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

interface RenewalRiskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (riskLevel: string, reason: string, description: string, solution: string) => void;
  studentName: string;
  packageName: string;
}

const riskLevels = [
  { value: 'low', label: '低风险', icon: TrendingUp, color: 'text-green-600 bg-green-100' },
  { value: 'medium', label: '中风险', icon: AlertTriangle, color: 'text-amber-600 bg-amber-100' },
  { value: 'high', label: '高风险', icon: TrendingDown, color: 'text-red-600 bg-red-100' },
];

const riskReasons = [
  { value: 'price', label: '价格异议' },
  { value: 'budget', label: '预算不足' },
  { value: 'competitor', label: '竞品对比' },
  { value: 'schedule', label: '时间冲突' },
  { value: 'satisfaction', label: '服务不满' },
  { value: 'other', label: '其他原因' },
];

export function RenewalRiskDrawer({ 
  isOpen, 
  onClose, 
  onSubmit,
  studentName,
  packageName 
}: RenewalRiskDrawerProps) {
  const [riskLevel, setRiskLevel] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');

  const handleSubmit = () => {
    if (!riskLevel || !selectedReason || !description) return;
    onSubmit(riskLevel, selectedReason, description, solution);
    setRiskLevel('');
    setSelectedReason('');
    setDescription('');
    setSolution('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">续费风险处理</h2>
              <p className="text-sm text-gray-500">{studentName} - {packageName}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">风险等级</label>
            <div className="grid grid-cols-3 gap-3">
              {riskLevels.map(level => {
                const Icon = level.icon;
                const isSelected = riskLevel === level.value;
                return (
                  <button
                    key={level.value}
                    onClick={() => setRiskLevel(level.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? `border-current ${level.color}` 
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isSelected ? '' : 'text-gray-600'}`}>
                      {level.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">风险原因</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">请选择风险原因</option>
              {riskReasons.map(reason => (
                <option key={reason.value} value={reason.value}>{reason.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">详细说明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请描述具体风险情况..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">解决方案</label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="请输入拟采取的解决方案..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              标记风险后，该续费任务将转为"风险"状态，系统会通知相关负责人跟进
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
            disabled={!riskLevel || !selectedReason || !description}
            className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            确认标记风险
          </button>
        </div>
      </div>
    </div>
  );
}