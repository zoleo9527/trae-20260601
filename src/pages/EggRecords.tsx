import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app';
import type { EggRecord, Anomaly } from '@/lib/api';

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待完成' },
  { key: 'completed', label: '已完成' },
  { key: 'anomaly', label: '异常' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: '待完成',
  completed: '已完成',
  anomaly: '异常',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-farm-orange/20 text-farm-orange',
  completed: 'bg-farm-green/20 text-farm-green',
  anomaly: 'bg-farm-red/20 text-farm-red',
};

export default function EggRecords() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openAnomalyDrawer } = useAppStore();
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [coopFilter, setCoopFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setActiveTab(statusParam);
  }, [searchParams]);

  const fetchRecords = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (coopFilter) params.coop = coopFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.eggRecords.list(params);
      setRecords(res.data || []);
    } catch {
      setRecords([]);
    }
  }, [activeTab, coopFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleExport = () => {
    const params: Record<string, string> = {};
    if (activeTab !== 'all') params.status = activeTab;
    if (coopFilter) params.coop = coopFilter;
    api.eggRecords.exportCsv(params);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
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
            className="bg-farm-card border border-farm-border rounded px-3 py-1.5 text-sm text-farm-text"
          >
            <option value="">全部鸡舍</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="A3">A3</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="B3">B3</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-farm-card border border-farm-border rounded px-3 py-1.5 text-sm text-farm-text"
          />
          <span className="text-farm-muted">至</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-farm-card border border-farm-border rounded px-3 py-1.5 text-sm text-farm-text"
          />
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
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">巡检卡号</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">总产蛋</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">破蛋</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">脏蛋</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">A级</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">B级</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">C级</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">状态</th>
              <th className="text-left text-farm-muted text-xs font-bold px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-farm-muted py-8">
                  暂无产蛋记录
                </td>
              </tr>
            )}
            {records.map((rec) => (
              <tr
                key={rec.id}
                className={`border-b border-farm-border/50 hover:bg-farm-card/80 transition-colors cursor-pointer ${
                  rec.has_anomaly ? 'border-l-2 border-l-farm-red' : ''
                }`}
                onClick={() => navigate(`/egg-records/${rec.id}`)}
              >
                <td className="px-4 py-3 text-farm-text font-bold">{rec.coop_code || `鸡舍#${rec.coop_id}`}</td>
                <td className="px-4 py-3 text-farm-muted text-sm font-mono">
                  {rec.inspection_id ? `#${rec.inspection_id}` : '-'}
                </td>
                <td className="px-4 py-3 text-farm-text font-mono">{rec.total_eggs}</td>
                <td className="px-4 py-3 text-farm-red font-mono">{rec.broken_eggs}</td>
                <td className="px-4 py-3 text-farm-yellow font-mono">{rec.dirty_eggs}</td>
                <td className="px-4 py-3 text-farm-green font-mono">{rec.grade_a}</td>
                <td className="px-4 py-3 text-farm-text font-mono">{rec.grade_b}</td>
                <td className="px-4 py-3 text-farm-muted font-mono">{rec.grade_c}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[rec.status]}`}>
                    {STATUS_LABELS[rec.status]}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {rec.has_anomaly && (
                    <button
                      onClick={() => openAnomalyDrawer({ id: rec.id } as Anomaly)}
                      className="bg-farm-red/20 text-farm-red px-3 py-1 rounded text-xs hover:bg-farm-red/30"
                    >
                      查看异常
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
