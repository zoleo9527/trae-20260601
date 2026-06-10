import { checkinOrder } from '@/api/client'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface CheckInPanelProps {
  orderId: string
  onCheckin: () => void
}

export default function CheckInPanel({ orderId, onCheckin }: CheckInPanelProps) {
  const [checkedIn, setCheckedIn] = useState(false)
  const [anomaly, setAnomaly] = useState(false)
  const [anomalyDesc, setAnomalyDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkinTime, setCheckinTime] = useState<string | null>(null)

  const handleCheckin = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await checkinOrder(orderId, anomaly, anomaly ? anomalyDesc : undefined)
      setCheckinTime(result.checkinTime)
      setCheckedIn(true)
      onCheckin()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '签到失败')
    } finally {
      setLoading(false)
    }
  }

  if (checkedIn && checkinTime) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold text-gray-800">已签到</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">签到时间：</span>
            <span className="text-gray-800">{checkinTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">异常状态：</span>
            {anomaly ? (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-4 w-4" /> 存在异常
              </span>
            ) : (
              <span className="text-emerald-600">正常</span>
            )}
          </div>
          {anomaly && anomalyDesc && (
            <div className="flex items-start gap-2">
              <span className="text-gray-500">异常描述：</span>
              <span className="text-gray-800">{anomalyDesc}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-4">到场签到</h3>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-700">是否异常</span>
        <button
          type="button"
          role="switch"
          aria-checked={anomaly}
          onClick={() => setAnomaly(!anomaly)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            anomaly ? 'bg-red-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              anomaly ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {anomaly && (
        <textarea
          value={anomalyDesc}
          onChange={(e) => setAnomalyDesc(e.target.value)}
          placeholder="请描述异常情况…"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none mb-4"
        />
      )}

      {error && (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      )}

      <button
        onClick={handleCheckin}
        disabled={loading || (anomaly && !anomalyDesc.trim())}
        className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '签到中…' : '到场签到'}
      </button>
    </div>
  )
}
