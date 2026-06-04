import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { StatusBadge } from '../components/StatusBadge.jsx'
import StatusLog from '../components/StatusLog.jsx'

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  backBtn: {
    padding: '6px 16px',
    border: '1px solid #dcdfe6',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    color: '#606266',
    width: 'fit-content',
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  title: { fontSize: 18, fontWeight: 600, color: '#303133', marginBottom: 16 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px 32px',
  },
  item: { display: 'flex', gap: 8 },
  label: { fontSize: 14, color: '#909399', minWidth: 80, flexShrink: 0 },
  value: { fontSize: 14, color: '#303133' },
  herbsList: { fontSize: 13, color: '#303133' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#303133',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid #ebeef5',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: 13,
    color: '#909399',
    fontWeight: 500,
    borderBottom: '1px solid #ebeef5',
    background: '#fafafa',
  },
  td: {
    padding: '8px 12px',
    fontSize: 13,
    color: '#303133',
    borderBottom: '1px solid #ebeef5',
  },
  btn: (type) => ({
    padding: '6px 20px',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 500,
    background: type === 'approve' ? '#67c23a' : '#f56c6c',
    color: '#fff',
    marginRight: 8,
  }),
  reviewBar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '16px 20px',
    background: '#fdf6ec',
    borderRadius: 8,
    border: '1px solid #e6a23c',
  },
}

export default function PrescriptionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.prescriptions.get(id).then(d => setData(d)).catch(() => setData(null)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleReview = async (status) => {
    try {
      await api.prescriptions.updateStatus(id, status, status === 'approved' ? '审方通过' : '审方驳回')
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#909399' }}>加载中...</div>
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#f56c6c' }}>处方不存在</div>

  const { prescription, batches, labels, logs } = data

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/pharmacist')}>← 返回处方列表</button>

      {prescription.status === 'pending_review' && (
        <div style={styles.reviewBar}>
          <span style={{ fontSize: 14, color: '#e6a23c', fontWeight: 500 }}>待审核</span>
          <button style={styles.btn('approve')} onClick={() => handleReview('approved')}>审核通过</button>
          <button style={styles.btn('reject')} onClick={() => handleReview('rejected')}>审核驳回</button>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.title}>
          处方 {prescription.code} <StatusBadge status={prescription.status} />
        </div>
        <div style={styles.grid}>
          <div style={styles.item}>
            <span style={styles.label}>患者姓名</span>
            <span style={styles.value}>{prescription.patient_name}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>剂数</span>
            <span style={styles.value}>{prescription.dosage}剂</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>审方人</span>
            <span style={styles.value}>{prescription.reviewer_name || '-'}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>审方时间</span>
            <span style={styles.value}>{prescription.reviewed_at || '-'}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>创建时间</span>
            <span style={styles.value}>{prescription.created_at}</span>
          </div>
        </div>

        <div style={styles.sectionTitle}>药材清单</div>
        <div style={styles.herbsList}>
          {Array.isArray(prescription.herbs) && prescription.herbs.map((h, i) => (
            <span key={i}>
              {h.name}{h.amount}{i < prescription.herbs.length - 1 ? '、' : ''}
            </span>
          ))}
        </div>

        {prescription.notes && (
          <>
            <div style={styles.sectionTitle}>备注</div>
            <div style={{ fontSize: 14, color: prescription.status === 'rejected' ? '#f56c6c' : '#303133' }}>
              {prescription.notes}
            </div>
          </>
        )}
      </div>

      {batches.length > 0 && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>关联煎药批次</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>批次号</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>煎药员</th>
                <th style={styles.th}>煎药方法</th>
                <th style={styles.th}>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id}>
                  <td style={styles.td}>{b.batch_code}</td>
                  <td style={styles.td}><StatusBadge status={b.status} /></td>
                  <td style={styles.td}>{b.worker_name || '-'}</td>
                  <td style={styles.td}>{b.decoction_method}</td>
                  <td style={styles.td}>{b.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {labels.length > 0 && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>关联包装贴标</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>贴标编号</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>包装数</th>
                <th style={styles.th}>快递单号</th>
              </tr>
            </thead>
            <tbody>
              {labels.map(l => (
                <tr key={l.id}>
                  <td style={styles.td}>{l.label_code}</td>
                  <td style={styles.td}><StatusBadge status={l.status} /></td>
                  <td style={styles.td}>{l.package_count}</td>
                  <td style={styles.td}>{l.tracking_no || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <StatusLog entityType="prescription" entityId={Number(id)} />
    </div>
  )
}
