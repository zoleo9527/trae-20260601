import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  User,
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Camera,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Timeline } from '@/components/common/Timeline';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/dateUtils';
import { ROLE_LABELS, ANOMALY_STATUS_LABELS } from '@/types';

const RepairDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getRepairById = useAppStore((state) => state.getRepairById);
  const getContractById = useAppStore((state) => state.getContractById);
  const getReservationById = useAppStore((state) => state.getReservationById);
  const getEquipmentById = useAppStore((state) => state.getEquipmentById);
  const getCustomerById = useAppStore((state) => state.getCustomerById);
  const getTimelineBySource = useAppStore((state) => state.getTimelineBySource);
  const updateRepair = useAppStore((state) => state.updateRepair);
  const setLiability = useAppStore((state) => state.setLiability);
  const reviewRepair = useAppStore((state) => state.reviewRepair);
  const updateAnomalyStatus = useAppStore((state) => state.updateAnomalyStatus);
  const currentRole = useAppStore((state) => state.currentRole);
  const anomalies = useAppStore((state) => state.anomalies);

  const [repairContent, setRepairContent] = useState('');
  const [partsInput, setPartsInput] = useState('');
  const [repairCost, setRepairCost] = useState(0);
  const [remark, setRemark] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const repair = id ? getRepairById(id) : undefined;
  const contract = repair ? getContractById(repair.contractId) : undefined;
  const reservation = contract ? getReservationById(contract.reservationId) : undefined;
  const equipment = reservation ? getEquipmentById(reservation.equipmentId) : undefined;
  const customer = reservation ? getCustomerById(reservation.customerId) : undefined;

  const timeline = repair ? getTimelineBySource('repair', repair.id) : [];

  const relatedAnomaly = anomalies.find(
    (a) => a.sourceType === 'repair' && a.sourceId === id
  );

  if (!repair || !contract || !reservation || !equipment || !customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">维修记录不存在</p>
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

  const handleUpdateRepair = () => {
    const parts = partsInput.split(',').map((p) => p.trim()).filter(Boolean);
    updateRepair(repair.id, repairContent, parts, repairCost, remark);
    setRepairContent('');
    setPartsInput('');
    setRepairCost(0);
    setRemark('');
  };

  const handleSetLiability = (liability: 'customer' | 'owner' | 'natural') => {
    setLiability(repair.id, liability, remark);
    setRemark('');
  };

  const handleReview = (approved: boolean) => {
    reviewRepair(repair.id, approved, reviewComment, remark);
    setReviewComment('');
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

  const canUpdateRepair = currentRole === 'repairer' && !repair.repairContent;
  const canSetLiability = currentRole === 'repairer' && repair.repairContent && !repair.liability;
  const canReview = currentRole === 'manager' && repair.liability && repair.reviewStatus === 'pending';

  const liabilityOptions = [
    { value: 'customer' as const, label: '客户责任', color: 'border-red-500 bg-red-50', textColor: 'text-red-700' },
    { value: 'owner' as const, label: '租赁方责任', color: 'border-blue-500 bg-blue-50', textColor: 'text-blue-700' },
    { value: 'natural' as const, label: '自然损耗', color: 'border-gray-500 bg-gray-50', textColor: 'text-gray-700' },
  ];

  const statusLabel = {
    pending: '待复核',
    approved: '已通过',
    rejected: '已驳回',
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
                维修记录详情
                <span className="text-lg font-mono text-[#1e3a5f]">
                  {repair.repairNo}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                关联合同：{contract.contractNo}
                <span className="mx-2">·</span>
                复核状态：
                <span
                  className={`font-medium ${
                    repair.reviewStatus === 'approved'
                      ? 'text-green-600'
                      : repair.reviewStatus === 'rejected'
                      ? 'text-red-600'
                      : 'text-orange-600'
                  }`}
                >
                  {statusLabel[repair.reviewStatus]}
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
                <Wrench size={20} />
                报修信息
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
                  <label className="text-xs text-gray-500 block mb-1">报修时间</label>
                  <p className="font-medium flex items-center gap-2">
                    <Clock size={16} className="text-[#1e3a5f]" />
                    {formatDate(repair.reportDate)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">维修师傅</label>
                  <p className="font-medium">{repair.repairer}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">故障描述</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {repair.faultDescription}
                  </p>
                </div>
              </div>
            </div>

            {repair.repairContent && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Wrench size={20} />
                  维修处理结果
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">维修内容</label>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {repair.repairContent}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">更换配件</label>
                    <div className="flex flex-wrap gap-2">
                      {repair.partsReplaced.map((part, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">维修费用</label>
                    <p className="text-2xl font-bold text-orange-600 font-mono">
                      ¥{repair.repairCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canUpdateRepair && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Wrench size={20} />
                  登记维修结果
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">维修内容</label>
                    <textarea
                      value={repairContent}
                      onChange={(e) => setRepairContent(e.target.value)}
                      placeholder="请详细描述维修过程..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">更换配件（用逗号分隔）</label>
                    <input
                      type="text"
                      value={partsInput}
                      onChange={(e) => setPartsInput(e.target.value)}
                      placeholder="例：液压油泵密封圈,高压油管接头"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">维修费用（元）</label>
                    <input
                      type="number"
                      value={repairCost}
                      onChange={(e) => setRepairCost(Number(e.target.value))}
                      placeholder="请输入维修费用"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">备注</label>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="填写备注信息..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={handleUpdateRepair}
                    disabled={!repairContent || repairCost <= 0}
                    className="w-full px-4 py-3 bg-[#1e3a5f] text-white rounded hover:bg-[#2d4a6f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    提交维修结果
                  </button>
                </div>
              </div>
            )}

            {repair.liability && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign size={20} />
                  责任认定
                </h2>
                <div
                  className={`p-4 rounded-lg border-2 ${
                    repair.liability === 'customer'
                      ? 'border-red-500 bg-red-50'
                      : repair.liability === 'owner'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-500 bg-gray-50'
                  }`}
                >
                  <p
                    className={`font-bold ${
                      repair.liability === 'customer'
                        ? 'text-red-700'
                        : repair.liability === 'owner'
                        ? 'text-blue-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {repair.liability === 'customer'
                      ? '客户责任'
                      : repair.liability === 'owner'
                      ? '租赁方责任'
                      : '自然损耗'}
                  </p>
                  {repair.reviewComment && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">复核意见：</span>
                        {repair.reviewComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {canSetLiability && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign size={20} />
                  责任认定
                </h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {liabilityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSetLiability(option.value)}
                      className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${option.color}`}
                    >
                      <p className={`font-medium ${option.textColor}`}>{option.label}</p>
                    </button>
                  ))}
                </div>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="填写责任认定说明..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] mb-4"
                  rows={2}
                />
              </div>
            )}

            {canReview && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  经理复核
                </h2>
                <div className="mb-4">
                  <label className="text-sm text-gray-600 block mb-2">复核意见</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="请填写复核意见..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleReview(false)}
                    disabled={!reviewComment}
                    className="px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={18} />
                    驳回
                  </button>
                  <button
                    onClick={() => handleReview(true)}
                    className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    通过
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Camera size={20} />
                维修照片
              </h2>
              {repair.photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {repair.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                    >
                      <Camera size={32} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  暂无照片
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">操作时间线</h2>
              <Timeline logs={timeline} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairDetail;
