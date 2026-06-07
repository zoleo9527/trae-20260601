import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { checkinsAPI, timelineAPI } from '@/api';
import type { MorningCheckin, DailyOrder, Exception, TimelineEvent, ExceptionType } from '@/types';
import { useAuth } from '@/context/AuthContext';

const statusMap: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  confirmed: '已确认',
};

const orderStatusMap: Record<string, string> = {
  pending: '待处理',
  signed: '已签收',
  exception: '异常',
  replenished: '已补送',
};

const exceptionTypeMap: Record<string, string> = {
  missed: '漏送',
  damaged: '破损',
  wrong_product: '送错品',
  customer_absent: '客户不在',
  other: '其他',
};

const CheckinDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkin, setCheckin] = useState<MorningCheckin | null>(null);
  const [orders, setOrders] = useState<DailyOrder[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [submitForm, setSubmitForm] = useState({
    signed_orders: 0,
    exception_orders: 0,
    remark: '',
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRemark, setConfirmRemark] = useState('');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DailyOrder | null>(null);
  const [exceptionForm, setExceptionForm] = useState({
    type: 'missed' as ExceptionType,
    description: '',
  });

  const loadData = async () => {
    if (!id) return;
    try {
      const [detailRes, timelineRes] = await Promise.all([
        checkinsAPI.getDetail(Number(id)),
        timelineAPI.getCheckinTimeline(Number(id)),
      ]);
      setCheckin(detailRes.data.checkin);
      setOrders(detailRes.data.orders);
      setExceptions(detailRes.data.exceptions);
      setTimeline(timelineRes.data.timeline);
      setSubmitForm({
        signed_orders: detailRes.data.checkin.signed_orders,
        exception_orders: detailRes.data.checkin.exception_orders,
        remark: detailRes.data.checkin.remark || '',
      });
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSign = async (order: DailyOrder) => {
    if (!id) return;
    try {
      const res = await checkinsAPI.updateOrderStatus(Number(id), order.id, 'signed');
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'signed' } : o));
      if (checkin) {
        setCheckin({
          ...checkin,
          signed_orders: res.data.signedCount,
          exception_orders: res.data.exceptionCount,
        });
      }
      setSubmitForm(prev => ({
        ...prev,
        signed_orders: res.data.signedCount,
        exception_orders: res.data.exceptionCount,
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReportException = (order: DailyOrder) => {
    setSelectedOrder(order);
    setExceptionForm({ type: 'missed', description: '' });
    setShowExceptionModal(true);
  };

  const confirmException = async () => {
    if (!id || !selectedOrder) return;
    try {
      const res = await checkinsAPI.reportOrderException(Number(id), selectedOrder.id, exceptionForm);
      setOrders(orders.map(o => o.id === selectedOrder.id ? {
        ...o,
        status: 'exception',
        exception_id: res.data.id,
        exception_type: exceptionForm.type,
        exception_status: 'pending',
        exception_description: exceptionForm.description,
      } : o));
      if (checkin) {
        setCheckin({
          ...checkin,
          exception_orders: res.data.exceptionCount,
        });
      }
      setSubmitForm(prev => ({
        ...prev,
        exception_orders: res.data.exceptionCount,
      }));
      setShowExceptionModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '上报失败');
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await checkinsAPI.submit(Number(id), submitForm);
      setShowSubmitModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '提交失败');
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    try {
      await checkinsAPI.confirm(Number(id), { remark: confirmRemark });
      setShowConfirmModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || '确认失败');
    }
  };

  if (!checkin) {
    return <div className="empty-state">加载中...</div>;
  }

  const canOperateOrder = (user?.role === 'courier' || user?.role === 'clerk') && checkin.status !== 'confirmed';
  const canSubmit = (user?.role === 'courier' || user?.role === 'clerk') && checkin.status === 'draft';
  const canConfirm = user?.role === 'clerk' && checkin.status === 'submitted';

  return (
    <div>
      <div className="nav-tabs">
        <button className="nav-tab" onClick={() => navigate('/')}>首页</button>
        <button className="nav-tab" onClick={() => navigate('/orders')}>订单管理</button>
        <button className="nav-tab active" onClick={() => navigate('/checkins')}>晨配签到</button>
        <button className="nav-tab" onClick={() => navigate('/exceptions')}>异常管理</button>
        <button className="nav-tab" onClick={() => navigate('/replenishments')}>补送管理</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">晨配签到详情 #{checkin.id}</div>
          <div className="actions">
            {canSubmit && (
              <button className="btn btn-warning btn-sm" onClick={() => setShowSubmitModal(true)}>
                提交签到
              </button>
            )}
            {canConfirm && (
              <button className="btn btn-success btn-sm" onClick={() => setShowConfirmModal(true)}>
                确认签到
              </button>
            )}
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">日期:</span>
            <span className="detail-value">{checkin.checkin_date}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">路线:</span>
            <span className="detail-value">{checkin.route_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">配送员:</span>
            <span className="detail-value">{checkin.courier_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">确认文员:</span>
            <span className="detail-value">{checkin.clerk_name || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">总订单数:</span>
            <span className="detail-value">{checkin.total_orders}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">已签收:</span>
            <span className="detail-value text-success">{checkin.signed_orders}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">异常单:</span>
            <span className="detail-value text-danger">{checkin.exception_orders}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">状态:</span>
            <span className={`status-tag status-${checkin.status}`}>
              {statusMap[checkin.status]}
            </span>
          </div>
          {checkin.remark && (
            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
              <span className="detail-label">备注:</span>
              <span className="detail-value">{checkin.remark}</span>
            </div>
          )}
          {checkin.submitted_at && (
            <div className="detail-item">
              <span className="detail-label">提交时间:</span>
              <span className="detail-value">{dayjs(checkin.submitted_at).format('YYYY-MM-DD HH:mm')}</span>
            </div>
          )}
          {checkin.confirmed_at && (
            <div className="detail-item">
              <span className="detail-label">确认时间:</span>
              <span className="detail-value">{dayjs(checkin.confirmed_at).format('YYYY-MM-DD HH:mm')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">逐单签收 ({orders.length})</div>
          {canOperateOrder && (
            <div className="text-sm text-muted">点击「签收」或「异常上报」处理每一笔订单</div>
          )}
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>地址</th>
              <th>商品</th>
              <th>数量</th>
              <th>状态</th>
              <th>异常</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.customer_name}</td>
                <td style={{ maxWidth: 180 }}>{o.customer_address}</td>
                <td>{o.product_name} {o.product_spec}</td>
                <td>{o.quantity}</td>
                <td>
                  <span className={`status-tag status-${o.status}`}>
                    {orderStatusMap[o.status]}
                  </span>
                </td>
                <td>
                  {o.exception_type ? (
                    <span className="status-tag status-exception">
                      {exceptionTypeMap[o.exception_type]}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-default btn-sm" onClick={() => navigate(`/orders/${o.id}`)}>
                      详情
                    </button>
                    {canOperateOrder && o.status === 'pending' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleSign(o)}>
                          签收
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReportException(o)}>
                          异常上报
                        </button>
                      </>
                    )}
                    {canOperateOrder && o.status === 'signed' && !o.exception_id && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleReportException(o)}>
                        标记异常
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {exceptions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">关联异常 ({exceptions.length})</div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>类型</th>
                <th>描述</th>
                <th>上报人</th>
                <th>时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map((e) => (
                <tr key={e.id}>
                  <td>#{e.id}</td>
                  <td>{exceptionTypeMap[e.type]}</td>
                  <td>{e.description || '-'}</td>
                  <td>{e.reporter_name}</td>
                  <td>{dayjs(e.created_at).format('MM-DD HH:mm')}</td>
                  <td>
                    <span className={`status-tag status-${e.status}`}>
                      {e.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => navigate(`/orders/${e.daily_order_id}`)}>
                      查看订单
                    </button>
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

      {showExceptionModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">上报异常 - 订单 #{selectedOrder.id}</div>
              <button className="modal-close" onClick={() => setShowExceptionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="mb-16 text-muted">客户: {selectedOrder.customer_name} | 商品: {selectedOrder.product_name}</p>
              <div className="form-group">
                <label className="form-label">异常类型 *</label>
                <select
                  className="form-input"
                  value={exceptionForm.type}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value as ExceptionType })}
                >
                  {Object.entries(exceptionTypeMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">详细描述</label>
                <textarea
                  className="form-textarea"
                  value={exceptionForm.description}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, description: e.target.value })}
                  placeholder="请详细描述异常情况"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowExceptionModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={confirmException}>确认上报</button>
            </div>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">提交签到</div>
              <button className="modal-close" onClick={() => setShowSubmitModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="mb-16">当前路线共 {checkin.total_orders} 单：</p>
              <div className="form-group">
                <label className="form-label">已签收数量</label>
                <input
                  type="number"
                  min="0"
                  max={checkin.total_orders}
                  className="form-input"
                  value={submitForm.signed_orders}
                  onChange={(e) => setSubmitForm({ ...submitForm, signed_orders: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">异常数量</label>
                <input
                  type="number"
                  min="0"
                  max={checkin.total_orders}
                  className="form-input"
                  value={submitForm.exception_orders}
                  onChange={(e) => setSubmitForm({ ...submitForm, exception_orders: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-textarea"
                  value={submitForm.remark}
                  onChange={(e) => setSubmitForm({ ...submitForm, remark: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowSubmitModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>提交</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">确认签到</div>
              <button className="modal-close" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="mb-16">确认该签到数据无误？</p>
              <div className="form-group">
                <label className="form-label">确认备注</label>
                <textarea
                  className="form-textarea"
                  value={confirmRemark}
                  onChange={(e) => setConfirmRemark(e.target.value)}
                  placeholder="可选"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowConfirmModal(false)}>取消</button>
              <button className="btn btn-success" onClick={handleConfirm}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckinDetail;
