import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../utils/api.js'
import { useRole } from '../context/RoleContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import RiskBadge from '../components/RiskBadge.jsx'

const USER_NAME = {
  u_inspector_01:  '王工（巡检工程师）',
  u_property_01:   '李经理（物业联系人）',
  u_supervisor_01: '张主管（维保主管）'
}

function AttachList({ items }) {
  if (!items || !items.length) return <span className="text-muted">（无）</span>
  return (
    <div className="attach-list">
      {items.map((a, i) => <span key={i} className="attach-item">📎 {a}</span>)}
    </div>
  )
}

function SectionTitle({ title, flag, flagCls, children }) {
  return (
    <div className="detail-section-title">
      <span>{title}</span>
      {flag && <span className={`flag ${flagCls || ''}`}>{flag}</span>}
      {children}
    </div>
  )
}

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, current } = useRole()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  const [dispatchNote, setDispatchNote] = useState('')
  const [rectifyNote, setRectifyNote] = useState('')
  const [rectifyAtt, setRectifyAtt] = useState('')
  const [reinspectPassed, setReinspectPassed] = useState(true)
  const [reinspectResult, setReinspectResult] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [reinspectAtt, setReinspectAtt] = useState('')

  const load = () => {
    setLoading(true)
    api.getRecord(id).then(d => { setRecord(d.record); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [id, role])

  if (loading) return <div className="empty">加载中...</div>
  if (!record) return <div className="empty">记录不存在</div>

  const handleDispatch = async () => {
    if (role !== 'supervisor') return
    try {
      const { record: r } = await api.dispatch(id, { note: dispatchNote })
      setRecord(r); setDispatchNote(''); alert('派发成功')
    } catch (e) { alert(e.message) }
  }

  const handleRectify = async () => {
    if (role !== 'property') return
    if (!rectifyNote.trim()) { alert('请填写整改说明'); return }
    try {
      const atts = rectifyAtt.split(/[,，\n]/).map(s => s.trim()).filter(Boolean)
      const { record: r } = await api.rectify(id, { note: rectifyNote, attachments: atts })
      setRecord(r); setRectifyNote(''); setRectifyAtt(''); alert(record.status === 'rejected' ? '补录并重新提交成功' : '整改提交成功')
    } catch (e) { alert(e.message) }
  }

  const handleReinspect = async () => {
    if (role !== 'inspector') return
    if (!reinspectPassed && !rejectReason.trim()) { alert('驳回必须填写原因'); return }
    if (reinspectPassed && !reinspectResult.trim()) { alert('请填写复检结果'); return }
    try {
      const atts = reinspectAtt.split(/[,，\n]/).map(s => s.trim()).filter(Boolean)
      const { record: r } = await api.reinspect(id, {
        passed: reinspectPassed,
        result: reinspectResult,
        rejectReason,
        attachments: atts
      })
      setRecord(r)
      setReinspectResult(''); setRejectReason(''); setReinspectAtt('')
      alert(reinspectPassed ? '复检通过' : '已驳回，等待补录')
    } catch (e) { alert(e.message) }
  }

  const showDispatchAction   = role === 'supervisor' && record.status === 'pending_dispatch'
  const showRectifyAction    = role === 'property'   && (record.status === 'dispatched' || record.status === 'rejected')
  const showReinspectAction  = role === 'inspector'  && record.status === 'rectified'
  const isRejected           = record.status === 'rejected'

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">首页</Link>
        <span className="sep">/</span>
        <Link to="/tasks">整改记录</Link>
        <span className="sep">/</span>
        <span>{record.id}</span>
      </div>

      {isRejected && (
        <div className="alert alert-danger">
          <span>❌</span>
          <div>
            <b>复检被驳回，需要补录：</b>{record.rejectReason}
            <div className="text-muted" style={{ marginTop: 4 }}>驳回时间：{record.rejectAt}</div>
          </div>
        </div>
      )}

      <div className="detail-card">
        <div className="detail-head">
          <div>
            <h2>{record.title}</h2>
            <div className="detail-head-meta">
              <span>📍 {record.location}</span>
              <span>🆔 {record.id}</span>
              <span>🕒 创建于 {record.createdAt}</span>
            </div>
          </div>
          <div className="detail-head-right">
            <StatusBadge status={record.status} />
            <RiskBadge level={record.riskLevel} />
          </div>
        </div>

        <div className="detail-body">
          <div className="detail-section">
            <SectionTitle title="🔍 发现问题（巡检现场记录）" flag="已登记" flagCls="flag-done" />
            <div className="detail-row"><span className="k">巡检人</span><span className="v">{USER_NAME[record.inspector] || record.inspector}</span></div>
            <div className="detail-row"><span className="k">问题描述</span><span className="v">{record.discovery}</span></div>
            <div className="detail-row">
              <span className="k">现场附件</span>
              <span className="v"><AttachList items={record.discoveryAttachments} /></span>
            </div>
          </div>

          <div className="detail-section">
            <SectionTitle
              title="📤 整改派发"
              flag={record.dispatchAt ? '已派发' : (showDispatchAction ? '待你派发' : '未派发')}
              flagCls={record.dispatchAt ? 'flag-done' : (showDispatchAction ? 'flag-active' : '')}
            />
            {record.dispatchAt ? (
              <>
                <div className="detail-row"><span className="k">派发人</span><span className="v">{USER_NAME[record.supervisor] || record.supervisor}</span></div>
                <div className="detail-row"><span className="k">派发对象</span><span className="v">{USER_NAME[record.property] || record.property}</span></div>
                <div className="detail-row"><span className="k">派发时间</span><span className="v">{record.dispatchAt}</span></div>
                <div className="detail-row"><span className="k">派发说明</span><span className="v">{record.dispatchNote || '（无）'}</span></div>
              </>
            ) : (
              <div className="text-muted">暂未派发</div>
            )}

            {showDispatchAction && (
              <div className="action-panel" style={{ marginTop: 14, borderRadius: 8 }}>
                <h3>📤 派发整改给物业联系人</h3>
                <div className="form-row">
                  <label>派发说明（可选）</label>
                  <textarea
                    placeholder="例：请在3个工作日内完成整改，整改后上传现场照片。"
                    value={dispatchNote}
                    onChange={e => setDispatchNote(e.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-warn" onClick={handleDispatch}>📤 确认派发（至李经理）</button>
                </div>
              </div>
            )}
          </div>

          {record.rectificationAt && (
            <div className="detail-section">
              <SectionTitle
                title="🛠️ 物业整改提交"
                flag={record.status === 'rejected' ? '已驳回待补录' : (record.status === 'passed' ? '已通过' : '待复检')}
                flagCls={record.status === 'rejected' ? 'flag-reject' : (record.status === 'passed' ? 'flag-done' : 'flag-active')}
              />
              <div className="detail-row"><span className="k">整改人</span><span className="v">{USER_NAME[record.property] || record.property}</span></div>
              <div className="detail-row"><span className="k">提交时间</span><span className="v">{record.rectificationAt}</span></div>
              <div className="detail-row"><span className="k">整改说明</span><span className="v">{record.rectificationNote}</span></div>
              <div className="detail-row">
                <span className="k">整改附件</span>
                <span className="v"><AttachList items={record.rectificationAttachments} /></span>
              </div>
              {record.supplementaryAt && (
                <>
                  <div className="detail-row"><span className="k">补录时间</span><span className="v">{record.supplementaryAt}</span></div>
                  <div className="detail-row"><span className="k">补充备注</span><span className="v">{record.supplementaryNote}</span></div>
                </>
              )}
            </div>
          )}

          {showRectifyAction && (
            <div className="detail-section">
              <div className="action-panel" style={{ borderRadius: 8 }}>
                <h3>{isRejected ? '📝 补录并重新提交' : '🛠️ 提交整改完成'}</h3>
                {isRejected && (
                  <div className="alert alert-warn mb-2">
                    <span>⚠️</span>
                    <div>
                      <b>上次驳回原因：</b>{record.rejectReason}
                      <div className="text-muted" style={{ marginTop: 2 }}>请对照原因补充材料后重新提交</div>
                    </div>
                  </div>
                )}
                <div className="form-row">
                  <label>{isRejected ? '补充整改说明 *' : '整改说明 *'}</label>
                  <textarea
                    placeholder={isRejected ? '请说明针对驳回原因做了哪些补充整改...' : '请描述整改措施、更换部件、完成情况...'}
                    value={rectifyNote}
                    onChange={e => setRectifyNote(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label>附件文件名（多个用逗号分隔，可选）</label>
                  <input
                    type="text"
                    placeholder="例：整改后照片1.jpg, 更换部件合格证.pdf"
                    value={rectifyAtt}
                    onChange={e => setRectifyAtt(e.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleRectify}>
                    {isRejected ? '📝 补录并重新提交' : '✅ 提交整改完成'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {record.reInspectionAt && (
            <div className="detail-section">
              <SectionTitle
                title="🔬 复检确认"
                flag={record.status === 'passed' ? '复检通过' : (record.status === 'rejected' ? '复检驳回' : '进行中')}
                flagCls={record.status === 'passed' ? 'flag-done' : (record.status === 'rejected' ? 'flag-reject' : 'flag-active')}
              />
              <div className="detail-row"><span className="k">复检人</span><span className="v">{USER_NAME[record.inspector] || record.inspector}</span></div>
              <div className="detail-row"><span className="k">复检时间</span><span className="v">{record.reInspectionAt}</span></div>
              {record.reInspectionResult && (
                <div className="detail-row"><span className="k">复检结果</span><span className="v">{record.reInspectionResult}</span></div>
              )}
              {record.rejectReason && (
                <div className="detail-row"><span className="k text-danger">驳回原因</span><span className="v text-danger">{record.rejectReason}</span></div>
              )}
              <div className="detail-row">
                <span className="k">复检附件</span>
                <span className="v"><AttachList items={record.reInspectionAttachments} /></span>
              </div>
            </div>
          )}

          {showReinspectAction && (
            <div className="detail-section">
              <div className="action-panel" style={{ borderRadius: 8 }}>
                <h3>🔬 复检确认（回看依据就在上方，无需跳页）</h3>
                <div className="alert alert-info mb-2">
                  <span>💡</span>
                  <div>处理复检前，可直接回看上方的「发现问题」「整改提交」附件和说明，所有依据都在本页。</div>
                </div>
                <div className="form-row">
                  <label>复检结论</label>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="radio" checked={reinspectPassed} onChange={() => setReinspectPassed(true)} />
                      <span>✅ 复检通过</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="radio" checked={!reinspectPassed} onChange={() => setReinspectPassed(false)} />
                      <span>❌ 驳回（需补录）</span>
                    </label>
                  </div>
                </div>
                {reinspectPassed ? (
                  <div className="form-row">
                    <label>复检结果说明 *</label>
                    <textarea
                      placeholder="例：现场核查整改到位，消防栓玻璃已更换，功能正常。"
                      value={reinspectResult}
                      onChange={e => setReinspectResult(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-row">
                    <label className="text-danger">驳回原因 *</label>
                    <textarea
                      placeholder="例：闭门后仍有缝隙，且未提供部件合格证，请补充。"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                  </div>
                )}
                <div className="form-row">
                  <label>复检附件文件名（多个用逗号分隔，可选）</label>
                  <input
                    type="text"
                    placeholder="例：复检现场照片.jpg"
                    value={reinspectAtt}
                    onChange={e => setReinspectAtt(e.target.value)}
                  />
                </div>
                <div className="form-actions">
                  {reinspectPassed ? (
                    <button className="btn btn-success" onClick={handleReinspect}>✅ 确认复检通过</button>
                  ) : (
                    <button className="btn btn-danger" onClick={handleReinspect}>❌ 驳回并通知补录</button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="detail-section">
            <SectionTitle title="📜 操作时间线（完整流转记录）" />
            <div className="timeline">
              {record.timeline.slice().reverse().map((t, i) => (
                <div key={i} className="timeline-item">
                  <span className="timeline-actor">{t.actor}</span>
                  <span className="timeline-action">{t.action}</span>
                  <span className="timeline-time">{t.time}</span>
                  {t.detail && <div className="timeline-detail">{t.detail}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={() => navigate('/tasks')}>← 返回列表</button>
      </div>
    </div>
  )
}
