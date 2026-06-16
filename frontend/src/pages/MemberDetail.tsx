import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Ticket, Star } from 'lucide-react'
import { memberApi } from '@/services/api'
import type { Member, Coupon } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const [member, setMember] = useState<Member | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadMember()
    }
  }, [id])

  const loadMember = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [memberRes, couponsRes] = await Promise.all([
        memberApi.get(parseInt(id)),
        memberApi.getCoupons(parseInt(id)),
      ])

      if (memberRes.success) setMember(memberRes.data)
      if (couponsRes.success) setCoupons(couponsRes.data)
    } catch (error) {
      console.error('Failed to load member:', error)
    } finally {
      setLoading(false)
    }
  }

  const tierLabels: Record<string, string> = {
    normal: '普通',
    silver: '银卡',
    gold: '金卡',
    platinum: '铂金',
  }

  const tierStyles: Record<string, string> = {
    normal: 'bg-gray-100 text-gray-600',
    silver: 'bg-gray-200 text-gray-700',
    gold: 'bg-yellow-100 text-yellow-700',
    platinum: 'bg-purple-100 text-purple-700',
  }

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending_review: '待复核',
    issued: '已发放',
    verified: '已核销',
    archived: '已归档',
    rejected: '已拒绝',
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-8">
        <p className="text-gray-500">未找到该会员信息</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/members"
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} className="mr-2" />
          返回列表
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">
                  {member.name.charAt(0)}
                </span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-800">
              {member.name}
            </h1>
            <p className="text-center text-gray-500 mt-1">{member.phone}</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">会员等级</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${tierStyles[member.tier]}`}
                >
                  {tierLabels[member.tier]}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">积分</span>
                <div className="flex items-center">
                  <Star size={16} className="text-yellow-500 mr-1" />
                  <span className="font-semibold text-gray-800">
                    {member.points}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-500">注册时间</span>
                <span className="text-gray-800">
                  {format(new Date(member.created_at), 'yyyy-MM-dd', {
                    locale: zhCN,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="card mt-6">
            <h3 className="font-semibold text-gray-800 mb-4">宝宝信息</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">宝宝姓名</p>
                <p className="font-medium text-gray-800">
                  {member.baby_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">宝宝生日</p>
                <p className="font-medium text-gray-800">
                  {member.baby_birthday || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Ticket size={24} className="mr-2 text-primary" />
                券使用历史
              </h2>
            </div>

            {coupons.length === 0 ? (
              <div className="text-center py-12">
                <Ticket size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">暂无券记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <Link
                    key={coupon.id}
                    to={`/coupons/${coupon.id}`}
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-semibold text-gray-800">
                        {coupon.coupon_code}
                      </span>
                      <span
                        className={`status-badge ${
                          coupon.status === 'verified'
                            ? 'status-verified'
                            : coupon.status === 'pending_review'
                            ? 'status-pending'
                            : 'status-draft'
                        }`}
                      >
                        {statusLabels[coupon.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{coupon.policy?.name}</span>
                      <span>
                        {coupon.issue_date || coupon.created_at.split(' ')[0]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
