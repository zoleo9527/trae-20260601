import { useEffect, useState } from 'react'
import { api } from '../api'

const ROLE_LABELS = {
  station_receiver: '货站受理岗',
  security_inspector: '安检校验岗',
  warehouse_dispatcher: '库区调度岗',
}

const ROLE_PERSONNEL = {
  station_receiver: ['张建国', '李明辉', '王秀兰'],
  security_inspector: ['赵国安', '钱卫东', '孙磊'],
  warehouse_dispatcher: ['周调度', '吴承恩', '郑国栋'],
}

const CARGO_OPTIONS = ['普货', '锂电池', '危险化学品', '生鲜冷链', '药品', '精密仪器', '纺织品', '文件资料']

export default function AcceptanceProcess({ onRefresh }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [actionModal, setActionModal] = useState(null)
  const [currentRole, setCurrentRole] = useState('station_receiver')
  const [note, setNote] = useState('')
  const [operatorName, setOperatorName] = useState('张建国')

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.acceptance.list()
      setRecords(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const names = ROLE_PERSONNEL[currentRole]
    if (names) setOperatorName(names[0])
  }, [currentRole])

  const statusBadge = (status) => {
    const map = {
      '待受理': 'badge-pending', '受理中': 'badge-processing', '待单证校验': 'badge-pending',
      '单证校验中': 'badge-processing', '校验退回': 'badge-danger', '校验通过': 'badge-success',
      '待入库': 'badge-warning', '已入库': 'badge-success',
    }
    return map[status] || 'badge-pending'
  }

  const canOperate = (record) => {
    if (record.status === '已入库') return false
    return record.currentHandlerRole === currentRole
  }

  const getNextActions = (record) => {
    const statusActions = {
      '待受理': [{ label: '开始受理', target: '受理中', icon: '▶' }],
      '受理中': [{ label: '提交单证校验', target: '待单证校验', icon: '→' }],
      '待单证校验': [{ label: '开始校验单证', target: '单证校验中', icon: '▶' }],
      '单证校验中': [
        { label: '校验通过', target: '校验通过', icon: '✓', variant: 'success' },
        { label: '校验退回', target: '校验退回', icon: '✗', variant: 'danger' },
      ],
      '校验退回': [{ label: '重新受理', target: '受理中', icon: '↻' }],
      '校验通过': [{ label: '安排入库', target: '待入库', icon: '→' }],
      '待入库': [{ label: '确认入库', target: '已入库', icon: '✓', variant: 'success' }],
    }
    return statusActions[record.status] || []
  }

  const handleAction = async (record, action) => {
    setActionModal({ record, action })
    setNote('')
  }

  const confirmAction = async () => {
    if (!actionModal) return
    const { record, action } = actionModal
    try {
      await api.acceptance.updateStatus(record.id, {
        targetStatus: action.target,
        operator: operatorName,
        operatorRole: currentRole,
        note: note,
      })
      setActionModal(null)
      setNote('')
      loadData()
      onRefresh && onRefresh()
    } catch (e) {
      alert('操作失败: ' + e.message)
    }
  }

  const myRecords = records.filter(r => canOperate(r))
  const otherRecords = records.filter(r => !canOperate(r) && r.status !== '已入库')

  return (
    <div>
      <div style={{
        display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center',
        padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>当前角色:</span>
        {Object.entries(ROLE_LABELS).map(([key, label]) => (
          <button key={key} className={`btn ${currentRole === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCurrentRole(key)}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-muted)' }}>操作人:</span>
        <select className="input" value={operatorName} onChange={e => setOperatorName(e.target.value)}
          style={{ width: 100 }}>
          {(ROLE_PERSONNEL[currentRole] || []).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {myRecords.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--accent)' }}>
            待我处理 ({myRecords.length})
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>运单号</th>
                    <th>航班号</th>
                    <th>货主</th>
                    <th>货物类型</th>
                    <th>当前状态</th>
                    <th>重量</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {myRecords.map(r => {
                    const actions = getNextActions(r)
                    return (
                      <tr key={r.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{r.waybillNo}</td>
                        <td>{r.flightNo}</td>
                        <td>{r.shipper}</td>
                        <td>{r.cargoType}</td>
                        <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                        <td>{r.weight} kg</td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          {actions.map(a => (
                            <button key={a.target}
                              className={`btn btn-sm ${a.variant === 'danger' ? 'btn-danger' : a.variant === 'success' ? 'btn-success' : 'btn-primary'}`}
                              onClick={() => handleAction(r, a)}>
                              {a.icon} {a.label}
                            </button>
                          ))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {otherRecords.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)' }}>
            其他在办记录 ({otherRecords.length})
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>运单号</th>
                    <th>航班号</th>
                    <th>货物类型</th>
                    <th>当前状态</th>
                    <th>当前处理人</th>
                    <th>处理人角色</th>
                  </tr>
                </thead>
                <tbody>
                  {otherRecords.map(r => (
                    <tr key={r.id} style={{ opacity: 0.6 }}>
                      <td style={{ fontFamily: 'monospace' }}>{r.waybillNo}</td>
                      <td>{r.flightNo}</td>
                      <td>{r.cargoType}</td>
                      <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                      <td style={{ fontSize: 12 }}>{r.currentHandler}</td>
                      <td style={{ fontSize: 12 }}>{r.currentHandlerRole}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {records.filter(r => r.status === '已入库').length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--success)' }}>
            已完成入库 ({records.filter(r => r.status === '已入库').length})
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>运单号</th>
                    <th>航班号</th>
                    <th>货物类型</th>
                    <th>货主</th>
                    <th>完成时间</th>
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.status === '已入库').map(r => (
                    <tr key={r.id} style={{ opacity: 0.5 }}>
                      <td style={{ fontFamily: 'monospace' }}>{r.waybillNo}</td>
                      <td>{r.flightNo}</td>
                      <td>{r.cargoType}</td>
                      <td>{r.shipper}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        {new Date(r.updatedAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {actionModal.action.icon} {actionModal.action.label}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 13 }}>
                <div>运单号: <strong>{actionModal.record.waybillNo}</strong></div>
                <div style={{ marginTop: 4 }}>当前状态: <span className={`badge ${statusBadge(actionModal.record.status)}`}>{actionModal.record.status}</span>
                  <span style={{ margin: '0 8px' }}>→</span>
                  <span className={`badge ${statusBadge(actionModal.action.target)}`}>{actionModal.action.target}</span>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>操作人</label>
                <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 13 }}>
                  {operatorName} ({ROLE_LABELS[currentRole]})
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>备注</label>
                <textarea className="input" style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                  placeholder="填写操作备注（可选）" value={note} onChange={e => setNote(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setActionModal(null)}>取消</button>
              <button className={`btn ${actionModal.action.variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                onClick={confirmAction}>
                确认{actionModal.action.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {records.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>暂无记录</div>
      )}
    </div>
  )
}
