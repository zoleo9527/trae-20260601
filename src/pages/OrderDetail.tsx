import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    Camera,
    CheckCircle,
    Clock,
    FileCheck,
    MessageSquare,
    Phone,
    User,
    Wrench
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { noteApi, orderApi } from '../api'
import { useAppStore } from '../store'
import type { CreateNoteRequest, Order } from '../types'

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

  const handleAddNote = () => {
    if (!noteContent.trim() || !id) return
    const noteData: CreateNoteRequest = {
      user_id: currentUser.id,
      user_name: currentUser.name,
      content: noteContent
    }
    noteApi.create(id, noteData).then(() => {
      setNoteContent('')
      orderApi.getById(id).then(data => setOrder(data))
    })
  }

  const handleComplete = () => {
    if (!id) return
    orderApi.updateStatus(id, 'completed').then(() => {
      orderApi.getById(id).then(data => setOrder(data))
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
                              <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                                <img 
                                  src="https://neeko-copilot.bytedance.net/api/text_to_image?prompt=smartphone%20repair%20inspection%20photo%20showing%20device%20condition&image_size=square" 
                                  alt={photo.description}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                                  {photo.description}
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

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {order.notes && order.notes.length > 0 ? (
                    <div className="space-y-4">
                      {order.notes.map(note => (
                        <div key={note.id} className="border border-gray-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">{note.user_name}</span>
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {note.created_at}
                            </span>
                          </div>
                          <p className="text-gray-600">{note.content}</p>
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
    </div>
  )
}