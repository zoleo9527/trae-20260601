import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Phone,
  User,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Truck,
  Eye,
  Edit3,
  Send,
  ClipboardCheck,
  HardHat,
  ExternalLink,
  ChevronRight,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Timeline } from '@/components/ui/Timeline';
import { InspectionItems } from '@/components/business/InspectionItems';
import { SignatureSummaryCard } from '@/components/business/SignatureSummaryCard';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useUserStore } from '@/store/useUserStore';
import { statusMap, priorityMap, roleMap } from '@/utils/status';
import { formatDate, formatDateTime, formatMoney } from '@/utils/date';
import { cn } from '@/lib/utils';
import { InspectionItemResult, InspectionStatus } from '@/types';
import { useState } from 'react';

const flowSteps = [
  { key: 'manager', label: '租赁经理', icon: HardHat, statusKey: 'pending_manager' },
  { key: 'dispatcher', label: '调度', icon: Truck, statusKey: 'pending_dispatch' },
  { key: 'technician', label: '维修师傅', icon: Wrench, statusKey: 'pending_inspection' },
  { key: 'driver', label: '司机签收', icon: ClipboardCheck, statusKey: 'pending_sign' },
  { key: 'completed', label: '已完成', icon: CheckCircle2, statusKey: 'completed' },
] as const;

function getStepIndex(status: InspectionStatus): number {
  switch (status) {
    case 'pending_manager':
      return 0;
    case 'pending_dispatch':
      return 1;
    case 'pending_inspection':
    case 'inspecting':
    case 'pending_repair':
      return 2;
    case 'pending_sign':
      return 3;
    case 'completed':
      return 4;
    case 'disputed':
      return -1;
    default:
      return 0;
  }
}

function getNextStepLabel(status: InspectionStatus, role: string): string {
  switch (status) {
    case 'pending_manager':
      return '请确认验机单并下发给调度';
    case 'pending_dispatch':
      return '请为该验机单分配设备与司机';
    case 'pending_inspection':
      return '请开始出场验机检查';
    case 'inspecting':
      return '请完成验机检查并提交结果';
    case 'pending_repair':
      return '设备需要维修，请完成维修后重新验机';
    case 'pending_sign':
      return role === 'driver' ? '请确认验机结果并签收设备' : '等待司机签收确认';
    case 'disputed':
      return '存在争议，请租赁经理介入处理';
    default:
      return '';
  }
}

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInspectionById, getEquipmentById, getContractById, updateInspectionStatus, updateInspectionItem } =
    useInspectionStore();
  const { currentRole, currentUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);

  const inspection = getInspectionById(id || '');
  const equipment = inspection ? getEquipmentById(inspection.equipmentId) : undefined;
  const contract = inspection ? getContractById(inspection.contractId) : undefined;

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

  const statusInfo = statusMap[inspection.status];
  const priorityInfo = priorityMap[inspection.priority];
  const isMyTodo = inspection.currentRole === currentRole && inspection.status !== 'completed';
  const stepIndex = getStepIndex(inspection.status);
  const isDisputed = inspection.status === 'disputed';
  const isRepairLoop = inspection.status === 'pending_repair';

  const handleItemChange = (itemId: string, result: InspectionItemResult, remark?: string) => {
    if (!isEditing) return;
    updateInspectionItem(inspection.id, itemId, result, remark);
  };

  const handleAction = (action: string, nextStatus: InspectionStatus, remark?: string) => {
    updateInspectionStatus(
      inspection.id,
      nextStatus,
      currentRole,
      currentUser.id,
      currentUser.name,
      action,
      remark
    );
  };

  const getRoleActions = (): { label: string; status: InspectionStatus; variant?: 'primary' | 'secondary' | 'outline' | 'danger'; icon?: any; navigateTo?: string }[] => {
    if (!isMyTodo) return [];

    switch (currentRole) {
      case 'manager':
        if (inspection.status === 'pending_manager') {
          return [{ label: '确认并下发', status: 'pending_dispatch', variant: 'primary', icon: Send }];
        }
        if (inspection.status === 'disputed') {
          return [
            { label: '标记已处理', status: 'pending_inspection', variant: 'outline', icon: CheckCircle2 },
            { label: '重新发起验机', status: 'pending_inspection', variant: 'primary', icon: Wrench },
          ];
        }
        return [];
      case 'dispatcher':
        if (inspection.status === 'pending_dispatch') {
          return [{ label: '分配设备与司机', status: 'pending_inspection', variant: 'primary', icon: Truck }];
        }
        return [];
      case 'technician':
        if (inspection.status === 'pending_inspection') {
          return [{ label: '开始验机', status: 'inspecting', variant: 'primary', icon: ClipboardCheck }];
        }
        if (inspection.status === 'inspecting') {
          return [
            { label: '验机通过', status: 'pending_sign', variant: 'primary', icon: CheckCircle2 },
            { label: '需维修处理', status: 'pending_repair', variant: 'danger', icon: Wrench },
          ];
        }
        if (inspection.status === 'pending_repair') {
          return [{ label: '维修完成，重新验机', status: 'pending_inspection', variant: 'primary', icon: CheckCircle2 }];
        }
        return [];
      case 'driver':
        if (inspection.status === 'pending_sign') {
          return [{ label: '前往签收', status: 'pending_sign', variant: 'primary', icon: ClipboardCheck, navigateTo: `/inspections/${inspection.id}/sign` }];
        }
        return [];
      default:
        return [];
    }
  };

  const actions = getRoleActions();

  const canEditItems =
    isEditing &&
    currentRole === 'technician' &&
    (inspection.status === 'inspecting' || inspection.status === 'pending_inspection');

  const failCount = inspection.items.filter((i) => i.result === 'fail').length;
  const passCount = inspection.items.filter((i) => i.result === 'pass').length;
  const totalCount = inspection.items.length;

  const roleIcon = () => {
    switch (currentRole) {
      case 'manager': return <HardHat size={20} />;
      case 'dispatcher': return <Truck size={20} />;
      case 'technician': return <Wrench size={20} />;
      case 'driver': return <ClipboardCheck size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                {inspection.inspectionNo}
              </h2>
              <span
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full border',
                  statusInfo.bgColor,
                  statusInfo.color
                )}
              >
                {statusInfo.label}
              </span>
              {inspection.priority !== 'normal' && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded',
                    priorityInfo.bgColor,
                    priorityInfo.color
                  )}
                >
                  {priorityInfo.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {equipment?.name} · {equipment?.model}
            </p>
          </div>
        </div>

        {currentRole === 'technician' &&
          (inspection.status === 'inspecting' || inspection.status === 'pending_inspection') && (
            <Button
              variant={isEditing ? 'primary' : 'outline'}
              onClick={() => setIsEditing(!isEditing)}
              leftIcon={isEditing ? <CheckCircle2 size={16} /> : <Edit3 size={16} />}
            >
              {isEditing ? '完成编辑' : '编辑验机项'}
            </Button>
          )}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between">
            {flowSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = !isDisputed && !isRepairLoop && stepIndex === index;
              const isCompleted = !isDisputed && !isRepairLoop && stepIndex > index;
              const isCurrentRepair = isRepairLoop && index === 2;
              const isDisputedStep = isDisputed && index <= 2;

              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all border-2',
                        isCompleted && 'bg-emerald-500 border-emerald-500 text-white',
                        isActive && 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200',
                        isCurrentRepair && 'bg-orange-500 border-orange-500 text-white',
                        isDisputedStep && !isCompleted && !isActive && 'bg-rose-100 border-rose-300 text-rose-500',
                        !isCompleted && !isActive && !isCurrentRepair && !(isDisputedStep && !isCompleted && !isActive) && 'bg-slate-100 border-slate-200 text-slate-400'
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
                        isCompleted && 'text-emerald-600',
                        isActive && 'text-blue-700',
                        isCurrentRepair && 'text-orange-600',
                        isDisputedStep && !isCompleted && !isActive && 'text-rose-600',
                        !isCompleted && !isActive && !isCurrentRepair && !(isDisputedStep && !isCompleted && !isActive) && 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </span>
                    {(isRepairLoop || isDisputed) && index === 2 && (
                      <span
                        className={cn(
                          'text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium',
                          isRepairLoop && 'bg-orange-100 text-orange-700',
                          isDisputed && 'bg-rose-100 text-rose-700'
                        )}
                      >
                        {isRepairLoop ? '待维修' : '有争议'}
                      </span>
                    )}
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className="flex-1 flex items-center justify-center px-2 -mt-5">
                      <div
                        className={cn(
                          'h-0.5 flex-1 rounded-full',
                          isCompleted && 'bg-emerald-400',
                          isActive && 'bg-slate-200',
                          !isCompleted && !isActive && 'bg-slate-200'
                        )}
                      />
                      <ChevronRight
                        size={14}
                        className={cn(
                          'mx-0.5 flex-shrink-0',
                          isCompleted ? 'text-emerald-400' : 'text-slate-300'
                        )}
                      />
                      <div
                        className={cn(
                          'h-0.5 flex-1 rounded-full',
                          isCompleted && 'bg-emerald-400',
                          !isCompleted && 'bg-slate-200'
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

      {isMyTodo && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 shadow-lg shadow-blue-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0">
              {roleIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-base">当前由您处理</p>
              <p className="text-blue-100 mt-1 text-sm">
                作为{roleMap[currentRole].label}，{getNextStepLabel(inspection.status, currentRole)}
              </p>
            </div>
            {actions.length > 0 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                {currentRole === 'technician' &&
                  (inspection.status === 'inspecting' || inspection.status === 'pending_inspection') && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                      leftIcon={isEditing ? <CheckCircle2 size={16} /> : <Edit3 size={16} />}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                    >
                      {isEditing ? '完成编辑' : '编辑验机项'}
                    </Button>
                  )}
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'primary'}
                    onClick={() => {
                      if (action.navigateTo) {
                        navigate(action.navigateTo);
                      } else {
                        handleAction(action.label, action.status);
                      }
                    }}
                    leftIcon={action.icon ? <action.icon size={16} /> : undefined}
                    className={cn(
                      action.variant === 'primary' && 'bg-white text-blue-700 hover:bg-blue-50 shadow-sm',
                      action.variant === 'danger' && 'bg-rose-500 text-white hover:bg-rose-600 border-0',
                      action.variant === 'outline' && 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    )}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentRole === 'driver' && inspection.status === 'pending_sign' && !isMyTodo && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 shadow-lg shadow-indigo-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white flex-shrink-0">
                <ClipboardCheck size={24} />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">等待您签收</p>
                <p className="text-indigo-100 mt-1">请确认验机结果并签收设备</p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/inspections/${inspection.id}/sign`)}
              className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-md px-8 py-3 text-base font-semibold h-auto"
              rightIcon={<ArrowRight size={18} />}
            >
              前往签收
            </Button>
          </div>
        </div>
      )}

      {inspection.status === 'completed' && inspection.signature && (
        <SignatureSummaryCard
          signature={inspection.signature}
          items={inspection.items}
          onViewReview={() => navigate(`/inspections/${inspection.id}/review`)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoItem label="验机单号" value={inspection.inspectionNo} />
                <InfoItem label="创建时间" value={formatDateTime(inspection.createdAt)} />
                <InfoItem label="创建人" value={inspection.createdBy} icon={User} />
                <InfoItem label="更新时间" value={formatDateTime(inspection.updatedAt)} icon={Clock} />
                <InfoItem label="工地地址" value={inspection.siteAddress} icon={MapPin} />
                <InfoItem
                  label="计划时间"
                  value={inspection.scheduledTime ? formatDateTime(inspection.scheduledTime) : '未安排'}
                  icon={Calendar}
                />
                {inspection.driverName && (
                  <InfoItem label="司机" value={inspection.driverName} icon={User} />
                )}
                <InfoItem
                  label="当前处理人"
                  value={
                    inspection.currentRole === 'manager'
                      ? '租赁经理'
                      : inspection.currentRole === 'dispatcher'
                      ? '调度员'
                      : inspection.currentRole === 'technician'
                      ? '维修师傅'
                      : '司机'
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wrench size={18} className="text-slate-500" />
                  检验项目
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-600">
                    通过 {passCount}/{totalCount}
                  </span>
                  {failCount > 0 && (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      异常 {failCount} 项
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InspectionItems
                items={inspection.items}
                editable={canEditItems}
                onItemChange={handleItemChange}
              />
            </CardContent>
          </Card>

          {inspection.signature && inspection.status !== 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-emerald-500" />
                  司机签收
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                      <span className="text-xs text-slate-400">签名</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-700">{inspection.signature.driverName}</p>
                      <p className="text-sm text-slate-500">
                        签收时间：{formatDateTime(inspection.signature.signedAt)}
                      </p>
                      {inspection.signature.remark && (
                        <p className="text-sm text-slate-500 mt-1">
                          备注：{inspection.signature.remark}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/inspections/${inspection.id}/review`)}
                    rightIcon={<ExternalLink size={14} />}
                  >
                    查看详情
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck size={18} className="text-slate-500" />
                设备信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipment ? (
                <>
                  <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mb-3">
                    <Wrench size={32} className="text-slate-400" />
                  </div>
                  <h4 className="font-medium text-slate-800">{equipment.name}</h4>
                  <p className="text-sm text-slate-500">{equipment.model}</p>
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <InfoItem label="车牌号" value={equipment.plateNumber} />
                    <InfoItem label="设备类型" value={equipment.type} />
                    <InfoItem label="工作时长" value={`${equipment.workHours} 小时`} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">设备信息未找到</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                合同信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contract ? (
                <>
                  <p className="font-medium text-slate-800 text-sm">{contract.contractNo}</p>
                  <p className="text-sm text-slate-600">{contract.lessee}</p>
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <InfoItem label="租期" value={`${formatDate(contract.startDate)} 至 ${formatDate(contract.endDate)}`} />
                    <InfoItem label="合同金额" value={formatMoney(contract.amount)} />
                    <InfoItem label="联系人" value={contract.lesseeContact} icon={Phone} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">合同信息未找到</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={18} className="text-slate-500" />
                处理流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={inspection.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: any;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-700 flex items-center gap-1.5">
        {Icon && <Icon size={14} className="text-slate-400" />}
        {value}
      </p>
    </div>
  );
}
