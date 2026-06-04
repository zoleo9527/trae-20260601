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
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#303133',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid #ebeef5',
  },
  herbsList: { fontSize: 13, color: '#303133' },
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
    padding: '8px 24px',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 500,
    background: type === 'start' ? '#409eff' : '#67c23a',
    color: '#fff',
    marginRight: 8,
  }),
  actionBar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '16px 20px',
    background: '#ecf5ff',
    borderRadius: 8,
    border: '1px solid #409eff',
  },
}

export default function BatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.batches.get(id).then(d => setData(d)).catch(() => setData(null)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleStatusChange = async (status) => {
    try {
      await api.batches.updateStatus(id, status)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#909399' }}>加载中...</div>
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#f56c6c' }}>批次不存在</div>

  const { batch, labels } = data

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/worker')}>← 返回批次列表</button>

      {(batch.status === 'pending' || batch.status === 'processing') && (
        <div style={styles.actionBar}>
          <span style={{ fontSize: 14, color: '#409eff', fontWeight: 500 }}>
            当前状态：{batch.status === 'pending' ? '待煎药' : '煎药中'}
          </span>
          {batch.status === 'pending' && (
            <button style={styles.btn('start')} onClick={() => handleStatusChange('processing')}>开始煎药</button>
          )}
          {batch.status === 'processing' && (
            <button style={styles.btn('complete')} onClick={() => handleStatusChange('completed')}>完成煎药</button>
          )}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.title}>
          煎药批次 {batch.batch_code} <StatusBadge status={batch.status} />
        </div>
        <div style={styles.grid}>
          <div style={styles.item}>
            <span style={styles.label}>关联处方</span>
            <span style={styles.value}>{batch.prescription_code}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>患者姓名</span>
            <span style={styles.value}>{batch.patient_name}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>煎药方法</span>
            <span style={styles.value}>{batch.decoction_method}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>加水比例</span>
            <span style={styles.value}>{batch.water_ratio}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>煎药时长</span>
            <span style={styles.value}>{batch.duration_minutes}分钟</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>剂数</span>
            <span style={styles.value}>{batch.dosage}剂</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>煎药员</span>
            <span style={styles.value}>{batch.worker_name || '-'}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>开始时间</span>
            <span style={styles.value}>{batch.started_at || '-'}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>完成时间</span>
            <span style={styles.value}>{batch.completed_at || '-'}</span>
          </div>
        </div>

        <div style={styles.sectionTitle}>药材清单</div>
        <div style={styles.herbsList}>
          {Array.isArray(batch.herbs) && batch.herbs.map((h, i) => (
            <span key={i}>
              {h.name}{h.amount}{i < batch.herbs.length - 1 ? '、' : ''}
            </span>
          ))}
        </div>

        {batch.notes && (
          <>
            <div style={styles.sectionTitle}>备注</div>
            <div style={{ fontSize: 14, color: '#303133' }}>{batch.notes}</div>
          </>
        )}
      </div>

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
                <th style={styles.th}>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {labels.map(l => (
                <tr key={l.id}>
                  <td style={styles.td}>{l.label_code}</td>
                  <td style={styles.td}><StatusBadge status={l.status} /></td>
                  <td style={styles.td}>{l.package_count}</td>
                  <td style={styles.td}>{l.tracking_no || '-'}</td>
                  <td style={styles.td}>{l.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <StatusLog entityType="batch" entityId={Number(id)} />
    </div>
  )
}
