import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Package, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';
import { useWorkOrderStore } from '@/stores/workorder';
import { useAuthStore } from '@/stores/auth';
import { WorkOrderCard } from '@/components/WorkOrder/WorkOrderCard';
import type { WorkOrderStatus } from '@/types';
import { STATUS_MAP } from '@/types';

const statusGroups: { status: WorkOrderStatus; label: string; color: string }[] = [
  { status: 'pending', label: '待处理', color: 'bg-yellow-500' },
  { status: 'assigned', label: '已分配', color: 'bg-blue-500' },
  { status: 'diagnosing', label: '诊断中', color: 'bg-purple-500' },
  { status: 'waiting_parts', label: '等待配件', color: 'bg-pink-500' },
  { status: 'repairing', label: '维修中', color: 'bg-orange-500' },
  { status: 'signoff_pending', label: '待签认', color: 'bg-indigo-500' },
];

export function Dashboard() {
  const { workorders, selectedIds, statusFilter, fetchWorkOrders, toggleSelect, selectAll, clearSelection, batchAssign, setStatusFilter } = useWorkOrderStore();
  const { getTechnicians, currentUser } = useAuthStore();
  const [showBatchAssign, setShowBatchAssign] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const technicians = getTechnicians();

  const pendingCount = workorders.filter(w => w.status === 'pending').length;
  const waitingPartsCount = workorders.filter(w => w.status === 'waiting_parts').length;
  const signoffPendingCount = workorders.filter(w => w.status === 'signoff_pending').length;
  const completedCount = workorders.filter(w => w.status === 'completed').length;

  const handleBatchAssign = () => {
    if (selectedTechnician && selectedIds.length > 0) {
      const technician = technicians.find(t => t.id === selectedTechnician);
      if (technician) {
        batchAssign(selectedIds, technician.id, technician.name);
        setShowBatchAssign(false);
        setSelectedTechnician('');
      }
    }
  };

  const handleStatusFilter = (status: WorkOrderStatus | 'all') => {
    setStatusFilter(status);
  };

  const filteredWorkorders = statusFilter === 'all' 
    ? workorders 
    : workorders.filter(w => w.status === statusFilter);

  const canAssign = currentUser?.role === 'manager';

  const handleCardClick = (workorderId: string) => {
    navigate(`/workorder/${workorderId}`);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待处理工单</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">等待配件</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{waitingPartsCount}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <Package size={24} className="text-pink-600" />
            </div>
          </div>
        </div>

        <Link 
          to="#" 
          onClick={() => handleStatusFilter('signoff_pending')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待签认</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{signoffPendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <FileCheck size={24} className="text-indigo-600" />
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">本月完成</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{completedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-blue-800 font-medium">已选择 {selectedIds.length} 个工单</span>
            <button
              onClick={clearSelection}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              取消选择
            </button>
          </div>
          {canAssign && (
            <div className="flex items-center gap-2">
              {showBatchAssign ? (
                <>
                  <select
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    className="px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择技师</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBatchAssign}
                    disabled={!selectedTechnician}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认分配
                  </button>
                  <button
                    onClick={() => setShowBatchAssign(false)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg text-sm"
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowBatchAssign(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  批量分配
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => selectAll()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            全选
          </button>
          <span className="text-slate-300">|</span>
          {statusGroups.map((group) => (
            <button
              key={group.status}
              onClick={() => handleStatusFilter(group.status)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                statusFilter === group.status
                  ? `${group.color} text-white`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {group.label} ({workorders.filter(w => w.status === group.status).length})
            </button>
          ))}
          <button
            onClick={() => handleStatusFilter('all')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ml-auto ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部 ({workorders.length})
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {filteredWorkorders.map((workorder) => (
              <WorkOrderCard
                key={workorder.id}
                workorder={workorder}
                selected={selectedIds.includes(workorder.id)}
                onSelect={() => toggleSelect(workorder.id)}
                onClick={() => handleCardClick(workorder.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
