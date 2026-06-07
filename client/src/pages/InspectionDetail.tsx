import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, FileText, Clock, User, AlertTriangle, Wrench, Plus, MessageSquare, ChevronRight } from 'lucide-react';
import { inspectionAPI, repairAPI, machineAPI } from '../services/api';

const InspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [checkItems, setCheckItems] = useState<any>({});
  const [overallNote, setOverallNote] = useState('');
  const [machines, setMachines] = useState<any[]>([]);
  const [showCreateRepair, setShowCreateRepair] = useState(false);
  const [repairForm, setRepairForm] = useState({ title: '', description: '', priority: 'MEDIUM' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      inspectionAPI.get(id!),
      machineAPI.list()
    ]).then(([data, machinesData]) => {
      setInspection(data);
      setMachines(machinesData);
      setCheckItems(data.checkItems || {});
      setOverallNote(data.overallNote || '');
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  }

  if (!inspection) {
    return <div className="text-center py-12 text-gray-500">巡检记录不存在</div>;
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      PENDING: { label: '待处理', color: 'bg-gray-100 text-gray-800' },
      IN_PROGRESS: { label: '进行中', color: 'bg-blue-100 text-blue-800' },
      COMPLETED: { label: '待复核', color: 'bg-purple-100 text-purple-800' },
      RETURNED: { label: '已退回', color: 'bg-red-100 text-red-800' },
      SUPPLEMENTED: { label: '已补录', color: 'bg-amber-100 text-amber-800' },
      REVIEWED: { label: '已复核', color: 'bg-green-100 text-green-800' }
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const statusConfig = getStatusConfig(inspection.status);
  const canReturn = ['COMPLETED', 'SUPPLEMENTED'].includes(inspection.status) && user?.role === 'STORE_MANAGER';
  const canSupplement = inspection.status === 'RETURNED' && user?.role === 'NETWORK_ADMIN';
  const canReview = ['COMPLETED', 'SUPPLEMENTED'].includes(inspection.status) && user?.role === 'STORE_MANAGER';
  const canCreateRepair = inspection.hasIssue && ['COMPLETED', 'SUPPLEMENTED', 'REVIEWED'].includes(inspection.status) &&
    (user?.role === 'NETWORK_ADMIN' || user?.role === 'STORE_MANAGER');

  const handleReturn = async () => {
    if (!note.trim()) return alert('请填写退回原因');
    await inspectionAPI.return(id!, { returnNote: note, operatorId: user!.id });
    setAction(null);
    setNote('');
    fetchData();
  };

  const handleSupplement = async () => {
    await inspectionAPI.supplement(id!, {
      supplementNote: note,
      checkItems,
      overallNote,
      hasIssue: Object.values(checkItems).some(v => v === false),
      operatorId: user!.id
    });
    setAction(null);
    setNote('');
    fetchData();
  };

  const handleReview = async (approved: boolean) => {
    await inspectionAPI.review(id!, { reviewNote: note, operatorId: user!.id, approved });
    setAction(null);
    setNote('');
    fetchData();
  };

  const handleCreateRepair = async () => {
    if (!repairForm.title.trim() || !repairForm.description.trim()) return alert('请填写完整信息');
    const newRepair = await repairAPI.create({
      machineId: inspection.machineId,
      creatorId: user!.id,
      inspectionId: inspection.id,
      title: repairForm.title,
      description: repairForm.description,
      priority: repairForm.priority,
      carryOverInspectionNote: true
    });
    navigate(`/repairs/${newRepair.id}`);
  };

  const checkItemLabels: Record<string, string> = {
    systemBoot: '系统启动',
    displayNormal: '显示正常',
    keyboardMouse: '键鼠正常',
    networkStable: '网络稳定',
    gameLaunch: '游戏启动',
    peripherals: '外设完好',
    cleanliness: '设备清洁'
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-800">
        <ArrowLeft size={18} className="mr-1.5" /> 返回
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    {inspection.machine?.machineNo} - {inspection.machine?.name}
                  </h2>
                  <span className={`status-badge ${statusConfig.color}`}>{statusConfig.label}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><User size={14} /> 巡检人：{inspection.inspector?.name}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {new Date(inspection.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              {inspection.hasIssue && (
                <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm font-medium">
                  <AlertTriangle size={14} /> 发现问题
                </span>
              )}
            </div>
          </div>

          {/* Check items */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">巡检项目</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(checkItemLabels).map(([key, label]) => {
                const val = checkItems[key];
                const isEditing = action === 'supplement';
                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{label}</span>
                    {isEditing ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={val === true}
                          onChange={e => setCheckItems({ ...checkItems, [key]: e.target.checked })}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="text-sm text-gray-500">{val ? '正常' : '异常'}</span>
                      </label>
                    ) : (
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        val ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {val ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {val ? '正常' : '异常'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">备注信息</h3>
            <div className="space-y-4">
              <div>
                <label className="label">巡检备注</label>
                {action === 'supplement' ? (
                  <textarea
                    value={overallNote}
                    onChange={e => setOverallNote(e.target.value)}
                    className="input h-24"
                    placeholder="请输入巡检备注"
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {inspection.overallNote || '无'}
                  </p>
                )}
              </div>
              {inspection.returnNote && (
                <div>
                  <label className="label text-red-600">退回原因</label>
                  <p className="text-red-700 bg-red-50 p-3 rounded-lg">{inspection.returnNote}</p>
                </div>
              )}
              {inspection.supplementNote && (
                <div>
                  <label className="label text-amber-600">补录说明</label>
                  <p className="text-amber-700 bg-amber-50 p-3 rounded-lg">{inspection.supplementNote}</p>
                </div>
              )}
              {inspection.reviewNote && (
                <div>
                  <label className="label text-green-600">复核意见</label>
                  <p className="text-green-700 bg-green-50 p-3 rounded-lg">{inspection.reviewNote}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">状态流转记录</h3>
            <div className="space-y-4">
              {inspection.statusHistory?.map((log: any, idx: number) => {
                const logStatus = getStatusConfig(log.toStatus);
                return (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        idx === inspection.statusHistory.length - 1 ? 'bg-primary-600' : 'bg-gray-300'
                      }`} />
                      {idx < inspection.statusHistory.length - 1 && (
                        <div className="w-px h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
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

          {/* Associated repair orders */}
          {inspection.repairOrders?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">关联维修工单</h3>
              <div className="space-y-3">
                {inspection.repairOrders.map((repair: any) => (
                  <div
                    key={repair.id}
                    onClick={() => navigate(`/repairs/${repair.id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Wrench className="text-amber-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-800">{repair.title}</p>
                        <p className="text-sm text-gray-500">{repair.machine?.machineNo}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">操作</h3>
            <div className="space-y-3">
              {canReturn && !action && (
                <button onClick={() => setAction('return')} className="w-full btn btn-warning flex items-center justify-center gap-2">
                  <XCircle size={16} /> 退回补录
                </button>
              )}
              {canSupplement && !action && (
                <button onClick={() => setAction('supplement')} className="w-full btn btn-secondary flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> 补充信息
                </button>
              )}
              {canReview && !action && (
                <button onClick={() => setAction('review')} className="w-full btn btn-primary flex items-center justify-center gap-2">
                  <FileText size={16} /> 复核处理
                </button>
              )}
              {canCreateRepair && !action && !showCreateRepair && (
                <button onClick={() => setShowCreateRepair(true)} className="w-full btn btn-secondary flex items-center justify-center gap-2">
                  <Plus size={16} /> 生成维修工单
                </button>
              )}
            </div>

            {/* Action forms */}
            {action === 'return' && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-3">退回补录</h4>
                <div className="mb-3">
                  <label className="label">退回原因</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="input h-20"
                    placeholder="请说明退回原因"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleReturn} className="flex-1 btn btn-danger">确认退回</button>
                  <button onClick={() => { setAction(null); setNote(''); }} className="flex-1 btn btn-secondary">取消</button>
                </div>
              </div>
            )}

            {action === 'supplement' && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-3">补充信息</h4>
                <div className="mb-3">
                  <label className="label">补录说明</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="input h-20"
                    placeholder="请说明补充了哪些信息"
                  />
                </div>
                <p className="text-xs text-amber-600 mb-3">
                  提示：可在左侧修改巡检项目和备注
                </p>
                <div className="flex gap-2">
                  <button onClick={handleSupplement} className="flex-1 btn btn-warning">提交补录</button>
                  <button onClick={() => { setAction(null); setNote(''); fetchData(); }} className="flex-1 btn btn-secondary">取消</button>
                </div>
              </div>
            )}

            {action === 'review' && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                <h4 className="font-medium text-primary-800 mb-3">复核处理</h4>
                <div className="mb-3">
                  <label className="label">复核意见</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="input h-20"
                    placeholder="请填写复核意见"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleReview(true)} className="flex-1 btn btn-primary">通过</button>
                  <button onClick={() => handleReview(false)} className="flex-1 btn btn-danger">不通过</button>
                </div>
                <button onClick={() => { setAction(null); setNote(''); }} className="w-full mt-2 btn btn-secondary">取消</button>
              </div>
            )}

            {/* Create repair form */}
            {showCreateRepair && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">生成维修工单</h4>
                <div className="space-y-3">
                  <div>
                    <label className="label">工单标题</label>
                    <input
                      value={repairForm.title}
                      onChange={e => setRepairForm({ ...repairForm, title: e.target.value })}
                      className="input"
                      placeholder={`${inspection.machine?.machineNo} 维修`}
                    />
                  </div>
                  <div>
                    <label className="label">问题描述</label>
                    <textarea
                      value={repairForm.description}
                      onChange={e => setRepairForm({ ...repairForm, description: e.target.value })}
                      className="input h-20"
                      placeholder={inspection.overallNote}
                    />
                  </div>
                  <div>
                    <label className="label">优先级</label>
                    <select
                      value={repairForm.priority}
                      onChange={e => setRepairForm({ ...repairForm, priority: e.target.value })}
                      className="input"
                    >
                      <option value="LOW">低</option>
                      <option value="MEDIUM">中</option>
                      <option value="HIGH">高</option>
                      <option value="CRITICAL">紧急</option>
                    </select>
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 flex items-center gap-1">
                    <MessageSquare size={12} /> 巡检备注将自动带入工单
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleCreateRepair} className="flex-1 btn btn-primary">生成工单</button>
                  <button onClick={() => setShowCreateRepair(false)} className="flex-1 btn btn-secondary">取消</button>
                </div>
              </div>
            )}
          </div>

          {/* Machine info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">设备信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">设备编号</span>
                <span className="font-medium">{inspection.machine?.machineNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">所在区域</span>
                <span className="font-medium">{inspection.machine?.area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">当前状态</span>
                <span className="font-medium">
                  {inspection.machine?.status === 'IDLE' && '空闲'}
                  {inspection.machine?.status === 'IN_USE' && '使用中'}
                  {inspection.machine?.status === 'MAINTENANCE' && '维护中'}
                  {inspection.machine?.status === 'BROKEN' && '故障'}
                </span>
              </div>
              {inspection.machine?.config && (
                <div>
                  <span className="text-gray-500">配置</span>
                  <p className="text-gray-700 mt-1">{inspection.machine.config}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionDetail;
