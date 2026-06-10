import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import type { Inspection, Anomaly } from '@/lib/api';

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待巡检' },
  { key: 'in_progress', label: '巡检中' },
  { key: 'pending_confirm', label: '待确认' },
  { key: 'completed', label: '已完成' },
  { key: 'anomaly', label: '异常' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: '待巡检',
  in_progress: '巡检中',
  pending_confirm: '待确认',
  completed: '已完成',
  anomaly: '异常',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-farm-muted/20 text-farm-muted',
  in_progress: 'bg-blue-500/20 text-blue-400',
  pending_confirm: 'bg-farm-orange/20 text-farm-orange',
  completed: 'bg-farm-green/20 text-farm-green',
  anomaly: 'bg-farm-red/20 text-farm-red',
};

export default function Inspection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { openAnomalyDrawer } = useAppStore();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [coopFilter, setCoopFilter] = useState('');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setActiveTab(statusParam === 'overdue' ? 'all' : statusParam);
  }, [searchParams]);

  const fetchInspections = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (coopFilter) params.coop = coopFilter;
      const res = await api.inspections.list(params);
      setInspections(res.data || []);
    } catch {
      setInspections([]);
    }
  }, [activeTab, coopFilter]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleClaim = async (id: number) => {
    try {
      await api.inspections.claim(id);
      fetchInspections();
    } catch {
      // silently handle
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await api.inspections.confirm(id);
      fetchInspections();
    } catch {
      // silently handle
    }
  };

  const handleExport = () => {
    const params: Record<string, string> = {};
    if (activeTab !== 'all') params.status = activeTab;
    api.inspections.exportCsv(params);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const getElapsed = (inspection: Inspection) => {
    const start = inspection.claimed_at || inspection.created_at;
    const end = inspection.completed_at || Math.floor(Date.now() / 1000);
    const minutes = Math.floor((end - start) / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m}m`;
  };

  const isOverdue = (inspection: Inspection) => {
    if (inspection.status === 'completed') return false;
    const start = inspection.claimed_at || inspection.created_at;
    const elapsed = Math.floor(Date.now() / 1000) - start;
    return elapsed > 7200;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-farm-muted" />
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-farm-orange text-white'
                    : 'text-farm-muted hover:text-farm-text hover:bg-farm-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={coopFilter}
            onChange={(e) => setCoopFilter(e.target.value)}
            className="bg-farm-card border border-farm-border rounded px-3 py-1.5 text-sm text-farm-text ml-2"
          >
            <option value="">全部鸡舍</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="A3">A3</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="B3">B3</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-farm-card border border-farm-border text-farm-muted hover:text-farm-text px-3 py-1.5 rounded text-sm transition-colors"
        >
          <Download size={14} />
          导出CSV
        </button>
      </div>

      <div className="bg-farm-card border border-farm-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-farm-border">
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">鸡舍</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">状态</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">巡检员</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">创建时间</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">停留时长</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {inspections.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-farm-muted py-8">
                  暂无巡检记录
                </td>
              </tr>
            )}
            {inspections.map((insp) => {
              const overdue = isOverdue(insp);
              return (
                <tr
                  key={insp.id}
                  className={`border-b border-farm-border/50 hover:bg-farm-card/80 transition-colors cursor-pointer ${
                    overdue ? 'bg-farm-red/5' : ''
                  }`}
                  onClick={() => navigate(`/inspection/${insp.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className={`text-farm-text font-bold ${overdue ? 'text-farm-red' : ''}`}>
                      {insp.coop_code || `鸡舍#${insp.coop_id}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[insp.status]}`}>
                      {STATUS_LABELS[insp.status]}
                    </span>
                    {overdue && (
                      <span className="text-farm-red text-xs ml-1 animate-pulse-overdue">超时</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-farm-muted text-sm">
                    {insp.inspector_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-farm-muted text-sm font-mono">
                    {formatTime(insp.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-sm ${overdue ? 'text-farm-red animate-pulse-overdue' : 'text-farm-muted'}`}>
                      {getElapsed(insp)}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {insp.status === 'pending' && user?.role === 'feeder' && (
                        <button
                          onClick={() => handleClaim(insp.id)}
                          className="bg-farm-orange/20 text-farm-orange px-3 py-1 rounded text-xs hover:bg-farm-orange/30"
                        >
                          领取
                        </button>
                      )}
                      {(insp.status === 'in_progress') && insp.inspector_id === user?.id && (
                        <button
                          onClick={() => navigate(`/inspection/${insp.id}`)}
                          className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs hover:bg-blue-500/30"
                        >
                          填写
                        </button>
                      )}
                      {insp.status === 'pending_confirm' && user?.role === 'sorter' && (
                        <button
                          onClick={() => handleConfirm(insp.id)}
                          className="bg-farm-green/20 text-farm-green px-3 py-1 rounded text-xs hover:bg-farm-green/30"
                        >
                          确认
                        </button>
                      )}
                      {insp.status === 'anomaly' && (
                        <button
                          onClick={() => openAnomalyDrawer({ id: insp.id } as Anomaly)}
                          className="bg-farm-red/20 text-farm-red px-3 py-1 rounded text-xs hover:bg-farm-red/30"
                        >
                          查看异常
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
