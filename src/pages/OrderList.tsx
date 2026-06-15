import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  Calendar,
  X,
  Check
} from 'lucide-react'
import { orderApi } from '../api'
import { useAppStore } from '../store'
import type { Order, CreateOrderRequest } from '../types'

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待接单', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  inspection_pending: { label: '待质检', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  warranty_pending: { label: '待保修确认', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  repairing: { label: '维修中', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-50' }
}

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待接单' },
  { value: 'inspection_pending', label: '待质检' },
  { value: 'warranty_pending', label: '待保修确认' },
  { value: 'repairing', label: '维修中' },
  { value: 'completed', label: '已完成' }
]

export default function OrderList() {
  const orders = useAppStore(state => state.orders)
  const setOrders = useAppStore(state => state.setOrders)
  const currentUser = useAppStore(state => state.currentUser)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState<CreateOrderRequest>({
    customer_name: '',
    phone: '',
    device_model: '',
    serial_number: '',
    issue_description: '',
    created_by: currentUser.name
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    orderApi.getAll(statusFilter, searchTerm).then(data => {
      setOrders(data)
      setLoading(false)
    })
  }, [statusFilter, searchTerm, setOrders])

  const handleCreateOrder = () => {
    orderApi.create({ ...formData, created_by: currentUser.name }).then(() => {
      setShowCreateModal(false)
      setFormData({
        customer_name: '',
        phone: '',
        device_model: '',
        serial_number: '',
        issue_description: '',
        created_by: currentUser.name
      })
      orderApi.getAll(statusFilter, searchTerm).then(data => setOrders(data))
    })
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.includes(searchTerm) ||
      order.phone.includes(searchTerm) ||
      order.device_model.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户姓名、电话、机型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        {currentUser.role === 'front' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建接机单
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工单编号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户信息</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备型号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">问题描述</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">暂无工单</td>
              </tr>
            ) : (
              filteredOrders.map((order: Order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/orders/${order.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{order.customer_name}</span>
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <Phone className="w-4 h-4" />
                        {order.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{order.device_model}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={order.issue_description}>
                    {order.issue_description}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].bgColor} ${statusConfig[order.status].color}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      {order.created_at.split(' ')[0]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        查看详情
                      </button>
                      {order.status === 'pending' && currentUser.role === 'technician' && (
                        <button
                          onClick={() => {
                            orderApi.updateStatus(order.id, 'inspection_pending').then(() => {
                              orderApi.getAll(statusFilter, searchTerm).then(data => setOrders(data))
                            })
                          }}
                          className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          接单
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">创建接机单</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备型号 *</label>
                <input
                  type="text"
                  value={formData.device_model}
                  onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">序列号</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">问题描述 *</label>
                <textarea
                  value={formData.issue_description}
                  onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateOrder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}