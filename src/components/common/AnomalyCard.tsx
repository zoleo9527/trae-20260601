import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  Anomaly,
  ANOMALY_TYPE_COLORS,
  ANOMALY_TYPE_LABELS,
  ROLE_LABELS,
  ANOMALY_STATUS_LABELS,
} from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime, formatStuckHours } from '@/utils/dateUtils';

interface AnomalyCardProps {
  anomaly: Anomaly;
}

export const AnomalyCard: React.FC<AnomalyCardProps> = ({ anomaly }) => {
  const navigate = useNavigate();
  const getEquipmentById = useAppStore((state) => state.getEquipmentById);
  const getCustomerById = useAppStore((state) => state.getCustomerById);
  const getReservationById = useAppStore((state) => state.getReservationById);
  const getContractById = useAppStore((state) => state.getContractById);
  const getRepairById = useAppStore((state) => state.getRepairById);

  let deviceName = '';
  let customerName = '';
  let orderNo = '';
  let detailUrl = '';

  if (anomaly.sourceType === 'reservation') {
    const reservation = getReservationById(anomaly.sourceId);
    if (reservation) {
      orderNo = reservation.reservationNo;
      const equipment = getEquipmentById(reservation.equipmentId);
      const customer = getCustomerById(reservation.customerId);
      deviceName = equipment?.name || '';
      customerName = customer?.name || '';
      detailUrl = `/reservation/${anomaly.sourceId}`;
    }
  } else if (anomaly.sourceType === 'contract') {
    const contract = getContractById(anomaly.sourceId);
    if (contract) {
      orderNo = contract.contractNo;
      const reservation = getReservationById(contract.reservationId);
      if (reservation) {
        const equipment = getEquipmentById(reservation.equipmentId);
        const customer = getCustomerById(reservation.customerId);
        deviceName = equipment?.name || '';
        customerName = customer?.name || '';
      }
      detailUrl = `/contract/${anomaly.sourceId}`;
    }
  } else if (anomaly.sourceType === 'repair') {
    const repair = getRepairById(anomaly.sourceId);
    if (repair) {
      orderNo = repair.repairNo;
      const contract = getContractById(repair.contractId);
      if (contract) {
        const reservation = getReservationById(contract.reservationId);
        if (reservation) {
          const equipment = getEquipmentById(reservation.equipmentId);
          const customer = getCustomerById(reservation.customerId);
          deviceName = equipment?.name || '';
          customerName = customer?.name || '';
        }
      }
      detailUrl = `/repair/${anomaly.sourceId}`;
    }
  }

  const bgColor = ANOMALY_TYPE_COLORS[anomaly.type];
  const isUrgent = anomaly.stuckHours >= 48;

  const statusBg =
    anomaly.status === 'pending'
      ? 'bg-yellow-50 border-yellow-200'
      : anomaly.status === 'processing'
      ? 'bg-blue-50 border-blue-200'
      : 'bg-green-50 border-green-200';

  return (
    <div
      className={`bg-white rounded-lg border-l-4 ${bgColor} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden ${statusBg}`}
      onClick={() => navigate(detailUrl)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span
              className={`${bgColor} text-white text-xs px-2 py-1 rounded font-medium`}
            >
              {ANOMALY_TYPE_LABELS[anomaly.type]}
            </span>
            <span className="text-sm font-bold text-gray-800 font-mono">
              {orderNo}
            </span>
            {isUrgent && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-1 rounded animate-pulse">
                <AlertTriangle size={12} />
                紧急
              </span>
            )}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded font-medium ${
              anomaly.status === 'pending'
                ? 'bg-yellow-200 text-yellow-800'
                : anomaly.status === 'processing'
                ? 'bg-blue-200 text-blue-800'
                : 'bg-green-200 text-green-800'
            }`}
          >
            {ANOMALY_STATUS_LABELS[anomaly.status]}
          </span>
        </div>

        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {anomaly.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              {deviceName}
            </span>
            <span className="flex items-center gap-1">
              <User size={12} />
              {customerName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User size={12} />
              {ROLE_LABELS[anomaly.currentHandler]}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDateTime(anomaly.createdAt)}
            </span>
          </div>
        </div>

        {anomaly.stuckHours > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              已卡顿：
              <span
                className={`font-mono font-bold ${
                  isUrgent ? 'text-red-600 text-base' : 'text-orange-500'
                }`}
              >
                {formatStuckHours(anomaly.stuckHours)}
              </span>
            </span>
            <span className="text-xs text-[#1e3a5f] flex items-center gap-1 font-medium">
              查看详情 <ChevronRight size={14} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
