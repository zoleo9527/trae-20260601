import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Review, STATUS_LABELS, STATUS_COLORS, SEVERITY_LABELS, SEVERITY_COLORS } from '../types';

const ReviewList: React.FC = () => {
  const navigate = useNavigate();
  const { role, userName } = useAuth();
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [handlerFilter, setHandlerFilter] = useState(searchParams.get('handler') || 'all');

  useEffect(() => {
    fetchList();
  }, [statusFilter, handlerFilter, role, userName]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (handlerFilter !== 'all') params.set('handler', handlerFilter);
      params.set('role', role);
      params.set('userName', userName);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const unassignedCount = Array.isArray(list) ? list.filter(r => !r.rect_handler_name).length : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">闭店复查</div>
          <div className="page-subtitle">
            共 {list.length} 条记录
            {unassignedCount > 0 && (
              <span style={{ marginLeft: 12, color: 'var(--warning)' }}>
                ⚠️ 其中 {unassignedCount} 条整改单负责人待指派，请先补录再复查
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filter-bar">
            <div className="filter-item">
              <label>复查状态：</label>
              <select
                className="select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">全部</option>
                <option value="pending">待复查</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            <div className="filter-item">
              <label>负责人：</label>
              <select
                className="select"
                value={handlerFilter}
                onChange={e => setHandlerFilter(e.target.value)}
              >
                <option value="all">全部</option>
                <option value="unassigned">待指派</option>
                <option value="assigned">已指派</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : list.length === 0 ? (
            <div className="empty-state">暂无复查记录</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>复查编号</th>
                  <th>关联整改单</th>
                  <th>店铺</th>
                  <th>整改负责人</th>
                  <th>整改状态</th>
                  <th>复查人</th>
                  <th>复查日期</th>
                  <th>结果</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>#{item.id}</td>
                    <td>
                      <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate(`/rectifications/${item.rectification_id}`)}>
                        #整改{item.rectification_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{item.store_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.brand}</div>
                    </td>
                    <td>
                      {item.rect_handler_name ? (
                        <span>{item.rect_handler_name}</span>
                      ) : (
                        <span className="tag tag-warning" style={{ fontSize: 12 }}>待指派</span>
                      )}
                    </td>
                    <td>
                      {item.rect_status ? (
                        <span className={`tag tag-${STATUS_COLORS[item.rect_status]}`}>
                          {STATUS_LABELS[item.rect_status]}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>-</span>
                      )}
                    </td>
                    <td>{item.reviewer_name || '-'}</td>
                    <td>{item.review_date || '-'}</td>
                    <td>
                      {item.result
                        ? (item.result === 'passed' ? (
                          <span className="tag tag-success">通过 ✅</span>
                        ) : (
                          <span className="tag tag-error">未通过 ❌</span>
                        ))
                        : '-'}
                    </td>
                    <td>
                      <span className={`tag tag-${item.status === 'completed' ? 'success' : 'warning'}`}>
                        {item.status === 'completed' ? '已完成' : '待复查'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button className="link-btn" onClick={() => navigate(`/reviews/${item.id}`)}>
                          查看
                        </button>
                        {!item.rect_handler_name && (
                          <button
                            className="link-btn"
                            style={{ color: 'var(--warning)' }}
                            onClick={() => navigate(`/rectifications/${item.rectification_id}`)}
                          >
                            补录负责人
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewList;
