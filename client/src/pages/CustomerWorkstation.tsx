import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { customerApi, exportApi } from '../api';
import './CustomerWorkstation.css';

type TabKey = 'fees' | 'inspections' | 'pickup' | 'records' | 'export';

interface FeeItem {
  id: number;
  container_id: number;
  container_no: string;
  free_days: number;
  actual_days: number;
  daily_rate: number;
  total_fee: number;
  status: string;
  dispute_reason: string;
  dispute_handler: string;
  dispute_result: string;
}

interface InspectionPlan {
  id: number;
  container_id: number;
  container_no: string;
  plan_type: string;
  planned_date: string;
  status: string;
  notified_at: string;
  notified_to: string;
  missed_reason: string;
}

interface ExportTask {
  id: number;
  task_type: string;
  parameters: string;
  status: string;
  file_path: string;
  created_by: string;
  created_at: string;
  completed_at: string;
}

interface PickupContainer {
  id: number;
  container_no: string;
  type: string;
  owner: string;
  cargo_type: string;
  weight_kg: number;
  status: string;
  entry_time: string;
  slot_code: string;
  entry_truck_no: string;
  entry_driver_name: string;
  entry_driver_phone: string;
}

interface PickupRecord {
  id: number;
  container_no: string;
  type: string;
  owner: string;
  cargo_type: string;
  status: string;
  slot_id: number | null;
  slot_code: string;
  actual_departure: string | null;
  pickup_time: string;
  pickup_detail: string;
  requested_by: string;
}

export default function CustomerWorkstation() {
  const [activeTab, setActiveTab] = useState<TabKey>('fees');
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [inspections, setInspections] = useState<InspectionPlan[]>([]);
  const [missedNotifications, setMissedNotifications] = useState<InspectionPlan[]>([]);
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [disputeModal, setDisputeModal] = useState<FeeItem | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeHandler, setDisputeHandler] = useState('');
  const [resolveModal, setResolveModal] = useState<FeeItem | null>(null);
  const [resolveResult, setResolveResult] = useState('');
  const [exportType, setExportType] = useState('container_list');
  const [loading, setLoading] = useState(false);

  const [pickupContainers, setPickupContainers] = useState<PickupContainer[]>([]);
  const [pickupModal, setPickupModal] = useState<PickupContainer | null>(null);
  const [pickupForm, setPickupForm] = useState({ pickup_time: '', truck_no: '', driver_name: '', driver_phone: '', requested_by: '' });

  const [pickupRecords, setPickupRecords] = useState<PickupRecord[]>([]);
  const [recordsFilter, setRecordsFilter] = useState('');
  const [cancelModal, setCancelModal] = useState<PickupRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadFees = useCallback(async () => {
    try {
      const res: any = await customerApi.getOverdueFees();
      const data = res?.data || res;
      setFees(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadInspections = useCallback(async () => {
    try {
      const res: any = await customerApi.getInspectionPlans();
      const data = res?.data || res;
      setInspections(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadMissed = useCallback(async () => {
    try {
      const res: any = await customerApi.getMissedNotifications();
      const data = res?.data || res;
      setMissedNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadExportTasks = useCallback(async () => {
    try {
      const res: any = await exportApi.listExportTasks();
      const data = res?.data || res;
      setExportTasks(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadPickupContainers = useCallback(async () => {
    try {
      const res: any = await customerApi.listPickupContainers();
      const data = res?.data || res;
      setPickupContainers(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadPickupRecords = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {};
      if (recordsFilter) params.status = recordsFilter;
      const res: any = await customerApi.listPickupRecords(params);
      const data = res?.data || res;
      setPickupRecords(Array.isArray(data) ? data : []);
    } catch {}
  }, [recordsFilter]);

  useEffect(() => {
    loadFees();
    loadInspections();
    loadMissed();
    loadExportTasks();
    loadPickupContainers();
    loadPickupRecords();
  }, [loadFees, loadInspections, loadMissed, loadExportTasks, loadPickupContainers, loadPickupRecords]);

  const totalFees = fees.reduce((sum, f) => sum + (f.total_fee || 0), 0);
  const disputedAmount = fees.filter((f) => f.status === 'DISPUTED').reduce((sum, f) => sum + (f.total_fee || 0), 0);
  const paidAmount = fees.filter((f) => f.status === 'PAID').reduce((sum, f) => sum + (f.total_fee || 0), 0);

  const handleCreateDispute = async () => {
    if (!disputeModal) return;
    setLoading(true);
    setMessage(null);
    try {
      await customerApi.createFeeDispute({
        feeId: disputeModal.id,
        reason: disputeReason,
        handler: disputeHandler,
      });
      setMessage({ type: 'success', text: '异议已提交' });
      setDisputeModal(null);
      setDisputeReason('');
      setDisputeHandler('');
      loadFees();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '提交失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!resolveModal) return;
    setLoading(true);
    setMessage(null);
    try {
      await customerApi.resolveFeeDispute(resolveModal.id, {
        result: resolveResult,
      });
      setMessage({ type: 'success', text: '异议已解决' });
      setResolveModal(null);
      setResolveResult('');
      loadFees();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '解决失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyInspection = async (id: number) => {
    try {
      await customerApi.notifyInspection(id, { notifiedTo: '报关行' });
      setMessage({ type: 'success', text: '已发送通知' });
      loadInspections();
      loadMissed();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '通知失败' });
    }
  };

  const handleCreateExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await exportApi.createExportTask({
        taskType: exportType,
        parameters: {},
        createdBy: '客服人员',
      });
      setMessage({ type: 'success', text: '导出任务已创建' });
      loadExportTasks();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '创建失败' });
    } finally {
      setLoading(false);
    }
  };

  const handlePickupRequest = async () => {
    if (!pickupModal) return;
    setLoading(true);
    setMessage(null);
    try {
      await customerApi.pickupRequest({
        container_id: pickupModal.id,
        pickup_time: pickupForm.pickup_time || dayjs().format('YYYY-MM-DD HH:mm'),
        truck_no: pickupForm.truck_no,
        driver_name: pickupForm.driver_name,
        driver_phone: pickupForm.driver_phone,
        requested_by: pickupForm.requested_by || '客服人员',
      });
      setMessage({ type: 'success', text: `提箱申请已提交，箱号 ${pickupModal.container_no} 状态已推进为待离港` });
      setPickupModal(null);
      setPickupForm({ pickup_time: '', truck_no: '', driver_name: '', driver_phone: '', requested_by: '' });
      loadPickupContainers();
      loadPickupRecords();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '提交失败' });
    } finally {
      setLoading(false);
    }
  };

  const handlePickupCancel = async () => {
    if (!cancelModal) return;
    setLoading(true);
    setMessage(null);
    try {
      await customerApi.pickupCancel({
        container_id: cancelModal.id,
        cancel_reason: cancelReason,
        cancelled_by: '客服人员',
      });
      setMessage({ type: 'success', text: `提箱申请已取消，箱号 ${cancelModal.container_no} 状态已回退为在场，堆位 ${cancelModal.slot_code || '无'} 已保留` });
      setCancelModal(null);
      setCancelReason('');
      loadPickupRecords();
      loadPickupContainers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '取消失败' });
    } finally {
      setLoading(false);
    }
  };

  const getFeeStatusBadge = (status: string) => {
    if (status === 'PAID') return 'customer__badge--paid';
    if (status === 'DISPUTED') return 'customer__badge--disputed';
    if (status === 'INVOICED') return 'customer__badge--overdue';
    return 'customer__badge--unpaid';
  };

  const getFeeStatusLabel = (status: string) => {
    if (status === 'PAID') return '已付';
    if (status === 'DISPUTED') return '有异议';
    if (status === 'INVOICED') return '已开票';
    return '待处理';
  };

  const getInspectionStatusBadge = (status: string) => {
    if (status === 'SCHEDULED') return 'customer__badge--scheduled';
    if (status === 'NOTIFIED') return 'customer__badge--notified';
    if (status === 'MISSED') return 'customer__badge--missed';
    if (status === 'COMPLETED') return 'customer__badge--completed';
    return 'customer__badge--scheduled';
  };

  const getInspectionStatusLabel = (status: string) => {
    if (status === 'SCHEDULED') return '待通知';
    if (status === 'NOTIFIED') return '已通知';
    if (status === 'MISSED') return '漏通知';
    if (status === 'COMPLETED') return '已完成';
    return status;
  };

  const getPlanTypeLabel = (type: string) => {
    if (type === 'CUSTOMS') return '海关';
    if (type === 'QUARANTINE') return '检疫';
    if (type === 'COMMODITY') return '商检';
    return type;
  };

  return (
    <div className="customer">
      {message && (
        <div className={message.type === 'success' ? 'customer__success-msg' : 'customer__error-msg'}>
          {message.text}
        </div>
      )}

      <div className="customer__tabs">
        <button className={`customer__tab ${activeTab === 'fees' ? 'customer__tab--active' : ''}`}
          onClick={() => setActiveTab('fees')}>逾期费用</button>
        <button className={`customer__tab ${activeTab === 'inspections' ? 'customer__tab--active' : ''}`}
          onClick={() => setActiveTab('inspections')}>检验计划</button>
        <button className={`customer__tab ${activeTab === 'pickup' ? 'customer__tab--active' : ''}`}
          onClick={() => setActiveTab('pickup')}>提箱申请</button>
        <button className={`customer__tab ${activeTab === 'records' ? 'customer__tab--active' : ''}`}
          onClick={() => setActiveTab('records')}>提箱申请记录</button>
        <button className={`customer__tab ${activeTab === 'export' ? 'customer__tab--active' : ''}`}
          onClick={() => setActiveTab('export')}>数据导出</button>
      </div>

      {activeTab === 'fees' && (
        <>
          <div className="customer__stats-row">
            <div className="customer__stat-card">
              <div className="customer__stat-label">费用总额</div>
              <div className="customer__stat-value customer__stat-value--blue">¥{totalFees.toLocaleString()}</div>
            </div>
            <div className="customer__stat-card">
              <div className="customer__stat-label">异议金额</div>
              <div className="customer__stat-value customer__stat-value--orange">¥{disputedAmount.toLocaleString()}</div>
            </div>
            <div className="customer__stat-card">
              <div className="customer__stat-label">已付金额</div>
              <div className="customer__stat-value customer__stat-value--green">¥{paidAmount.toLocaleString()}</div>
            </div>
          </div>
          <div className="customer__section">
            <div className="customer__section-title">逾期费用列表</div>
            <table className="customer__table">
              <thead>
                <tr><th>箱号</th><th>免费天数</th><th>实际天数</th><th>日费率</th><th>总费用</th><th>状态</th><th>操作</th></tr>
              </thead>
              <tbody>
                {fees.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#5a7a9a' }}>暂无逾期费用</td></tr>
                ) : (
                  fees.map((fee) => (
                    <tr key={fee.id}>
                      <td style={{ fontWeight: 600 }}>{fee.container_no}</td>
                      <td>{fee.free_days}</td>
                      <td>{fee.actual_days}</td>
                      <td>¥{fee.daily_rate}</td>
                      <td style={{ fontWeight: 600 }}>¥{fee.total_fee?.toLocaleString()}</td>
                      <td><span className={`customer__badge ${getFeeStatusBadge(fee.status)}`}>{getFeeStatusLabel(fee.status)}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {fee.status !== 'DISPUTED' && fee.status !== 'PAID' && (
                            <button className="customer__btn customer__btn--warning customer__btn--small"
                              onClick={() => { setDisputeModal(fee); setDisputeReason(''); setDisputeHandler(''); }}>
                              异议
                            </button>
                          )}
                          {fee.status === 'DISPUTED' && (
                            <button className="customer__btn customer__btn--success customer__btn--small"
                              onClick={() => { setResolveModal(fee); setResolveResult(''); }}>
                              解决
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'inspections' && (
        <>
          {missedNotifications.length > 0 && (
            <div className="customer__missed-highlight">
              <div className="customer__missed-title">⚠ 漏通知预警 - {missedNotifications.length} 项检验计划未及时通知</div>
              {missedNotifications.map((item) => (
                <div key={item.id} style={{ fontSize: 12, color: '#ef9a9a', marginBottom: 4 }}>
                  {item.container_no} - {getPlanTypeLabel(item.plan_type)} - 原因: {item.missed_reason || '未知'}
                </div>
              ))}
            </div>
          )}
          <div className="customer__section">
            <div className="customer__section-title">检验计划</div>
            <table className="customer__table">
              <thead>
                <tr><th>箱号</th><th>检验类型</th><th>计划日期</th><th>状态</th><th>操作</th></tr>
              </thead>
              <tbody>
                {inspections.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#5a7a9a' }}>暂无检验计划</td></tr>
                ) : (
                  inspections.map((plan) => (
                    <tr key={plan.id}>
                      <td style={{ fontWeight: 600 }}>{plan.container_no}</td>
                      <td>{getPlanTypeLabel(plan.plan_type)}</td>
                      <td>{dayjs(plan.planned_date).format('YYYY-MM-DD')}</td>
                      <td><span className={`customer__badge ${getInspectionStatusBadge(plan.status)}`}>{getInspectionStatusLabel(plan.status)}</span></td>
                      <td>
                        {plan.status === 'SCHEDULED' && (
                          <button className="customer__btn customer__btn--primary customer__btn--small"
                            onClick={() => handleNotifyInspection(plan.id)}>通知</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'pickup' && (
        <div className="customer__section">
          <div className="customer__section-title">可提取集装箱列表</div>
          <div style={{ fontSize: 12, color: '#8ba4bc', marginBottom: 12 }}>
            仅显示 IN_YARD / ALLOCATED 状态的集装箱，提交后集装箱状态将推进为 DEPARTING（待离港）
          </div>
          <table className="customer__table">
            <thead>
              <tr><th>箱号</th><th>箱型</th><th>持有人</th><th>货类</th><th>堆位</th><th>进场时间</th><th>状态</th><th>操作</th></tr>
            </thead>
            <tbody>
              {pickupContainers.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#5a7a9a' }}>暂无可提取集装箱</td></tr>
              ) : (
                pickupContainers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.container_no}</td>
                    <td>{c.type}</td>
                    <td>{c.owner}</td>
                    <td>{c.cargo_type === 'GENERAL' ? '普通' : c.cargo_type === 'DANGEROUS' ? '危险品' : c.cargo_type}</td>
                    <td>{c.slot_code || '-'}</td>
                    <td>{dayjs(c.entry_time).format('MM-DD HH:mm')}</td>
                    <td><span className="customer__badge customer__badge--notified">{c.status === 'ALLOCATED' ? '已分配' : '在场'}</span></td>
                    <td>
                      <button className="customer__btn customer__btn--warning customer__btn--small"
                        onClick={() => {
                          setPickupModal(c);
                          setPickupForm({
                            pickup_time: dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm'),
                            truck_no: c.entry_truck_no || '',
                            driver_name: c.entry_driver_name || '',
                            driver_phone: c.entry_driver_phone || '',
                            requested_by: '',
                          });
                        }}>
                        提箱
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="customer__section">
          <div className="customer__section-title">提箱申请记录</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8ba4bc' }}>按状态筛选：</span>
            <select className="customer__form-select" style={{ width: 150, marginBottom: 0 }}
              value={recordsFilter} onChange={(e) => setRecordsFilter(e.target.value)}>
              <option value="">全部</option>
              <option value="DEPARTING">待离港 (DEPARTING)</option>
              <option value="DEPARTED">已离港 (DEPARTED)</option>
            </select>
          </div>
          <table className="customer__table">
            <thead>
              <tr><th>箱号</th><th>箱型</th><th>申请时间</th><th>车牌/司机</th><th>堆位编号</th><th>当前状态</th><th>实际离港时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              {pickupRecords.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#5a7a9a' }}>暂无提箱申请记录</td></tr>
              ) : (
                pickupRecords.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.container_no}</td>
                    <td>{r.type}</td>
                    <td>{r.pickup_time ? dayjs(r.pickup_time).format('MM-DD HH:mm') : '-'}</td>
                    <td style={{ fontSize: 12, color: '#8ba4bc' }}>{r.pickup_detail || '-'}</td>
                    <td>{r.slot_code || '-'}</td>
                    <td>
                      <span className={`customer__badge ${r.status === 'DEPARTING' ? 'customer__badge--scheduled' : 'customer__badge--completed'}`}>
                        {r.status === 'DEPARTING' ? '待离港' : '已离港'}
                      </span>
                    </td>
                    <td>{r.actual_departure ? dayjs(r.actual_departure).format('MM-DD HH:mm') : '-'}</td>
                    <td>
                      {r.status === 'DEPARTING' && (
                        <button className="customer__btn customer__btn--warning customer__btn--small"
                          onClick={() => { setCancelModal(r); setCancelReason(''); }}>
                          取消
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="customer__section">
          <div className="customer__section-title">数据导出</div>
          <div className="customer__export-row">
            <div className="customer__form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="customer__form-label">导出类型</label>
              <select className="customer__form-select" value={exportType}
                onChange={(e) => setExportType(e.target.value)}>
                <option value="container_list">集装箱清单</option>
                <option value="fee_report">费用报表</option>
                <option value="inspection_report">检验报表</option>
                <option value="allocation_report">分配报表</option>
              </select>
            </div>
            <button className="customer__btn customer__btn--primary" onClick={handleCreateExport} disabled={loading}>
              {loading ? '创建中...' : '创建导出任务'}
            </button>
          </div>
          <table className="customer__table">
            <thead>
              <tr><th>类型</th><th>状态</th><th>创建人</th><th>创建时间</th><th>完成时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              {exportTasks.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#5a7a9a' }}>暂无导出任务</td></tr>
              ) : (
                exportTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.task_type}</td>
                    <td>{task.status}</td>
                    <td>{task.created_by}</td>
                    <td>{dayjs(task.created_at).format('MM-DD HH:mm')}</td>
                    <td>{task.completed_at ? dayjs(task.completed_at).format('MM-DD HH:mm') : '-'}</td>
                    <td>
                      {task.status === 'COMPLETED' && (
                        <a className="customer__download-link"
                          href={`/api/export/download/${task.id}`} target="_blank" rel="noreferrer">
                          下载
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pickupModal && (
        <div className="customer__overlay" onClick={() => setPickupModal(null)}>
          <div className="customer__modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer__modal-title">提箱申请 - {pickupModal.container_no}</div>
            <div style={{ fontSize: 13, color: '#8ba4bc', marginBottom: 12 }}>
              箱型: {pickupModal.type} | 持有人: {pickupModal.owner} | 当前堆位: {pickupModal.slot_code || '无'}
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">提箱时间</label>
              <input className="customer__form-input" type="datetime-local"
                value={pickupForm.pickup_time}
                onChange={(e) => setPickupForm({ ...pickupForm, pickup_time: e.target.value })} />
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">运输车牌号</label>
              <input className="customer__form-input" value={pickupForm.truck_no}
                onChange={(e) => setPickupForm({ ...pickupForm, truck_no: e.target.value })}
                placeholder="输入提箱车牌号" />
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">司机姓名</label>
              <input className="customer__form-input" value={pickupForm.driver_name}
                onChange={(e) => setPickupForm({ ...pickupForm, driver_name: e.target.value })}
                placeholder="输入司机姓名" />
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">司机电话</label>
              <input className="customer__form-input" value={pickupForm.driver_phone}
                onChange={(e) => setPickupForm({ ...pickupForm, driver_phone: e.target.value })}
                placeholder="输入司机电话" />
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">申请人</label>
              <input className="customer__form-input" value={pickupForm.requested_by}
                onChange={(e) => setPickupForm({ ...pickupForm, requested_by: e.target.value })}
                placeholder="默认：客服人员" />
            </div>
            <div className="customer__modal-actions">
              <button className="customer__btn customer__btn--warning" onClick={handlePickupRequest} disabled={loading}>
                {loading ? '提交中...' : '确认提箱'}
              </button>
              <button className="customer__btn customer__btn--secondary" onClick={() => setPickupModal(null)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {cancelModal && (
        <div className="customer__overlay" onClick={() => setCancelModal(null)}>
          <div className="customer__modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer__modal-title">取消提箱申请 - {cancelModal.container_no}</div>
            <div style={{ fontSize: 13, color: '#8ba4bc', marginBottom: 12 }}>
              当前状态: 待离港 | 堆位: {cancelModal.slot_code || '无'}
              <br />取消后集装箱状态将回退为 IN_YARD（在场），堆位绑定保留不变
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">取消原因</label>
              <textarea className="customer__form-textarea" value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)} placeholder="请说明取消原因" />
            </div>
            <div className="customer__modal-actions">
              <button className="customer__btn customer__btn--warning" onClick={handlePickupCancel} disabled={loading}>
                {loading ? '处理中...' : '确认取消'}
              </button>
              <button className="customer__btn customer__btn--secondary" onClick={() => setCancelModal(null)}>返回</button>
            </div>
          </div>
        </div>
      )}

      {disputeModal && (
        <div className="customer__overlay" onClick={() => setDisputeModal(null)}>
          <div className="customer__modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer__modal-title">提交费用异议 - {disputeModal.container_no}</div>
            <div style={{ fontSize: 13, color: '#8ba4bc', marginBottom: 12 }}>
              费用金额: ¥{disputeModal.total_fee?.toLocaleString()} | 实际天数: {disputeModal.actual_days}天
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">异议原因</label>
              <textarea className="customer__form-textarea" value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)} placeholder="请说明异议原因" />
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">处理人</label>
              <input className="customer__form-input" value={disputeHandler}
                onChange={(e) => setDisputeHandler(e.target.value)} placeholder="指定处理人" />
            </div>
            <div className="customer__modal-actions">
              <button className="customer__btn customer__btn--warning" onClick={handleCreateDispute} disabled={loading}>
                {loading ? '提交中...' : '提交异议'}
              </button>
              <button className="customer__btn customer__btn--secondary" onClick={() => setDisputeModal(null)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {resolveModal && (
        <div className="customer__overlay" onClick={() => setResolveModal(null)}>
          <div className="customer__modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer__modal-title">解决费用异议 - {resolveModal.container_no}</div>
            <div style={{ fontSize: 13, color: '#8ba4bc', marginBottom: 12 }}>
              异议金额: ¥{resolveModal.total_fee?.toLocaleString()}
            </div>
            <div className="customer__form-group">
              <label className="customer__form-label">处理结果</label>
              <textarea className="customer__form-textarea" value={resolveResult}
                onChange={(e) => setResolveResult(e.target.value)} placeholder="请说明处理结果" />
            </div>
            <div className="customer__modal-actions">
              <button className="customer__btn customer__btn--success" onClick={handleResolveDispute} disabled={loading}>
                {loading ? '处理中...' : '确认解决'}
              </button>
              <button className="customer__btn customer__btn--secondary" onClick={() => setResolveModal(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
