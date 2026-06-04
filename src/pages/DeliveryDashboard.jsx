import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { StatusBadge } from '../components/StatusBadge.jsx'

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 },
  statCard: (color) => ({
    background: '#fff',
    borderRadius: 8,
    padding: '16px 12px',
    borderLeft: `4px solid ${color}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }),
  statValue: { fontSize: 24, fontWeight: 700, color: '#303133' },
  statLabel: { fontSize: 12, color: '#909399', marginTop: 2 },
  section: {
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid #ebeef5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#303133' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 13,
    color: '#909399',
    fontWeight: 500,
    borderBottom: '1px solid #ebeef5',
    background: '#fafafa',
  },
  td: {
    padding: '10px 14px',
    fontSize: 13,
    color: '#303133',
    borderBottom: '1px solid #ebeef5',
  },
  btn: (type) => ({
    padding: '3px 10px',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
    background: type === 'label' ? '#409eff' : type === 'ship' ? '#e6a23c' : type === 'deliver' ? '#67c23a' : type === 'ready' ? '#909399' : '#f56c6c',
    color: '#fff',
    marginRight: 4,
  }),
  filterRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterBtn: (active) => ({
    padding: '3px 10px',
    border: active ? '1px solid #409eff' : '1px solid #dcdfe6',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    background: active ? '#ecf5ff' : '#fff',
    color: active ? '#409eff' : '#606266',
  }),
  batchBar: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '10px 20px',
    background: '#fafafa',
    borderBottom: '1px solid #ebeef5',
    flexWrap: 'wrap',
  },
  checkbox: { marginRight: 4 },
  batchBtn: (disabled) => ({
    padding: '4px 12px',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#dcdfe6' : '#409eff',
    color: '#fff',
    fontWeight: 500,
  }),
  shipForm: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    padding: '5px 10px',
    border: '1px solid #dcdfe6',
    borderRadius: 4,
    fontSize: 13,
    width: 140,
  },
}

export default function DeliveryDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 0, labeled: 0, ready_ship: 0, shipping: 0, delivered: 0, returned: 0, total: 0 })
  const [labels, setLabels] = useState([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [batchShipMode, setBatchShipMode] = useState(false)
  const [trackingNo, setTrackingNo] = useState('')
  const [courier, setCourier] = useState('顺丰速运')

  const loadStats = () => api.labels.stats().then(data => setStats(data.stats)).catch(() => {})
  const loadLabels = () => {
    const params = filter ? { status: filter, pageSize: 50 } : { pageSize: 50 }
    api.labels.list(params).then(data => setLabels(data.labels)).catch(() => {})
  }

  useEffect(() => { loadStats() }, [])
  useEffect(() => { loadLabels() }, [filter])

  const handleLabelStatus = async (id, status, extra = {}) => {
    try {
      await api.labels.updateStatus(id, status, extra)
      loadStats()
      loadLabels()
    } catch (e) {
      alert(e.message)
    }
  }

  const toggleSelect = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleBatchAction = async (action) => {
    if (selected.size === 0) return alert('请选择贴标')
    try {
      const data = action === 'ship' ? { tracking_no: trackingNo, courier } : {}
      const result = await api.labels.batchAction([...selected], action, data)
      if (result.failed.length > 0) {
        alert(`${result.success.length}个成功，${result.failed.length}个失败`)
      }
      setSelected(new Set())
      setBatchShipMode(false)
      loadStats()
      loadLabels()
    } catch (e) {
      alert(e.message)
    }
  }

  const filters = [
    { key: '', label: '全部' },
    { key: 'pending', label: '待贴标' },
    { key: 'labeled', label: '已贴标' },
    { key: 'ready_ship', label: '待配送' },
    { key: 'shipping', label: '配送中' },
    { key: 'delivered', label: '已签收' },
    { key: 'returned', label: '已退回' },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.statRow}>
        <div style={styles.statCard('#909399')}>
          <div style={styles.statValue}>{stats.pending}</div>
          <div style={styles.statLabel}>待贴标</div>
        </div>
        <div style={styles.statCard('#409eff')}>
          <div style={styles.statValue}>{stats.labeled}</div>
          <div style={styles.statLabel}>已贴标</div>
        </div>
        <div style={styles.statCard('#e6a23c')}>
          <div style={styles.statValue}>{stats.ready_ship}</div>
          <div style={styles.statLabel}>待配送</div>
        </div>
        <div style={styles.statCard('#409eff')}>
          <div style={styles.statValue}>{stats.shipping}</div>
          <div style={styles.statLabel}>配送中</div>
        </div>
        <div style={styles.statCard('#67c23a')}>
          <div style={styles.statValue}>{stats.delivered}</div>
          <div style={styles.statLabel}>已签收</div>
        </div>
        <div style={styles.statCard('#f56c6c')}>
          <div style={styles.statValue}>{stats.returned}</div>
          <div style={styles.statLabel}>已退回</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>包装贴标管理</span>
          <div style={styles.filterRow}>
            {filters.map(f => (
              <button key={f.key} style={styles.filterBtn(filter === f.key)} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.batchBar}>
          <span style={{ fontSize: 13, color: '#606266' }}>已选 {selected.size} 项</span>
          <button
            style={styles.batchBtn(selected.size === 0)}
            onClick={() => handleBatchAction('label')}
            disabled={selected.size === 0}
          >
            批量贴标
          </button>
          <button
            style={styles.batchBtn(selected.size === 0)}
            onClick={() => handleBatchAction('ready')}
            disabled={selected.size === 0}
          >
            批量备货
          </button>
          <button
            style={styles.batchBtn(selected.size === 0)}
            onClick={() => setBatchShipMode(true)}
            disabled={selected.size === 0}
          >
            批量发货
          </button>
          <button
            style={styles.batchBtn(selected.size === 0)}
            onClick={() => handleBatchAction('deliver')}
            disabled={selected.size === 0}
          >
            批量签收
          </button>
        </div>

        {batchShipMode && (
          <div style={{ ...styles.batchBar, background: '#ecf5ff' }}>
            <span style={{ fontSize: 13, color: '#409eff' }}>批量发货设置：</span>
            <input
              style={styles.input}
              placeholder="快递单号"
              value={trackingNo}
              onChange={e => setTrackingNo(e.target.value)}
            />
            <select
              style={{ ...styles.input, width: 120 }}
              value={courier}
              onChange={e => setCourier(e.target.value)}
            >
              <option>顺丰速运</option>
              <option>中通快递</option>
              <option>韵达快递</option>
              <option>京东物流</option>
            </select>
            <button
              style={styles.batchBtn(!trackingNo)}
              onClick={() => handleBatchAction('ship')}
              disabled={!trackingNo}
            >
              确认发货
            </button>
            <button
              style={{ ...styles.batchBtn(false), background: '#909399' }}
              onClick={() => setBatchShipMode(false)}
            >
              取消
            </button>
          </div>
        )}

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>选择</th>
              <th style={styles.th}>贴标编号</th>
              <th style={styles.th}>批次号</th>
              <th style={styles.th}>处方</th>
              <th style={styles.th}>患者</th>
              <th style={styles.th}>包装数</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>快递</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {labels.length === 0 ? (
              <tr><td colSpan={9} style={{ ...styles.td, textAlign: 'center', color: '#909399' }}>暂无数据</td></tr>
            ) : labels.map(l => (
              <tr key={l.id}>
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={selected.has(l.id)}
                    onChange={() => toggleSelect(l.id)}
                  />
                </td>
                <td style={styles.td}>{l.label_code}</td>
                <td style={styles.td}>{l.batch_code}</td>
                <td style={styles.td}>{l.prescription_code}</td>
                <td style={styles.td}>{l.patient_name}</td>
                <td style={styles.td}>{l.package_count}</td>
                <td style={styles.td}><StatusBadge status={l.status} /></td>
                <td style={styles.td}>{l.tracking_no || '-'}</td>
                <td style={styles.td}>
                  {l.status === 'pending' && (
                    <button style={styles.btn('label')} onClick={() => handleLabelStatus(l.id, 'labeled')}>贴标</button>
                  )}
                  {l.status === 'labeled' && (
                    <button style={styles.btn('ready')} onClick={() => handleLabelStatus(l.id, 'ready_ship')}>备货</button>
                  )}
                  {l.status === 'ready_ship' && (
                    <button style={styles.btn('ship')} onClick={() => {
                      const tn = prompt('快递单号：')
                      if (tn) handleLabelStatus(l.id, 'shipping', { tracking_no: tn, courier: '顺丰速运' })
                    }}>发货</button>
                  )}
                  {l.status === 'shipping' && (
                    <>
                      <button style={styles.btn('deliver')} onClick={() => handleLabelStatus(l.id, 'delivered')}>签收</button>
                      <button style={styles.btn('return')} onClick={() => {
                        const note = prompt('退回原因：')
                        if (note) handleLabelStatus(l.id, 'returned', { note })
                      }}>退回</button>
                    </>
                  )}
                  <button style={styles.btn()} onClick={() => navigate(`/delivery/labels/${l.id}`)}>回看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
