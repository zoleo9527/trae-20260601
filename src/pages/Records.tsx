import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, History, ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import type { UnloadRecord, OperationLog, RecordStatus } from '../../shared/types';
import { STATUS_LABELS, DISCREPANCY_LABELS } from '../../shared/types';

export default function Records() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState<UnloadRecord[]>([]);
  const [allRecords, setAllRecords] = useState<UnloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPlate, setSearchPlate] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<RecordStatus | 'all'>(
    (searchParams.get('status') as RecordStatus | 'all') || 'all'
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, OperationLog[]>>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [targetRecordOutsideFilter, setTargetRecordOutsideFilter] = useState<UnloadRecord | null>(null);
  const recordRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const targetRecordId = searchParams.get('recordId');

  function updateSearch(value: string) {
    setSearchPlate(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.delete('recordId');
    setSearchParams(params, { replace: true });
    setTargetRecordOutsideFilter(null);
  }

  function updateStatusFilter(value: RecordStatus | 'all') {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    params.delete('recordId');
    setSearchParams(params, { replace: true });
    setTargetRecordOutsideFilter(null);
  }

  function clearTargetRecord() {
    const params = new URLSearchParams(searchParams);
    params.delete('recordId');
    setSearchParams(params, { replace: true });
    setHighlightedId(null);
    setTargetRecordOutsideFilter(null);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [allData, filteredData] = await Promise.all([
        api.getRecords(),
        api.getRecords({
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(searchPlate && { plateNumber: searchPlate }),
        }),
      ]);
      setAllRecords(allData);
      setRecords(filteredData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [searchPlate, statusFilter]);

  useEffect(() => {
    if (!loading && targetRecordId && allRecords.length > 0) {
      const targetInAll = allRecords.find(r => r.id === targetRecordId);
      const targetInFiltered = records.find(r => r.id === targetRecordId);

      if (targetInAll) {
        if (!targetInFiltered) {
          setTargetRecordOutsideFilter(targetInAll);
        }
        if (!logs[targetRecordId]) {
          api.getLogs(targetRecordId).then(logData => {
            setLogs(prev => ({ ...prev, [targetRecordId]: logData }));
          }).catch(console.error);
        }
        setExpandedId(targetRecordId);
        setTimeout(() => {
          const el = recordRefs.current.get(targetRecordId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedId(targetRecordId);
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 200);
      }
    }
  }, [loading, targetRecordId, allRecords, records]);

  async function handleExpand(record: UnloadRecord) {
    if (expandedId === record.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(record.id);
    if (!logs[record.id]) {
      try {
        const logData = await api.getLogs(record.id);
        setLogs(prev => ({ ...prev, [record.id]: logData }));
      } catch (e) {
        console.error(e);
      }
    }
  }

  function renderRecordRow(record: UnloadRecord, isOutsideFilter: boolean) {
    return (
      <div
        key={record.id}
        ref={(el) => {
          if (el) recordRefs.current.set(record.id, el);
        }}
        className={`bg-slate-800/30 rounded-xl border overflow-hidden transition-all duration-300 ${
          highlightedId === record.id
            ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20 bg-blue-500/10'
            : isOutsideFilter
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-slate-700/50'
        }`}
      >
        <button
          onClick={() => handleExpand(record)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <div className="grid grid-cols-6 gap-6 text-sm items-center">
              <div>
                <p className="text-xs text-slate-500">车牌号</p>
                <p className="font-medium text-slate-100">{record.plateNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">司机</p>
                <p className="text-slate-300">{record.driverName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">货品</p>
                <p className="text-slate-300">{record.cargoType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">件数 (计划/实收)</p>
                <p className="text-slate-300">
                  {record.plannedQuantity} / {record.actualQuantity ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">月台</p>
                <p className="text-slate-300">{record.dockNumber ? `${record.dockNumber}号` : '-'}</p>
              </div>
              <div className="flex items-center">
                <StatusBadge status={record.status} size="sm" />
              </div>
            </div>
          </div>
          {expandedId === record.id ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {expandedId === record.id && (
          <div className="border-t border-slate-700/50 p-5 bg-slate-900/30">
            <div className="grid grid-cols-4 gap-6 mb-5">
              <div>
                <p className="text-xs text-slate-500 mb-1">签到时间</p>
                <p className="text-sm text-slate-300">{formatDateTime(record.checkinTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">开始卸货</p>
                <p className="text-sm text-slate-300">{formatDateTime(record.startTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">卸货完成</p>
                <p className="text-sm text-slate-300">{formatDateTime(record.endTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">创建时间</p>
                <p className="text-sm text-slate-300">{formatDateTime(record.createdAt)}</p>
              </div>
            </div>

            {record.discrepancyType && (
              <div className="mb-5 space-y-3">
                <h4 className="text-sm font-medium text-orange-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  差异信息
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">差异类型</p>
                    <p className="text-sm text-slate-200 font-medium">{DISCREPANCY_LABELS[record.discrepancyType]}</p>
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">差异数量</p>
                    <p className="text-sm text-orange-400 font-medium">{record.discrepancyQuantity} 件</p>
                  </div>
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-xs text-orange-400/80 mb-1">退回原因</p>
                    <p className="text-sm text-orange-200">{record.returnReason || '无'}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-400/80 mb-1">补充备注</p>
                    <p className="text-sm text-blue-200">{record.remark || '无'}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                操作日志
              </h4>
              {logs[record.id] ? (
                <div className="max-h-64 overflow-y-auto pr-2">
                  <Timeline logs={logs[record.id]} />
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500 text-sm">加载中...</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  function formatDateTime(iso?: string) {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  const statusOptions: { key: RecordStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部状态' },
    { key: 'pending', label: '待签到' },
    { key: 'checkin', label: '已签到' },
    { key: 'unloading', label: '卸货中' },
    { key: 'finished', label: '卸货完成' },
    { key: 'discrepancy', label: '差异中' },
    { key: 'completed', label: '已完成' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">历史记录</h1>
        <p className="text-slate-400 text-sm mt-1">查询和回看所有卸货记录</p>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchPlate}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="搜索车牌号..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          />
          {searchPlate && (
            <button
              onClick={() => updateSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => updateStatusFilter(e.target.value as RecordStatus | 'all')}
          className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
        >
          {statusOptions.map(opt => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
        {targetRecordId && (
          <div className="ml-auto flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <span className="text-xs text-blue-300">已定位到目标记录</span>
            <button
              onClick={clearTargetRecord}
              className="text-blue-400 hover:text-blue-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          暂无匹配的记录
        </div>
      ) : (
        <div className="space-y-2">
          {targetRecordOutsideFilter && (
            <div className="mb-2">
              <div className="text-xs text-amber-400 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                目标记录不在当前筛选范围内，已置顶显示
              </div>
              {renderRecordRow(targetRecordOutsideFilter, true)}
            </div>
          )}
          {records.length > 0 && targetRecordOutsideFilter && (
            <div className="pt-2 mt-2 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2">筛选结果 ({records.length})</p>
            </div>
          )}
          {records
            .filter(r => r.id !== targetRecordOutsideFilter?.id)
            .map(record => renderRecordRow(record, false))}
        </div>
      )}
    </div>
  );
}
