import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CaseRecord, CaseStatus, ROLE_LABELS, STATUS_COLORS, STATUS_LABELS, UserRole } from '../types';

interface CaseListPageProps {
  role: UserRole;
  onViewCase: (caseId: string) => void;
}

const CaseListPage: React.FC<CaseListPageProps> = ({ role, onViewCase }) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CaseStatus | ''>('');
  const [filterHandler, setFilterHandler] = useState<UserRole | ''>('');
  const [filterHasReject, setFilterHasReject] = useState<string>('');
  const [filterHasSupplementary, setFilterHasSupplementary] = useState<string>('');

  useEffect(() => {
    loadCases();
  }, [role, filterStatus, filterHandler, filterHasReject, filterHasSupplementary]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases(role, {
        status: filterStatus || undefined,
        currentHandler: filterHandler || undefined,
        hasReject: filterHasReject === '' ? undefined : filterHasReject === 'true',
        hasSupplementary: filterHasSupplementary === '' ? undefined : filterHasSupplementary === 'true'
      });
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    }
    setLoading(false);
  };

  const handleExport = () => {
    api.exportCases(role, {
      status: filterStatus || undefined,
      currentHandler: filterHandler || undefined,
      hasReject: filterHasReject === '' ? undefined : filterHasReject === 'true',
      hasSupplementary: filterHasSupplementary === '' ? undefined : filterHasSupplementary === 'true'
    });
  };

  const statusOptions: CaseStatus[] = [
    'pending_script',
    'scripting',
    'pending_approval',
    'shooting',
    'pending_data',
    'data_submitted',
    'data_rejected',
    'pending_settlement',
    'settlement_pending_review',
    'settlement_rejected',
    'completed',
    'delayed'
  ];

  const handlerOptions: UserRole[] = ['business', 'director', 'talent_agent', 'finance'];

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>结案记录</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleExport}>
            导出Excel
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as CaseStatus | '')}
        >
          <option value="">全部状态</option>
          {statusOptions.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterHandler}
          onChange={(e) => setFilterHandler(e.target.value as UserRole | '')}
        >
          <option value="">全部处理角色</option>
          {handlerOptions.map(h => (
            <option key={h} value={h}>{ROLE_LABELS[h]}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterHasReject}
          onChange={(e) => setFilterHasReject(e.target.value)}
        >
          <option value="">全部驳回状态</option>
          <option value="true">有驳回记录</option>
          <option value="false">无驳回记录</option>
        </select>

        <select
          className="filter-select"
          value={filterHasSupplementary}
          onChange={(e) => setFilterHasSupplementary(e.target.value)}
        >
          <option value="">全部补录状态</option>
          <option value="true">有补录备注</option>
          <option value="false">无补录备注</option>
        </select>
      </div>

      <div className="case-table-container">
        <table className="case-table wide">
          <thead>
            <tr>
              <th>案例ID</th>
              <th>品牌</th>
              <th>产品</th>
              <th>达人</th>
              <th>状态</th>
              <th>当前责任角色</th>
              <th>商务</th>
              <th>经纪</th>
              <th>有驳回</th>
              <th>最近退回原因</th>
              <th>有补录</th>
              <th>补录摘要</th>
              <th>有延期</th>
              <th>延期摘要</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => (
              <tr key={c.id}>
                <td className="case-id">{c.id}</td>
                <td>{c.brandName}</td>
                <td>{c.productName}</td>
                <td>{c.talentName}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: STATUS_COLORS[c.status] }}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td>{c.responsibleRole || '-'}</td>
                <td>{c.businessName || '-'}</td>
                <td>{c.agentName || '-'}</td>
                <td>
                  {c.hasReject
                    ? <span className="tag tag-danger">是</span>
                    : <span className="tag tag-muted">否</span>}
                </td>
                <td className="text-ellipsis" title={c.latestRejectReason}>
                  {c.latestRejectReason || '-'}
                </td>
                <td>
                  {c.hasSupplementary
                    ? <span className="tag tag-warning">是</span>
                    : <span className="tag tag-muted">否</span>}
                </td>
                <td className="text-ellipsis" title={c.supplementarySummary}>
                  {c.supplementarySummary || '-'}
                </td>
                <td>
                  {c.hasDelay
                    ? <span className="tag tag-warning">是</span>
                    : <span className="tag tag-muted">否</span>}
                </td>
                <td className="text-ellipsis" title={c.delaySummary}>
                  {c.delaySummary || '-'}
                </td>
                <td>{new Date(c.updatedAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-link"
                    onClick={() => onViewCase(c.id)}
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CaseListPage;
