import { useEffect, useState } from 'react'
import { dashboardAPI } from '../api'
import type { DashboardData } from '../types'
import dayjs from 'dayjs'

const exceptionTypeMap: Record<string, string> = {
  equipment: '设备故障', customer: '人员异常', tournament: '赛事异常', safety: '安全隐患', other: '其他',
}

const statusLabels: Record<string, string> = {
  pending: '待处理', confirmed: '已确认', has_exception: '有异常', handling: '处理中', resolved: '已解决', accepted: '已接收',
}

const statusColors: Record<string, string> = {
  pending: '#e94560',
  confirmed: '#48bb78',
  handling: '#ed8936',
  resolved: '#4299e1',
  accepted: '#48bb78',
}

function Badge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      color: '#fff',
      background: statusColors[status] || '#718096',
    }}>{statusLabels[status] || status}</span>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.getData()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ color: '#a0aec0', textAlign: 'center', padding: 60 }}>加载中...</div>
  }

  if (!data) {
    return <div style={{ color: '#e94560', textAlign: 'center', padding: 60 }}>加载失败</div>
  }

  return (
    <div>
      <h2 style={{ color: '#e0e0e0', marginBottom: 24, fontSize: 22 }}>仪表盘</h2>

      <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          { label: '今日巡场数', value: data.stats.patrolToday, color: '#4299e1' },
          { label: '今日异常数', value: data.stats.exceptionToday, color: '#ed8936' },
          { label: '待处理总数', value: data.stats.pendingCount, color: '#e94560' },
        ].map((card) => (
          <div key={card.label} style={{
            flex: 1,
            minWidth: 180,
            background: '#16213e',
            borderRadius: 10,
            padding: '24px 20px',
            borderLeft: `4px solid ${card.color}`,
          }}>
            <div style={{ color: '#a0aec0', fontSize: 14, marginBottom: 8 }}>{card.label}</div>
            <div style={{ color: card.color, fontSize: 32, fontWeight: 700 }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3 style={{ color: '#e0e0e0', marginBottom: 16, fontSize: 16 }}>待处理巡场</h3>
          {data.pendingPatrols.length === 0 ? (
            <div style={{ color: '#718096', padding: 20, textAlign: 'center', background: '#16213e', borderRadius: 8 }}>暂无待处理巡场</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.pendingPatrols.map((p) => (
                <div key={p.id} style={{
                  background: '#16213e',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>
                      {dayjs(p.patrolDate).format('YYYY-MM-DD')} / {p.area}
                    </div>
                    <div style={{ color: '#a0aec0', fontSize: 13, marginTop: 4 }}>提交人: {p.submitter}</div>
                  </div>
                  <Badge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <h3 style={{ color: '#e0e0e0', marginBottom: 16, fontSize: 16 }}>待处理异常</h3>
          {data.pendingExceptions.length === 0 ? (
            <div style={{ color: '#718096', padding: 20, textAlign: 'center', background: '#16213e', borderRadius: 8 }}>暂无待处理异常</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.pendingExceptions.map((e) => (
                <div key={e.id} style={{
                  background: '#16213e',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>
                      {exceptionTypeMap[e.exceptionType] || e.exceptionType} / {e.title}
                    </div>
                    <div style={{ color: '#a0aec0', fontSize: 13, marginTop: 4 }}>
                      严重程度: <span style={{ color: e.severity === 'high' ? '#e94560' : e.severity === 'medium' ? '#ed8936' : '#4299e1' }}>{e.severity}</span>
                    </div>
                  </div>
                  <Badge status={e.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 style={{ color: '#e0e0e0', marginBottom: 16, fontSize: 16 }}>最近状态变化</h3>
        {data.recentLogs.length === 0 ? (
          <div style={{ color: '#718096', padding: 20, textAlign: 'center', background: '#16213e', borderRadius: 8 }}>暂无记录</div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{
              position: 'absolute',
              left: 7,
              top: 8,
              bottom: 8,
              width: 2,
              background: '#0f3460',
            }} />
            {data.recentLogs.map((log) => (
              <div key={log.id} style={{
                position: 'relative',
                marginBottom: 20,
                paddingLeft: 20,
              }}>
                <div style={{
                  position: 'absolute',
                  left: -20,
                  top: 6,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#e94560',
                  border: '2px solid #1a1a2e',
                }} />
                <div style={{ color: '#e0e0e0', fontSize: 14 }}>
                  <strong>{log.operator}</strong> 在 {dayjs(log.operateTime).format('YYYY-MM-DD HH:mm')} 将 <span style={{ color: '#4299e1' }}>{log.recordType}</span> 从 <Badge status={log.fromStatus} /> 变为 <Badge status={log.toStatus} />
                </div>
                {log.note && (
                  <div style={{ color: '#a0aec0', fontSize: 13, marginTop: 4 }}>{log.note}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
