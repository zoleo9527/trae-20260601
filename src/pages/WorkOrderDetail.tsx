import { useAuthStore } from '@/stores/auth';
import { useWorkOrderStore } from '@/stores/workorder';
import type { PartRequest, SignOffData, WorkOrderStatus } from '@/types';
import { PRIORITY_COLORS, PRIORITY_MAP, SIGN_OFF_STATUS_MAP, STATUS_COLORS, STATUS_MAP } from '@/types';
import { ArrowLeft, CheckCircle, Clock, FileText, Package, Upload, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { workorders, getWorkOrderById, currentWorkOrder, assignTechnician, applyParts, issueParts, submitSignOff, approveSignOff, rejectSignOff, updateWorkOrder, fetchWorkOrders, fetchParts, parts } = useWorkOrderStore();
  const { getTechnicians, currentUser } = useAuthStore();
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [selectedParts, setSelectedParts] = useState<PartRequest[]>([]);
  const [showSignOffModal, setShowSignOffModal] = useState(false);
  const [signOffData, setSignOffData] = useState<SignOffData>({ content: '', partsUsed: [], workingHours: 0, attachments: [] });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveRemark, setApproveRemark] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemark, setRejectRemark] = useState('');
  const [statusHistory, setStatusHistory] = useState<{ status: WorkOrderStatus; time: string }[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);

  const technicians = getTechnicians();

  useEffect(() => {
    fetchWorkOrders();
    fetchParts();
  }, [fetchWorkOrders, fetchParts]);

  useEffect(() => {
    if (workorders.length > 0 && parts.length > 0) {
      setIsDataReady(true);
      if (id) {
        getWorkOrderById(id);
      }
    }
  }, [workorders, parts, id, getWorkOrderById]);

  useEffect(() => {
    if (currentWorkOrder) {
      const history: { status: WorkOrderStatus; time: string }[] = [];
      history.push({ status: 'pending', time: currentWorkOrder.createdAt });
      if (currentWorkOrder.status !== 'pending') {
        history.push({ status: currentWorkOrder.status, time: currentWorkOrder.updatedAt });
      }
      setStatusHistory(history);
    }
  }, [currentWorkOrder]);

  const handleAssign = () => {
    if (selectedTechnician && id) {
      const technician = technicians.find(t => t.id === selectedTechnician);
      if (technician) {
        assignTechnician(id, technician.id, technician.name);
        setShowAssignModal(false);
        setSelectedTechnician('');
      }
    }
  };

  const handleApplyParts = () => {
    if (selectedParts.length > 0 && id) {
      applyParts(id, selectedParts);
      setShowPartsModal(false);
      setSelectedParts([]);
    }
  };

  const handleSubmitSignOff = () => {
    if (signOffData.content && id) {
      submitSignOff(id, signOffData);
      setShowSignOffModal(false);
      setSignOffData({ content: '', partsUsed: [], workingHours: 0, attachments: [] });
    }
  };

  const handleApprove = () => {
    if (id) {
      approveSignOff(id, approveRemark);
      setShowApproveModal(false);
      setApproveRemark('');
    }
  };

  const handleReject = () => {
    if (id && rejectRemark) {
      rejectSignOff(id, rejectRemark);
      setShowRejectModal(false);
      setRejectRemark('');
    }
  };

  const handleAddPartRequest = (partId: string) => {
    const existing = selectedParts.find(p => p.partId === partId);
    if (existing) {
      setSelectedParts(selectedParts.map(p => 
        p.partId === partId ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedParts([...selectedParts, { partId, quantity: 1 }]);
    }
  };

  const handleRemovePartRequest = (partId: string) => {
    setSelectedParts(selectedParts.filter(p => p.partId !== partId));
  };

  const isManager = currentUser?.role === 'manager';
  const isTechnician = currentUser?.role === 'technician';
  const isWarehouse = currentUser?.role === 'warehouse';

  if (!isDataReady) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">工单详情</h1>
            <p className="text-sm text-slate-500">工单编号: {id}</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkOrder) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">工单详情</h1>
            <p className="text-sm text-slate-500">工单编号: {id}</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-slate-500">工单不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">工单详情</h1>
          <p className="text-sm text-slate-500">工单编号: {currentWorkOrder.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${STATUS_COLORS[currentWorkOrder.status]}`}>
                  {STATUS_MAP[currentWorkOrder.status]}
                </span>
                <span className={`ml-2 px-3 py-1 text-sm font-medium rounded ${PRIORITY_COLORS[currentWorkOrder.priority]}`}>
                  {PRIORITY_MAP[currentWorkOrder.priority]}优先级
                </span>
              </div>
              <span className="text-sm text-slate-500">更新于 {currentWorkOrder.updatedAt}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">故障描述</label>
                <p className="text-slate-800 leading-relaxed">{currentWorkOrder.faultDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">设备编号</label>
                  <p className="text-slate-800">{currentWorkOrder.equipmentNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">设备型号</label>
                  <p className="text-slate-800">{currentWorkOrder.model}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">客户名称</label>
                  <p className="text-slate-800">{currentWorkOrder.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">预计完成时间</label>
                  <p className="text-slate-800">{currentWorkOrder.estimatedCompletionTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {currentWorkOrder.assigneeName || '未分配'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600">
                    创建于 {currentWorkOrder.createdAt}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {currentWorkOrder.parts.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Package size={20} />
                  配件清单
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">配件编号</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">配件名称</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">规格</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">数量</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">状态</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWorkOrder.parts.map((part) => (
                    <tr key={part.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-800">{part.partNo}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{part.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{part.specification}</td>
                      <td className="py-3 px-4 text-sm text-center text-slate-800">{part.quantity}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          part.status === 'applied' ? 'bg-yellow-100 text-yellow-800' :
                          part.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {part.status === 'applied' ? '已申请' : part.status === 'issued' ? '已出库' : '已使用'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isWarehouse && part.status === 'applied' && (
                          <button
                            onClick={() => issueParts(currentWorkOrder.id, part.partId)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            确认出库
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {currentWorkOrder.signOff && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText size={20} />
                  复工签认
                </h3>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  currentWorkOrder.signOff.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  currentWorkOrder.signOff.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {SIGN_OFF_STATUS_MAP[currentWorkOrder.signOff.status]}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">签认内容</label>
                  <p className="text-slate-800 leading-relaxed">{currentWorkOrder.signOff.content}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">技师</label>
                    <p className="text-slate-800">{currentWorkOrder.signOff.technicianName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">工时</label>
                    <p className="text-slate-800">{currentWorkOrder.signOff.workingHours} 小时</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">申请时间</label>
                    <p className="text-slate-800">{currentWorkOrder.signOff.applyTime}</p>
                  </div>
                </div>

                {currentWorkOrder.signOff.partsUsed.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">使用配件</label>
                    <div className="flex flex-wrap gap-2">
                      {currentWorkOrder.signOff.partsUsed.map((part, index) => (
                        <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentWorkOrder.signOff.approver && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">审批人</label>
                        <p className="text-slate-800">{currentWorkOrder.signOff.approverName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">审批时间</label>
                        <p className="text-slate-800">{currentWorkOrder.signOff.approveTime}</p>
                      </div>
                      {currentWorkOrder.signOff.remark && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                          <p className="text-slate-800">{currentWorkOrder.signOff.remark}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentWorkOrder.maintenanceRecords.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-4">保养记录</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">日期</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">类型</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">技师</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">内容</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWorkOrder.maintenanceRecords.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm text-slate-800">{record.date}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{record.type}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{record.technician}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{record.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">状态流转</h3>
            <div className="relative">
              {statusHistory.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index === statusHistory.length - 1 ? 'bg-blue-500' : 'bg-slate-300'
                    }`}></div>
                    {index < statusHistory.length - 1 && (
                      <div className="w-0.5 h-6 bg-slate-300"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-slate-800">{STATUS_MAP[item.status]}</p>
                    <p className="text-xs text-slate-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">操作</h3>
            <div className="space-y-2">
              {isManager && !currentWorkOrder.assignee && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User size={18} />
                  分配技师
                </button>
              )}
              
              {isTechnician && currentWorkOrder.status === 'assigned' && (
                <button
                  onClick={() => updateWorkOrder(currentWorkOrder.id, { status: 'diagnosing' as WorkOrderStatus })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText size={18} />
                  开始诊断
                </button>
              )}
              
              {isTechnician && ['diagnosing', 'repairing'].includes(currentWorkOrder.status) && (
                <button
                  onClick={() => setShowPartsModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Package size={18} />
                  申请配件
                </button>
              )}
              
              {isTechnician && currentWorkOrder.status === 'waiting_parts' && (
                <button
                  onClick={() => updateWorkOrder(currentWorkOrder.id, { status: 'repairing' as WorkOrderStatus })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <FileText size={18} />
                  开始维修
                </button>
              )}
              
              {isTechnician && currentWorkOrder.status === 'repairing' && (
                <button
                  onClick={() => setShowSignOffModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <CheckCircle size={18} />
                  提交复工申请
                </button>
              )}
              
              {isManager && currentWorkOrder.signOff?.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={18} />
                    审批通过
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={18} />
                    驳回申请
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">分配技师</h3>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="">选择技师</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedTechnician}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {showPartsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">申请配件</h3>
            
            <div className="flex-1 overflow-y-auto mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">配件编号</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">配件名称</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">库存</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">数量</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => {
                    const selected = selectedParts.find(p => p.partId === part.id);
                    return (
                      <tr key={part.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-800">{part.partNo}</td>
                        <td className="py-3 px-4 text-sm text-slate-800">{part.name}</td>
                        <td className="py-3 px-4 text-sm text-center text-slate-800">{part.stock}</td>
                        <td className="py-3 px-4 text-center">
                          {selected && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              x{selected.quantity}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {selected ? (
                            <button
                              onClick={() => handleRemovePartRequest(part.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            >
                              移除
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddPartRequest(part.id)}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                            >
                              添加
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowPartsModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleApplyParts}
                disabled={selectedParts.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认申请
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignOffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">提交复工申请</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">维修内容</label>
                <textarea
                  value={signOffData.content}
                  onChange={(e) => setSignOffData({ ...signOffData, content: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
                  placeholder="请描述维修内容..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">使用配件</label>
                <div className="flex flex-wrap gap-2">
                  {currentWorkOrder.parts.map((part) => (
                    <span key={part.id} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                      {part.name} x{part.quantity}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">工时 (小时)</label>
                <input
                  type="number"
                  value={signOffData.workingHours}
                  onChange={(e) => setSignOffData({ ...signOffData, workingHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">上传附件</label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                  <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">点击或拖拽上传文件</p>
                  <p className="text-xs text-slate-400 mt-1">支持 jpg, png, pdf 格式</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSignOffModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSubmitSignOff}
                disabled={!signOffData.content}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">审批通过</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">备注 (可选)</label>
              <textarea
                value={approveRemark}
                onChange={(e) => setApproveRemark(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                placeholder="输入备注..."
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">驳回申请</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">驳回原因</label>
              <textarea
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                placeholder="请输入驳回原因..."
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectRemark}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
