import { useState } from 'react';
import {
  X,
  User,
  Clock,
  MapPin,
  AlertTriangle,
  Check,
  XCircle,
  Eye,
  Package,
  History,
  Zap,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Send,
} from 'lucide-react';
import { useSurgeryStore } from '@/store/useSurgeryStore';
import { statusLabels, statusDotColors, formatTime, roleLabels } from '@/utils/status';
import { cn } from '@/lib/utils';
import type { Surgery } from '@/types';

interface Props {
  surgeryId: string;
  onClose: () => void;
}

const presetExceptions = [
  {
    type: 'lens_mismatch',
    title: '晶体度数不符',
    description: '预留晶体度数与术前检查结果存在偏差，请重新核对患者验光数据后提交',
  },
  {
    type: 'material_shortage',
    title: '耗材库存不足',
    description: '手术所需耗材库存不足，当前库存无法满足手术需求，请紧急补充',
  },
  {
    type: 'verification_rejected',
    title: '核销数据异常',
    description: '耗材核销数据与实际使用情况不符，存在数量差异，请护士重新核对',
  },
];

export default function SurgeryDetail({ surgeryId, onClose }: Props) {
  const {
    surgeries,
    currentRole,
    confirmLens,
    rejectLens,
    verifyConsumption,
    rejectConsumption,
    triggerException,
  } = useSurgeryStore();
  const [activeTab, setActiveTab] = useState<'lens' | 'material' | 'history'>('lens');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectType, setRejectType] = useState<'lens' | 'material'>('lens');
  const [showExceptionMenu, setShowExceptionMenu] = useState(false);

  const surgery = surgeries.find((s) => s.id === surgeryId);

  if (!surgery) return null;

  const handleConfirmLens = () => {
    confirmLens(surgeryId);
  };

  const handleRejectLens = () => {
    if (rejectReason.trim()) {
      rejectLens(surgeryId, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const handleVerifyConsumption = () => {
    verifyConsumption(surgeryId);
  };

  const handleRejectConsumption = () => {
    if (rejectReason.trim()) {
      rejectConsumption(surgeryId, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const handlePresetException = (preset: (typeof presetExceptions)[0]) => {
    triggerException(surgeryId, preset.type, preset.title, preset.description);
    setShowExceptionMenu(false);
  };

  const openRejectModal = (type: 'lens' | 'material') => {
    setRejectType(type);
    setShowRejectModal(true);
  };

  const getCurrentHandler = (s: Surgery): string => {
    switch (s.status) {
      case 'scheduled':
        return s.nurseName + ' (' + roleLabels.nurse + ')';
      case 'applying':
        return s.nurseName + ' (' + roleLabels.nurse + ')';
      case 'lens_pending':
        return s.doctorName + ' (' + roleLabels.doctor + ')';
      case 'lens_confirmed':
        return s.doctorName + ' (' + roleLabels.doctor + ')';
      case 'in_progress':
        return s.doctorName + ' (' + roleLabels.doctor + ')';
      case 'verifying':
        return (s.followupName || '待分配') + ' (' + roleLabels.followup + ')';
      case 'exception':
        return '管理员 (' + roleLabels.admin + ')';
      case 'completed':
        return '已完成';
      default:
        return '未知';
    }
  };

  const getBlockedReason = (s: Surgery): string => {
    if (s.status === 'lens_pending') {
      return '等待主刀医生确认晶体预留信息';
    }
    if (s.status === 'verifying') {
      return '等待随访专员复核耗材核销数据';
    }
    if (s.status === 'exception') {
      const activeException = s.exceptions.find((e) => e.status !== 'resolved');
      return activeException?.description || '存在异常待处理';
    }
    return '流程正常进行中';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">手术详情</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {surgery.patientName[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{surgery.patientName}</h3>
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    statusDotColors[surgery.status]
                  )}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{surgery.surgeryType}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {surgery.patientAge}岁 / {surgery.patientGender === 'male' ? '男' : '女'}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {surgery.eye === 'left'
                    ? '左眼'
                    : surgery.eye === 'right'
                    ? '右眼'
                    : '双眼'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 bg-amber-50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">当前处理人</span>
          </div>
          <p className="text-amber-900 font-medium">{getCurrentHandler(surgery)}</p>
          <div className="mt-2 pt-2 border-t border-amber-200">
            <p className="text-xs text-amber-700">
              <span className="font-medium">流程状态：</span>
              {getBlockedReason(surgery)}
            </p>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">手术信息</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                手术时间
              </span>
              <span className="text-gray-900 font-medium">
                {formatTime(surgery.scheduledTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                手术室
              </span>
              <span className="text-gray-900 font-medium">{surgery.room}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">主刀医生</span>
              <span className="text-gray-900 font-medium">{surgery.doctorName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">手术护士</span>
              <span className="text-gray-900 font-medium">{surgery.nurseName}</span>
            </div>
            {surgery.followupName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">随访专员</span>
                <span className="text-gray-900 font-medium">{surgery.followupName}</span>
              </div>
            )}
          </div>
        </div>

        {surgery.exceptions.filter((e) => e.status !== 'resolved').length > 0 && (
          <div className="p-4 border-b border-gray-100 bg-red-50 animate-pulse-fast">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">存在未处理异常</span>
            </div>
            {surgery.exceptions
              .filter((e) => e.status !== 'resolved')
              .map((e) => (
                <div key={e.id} className="text-sm text-red-600 bg-red-100/50 p-2 rounded">
                  • {e.title}
                </div>
              ))}
          </div>
        )}

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('lens')}
              className={cn(
                'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'lens'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              晶体预留
            </button>
            <button
              onClick={() => setActiveTab('material')}
              className={cn(
                'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'material'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              耗材核销
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              状态时间线
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'lens' && (
            <div>
              {surgery.lensReservation ? (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">晶体型号</span>
                      <span className="font-medium">{surgery.lensReservation.lensModel}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">晶体度数</span>
                      <span className="font-medium">{surgery.lensReservation.lensPower}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">预留状态</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          surgery.lensReservation.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : surgery.lensReservation.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {surgery.lensReservation.status === 'confirmed'
                          ? '已确认'
                          : surgery.lensReservation.status === 'rejected'
                          ? '已退回'
                          : '待确认'}
                      </span>
                    </div>
                    {surgery.lensReservation.rejectedReason && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <span className="font-medium">退回原因：</span>
                          {surgery.lensReservation.rejectedReason}
                        </p>
                      </div>
                    )}
                    {surgery.lensReservation.confirmedAt && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          确认时间：{formatTime(surgery.lensReservation.confirmedAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {currentRole === 'doctor' && surgery.lensReservation.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirmLens}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        确认预留
                      </button>
                      <button
                        onClick={() => openRejectModal('lens')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        退回申请
                      </button>
                    </div>
                  )}

                  {surgery.lensReservation.status === 'rejected' && currentRole === 'nurse' && (
                    <button
                      onClick={() => triggerException(
                        surgeryId,
                        'lens_mismatch',
                        '重新提交晶体申请',
                        '已重新核对患者数据，再次提交晶体预留申请'
                      )}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重新提交申请
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无晶体预留信息</p>
                  {currentRole === 'nurse' && (
                    <button
                      onClick={() => triggerException(
                        surgeryId,
                        'other',
                        '提交晶体预留',
                        '护士已提交晶体预留申请，请医生确认'
                      )}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      提交晶体预留申请
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'material' && (
            <div>
              {surgery.materialConsumption ? (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">核销状态</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          surgery.materialConsumption.status === 'verified'
                            ? 'bg-green-100 text-green-700'
                            : surgery.materialConsumption.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : surgery.materialConsumption.status === 'submitted'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {surgery.materialConsumption.status === 'verified'
                          ? '已复核'
                          : surgery.materialConsumption.status === 'rejected'
                          ? '已退回'
                          : surgery.materialConsumption.status === 'submitted'
                          ? '待复核'
                          : '草稿'}
                      </span>
                    </div>
                    {surgery.materialConsumption.rejectedReason && (
                      <p className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded">
                        <span className="font-medium">退回原因：</span>
                        {surgery.materialConsumption.rejectedReason}
                      </p>
                    )}
                    {surgery.materialConsumption.submittedAt && (
                      <p className="text-xs text-gray-400">
                        提交时间：{formatTime(surgery.materialConsumption.submittedAt)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {surgery.materialConsumption.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {item.quantity} {item.unit}
                          </span>
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              item.status === 'used'
                                ? 'bg-green-500'
                                : item.status === 'shortage'
                                ? 'bg-red-500'
                                : 'bg-gray-400'
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {currentRole === 'followup' &&
                    surgery.materialConsumption.status === 'submitted' && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleVerifyConsumption}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          通过核销
                        </button>
                        <button
                          onClick={() => openRejectModal('material')}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          退回修正
                        </button>
                      </div>
                    )}

                  {surgery.materialConsumption.status === 'rejected' && currentRole === 'nurse' && (
                    <button
                      onClick={() => triggerException(
                        surgeryId,
                        'verification_rejected',
                        '重新提交核销',
                        '已修正核销数据，重新提交复核申请'
                      )}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      重新提交核销
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无耗材核销信息</p>
                  {currentRole === 'nurse' && surgery.status !== 'scheduled' && (
                    <button
                      onClick={() => triggerException(
                        surgeryId,
                        'other',
                        '提交耗材核销',
                        '护士已提交耗材核销，请随访专员复核'
                      )}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      提交耗材核销
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-0">
              {surgery.statusHistory.slice().reverse().map((record, index, array) => (
                <div key={record.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full border-2 border-white shadow-sm',
                        statusDotColors[record.status]
                      )}
                    />
                    {index < array.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {statusLabels[record.status]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(record.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {record.operatorName} ({roleLabels[record.operatorRole]})
                    </p>
                    {record.remark && (
                      <p className="text-sm text-gray-600 mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                        {record.remark}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="relative">
          <button
            onClick={() => setShowExceptionMenu(!showExceptionMenu)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
          >
            <Zap className="w-4 h-4" />
            触发演示异常
            {showExceptionMenu ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showExceptionMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-fade-in">
              {presetExceptions.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetException(preset)}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <p className="text-sm font-medium text-red-700">{preset.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {rejectType === 'lens' ? '退回晶体预留' : '退回核销申请'}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入退回原因..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={rejectType === 'lens' ? handleRejectLens : handleRejectConsumption}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
