import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, Search, Eye, X, Plus, AlertTriangle, Bell, RefreshCw } from 'lucide-react';
import { MaintenancePlan, Equipment, User, EquipmentChangeRecord } from '../types';
import { maintenanceAPI, changeRecordsAPI } from '../api';

interface MaintenancePlansProps {
  plans: MaintenancePlan[];
  equipment: Equipment[];
  currentUser: User;
  onUpdate: () => void;
}

export function MaintenancePlans({ plans, equipment, currentUser, onUpdate }: MaintenancePlansProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showChangeAlert, setShowChangeAlert] = useState(false);
  const [changeRecord, setChangeRecord] = useState<EquipmentChangeRecord | null>(null);
  
  const [newPlan, setNewPlan] = useState<{
    equipmentId: string;
    planName: string;
    planType: 'regular' | 'emergency';
    scheduledDate: string;
    responsibleTechnician: string;
    items: string[];
  }>({
    equipmentId: '',
    planName: '',
    planType: 'regular',
    scheduledDate: '',
    responsibleTechnician: '',
    items: [''],
  });

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = 
      plan.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const plansWithChangeAlert = plans.filter(p => p.hasEquipmentChange && !p.equipmentChangeAcknowledged);

  const canCreate = currentUser.role === 'maintenance_manager';
  const canComplete = currentUser.role === 'field_technician' || currentUser.role === 'maintenance_manager';
  const canAcknowledge = currentUser.role === 'field_technician' || currentUser.role === 'maintenance_manager';

  const handleComplete = async (planId: string) => {
    if (!canComplete) return;
    await maintenanceAPI.update(planId, { 
      status: 'completed',
      operator: currentUser.name,
      operatorRole: currentUser.role,
    });
    onUpdate();
  };

  const handleViewDetail = (plan: MaintenancePlan) => {
    setSelectedPlan(plan);
    setShowDetail(true);
  };

  const handleAcknowledgeChange = async (plan: MaintenancePlan) => {
    if (!canAcknowledge) return;
    await maintenanceAPI.acknowledgeChange(plan.id, currentUser.name, currentUser.role);
    setShowChangeAlert(false);
    setSelectedPlan(null);
    setChangeRecord(null);
    onUpdate();
  };

  const handleViewChangeRecord = async (plan: MaintenancePlan) => {
    if (plan.equipmentChangeRecordId) {
      const record = await changeRecordsAPI.getEquipmentChangeRecordById(plan.equipmentChangeRecordId);
      setChangeRecord(record);
      setSelectedPlan(plan);
      setShowChangeAlert(true);
    }
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    if (!newPlan.equipmentId || !newPlan.planName || !newPlan.scheduledDate) {
      alert('请填写完整信息');
      return;
    }

    const eq = equipment.find(e => e.id === newPlan.equipmentId);
    await maintenanceAPI.create({
      equipmentId: newPlan.equipmentId,
      equipmentCode: eq?.code || '',
      equipmentModel: eq?.model || '',
      customerName: eq?.customerName || '',
      planType: newPlan.planType,
      planName: newPlan.planName,
      scheduledDate: newPlan.scheduledDate,
      actualDate: null,
      status: 'pending',
      items: newPlan.items.map(item => ({ name: item, status: 'pending' })),
      responsibleTechnician: newPlan.responsibleTechnician,
      operator: currentUser.name,
      operatorRole: currentUser.role,
    });
    
    setShowCreate(false);
    setNewPlan({
      equipmentId: '',
      planName: '',
      planType: 'regular',
      scheduledDate: '',
      responsibleTechnician: '',
      items: [''],
    });
    onUpdate();
  };

  const addItem = () => {
    setNewPlan({ ...newPlan, items: [...newPlan.items, ''] });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...newPlan.items];
    newItems[index] = value;
    setNewPlan({ ...newPlan, items: newItems });
  };

  const removeItem = (index: number) => {
    if (newPlan.items.length > 1) {
      const newItems = newPlan.items.filter((_, i) => i !== index);
      setNewPlan({ ...newPlan, items: newItems });
    }
  };

  const statusLabels: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: '待执行', color: 'text-blue-600', bg: 'bg-blue-100', icon: <Clock className="w-3 h-3" /> },
    overdue: { label: '已逾期', color: 'text-red-600', bg: 'bg-red-100', icon: <AlertCircle className="w-3 h-3" /> },
    completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-100', icon: <CheckCircle className="w-3 h-3" /> },
  };

  const fieldLabels: Record<string, string> = {
    code: '设备编号',
    model: '型号',
    brand: '品牌',
    customerName: '客户名称',
    location: '位置',
    responsibleTechnician: '负责技师',
    workingHours: '运行时长',
    status: '状态',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">保养计划</h1>
          <p className="text-gray-500 mt-1">管理设备保养计划和执行进度</p>
        </div>
        <div className="flex items-center gap-2">
          {plansWithChangeAlert.length > 0 && (
            <button
              onClick={() => handleViewChangeRecord(plansWithChangeAlert[0])}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 animate-pulse"
            >
              <Bell className="w-5 h-5" />
              {plansWithChangeAlert.length} 条变更提醒
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <Plus className="w-5 h-5" />
              创建计划
            </button>
          )}
        </div>
      </div>

      {plansWithChangeAlert.length > 0 && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="font-medium text-orange-700">设备档案变更提醒</span>
          </div>
          <p className="text-sm text-orange-600 mb-3">
            以下保养计划关联的设备档案已被修改，请确认变更内容：
          </p>
          <div className="space-y-2">
            {plansWithChangeAlert.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-2 bg-white rounded">
                <div>
                  <span className="font-medium">{plan.planName}</span>
                  <span className="text-sm text-gray-500 ml-2">({plan.equipmentCode})</span>
                </div>
                <button
                  onClick={() => handleViewChangeRecord(plan)}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  查看变更
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="搜索设备编号、客户名称..."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部</option>
              <option value="pending">待执行</option>
              <option value="overdue">已逾期</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredPlans.map(plan => (
            <div 
              key={plan.id} 
              className={`p-4 rounded-lg border ${
                plan.hasEquipmentChange && !plan.equipmentChangeAcknowledged ? 'border-orange-300 bg-orange-50' :
                plan.status === 'overdue' ? 'border-red-200 bg-red-50' : 
                plan.status === 'pending' ? 'border-blue-200 bg-blue-50' :
                'border-green-200 bg-green-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800">{plan.planName}</h3>
                      {plan.hasEquipmentChange && !plan.equipmentChangeAcknowledged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-600">
                          <Bell className="w-3 h-3" />
                          变更提醒
                        </span>
                      )}
                      {plan.hasEquipmentChange && plan.equipmentChangeAcknowledged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          已确认变更
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {plan.equipmentCode} ({plan.equipmentModel}) - {plan.customerName}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusLabels[plan.status].bg} ${statusLabels[plan.status].color}`}>
                    {statusLabels[plan.status].icon}
                    {statusLabels[plan.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">计划日期</p>
                    <p className="font-medium">{plan.scheduledDate}</p>
                  </div>
                  {plan.actualDate && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">完成日期</p>
                      <p className="font-medium">{plan.actualDate}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetail(plan)}
                      className="text-primary-500 hover:text-primary-600"
                      title="查看详情"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {plan.hasEquipmentChange && !plan.equipmentChangeAcknowledged && canAcknowledge && (
                      <button
                        onClick={() => handleViewChangeRecord(plan)}
                        className="text-orange-500 hover:text-orange-600"
                        title="确认变更"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    )}
                    {plan.hasEquipmentChange && plan.equipmentChangeAcknowledged && (
                      <button
                        onClick={() => handleViewChangeRecord(plan)}
                        className="text-green-500 hover:text-green-600"
                        title="查看历史变更"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    {plan.status !== 'completed' && canComplete && (
                      <button
                        onClick={() => handleComplete(plan.id)}
                        className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                      >
                        完成
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.items.map((item, index) => (
                  <span 
                    key={index}
                    className={`px-2 py-1 text-xs rounded ${
                      item.status === 'completed' 
                        ? 'bg-green-200 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {item.name} {item.status === 'completed' && '✓'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDetail && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">保养计划详情</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">计划名称</span>
                <span className="font-medium">{selectedPlan.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">设备编号</span>
                <span>{selectedPlan.equipmentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">设备型号</span>
                <span>{selectedPlan.equipmentModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">客户名称</span>
                <span>{selectedPlan.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">计划类型</span>
                <span>{selectedPlan.planType === 'regular' ? '定期保养' : '紧急维修'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">计划日期</span>
                <span>{selectedPlan.scheduledDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">实际完成日期</span>
                <span>{selectedPlan.actualDate || '未完成'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">状态</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusLabels[selectedPlan.status].bg} ${statusLabels[selectedPlan.status].color}`}>
                  {statusLabels[selectedPlan.status].icon}
                  {statusLabels[selectedPlan.status].label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">负责技师</span>
                <span>{selectedPlan.responsibleTechnician}</span>
              </div>
              {selectedPlan.hasEquipmentChange && (
                <div className="flex justify-between">
                  <span className="text-gray-500">设备变更</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${selectedPlan.equipmentChangeAcknowledged ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {selectedPlan.equipmentChangeAcknowledged ? '已确认' : '待确认'}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500 block mb-2">保养项目</span>
                <div className="space-y-2">
                  {selectedPlan.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{item.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.status === 'completed' ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {item.status === 'completed' ? '已完成' : '待执行'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangeAlert && changeRecord && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedPlan.equipmentChangeAcknowledged ? '设备档案变更记录' : '设备档案变更提醒'}
              </h2>
              <button
                onClick={() => { setShowChangeAlert(false); setChangeRecord(null); setSelectedPlan(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={`mb-4 p-4 rounded-lg ${selectedPlan.equipmentChangeAcknowledged ? 'bg-green-50' : 'bg-orange-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {selectedPlan.equipmentChangeAcknowledged ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                )}
                <span className={`font-medium ${selectedPlan.equipmentChangeAcknowledged ? 'text-green-700' : 'text-orange-700'}`}>
                  {selectedPlan.equipmentChangeAcknowledged ? '变更已确认' : '设备档案已修改'}
                </span>
              </div>
              <p className={`text-sm ${selectedPlan.equipmentChangeAcknowledged ? 'text-green-600' : 'text-orange-600'}`}>
                {selectedPlan.equipmentChangeAcknowledged 
                  ? `保养计划「${selectedPlan.planName}」关联的设备档案变更已确认`
                  : `保养计划「${selectedPlan.planName}」关联的设备档案已被修改，请确认以下变更内容：`}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">变更时间</span>
                <span>{changeRecord.createdAt}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">操作人</span>
                <span>{changeRecord.operator}</span>
              </div>
              {changeRecord.reason && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">修改原因</span>
                  <span>{changeRecord.reason}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 block mb-2 text-sm">变更内容</span>
                <div className="space-y-2">
                  {changeRecord.changes.map((change, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{fieldLabels[change.field] || change.field}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-500">{change.oldValue || '(空)'}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-500">{change.newValue || '(空)'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              {!selectedPlan.equipmentChangeAcknowledged && (
                <button
                  onClick={() => { setShowChangeAlert(false); setChangeRecord(null); setSelectedPlan(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  稍后确认
                </button>
              )}
              {!selectedPlan.equipmentChangeAcknowledged && canAcknowledge && (
                <button
                  onClick={() => handleAcknowledgeChange(selectedPlan)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  <RefreshCw className="w-4 h-4" />
                  确认变更
                </button>
              )}
              {selectedPlan.equipmentChangeAcknowledged && (
                <button
                  onClick={() => { setShowChangeAlert(false); setChangeRecord(null); setSelectedPlan(null); }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  关闭
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreate && canCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">创建保养计划</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择设备</label>
                <select
                  value={newPlan.equipmentId}
                  onChange={(e) => {
                    const eq = equipment.find(eq => eq.id === e.target.value);
                    setNewPlan({ 
                      ...newPlan, 
                      equipmentId: e.target.value,
                      responsibleTechnician: eq?.responsibleTechnician || ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择设备</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.code} - {eq.customerName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">计划名称</label>
                <input
                  type="text"
                  value={newPlan.planName}
                  onChange={(e) => setNewPlan({ ...newPlan, planName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="如：2025年1月定期保养"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">计划类型</label>
                  <select
                    value={newPlan.planType}
                    onChange={(e) => setNewPlan({ ...newPlan, planType: e.target.value as 'regular' | 'emergency' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="regular">定期保养</option>
                    <option value="emergency">紧急维修</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">计划日期</label>
                  <input
                    type="date"
                    value={newPlan.scheduledDate}
                    onChange={(e) => setNewPlan({ ...newPlan, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">负责技师</label>
                <input
                  type="text"
                  value={newPlan.responsibleTechnician}
                  onChange={(e) => setNewPlan({ ...newPlan, responsibleTechnician: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">保养项目</label>
                <div className="space-y-2">
                  {newPlan.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder={`项目 ${index + 1}`}
                      />
                      {newPlan.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="mt-2 text-sm text-primary-500 hover:text-primary-600"
                >
                  + 添加项目
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                <Plus className="w-4 h-4" />
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}