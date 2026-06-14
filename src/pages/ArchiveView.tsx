import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  FileArchive,
  Clock,
  User,
  Calendar,
  Building2,
  History,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useApplicationStore } from '../store/useApplicationStore';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { cn } from '../lib/utils';

type FlowType = 'smooth' | 'problem' | 'all';

export function ArchiveView() {
  const navigate = useNavigate();
  const applications = useApplicationStore((s) => s.applications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFlow, setActiveFlow] = useState<FlowType>('all');

  const archivedApps = applications.filter((a) => a.status === 'archived');

  const filtered = archivedApps.filter((app) => {
    if (activeFlow === 'smooth') {
      return app.correctionNotices.length === 0;
    }
    if (activeFlow === 'problem') {
      return app.correctionNotices.length > 0;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.applicantName.toLowerCase().includes(query) ||
        app.appointmentNo.toLowerCase().includes(query) ||
        app.applicationType.toLowerCase().includes(query) ||
        (app.archiveNo && app.archiveNo.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const selectedApplication =
    filtered.find((a) => a.id === selectedId) || null;

  const flowTabs: { key: FlowType; label: string; icon: typeof FileArchive; description: string }[] = [
    { key: 'all', label: '全部', icon: FileArchive, description: '所有归档记录' },
    { key: 'smooth', label: '顺利流', icon: CheckCircle2, description: '材料齐全直接通过' },
    { key: 'problem', label: '问题流', icon: AlertTriangle, description: '经过补正后通过' },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--surface-ground)' }}>
      <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b shadow-nav" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
              <FileArchive className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 font-serif-heading">归档回看</h1>
              <p className="text-[11px] text-slate-400">历史申请记录查询与回溯</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索档案号、预约号、申请人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-200 focus:border-navy-400 transition-all"
          />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b bg-white" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {flowTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveFlow(tab.key);
                        setSelectedId(null);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
                        activeFlow === tab.key
                          ? tab.key === 'smooth'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tab.key === 'problem'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-navy-50 text-navy-700 border border-navy-200'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-slate-400">
                共 <span className="font-semibold text-slate-600">{filtered.length}</span> 条归档
              </div>
            </div>

            {activeFlow === 'smooth' && (
              <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg animate-fadeIn">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">顺利流样例</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      申请人提交材料 → 公证员审核 → 材料齐全无误 → 审核通过 → 自动归档。全程无需补正，一次完成。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeFlow === 'problem' && (
              <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-lg animate-fadeIn">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">问题流样例</p>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      申请人提交材料 → 公证员审核 → 发现材料缺失/有误 → 发送补正通知（标注责任划分点） → 申请人补正 → 再次审核 → 通过归档。补正等待期间责任不在公证员。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 ? (
              <EmptyState type="no-search" title="未找到归档记录" />
            ) : (
              <div className="space-y-2.5">
                {filtered.map((app, index) => (
                  <div
                    key={app.id}
                    onClick={() =>
                      setSelectedId(app.id === selectedId ? null : app.id)
                    }
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={cn(
                      'card-base p-4 cursor-pointer transition-all duration-200 animate-fadeInUp',
                      selectedId === app.id
                        ? 'border-blue-300 shadow-card-active ring-2 ring-blue-100'
                        : 'hover:shadow-card-hover'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          app.correctionNotices.length > 0 ? 'bg-amber-50' : 'bg-emerald-50'
                        )}>
                          <FileArchive className={cn(
                            'w-5 h-5',
                            app.correctionNotices.length > 0 ? 'text-amber-500' : 'text-emerald-500'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono font-bold text-sm text-slate-700 tracking-tight">
                              {app.archiveNo}
                            </span>
                            <StatusBadge status="archived" size="sm" />
                            {app.correctionNotices.length > 0 ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded border border-amber-200">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                问题流
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                顺利流
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            预约号：{app.appointmentNo}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-700">
                          {app.applicationType}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <p className="text-[10px] text-slate-400">申请人</p>
                          <p className="text-xs font-medium text-slate-700">
                            {app.applicantName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <p className="text-[10px] text-slate-400">受理</p>
                          <p className="text-xs font-medium text-slate-700">
                            {app.receivedAt.split(' ')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <p className="text-[10px] text-slate-400">归档</p>
                          <p className="text-xs font-medium text-slate-700">
                            {app.archivedAt?.split(' ')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <p className="text-[10px] text-slate-400">窗口</p>
                          <p className="text-xs font-medium text-slate-700">
                            {app.windowNo}
                          </p>
                        </div>
                      </div>
                    </div>

                    {app.correctionNotices.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded border border-amber-100">
                          <Clock className="w-3 h-3" />
                          补正 {app.correctionNotices.length} 次
                        </span>
                        <span className="text-[10px] text-slate-400">
                          涉及 {app.correctionNotices.reduce((sum, n) => sum + n.items.length, 0)} 项材料
                        </span>
                        <div className="flex-1" />
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          查看详情 <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    )}

                    {app.exceptionNote && (
                      <div className="mt-3 p-2.5 bg-amber-50/80 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-amber-700 font-semibold">异常说明</p>
                            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                              {app.exceptionNote}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-[360px] flex-shrink-0">
          <Sidebar application={selectedApplication} mode="archive" />
        </div>
      </div>
    </div>
  );
}
