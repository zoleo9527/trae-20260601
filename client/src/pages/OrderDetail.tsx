import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { timelineAPI, exceptionsAPI, replenishmentsAPI } from '@/api';
import type { DailyOrder, TimelineEvent, Exception, Replenishment } from '@/types';
import { useAuth } from '@/context/AuthContext';

const statusMap: Record<string, string> = {
  pending: '待处理',
  signed: '已签收',
  exception: '异常',
  replenished: '已补送',
};

const exceptionTypeMap: Record<string, string> = {
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

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<DailyOrder | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [replenishments, setReplenishments] = useState<Replenishment[]>([]);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({ type: 'missed', description: '' });

  const loadData = async () => {
    if (!id) return;
    try {
      const [timelineRes, exceptionsRes, replenishmentsRes] = await Promise.all([
        timelineAPI.getOrderTimeline(Number(id)),
        exceptionsAPI.getList({ dailyOrderId: Number(id) }),
        replenishmentsAPI.getList({ dailyOrderId: Number(id) }),
      ]);
      setOrder(timelineRes.data.order);
      setTimeline(timelineRes.data.timeline);
      setExceptions(exceptionsRes.data.exceptions);
      setReplenishments(replenishmentsRes.data.replenishments);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReportException = async () => {
    if (!id) return;
    try {
      await exceptionsAPI.create({
        daily_order_id: Number(id),
        type: exceptionForm.type,
        description: exceptionForm.description,
      });
      setShowExceptionModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '上报失败');
    }
  };

  const handleCreateReplenishment = async (exception: Exception) => {
    try {
      await replenishmentsAPI.create({
        exception_id: exception.id,
        daily_order_id: exception.daily_order_id,
        quantity: 1,
        method: 'redelivery',
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '创建补送失败');
    }
  };

  const handleDeliverReplenishment = async (replenishment: Replenishment) => {
    try {
      await replenishmentsAPI.deliver(replenishment.id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleConfirmReplenishment = async (replenishment: Replenishment) => {
    try {
      await replenishmentsAPI.confirm(replenishment.id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  if (!order) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <div className="nav-tabs">
        <button className="nav-tab" onClick={() => navigate('/')}>首页</button>
        <button className="nav-tab active" onClick={() => navigate('/orders')}>订单管理</button>
        <button className="nav-tab" onClick={() => navigate('/checkins')}>晨配签到</button>
        <button className="nav-tab" onClick={() => navigate('/exceptions')}>异常管理</button>
        <button className="nav-tab" onClick={() => navigate('/replenishments')}>补送管理</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">订单详情 #{order.id}</div>
          <div className="actions">
            {order.status !== 'exception' && (
              <button className="btn btn-warning btn-sm" onClick={() => setShowExceptionModal(true)}>
                上报异常
              </button>
            )}
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">客户:</span>
            <span className="detail-value">{order.customer_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">电话:</span>
            <span className="detail-value">{order.customer_phone}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">地址:</span>
            <span className="detail-value">{order.customer_address}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">商品:</span>
            <span className="detail-value">{order.product_name} {order.product_spec}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">数量:</span>
            <span className="detail-value">{order.quantity}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">路线:</span>
            <span className="detail-value">{order.route_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">配送日期:</span>
            <span className="detail-value">{order.delivery_date}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">状态:</span>
            <span className={`status-tag status-${order.status}`}>
              {statusMap[order.status]}
            </span>
          </div>
        </div>
      </div>

      {exceptions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">异常记录</div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>类型</th>
                <th>描述</th>
                <th>上报人</th>
                <th>上报时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((ex) => (
                <tr key={ex.id}>
                  <td>{exceptionTypeMap[ex.type]}</td>
                  <td>{ex.description || '-'}</td>
                  <td>{ex.reporter_name}</td>
                  <td>{dayjs(ex.created_at).format('MM-DD HH:mm')}</td>
                  <td>
                    <span className={`status-tag status-${ex.status}`}>
                      {ex.status === 'pending' ? '待处理' : ex.status === 'processing' ? '处理中' : ex.status === 'resolved' ? '已解决' : '已关闭'}
                    </span>
                  </td>
                  <td>
                    {ex.status === 'pending' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleCreateReplenishment(ex)}
                      >
                        安排补送
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {replenishments.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">补送记录</div>
          </div>
          <table className="table">
            <thead>
              <tr>
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
                  <td>{methodMap[r.method]}</td>
                  <td>{r.quantity}</td>
                  <td>{r.handler_name}</td>
                  <td>
                    <span className={`status-tag status-${r.status}`}>
                      {r.status === 'pending' ? '待配送' : r.status === 'delivered' ? '已配送' : r.status === 'confirmed' ? '已确认' : '已取消'}
                    </span>
                  </td>
                  <td>{dayjs(r.created_at).format('MM-DD HH:mm')}</td>
                  <td>
                    {r.status === 'pending' && user?.role === 'courier' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleDeliverReplenishment(r)}>
                        标记配送
                      </button>
                    )}
                    {r.status === 'delivered' && (user?.role === 'clerk' || user?.role === 'customer_service') && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleConfirmReplenishment(r)}>
                        确认完成
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">处理时间线</div>
        </div>
        <div className="timeline">
          {timeline.map((event, idx) => (
            <div className="timeline-item" key={idx}>
              <div className="timeline-time">{dayjs(event.time).format('YYYY-MM-DD HH:mm:ss')}</div>
              <div className="timeline-title">{event.title}</div>
              {event.description && <div className="timeline-desc">{event.description}</div>}
              {event.user && <div className="timeline-user">操作人: {event.user}</div>}
            </div>
          ))}
        </div>
      </div>

      {showExceptionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">上报异常</div>
              <button className="modal-close" onClick={() => setShowExceptionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">异常类型</label>
                <select
                  className="form-select"
                  value={exceptionForm.type}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value })}
                >
                  {Object.entries(exceptionTypeMap).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">详细描述</label>
                <textarea
                  className="form-textarea"
                  value={exceptionForm.description}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, description: e.target.value })}
                  placeholder="请输入详细描述"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowExceptionModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReportException}>提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
