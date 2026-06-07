import { useLoaderData, useNavigate, useRevalidator } from "@remix-run/react";
import { useState } from "react";
import { useRole, ROLE_LABELS } from "~/context/RoleContext";
import { api, STATUS_LABELS, ACTION_LABELS } from "~/utils/api";
import { serverApi } from "~/utils/serverApi";

export async function loader({ params }: { params: { id: string } }) {
  try {
    const [caseData, traceData] = await Promise.all([
      serverApi.getDiseaseCase(params.id),
      serverApi.getTraceByDiseaseCase(params.id),
    ]);
    return { caseData, traceData };
  } catch (e) {
    throw new Response("Not Found", { status: 404 });
  }
}

function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useRole();
  const roles: Array<'TECHNICIAN' | 'WAREHOUSE_KEEPER' | 'FIELD_MANAGER'> = ['TECHNICIAN', 'WAREHOUSE_KEEPER', 'FIELD_MANAGER'];
  return (
    <div className="role-switcher">
      {roles.map(role => (
        <button key={role} className={`role-btn ${currentRole === role ? 'active' : ''}`} onClick={() => setCurrentRole(role)}>
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}

function DiseaseCaseDetail() {
  const { caseData, traceData } = useLoaderData<typeof loader>();
  const { currentRole, currentUser } = useRole();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    caseData.medicines?.forEach((m: any) => { init[m.medicine_id] = m.suggested_quantity; });
    return init;
  });
  const [medicationDate, setMedicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [medicationNotes, setMedicationNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'trace'>('basic');

  const canHandle = caseData.current_handler_role === currentRole;

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    setLoading(true);
    setError('');
    try {
      await action();
      alert(successMsg);
      revalidator.revalidate();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!currentUser) return;
    handleAction(
      () => api.submitDiseaseCase(caseData.id, currentUser.id),
      '提交成功，已流转到饲料仓管'
    );
  };

  const handleReject = () => {
    if (!currentUser || !rejectReason.trim()) return;
    handleAction(
      () => api.rejectDiseaseCase(caseData.id, { operatorId: currentUser.id, rejectReason }),
      '驳回成功，已退回养殖技术员补录'
    );
    setShowRejectForm(false);
    setRejectReason('');
  };

  const handleAllocate = () => {
    if (!currentUser) return;
    const medicines = caseData.medicines.map((m: any) => ({
      id: m.medicine_id,
      actualQuantity: allocations[m.medicine_id] || 0,
    }));
    handleAction(
      () => api.allocateMedicine(caseData.id, { operatorId: currentUser.id, medicines }),
      '配药成功，已流转到场长审批'
    );
  };

  const handleApprove = () => {
    if (!currentUser) return;
    handleAction(
      () => api.approveDiseaseCase(caseData.id, { operatorId: currentUser.id, remark: '审批通过' }),
      '审批通过，已流转到养殖技术员执行用药'
    );
  };

  const handleRecordMedication = () => {
    if (!currentUser) return;
    handleAction(
      () => api.recordMedication(caseData.id, { operatorId: currentUser.id, medicationDate, notes: medicationNotes }),
      '用药记录已保存，已流转到场长结案'
    );
  };

  const handleClose = () => {
    if (!currentUser) return;
    handleAction(
      () => api.closeDiseaseCase(caseData.id, { operatorId: currentUser.id, remark: '结案' }),
      '已结案归档'
    );
  };

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="link-btn" style={{ color: 'white', fontSize: '16px' }} onClick={() => navigate('/')}>← 返回首页</button>
          <h1>📋 病害处理单详情 - {caseData.case_no}</h1>
          <span className={`status-badge status-${caseData.status}`} style={{ fontSize: '14px' }}>
            {STATUS_LABELS[caseData.status]}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
          <RoleSwitcher />
        </div>
      </div>

      <div className="main">
        {error && (
          <div className="reject-box">
            <h4>操作失败</h4>
            <p>{error}</p>
          </div>
        )}

        {caseData.status === 'REJECTED' && caseData.reject_reason && (
          <div className="reject-box">
            <h4>⚠️ 驳回意见（请根据以下意见补录修改后重新提交）</h4>
            <p>{caseData.reject_reason}</p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              驳回人: {traceData.diseaseCase.rejected_by_name} | 驳回时间: {caseData.rejected_at}
            </p>
          </div>
        )}

        <div className="tabs">
          <div className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
            基本信息与流程
          </div>
          <div className={`tab ${activeTab === 'trace' ? 'active' : ''}`} onClick={() => setActiveTab('trace')}>
            用药追溯回看
          </div>
        </div>

        {activeTab === 'basic' && (
          <>
            <div className="grid">
              <div className="card">
                <div className="card-title">基本信息</div>
                <div style={{ lineHeight: '2' }}>
                  <div><strong>塘口:</strong> {caseData.pond?.name}</div>
                  <div><strong>养殖品种:</strong> {caseData.pond?.breed_type}</div>
                  <div><strong>病害名称:</strong> {caseData.disease_name}</div>
                  <div><strong>严重程度:</strong> <span className={`status-badge severity-${caseData.severity}`}>{caseData.severity === 'MILD' ? '轻度' : caseData.severity === 'MODERATE' ? '中度' : '重度'}</span></div>
                  <div><strong>申报人:</strong> {caseData.reporter?.name}</div>
                  <div><strong>申报日期:</strong> {caseData.report_date}</div>
                  <div><strong>当前处理角色:</strong> {ROLE_LABELS[caseData.current_handler_role as keyof typeof ROLE_LABELS]}</div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">病害描述</div>
                <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{caseData.disease_description}</p>
                {caseData.suggested_medication && (
                  <>
                    <div style={{ fontWeight: '600', marginTop: '12px', marginBottom: '6px' }}>建议用药方案:</div>
                    <p style={{ lineHeight: '1.8' }}>{caseData.suggested_medication}</p>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <span>💊 用药明细</span>
                {caseData.status === 'SUBMITTED' && currentRole === 'WAREHOUSE_KEEPER' && canHandle && (
                  <span style={{ fontSize: '13px', color: '#666', fontWeight: 'normal' }}>请填写实际出库数量</span>
                )}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>药品名称</th>
                    <th>规格</th>
                    <th>生产厂家</th>
                    <th>建议用量</th>
                    {(caseData.medicines?.some((m: any) => m.actual_quantity !== null) || (caseData.status === 'SUBMITTED' && currentRole === 'WAREHOUSE_KEEPER' && canHandle)) && <th>实际用量</th>}
                    <th>用法用量</th>
                    <th>使用方法</th>
                  </tr>
                </thead>
                <tbody>
                  {caseData.medicines?.map((m: any) => (
                    <tr key={m.id}>
                      <td>{m.medicine_name}</td>
                      <td>{m.specification}</td>
                      <td>{m.manufacturer}</td>
                      <td>{m.suggested_quantity} {m.unit}</td>
                      {(caseData.medicines?.some((x: any) => x.actual_quantity !== null) || (caseData.status === 'SUBMITTED' && currentRole === 'WAREHOUSE_KEEPER' && canHandle)) && (
                        <td>
                          {caseData.status === 'SUBMITTED' && currentRole === 'WAREHOUSE_KEEPER' && canHandle ? (
                            <input
                              type="number"
                              value={allocations[m.medicine_id] || 0}
                              onChange={(e) => setAllocations({ ...allocations, [m.medicine_id]: Number(e.target.value) })}
                              style={{ width: '80px', padding: '4px 8px' }}
                              min="0"
                              step="0.1"
                            />
                          ) : (
                            m.actual_quantity !== null ? `${m.actual_quantity} ${m.unit}` : '-'
                          )}
                        </td>
                      )}
                      <td>{m.dosage || '-'}</td>
                      <td>{m.usage_method || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-title">
                <span>📝 操作日志（全流程留痕）</span>
              </div>
              <div className="timeline">
                {traceData.audits.map((a: any) => (
                  <div key={a.id} className={`timeline-item ${a.action === 'REJECT' ? 'reject' : ''}`}>
                    <div className="timeline-content">
                      <div style={{ fontWeight: '500' }}>
                        {ACTION_LABELS[a.action] || a.action}
                        {a.old_status && a.new_status && (
                          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
                            {STATUS_LABELS[a.old_status] || a.old_status} → {STATUS_LABELS[a.new_status] || a.new_status}
                          </span>
                        )}
                      </div>
                      {a.remark && <p style={{ marginTop: '6px', fontSize: '14px' }}>{a.remark}</p>}
                      <div className="timeline-meta">
                        操作人: {a.operator_name} ({ROLE_LABELS[a.operator_role as keyof typeof ROLE_LABELS]}) | {a.created_at}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <span>⚡ 操作区</span>
                {!canHandle && <span style={{ fontSize: '13px', color: '#999', fontWeight: 'normal' }}>当前不在您的处理节点，请切换角色体验</span>}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {currentRole === 'TECHNICIAN' && canHandle && ['DRAFT', 'REJECTED'].includes(caseData.status) && (
                  <>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                      {caseData.status === 'REJECTED' ? '补录完成，重新提交' : '提交审核'}
                    </button>
                    <button className="btn btn-default" onClick={() => navigate(`/disease-cases/${caseData.id}/edit`)}>
                      修改病害单
                    </button>
                  </>
                )}

                {currentRole === 'WAREHOUSE_KEEPER' && canHandle && caseData.status === 'SUBMITTED' && (
                  <button className="btn btn-primary" onClick={handleAllocate} disabled={loading}>
                    确认配药出库
                  </button>
                )}

                {currentRole === 'FIELD_MANAGER' && canHandle && caseData.status === 'MEDICINE_ALLOCATED' && (
                  <>
                    <button className="btn btn-primary" onClick={handleApprove} disabled={loading}>
                      审批通过
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowRejectForm(!showRejectForm)} disabled={loading}>
                      驳回
                    </button>
                  </>
                )}

                {currentRole === 'TECHNICIAN' && canHandle && caseData.status === 'APPROVED' && (
                  <>
                    <div className="form-group" style={{ marginBottom: 0, width: 'auto' }}>
                      <label>用药日期</label>
                      <input type="date" value={medicationDate} onChange={(e) => setMedicationDate(e.target.value)} style={{ width: '180px' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, width: '300px' }}>
                      <label>用药备注</label>
                      <input type="text" value={medicationNotes} onChange={(e) => setMedicationNotes(e.target.value)} placeholder="可选，填写用药情况" />
                    </div>
                    <button className="btn btn-primary" onClick={handleRecordMedication} disabled={loading} style={{ alignSelf: 'flex-end' }}>
                      确认已用药
                    </button>
                  </>
                )}

                {currentRole === 'FIELD_MANAGER' && canHandle && caseData.status === 'MEDICATED' && (
                  <button className="btn btn-primary" onClick={handleClose} disabled={loading}>
                    结案归档
                  </button>
                )}

                {caseData.status === 'CLOSED' && (
                  <button className="btn btn-default" onClick={() => navigate(`/ponds/${caseData.pond_id}`)}>
                    查看该塘口全部用药追溯
                  </button>
                )}
              </div>

              {showRejectForm && currentRole === 'FIELD_MANAGER' && caseData.status === 'MEDICINE_ALLOCATED' && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#ffebee', borderRadius: '4px' }}>
                  <div className="form-group">
                    <label>驳回理由（必填，不少于5个字）</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="请详细说明驳回原因，如：缺少水质指标、用药方案不合理等"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-danger" onClick={handleReject} disabled={loading || rejectReason.trim().length < 5}>
                      确认驳回
                    </button>
                    <button className="btn btn-default" onClick={() => { setShowRejectForm(false); setRejectReason(''); }}>
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'trace' && (
          <div className="card">
            <div className="card-title">
              <span>🔍 用药追溯回看（从病害单穿透）</span>
            </div>
            {traceData.medicationRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                该病害单暂无用药记录
              </div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>用药日期</th>
                      <th>药品名称</th>
                      <th>规格</th>
                      <th>用量</th>
                      <th>使用方法</th>
                      <th>操作人</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traceData.medicationRecords.map((r: any) => (
                      <tr key={r.id}>
                        <td>{r.medication_date}</td>
                        <td>{r.medicine_name}</td>
                        <td>{r.specification}</td>
                        <td>{r.quantity} {r.unit}</td>
                        <td>{r.usage_method || '-'}</td>
                        <td>{r.operator_name}</td>
                        <td>{r.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '20px' }}>
                  <button className="btn btn-default" onClick={() => navigate(`/ponds/${caseData.pond_id}`)}>
                    查看该塘口完整用药历史 →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiseaseCaseDetailPage() {
  return <DiseaseCaseDetail />;
}
