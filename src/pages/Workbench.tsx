import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Archive,
  Search,
  ArrowRight,
  PlaySquare,
  FileArchive,
  Shield,
} from 'lucide-react';
import { useApplicationStore } from '../store/useApplicationStore';
import type { ApplicationStatus } from '../types';
import { StatCard } from '../components/StatCard';
import { ApplicationCard } from '../components/ApplicationCard';
import { Sidebar } from '../components/Sidebar';
import { EmptyState } from '../components/EmptyState';
import { cn } from '../lib/utils';

type FilterType = ApplicationStatus | 'all';

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'correction', label: '补正中' },
  { key: 'archived', label: '已归档' },
];

export function Workbench() {
  const navigate = useNavigate();
  const applications = useApplicationStore((s) => s.applications);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useMemo(() => ({
    pending: applications.filter((a) => a.status === 'pending').length,
    correction: applications.filter((a) => a.status === 'correction').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    archived: applications.filter((a) => a.status === 'archived').length,
  }), [applications]);

  const filteredApplications = useMemo(() => {
    let filtered = [...applications];
    if (activeFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === activeFilter);
    }
    return filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      if (a.status === 'correction' && b.status !== 'correction') return -1;
      if (b.status === 'correction' && a.status !== 'correction') return 1;
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });
  }, [applications, activeFilter]);

  const pendingApps = filteredApplications.filter(
    (a) => a.status === 'pending'
  );
  const firstPendingId = pendingApps.length > 0 ? pendingApps[0].id : null;

  const selectedApplication = filteredApplications.find(
    (a) => a.id === selectedId
  ) || null;

  const handleFilterClick = (key: FilterType) => {
    setActiveFilter(key);
    setSelectedId(null);
  };

  const handleStartNext = () => {
    if (firstPendingId) {
      navigate(`/review/${firstPendingId}`);
    }
  };

  const handleCardClick = (id: string) => {
    const app = filteredApplications.find((a) => a.id === id);
    if (app?.status === 'pending' || app?.status === 'correction') {
      navigate(`/review/${id}`);
    } else {
      setSelectedId(id === selectedId ? null : id);
    }
  };

  const statCardConfigs = [
    {
      key: 'pending' as const,
      label: '待审核',
      icon: Clock,
      color: 'blue' as const,
      value: stats.pending,
    },
    {
      key: 'correction' as const,
      label: '补正中',
      icon: ClipboardList,
      color: 'amber' as const,
      value: stats.correction,
    },
    {
      key: 'archived' as const,
      label: '已归档',
      icon: Archive,
      color: 'emerald' as const,
      value: stats.archived,
    },
    {
      key: 'all' as const,
      label: '今日通过',
      icon: CheckCircle2,
      color: 'navy' as const,
      value: 2,
    },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--surface-ground)' }}>
      <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b shadow-nav" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy-700 to-navy-800 flex items-center justify-center shadow-sm">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 font-serif-heading tracking-wide">
              公证处审核工作面
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">公证员工作台 · 连续处理模式</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索预约号、申请人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-400 transition-all"
            />
          </div>
          <button
            onClick={() => navigate('/archive')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <FileArchive className="w-3.5 h-3.5" />
            归档回看
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-50 rounded-lg border border-navy-100">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy-600 to-navy-700 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">王</span>
            </div>
            <div className="text-xs">
              <p className="font-medium text-navy-800">王公证员</p>
              <p className="text-[10px] text-navy-500">当班中</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-5">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {statCardConfigs.map((config) => (
                <StatCard
                  key={config.key}
                  label={config.label}
                  value={config.value}
                  icon={config.icon}
                  color={config.color}
                  active={activeFilter === config.key}
                  onClick={() => handleFilterClick(config.key)}
                />
              ))}
            </div>
          </div>

          <div className="px-6 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleFilterClick(filter.key)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                      activeFilter === filter.key
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-600'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400">
              共 <span className="font-semibold text-slate-600">{filteredApplications.length}</span> 条记录
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-20">
            {filteredApplications.length === 0 ? (
              searchQuery ? (
                <EmptyState type="no-search" />
              ) : (
                <EmptyState type="no-pending" />
              )
            ) : (
              <div className="space-y-2.5">
                {filteredApplications.map((app, index) => (
                  <div
                    key={app.id}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className="animate-fadeInUp"
                  >
                    <ApplicationCard
                      application={app}
                      onClick={() => handleCardClick(app.id)}
                      selected={selectedId === app.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-[360px] flex-shrink-0">
          <Sidebar application={selectedApplication} mode="review" />
        </div>
      </div>

      {firstPendingId && (
        <button
          onClick={handleStartNext}
          className="fixed bottom-6 right-[380px] flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-navy-700 to-navy-800 text-white text-sm font-semibold rounded-xl shadow-elevated hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 z-50"
        >
          <PlaySquare className="w-4 h-4" />
          <span>处理下一个</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
