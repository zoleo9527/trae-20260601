import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { customerApi, exportApi } from '../api';
import './CustomerWorkstation.css';

type TabKey = 'fees' | 'inspections' | 'export';

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

  useEffect(() => {
    loadFees();
    loadInspections();
    loadMissed();
    loadExportTasks();
  }, [loadFees, loadInspections, loadMissed, loadExportTasks]);

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
