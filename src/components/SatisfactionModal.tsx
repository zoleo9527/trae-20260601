import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useWorkOrderStore } from '../store/workOrderStore';

interface SatisfactionModalProps {
  orderId: string;
  onClose: () => void;
}

export const SatisfactionModal = ({ orderId, onClose }: SatisfactionModalProps) => {
  const { addSatisfaction } = useWorkOrderStore();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [operator, setOperator] = useState('张宿管');

  const handleSubmit = () => {
    if (score > 0) {
      addSatisfaction(orderId, score, comment, operator);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">满意度回访</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">评价人</label>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">满意度评分</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setScore(star)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    score >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {score === 0 && '请选择评分'}
            {score === 1 && '非常不满意'}
            {score === 2 && '不满意'}
            {score === 3 && '一般'}
            {score === 4 && '满意'}
            {score === 5 && '非常满意'}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">评价内容</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请输入您的评价..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={score === 0}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
              score > 0
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            提交评价
          </button>
        </div>
      </div>
    </div>
  );
};
