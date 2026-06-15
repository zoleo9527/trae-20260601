import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Truck,
  ClipboardCheck,
  Send,
  FileText,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SignaturePad } from '@/components/business/SignaturePad';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useUserStore } from '@/store/useUserStore';
import { statusMap, priorityMap } from '@/utils/status';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';

const steps = [
  { label: '租赁经理', icon: User },
  { label: '调度', icon: Truck },
  { label: '维修师傅', icon: Wrench },
  { label: '司机签收', icon: ClipboardCheck },
];

export default function DriverSign() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInspectionById, getEquipmentById, getContractById, addSignature } =
    useInspectionStore();
  const { currentUser, currentRole } = useUserStore();
  const [signatureData, setSignatureData] = useState('');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const inspection = getInspectionById(id || '');
  const equipment = inspection ? getEquipmentById(inspection.equipmentId) : undefined;
  const contract = inspection ? getContractById(inspection.contractId) : undefined;

  const guard = useMemo(() => {
    if (!inspection) return { blocked: false, reason: '', canGoReview: false };
    if (inspection.status !== 'pending_sign') {
      let reason = '';
      if (inspection.status === 'completed') {
        reason = '该验机单已完成签收，无需重复签收';
      } else if (inspection.status === 'disputed') {
        reason = '该验机单存在争议，暂无法签收';
      } else {
        reason = `该验机单当前状态为「${statusMap[inspection.status]?.label || inspection.status}」，尚不可签收`;
      }
      const canGoReview = inspection.status === 'completed' && !!inspection.signature;
      return { blocked: true, reason, canGoReview };
    }
    if (currentRole !== 'driver') {
      return { blocked: true, reason: '仅司机角色可执行签收操作', canGoReview: false };
    }
    return { blocked: false, reason: '', canGoReview: false };
  }, [inspection, currentRole]);

  const { blocked, reason: blockReason, canGoReview } = guard;

  if (!inspection) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">验机单不存在</p>
        <button
          onClick={() => navigate('/inspections')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-100 flex items-center justify-center">
          <ShieldAlert size={28} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">无法进入签收</h3>
        <p className="text-sm text-slate-500 mb-6">{blockReason}</p>
        <div className="flex items-center justify-center gap-3">
          {canGoReview && (
            <Button
              variant="outline"
              onClick={() => navigate(`/inspections/${inspection.id}/review`)}
              rightIcon={<ArrowRight size={14} />}
            >
              查看签收记录
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => navigate(`/inspections/${inspection.id}`)}
          >
            返回验机详情
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusMap[inspection.status];
  const priorityInfo = priorityMap[inspection.priority];

  const failCount = inspection.items.filter((i) => i.result === 'fail').length;
  const passCount = inspection.items.filter((i) => i.result === 'pass').length;
  const currentStepIndex = 3;

  const handleSubmit = () => {
    if (!signatureData || !confirmed) return;

    setIsSubmitting(true);

    setTimeout(() => {
      addSignature(
        inspection.id,
        signatureData,
        currentUser.name,
        currentUser.id,
        ['photo1', 'photo2'],
        remark || undefined
      );
      setIsSubmitting(false);
      navigate(`/inspections/${inspection.id}/review`, { state: { signed: true } });
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">司机签收确认</h2>
          <p className="text-sm text-slate-500 mt-1">请确认设备状态无误后签字接收</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              return (
                <div key={step.label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <StepIcon size={18} />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-1.5 font-medium whitespace-nowrap',
                        isActive
                          ? 'text-blue-700'
                          : isCompleted
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-2 mt-[-18px]">
                      <div
                        className={cn(
                          'h-0.5 rounded-full',
                          index < currentStepIndex ? 'bg-emerald-400' : 'bg-slate-200'
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">验机单号</p>
              <p className="text-lg font-semibold text-slate-900">{inspection.inspectionNo}</p>
            </div>
            <span
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-full border',
                statusInfo.bgColor,
                statusInfo.color
              )}
            >
              {statusInfo.label}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck size={18} className="text-slate-500" />
            设备信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wrench size={32} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 text-lg">{equipment?.name}</h3>
              <p className="text-sm text-slate-500">{equipment?.model}</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">车牌号</p>
                  <p className="text-sm text-slate-700 font-medium">{equipment?.plateNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">工作时长</p>
                  <p className="text-sm text-slate-700 font-medium">{equipment?.workHours} 小时</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} className="text-slate-500" />
            合同与工地信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">合同号</p>
              <p className="text-sm text-slate-700 font-medium">{contract?.contractNo}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">承租方</p>
              <p className="text-sm text-slate-700 font-medium">{contract?.lessee}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">工地地址</p>
              <p className="text-sm text-slate-700 flex items-center gap-1">
                <MapPin size={12} className="text-slate-400" />
                {inspection.siteAddress}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">计划出场时间</p>
              <p className="text-sm text-slate-700 flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                {inspection.scheduledTime ? formatDateTime(inspection.scheduledTime) : '未安排'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={failCount > 0 ? 'border-amber-300' : 'border-emerald-200'}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench size={18} className="text-slate-500" />
              验机结果摘要
            </span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} />
                通过 {passCount} 项
              </span>
              {failCount > 0 ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  异常 {failCount} 项
                </span>
              ) : (
                <span className="text-emerald-600">全部正常</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['外观检查', '性能检查', '安全检查', '附件检查'].map((category) => {
              const categoryItems = inspection.items.filter((i) => i.category === category);
              const hasFail = categoryItems.some((i) => i.result === 'fail');
              const hasNa = categoryItems.some((i) => i.result === 'na');
              return (
                <div
                  key={category}
                  className={cn(
                    'p-3 rounded-lg border text-center',
                    hasFail
                      ? 'bg-rose-50 border-rose-200'
                      : hasNa
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-emerald-50 border-emerald-200'
                  )}
                >
                  <p className="text-sm font-medium text-slate-700 mb-1">{category}</p>
                  <p
                    className={cn(
                      'text-xs',
                      hasFail
                        ? 'text-rose-600'
                        : hasNa
                        ? 'text-slate-500'
                        : 'text-emerald-600'
                    )}
                  >
                    {hasFail ? '存在异常' : hasNa ? '未检查' : '全部正常'}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate(`/inspections/${inspection.id}`)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看完整验机报告
            <ChevronRight size={14} />
          </button>
        </CardContent>
      </Card>

      {failCount > 0 && (
        <Card className="border-rose-300 bg-rose-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-rose-900">设备存在 {failCount} 项异常</p>
                <p className="text-sm text-rose-700 mt-1">
                  该设备验机时发现 {failCount} 项异常，签收前请仔细核对设备状态。如有疑问请联系维修师傅或调度员。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck size={20} className="text-blue-600" />
            签字确认
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">司机姓名</label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm">
              {inspection.driverName || currentUser.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">现场照片</label>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <Camera size={20} className="text-slate-400" />
              </div>
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <Camera size={20} className="text-slate-400" />
              </div>
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <span className="text-xs text-slate-400">+ 添加</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">备注（可选）</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="如有特殊情况请在此备注..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">手写签名</label>
            <SignaturePad
              value={signatureData}
              onChange={setSignatureData}
              height={260}
            />
            {!signatureData && (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle size={12} />
                请先完成签名后再提交
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-slate-50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-colors',
                confirmed
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-slate-300 hover:border-blue-400'
              )}
              onClick={() => setConfirmed(!confirmed)}
            >
              {confirmed && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">我已仔细检查设备状态</p>
              <p className="text-xs text-slate-500 mt-1">
                确认设备情况与验机报告一致，同意接收该设备。签收后即表示对设备当前状态的认可。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2 pb-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!signatureData || !confirmed || isSubmitting}
          size="lg"
          leftIcon={<CheckCircle2 size={18} />}
        >
          {isSubmitting ? '提交中...' : '确认签收'}
        </Button>
      </div>
    </div>
  );
}
