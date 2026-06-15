import { useState } from 'react';
import { Search, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import type { Machine } from '@/types';
import { statusLabels, statusColors } from '@/utils/helpers';

interface MachineListProps {
  machines: Machine[];
  filterStatus?: string;
  onSelect: (machine: Machine) => void;
}

export function MachineList({ machines, filterStatus, onSelect }: MachineListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.customerName.includes(searchTerm) || 
                         machine.orderNo.includes(searchTerm) ||
                         machine.id.includes(searchTerm);
    const matchesFilter = !filterStatus || machine.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const recentChanges = filteredMachines
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索客户姓名、订单号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          筛选
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => onSelect}
              className={`px-3 py-1 rounded-full text-sm ${
                filterStatus === value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">最近变更</h3>
          <span className="text-sm text-gray-500">最近更新的订单</span>
        </div>
        <div className="space-y-3">
          {recentChanges.map(machine => (
            <div 
              key={machine.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onSelect(machine)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{machine.orderNo}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[machine.status]}`}>
                      {statusLabels[machine.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{machine.customerName} - {machine.configuration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {machine.exceptions.some(e => !e.resolved) && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
