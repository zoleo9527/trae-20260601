import { Clock, AlertCircle, ChevronRight, Camera } from 'lucide-react';
import type { Claim } from '../types';
import { useClaimStore } from '../store/claimStore';
import { getStatusLabel, getStatusColor, RESPONSIBILITY_CONFIG } from '../constants/statusConfig';

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

  return (
    <div
      onClick={() => selectClaim(claim.id)}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-primary-600">{claim.id}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(claim.status)}`}>
            {getStatusLabel(claim.status)}
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
          <span className={`px-2 py-0.5 rounded text-xs ${RESPONSIBILITY_CONFIG[claim.responsibility]?.color || 'bg-gray-100 text-gray-600'}`}>
            {RESPONSIBILITY_CONFIG[claim.responsibility]?.label || claim.responsibility}
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
