import { useState } from 'react'
import type { ParkingLog, MonthlyRental, GateAnomaly } from '../../shared/types'

type TabKey = 'parking_logs' | 'monthly_rentals' | 'gate_anomalies'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'parking_logs', label: '车场日志' },
  { key: 'monthly_rentals', label: '月租名单' },
  { key: 'gate_anomalies', label: '道闸异常' },
]

const directionLabels: Record<string, string> = { in: '进场', out: '出场' }
const rentalStatusLabels: Record<string, string> = { active: '有效', expired: '已过期', suspended: '已暂停' }
const rentalStatusColors: Record<string, string> = {
  active: 'text-emerald-400',
  expired: 'text-red-400',
  suspended: 'text-amber-400',
}
const anomalyTypeLabels: Record<string, string> = {
  stuck_open: '道闸常开',
  stuck_closed: '道闸常闭',
  sensor_error: '传感器故障',
  force_open: '强行闯闸',
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

interface EvidenceData {
  parking_logs: ParkingLog[]
  monthly_rentals: MonthlyRental[]
  gate_anomalies: GateAnomaly[]
}

export default function EvidencePanel({ evidence }: { evidence: EvidenceData }) {
  const [activeTab, setActiveTab] = useState<TabKey>('parking_logs')

  return (
    <div className="bg-park-card rounded-lg border border-park-border">
      <div className="flex border-b border-park-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-park-amber text-park-amber'
                : 'border-transparent text-park-muted hover:text-park-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'parking_logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-park-muted text-left border-b border-park-border">
                  <th className="pb-2 font-medium">车牌号</th>
                  <th className="pb-2 font-medium">进出</th>
                  <th className="pb-2 font-medium">道闸</th>
                  <th className="pb-2 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {evidence.parking_logs.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-park-muted">暂无数据</td></tr>
                ) : (
                  evidence.parking_logs.map((log) => (
                    <tr key={log.id} className="border-b border-park-border/50 hover:bg-park-hover/50">
                      <td className="py-2 text-park-text">{log.plate_number}</td>
                      <td className="py-2">
                        <span className={log.direction === 'in' ? 'text-emerald-400' : 'text-amber-400'}>
                          {directionLabels[log.direction]}
                        </span>
                      </td>
                      <td className="py-2 text-park-text">{log.gate_name}</td>
                      <td className="py-2 text-park-muted">{formatTime(log.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'monthly_rentals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-park-muted text-left border-b border-park-border">
                  <th className="pb-2 font-medium">车牌号</th>
                  <th className="pb-2 font-medium">车主</th>
                  <th className="pb-2 font-medium">有效期</th>
                  <th className="pb-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {evidence.monthly_rentals.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-park-muted">暂无数据</td></tr>
                ) : (
                  evidence.monthly_rentals.map((rental) => (
                    <tr key={rental.id} className="border-b border-park-border/50 hover:bg-park-hover/50">
                      <td className="py-2 text-park-text">{rental.plate_number}</td>
                      <td className="py-2 text-park-text">{rental.owner_name}</td>
                      <td className="py-2 text-park-muted">{formatDate(rental.start_date)} ~ {formatDate(rental.end_date)}</td>
                      <td className={`py-2 ${rentalStatusColors[rental.status] || 'text-park-muted'}`}>
                        {rentalStatusLabels[rental.status] || rental.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'gate_anomalies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-park-muted text-left border-b border-park-border">
                  <th className="pb-2 font-medium">道闸</th>
                  <th className="pb-2 font-medium">异常类型</th>
                  <th className="pb-2 font-medium">检测时间</th>
                  <th className="pb-2 font-medium">影响(小时)</th>
                </tr>
              </thead>
              <tbody>
                {evidence.gate_anomalies.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-park-muted">暂无数据</td></tr>
                ) : (
                  evidence.gate_anomalies.map((anomaly) => (
                    <tr key={anomaly.id} className="border-b border-park-border/50 hover:bg-park-hover/50">
                      <td className="py-2 text-park-text">{anomaly.gate_name}</td>
                      <td className="py-2 text-red-400">{anomalyTypeLabels[anomaly.anomaly_type] || anomaly.anomaly_type}</td>
                      <td className="py-2 text-park-muted">{formatTime(anomaly.detected_at)}</td>
                      <td className="py-2 text-amber-400">{anomaly.impact_hours ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
