import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Truck,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Timeline } from '@/components/common/Timeline';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/dateUtils';
import { ROLE_LABELS, ANOMALY_STATUS_LABELS } from '@/types';

const ReservationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getReservationById = useAppStore((state) => state.getReservationById);
  const getEquipmentById = useAppStore((state) => state.getEquipmentById);
  const getCustomerById = useAppStore((state) => state.getCustomerById);
  const getTimelineBySource = useAppStore((state) => state.getTimelineBySource);
  const verifyMaterials = useAppStore((state) => state.verifyMaterials);
  const dispatchReservation = useAppStore((state) => state.dispatchReservation);
  const confirmDelivery = useAppStore((state) => state.confirmDelivery);
  const updateAnomalyStatus = useAppStore((state) => state.updateAnomalyStatus);
  const currentRole = useAppStore((state) => state.currentRole);
  const anomalies = useAppStore((state) => state.anomalies);
  const contracts = useAppStore((state) => state.contracts);

  const [remark, setRemark] = useState('');
  const [selectedMissing, setSelectedMissing] = useState<string[]>([]);

  const reservation = id ? getReservationById(id) : undefined;
  const equipment = reservation ? getEquipmentById(reservation.equipmentId) : undefined;
  const customer = reservation ? getCustomerById(reservation.customerId) : undefined;
  const timeline = reservation
    ? getTimelineBySource('reservation', reservation.id)
    : [];

  const relatedAnomaly = anomalies.find(
    (a) => a.sourceType === 'reservation' && a.sourceId === id
  );

  const requiredMaterials = [
    '营业执照',
    '身份证复印件',
    '项目委托书',
    '押金收据',
  ];

  if (!reservation || !equipment || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">预约单不存在</p>
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

  const handleVerifyMaterials = (verified: boolean) => {
    verifyMaterials(reservation.id, verified, selectedMissing, remark);
    setRemark('');
    setSelectedMissing([]);
  };

  const handleDispatch = () => {
    dispatchReservation(reservation.id, remark);
    setRemark('');
  };

  const handleConfirmDelivery = () => {
    confirmDelivery(reservation.id, remark);
    setRemark('');
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

  const canVerifyMaterials = currentRole === 'dispatcher' && reservation.status === 'pending';
  const canDispatch = currentRole === 'dispatcher' && reservation.status === 'material_verified';
  const canConfirmDelivery = currentRole === 'dispatcher' && reservation.status === 'dispatched';

  const statusLabel = {
    pending: '待核验',
    material_verified: '材料已核验',
    dispatched: '已派车',
    delivered: '已交付',
    completed: '已完成',
    cancelled: '已取消',
  };

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
                设备预约详情
                <span className="text-lg font-mono text-[#1e3a5f]">
                  {reservation.reservationNo}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                当前状态：
                <span className="font-medium text-orange-600">
                  {statusLabel[reservation.status]}
                </span>
                <span className="mx-2">·</span>
                当前处理角色：
                <span className="font-medium text-[#1e3a5f]">
                  {ROLE_LABELS[reservation.currentHandler]}
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
                <FileText size={20} />
                预约信息
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
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">预约租期</label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar size={16} className="text-[#1e3a5f]" />
                    {formatDate(reservation.startDate)} ~{' '}
                    {formatDate(reservation.expectedEndDate)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">日租金</label>
                  <p className="font-medium font-mono text-lg text-orange-600">
                    ¥{equipment.dailyRate.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">用途</label>
                  <p className="text-gray-700">{reservation.purpose}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package size={20} />
                材料核验
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {requiredMaterials.map((material) => {
                  const hasMaterial = reservation.materials.includes(material);
                  const isMissing = reservation.missingMaterials.includes(material);
                  return (
                    <div
                      key={material}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        hasMaterial
                          ? 'bg-green-50 border-green-200'
                          : isMissing
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {hasMaterial ? (
                        <CheckCircle size={18} className="text-green-500" />
                      ) : isMissing ? (
                        <XCircle size={18} className="text-red-500" />
                      ) : (
                        <XCircle size={18} className="text-gray-400" />
                      )}
                      <span
                        className={`text-sm ${
                          hasMaterial
                            ? 'text-green-700'
                            : isMissing
                            ? 'text-red-700'
                            : 'text-gray-500'
                        }`}
                      >
                        {material}
                      </span>
                      {canVerifyMaterials && !hasMaterial && (
                        <input
                          type="checkbox"
                          checked={selectedMissing.includes(material)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMissing([...selectedMissing, material]);
                            } else {
                              setSelectedMissing(
                                selectedMissing.filter((m) => m !== material)
                              );
                            }
                          }}
                          className="ml-auto"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {canVerifyMaterials && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerifyMaterials(true)}
                    disabled={!reservation.materialVerified && reservation.missingMaterials.length === 0 && reservation.materials.length < requiredMaterials.length}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    核验通过
                  </button>
                  <button
                    onClick={() => handleVerifyMaterials(false)}
                    disabled={selectedMissing.length === 0}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    标记缺材料
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Send size={20} />
                调度操作
              </h2>
              <div className="space-y-4">
                {canDispatch && (
                  <button
                    onClick={handleDispatch}
                    className="w-full px-4 py-3 bg-[#1e3a5f] text-white rounded hover:bg-[#2d4a6f] transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    确认派车
                  </button>
                )}
                {canConfirmDelivery && (
                  <button
                    onClick={handleConfirmDelivery}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    确认交付并生成合同
                  </button>
                )}
                {!canDispatch && !canConfirmDelivery && (
                  <p className="text-center text-gray-500 py-4">
                    当前状态：{statusLabel[reservation.status]}，暂无可用操作
                  </p>
                )}
                {(canDispatch || canConfirmDelivery) && (
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="填写操作备注..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                    rows={2}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">操作时间线</h2>
              <Timeline logs={timeline} />
            </div>

            {reservation.status === 'delivered' && (() => {
              const relatedContract = contracts.find((c) => c.reservationId === reservation.id);
              return relatedContract ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-2">
                    该预约单已交付，租期合同已生成：
                    <span className="font-mono font-bold ml-1">{relatedContract.contractNo}</span>
                  </p>
                  <Link
                    to={`/contract/${relatedContract.id}`}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    查看租期合同 →
                  </Link>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;
