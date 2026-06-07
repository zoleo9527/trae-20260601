import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Search, Clock, Wrench, ClipboardCheck } from 'lucide-react';
import { machineAPI } from '../services/api';

const MachineList: React.FC = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    machineAPI.list().then(data => {
      setMachines(data);
      setLoading(false);
    });
  }, []);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      IDLE: { label: '空闲', color: 'bg-green-100 text-green-800' },
      IN_USE: { label: '使用中', color: 'bg-blue-100 text-blue-800' },
      MAINTENANCE: { label: '维护中', color: 'bg-amber-100 text-amber-800' },
      BROKEN: { label: '故障', color: 'bg-red-100 text-red-800' },
      SCRAPPED: { label: '已报废', color: 'bg-gray-100 text-gray-500' }
    };
    return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const filtered = machines.filter(m =>
    (!filter || m.status === filter) &&
    (!search || m.machineNo.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.area.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索设备编号、名称或区域"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input w-40">
            <option value="">全部状态</option>
            <option value="IDLE">空闲</option>
            <option value="IN_USE">使用中</option>
            <option value="MAINTENANCE">维护中</option>
            <option value="BROKEN">故障</option>
          </select>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['IDLE', 'IN_USE', 'MAINTENANCE', 'BROKEN'].map(status => {
          const config = getStatusConfig(status);
          const count = machines.filter(m => m.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? '' : status)}
              className={`p-4 rounded-lg border transition-colors text-left ${
                filter === status ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-sm text-gray-500">{config.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Machine grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(machine => {
          const statusConfig = getStatusConfig(machine.status);
          return (
            <div key={machine.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Monitor className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{machine.machineNo}</p>
                    <p className="text-sm text-gray-500">{machine.name}</p>
                  </div>
                </div>
                <span className={`status-badge ${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">区域</span>
                  <span className="text-gray-700">{machine.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <ClipboardCheck size={14} /> 巡检
                  </span>
                  <span className="text-gray-700">{machine._count?.inspections || 0} 次</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Wrench size={14} /> 维修
                  </span>
                  <span className="text-gray-700">{machine._count?.repairOrders || 0} 次</span>
                </div>
              </div>
              {machine.config && (
                <p className="text-xs text-gray-400 mt-3 pt-3 border-t truncate">{machine.config}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MachineList;
