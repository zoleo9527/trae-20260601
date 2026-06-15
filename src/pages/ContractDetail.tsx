import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Truck,
  FileText,
  Fuel,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  History,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Timeline } from '@/components/common/Timeline';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, calculateDaysBetween, getContractDisplayInfo } from '@/utils/dateUtils';
import { ROLE_LABELS, ANOMALY_STATUS_LABELS } from '@/types';

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getContractById = useAppStore((state) => state.getContractById);
  const getReservationById = useAppStore((state) => state.getReservationById);
  const getEquipmentById = useAppStore((state) => state.getEquipmentById);
  const getCustomerById = useAppStore((state) => state.getCustomerById);
  const getTimelineBySource = useAppStore((state) => state.getTimelineBySource);
  const getRepairById = useAppStore((state) => state.getRepairById);
  const updateFuel = useAppStore((state) => state.updateFuel);
  const confirmReturn = useAppStore((state) => state.confirmReturn);
  const updateAnomalyStatus = useAppStore((state) => state.updateAnomalyStatus);
  const currentRole = useAppStore((state) => state.currentRole);
  const anomalies = useAppStore((state) => state.anomalies);
  const repairs = useAppStore((state) => state.repairs);

  const [returnFuel, setReturnFuel] = useState<number>(30);
  const [hasDispute, setHasDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [remark, setRemark] = useState('');

  const contract = id ? getContractById(id) : undefined;
  const reservation = contract ? getReservationById(contract.reservationId) : undefined;
  const equipment = reservation ? getEquipmentById(reservation.equipmentId) : undefined;
  const customer = reservation ? getCustomerById(reservation.customerId) : undefined;

  const contractTimeline = contract ? getTimelineBySource('contract', contract.id) : [];
  const reservationTimeline = reservation
    ? getTimelineBySource('reservation', reservation.id)
    : [];

  const allTimeline = useMemo(() => {
    return [...reservationTimeline, ...contractTimeline].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [reservationTimeline, contractTimeline]);

  const relatedAnomaly = anomalies.find(
    (a) => a.sourceType === 'contract' && a.sourceId === id
  );

  const relatedRepairs = repairs.filter((r) => r.contractId === id);

  const displayInfo = contract && reservation && equipment && customer
    ? getContractDisplayInfo({ contract, reservation, equipment, customer })
    : null;

  const fuelConsumed = contract?.initialFuel && contract?.returnFuel
    ? contract.initialFuel - contract.returnFuel
    : contract?.initialFuel && returnFuel
    ? contract.initialFuel - returnFuel
    : 0;

  if (!contract || !reservation || !equipment || !customer || !displayInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">合同不存在</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmReturn = () => {
    confirmReturn(contract.id, remark);
    setRemark('');
  };

  const handleUpdateFuel = () => {
    updateFuel(contract.id, returnFuel, hasDispute, disputeReason, remark);
    setRemark('');
    setDisputeReason('');
  };

  const handleAnomalyProcess = () => {
    if (relatedAnomaly) {
      updateAnomalyStatus(relatedAnomaly.id, 'processing', remark);
      setRemark('');
    }
  };

  const handleAnomalyResolve = () => {
    if (relatedAnomaly) {
      updateAnomalyStatus(relatedAnomaly.id, 'resolved', remark);
      setRemark('');
    }
  };

  const canConfirmReturn = currentRole === 'dispatcher' && (contract.status === 'active' || contract.status === 'overdue');
  const canUpdateFuel = currentRole === 'dispatcher' && contract.status === 'returned';

  const progressPercent = Math.min(100, (displayInfo.rentalDays / (displayInfo.rentalDays + displayInfo.overdueDays || 1)) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            返回异常单看板
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                租期合同详情
                <span className="text-lg font-mono text-[#1e3a5f]">
                  {contract.contractNo}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                关联预约：{displayInfo.reservationNo}
                <span className="mx-2">·</span>
                当前状态：
                <span
                  className={`font-medium ${
                    displayInfo.displayStatus === 'overdue' ? 'text-red-600' : displayInfo.displayStatus === 'completed' ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {displayInfo.displayStatusLabel}
                </span>
              </p>
            </div>
          </div>
        </div>

        {relatedAnomaly && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge type={relatedAnomaly.type} />
                    <span className="text-sm">
                      {ANOMALY_STATUS_LABELS[relatedAnomaly.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{relatedAnomaly.description}</p>
                  {relatedAnomaly.comments && (
                    <p className="text-xs text-gray-500 mt-1">
                      备注：{relatedAnomaly.comments}
                    </p>
                  )}
                </div>
              </div>
              {currentRole === relatedAnomaly.currentHandler && (
                <div className="flex gap-2">
                  {relatedAnomaly.status === 'pending' && (
                    <button
                      onClick={handleAnomalyProcess}
                      className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                      开始处理
                    </button>
                  )}
                  {relatedAnomaly.status === 'processing' && (
                    <button
                      onClick={handleAnomalyResolve}
                      className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                    >
                      标记解决
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={20} />
                租期跟踪
              </h2>
              <div className="mb-4">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    <div
                      className="bg-[#1e3a5f] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                    {displayInfo.overdueDays > 0 && (
                      <div className="bg-red-500 flex-1 animate-pulse" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500">
                    起租：{formatDate(displayInfo.actualStartDate)}
                  </span>
                  <span className="text-gray-500">
                    应还：{formatDate(displayInfo.expectedEndDate)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">已租用</p>
                  <p className="text-xl font-bold font-mono text-[#1e3a5f]">{displayInfo.rentalDays}</p>
                  <p className="text-xs text-gray-500">天</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">超期</p>
                  <p className={`text-xl font-bold font-mono ${displayInfo.overdueDays > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {displayInfo.overdueDays}
                  </p>
                  <p className="text-xs text-gray-500">天</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">日租金</p>
                  <p className="text-xl font-bold font-mono text-orange-600">
                    ¥{displayInfo.dailyRate.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">当前总额</p>
                  <p className="text-xl font-bold font-mono text-blue-600">
                    ¥{displayInfo.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              {displayInfo.overdueDays > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    设备已超期 {displayInfo.overdueDays} 天，产生超期费用 ¥{displayInfo.overdueFee.toLocaleString()}
                    （按日租金1.5倍计算）
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} />
                合同信息
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">设备</label>
                  <p className="font-medium flex items-center gap-2">
                    <Truck size={16} className="text-[#1e3a5f]" />
                    {equipment.name} {equipment.model}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">
                    {equipment.plateNumber}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">客户</label>
                  <p className="font-medium flex items-center gap-2">
                    <User size={16} className="text-[#1e3a5f]" />
                    {customer.name}
                  </p>
                  <p className="text-sm text-gray-500">{customer.company}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">用途</label>
                  <p className="text-gray-700">{reservation.purpose}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">实际租期</label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar size={16} className="text-[#1e3a5f]" />
                    {formatDate(contract.actualStartDate)} ~{' '}
                    {contract.actualEndDate ? formatDate(contract.actualEndDate) : '进行中'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Fuel size={20} />
                油耗管理
              </h2>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">出库油位</p>
                  <div className="relative h-32 w-full bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-500"
                      style={{ height: `${contract.initialFuel}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white drop-shadow">
                      {contract.initialFuel}%
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">入库油位</p>
                  <div className="relative h-32 w-full bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-orange-500 transition-all duration-500"
                      style={{ height: `${contract.returnFuel || returnFuel}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white drop-shadow">
                      {contract.returnFuel || returnFuel}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">油耗</span>
                  <span className="text-xl font-bold font-mono text-orange-600">
                    {fuelConsumed}%
                  </span>
                </div>
                {contract.fuelDispute && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      油耗争议：{contract.fuelDisputeReason}
                    </p>
                  </div>
                )}
              </div>

              {canUpdateFuel && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">
                      入库油位：{returnFuel}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={returnFuel}
                      onChange={(e) => setReturnFuel(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasDispute}
                      onChange={(e) => setHasDispute(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">标记油耗争议</span>
                  </label>
                  {hasDispute && (
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="请填写争议原因..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                      rows={2}
                    />
                  )}
                  <button
                    onClick={handleUpdateFuel}
                    className="w-full px-4 py-2 bg-[#1e3a5f] text-white rounded hover:bg-[#2d4a6f] transition-colors"
                  >
                    确认油耗
                  </button>
                </div>
              )}
            </div>

            {canConfirmReturn && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">操作</h2>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="填写归还备注..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] mb-4"
                  rows={2}
                />
                <button
                  onClick={handleConfirmReturn}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  确认设备归还
                </button>
              </div>
            )}

            {relatedRepairs.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign size={20} />
                  关联维修记录
                </h2>
                <div className="space-y-3">
                  {relatedRepairs.map((repair) => (
                    <div
                      key={repair.id}
                      className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-mono text-sm text-[#1e3a5f]">
                          {repair.repairNo}
                        </p>
                        <p className="text-sm text-gray-600">{repair.faultDescription}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">
                          ¥{repair.repairCost.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          责任：
                          {repair.liability === 'customer'
                            ? '客户'
                            : repair.liability === 'owner'
                            ? '租赁方'
                            : repair.liability === 'natural'
                            ? '自然损耗'
                            : '待认定'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <History size={20} />
                合同回看（全流程）
              </h2>
              <Timeline logs={allTimeline} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;
