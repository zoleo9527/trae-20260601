import { useState } from 'react';
import { AlertTriangle, CheckCircle, Search, Filter, Clock, X, ChevronRight, Wrench, Package, Calendar, RefreshCw } from 'lucide-react';
import { Exception, User } from '../types';
import { exceptionsAPI, partsAPI, maintenanceAPI } from '../api';

interface ExceptionsProps {
  exceptions: Exception[];
  currentUser: User;
  onUpdate: () => void;
}

export function Exceptions({ exceptions, currentUser, onUpdate }: ExceptionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [resolution, setResolution] = useState('');

  const filteredExceptions = exceptions.filter(exc => {
    const matchesSearch = 
      exc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exc.equipmentCode && exc.equipmentCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exc.customerName && exc.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || exc.status === filterStatus;
    const matchesType = filterType === 'all' || exc.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const canResolve = currentUser.role === 'maintenance_manager' || 
    (currentUser.role === 'warehouse_manager' && (filteredExceptions.some(e => e.type === 'wrong_parts_delivery' || e.type === 'low_stock'))) ||
    (currentUser.role === 'field_technician' && (filteredExceptions.some(e => e.type === 'equipment_down' || e.type === 'overdue_maintenance')));

  const canResolveException = (exc: Exception) => {
    if (currentUser.role === 'maintenance_manager') return true;
    if (currentUser.role === 'warehouse_manager' && (exc.type === 'wrong_parts_delivery' || exc.type === 'low_stock')) return true;
    if (currentUser.role === 'field_technician' && (exc.type === 'equipment_down' || exc.type === 'overdue_maintenance')) return true;
    return false;
  };

  const handleResolve = async (id: string) => {
    if (!selectedException || !resolution) return;
    
    if (selectedException.type === 'wrong_parts_delivery') {
      await partsAPI.resolveWrongDelivery(id, resolution, currentUser.name, currentUser.role);
    } else if (selectedException.type === 'overdue_maintenance' && selectedException.planId) {
      await maintenanceAPI.update(selectedException.planId, {
        status: 'completed',
        operator: currentUser.name,
        operatorRole: currentUser.role,
      });
      await exceptionsAPI.update(id, {
        status: 'resolved',
        resolution,
        operator: currentUser.name,
        operatorRole: currentUser.role,
      });
    } else {
      await exceptionsAPI.update(id, {
        status: 'resolved',
        resolution,
        operator: currentUser.name,
        operatorRole: currentUser.role,
      });
    }
    
    setShowDrawer(false);
    setSelectedException(null);
    setResolution('');
    onUpdate();
  };

  const openDrawer = (exception: Exception) => {
    setSelectedException(exception);
    setShowDrawer(true);
    setResolution('');
  };

  const pendingCount = exceptions.filter(e => e.status === 'pending').length;
  const highPriorityCount = exceptions.filter(e => e.status === 'pending' && e.priority === 'high').length;
  const overdueCount = exceptions.filter(e => e.type === 'overdue_maintenance' && e.status === 'pending').length;
  const downCount = exceptions.filter(e => e.type === 'equipment_down' && e.status === 'pending').length;
  const wrongDeliveryCount = exceptions.filter(e => e.type === 'wrong_parts_delivery' && e.status === 'pending').length;

  const typeLabels: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    overdue_maintenance: { label: '保养漏做', color: 'text-orange-600', bg: 'bg-orange-100', icon: <Calendar className="w-4 h-4" /> },
    wrong_parts_delivery: { label: '配件错发', color: 'text-red-600', bg: 'bg-red-100', icon: <Package className="w-4 h-4" /> },
    equipment_down: { label: '设备停机', color: 'text-red-700', bg: 'bg-red-50', icon: <Wrench className="w-4 h-4" /> },
    low_stock: { label: '库存不足', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Package className="w-4 h-4" /> },
    equipment_change: { label: '设备变更', color: 'text-blue-600', bg: 'bg-blue-100', icon: <RefreshCw className="w-4 h-4" /> },
  };

  const priorityLabels: Record<string, { label: string; color: string; bg: string }> = {
    high: { label: '高', color: 'text-red-600', bg: 'bg-red-100' },
    medium: { label: '中', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    low: { label: '低', color: 'text-green-600', bg: 'bg-green-100' },
  };

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '待处理', color: 'text-red-600', bg: 'bg-red-100' },
    resolved: { label: '已解决', color: 'text-green-600', bg: 'bg-green-100' },
  };

  const getActionHint = (exc: Exception) => {
    switch (exc.type) {
      case 'overdue_maintenance':
        return '完成保养计划后自动解决';
      case 'equipment_down':
        return '维修完成后自动解决';
      case 'wrong_parts_delivery':
        return '追回重发后标记解决';
      case 'low_stock':
        return '补充库存后标记解决';
      case 'equipment_change':
        return '确认变更后自动解决';
      default:
        return '';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">异常处理</h1>
          <p className="text-gray-500 mt-1">跟踪和处理系统异常事件</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${
            currentUser.role === 'maintenance_manager' ? 'bg-blue-100 text-blue-600' :
            currentUser.role === 'field_technician' ? 'bg-green-100 text-green-600' :
            'bg-yellow-100 text-yellow-600'
          }`}>
            {currentUser.role === 'maintenance_manager' ? '维保主管' : 
             currentUser.role === 'field_technician' ? '现场技师' : '仓管'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待处理异常</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">高优先级</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{highPriorityCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">保养漏做</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{overdueCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">设备停机</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{downCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">配件错发</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{wrongDeliveryCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="搜索异常标题、设备编号..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="resolved">已解决</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部类型</option>
              <option value="overdue_maintenance">保养漏做</option>
              <option value="wrong_parts_delivery">配件错发</option>
              <option value="equipment_down">设备停机</option>
              <option value="low_stock">库存不足</option>
              <option value="equipment_change">设备变更</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredExceptions.map(exc => (
            <div 
              key={exc.id} 
              onClick={() => openDrawer(exc)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                exc.status === 'pending' 
                  ? exc.priority === 'high' 
                    ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                    : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                  : 'border-green-200 bg-green-50 hover:bg-green-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${typeLabels[exc.type].bg} rounded-lg flex items-center justify-center`}>
                    {typeLabels[exc.type].icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{exc.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${priorityLabels[exc.priority].bg} ${priorityLabels[exc.priority].color}`}>
                        {priorityLabels[exc.priority].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{exc.description}</p>
                    {exc.equipmentCode && (
                      <p className="text-xs text-gray-500 mt-1">设备: {exc.equipmentCode}</p>
                    )}
                    {exc.planName && (
                      <p className="text-xs text-gray-500 mt-1">计划: {exc.planName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">创建时间</p>
                    <p className="text-sm text-gray-700">{exc.createdAt}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${statusLabels[exc.status].bg} ${statusLabels[exc.status].color}`}>
                    {statusLabels[exc.status].label}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredExceptions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>暂无异常记录</p>
          </div>
        )}
      </div>

      {showDrawer && selectedException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => { setShowDrawer(false); setSelectedException(null); }}>
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-6 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">异常详情</h2>
              <button
                onClick={() => { setShowDrawer(false); setSelectedException(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${typeLabels[selectedException.type].bg} rounded-lg flex items-center justify-center`}>
                    {typeLabels[selectedException.type].icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{selectedException.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${priorityLabels[selectedException.priority].bg} ${priorityLabels[selectedException.priority].color}`}>
                      {priorityLabels[selectedException.priority].label}优先级
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${typeLabels[selectedException.type].bg} ${typeLabels[selectedException.type].color}`}>
                  {typeLabels[selectedException.type].icon}
                  {typeLabels[selectedException.type].label}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <p className="text-gray-600">{selectedException.description}</p>
              </div>

              {selectedException.equipmentCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">涉及设备</label>
                  <p className="text-gray-600">{selectedException.equipmentCode}</p>
                </div>
              )}

              {selectedException.customerName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
                  <p className="text-gray-600">{selectedException.customerName}</p>
                </div>
              )}

              {selectedException.planName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">保养计划</label>
                  <p className="text-gray-600">{selectedException.planName}</p>
                </div>
              )}

              {selectedException.expectedCode && selectedException.actualCode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">应发配件</label>
                    <p className="text-red-600">{selectedException.expectedCode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">实发配件</label>
                    <p className="text-green-600">{selectedException.actualCode}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusLabels[selectedException.status].bg} ${statusLabels[selectedException.status].color}`}>
                  {selectedException.status === 'resolved' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {statusLabels[selectedException.status].label}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                <p className="text-gray-600">{selectedException.assignee}</p>
              </div>

              {selectedException.resolution && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">处理结果</label>
                  <p className="text-gray-600">{selectedException.resolution}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">创建时间</label>
                  <p className="text-gray-600">{selectedException.createdAt}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">更新时间</label>
                  <p className="text-gray-600">{selectedException.updatedAt}</p>
                </div>
              </div>

              {selectedException.status === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>处理提示：</strong>{getActionHint(selectedException)}
                  </p>
                </div>
              )}

              {selectedException.status === 'pending' && canResolveException(selectedException) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">处理说明</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="请描述处理过程和结果..."
                    rows={3}
                  />
                </div>
              )}

              {selectedException.status === 'pending' && canResolveException(selectedException) && (
                <button
                  onClick={() => handleResolve(selectedException.id)}
                  disabled={!resolution}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  标记为已解决
                </button>
              )}

              {!canResolveException(selectedException) && selectedException.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">
                    您没有权限处理此类型异常，请联系相关人员处理。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}