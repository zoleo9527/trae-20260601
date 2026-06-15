import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Camera,
    CheckCircle,
    Clock,
    FileCheck,
    MessageSquare,
    Package,
    Phone,
    Plus,
    User,
    Wrench
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { noteApi, orderApi, sparePartApi } from '../api'
import { useAppStore } from '../store'
import type { CreateNoteRequest, Order, SparePart } from '../types'

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待接单', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  inspection_pending: { label: '待质检', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  warranty_pending: { label: '待保修确认', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  repairing: { label: '维修中', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-50' }
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteContent, setNoteContent] = useState('')
  const [activeTab, setActiveTab] = useState('info')
  const [showSparePartModal, setShowSparePartModal] = useState(false)
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [selectedSparePart, setSelectedSparePart] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const currentUser = useAppStore(state => state.currentUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      orderApi.getById(id).then(data => {
        setOrder(data)
        setLoading(false)
      })
    }
  }, [id])

  useEffect(() => {
    sparePartApi.getAll().then(data => setSpareParts(data))
  }, [])

  const handleAddNote = () => {
    if (!noteContent.trim() || !id) return
    const noteData: CreateNoteRequest = {
      user_id: currentUser.id,
      content: noteContent
    }
    noteApi.create(id, noteData).then(() => {
      setNoteContent('')
      orderApi.getById(id).then(data => setOrder(data))
    })
  }

  const handleComplete = () => {
    if (!id) return
    
    if (currentUser.role !== 'technician') {
      setError('只有维修师才能完成维修')
      return
    }
    
    if (order.status !== 'repairing') {
      setError('只有维修中的工单才能完成')
      return
    }
    
    setError('')
    orderApi.updateStatus(id, 'completed').then(() => {
      orderApi.getById(id).then(data => setOrder(data))
    }).catch((err: any) => {
      setError(err.response?.data?.error || '操作失败')
    })
  }

  const handleUseSparePart = () => {
    if (!selectedSparePart || quantity <= 0 || !id) return
    
    if (currentUser.role !== 'technician') {
      setError('只有维修师才能领用备件')
      return
    }
    
    if (order.status !== 'repairing') {
      setError('只有在维修中的工单才能领用备件')
      return
    }
    
    setError('')
    sparePartApi.use(id, {
      spare_part_id: selectedSparePart,
      quantity,
      used_by: currentUser.id
    }).then(() => {
      setShowSparePartModal(false)
      setSelectedSparePart('')
      setQuantity(1)
      orderApi.getById(id).then(data => setOrder(data))
      sparePartApi.getAll().then(data => setSpareParts(data))
    }).catch((err: any) => {
      setError(err.response?.data?.error || '领用失败')
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  if (!order) {
    return <div className="flex items-center justify-center h-64">工单不存在</div>
  }

  const tabs = [
    { id: 'info', label: '工单信息', icon: FileCheck },
    { id: 'inspection', label: '取机质检', icon: Camera },
    { id: 'warranty', label: '售后保修', icon: CheckCircle },
    { id: 'usages', label: '备件领用', icon: Package },
    { id: 'notes', label: '历史备注', icon: MessageSquare }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回列表
        </button>
        <div className="flex-1" />
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status].bgColor} ${statusConfig[order.status].color}`}>
          {statusConfig[order.status].label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex border-b border-gray-100">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">工单编号</p>
                      <p className="font-semibold text-gray-800">{order.id}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">客户姓名</p>
                      <p className="font-semibold text-gray-800">{order.customer_name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">联系电话</p>
                      <p className="font-semibold text-gray-800 flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {order.phone}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">设备型号</p>
                      <p className="font-semibold text-gray-800">{order.device_model}</p>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">问题描述</h4>
                    <p className="text-gray-600">{order.issue_description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">序列号</p>
                      <p className="text-gray-700">{order.serial_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">创建人</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        {order.created_by}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">创建时间</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {order.created_at}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">更新时间</p>
                      <p className="text-gray-700 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {order.updated_at}
                      </p>
                    </div>
                  </div>

                  {order.status === 'repairing' && currentUser.role === 'technician' && (
                    <div className="pt-4">
                      <button
                        onClick={handleComplete}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        完成维修
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'inspection' && (
                <div className="space-y-6">
                  {order.inspection ? (
                    <>
                      <div className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-800">质检报告</h4>
                          <span className="text-green-600 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            已提交
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-500 text-sm mb-1">质检人</p>
                            <p className="text-gray-700 flex items-center gap-1">
                              <User className="w-4 h-4 text-gray-400" />
                              {order.inspection.technician_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">质检时间</p>
                            <p className="text-gray-700 flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {order.inspection.created_at}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">外观状态</p>
                            <p className="text-gray-700">{order.inspection.appearance_condition}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">屏幕状态</p>
                            <p className="text-gray-700">{order.inspection.screen_condition}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">电池状态</p>
                            <p className="text-gray-700">{order.inspection.battery_condition}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm mb-1">配件情况</p>
                            <p className="text-gray-700">{order.inspection.accessories || '-'}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-gray-500 text-sm mb-1">检测说明</p>
                          <p className="text-gray-700">{order.inspection.description}</p>
                        </div>
                      </div>

                      <div className="border border-gray-100 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-4">质检照片</h4>
                        {order.photos && order.photos.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {order.photos.map(photo => (
                              <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                                <img 
                                  src={`http://localhost:3001${photo.file_path}`} 
                                  alt={photo.description}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                                  {photo.description || '照片'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-center py-8">暂无质检照片</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">暂未提交质检报告</p>
                      {currentUser.role === 'technician' && (
                        <Link 
                          to={`/orders/${order.id}/inspection`}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Wrench className="w-5 h-5" />
                          提交质检报告
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'warranty' && (
                <div className="space-y-6">
                  {order.warranty ? (
                    <div className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">售后保修信息</h4>
                        <span className={`${order.warranty.approved ? 'text-green-600' : 'text-yellow-600'} flex items-center gap-1`}>
                          {order.warranty.approved ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          {order.warranty.approved ? '已确认' : '待确认'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-sm mb-1">确认人</p>
                          <p className="text-gray-700 flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-400" />
                            {order.warranty.manager_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">保修类型</p>
                          <p className="text-gray-700">{order.warranty.warranty_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">保修期限</p>
                          <p className="text-gray-700">{order.warranty.warranty_period} 天</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">责任划分</p>
                          <p className="text-gray-700">{order.warranty.responsibility}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm mb-1">确认时间</p>
                          <p className="text-gray-700 flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {order.warranty.approved_at || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">暂未确认售后保修</p>
                      {currentUser.role === 'manager' && (
                        <Link 
                          to={`/orders/${order.id}/warranty`}
                          className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                          确认售后保修
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'usages' && (
                <div className="space-y-6">
                  {order.usages && order.usages.length > 0 ? (
                    <div className="space-y-4">
                      {order.usages.map(usage => (
                        <div key={usage.id} className="border border-gray-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">{usage.spare_part_name}</span>
                            <span className="text-gray-400 text-sm">x{usage.quantity}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">SKU</p>
                              <p className="text-gray-700">{usage.spare_part_sku}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">领用人</p>
                              <p className="text-gray-700">{usage.used_by_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">领用时间</p>
                              <p className="text-gray-700">{usage.used_at}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400">暂无备件领用记录</p>
                    </div>
                  )}

                  {order.status === 'repairing' && currentUser.role === 'technician' && (
                    <div className="pt-4">
                      <button
                        onClick={() => setShowSparePartModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Plus className="w-5 h-5" />
                        领用备件
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {order.notes && order.notes.length > 0 ? (
                    <div className="space-y-4">
                      {order.notes.map(note => (
                        <div key={note.id} className={`border rounded-lg p-4 ${
                          note.content.includes('【系统自动】') ? 'border-blue-100 bg-blue-50' : 'border-gray-100'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">{note.user_name}</span>
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {note.created_at}
                            </span>
                          </div>
                          <p className={`text-gray-600 ${
                            note.content.includes('【系统自动】') ? 'text-blue-700' : ''
                          }`}>
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400">暂无备注</p>
                    </div>
                  )}

                  <div className="border border-gray-100 rounded-lg p-4">
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="添加备注..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!noteContent.trim()}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      添加备注
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-medium text-gray-800 mb-4">操作流程</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${order.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <span className="text-sm font-bold">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">创建接机单</p>
                  <p className="text-sm text-gray-500">前台接待客户并录入工单</p>
                </div>
                {order.status !== 'pending' && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>

              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${order.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <span className="text-sm font-bold">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">维修师接单</p>
                  <p className="text-sm text-gray-500">维修师接收任务</p>
                </div>
                {['inspection_pending', 'warranty_pending', 'repairing', 'completed'].includes(order.status) && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>

              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${['warranty_pending', 'repairing', 'completed'].includes(order.status) ? 'bg-green-500 text-white' : order.status === 'inspection_pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <span className="text-sm font-bold">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">取机质检</p>
                  <p className="text-sm text-gray-500">维修师拍照检测并提交报告</p>
                </div>
                {['warranty_pending', 'repairing', 'completed'].includes(order.status) && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>

              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${['repairing', 'completed'].includes(order.status) ? 'bg-green-500 text-white' : order.status === 'warranty_pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <span className="text-sm font-bold">4</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">售后保修确认</p>
                  <p className="text-sm text-gray-500">店长确认保修责任</p>
                </div>
                {['repairing', 'completed'].includes(order.status) && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>

              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${order.status === 'completed' ? 'bg-green-500 text-white' : order.status === 'repairing' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <span className="text-sm font-bold">5</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">维修完成</p>
                  <p className="text-sm text-gray-500">通知客户取机</p>
                </div>
                {order.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-sm p-6 text-white">
            <h4 className="font-medium mb-2">快捷操作</h4>
            <p className="text-blue-100 text-sm mb-4">根据当前角色执行对应操作</p>
            <div className="space-y-2">
              {order.status === 'pending' && currentUser.role === 'technician' && (
                <button
                  onClick={() => {
                    orderApi.updateStatus(order.id, 'inspection_pending').then(() => {
                      orderApi.getById(order.id).then(data => setOrder(data))
                    })
                  }}
                  className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition-colors text-left px-3"
                >
                  接单开始质检
                </button>
              )}
              {order.status === 'inspection_pending' && currentUser.role === 'technician' && (
                <Link 
                  to={`/orders/${order.id}/inspection`}
                  className="block w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition-colors text-left px-3"
                >
                  提交质检报告
                </Link>
              )}
              {order.status === 'warranty_pending' && currentUser.role === 'manager' && (
                <Link 
                  to={`/orders/${order.id}/warranty`}
                  className="block w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition-colors text-left px-3"
                >
                  确认售后保修
                </Link>
              )}
              {order.status === 'repairing' && currentUser.role === 'technician' && (
                <button
                  onClick={handleComplete}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors text-left px-3"
                >
                  完成维修
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSparePartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">领用备件</h3>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择备件</label>
                <select
                  value={selectedSparePart}
                  onChange={(e) => setSelectedSparePart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择备件</option>
                  {spareParts.map(part => (
                    <option key={part.id} value={part.id}>{part.name} (库存: {part.quantity})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">领用数量</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowSparePartModal(false)
                    setSelectedSparePart('')
                    setQuantity(1)
                    setError('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUseSparePart}
                  disabled={!selectedSparePart || quantity <= 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Package className="w-4 h-4" />
                  确认领用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}