import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rectification, STATUS_LABELS, STATUS_COLORS, SEVERITY_LABELS, SEVERITY_COLORS } from '../types';

const RectificationList: React.FC = () => {
  const navigate = useNavigate();
  const { role, userName } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState<Rectification[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || 'all');
  const [storeSearch, setStoreSearch] = useState('');

  useEffect(() => {
    fetchList();
  }, [statusFilter, severityFilter, role, userName]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (storeSearch) params.set('storeName', storeSearch);
      params.set('role', role);
      params.set('userName', userName);

      const res = await fetch(`/api/rectifications?${params.toString()}`);
      const data = await res.json();
      setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (deadline: string, status: string) => {
    if (status === 'completed') return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  const getDaysLeft = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">巡店整改</div>
          <div className="page-subtitle">
            共 {list.length} 条记录 · 按角色和状态筛选
          </div>
        </div>
        {role === 'ops_supervisor' && (
          <button className="btn btn-primary" onClick={() => navigate('/rectifications/new')}>
            ➕ 新建整改单
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filter-bar">
            <div className="filter-item">
              <label>状态：</label>
              <select
                className="select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">全部</option>
                <option value="pending">待整改</option>
                <option value="in_progress">整改中</option>
                <option value="pending_review">待复查</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            <div className="filter-item">
              <label>严重程度：</label>
              <select
                className="select"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="all">全部</option>
                <option value="一般">一般</option>
                <option value="严重">严重</option>
                <option value="紧急">紧急</option>
              </select>
            </div>
            <div className="filter-item">
              <label>店铺：</label>
              <input
                className="input"
                placeholder="搜索店铺名称"
                value={storeSearch}
                onChange={e => setStoreSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchList()}
              />
            </div>
            <button className="btn btn-sm" onClick={fetchList}>🔍 查询</button>
          </div>

          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : list.length === 0 ? (
            <div className="empty-state">暂无整改记录</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>编号</th>
                  <th>店铺</th>
                  <th>问题标题</th>
                  <th>分类</th>
                  <th>严重程度</th>
                  <th>负责人</th>
                  <th>截止日期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => {
                  const overdue = isOverdue(item.deadline, item.status);
                  const daysLeft = getDaysLeft(item.deadline);

                  return (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>#{item.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.store_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.brand}</div>
                      </td>
                      <td style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate(`/rectifications/${item.id}`)}>
                        {item.title}
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <span className={`tag tag-${SEVERITY_COLORS[item.severity]}`}>
                          {SEVERITY_LABELS[item.severity] || item.severity}
                        </span>
                      </td>
                      <td>
                        {item.handler_name ? (
                          <span>{item.handler_name}</span>
                        ) : (
                          <span className="tag tag-default" style={{ fontSize: 12 }}>待指派</span>
                        )}
                      </td>
                      <td>
                        {overdue ? (
                          <span style={{ color: 'var(--error)', fontWeight: 500 }}>
                            已逾期 {Math.abs(daysLeft)} 天
                          </span>
                        ) : daysLeft <= 2 && item.status !== 'completed' ? (
                          <span style={{ color: 'var(--warning)', fontWeight: 500 }}>
                            还剩 {daysLeft} 天
                          </span>
                        ) : (
                          <span>{item.deadline}</span>
                        )}
                      </td>
                      <td>
                        <span className={`tag tag-${STATUS_COLORS[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td>
                        <button className="link-btn" onClick={() => navigate(`/rectifications/${item.id}`)}>
                          查看
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RectificationList;
