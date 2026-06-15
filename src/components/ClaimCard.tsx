import { Clock, AlertCircle, ChevronRight, Camera } from 'lucide-react';
import type { Claim } from '../types';
import { useClaimStore } from '../store/claimStore';

interface ClaimCardProps {
  claim: Claim;
}

export function ClaimCard({ claim }: ClaimCardProps) {
  const { selectClaim } = useClaimStore();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    review: '审核中',
    approved: '已批准',
    paid: '已赔付',
    archived: '已归档',
    exception: '异常',
  };

  const responsibilityLabels: Record<string, string> = {
    company: '我方责任',
    customer: '客户责任',
    third_party: '第三方责任',
    undetermined: '责任待定',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    review: 'bg-purple-100 text-purple-800 border-purple-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    archived: 'bg-gray-100 text-gray-600 border-gray-200',
    exception: 'bg-red-100 text-red-800 border-red-200',
  };

  const responsibilityColors: Record<string, string> = {
    company: 'text-red-600 bg-red-50',
    customer: 'text-gray-600 bg-gray-50',
    third_party: 'text-blue-600 bg-blue-50',
    undetermined: 'text-yellow-600 bg-yellow-50',
  };

  return (
    <div
      onClick={() => selectClaim(claim.id)}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-primary-600">{claim.id}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[claim.status]}`}>
            {statusLabels[claim.status]}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Camera className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 mb-1 truncate">{claim.customerName}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{claim.damageDescription}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-xs ${responsibilityColors[claim.responsibility]}`}>
            {responsibilityLabels[claim.responsibility]}
          </span>
          {claim.damagePhotos.length > 0 && (
            <span className="text-gray-400 text-xs">{claim.damagePhotos.length}张照片</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDate(claim.updatedAt)}</span>
        </div>
      </div>

      {claim.status === 'exception' && (
        <div className="mt-3 pt-3 border-t border-red-100 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 line-clamp-2">{claim.exceptionReason}</p>
        </div>
      )}
    </div>
  );
}
