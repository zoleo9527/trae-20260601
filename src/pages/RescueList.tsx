import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, RescueStatus } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Search, Filter, PawPrint, MapPin, User } from 'lucide-react';

export default function RescueList() {
  const { animals } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RescueStatus | 'ALL'>('ALL');

  const filteredAnimals = animals.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.foundLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.rescuerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'ALL', label: '全部状态' },
    { value: RescueStatus.PENDING, label: '待处理' },
    { value: RescueStatus.REGISTERED, label: '已登记' },
    { value: RescueStatus.FOSTERING, label: '寄养中' },
    { value: RescueStatus.TREATING, label: '治疗中' },
    { value: RescueStatus.READY_FOR_ADOPTION, label: '待领养' },
    { value: RescueStatus.ADOPTED, label: '已领养' },
    { value: RescueStatus.RETURNED, label: '已退回' },
    { value: RescueStatus.CLOSED, label: '已关闭' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">救助登记列表</h2>
          <p className="text-sm text-gray-500 mt-1">共 {filteredAnimals.length} 条记录</p>
        </div>
        <Link
          to="/rescue/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          新建救助登记
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索动物名称、品种、发现地点、救助人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RescueStatus | 'ALL')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  动物信息
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  发现信息
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前位置
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  救助状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  医疗状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登记时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <PawPrint size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>暂无符合条件的救助记录</p>
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal) => (
                  <tr key={animal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/rescue/${animal.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <PawPrint size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{animal.name}</p>
                            <p className="text-sm text-gray-500">
                              {animal.species} · {animal.breed} · {animal.age} · {animal.gender}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin size={14} />
                          <span className="truncate max-w-[150px]">{animal.foundLocation}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 mt-1">
                          <User size={14} />
                          <span>{animal.rescuerName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 truncate max-w-[150px]">
                        {animal.currentLocation}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={animal.status} type="rescue" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={animal.medicalStatus} type="medical" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(animal.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
