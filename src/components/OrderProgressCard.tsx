import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock,
  Edit3,
  FileText,
  MapPin,
  Phone,
  RefreshCw,
  User,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getOrderDetail, updateBlockReason, updateCheckin } from '../api';
import { OrderDetail, ROLE_COLORS, STATUS_COLORS } from '../types';

interface OrderProgressCardProps {
  orderId: number;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function OrderProgressCard({ orderId, onClose, onUpdate }: OrderProgressCardProps) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState(true);
  const [showEditBlockReason, setShowEditBlockReason] = useState(false);
  const [newBlockReason, setNewBlockReason] = useState('');
  const [showEditCheckin, setShowEditCheckin] = useState(false);
  const [checkinRemark, setCheckinRemark] = useState('');
  const [checkinNotArrivedReason, setCheckinNotArrivedReason] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [orderId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await getOrderDetail(orderId);
      setDetail(data);
      setNewBlockReason(data.order.blockReason || '');
      if (data.checkin) {
        setCheckinRemark(data.checkin.remark || '');
        setCheckinNotArrivedReason(data.checkin.notArrivedReason || '');
      }
    } catch (error) {
      console.error('Failed to fetch order detail:', error);
    }
    setLoading(false);
  };

  const handleUpdateBlockReason = async () => {
    if (!detail || !newBlockReason.trim()) return;
    await updateBlockReason(orderId, newBlockReason);
    setShowEditBlockReason(false);
    await fetchDetail();
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleUpdateCheckin = async () => {
    if (!detail?.checkin) return;
    await updateCheckin(detail.checkin.id, {
      status: detail.checkin.status,
      remark: checkinRemark,
      notArrivedReason: checkinNotArrivedReason,
    });
    setShowEditCheckin(false);
    await fetchDetail();
    if (onUpdate) {
      onUpdate();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '已到岗':
      case '已完成':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case '未到岗':
      case '待确认':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case '服务中':
        return <CircleDot className="w-5 h-5 text-purple-500" />;
      case '已排班':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 p-8">
          <div className="text-center text-gray-600">订单不存在</div>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg">关闭</button>
        </div>
      </div>
    );
  }

  const { order, schedule, checkin, logs, handlers } = detail;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">服务推进详情</h3>
            <p className="text-sm text-gray-500">{order.orderNo}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={fetchDetail} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">订单信息</h4>
              <span className={`px-3 py-1 text-sm rounded-full ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">客户</p>
                <p className="font-medium text-gray-800">{order.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500">联系电话</p>
                <p className="font-medium text-gray-800 flex items-center">
                  {order.customerPhone}
                  <a href={`tel:${order.customerPhone}`} className="ml-2 text-blue-600">
                    <Phone className="w-4 h-4" />
                  </a>
                </p>
              </div>
              <div>
                <p className="text-gray-500">服务类型</p>
                <p className="font-medium text-gray-800">{order.serviceType}</p>
              </div>
              <div>
                <p className="text-gray-500">服务时间</p>
                <p className="font-medium text-gray-800">{order.serviceDate} {order.serviceTime}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">服务地址</p>
                <p className="font-medium text-gray-800 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  {order.serviceAddress}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <h4 className="font-medium text-yellow-800">阻塞原因</h4>
              </div>
              <button
                onClick={() => setShowEditBlockReason(true)}
                className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-yellow-700 mt-2">{newBlockReason || order.blockReason || '暂无阻塞原因'}</p>
            {showEditBlockReason && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={2}
                  placeholder="请输入阻塞原因"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowEditBlockReason(false);
                      setNewBlockReason(order.blockReason || '');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdateBlockReason}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-4">处理人员状态</h4>
            <div className="grid grid-cols-3 gap-4">
              {handlers.customerService && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ROLE_COLORS['客服']}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{handlers.customerService.name}</p>
                      <p className="text-xs text-gray-500">客服</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${handlers.customerService.status === '在线' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-sm text-gray-600">{handlers.customerService.currentAction}</span>
                  </div>
                </div>
              )}
              {handlers.housekeeper && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ROLE_COLORS['家政员']}`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{handlers.housekeeper.name}</p>
                      <p className="text-xs text-gray-500">家政员</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${handlers.housekeeper.status === '在线' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-sm text-gray-600">{handlers.housekeeper.currentAction}</span>
                  </div>
                </div>
              )}
              {handlers.qcSupervisor && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ROLE_COLORS['质检主管']}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{handlers.qcSupervisor.name}</p>
                      <p className="text-xs text-gray-500">质检主管</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${handlers.qcSupervisor.status === '在线' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-sm text-gray-600">{handlers.qcSupervisor.currentAction}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {schedule && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">排班记录</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">分配家政员</p>
                  <p className="font-medium text-gray-800">{schedule.staffName || '未分配'} ({schedule.staffNo || '-'})</p>
                  <p className="text-xs text-gray-400">状态: {schedule.staffStatus || '未知'}</p>
                </div>
                <div>
                  <p className="text-gray-500">排班时间</p>
                  <p className="font-medium text-gray-800">{schedule.scheduleDate} {schedule.scheduleTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">排班状态</p>
                  <p className="font-medium text-gray-800 flex items-center">
                    {getStatusIcon(schedule.status)}
                    <span className="ml-2">{schedule.status}</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">创建时间</p>
                  <p className="font-medium text-gray-800">{schedule.createdAt}</p>
                </div>
                {schedule.remark && (
                  <div className="col-span-2">
                    <p className="text-gray-500">备注</p>
                    <p className="text-gray-700">{schedule.remark}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {checkin && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">到岗记录</h4>
                <button
                  onClick={() => setShowEditCheckin(true)}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">到岗状态</p>
                  <p className="font-medium text-gray-800 flex items-center">
                    {getStatusIcon(checkin.status)}
                    <span className="ml-2">{checkin.status}</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">到岗时间</p>
                  <p className="font-medium text-gray-800">{checkin.checkinTime || '未到岗'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">备注</p>
                  <p className="text-gray-700">{checkinRemark || checkin.remark || '-'}</p>
                </div>
                {(checkinNotArrivedReason || checkin.notArrivedReason) && (
                  <div className="col-span-2 bg-yellow-50 p-2 rounded">
                    <p className="text-yellow-700 text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      未到岗原因: {checkinNotArrivedReason || checkin.notArrivedReason}
                    </p>
                  </div>
                )}
              </div>
              {showEditCheckin && (
                <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">备注</label>
                    <textarea
                      value={checkinRemark}
                      onChange={(e) => setCheckinRemark(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="请输入备注"
                    />
                  </div>
                  {(checkin.status === '未到岗' || checkinNotArrivedReason) && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">未到岗原因</label>
                      <textarea
                        value={checkinNotArrivedReason}
                        onChange={(e) => setCheckinNotArrivedReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="请输入未到岗原因"
                      />
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setShowEditCheckin(false);
                        setCheckinRemark(checkin.remark || '');
                        setCheckinNotArrivedReason(checkin.notArrivedReason || '');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleUpdateCheckin}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setExpandedLogs(!expandedLogs)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-800">操作时间线 ({logs.length}条)</h4>
              {expandedLogs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedLogs && (
              <div className="px-4 pb-4">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="relative pl-10">
                        <div className={`absolute left-3 w-3 h-3 rounded-full ${ROLE_COLORS[log.operatorRole || '客服']}`}></div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-800">{log.action}</span>
                              <span className={`px-2 py-0.5 text-xs rounded ${ROLE_COLORS[log.operatorRole || '客服']}`}>
                                {log.operatorRole}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">{log.createdAt}</span>
                          </div>
                          <p className="text-sm text-gray-600">{log.detail}</p>
                          <p className="text-xs text-gray-400 mt-1">操作人: {log.operatorName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}