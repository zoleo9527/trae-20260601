import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users as UsersIcon } from 'lucide-react'
import { memberApi } from '@/services/api'
import type { Member } from '@/types'

export default function MemberList() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const response = await memberApi.list({ limit: 100 })
      if (response.success) {
        setMembers(response.data.items)
      }
    } catch (error) {
      console.error('Failed to load members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await memberApi.list({
        search: search || undefined,
        limit: 100,
      })
      if (response.success) {
        setMembers(response.data.items)
      }
    } catch (error) {
      console.error('Failed to search members:', error)
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

  const filteredMembers = members.filter((member) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      member.name.toLowerCase().includes(searchLower) ||
      member.phone.includes(search) ||
      (member.baby_name && member.baby_name.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">会员档案</h1>
          <p className="text-gray-500 mt-1">查看和管理会员信息</p>
        </div>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名、手机号、宝宝姓名..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button type="submit" className="btn btn-primary ml-4">
            搜索
          </button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无会员数据</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  姓名
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  手机号
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  宝宝信息
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  等级
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  积分
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="table-row border-b border-gray-100"
                >
                  <td className="py-3 px-4">
                    <Link
                      to={`/members/${member.id}`}
                      className="font-medium text-gray-800 hover:text-primary"
                    >
                      {member.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{member.phone}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-gray-800">
                        {member.baby_name || '-'}
                      </p>
                      {member.baby_birthday && (
                        <p className="text-xs text-gray-400">
                          生日：{member.baby_birthday}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${tierStyles[member.tier]}`}
                    >
                      {tierLabels[member.tier]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-gray-800">
                      {member.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
