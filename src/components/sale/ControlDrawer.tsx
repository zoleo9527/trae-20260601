import { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, User, Phone, MapPin, FileText, Lock, AlertCircle, UserCheck, ArrowRight } from 'lucide-react';
import { useHouseStore } from '@/store/useHouseStore';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useUserStore } from '@/store/useUserStore';
import { customers, getCustomersByConsultant } from '@/data';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import StatusBadge from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';
import { STAGE_MAP, ROLE_MAP } from '@/utils/status';
import RemarkSection from './RemarkSection';
import type { House, Customer, ControlStage } from '@/types';

interface ControlDrawerProps {
  open: boolean;
  onClose: () => void;
  house?: House | null;
  saleControlId?: string;
  mode?: 'create' | 'review' | 'lock';
}

const lockDurationOptions = [
  { value: 24, label: '24小时' },
  { value: 48, label: '48小时' },
  { value: 72, label: '72小时' },
];

const stageInfo: Record<ControlStage, { title: string; description: string; actionText: string }> = {
  application: {
    title: '提交销控申请',
    description: '选择客户并填写客户情况',
    actionText: '提交审核',
  },
  review: {
    title: '经理审核',
    description: '审核客户资质和销控申请',
    actionText: '审核通过',
  },
  lock: {
    title: '执行锁定',
    description: '确认锁定房源并设置锁定时长',
    actionText: '确认锁定',
  },
  completed: { title: '已完成', description: '', actionText: '' },
  rejected: { title: '已驳回', description: '', actionText: '' },
};

export default function ControlDrawer({ open, onClose, house, saleControlId, mode = 'create' }: ControlDrawerProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [remark, setRemark] = useState('');
  const [lockDuration, setLockDuration] = useState<number>(48);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { selectedHouse } = useHouseStore();
  const {
    currentSaleControl,
    setCurrentSaleControl,
    createSaleControl,
    submitForReview,
    reviewApprove,
    reviewReject,
    lockHouse,
    getSaleControlById,
    getPreviousRemark,
  } = useSaleControlStore();
  const { currentUser } = useUserStore();

  const activeHouse = house || selectedHouse;
  const activeSaleControl = saleControlId ? getSaleControlById(saleControlId) : currentSaleControl;

  const currentStage: ControlStage = activeSaleControl?.stage || 'application';
  const info = stageInfo[currentStage];

  const availableCustomers = currentUser.role === 'consultant'
    ? getCustomersByConsultant(currentUser.id)
    : customers;

  const customerOptions = availableCustomers.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.level}级 - ${c.phone})`,
  }));

  const previousRemark = activeSaleControl
    ? getPreviousRemark(activeSaleControl.id, currentStage)
    : undefined;

  useEffect(() => {
    if (open) {
      setError('');
      if (activeSaleControl) {
        setSelectedCustomerId(activeSaleControl.customerId);
        setLockDuration(activeSaleControl.lockDuration || 48);
        setCurrentSaleControl(activeSaleControl);

        if (previousRemark?.content) {
          if (currentStage === 'lock') {
            setRemark(`（备注自动从审核环节带入：${previousRemark.content}）`);
          } else if (currentStage === 'review') {
            setRemark(previousRemark.content);
          } else {
            setRemark('');
          }
        } else {
          setRemark('');
        }
      } else {
        setSelectedCustomerId('');
        setRemark('');
        setLockDuration(48);
      }
    }
  }, [open, activeSaleControl, setCurrentSaleControl, previousRemark, currentStage]);

  const getSelectedCustomer = (): Customer | undefined => {
    return customers.find((c) => c.id === selectedCustomerId);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}万`;
    }
    return `${price.toLocaleString()}`;
  };

  const handleSubmit = async () => {
    if (!activeHouse && !activeSaleControl) {
      setError('请选择房源');
      return;
    }
    if (currentStage === 'application' && !selectedCustomerId) {
      setError('请选择客户');
      return;
    }
    if (currentStage === 'application' && !remark.trim()) {
      setError('请填写客户情况备注');
      return;
    }
    if (currentStage === 'review' && !remark.trim()) {
      setError('请填写审核意见');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'create' || currentStage === 'application') {
        const newSaleControl = createSaleControl({
          houseId: (activeHouse || activeSaleControl?.house)!.id,
          customerId: selectedCustomerId,
          remark,
          lockDuration,
        });
        submitForReview(newSaleControl.id);
      } else if (currentStage === 'review') {
        if (activeSaleControl) {
          reviewApprove(activeSaleControl.id, remark);
        }
      } else if (currentStage === 'lock') {
        if (activeSaleControl) {
          lockHouse(activeSaleControl.id, lockDuration, remark);
        }
      }

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 500);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleReject = async () => {
    if (!activeSaleControl) return;
    if (!remark.trim()) {
      setError('请填写驳回原因');
      return;
    }

    setLoading(true);
    try {
      reviewReject(activeSaleControl.id, remark);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 500);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const selectedCustomer = getSelectedCustomer();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        'relative w-full max-w-lg bg-white shadow-2xl',
        'animate-slide-in-right',
        'h-full overflow-hidden flex flex-col'
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              {info.title}
              {activeSaleControl && (
                <span className="text-sm font-normal text-slate-400">
                  #{activeSaleControl.id.slice(-8)}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              {ROLE_MAP[currentUser.role]} · {currentUser.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-6 mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <span className="text-sm text-danger">{error}</span>
            </div>
          )}

          {(activeHouse || activeSaleControl) && (
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {(activeHouse || activeSaleControl?.house)?.houseNumber}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {(activeHouse || activeSaleControl?.house)?.building}{' '}
                      {(activeHouse || activeSaleControl?.house)?.unit}{' '}
                      {(activeHouse || activeSaleControl?.house)?.floor} ·{' '}
                      {(activeHouse || activeSaleControl?.house)?.layout}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice((activeHouse || activeSaleControl?.house)!.totalPrice)}
                    </span>
                    <span className="text-sm text-slate-400">
                      · {(activeHouse || activeSaleControl?.house)?.area}㎡
                    </span>
                  </div>
                </div>
                <StatusBadge type="house" value={(activeHouse || activeSaleControl?.house)!.status} />
              </div>
            </div>
          )}

          {activeSaleControl?.stageHistory && (
            <div className="px-6 py-3 border-b border-slate-100 bg-white">
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                流程交接
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {activeSaleControl.stageHistory.map((record, index) => (
                  <div key={record.stage} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
                      <span className={cn(
                        'text-xs font-medium',
                        record.completedAt ? 'text-success' :
                        activeSaleControl.stage === record.stage ? 'text-primary' : 'text-slate-400'
                      )}>
                        {record.stageName}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-600">{record.handlerName}</span>
                    </div>
                    {index < activeSaleControl.stageHistory.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 py-5 space-y-5">
            {currentStage === 'application' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择客户 <span className="text-danger">*</span>
                  </label>
                  <Select
                    options={customerOptions}
                    value={selectedCustomerId}
                    onChange={(value) => {
                      setSelectedCustomerId(value as string);
                      setError('');
                    }}
                    placeholder="请选择购房客户"
                  />
                </div>

                {selectedCustomer && (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{selectedCustomer.name}</span>
                          <StatusBadge type="customer" value={selectedCustomer.level} />
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      </div>
                    </div>
                    {selectedCustomer.intentLayout && (
                      <div className="mt-3 pt-3 border-t border-primary/10">
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">意向户型：</span>{selectedCustomer.intentLayout}
                        </p>
                        {selectedCustomer.intentPrice && (
                          <p className="text-xs text-slate-500 mt-1">
                            <span className="font-medium">意向价格：</span>{formatPrice(selectedCustomer.intentPrice)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(currentStage === 'review' || currentStage === 'lock') && activeSaleControl && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400 mb-2">客户信息</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        {activeSaleControl.customer.name}
                      </span>
                      <StatusBadge type="customer" value={activeSaleControl.customer.level} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{activeSaleControl.customer.phone}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-sm">
                    <span className="text-slate-400">申请人</span>
                    <span className="text-slate-700 font-medium">
                      {activeSaleControl.applicant.name} ({activeSaleControl.applicant.roleName})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {previousRemark && currentStage !== 'application' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <label className="block text-sm font-medium text-amber-700">
                    上一环节备注（自动带入，可修改）
                  </label>
                </div>
                <div className="p-3 bg-white/60 rounded-lg border border-amber-100 mb-2">
                  <p className="text-sm text-amber-800">{previousRemark.content}</p>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {previousRemark.operatorName} · {previousRemark.stageName}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {currentStage === 'application' ? '客户情况备注' :
                 currentStage === 'review' ? '审核意见' : '锁定备注'}
                <span className="text-danger ml-1">*</span>
              </label>
              <textarea
                value={remark}
                onChange={(e) => {
                  setRemark(e.target.value);
                  setError('');
                }}
                placeholder={
                  currentStage === 'application'
                    ? '请填写客户情况、认购资料、特殊需求等备注信息...'
                    : currentStage === 'review'
                    ? '请填写审核意见，客户资质、资料完整性、特殊说明等...'
                    : '请输入锁定备注，客户签约时间、特殊注意事项等...'
                }
                className="w-full h-36 px-3 py-2.5 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-slate-400">已输入 {remark.length} 字</p>
                {previousRemark && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    已自动带入上一环节备注
                  </p>
                )}
              </div>
            </div>

            {(currentStage === 'application' || currentStage === 'lock') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  锁定时长 <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {lockDurationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLockDuration(option.value)}
                      className={cn(
                        'p-3 rounded-lg border text-sm font-medium transition-all',
                        lockDuration === option.value
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      )}
                    >
                      <Clock className="w-4 h-4 mx-auto mb-1" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSaleControl?.remarks?.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  历史备注记录
                </h4>
                <RemarkSection remarks={activeSaleControl.remarks} maxVisible={3} />
              </div>
            )}

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary">操作提示</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {currentStage === 'application' && '提交后将自动流转至案场经理审核环节，系统会记录操作人、时间和备注信息'}
                    {currentStage === 'review' && '审核通过后将自动流转至销控专员执行锁定，申请备注将自动带入下一环节'}
                    {currentStage === 'lock' && '锁定后房源状态将变更为锁定，系统开始计算锁定时长倒计时'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-3">
            {currentStage === 'review' && (
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={loading}
                className="flex-1"
              >
                驳回申请
              </Button>
            )}
            <Button
              variant={currentStage === 'review' ? 'success' : 'primary'}
              onClick={handleSubmit}
              loading={loading}
              className={cn('flex-1', currentStage === 'review' ? 'flex-1' : '')}
            >
              <Lock className="w-4 h-4" />
              {info.actionText}
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full"
          >
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
