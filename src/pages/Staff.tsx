import { useEffect } from 'react'
import { Users } from 'lucide-react'
import useStore from '@/store'

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  supervisor: { label: '主管', color: '#4f46e5', bg: '#eef2ff' },
  floor_leader: { label: '楼层组长', color: '#d97706', bg: '#fffbeb' },
  attendant: { label: '客房服务员', color: '#16a34a', bg: '#f0fdf4' },
  linen_staff: { label: '布草员', color: '#0d9488', bg: '#f0fdfa' },
  engineer: { label: '维修工程师', color: '#7c3aed', bg: '#f5f3ff' },
}

export default function Staff() {
  const { users, fetchUsers } = useStore()

  useEffect(() => {
    if (users.length === 0) fetchUsers()
  }, [users.length, fetchUsers])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users size={24} className="text-[#1e3a5f]" />
        <h1 className="text-2xl font-bold text-[#1e3a5f]">人员管理</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 font-medium text-gray-500">姓名</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">角色</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">楼层</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const rc = ROLE_CFG[u.role] || { label: u.role, color: '#6b7280', bg: '#f3f4f6' }
              return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-[#1e3a5f]">{u.name || u.username}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: rc.color, backgroundColor: rc.bg }}>
                      {rc.label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{(u as any).floor ? `${(u as any).floor}楼` : '-'}</td>
                  <td className="px-6 py-3 text-gray-400">{(u as any).created_at ? new Date((u as any).created_at).toLocaleDateString('zh-CN') : '-'}</td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400">暂无人员数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
