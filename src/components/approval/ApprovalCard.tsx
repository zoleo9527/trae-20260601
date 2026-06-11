import { useState } from 'react';
import {
  User,
  Clock,
  CalendarDays,
  MapPin,
  Home,
  Phone,
  FileText,
  Lock,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaleControl } from '@/types';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useUserStore } from '@/store/useUserStore';
import { STAGE_MAP, sortRemarksDesc, getStageRecord, getStageHandlerName } from '@/utils/status';
import { formatDateTime, formatDate } from '@/utils/date';
import ProcessTimeline from './ProcessTimeline';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import Select from '../common/Select';

interface ApprovalCardProps {
  saleControl: SaleControl;
  className?: string;
  onActionComplete?: () => void;
}

const LOCK_DURATION_OPTIONS = [
  { value: 24, label: '24小时' },
  { value: 48, label: '48小时' },
  { value: 72, label: '72小时' },
  { value: 168, label: '7天' },
];

export default function ApprovalCard({
  saleControl,
  className,
  onActionComplete,
}: ApprovalCardProps) {
  const { reviewApprove, reviewReject, lockHouse, completeSale } = useSaleControlStore();
  const { currentUser } = useUserStore();
  const [remark, setRemark] = useState('');
  const [lockDuration, setLockDuration] = useState<number>(48);
  const [loading, setLoading] = useState(false);

  const { house, customer, currentHandler, stage, remarks, stageHistory } = saleControl;

  const sortedRemarks = sortRemarksDesc(remarks);
  const applicationRecord = getStageRecord(stageHistory, 'application');

  const STAGE_PREVIOUS_MAP: Record<string, string> = {
    review: 'application',
    lock: 'review',
    completed: 'lock',
  };
  const previousStageKey = STAGE_PREVIOUS_MAP[stage];
  const previousRemark = previousStageKey
    ? sortedRemarks.find((r) => r.stage === previousStageKey) || sortedRemarks[0]
    : sortedRemarks[0];

  const canReview = stage === 'review' && currentUser.id === currentHandler.id;
  const canLock = stage === 'lock' && currentUser.id === currentHandler.id;
  const canComplete = stage === 'lock' && currentUser.role === 'controller';

  const handleApprove = async () => {
    setLoading(true);
    try {
      reviewApprove(saleControl.id, remark || undefined);
      setRemark('');
      onActionComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remark.trim()) return;
    setLoading(true);
    try {
      reviewReject(saleControl.id, remark);
      setRemark('');
      onActionComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    setLoading(true);
    try {
      lockHouse(saleControl.id, lockDuration, remark || undefined);
      setRemark('');
      onActionComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      completeSale(saleControl.id, remark || undefined);
      setRemark('');
      onActionComplete?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden', className)}>
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-800">
                {house.building}号楼 {house.unit}单元 {house.room}室
              </h3>
              <StatusBadge type="stage" value={stage} />
              <StatusBadge type="house" value={house.status} />
            </div>
            <p className="text-sm text-slate-500">
              申请编号：{saleControl.id}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              ¥{house.totalPrice.toLocaleString()}万
            </p>
            <p className="text-sm text-slate-500">
              {house.layout} · {house.area}㎡ · ¥{house.unitPrice.toLocaleString()}/㎡
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Home className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">房源信息：</span>
              <span className="text-slate-700 font-medium">
                {house.building}-{house.unit}-{house.room}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">朝向：</span>
              <span className="text-slate-700">{house.orientation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">申请时间：</span>
              <span className="text-slate-700">{formatDateTime(applicationRecord?.receivedAt)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">客户：</span>
              <span className="text-slate-700 font-medium">{customer.name}</span>
              <StatusBadge type="customer" value={customer.level} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">电话：</span>
              <span className="text-slate-700">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">来访日期：</span>
              <span className="text-slate-700">{formatDate(customer.visitDate)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">申请人：</span>
              <span className="text-slate-700 font-medium">
                {applicationRecord?.handlerName}（{applicationRecord?.handlerRoleName}）
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">当前处理：</span>
              <span className="text-slate-700 font-medium">
                {currentHandler.name} ({currentHandler.roleName})
              </span>
            </div>
            {saleControl.lockExpireAt && (
              <div className="flex items-center gap-2 text-sm">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">锁定到期：</span>
                <span className="text-slate-700">{formatDateTime(saleControl.lockExpireAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50/50">
        <ProcessTimeline currentStage={stage} stageHistory={saleControl.stageHistory} />
      </div>

      {remarks.length > 0 && (
        <div className="p-6 border-b border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            历史备注
          </h4>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {sortedRemarks.map((r) => (
              <div
                key={r.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500">
                    [{r.stageName}] {r.operatorName} ({r.operatorRoleName})
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(r.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{r.content}</p>
                <span className="inline-block mt-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  来源：{r.sourceName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {previousRemark && (canReview || canLock) && (
        <div className="p-6 border-b border-slate-100 bg-amber-50/50">
          <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            上一环节备注（自动带入）
          </h4>
          <p className="text-sm text-amber-800">{previousRemark.content}</p>
          <p className="text-xs text-amber-600 mt-1">
            — {previousRemark.operatorName} ({previousRemark.operatorRoleName}) · {formatDateTime(previousRemark.timestamp)}
          </p>
        </div>
      )}

      {(canReview || canLock || canComplete) && (
        <div className="p-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">操作区</h4>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              追加备注
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={canReview && stage === 'review' ? '请输入审核意见（驳回时必填）...' : '请输入备注信息...'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
              rows={3}
            />
          </div>

          {canLock && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                锁定时长
              </label>
              <Select
                options={LOCK_DURATION_OPTIONS}
                value={lockDuration}
                onChange={(v) => setLockDuration(v as number)}
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            {canReview && (
              <>
                <Button
                  variant="success"
                  onClick={handleApprove}
                  loading={loading}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  审核通过
                </Button>
                <Button
                  variant="danger"
                  onClick={handleReject}
                  loading={loading}
                  disabled={!remark.trim()}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  驳回申请
                </Button>
              </>
            )}

            {canLock && (
              <Button
                variant="primary"
                onClick={handleLock}
                loading={loading}
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                确认锁定
              </Button>
            )}

            {canComplete && (
              <Button
                variant="success"
                onClick={handleComplete}
                loading={loading}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                完成销售
              </Button>
            )}
          </div>
        </div>
      )}

      {!canReview && !canLock && !canComplete && stage !== 'completed' && stage !== 'rejected' && (
        <div className="p-6 bg-slate-50 text-center">
          <p className="text-sm text-slate-500">
            当前环节由 <span className="font-medium text-slate-700">{currentHandler.name}</span> 处理，请等待...
          </p>
        </div>
      )}

      {(stage === 'completed' || stage === 'rejected') && (
        <div className={cn(
          'p-6 text-center',
          stage === 'completed' ? 'bg-success/5' : 'bg-danger/5'
        )}>
          <p className={cn(
            'text-sm font-medium',
            stage === 'completed' ? 'text-success' : 'text-danger'
          )}>
            {STAGE_MAP[stage]}
          </p>
        </div>
      )}
    </div>
  );
}
