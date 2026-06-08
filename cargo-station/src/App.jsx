import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import AcceptanceList from './components/AcceptanceList'
import AcceptanceProcess from './components/AcceptanceProcess'
import AuditTrail from './components/AuditTrail'
import VerificationReview from './components/VerificationReview'

const TABS = [
  { key: 'list', label: '入库受理列表' },
  { key: 'verification', label: '单证校验回看' },
  { key: 'process', label: '入库受理处理' },
  { key: 'audit', label: '状态流转追踪' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('list')
  const [stats, setStats] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadStats = useCallback(async () => {
    try {
      const s = await api.audit.stats()
      setStats(s)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { loadStats() }, [loadStats, refreshKey])

  const handleRefresh = () => setRefreshKey(k => k + 1)

  const statusBadge = (status) => {
    const map = {
      '待受理': 'badge-pending',
      '受理中': 'badge-processing',
      '待单证校验': 'badge-pending',
      '单证校验中': 'badge-processing',
      '校验退回': 'badge-danger',
      '校验通过': 'badge-success',
      '待入库': 'badge-warning',
      '已入库': 'badge-success',
    }
    return map[status] || 'badge-pending'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#000'
            }}>货</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>民航货站 · 入库受理与单证校验</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>受理→校验→入库 全流程留痕</div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleRefresh} title="刷新数据">
            ↻ 刷新
          </button>
        </div>

        <div style={{ display: 'flex', gap: 2, paddingBottom: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className="btn btn-ghost"
              style={{
                borderRadius: '6px 6px 0 0',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.key ? 600 : 400,
                padding: '8px 16px',
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, padding: '14px 24px', background: 'rgba(0,0,0,0.15)',
          borderBottom: '1px solid var(--border)',
        }}>
          {stats.byStatus && Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', background: 'var(--bg-card)',
              borderRadius: 6, border: '1px solid var(--border)',
            }}>
              <span className={`badge ${statusBadge(status)}`} style={{ fontSize: 11, padding: '2px 6px' }}>{status}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{count}</span>
            </div>
          ))}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', background: 'var(--bg-card)',
            borderRadius: 6, border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>操作日志</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--info)' }}>{stats.totalAudits}</span>
          </div>
        </div>
      )}

      <main style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {activeTab === 'list' && <AcceptanceList key={refreshKey} />}
        {activeTab === 'verification' && <VerificationReview key={refreshKey} />}
        {activeTab === 'process' && <AcceptanceProcess key={refreshKey} onRefresh={handleRefresh} />}
        {activeTab === 'audit' && <AuditTrail key={refreshKey} />}
      </main>
    </div>
  )
}
