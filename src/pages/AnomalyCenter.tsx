import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, RefreshCw, Filter, MessageSquare } from 'lucide-react';
import { useAnomalyStore } from '../stores/anomalyStore';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { formatDateTime } from '../utils/storage';
import { AnomalyStatus, AnomalyType } from '../types';

const AnomalyCenter: React.FC = () => {
  const { anomalies, getOpenAnomalies, updateAnomalyStatus, runAllChecks } = useAnomalyStore();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAnomaly, setSelectedAnomaly] = useState<string | null>(null);
  const [handlingNote, setHandlingNote] = useState('');

  useEffect(() => {
    runAllChecks();
  }, [runAllChecks]);

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'room_conflict', label: '包厢撞档' },
    { value: 'drink_gift_issue', label: '酒水赠送' },
    { value: 'member_balance_issue', label: '会员账务' },
    { value: 'other', label: '其他' },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'open', label: '待处理' },
    { value: 'handling', label: '处理中' },
    { value: 'resolved', label: '已解决' },
    { value: 'ignored', label: '已忽略' },
  ];

  const filteredAnomalies = anomalies.filter((a) => {
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchType && matchStatus;
  }).sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const handleUpdateStatus = (id: string, status: AnomalyStatus) => {
    updateAnomalyStatus(id, status, handlingNote || undefined);
    setSelectedAnomaly(null);
    setHandlingNote('');
  };

  const typeLabels: Record<string, { label: string; icon: typeof AlertTriangle }> = {
    room_conflict: { label: '包厢撞档', icon: AlertTriangle },
    drink_gift_issue: { label: '酒水赠送', icon: AlertCircle },
    member_balance_issue: { label: '会员账务', icon: AlertCircle },
    other: { label: '其他异常', icon: AlertCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => runAllChecks()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重新检测
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-400 text-sm">高危异常</p>
              <p className="text-2xl font-bold text-red-400">
                {getOpenAnomalies().filter((a) => a.severity === 'high').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-amber-400 text-sm">中危异常</p>
              <p className="text-2xl font-bold text-amber-400">
                {getOpenAnomalies().filter((a) => a.severity === 'medium').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-blue-400 text-sm">低危异常</p>
              <p className="text-2xl font-bold text-blue-400">
                {getOpenAnomalies().filter((a) => a.severity === 'low').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="font-semibold">异常列表</h3>
        </div>
        <div className="divide-y divide-slate-800/50">
          {filteredAnomalies.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-400">暂无异常记录</p>
            </div>
          ) : (
            filteredAnomalies.map((anomaly) => {
              const typeInfo = typeLabels[anomaly.type] || typeLabels.other;
              const TypeIcon = typeInfo.icon;
              const isExpanded = selectedAnomaly === anomaly.id;

              return (
                <div key={anomaly.id} className="hover:bg-slate-800/30">
                  <div
                    className="px-5 py-4 cursor-pointer"
                    onClick={() => setSelectedAnomaly(isExpanded ? null : anomaly.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${
                          anomaly.severity === 'high' ? 'bg-red-500/10' :
                          anomaly.severity === 'medium' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                        }`}>
                          <TypeIcon className={`w-5 h-5 ${
                            anomaly.severity === 'high' ? 'text-red-400' :
                            anomaly.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <SeverityBadge severity={anomaly.severity} />
                            <span className="text-xs text-slate-400">{typeInfo.label}</span>
                          </div>
                          <p className="text-sm text-slate-200 truncate">{anomaly.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <div className="text-right">
                          <StatusBadge status={anomaly.status as AnomalyStatus} type="anomaly" />
                          <p className="text-xs text-slate-500 mt-1">{formatDateTime(anomaly.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (anomaly.status === 'open' || anomaly.status === 'handling') && (
                    <div className="px-5 pb-4 border-t border-slate-800/50 pt-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">处理说明</label>
                          <textarea
                            value={handlingNote}
                            onChange={(e) => setHandlingNote(e.target.value)}
                            placeholder="输入处理说明..."
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                            rows={2}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(anomaly.id, 'handling');
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm transition-colors"
                          >
                            标记处理中
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(anomaly.id, 'resolved');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition-colors"
                          >
                            标记已解决
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(anomaly.id, 'ignored');
                            }}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                          >
                            忽略
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpanded && anomaly.handlingNote && (
                    <div className="px-5 pb-4 border-t border-slate-800/50 pt-4">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            处理人：{anomaly.handledBy} · {formatDateTime(anomaly.handledAt!)}
                          </p>
                          <p className="text-sm text-slate-300">{anomaly.handlingNote}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomalyCenter;
