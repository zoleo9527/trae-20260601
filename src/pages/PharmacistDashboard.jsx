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
    background: type === 'approve' ? '#67c23a' : type === 'reject' ? '#f56c6c' : '#409eff',
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
  herbsCell: { fontSize: 12, color: '#606266', maxWidth: 300 },
  modal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    background: '#fff', borderRadius: 8, padding: 24, width: 480,
    maxHeight: '80vh', overflow: 'auto',
  },
  modalTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  textarea: {
    width: '100%', padding: 10, border: '1px solid #dcdfe6', borderRadius: 4,
    fontSize: 14, minHeight: 80, boxSizing: 'border-box',
  },
  modalBtns: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 },
}

export default function PharmacistDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pending_review: 0, approved: 0, rejected: 0, total: 0 })
  const [prescriptions, setPrescriptions] = useState([])
  const [filter, setFilter] = useState('pending_review')
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadStats = () => {
    api.prescriptions.stats().then(data => setStats(data.stats)).catch(() => {})
  }

  const loadPrescriptions = () => {
    api.prescriptions.list({ status: filter, pageSize: 50 }).then(data => setPrescriptions(data.prescriptions)).catch(() => {})
  }

  useEffect(() => { loadStats() }, [])
  useEffect(() => { loadPrescriptions() }, [filter])

  const handleReview = async (action) => {
    if (!reviewModal) return
    setActionLoading(true)
    try {
      await api.prescriptions.updateStatus(reviewModal.id, action === 'approve' ? 'approved' : 'rejected', reviewNote)
      setReviewModal(null)
      setReviewNote('')
      loadStats()
      loadPrescriptions()
    } catch (e) {
      alert(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const filters = [
    { key: 'pending_review', label: '待审方' },
    { key: 'approved', label: '已审方' },
    { key: 'rejected', label: '已驳回' },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.statRow}>
        <div style={styles.statCard('#e6a23c')}>
          <div style={styles.statValue}>{stats.pending_review}</div>
          <div style={styles.statLabel}>待审方</div>
        </div>
        <div style={styles.statCard('#67c23a')}>
          <div style={styles.statValue}>{stats.approved}</div>
          <div style={styles.statLabel}>已审方</div>
        </div>
        <div style={styles.statCard('#f56c6c')}>
          <div style={styles.statValue}>{stats.rejected}</div>
          <div style={styles.statLabel}>已驳回</div>
        </div>
        <div style={styles.statCard('#409eff')}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>总处方</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>处方审核</span>
          <div style={styles.filterRow}>
            {filters.map(f => (
              <button key={f.key} style={styles.filterBtn(filter === f.key)} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>处方编号</th>
              <th style={styles.th}>患者</th>
              <th style={styles.th}>药材</th>
              <th style={styles.th}>剂数</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>审方人</th>
              <th style={styles.th}>创建时间</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.length === 0 ? (
              <tr><td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#909399' }}>暂无数据</td></tr>
            ) : prescriptions.map(p => (
              <tr key={p.id}>
                <td style={styles.td}>{p.code}</td>
                <td style={styles.td}>{p.patient_name}</td>
                <td style={styles.herbsCell}>
                  {Array.isArray(p.herbs) ? p.herbs.map(h => `${h.name}${h.amount}`).join('、') : ''}
                </td>
                <td style={styles.td}>{p.dosage}剂</td>
                <td style={styles.td}><StatusBadge status={p.status} /></td>
                <td style={styles.td}>{p.reviewer_name || '-'}</td>
                <td style={styles.td}>{p.created_at}</td>
                <td style={styles.td}>
                  {p.status === 'pending_review' && (
                    <>
                      <button style={styles.btn('approve')} onClick={() => setReviewModal(p)}>审方</button>
                    </>
                  )}
                  <button style={styles.btn()} onClick={() => navigate(`/pharmacist/prescriptions/${p.id}`)}>查看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewModal && (
        <div style={styles.modal} onClick={() => setReviewModal(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>审核处方 {reviewModal.code}</div>
            <div style={{ marginBottom: 8, fontSize: 14, color: '#606266' }}>
              患者：{reviewModal.patient_name} | {reviewModal.dosage}剂
            </div>
            <div style={{ marginBottom: 12, fontSize: 13, color: '#606266' }}>
              药材：{Array.isArray(reviewModal.herbs) ? reviewModal.herbs.map(h => `${h.name}${h.amount}`).join('、') : ''}
            </div>
            <textarea
              style={styles.textarea}
              placeholder="审核备注（驳回时必填原因）"
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
            />
            <div style={styles.modalBtns}>
              <button
                style={{ ...styles.btn('reject'), padding: '8px 20px', fontSize: 14 }}
                onClick={() => handleReview('reject')}
                disabled={actionLoading}
              >
                驳回
              </button>
              <button
                style={{ ...styles.btn('approve'), padding: '8px 20px', fontSize: 14 }}
                onClick={() => handleReview('approve')}
                disabled={actionLoading}
              >
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
