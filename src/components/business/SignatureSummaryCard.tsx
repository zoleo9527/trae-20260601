import { User, Clock, AlertTriangle, FileText, ChevronRight, Eye, ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Signature, InspectionItem } from '@/types';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';

interface SignatureSummaryCardProps {
  signature?: Signature;
  driverName?: string;
  failCount?: number;
  items?: InspectionItem[];
  remark?: string;
  pending?: boolean;
  onViewReview?: () => void;
  onViewDetail?: () => void;
  onGoSign?: () => void;
  compact?: boolean;
  className?: string;
}

export function SignatureSummaryCard({
  signature,
  driverName,
  failCount,
  items,
  remark,
  pending = false,
  onViewReview,
  onViewDetail,
  onGoSign,
  compact = false,
  className,
}: SignatureSummaryCardProps) {
  const actualFailCount = failCount ?? (items ? items.filter((i) => i.result === 'fail').length : 0);
  const actualDriverName = signature?.driverName || driverName || '待指派';
  const actualRemark = signature?.remark || remark;
  const signedAt = signature?.signedAt;

  return (
    <Card
      className={cn(
        'bg-gradient-to-br from-white to-white',
        pending
          ? 'border-blue-200 from-blue-50'
          : 'border-emerald-200 from-emerald-50',
        className
      )}
    >
      <CardContent className={cn(compact ? 'p-4' : 'p-5')}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div
              className={cn(
                'w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 shadow-sm',
                pending ? 'bg-blue-500' : 'bg-emerald-500'
              )}
            >
              {pending ? <ClipboardCheck size={18} /> : <User size={18} />}
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">
                  {pending ? '待签收司机' : '签收司机'}
                </p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  {actualDriverName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">
                  {pending ? '签收时间' : '签收时间'}
                </p>
                <p
                  className={cn(
                    'text-sm font-medium flex items-center gap-1.5',
                    signedAt ? 'text-slate-700' : 'text-slate-400'
                  )}
                >
                  <Clock size={12} className={cn(signedAt ? 'text-slate-400' : 'text-slate-300')} />
                  {signedAt ? formatDateTime(signedAt) : '— 提交后回填 —'}
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
              {actualRemark && !compact && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">
                    {pending ? '司机备注' : '签收备注'}
                  </p>
                  <p className="text-sm text-slate-700 flex items-center gap-1.5 max-w-xs">
                    <FileText size={12} className="text-slate-400" />
                    <span className="truncate">{actualRemark}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pending && onGoSign && (
              <Button variant="primary" size="sm" onClick={onGoSign} leftIcon={<ClipboardCheck size={14} />}>
                前往签收
              </Button>
            )}
            {onViewDetail && (
              <Button variant="outline" size="sm" onClick={onViewDetail} rightIcon={<ChevronRight size={14} />}>
                验机详情
              </Button>
            )}
            {!pending && onViewReview && (
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
