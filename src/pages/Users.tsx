import { useEffect, useState, useCallback } from 'react'
import { Edit, Trash2, UserPlus } from 'lucide-react'
import { userService } from '@/services/userService'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import { usePagination } from '@/hooks/usePagination'
import { usePermissions } from '@/hooks/useAuth'
import { useForm } from 'react-hook-form'
import type { SafeUser, UserRole, CreateUserRequest, UpdateUserRequest } from '@/types/types'
import { UserRoleLabels } from '@/types/types'
import { formatDateTime } from '@/utils/formatDate'
import { cn, getRoleColor } from '@/utils/helpers'

interface UserForm {
  username: string
  password: string
  name: string
  role: UserRole
  email: string
  phone: string
  status: 'active' | 'inactive'
}

const roleOptions = [
  { label: '会计', value: 'accountant' },
  { label: '客户经理', value: 'manager' },
  { label: '主管', value: 'supervisor' },
  { label: '系统管理员', value: 'admin' },
]

export default function Users() {
  const { canManageUsers } = usePermissions()
  const { page, pageSize, total, totalPages, setTotal, setPage, setPageSize, paginationParams } = usePagination()
  
  const [users, setUsers] = useState<SafeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>()

  const fetchUsers = useCallback(async () => {
    if (!canManageUsers) return
    setLoading(true)
    try {
      const response = await userService.getUsers(paginationParams)
      if (response.success && response.data) {
        setUsers(response.data.items)
        setTotal(response.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [paginationParams, canManageUsers, setTotal])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleOpenCreate = () => {
    reset({
      username: '',
      password: '',
      name: '',
      role: 'accountant',
      email: '',
      phone: '',
      status: 'active',
    })
    setShowCreateModal(true)
  }

  const handleOpenEdit = (user: SafeUser) => {
    setSelectedUser(user)
    reset({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      email: user.email || '',
      phone: user.phone || '',
      status: user.status,
    })
    setShowEditModal(true)
  }

  const handleDelete = async (user: SafeUser) => {
    if (!confirm(`确定要删除用户 ${user.name} 吗？`)) return
    try {
      const response = await userService.deleteUser(user.id)
      if (response.success) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const onSubmitCreate = async (data: UserForm) => {
    setSubmitting(true)
    try {
      const request: CreateUserRequest = {
        username: data.username,
        password: data.password,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        status: data.status,
      }
      const response = await userService.createUser(request)
      if (response.success) {
        setShowCreateModal(false)
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to create user:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitEdit = async (data: UserForm) => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const request: UpdateUserRequest = {
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        status: data.status,
        password: data.password || undefined,
      }
      const response = await userService.updateUser(selectedUser.id, request)
      if (response.success) {
        setShowEditModal(false)
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!canManageUsers) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">您没有权限访问此页面</p>
      </div>
    )
  }

  const columns = [
    {
      key: 'name',
      header: '姓名',
      render: (user: SafeUser) => (
        <span className="font-medium text-gray-900">{user.name}</span>
      ),
    },
    {
      key: 'username',
      header: '用户名',
      render: (user: SafeUser) => user.username,
    },
    {
      key: 'role',
      header: '角色',
      render: (user: SafeUser) => (
        <span className={cn('px-2 py-1 text-xs rounded-full border', getRoleColor(user.role))}>
          {UserRoleLabels[user.role]}
        </span>
      ),
    },
    {
      key: 'email',
      header: '邮箱',
      render: (user: SafeUser) => user.email || '-',
    },
    {
      key: 'phone',
      header: '电话',
      render: (user: SafeUser) => user.phone || '-',
    },
    {
      key: 'status',
      header: '状态',
      render: (user: SafeUser) => (
        <StatusBadge
          status={user.status}
          label={user.status === 'active' ? '活跃' : '停用'}
          size="sm"
        />
      ),
    },
    {
      key: 'createdAt',
      header: '创建时间',
      sortable: true,
      render: (user: SafeUser) => formatDateTime(user.createdAt),
    },
    {
      key: 'actions',
      header: '操作',
      render: (user: SafeUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleOpenEdit(user)
            }}
            className="p-1 rounded hover:bg-gray-100 text-gray-600"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(user)
            }}
            className="p-1 rounded hover:bg-red-100 text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={20} />
          新增用户
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        rowKey={(user) => user.id}
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新增用户"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('username', { required: '请输入用户名' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.username ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                {...register('password', { required: '请输入密码', minLength: { value: 6, message: '密码至少6位' } })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.password ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: '请输入姓名' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.name ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                角色 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role', { required: '请选择角色' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.role ? 'border-red-500' : 'border-gray-300'
                )}
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                电话
              </label>
              <input
                type="text"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">活跃</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'px-4 py-2 bg-blue-600 text-white rounded-lg',
                submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              )}
            >
              {submitting ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="编辑用户"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <input
                type="text"
                {...register('username')}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                新密码（留空则不修改）
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: '请输入姓名' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.name ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                角色 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role', { required: '请选择角色' })}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.role ? 'border-red-500' : 'border-gray-300'
                )}
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                电话
              </label>
              <input
                type="text"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">活跃</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'px-4 py-2 bg-blue-600 text-white rounded-lg',
                submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              )}
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}