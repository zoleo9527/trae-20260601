import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { StatusBadge } from '../components/StatusBadge.jsx'

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  statCard: (color) => ({
    background: '#fff',
    borderRadius: 8,
    padding: '20px 16px',
    borderLeft: `4px solid ${color}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }),
  statValue: { fontSize: 28, fontWeight: 700, color: '#303133' },
  statLabel: { fontSize: 13, color: '#909399', marginTop: 4 },
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
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 13,
    color: '#909399',
    fontWeight: 500,
    borderBottom: '1px solid #ebeef5',
    background: '#fafafa',
  },
  td: {
    padding: '10px 16px',
    fontSize: 14,
    color: '#303133',
    borderBottom: '1px solid #ebeef5',
  },
  btn: (type) => ({
    padding: '4px 12px',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
    background: type === 'start' ? '#409eff' : type === 'complete' ? '#67c23a' : '#e6a23c',
    color: '#fff',
    marginRight: 6,
  }),
  filterRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  filterBtn: (active) => ({
    padding: '4px 12px',
    border: active ? '1px solid #409eff' : '1px solid #dcdfe6',
    borderRadius: 4,
    fontSize: 13,
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
  },
  checkbox: { marginRight: 4 },
  batchBtn: (disabled) => ({
    padding: '5px 14px',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#dcdfe6' : '#409eff',
    color: '#fff',
    fontWeight: 500,
  }),
  herbsCell: { fontSize: 12, color: '#606266', maxWidth: 260 },
  createForm: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  select: {
    padding: '6px 10px',
    border: '1px solid #dcdfe6',
    borderRadius: 4,
    fontSize: 13,
  },
  createBtn: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
    background: '#67c23a',
    color: '#fff',
    fontWeight: 500,
  },
  note: { fontSize: 12, color: '#909399' },
}

export default function WorkerDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending: 0, processing: 0, completed: 0, total: 0 })
  const [batches, setBatches] = useState([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [approvedRx, setApprovedRx] = useState([])
  const [createRxId, setCreateRxId] = useState('')

  const loadStats = () => api.batches.stats().then(data => setStats(data.stats)).catch(() => {})
  const loadBatches = () => {
    const params = filter ? { status: filter, pageSize: 50 } : { pageSize: 50 }
    api.batches.list(params).then(data => setBatches(data.batches)).catch(() => {})
  }

  const loadApprovedRx = () => {
    Promise.all([
      api.prescriptions.list({ status: 'approved', pageSize: 50 }),
      api.batches.list({ pageSize: 100 }),
    ]).then(([rxData, batchData]) => {
      const batchedRxIds = new Set(batchData.batches.map(b => b.prescription_id))
      const available = rxData.prescriptions.filter(rx => !batchedRxIds.has(rx.id))
      setApprovedRx(available)
      if (available.length > 0 && !createRxId) {
        setCreateRxId(String(available[0].id))
      } else if (available.length === 0) {
        setCreateRxId('')
      }
    }).catch(() => {})
  }

  useEffect(() => { loadStats(); loadApprovedRx() }, [])
  useEffect(() => { loadBatches() }, [filter])

  const handleCreateBatch = async () => {
    if (!createRxId) return alert('请选择处方')
    try {
      await api.batches.create({ prescription_id: Number(createRxId) })
      loadStats()
      loadBatches()
      loadApprovedRx()
      setCreateRxId('')
    } catch (e) {
      alert(e.message)
    }
  }

  const handleBatchStatus = async (id, status) => {
    try {
      await api.batches.updateStatus(id, status)
      loadStats()
      loadBatches()
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
    if (selected.size === 0) return alert('请选择批次')
    try {
      const result = await api.batches.batchAction([...selected], action)
      if (result.failed.length > 0) {
        alert(`${result.success.length}个成功，${result.failed.length}个失败`)
      }
      setSelected(new Set())
      loadStats()
      loadBatches()
    } catch (e) {
      alert(e.message)
    }
  }

  const canStartBatch = [...selected].every(id => batches.find(b => b.id === id)?.status === 'pending')
  const canCompleteBatch = [...selected].every(id => batches.find(b => b.id === id)?.status === 'processing')

  const filters = [
    { key: '', label: '全部' },
    { key: 'pending', label: '待煎药' },
    { key: 'processing', label: '煎药中' },
    { key: 'completed', label: '已完成' },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.statRow}>
        <div style={styles.statCard('#909399')}>
          <div style={styles.statValue}>{stats.pending}</div>
          <div style={styles.statLabel}>待煎药</div>
        </div>
        <div style={styles.statCard('#409eff')}>
          <div style={styles.statValue}>{stats.processing}</div>
          <div style={styles.statLabel}>煎药中</div>
        </div>
        <div style={styles.statCard('#67c23a')}>
          <div style={styles.statValue}>{stats.completed}</div>
          <div style={styles.statLabel}>已完成</div>
        </div>
        <div style={styles.statCard('#e6a23c')}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>总批次</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>创建煎药批次</span>
        </div>
        <div style={{ padding: '14px 20px' }}>
          <div style={styles.createForm}>
            <select style={styles.select} value={createRxId} onChange={e => setCreateRxId(e.target.value)}>
              <option value="">选择已审方处方</option>
              {approvedRx.map(rx => (
                <option key={rx.id} value={rx.id}>{rx.code} - {rx.patient_name}</option>
              ))}
            </select>
            <button style={styles.createBtn} onClick={handleCreateBatch} disabled={!createRxId}>
              创建批次
            </button>
            <span style={styles.note}>仅已审方通过的处方可创建批次</span>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>煎药批次</span>
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
            style={styles.batchBtn(!canStartBatch || selected.size === 0)}
            onClick={() => handleBatchAction('start')}
            disabled={!canStartBatch || selected.size === 0}
          >
            批量开始煎药
          </button>
          <button
            style={styles.batchBtn(!canCompleteBatch || selected.size === 0)}
            onClick={() => handleBatchAction('complete')}
            disabled={!canCompleteBatch || selected.size === 0}
          >
            批量完成煎药
          </button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>选择</th>
              <th style={styles.th}>批次号</th>
              <th style={styles.th}>处方</th>
              <th style={styles.th}>患者</th>
              <th style={styles.th}>煎药方法</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>煎药员</th>
              <th style={styles.th}>创建时间</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr><td colSpan={9} style={{ ...styles.td, textAlign: 'center', color: '#909399' }}>暂无数据</td></tr>
            ) : batches.map(b => (
              <tr key={b.id}>
                <td style={styles.td}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={selected.has(b.id)}
                    onChange={() => toggleSelect(b.id)}
                  />
                </td>
                <td style={styles.td}>{b.batch_code}</td>
                <td style={styles.td}>{b.prescription_code}</td>
                <td style={styles.td}>{b.patient_name}</td>
                <td style={styles.td}>{b.decoction_method}</td>
                <td style={styles.td}><StatusBadge status={b.status} /></td>
                <td style={styles.td}>{b.worker_name || '-'}</td>
                <td style={styles.td}>{b.created_at}</td>
                <td style={styles.td}>
                  {b.status === 'pending' && (
                    <button style={styles.btn('start')} onClick={() => handleBatchStatus(b.id, 'processing')}>开始</button>
                  )}
                  {b.status === 'processing' && (
                    <button style={styles.btn('complete')} onClick={() => handleBatchStatus(b.id, 'completed')}>完成</button>
                  )}
                  <button style={styles.btn()} onClick={() => navigate(`/worker/batches/${b.id}`)}>详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
