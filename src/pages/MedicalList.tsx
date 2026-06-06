import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, MedicalStatus, Role } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import { Stethoscope, Search, Filter, PawPrint, AlertTriangle, CheckCircle } from 'lucide-react';

export default function MedicalList() {
  const { animals, medicalRecords, currentRole } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MedicalStatus | 'ALL'>('ALL');

  const filteredAnimals = animals.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.currentLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.medicalStatus === statusFilter;
    return matchesSearch && matchesStatus && a.status !== 'CLOSED';
  });

  const statusOptions = [
    { value: 'ALL', label: '全部状态' },
    { value: MedicalStatus.NOT_ASSESSED, label: '未评估' },
    { value: MedicalStatus.ASSESSING, label: '评估中' },
    { value: MedicalStatus.NEEDS_TREATMENT, label: '需治疗' },
    { value: MedicalStatus.TREATING, label: '治疗中' },
    { value: MedicalStatus.RECOVERED, label: '已痊愈' },
  ];

  const notAssessedCount = animals.filter(
    (a) => a.medicalStatus === MedicalStatus.NOT_ASSESSED && a.status !== 'CLOSED'
  ).length;

  const treatingCount = animals.filter((a) => a.medicalStatus === MedicalStatus.TREATING).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">医疗评估</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredAnimals.length} 只动物 · {notAssessedCount} 只待评估 · {treatingCount} 只治疗中
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {notAssessedCount > 0 && currentRole === Role.VET && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">有 {notAssessedCount} 只动物等待医疗评估</p>
            <p className="text-sm text-yellow-600">请优先处理新救助的动物</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '待评估', value: notAssessedCount, color: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
          { label: '评估中', value: animals.filter((a) => a.medicalStatus === MedicalStatus.ASSESSING).length, color: 'bg-yellow-100 text-yellow-700', icon: Stethoscope },
          { label: '治疗中', value: treatingCount, color: 'bg-red-100 text-red-700', icon: Stethoscope },
          { label: '已痊愈', value: animals.filter((a) => a.medicalStatus === MedicalStatus.RECOVERED).length, color: 'bg-green-100 text-green-700', icon: CheckCircle },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.color} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon size={24} className="opacity-60" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索动物名称、品种、当前位置..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MedicalStatus | 'ALL')}
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
                  当前位置
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  医疗状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  救助状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  就诊次数
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  累计费用
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最近就诊
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Stethoscope size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>暂无符合条件的动物</p>
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal) => {
                  const records = medicalRecords.filter((m) => m.animalId === animal.id);
                  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
                  const lastRecord = records[0];
                  return (
                    <tr key={animal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link to={`/medical/${animal.id}`} className="block">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <PawPrint size={20} className="text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{animal.name}</p>
                              <p className="text-sm text-gray-500">
                                {animal.species} · {animal.breed} · {animal.age}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[150px]">
                        {animal.currentLocation}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={animal.medicalStatus} type="medical" />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={animal.status} type="rescue" />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {records.length} 次
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ¥{totalCost}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {lastRecord ? lastRecord.date : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
