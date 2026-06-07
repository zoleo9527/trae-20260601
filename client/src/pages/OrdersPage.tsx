import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ordersAPI } from '@/api';
import type { DailyOrder } from '@/types';

const statusMap: Record<string, string> = {
  pending: '待处理',
  signed: '已签收',
  exception: '异常',
  replenished: '已补送',
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    status: '',
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getList({
        date: filters.date || undefined,
        status: filters.status || undefined,
      });
      setOrders(res.data.orders);
    } catch (err) {
      console.error('加载订单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filters]);

  return (
    <div>
      <div className="nav-tabs">
        <button className="nav-tab" onClick={() => navigate('/')}>首页</button>
        <button className="nav-tab active">订单管理</button>
        <button className="nav-tab" onClick={() => navigate('/checkins')}>晨配签到</button>
        <button className="nav-tab" onClick={() => navigate('/exceptions')}>异常管理</button>
        <button className="nav-tab" onClick={() => navigate('/replenishments')}>补送管理</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">订单列表</div>
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label className="form-label">配送日期</label>
            <input
              type="date"
              className="form-input"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
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
          <button className="btn btn-default" onClick={loadOrders}>刷新</button>
        </div>

        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : orders.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户</th>
                <th>地址</th>
                <th>商品</th>
                <th>数量</th>
                <th>路线</th>
                <th>配送日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td style={{ maxWidth: 200 }}>{order.customer_address}</td>
                  <td>{order.product_name} {order.product_spec}</td>
                  <td>{order.quantity}</td>
                  <td>{order.route_name}</td>
                  <td>{order.delivery_date}</td>
                  <td>
                    <span className={`status-tag status-${order.status}`}>
                      {statusMap[order.status]}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => navigate(`/orders/${order.id}`)}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无订单数据</div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
