import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, User, Clock, Tag } from 'lucide-react'
import useStore from '@/store'

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  found: { label: '已发现', color: '#ca8a04', bg: '#fefce8' },
  stored: { label: '已存放', color: '#2563eb', bg: '#eff6ff' },
  claimed: { label: '已认领', color: '#16a34a', bg: '#f0fdf4' },
  disposed: { label: '已归还', color: '#6b7280', bg: '#f3f4f6' },
}

const CATEGORY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  jewelry: { label: '珠宝首饰', color: '#dc2626', bg: '#fef2f2' },
  electronics: { label: '电子产品', color: '#2563eb', bg: '#eff6ff' },
  valuable: { label: '贵重物品', color: '#d4940a', bg: '#fffbeb' },
  documents: { label: '证件文件', color: '#7c3aed', bg: '#f5f3ff' },
  clothing: { label: '衣物', color: '#0d9488', bg: '#f0fdfa' },
  other: { label: '其他', color: '#6b7280', bg: '#f3f4f6' },
}

export default function LeftoverDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { leftovers, fetchLeftovers, updateLeftover } = useStore()
  const [claimName, setClaimName] = useState('')
  const [showClaim, setShowClaim] = useState(false)

  useEffect(() => {
    if (leftovers.length === 0) fetchLeftovers()
  }, [leftovers.length, fetchLeftovers])

  const item = leftovers.find((l) => l.id === Number(id))
  if (!item) return <div className="text-center py-12 text-gray-400">加载中...</div>

  const sc = STATUS_CFG[item.status] || STATUS_CFG.found
  const cc = CATEGORY_CFG[(item as any).category] || CATEGORY_CFG.other

  const handleAction = async (status: string, extra?: Record<string, unknown>) => {
    await updateLeftover(item.id, { status, ...extra })
    setShowClaim(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/leftovers')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="text-[#1e3a5f]" />
        </button>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">遗留物详情</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl font-bold text-[#1e3a5f]">{item.item_name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cc.color, backgroundColor: cc.bg }}>{cc.label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600"><Tag size={16} /><span>类别: {cc.label}</span></div>
          <div className="flex items-center gap-2 text-gray-600"><MapPin size={16} /><span>房间: {item.room_number}</span></div>
          <div className="flex items-center gap-2 text-gray-600"><User size={16} /><span>发现人: {item.reporter_name}</span></div>
          <div className="flex items-center gap-2 text-gray-600"><Clock size={16} /><span>发现时间: {new Date(item.created_at).toLocaleString('zh-CN')}</span></div>
          {item.location && <div className="flex items-center gap-2 text-gray-600"><MapPin size={16} /><span>存放位置: {item.location}</span></div>}
          {item.description && <p className="text-gray-700 mt-2 p-3 bg-gray-50 rounded-lg">{item.description}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
        <h3 className="font-semibold text-[#1e3a5f]">时间线</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600"><Clock size={14} /><span>发现: {new Date(item.created_at).toLocaleString('zh-CN')}</span></div>
          {item.claimed_at && <div className="flex items-center gap-2 text-green-600"><Clock size={14} /><span>认领: {new Date(item.claimed_at).toLocaleString('zh-CN')}</span></div>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
        {item.status === 'found' && (
          <button onClick={() => handleAction('stored')} className="px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium">已存放</button>
        )}
        {item.status === 'stored' && (
          showClaim ? (
            <div className="space-y-3">
              <input value={claimName} onChange={(e) => setClaimName(e.target.value)} placeholder="认领人姓名" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              <div className="flex gap-2">
                <button onClick={() => handleAction('claimed', { claimed_by_name: claimName })} disabled={!claimName} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium disabled:opacity-50">确认认领</button>
                <button onClick={() => setShowClaim(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowClaim(true)} className="px-4 py-2 bg-[#16a34a] text-white rounded-lg text-sm font-medium">认领登记</button>
          )
        )}
        {item.status === 'claimed' && (
          <button onClick={() => handleAction('disposed')} className="px-4 py-2 bg-[#6b7280] text-white rounded-lg text-sm font-medium">已归还</button>
        )}
      </div>
    </div>
  )
}
