import { useState } from 'react';
import {
  Home, User, Clock, CheckCircle2, XCircle, ChevronRight,
  Eye, Lock, Unlock, ThumbsUp, ThumbsDown, FileCheck, Calendar
} from 'lucide-react';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useUserStore } from '@/store/useUserStore';
import StatusBadge from '@/components/common/StatusBadge';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { STAGE_MAP, ROLE_MAP } from '@/utils/status';
import RemarkSection from './RemarkSection';
import type { SaleControl, UserRole, ControlStage } from '@/types';

interface SaleControlCardProps {
  saleControl: SaleControl;
  onViewDetail?: (saleControl: SaleControl) => void;
  onAction?: (saleControl: SaleControl, action: string) => void;
  expanded?: boolean;
}

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  roles: UserRole[];
  stages: ControlStage[];
  action: string;
}

const actionConfigs: ActionConfig[] = [
  {
    label: '提交审核',
    icon: <FileCheck className="w-4 h-4" />,
    variant: 'primary',
    roles: ['consultant', 'manager'],
    stages: ['application'],
    action: 'submit',
  },
  {
    label: '审核通过',
    icon: <ThumbsUp className="w-4 h-4" />,
    variant: 'success',
    roles: ['manager'],
    stages: ['review'],
    action: 'approve',
  },
  {
    label: '审核驳回',
    icon: <ThumbsDown className="w-4 h-4" />,
    variant: 'danger',
    roles: ['manager'],
    stages: ['review'],
    action: 'reject',
  },
  {
    label: '执行锁定',
    icon: <Lock className="w-4 h-4" />,
    variant: 'primary',
    roles: ['controller'],
    stages: ['lock'],
    action: 'lock',
  },
  {
    label: '完成销售',
    icon: <CheckCircle2 className="w-4 h-4" />,
    variant: 'success',
    roles: ['controller'],
    stages: ['lock'],
    action: 'complete',
  },
];

const stageOrder: ControlStage[] = ['application', 'review', 'lock', 'completed'];

export default function SaleControlCard({
  saleControl,
  onViewDetail,
  onAction,
  expanded = false,
}: SaleControlCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const { currentUser } = useUserStore();

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return `${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailableActions = (): ActionConfig[] => {
    return actionConfigs.filter(
      (config) =>
        config.roles.includes(currentUser.role) &&
        config.stages.includes(saleControl.stage)
    );
  };

  const getStageProgress = () => {
    const currentIndex = stageOrder.indexOf(saleControl.stage);
    return stageOrder.map((stage, index) => ({
      stage,
      label: STAGE_MAP[stage],
      isCompleted: index < currentIndex || (stage === 'completed' && saleControl.stage === 'completed'),
      isCurrent: index === currentIndex && saleControl.stage !== 'completed' && saleControl.stage !== 'rejected',
      isRejected: saleControl.stage === 'rejected' && index === currentIndex,
    }));
  };

  const handleAction = (action: string) => {
    onAction?.(saleControl, action);
  };

  const availableActions = getAvailableActions();
  const progress = getStageProgress();
  const latestRemark = saleControl.remarks?.[saleControl.remarks.length - 1];

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
        'transition-all duration-300 hover:shadow-md',
        isExpanded && 'shadow-md'
      )}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{saleControl.house.houseNumber}</h3>
              <p className="text-sm text-slate-500">
                {saleControl.house.building} · {saleControl.house.layout} · {saleControl.house.area}㎡
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge type="stage" value={saleControl.stage} />
            <span className="text-lg font-bold text-primary">
              {formatPrice(saleControl.house.totalPrice)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">客户</p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {saleControl.customer.name}
                <StatusBadge
                  type="customer"
                  value={saleControl.customer.level}
                  className="ml-1.5"
                />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">申请人</p>
              <p className="text-sm font-medium text-slate-700 truncate">
                {saleControl.applicant.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>当前处理：{saleControl.currentHandler.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(saleControl.createdAt)}</span>
          </div>
        </div>

        {latestRemark && (
          <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">最新备注</p>
            <p className="text-sm text-slate-700 line-clamp-2">{latestRemark.content}</p>
          </div>
        )}

        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">流程进度</p>
            <ChevronRight
              className={cn(
                'w-4 h-4 text-slate-400 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
            />
          </div>
          <div className="flex items-center justify-between">
            {progress.map((item, index) => (
              <div key={item.stage} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                      item.isCompleted && !item.isRejected
                        ? 'bg-success text-white'
                        : item.isCurrent
                        ? 'bg-primary text-white animate-pulse'
                        : item.isRejected
                        ? 'bg-danger text-white'
                        : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {item.isCompleted && !item.isRejected ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : item.isRejected ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-xs mt-1 whitespace-nowrap',
                      item.isCurrent ? 'text-primary font-medium' : 'text-slate-400'
                    )}
                  >
                    {item.label}
                  </p>
                </div>
                {index < progress.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1 -mt-4',
                      item.isCompleted && !item.isRejected ? 'bg-success' : 'bg-slate-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs mb-1">联系电话</p>
                <p className="text-slate-700 font-medium">{saleControl.customer.phone}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">客户等级</p>
                <StatusBadge type="customer" value={saleControl.customer.level} />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">创建时间</p>
                <p className="text-slate-700">{formatDate(saleControl.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">更新时间</p>
                <p className="text-slate-700">{formatDate(saleControl.updatedAt)}</p>
              </div>
              {saleControl.lockExpireAt && (
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs mb-1">锁定到期</p>
                  <p className="text-slate-700 font-medium text-secondary">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    {formatDate(saleControl.lockExpireAt)}
                  </p>
                </div>
              )}
            </div>

            {saleControl.remarks?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">备注记录</p>
                <RemarkSection remarks={saleControl.remarks} maxVisible={3} />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetail?.(saleControl);
                }}
                className="flex-1"
              >
                <Eye className="w-4 h-4" />
                查看详情
              </Button>
              {availableActions.map((action) => (
                <Button
                  key={action.action}
                  variant={action.variant}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(action.action);
                  }}
                  className="flex-1 gap-1"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
