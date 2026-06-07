import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ordersAPI, checkinsAPI, exceptionsAPI, replenishmentsAPI } from '@/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayOrders: 0,
    signedOrders: 0,
    exceptionOrders: 0,
    pendingExceptions: 0,
    pendingReplenishments: 0,
  });
  const [todaySummary, setTodaySummary] = useState<any[]>([]);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [summaryRes, checkinsRes, exceptionsRes, replenishmentsRes] = await Promise.all([
        ordersAPI.getDailySummary(),
        checkinsAPI.getList({ date: dayjs().format('YYYY-MM-DD') }),
        exceptionsAPI.getList({ status: 'pending' }),
        replenishmentsAPI.getList({ status: 'pending' }),
      ]);

      const total = summaryRes.data.summary.reduce((sum, s) => sum + s.total, 0);
      const signed = summaryRes.data.summary.reduce((sum, s) => sum + s.signed, 0);
      const exception = summaryRes.data.summary.reduce((sum, s) => sum + s.exception, 0);

      setStats({
        todayOrders: total,
        signedOrders: signed,
        exceptionOrders: exception,
        pendingExceptions: exceptionsRes.data.exceptions.length,
        pendingReplenishments: replenishmentsRes.data.replenishments.length,
      });
      setTodaySummary(summaryRes.data.summary);
      setRecentCheckins(checkinsRes.data.checkins.slice(0, 5));
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const navItems = [
    { key: '/orders', label: '订单管理' },
    { key: '/checkins', label: '晨配签到' },
    { key: '/exceptions', label: '异常管理' },
    { key: '/replenishments', label: '补送管理' },
  ];

  return (
    <div>
      <div className="nav-tabs">
        {navItems.map((item) => (
          <button
            key={item.key}
            className="nav-tab"
            onClick={() => navigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.todayOrders}</div>
          <div className="stat-label">今日订单总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-success">{stats.signedOrders}</div>
          <div className="stat-label">已签收</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-danger">{stats.exceptionOrders}</div>
          <div className="stat-label">异常订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-warning">{stats.pendingExceptions}</div>
          <div className="stat-label">待处理异常</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-warning">{stats.pendingReplenishments}</div>
          <div className="stat-label">待配送补送</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">今日路线概览</div>
        </div>
        {todaySummary.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>路线</th>
                <th>总单数</th>
                <th>已签收</th>
                <th>异常</th>
                <th>待处理</th>
                <th>已补送</th>
              </tr>
            </thead>
            <tbody>
              {todaySummary.map((item) => (
                <tr key={item.route_id}>
                  <td>{item.route_name || '未分配'}</td>
                  <td>{item.total}</td>
                  <td><span className="status-tag status-signed">{item.signed}</span></td>
                  <td><span className="status-tag status-exception">{item.exception}</span></td>
                  <td><span className="status-tag status-pending">{item.pending}</span></td>
                  <td><span className="status-tag status-replenished">{item.replenished}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无今日订单数据</div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">今日晨配签到</div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/checkins')}>
            查看全部
          </button>
        </div>
        {recentCheckins.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>路线</th>
                <th>配送员</th>
                <th>总单数</th>
                <th>已签</th>
                <th>异常</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recentCheckins.map((item) => (
                <tr key={item.id}>
                  <td>{item.route_name}</td>
                  <td>{item.courier_name}</td>
                  <td>{item.total_orders}</td>
                  <td>{item.signed_orders}</td>
                  <td>{item.exception_orders}</td>
                  <td>
                    <span className={`status-tag status-${item.status}`}>
                      {item.status === 'draft' ? '草稿' : item.status === 'submitted' ? '已提交' : '已确认'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => navigate(`/checkins/${item.id}`)}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无今日签到记录</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
