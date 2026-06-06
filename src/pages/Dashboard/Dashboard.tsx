import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import StatusTag from '@/components/StatusTag/StatusTag';
import { formatDate } from '@/utils/date';
import { formatAnimalType, formatCurrency } from '@/utils/format';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronRight,
  PawPrint,
  Stethoscope,
  Home,
  Heart,
  Archive,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { cases, getFilteredCases, setFilters, filters } = useCaseStore();
  const [searchKeyword, setSearchKeyword] = useState(filters.keyword || '');
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    return {
      total: cases.length,
      medical: cases.filter(c => c.status === 'medical').length,
      fostering: cases.filter(c => c.status === 'fostering').length,
      adopted: cases.filter(c => c.status === 'adopted').length,
      archived: cases.filter(c => c.status === 'archived').length,
      inCare: cases.filter(c => c.status === 'in_care').length,
      pendingReview: cases.filter(c => c.status === 'medical' || c.medicalStatus === 'treating').length,
    };
  }, [cases]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, keyword: searchKeyword || undefined });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const filteredCases = useMemo(() => {
    return getFilteredCases();
  }, [filters, getFilteredCases]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setFilters({ ...filters, keyword: undefined });
  };

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      setFilters({ ...filters, status: undefined });
    } else {
      const currentStatus = filters.status || [];
      const isSelected = currentStatus.includes(status as any);
      const newStatus = isSelected 
        ? currentStatus.filter(s => s !== status)
        : [...currentStatus, status as any];
      setFilters({ ...filters, status: newStatus.length > 0 ? newStatus : undefined });
    }
  };

  const isStatusSelected = (status: string) => {
    if (status === 'all') return !filters.status || filters.status.length === 0;
    return filters.status?.includes(status as any);
  };

  const statCards = [
    { label: '全部个案', value: stats.total, icon: PawPrint, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: '医疗中', value: stats.medical, icon: Stethoscope, color: 'bg-red-500', bg: 'bg-red-50' },
    { label: '待寄养', value: stats.inCare, icon: Home, color: 'bg-orange-500', bg: 'bg-orange-50' },
    { label: '寄养中', value: stats.fostering, icon: Home, color: 'bg-primary-500', bg: 'bg-primary-50' },
    { label: '已领养', value: stats.adopted, icon: Heart, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: '已归档', value: stats.archived, icon: Archive, color: 'bg-warm-500', bg: 'bg-warm-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-800 font-serif">工作台</h1>
          <p className="text-warm-500 mt-1">欢迎回来，查看今日待办和个案进度</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-5 h-5" />
          登记新个案
        </button>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4 card-hover cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warm-800">{stat.value}</p>
                  <p className="text-sm text-warm-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">待处理任务</h2>
            <span className="text-sm text-warm-500">共 {stats.pendingReview} 项待处理</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-warm-800">医疗费用待复核</p>
                <p className="text-sm text-warm-500">花花（RESCUE-2026-005）手术费用需补录明细</p>
              </div>
              <span className="text-xs text-orange-600 font-medium">需补录</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-warm-800">领养申请待审核</p>
                <p className="text-sm text-warm-500">灰灰（RESCUE-2026-006）有新的领养申请</p>
              </div>
              <span className="text-xs text-yellow-600 font-medium">审核中</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-warm-800">回访计划即将到期</p>
                <p className="text-sm text-warm-500">大黄（RESCUE-2026-002）领养后一周回访</p>
              </div>
              <span className="text-xs text-blue-600 font-medium">今日</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-4">快速筛选</h2>
          <div className="space-y-2">
            {[
              { status: 'all', label: '全部个案', count: stats.total },
              { status: 'registered', label: '已登记', count: stats.total - stats.medical - stats.inCare - stats.fostering - stats.adopted - stats.archived },
              { status: 'medical', label: '医疗中', count: stats.medical },
              { status: 'in_care', label: '待寄养', count: stats.inCare },
              { status: 'fostering', label: '寄养中', count: stats.fostering },
              { status: 'adopted', label: '已领养', count: stats.adopted },
              { status: 'archived', label: '已归档', count: stats.archived },
            ].map((item) => (
              <button
                key={item.status}
                onClick={() => handleStatusFilter(item.status)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isStatusSelected(item.status)
                    ? 'bg-primary-50 text-primary-700' 
                    : 'hover:bg-warm-50 text-warm-700'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-sm font-medium">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">个案列表</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                type="text"
                placeholder="搜索个案编号、名称..."
                value={searchKeyword}
                onChange={handleSearch}
                className="input pl-10 pr-10 w-64"
              />
              {searchKeyword && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              className="btn btn-outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-warm-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-warm-500">个案编号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-warm-500">动物信息</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-warm-500">救助日期</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-warm-500">个案状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-warm-500">医疗状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-warm-500">累计费用</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-warm-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((caseItem) => {
                const medicalRecords = useCaseStore.getState().getMedicalRecordsByCaseId(caseItem.id);
                const totalCost = medicalRecords.reduce((sum, r) => sum + r.cost, 0);
                
                return (
                  <tr 
                    key={caseItem.id} 
                    className="border-b border-warm-50 hover:bg-warm-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/case/${caseItem.id}`)}
                  >
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-warm-600">{caseItem.caseNo}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                          <PawPrint className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-warm-800">{caseItem.animalName}</p>
                          <p className="text-xs text-warm-500">
                            {formatAnimalType(caseItem.animalType)} · {caseItem.breed}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-warm-600">
                      {formatDate(caseItem.rescueDate)}
                    </td>
                    <td className="py-4 px-4">
                      <StatusTag type="case" status={caseItem.status} />
                    </td>
                    <td className="py-4 px-4">
                      <StatusTag type="medical" status={caseItem.medicalStatus} />
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-warm-700">
                      {formatCurrency(totalCost)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1">
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
