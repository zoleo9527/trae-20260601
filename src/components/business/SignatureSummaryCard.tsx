import { User, Clock, AlertTriangle, FileText, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Signature, InspectionItem } from '@/types';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';

interface SignatureSummaryCardProps {
  signature: Signature;
  failCount?: number;
  items?: InspectionItem[];
  onViewReview?: () => void;
  onViewDetail?: () => void;
  compact?: boolean;
  className?: string;
}

export function SignatureSummaryCard({
  signature,
  failCount = 0,
  items,
  onViewReview,
  onViewDetail,
  compact = false,
  className,
}: SignatureSummaryCardProps) {
  const actualFailCount = failCount || (items ? items.filter((i) => i.result === 'fail').length : 0);

  return (
    <Card className={cn('border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white', className)}>
      <CardContent className={cn(compact ? 'p-4' : 'p-5')}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <User size={18} />
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">签收司机</p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  {signature.driverName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">签收时间</p>
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  {formatDateTime(signature.signedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">异常项</p>
                <p
                  className={cn(
                    'text-sm font-semibold flex items-center gap-1.5',
                    actualFailCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  )}
                >
                  {actualFailCount > 0 ? (
                    <>
                      <AlertTriangle size={12} />
                      {actualFailCount} 项
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      无异常
                    </>
                  )}
                </p>
              </div>
              {signature.remark && !compact && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">签收备注</p>
                  <p className="text-sm text-slate-700 flex items-center gap-1.5 max-w-xs">
                    <FileText size={12} className="text-slate-400" />
                    <span className="truncate">{signature.remark}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onViewDetail && (
              <Button variant="outline" size="sm" onClick={onViewDetail} rightIcon={<ChevronRight size={14} />}>
                验机详情
              </Button>
            )}
            {onViewReview && (
              <Button variant="primary" size="sm" onClick={onViewReview} leftIcon={<Eye size={14} />}>
                签收回看
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
