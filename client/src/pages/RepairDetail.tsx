import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Wrench, FileText, Send, UserCheck, PlayCircle, RotateCcw, Eye, MessageSquare } from 'lucide-react';
import { repairAPI, userAPI } from '../services/api';

const RepairDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repair, setRepair] = useState<any>(null);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [repairForm, setRepairForm] = useState({ repairNote: '', partsUsed: '[]', laborHours: '' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      repairAPI.get(id!),
      userAPI.list({ role: 'TECHNICIAN' })
    ]).then(([data, techs]) => {
      setRepair(data);
      setTechnicians(techs);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  }

  if (!repair) {
    return <div className="text-center py-12 text-gray-500">工单不存在</div>;
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
      PENDING_APPROVAL: { label: '待审批', color: 'bg-purple-100 text-purple-800' },
      APPROVED: { label: '已批准', color: 'bg-blue-100 text-blue-800' },
      ASSIGNED: { label: '已指派', color: 'bg-amber-100 text-amber-800' },
      IN_PROGRESS: { label: '维修中', color: 'bg-orange-100 text-orange-800' },
      COMPLETED: { label: '待复核', color: 'bg-cyan-100 text-cyan-800' },
      REVIEWED: { label: '已完成', color: 'bg-green-100 text-green-800' },
      RETURNED: { label: '已退回', color: 'bg-red-100 text-red-800' },
      REOPENED: { label: '已重开', color: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-500' }
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      LOW: { label: '低', color: 'bg-gray-100 text-gray-700' },
      MEDIUM: { label: '中', color: 'bg-blue-100 text-blue-700' },
      HIGH: { label: '高', color: 'bg-orange-100 text-orange-700' },
      CRITICAL: { label: '紧急', color: 'bg-red-100 text-red-700' }
    };
    return configs[priority] || { label: priority, color: 'bg-gray-100 text-gray-700' };
  };

  const statusConfig = getStatusConfig(repair.status);
  const priorityConfig = getPriorityConfig(repair.priority);

  const canSubmit = repair.status === 'DRAFT' && repair.creatorId === user?.id;
  const canApprove = repair.status === 'PENDING_APPROVAL' && user?.role === 'STORE_MANAGER';
  const canAssign = repair.status === 'APPROVED' && user?.role === 'STORE_MANAGER';
  const canStart = repair.status === 'ASSIGNED' && repair.assignedToId === user?.id;
  const canComplete = repair.status === 'IN_PROGRESS' && repair.assignedToId === user?.id;
  const canReturn = ['COMPLETED', 'IN_PROGRESS'].includes(repair.status) && user?.role === 'STORE_MANAGER';
  const canReview = repair.status === 'COMPLETED' && user?.role === 'STORE_MANAGER';

  const handleSubmit = async () => {
    await repairAPI.submit(id!, { operatorId: user!.id });
    fetchData();
  };

  const handleApprove = async () => {
    await repairAPI.approve(id!, { operatorId: user!.id });
    fetchData();
  };

  const handleAssign = async () => {
    if (!selectedTech) return alert('请选择维修人员');
    await repairAPI.assign(id!, { operatorId: user!.id, assignedToId: selectedTech });
    setAction(null);
    setSelectedTech('');
    fetchData();
  };

  const handleStart = async () => {
    await repairAPI.start(id!, { operatorId: user!.id });
    fetchData();
  };

  const handleComplete = async () => {
    if (!repairForm.repairNote.trim()) return alert('请填写维修说明');
    await repairAPI.complete(id!, {
      operatorId: user!.id,
      repairNote: repairForm.repairNote,
      partsUsed: JSON.parse(repairForm.partsUsed || '[]'),
      laborHours: repairForm.laborHours ? parseFloat(repairForm.laborHours) : null
    });
    setAction(null);
    fetchData();
  };

  const handleReturn = async () => {
    if (!note.trim()) return alert('请填写退回原因');
    await repairAPI.return(id!, { operatorId: user!.id, returnNote: note });
    setAction(null);
    setNote('');
    fetchData();
  };

  const handleReview = async (approved: boolean) => {
    await repairAPI.review(id!, { operatorId: user!.id, reviewNote: note, approved });
    setAction(null);
    setNote('');
    fetchData();
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-800">
        <ArrowLeft size={18} className="mr-1.5" /> 返回
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-800">{repair.title}</h2>
                  <span className={`status-badge ${statusConfig.color}`}>{statusConfig.label}</span>
                  <span className={`status-badge ${priorityConfig.color}`}>{priorityConfig.label}优先级</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Wrench size={14} /> {repair.machine?.machineNo}</span>
                  <span className="flex items-center gap-1"><User size={14} /> 创建人：{repair.creator?.name}</span>
                  {repair.assignedTo && (
                    <span className="flex items-center gap-1"><UserCheck size={14} /> 负责人：{repair.assignedTo?.name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">问题描述</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{repair.description}</p>
          </div>

          {/* Carry over inspection note */}
          {repair.inspectionNoteSnapshot && (
            <div className="card bg-blue-50 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <MessageSquare size={20} /> 关联巡检备注（自动带入）
              </h3>
              <p className="text-blue-700 whitespace-pre-wrap">{repair.inspectionNoteSnapshot}</p>
              {repair.inspection && (
                <button
                  onClick={() => navigate(`/inspections/${repair.inspection.id}`)}
                  className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  <Eye size={14} className="mr-1" /> 查看巡检详情
                </button>
              )}
            </div>
          )}

          {/* Repair result */}
          {(repair.repairNote || repair.status === 'COMPLETED' || repair.status === 'REVIEWED') && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">维修结果</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">维修说明</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{repair.repairNote || '无'}</p>
                </div>
                {repair.partsUsed && repair.partsUsed.length > 0 && (
                  <div>
                    <label className="label">更换配件</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {repair.partsUsed.map((p: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">{p.name} x{p.quantity}</span>
                          <span className="text-gray-500">¥{p.cost}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {repair.laborHours && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">工时</span>
                    <span className="font-medium">{repair.laborHours} 小时</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Return/Review notes */}
          <div className="space-y-4">
            {repair.returnNote && (
              <div className="card bg-red-50 border border-red-100">
                <h3 className="font-semibold text-red-800 mb-2">退回原因</h3>
                <p className="text-red-700">{repair.returnNote}</p>
              </div>
            )}
            {repair.reviewNote && (
              <div className="card bg-green-50 border border-green-100">
                <h3 className="font-semibold text-green-800 mb-2">复核意见</h3>
                <p className="text-green-700">{repair.reviewNote}</p>
              </div>
            )}
          </div>

          {/* Status timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">状态流转记录</h3>
            <div className="space-y-4">
              {repair.statusHistory?.map((log: any, idx: number) => {
                const logStatus = getStatusConfig(log.toStatus);
                return (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        idx === repair.statusHistory.length - 1 ? 'bg-primary-600' : 'bg-gray-300'
                      }`} />
                      {idx < repair.statusHistory.length - 1 && (
                        <div className="w-px h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`status-badge ${logStatus.color}`}>{logStatus.label}</span>
                        {log.note && <span className="text-sm text-gray-600">{log.note}</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {log.operator?.name} · {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">操作</h3>
            <div className="space-y-2">
              {canSubmit && !action && (
                <button onClick={handleSubmit} className="w-full btn btn-primary flex items-center justify-center gap-2">
                  <Send size={16} /> 提交审批
                </button>
              )}
              {canApprove && !action && (
                <button onClick={handleApprove} className="w-full btn btn-primary flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> 审批通过
                </button>
              )}
              {canAssign && !action && (
                <button onClick={() => setAction('assign')} className="w-full btn btn-secondary flex items-center justify-center gap-2">
                  <UserCheck size={16} /> 指派维修人员
                </button>
              )}
              {canStart && !action && (
                <button onClick={handleStart} className="w-full btn btn-primary flex items-center justify-center gap-2">
                  <PlayCircle size={16} /> 开始维修
                </button>
              )}
              {canComplete && !action && (
                <button onClick={() => setAction('complete')} className="w-full btn btn-primary flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> 完成维修
                </button>
              )}
              {canReturn && !action && (
                <button onClick={() => setAction('return')} className="w-full btn btn-warning flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> 退回
                </button>
              )}
              {canReview && !action && (
                <button onClick={() => setAction('review')} className="w-full btn btn-primary flex items-center justify-center gap-2">
                  <FileText size={16} /> 复核
                </button>
              )}
            </div>

            {/* Action forms */}
            {action === 'assign' && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-3">指派维修人员</h4>
                <select
                  value={selectedTech}
                  onChange={e => setSelectedTech(e.target.value)}
                  className="input mb-3"
                >
                  <option value="">请选择维修人员</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={handleAssign} className="flex-1 btn btn-primary">确认指派</button>
                  <button onClick={() => { setAction(null); setSelectedTech(''); }} className="flex-1 btn btn-secondary">取消</button>
                </div>
              </div>
            )}

            {action === 'complete' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">完成维修</h4>
                <div className="space-y-3">
                  <div>
                    <label className="label">维修说明 <span className="text-red-500">*</span></label>
                    <textarea
                      value={repairForm.repairNote}
                      onChange={e => setRepairForm({ ...repairForm, repairNote: e.target.value })}
                      className="input h-24"
                      placeholder="请详细说明维修过程和结果"
                    />
                  </div>
                  <div>
                    <label className="label">更换配件（JSON格式）</label>
                    <textarea
                      value={repairForm.partsUsed}
                      onChange={e => setRepairForm({ ...repairForm, partsUsed: e.target.value })}
                      className="input h-20 font-mono text-xs"
                      placeholder='[{"name":"配件名","quantity":1,"cost":100}]'
                    />
                  </div>
                  <div>
                    <label className="label">工时（小时）</label>
                    <input
                      type="number"
                      step="0.5"
                      value={repairForm.laborHours}
                      onChange={e => setRepairForm({ ...repairForm, laborHours: e.target.value })}
                      className="input"
                      placeholder="如：2"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleComplete} className="flex-1 btn btn-primary">确认完成</button>
                  <button onClick={() => { setAction(null); }} className="flex-1 btn btn-secondary">取消</button>
                </div>
              </div>
            )}

            {action === 'return' && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-3">退回</h4>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="input h-20 mb-3"
                  placeholder="请填写退回原因"
                />
                <div className="flex gap-2">
                  <button onClick={handleReturn} className="flex-1 btn btn-danger">确认退回</button>
                  <button onClick={() => { setAction(null); setNote(''); }} className="flex-1 btn btn-secondary">取消</button>
                </div>
              </div>
            )}

            {action === 'review' && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                <h4 className="font-medium text-primary-800 mb-3">复核处理</h4>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="input h-20 mb-3"
                  placeholder="请填写复核意见"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleReview(true)} className="flex-1 btn btn-primary">通过</button>
                  <button onClick={() => handleReview(false)} className="flex-1 btn btn-danger">不通过</button>
                </div>
                <button onClick={() => { setAction(null); setNote(''); }} className="w-full mt-2 btn btn-secondary">取消</button>
              </div>
            )}
          </div>

          {/* Machine info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">设备信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">设备编号</span>
                <span className="font-medium">{repair.machine?.machineNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">设备名称</span>
                <span className="font-medium">{repair.machine?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">所在区域</span>
                <span className="font-medium">{repair.machine?.area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">当前状态</span>
                <span className="font-medium">
                  {repair.machine?.status === 'IDLE' && '空闲'}
                  {repair.machine?.status === 'IN_USE' && '使用中'}
                  {repair.machine?.status === 'MAINTENANCE' && '维护中'}
                  {repair.machine?.status === 'BROKEN' && '故障'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairDetail;
