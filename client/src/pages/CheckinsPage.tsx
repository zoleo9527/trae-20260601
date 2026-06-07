import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { checkinsAPI, usersAPI } from '@/api';
import type { MorningCheckin, User } from '@/types';
import { useAuth } from '@/context/AuthContext';

const statusMap: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  confirmed: '已确认',
};

const CheckinsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<MorningCheckin[]>([]);
  const [couriers, setCouriers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    status: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    checkin_date: dayjs().format('YYYY-MM-DD'),
    route_id: 1,
    courier_id: 0,
    remark: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [checkinsRes, couriersRes] = await Promise.all([
        checkinsAPI.getList({
          date: filters.date || undefined,
          status: filters.status || undefined,
        }),
        usersAPI.getCouriers(),
      ]);
      setCheckins(checkinsRes.data.checkins);
      setCouriers(couriersRes.data.couriers);
      if (couriersRes.data.couriers.length > 0) {
        setCreateForm((prev) => ({ ...prev, courier_id: couriersRes.data.couriers[0].id }));
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleCreate = async () => {
    try {
      await checkinsAPI.create(createForm);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      if (err.response?.data?.checkinId) {
        navigate(`/checkins/${err.response.data.checkinId}`);
        return;
      }
      alert(err.response?.data?.error || '创建失败');
    }
  };

  const canCreate = user?.role === 'clerk' || user?.role === 'courier';

  return (
    <div>
      <div className="nav-tabs">
        <button className="nav-tab" onClick={() => navigate('/')}>首页</button>
        <button className="nav-tab" onClick={() => navigate('/orders')}>订单管理</button>
        <button className="nav-tab active">晨配签到</button>
        <button className="nav-tab" onClick={() => navigate('/exceptions')}>异常管理</button>
        <button className="nav-tab" onClick={() => navigate('/replenishments')}>补送管理</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">晨配签到列表</div>
          {canCreate && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
              + 创建签到
            </button>
          )}
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label className="form-label">日期</label>
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
          <button className="btn btn-default" onClick={loadData}>刷新</button>
        </div>

        {loading ? (
          <div className="empty-state">加载中...</div>
        ) : checkins.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>日期</th>
                <th>路线</th>
                <th>配送员</th>
                <th>文员</th>
                <th>总单</th>
                <th>已签</th>
                <th>异常</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{c.checkin_date}</td>
                  <td>{c.route_name}</td>
                  <td>{c.courier_name}</td>
                  <td>{c.clerk_name || '-'}</td>
                  <td>{c.total_orders}</td>
                  <td>{c.signed_orders}</td>
                  <td>{c.exception_orders}</td>
                  <td>
                    <span className={`status-tag status-${c.status}`}>
                      {statusMap[c.status]}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => navigate(`/checkins/${c.id}`)}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无签到记录</div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">创建晨配签到</div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">签到日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={createForm.checkin_date}
                  onChange={(e) => setCreateForm({ ...createForm, checkin_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">路线</label>
                <select
                  className="form-select"
                  value={createForm.route_id}
                  onChange={(e) => setCreateForm({ ...createForm, route_id: Number(e.target.value) })}
                >
                  <option value={1}>A线 - 城区东段</option>
                  <option value={2}>B线 - 城区西段</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">配送员</label>
                <select
                  className="form-select"
                  value={createForm.courier_id}
                  onChange={(e) => setCreateForm({ ...createForm, courier_id: Number(e.target.value) })}
                >
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-textarea"
                  value={createForm.remark}
                  onChange={(e) => setCreateForm({ ...createForm, remark: e.target.value })}
                  placeholder="可选"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckinsPage;
