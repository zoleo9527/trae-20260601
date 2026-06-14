import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { delegationService } from '../../services/delegationService.js';
import { STATUS_CONFIG } from '../../utils/constants.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './DelegationList.css';

function DelegationList() {
  const [delegations, setDelegations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const currentStatus = searchParams.get('status') || '';
  const showAbnormal = searchParams.get('isAbnormal') === 'true';

  useEffect(() => {
    loadDelegations();
  }, [currentStatus, showAbnormal]);

  const loadDelegations = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (currentStatus) filters.status = currentStatus;
      if (showAbnormal) filters.isAbnormal = true;

      const response = await delegationService.getAll(filters);
      setDelegations(response.data?.delegations || []);
    } catch (error) {
      console.error('Failed to load delegations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const getStatusLabel = (status) => {
    return STATUS_CONFIG[status]?.label || status;
  };

  const getStatusColor = (status) => {
    return STATUS_CONFIG[status]?.color || '#8c8c8c';
  };

  const canCreate = user?.role === 'acceptor' || user?.role === 'admin';

  return (
    <div className="delegation-list-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">委托单管理</h1>
          <p className="page-subtitle">管理所有委托单，处理材料核验和审核流程</p>
        </div>
        {canCreate && (
          <Link to="/delegations/create" className="create-button">
            + 新建委托单
          </Link>
        )}
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>状态筛选：</label>
          <select
            value={currentStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={showAbnormal}
              onChange={(e) => handleFilterChange('isAbnormal', e.target.checked ? 'true' : '')}
            />
            仅显示异常单
          </label>
        </div>

        <div className="filter-info">
          共 {delegations.length} 条记录
        </div>
      </div>

      {loading ? (
        <div className="loading-container">加载中...</div>
      ) : delegations.length === 0 ? (
        <div className="empty-state">
          <p>暂无委托单</p>
          {canCreate && (
            <Link to="/delegations/create" className="create-button">
              创建第一个委托单
            </Link>
          )}
        </div>
      ) : (
        <div className="delegation-table">
          <table>
            <thead>
              <tr>
                <th>委托单号</th>
                <th>委托方</th>
                <th>案件类型</th>
                <th>当前状态</th>
                <th>创建时间</th>
                <th>责任人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {delegations.map((delegation) => (
                <tr key={delegation.id}>
                  <td>
                    <Link to={`/delegations/${delegation.id}`} className="delegation-link">
                      {delegation.delegation_number}
                    </Link>
                    {delegation.is_abnormal === 1 && (
                      <span className="abnormal-tag">异常</span>
                    )}
                  </td>
                  <td>{delegation.applicant_name}</td>
                  <td>{delegation.case_type}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(delegation.status) }}
                    >
                      {getStatusLabel(delegation.status)}
                    </span>
                  </td>
                  <td>{new Date(delegation.created_at).toLocaleString('zh-CN')}</td>
                  <td>{delegation.current_assignee}</td>
                  <td>
                    <Link to={`/delegations/${delegation.id}`} className="action-link">
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DelegationList;
