import { useEffect, useState } from 'react';
import { Search, Truck, Calendar, AlertTriangle, CheckCircle, Clock, Edit2, Trash2 } from 'lucide-react';
import { useEquipmentStore } from '@/stores/equipment';

export function EquipmentArchive() {
  const { equipment, fetchEquipment, searchQuery, setSearchQuery } = useEquipmentStore();
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const filteredEquipment = equipment.filter(e => 
    e.equipmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overduePlans = equipment.flatMap(e => 
    e.maintenancePlans.filter(p => p.status === 'overdue').map(p => ({ equipment: e, plan: p }))
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">设备档案</h1>
          <p className="text-sm text-slate-500">管理客户设备信息和保养计划</p>
        </div>
      </div>

      {overduePlans.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="font-medium text-red-800">保养逾期预警</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overduePlans.map(({ equipment, plan }) => (
              <span key={`${equipment.id}-${plan.id}`} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                {equipment.equipmentNo} - {plan.type}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">设备总数</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{equipment.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">运行中</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {equipment.filter(e => e.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">待保养</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {equipment.flatMap(e => e.maintenancePlans).filter(p => p.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">已逾期</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{overduePlans.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索设备编号、型号或客户..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4">
          {filteredEquipment.map((eq) => (
            <div
              key={eq.id}
              className={`bg-slate-50 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                selectedEquipment === eq.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedEquipment(selectedEquipment === eq.id ? null : eq.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{eq.equipmentNo}</h3>
                  <p className="text-sm text-slate-500">{eq.model}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  eq.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {eq.status === 'active' ? '运行中' : '停用'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Truck size={14} className="text-slate-400" />
                  {eq.customerName}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  购入: {eq.purchaseDate}
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  上次保养: {eq.lastMaintenanceDate}
                </p>
              </div>

              {eq.maintenancePlans.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-2">保养计划</p>
                  <div className="space-y-1">
                    {eq.maintenancePlans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{plan.type}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          plan.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          plan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {plan.status === 'overdue' ? '已逾期' : plan.status === 'pending' ? '待执行' : '已完成'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-end gap-2">
                <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
