import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { exceptionsAPI, replenishmentsAPI } from '@/api';
import type { Exception, ReplenishmentMethod } from '@/types';
import { useAuth } from '@/context/AuthContext';

const statusMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

const typeMap: Record<string, string> = {
  missed: '漏送',
  damaged: '破损',
  wrong_product: '错送',
  customer_absent: '客户不在',
  other: '其他',
};

const methodMap: Record<string, string> = {
  redelivery: '重新配送',
  refund: '退款',
  replace: '换货',
};

const ExceptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
  });
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [replenishForm, setReplenishForm] = useState({
    method: 'redelivery' as ReplenishmentMethod,
    quantity: 1,
    remark: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await exceptionsAPI.getList({
        status: filters.status || undefined,
        type: filters.type || undefined,
      });
      setExceptions(res.data.exceptions);
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleCreateReplenishment = (ex: Exception) => {
    setSelectedException(ex);
    setReplenishForm({
      method: 'redelivery',
      quantity: 1,
      remark: '',
    });
    setShowReplenishModal(true);
  };

  const confirmCreateReplenishment = async () => {
    if (!selectedException) return;
    try {
      await replenishmentsAPI.create({
        exception_id: selectedException.id,
        daily_order_id: selectedException.daily_order_id,
        quantity: replenishForm.quantity,
        method: replenishForm.method,
        remark: replenishForm.remark,
      });
      setShowReplenishModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const canCreateReplenishment = user?.role === 'clerk' || user?.role === 'courier' || user?.role === 'customer_service';

  return (
    <div>
      <div className="nav-tabs">
        <button className="nav-tab" onClick={() => navigate('/')}>首页</button>
        <button className="nav-tab" onClick={() => navigate('/orders')}>订单管理</button>
        <button className="nav-tab" onClick={() => navigate('/checkins')}>晨配签到</button>
        <button className="nav-tab active">异常管理</button>
        <button className="nav-tab" onClick={() => navigate('/replenishments')}>补送管理</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">异常列表</div>
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
          <div className="form-group">
            <label className="form-label">类型</label>
            <select
              className="form-select"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">全部</option>
              {Object.entries(typeMap).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-default" onClick={loadData}>刷新</button>
        </div>

        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : exceptions.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>类型</th>
                <th>客户</th>
                <th>商品</th>
                <th>配送日期</th>
                <th>路线</th>
                <th>上报人</th>
                <th>上报时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((ex) => (
                <tr key={ex.id}>
                  <td>#{ex.id}</td>
                  <td>{typeMap[ex.type] || ex.type}</td>
                  <td>{ex.customer_name}</td>
                  <td>{ex.product_name}</td>
                  <td>{ex.delivery_date}</td>
                  <td>{ex.route_name}</td>
                  <td>{ex.reporter_name}</td>
                  <td>{dayjs(ex.created_at).format('MM-DD HH:mm')}</td>
                  <td>
                    <span className={`status-tag status-${ex.status}`}>
                      {statusMap[ex.status]}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-default btn-sm" onClick={() => navigate(`/orders/${ex.daily_order_id}`)}>
                        订单详情
                      </button>
                      {ex.status === 'pending' && canCreateReplenishment && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCreateReplenishment(ex)}
                        >
                          安排补送
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无异常记录</div>
        )}
      </div>

      {showReplenishModal && selectedException && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">安排补送 - 异常 #{selectedException.id}</div>
              <button className="modal-close" onClick={() => setShowReplenishModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="mb-16 text-muted">
              客户: {selectedException.customer_name} | 异常类型: {typeMap[selectedException.type]}</p>
              <div className="form-group">
                <label className="form-label">补送方式 *</label>
                <select
                  className="form-select"
                  value={replenishForm.method}
                  onChange={(e) => setReplenishForm({ ...replenishForm, method: e.target.value as ReplenishmentMethod })}
                >
                  {Object.entries(methodMap).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">补送数量 *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={replenishForm.quantity}
                  onChange={(e) => setReplenishForm({ ...replenishForm, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-textarea"
                  value={replenishForm.remark}
                  onChange={(e) => setReplenishForm({ ...replenishForm, remark: e.target.value })}
                  placeholder="补送说明或客户特殊要求"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowReplenishModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={confirmCreateReplenishment}>确认安排</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionsPage;
