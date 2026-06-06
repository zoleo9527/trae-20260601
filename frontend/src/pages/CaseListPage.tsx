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

  useEffect(() => {
    loadCases();
  }, [role, filterStatus]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases(role, filterStatus || undefined);
      setCases(data);
    } catch (error) {
      console.error('Failed to load cases:', error);
    }
    setLoading(false);
  };

  const handleExport = () => {
    api.exportCases(role, filterStatus || undefined);
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

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>结案记录</h2>
        <div className="header-actions">
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
          <button className="btn btn-primary" onClick={handleExport}>
            导出Excel
          </button>
        </div>
      </div>

      <div className="case-table-container">
        <table className="case-table">
          <thead>
            <tr>
              <th>案例ID</th>
              <th>品牌</th>
              <th>产品</th>
              <th>达人</th>
              <th>状态</th>
              <th>当前处理</th>
              <th>是否延期</th>
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
                <td>{c.currentHandler ? ROLE_LABELS[c.currentHandler] : '-'}</td>
                <td>
                  {c.delayedDays
                    ? <span className="delayed-badge">延期 {c.delayedDays} 天</span>
                    : '否'}
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
