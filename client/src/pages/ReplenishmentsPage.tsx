import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { replenishmentsAPI } from '@/api';
import type { Replenishment } from '@/types';
import { useAuth } from '@/context/AuthContext';

const statusMap: Record<string, string> = {
  pending: '待配送',
  delivered: '已配送',
  confirmed: '已确认',
  cancelled: '已取消',
};

const methodMap: Record<string, string> = {
  redelivery: '重新配送',
  refund: '退款',
  replace: '换货',
};

const ReplenishmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [replenishments, setReplenishments] = useState<Replenishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await replenishmentsAPI.getList({
        status: filters.status || undefined,
      });
      setReplenishments(res.data.replenishments);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleDeliver = async (r: Replenishment) => {
    try {
      await replenishmentsAPI.deliver(r.id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleConfirm = async (r: Replenishment) => {
    try {
      await replenishmentsAPI.confirm(r.id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div className="nav-tabs">
        <button className="nav-tab" onClick={() => navigate('/')}>首页</button>
        <button className="nav-tab" onClick={() => navigate('/orders')}>订单管理</button>
        <button className="nav-tab" onClick={() => navigate('/checkins')}>晨配签到</button>
        <button className="nav-tab" onClick={() => navigate('/exceptions')}>异常管理</button>
        <button className="nav-tab active">补送管理</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">补送列表</div>
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label className="form-label">状态</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部</option>
              {Object.entries(statusMap).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-default" onClick={loadData}>刷新</button>
        </div>

        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : replenishments.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>客户</th>
                <th>商品</th>
                <th>方式</th>
                <th>数量</th>
                <th>处理人</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {replenishments.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.customer_name}</td>
                  <td>{r.product_name}</td>
                  <td>{methodMap[r.method]}</td>
                  <td>{r.quantity}</td>
                  <td>{r.handler_name}</td>
                  <td>
                    <span className={`status-tag status-${r.status}`}>
                      {statusMap[r.status]}
                    </span>
                  </td>
                  <td>{dayjs(r.created_at).format('MM-DD HH:mm')}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-default btn-sm" onClick={() => navigate(`/orders/${r.daily_order_id}`)}>
                        订单详情
                      </button>
                      {r.status === 'pending' && user?.role === 'courier' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleDeliver(r)}>
                          标记配送
                        </button>
                      )}
                      {r.status === 'delivered' && (user?.role === 'clerk' || user?.role === 'customer_service') && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(r)}>
                          确认完成
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无补送记录</div>
        )}
      </div>
    </div>
  );
};

export default ReplenishmentsPage;
