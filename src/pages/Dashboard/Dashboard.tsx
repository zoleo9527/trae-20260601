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
  X,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    cases, 
    medicalRecords, 
    fosterRecords, 
    reviewLogs,
    getFilteredCases, 
    setFilters, 
    filters 
  } = useCaseStore();
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
    };
  }, [cases]);

  const pendingTasks = useMemo(() => {
    const tasks: Array<{
      id: string;
      type: 'medical' | 'foster' | 'archive' | 'return' | 'supplement';
      title: string;
      description: string;
      caseId: string;
      caseName: string;
      caseNo: string;
      status: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    medicalRecords.forEach(r => {
      if (r.reviewStatus === 'supplement_needed') {
        const caseData = cases.find(c => c.id === r.caseId);
        if (caseData) {
          tasks.push({
            id: `med_sup_${r.id}`,
            type: 'supplement',
            title: '医疗记录需补录',
            description: `${r.diagnosis} - ${r.treatment.substring(0, 30)}...`,
            caseId: r.caseId,
            caseName: caseData.animalName,
            caseNo: caseData.caseNo,
            status: '需补录',
            priority: 'high',
          });
        }
      } else if (r.reviewStatus !== 'approved') {
        const caseData = cases.find(c => c.id === r.caseId);
        if (caseData) {
          tasks.push({
            id: `med_${r.id}`,
            type: 'medical',
            title: '医疗费用待复核',
            description: `${r.diagnosis}，费用 ¥${r.cost}`,
            caseId: r.caseId,
            caseName: caseData.animalName,
            caseNo: caseData.caseNo,
            status: '待复核',
            priority: 'medium',
          });
        }
      }
    });

    fosterRecords.filter(f => f.status === 'ended').forEach(f => {
      const fosterReview = reviewLogs.find(r => r.caseId === f.caseId && r.type === 'foster');
      if (!fosterReview || fosterReview.status !== 'approved') {
        const caseData = cases.find(c => c.id === f.caseId);
        if (caseData) {
          tasks.push({
            id: `foster_${f.id}`,
            type: 'foster',
            title: '寄养记录待复核',
            description: `寄养家庭：${f.fosterFamilyName}`,
            caseId: f.caseId,
            caseName: caseData.animalName,
            caseNo: caseData.caseNo,
            status: fosterReview?.status === 'supplement_needed' ? '需补录' : '待复核',
            priority: 'medium',
          });
        }
      }
    });

    cases.filter(c => c.status === 'adopted').forEach(c => {
      const archiveReview = reviewLogs.find(r => r.caseId === c.id && r.type === 'archive');
      if (!archiveReview || archiveReview.status !== 'approved') {
        tasks.push({
          id: `archive_${c.id}`,
          type: 'archive',
          title: '个案待归档',
          description: '领养完成，待复核归档',
          caseId: c.id,
          caseName: c.animalName,
          caseNo: c.caseNo,
          status: archiveReview?.status === 'supplement_needed' ? '需补录' : '待归档',
          priority: 'low',
        });
      }
    });

    fosterRecords.filter(f => (f.status === 'returned' || (f.status === 'ended' && f.returnReason))).forEach(f => {
      const caseData = cases.find(c => c.id === f.caseId);
      if (caseData && (caseData.status === 'in_care' || caseData.status === 'registered')) {
        const hasActiveFoster = fosterRecords.some(fr => fr.caseId === f.caseId && fr.status === 'active');
        if (!hasActiveFoster) {
          tasks.push({
            id: `return_${f.id}`,
            type: 'return',
            title: '寄养退回待处理',
            description: `退回原因：${(f.returnReason || '无').substring(0, 30)}...`,
            caseId: f.caseId,
            caseName: caseData.animalName,
            caseNo: caseData.caseNo,
            status: '待重新安排',
            priority: 'high',
          });
        }
      }
    });

    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [cases, medicalRecords, fosterRecords, reviewLogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, keyword: searchKeyword || undefined }));
    }, 200);
    return () => clearTimeout(timer);
  }, [searchKeyword, setFilters]);

  const filteredCases = useMemo(() => {
    return getFilteredCases();
  }, [filters, getFilteredCases]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setFilters((prev) => ({ ...prev, keyword: undefined }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => {
      if (status === 'all') {
        return { ...prev, status: undefined };
      }
      const currentStatus = prev.status || [];
      const isSelected = currentStatus.includes(status as any);
      const newStatus = isSelected 
        ? currentStatus.filter(s => s !== status)
        : [...currentStatus, status as any];
      return { ...prev, status: newStatus.length > 0 ? newStatus : undefined };
    });
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
            <span className="text-sm text-warm-500">共 {pendingTasks.length} 项待处理</span>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => {
                const typeConfig = {
                  medical: { bg: 'bg-red-50', border: 'border-red-100', iconBg: 'bg-red-100', icon: Stethoscope, text: 'text-red-600' },
                  supplement: { bg: 'bg-orange-50', border: 'border-orange-100', iconBg: 'bg-orange-100', icon: AlertTriangle, text: 'text-orange-600' },
                  foster: { bg: 'bg-primary-50', border: 'border-primary-100', iconBg: 'bg-primary-100', icon: Home, text: 'text-primary-600' },
                  archive: { bg: 'bg-warm-50', border: 'border-warm-200', iconBg: 'bg-warm-100', icon: Archive, text: 'text-warm-600' },
                  return: { bg: 'bg-yellow-50', border: 'border-yellow-100', iconBg: 'bg-yellow-100', icon: RotateCcw, text: 'text-yellow-600' },
                };
                const config = typeConfig[task.type as keyof typeof typeConfig] || typeConfig.medical;
                const Icon = config.icon;
                
                const statusColors = {
                  '需补录': 'text-orange-600 bg-orange-100',
                  '待复核': 'text-yellow-600 bg-yellow-100',
                  '待归档': 'text-warm-600 bg-warm-100',
                  '待重新安排': 'text-red-600 bg-red-100',
                };

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (task.type === 'return' || task.type === 'foster') {
                        navigate(`/case/${task.caseId}/foster`);
                      } else if (task.type === 'medical' || task.type === 'supplement') {
                        navigate('/review');
                      } else if (task.type === 'archive') {
                        navigate('/review');
                      } else {
                        navigate(`/case/${task.caseId}`);
                      }
                    }}
                    className={`flex items-center gap-4 p-3 ${config.bg} rounded-lg border ${config.border} cursor-pointer hover:shadow-sm transition-shadow`}
                  >
                    <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-warm-800">{task.title}</p>
                      <p className="text-sm text-warm-500 truncate">
                        {task.caseName}（{task.caseNo}）{task.description}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[task.status] || 'bg-warm-100 text-warm-600'}`}>
                      {task.status}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-warm-500">暂无待处理任务</p>
              </div>
            )}
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
