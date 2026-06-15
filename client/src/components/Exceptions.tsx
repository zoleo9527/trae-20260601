import { useState } from 'react';
import { AlertTriangle, CheckCircle, Search, Filter, Clock, X, ChevronRight } from 'lucide-react';
import { Exception } from '../types';
import { exceptionsAPI } from '../api';

interface ExceptionsProps {
  exceptions: Exception[];
  onUpdate: () => void;
}

export function Exceptions({ exceptions, onUpdate }: ExceptionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

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

  const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
    overdue_maintenance: { label: '保养漏做', color: 'text-orange-600', bg: 'bg-orange-100' },
    wrong_parts_delivery: { label: '配件错发', color: 'text-red-600', bg: 'bg-red-100' },
    equipment_down: { label: '设备停机', color: 'text-red-700', bg: 'bg-red-50' },
    low_stock: { label: '库存不足', color: 'text-yellow-600', bg: 'bg-yellow-100' },
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

  const handleResolve = async (id: string) => {
    await exceptionsAPI.update(id, { status: 'resolved' });
    onUpdate();
    if (selectedException?.id === id) {
      setShowDrawer(false);
      setSelectedException(null);
    }
  };

  const openDrawer = (exception: Exception) => {
    setSelectedException(exception);
    setShowDrawer(true);
  };

  const pendingCount = exceptions.filter(e => e.status === 'pending').length;
  const highPriorityCount = exceptions.filter(e => e.status === 'pending' && e.priority === 'high').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">异常处理</h1>
          <p className="text-gray-500 mt-1">跟踪和处理系统异常事件</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {exceptions.filter(e => e.type === 'overdue_maintenance' && e.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">设备停机</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {exceptions.filter(e => e.type === 'equipment_down' && e.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-700" />
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
                    <AlertTriangle className={`w-5 h-5 ${typeLabels[exc.type].color}`} />
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
                    <AlertTriangle className={`w-6 h-6 ${typeLabels[selectedException.type].color}`} />
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
                <button
                  onClick={() => handleResolve(selectedException.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <CheckCircle className="w-5 h-5" />
                  标记为已解决
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
