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
  btn: (type) => ({
    padding: '6px 16px',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
    background: type === 'label' ? '#409eff' : type === 'ship' ? '#e6a23c' : type === 'deliver' ? '#67c23a' : type === 'ready' ? '#909399' : '#f56c6c',
    color: '#fff',
    marginRight: 6,
  }),
  actionBar: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '12px 20px',
    background: '#ecf5ff',
    borderRadius: 8,
    border: '1px solid #409eff',
    flexWrap: 'wrap',
  },
  input: {
    padding: '5px 10px',
    border: '1px solid #dcdfe6',
    borderRadius: 4,
    fontSize: 13,
    width: 160,
  },
}

export default function LabelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shipTracking, setShipTracking] = useState('')
  const [shipCourier, setShipCourier] = useState('顺丰速运')

  const load = () => {
    setLoading(true)
    api.labels.get(id).then(d => setData(d)).catch(() => setData(null)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleStatus = async (status, extra = {}) => {
    try {
      await api.labels.updateStatus(id, status, extra)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#909399' }}>加载中...</div>
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#f56c6c' }}>贴标不存在</div>

  const { label } = data

  const canLabel = label.status === 'pending'
  const canReady = label.status === 'labeled'
  const canShip = label.status === 'ready_ship'
  const canDeliver = label.status === 'shipping'
  const canReturn = label.status === 'shipping'

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/delivery')}>← 返回贴标列表</button>

      {(canLabel || canReady || canShip || canDeliver || canReturn) && (
        <div style={styles.actionBar}>
          <span style={{ fontSize: 13, color: '#409eff', fontWeight: 500 }}>可执行操作：</span>
          {canLabel && (
            <button style={styles.btn('label')} onClick={() => handleStatus('labeled')}>确认贴标</button>
          )}
          {canReady && (
            <button style={styles.btn('ready')} onClick={() => handleStatus('ready_ship')}>确认备货</button>
          )}
          {canShip && (
            <>
              <input
                style={styles.input}
                placeholder="快递单号"
                value={shipTracking}
                onChange={e => setShipTracking(e.target.value)}
              />
              <select
                style={{ ...styles.input, width: 120 }}
                value={shipCourier}
                onChange={e => setShipCourier(e.target.value)}
              >
                <option>顺丰速运</option>
                <option>中通快递</option>
                <option>韵达快递</option>
                <option>京东物流</option>
              </select>
              <button
                style={styles.btn('ship')}
                onClick={() => handleStatus('shipping', { tracking_no: shipTracking, courier: shipCourier })}
                disabled={!shipTracking}
              >
                确认发货
              </button>
            </>
          )}
          {canDeliver && (
            <button style={styles.btn('deliver')} onClick={() => handleStatus('delivered')}>确认签收</button>
          )}
          {canReturn && (
            <button style={styles.btn('return')} onClick={() => {
              const note = prompt('退回原因：')
              if (note) handleStatus('returned', { note })
            }}>退回</button>
          )}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.title}>
          包装贴标 {label.label_code} <StatusBadge status={label.status} />
        </div>
        <div style={styles.grid}>
          <div style={styles.item}>
            <span style={styles.label}>贴标编号</span>
            <span style={styles.value}>{label.label_code}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>关联批次</span>
            <span style={styles.value}>{label.batch_code}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>关联处方</span>
            <span style={styles.value}>{label.prescription_code}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>患者姓名</span>
            <span style={styles.value}>{label.patient_name}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>包装数</span>
            <span style={styles.value}>{label.package_count}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>贴标时间</span>
            <span style={styles.value}>{label.labeled_at || '-'}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>发货时间</span>
            <span style={styles.value}>{label.shipped_at || '-'}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>签收时间</span>
            <span style={styles.value}>{label.delivered_at || '-'}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>快递公司</span>
            <span style={styles.value}>{label.courier || '-'}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>快递单号</span>
            <span style={styles.value}>{label.tracking_no || '-'}</span>
          </div>
        </div>

        {label.batch_status && (
          <>
            <div style={styles.sectionTitle}>煎药批次信息</div>
            <div style={styles.grid}>
              <div style={styles.item}>
                <span style={styles.label}>批次状态</span>
                <span style={styles.value}><StatusBadge status={label.batch_status} /></span>
              </div>
              <div style={styles.item}>
                <span style={styles.label}>煎药方法</span>
                <span style={styles.value}>{label.decoction_method}</span>
              </div>
              <div style={styles.item}>
                <span style={styles.label}>加水比例</span>
                <span style={styles.value}>{label.water_ratio}</span>
              </div>
              <div style={styles.item}>
                <span style={styles.label}>煎药时长</span>
                <span style={styles.value}>{label.duration_minutes}分钟</span>
              </div>
              <div style={styles.item}>
                <span style={styles.label}>开始时间</span>
                <span style={styles.value}>{label.batch_started_at || '-'}</span>
              </div>
              <div style={styles.item}>
                <span style={styles.label}>完成时间</span>
                <span style={styles.value}>{label.batch_completed_at || '-'}</span>
              </div>
            </div>
          </>
        )}

        {label.prescription_herbs && (
          <>
            <div style={styles.sectionTitle}>药材清单</div>
            <div style={styles.herbsList}>
              {Array.isArray(label.prescription_herbs) && label.prescription_herbs.map((h, i) => (
                <span key={i}>
                  {h.name}{h.amount}{i < label.prescription_herbs.length - 1 ? '、' : ''}
                </span>
              ))}
            </div>
          </>
        )}

        {label.notes && (
          <>
            <div style={styles.sectionTitle}>备注</div>
            <div style={{ fontSize: 14, color: '#303133' }}>{label.notes}</div>
          </>
        )}
      </div>

      <StatusLog entityType="label" entityId={Number(id)} />
    </div>
  )
}
