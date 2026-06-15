import { useState, useEffect } from 'react'
import { Package, Clock, AlertTriangle, Activity, ArrowUpRight, ArrowDownRight, RefreshCw, Eye } from 'lucide-react'
import axios from 'axios'

const statusLabels = {
 pending: '待量尺',
 measuring: '量尺中',
 measured: '量尺完成',
 confirmed: '已确认',
 fabric_ordered: '面料已下单',
 fabric_received: '面料已到货',
 cutting: '裁剪中',
 sewing: '缝纫中',
 ironing: '熨烫中',
 installing: '安装中',
 completed: '已完成',
 rejected: '已退回',
 needs_revision: '待修改'
}

const statusColors = {
 pending: 'bg-yellow-100 text-yellow-800',
 measuring: 'bg-blue-100 text-blue-800',
 measured: 'bg-purple-100 text-purple-800',
 confirmed: 'bg-green-100 text-green-800',
 fabric_ordered: 'bg-orange-100 text-orange-800',
 fabric_received: 'bg-teal-100 text-teal-800',
 cutting: 'bg-indigo-100 text-indigo-800',
 sewing: 'bg-pink-100 text-pink-800',
 ironing: 'bg-cyan-100 text-cyan-800',
 installing: 'bg-emerald-100 text-emerald-800',
 completed: 'bg-gray-100 text-gray-800',
 rejected: 'bg-red-100 text-red-800',
 needs_revision: 'bg-amber-100 text-amber-800'
}

function Dashboard({ onViewOrders }) {
 const [stats, setStats] = useState(null)
 const [recentChanges, setRecentChanges] = useState([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 fetchDashboardData()
 }, [])

 const fetchDashboardData = async () => {
 setLoading(true)
 try {
 const response = await axios.get('/api/dashboard')
 setStats(response.data)
 setRecentChanges(response.data.recentChanges)
 } catch (error) {
 console.error('Failed to fetch dashboard data:', error)
 }
 setLoading(false)
 }

 const formatTime = (dateString) => {
 const date = new Date(dateString)
 const now = new Date()
 const diff = now.getTime() - date.getTime()
 const minutes = Math.floor(diff / 60000)
 const hours = Math.floor(diff / 3600000)
 const days = Math.floor(diff / 86400000)

 if (minutes < 1) return '刚刚'
 if (minutes < 60) return `${minutes}分钟前`
 if (hours < 24) return `${hours}小时前`
 return `${days}天前`
 }

 const statCards = [
 { label: '待量尺', value: 'pending', icon: Clock, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
 { label: '量尺中', value: 'measuring', icon: Activity, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
 { label: '待复核', value: 'measured', icon: Eye, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
 { label: '面料待到', value: 'fabric_ordered', icon: Package, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
 { label: '加工中', value: 'processing', icon: Activity, color: 'bg-indigo-500', bgColor: 'bg-indigo-50' },
 { label: '待安装', value: 'installing', icon: Package, color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
 ]

 const pendingStats = [
 { label: '待处理合计', value: stats?.stats?.pending + stats?.stats?.measuring + stats?.stats?.measured || 0, color: 'bg-gradient-to-br from-yellow-500 to-orange-500', bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50' },
 { label: '问题订单', value: stats?.stats?.rejected + stats?.stats?.needs_revision || 0, color: 'bg-gradient-to-br from-red-500 to-amber-500', bgColor: 'bg-gradient-to-br from-red-50 to-amber-50' },
 ]

 if (loading) {
 return (
 <div className="p-6 flex items-center justify-center">
 <RefreshCw className="animate-spin h-8 w-8 text-cyan-600" />
 </div>
 )
 }

 return (
 <div className="p-6">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-800">仪表盘</h1>
 <p className="text-slate-500">实时监控订单状态与加工进度</p>
 </div>
 <button
 onClick={fetchDashboardData}
 className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
 >
 <RefreshCw size={16} />
 <span>刷新数据</span>
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
 {pendingStats.map((card) => (
 <div
 key={card.label}
 className={`${card.bgColor} rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow`}
 onClick={() => onViewOrders && onViewOrders({ status: 'pending' })}
 >
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm text-slate-500 mb-1">{card.label}</p>
 <p className="text-3xl font-bold text-slate-800">{card.value}</p>
 </div>
 <div className={`w-14 h-14 ${card.color} rounded-xl flex items-center justify-center`}>
 <AlertTriangle className="text-white" size={24} />
 </div>
 </div>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
 {statCards.map((card) => (
 <div
 key={card.value}
 className={`${card.bgColor} rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow group`}
 onClick={() => onViewOrders && onViewOrders({ status: card.value })}
 >
 <div className="flex items-center justify-between">
 <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
 <card.icon className="text-white" size={20} />
 </div>
 <ArrowUpRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 <p className="text-sm text-slate-500 mb-1">{card.label}</p>
 <p className="text-2xl font-bold text-slate-800">{stats?.stats[card.value] || 0}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-white rounded-xl shadow-sm p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-slate-800">风险预警</h2>
 <div className="flex items-center space-x-2 text-amber-600">
 <AlertTriangle size={18} />
 <span className="text-sm font-medium">{stats?.lowStock || 0} 项库存不足</span>
 </div>
 </div>
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
 <div className="flex items-center space-x-3">
 <div className="w-2 h-2 bg-red-500 rounded-full"></div>
 <span>棉麻窗帘库存不足 (8米)</span>
 </div>
 <span className="text-sm text-red-600">需补货</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
 <div className="flex items-center space-x-3">
 <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
 <span>北欧风棉麻库存不足 (5米)</span>
 </div>
 <span className="text-sm text-amber-600">需补货</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
 <div className="flex items-center space-x-3">
 <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
 <span>待到面料订单 ({stats?.pendingFabricOrders || 0}单)</span>
 </div>
 <button
 onClick={() => onViewOrders && onViewOrders({ status: 'fabric_ordered' })}
 className="text-sm text-orange-600 hover:text-orange-700 flex items-center space-x-1"
 >
 <span>查看订单</span>
 <ArrowUpRight size={14} />
 </button>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-slate-800">最近变更</h2>
 <button
 onClick={() => onViewOrders && onViewOrders({})}
 className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
 >
 <span>全部订单</span>
 <ArrowUpRight size={16} />
 </button>
 </div>
 <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
 {recentChanges.slice(0, 6).map((change) => (
 <div
 key={change.id}
 className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
 onClick={() => onViewOrders && onViewOrders({ status: change.status })}
 >
 <div className={`w-8 h-8 ${statusColors[change.status]} rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium`}>
 {change.action?.charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-slate-800 truncate">
 {change.handler} - {change.action}
 </p>
 <p className="text-xs text-slate-500 truncate">{change.note}</p>
 </div>
 <span className="text-xs text-slate-400 flex-shrink-0">
 {formatTime(change.created_at)}
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-slate-800">待处理订单</h2>
 <button
 onClick={() => onViewOrders && onViewOrders({ status: 'pending' })}
 className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
 >
 <span>查看全部</span>
 <ArrowDownRight size={16} />
 </button>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b border-slate-200">
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">订单号</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">客户</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">面料</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">当前处理人</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">状态</th>
 <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">金额</th>
 </tr>
 </thead>
 <tbody>
 {recentChanges
 .filter((c) => !['completed', 'rejected'].includes(c.status))
 .slice(0, 5)
 .map((change) => (
 <tr
 key={change.order_id}
 className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
 onClick={() => onViewOrders && onViewOrders({ status: change.status })}
 >
 <td className="py-3 px-4 text-sm text-slate-800">ORD{change.order_id}</td>
 <td className="py-3 px-4 text-sm text-slate-800">待加载...</td>
 <td className="py-3 px-4 text-sm text-slate-600">-</td>
 <td className="py-3 px-4 text-sm text-slate-600">{change.handler}</td>
 <td className="py-3 px-4">
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[change.status]}`}>
 {statusLabels[change.status]}
 </span>
 </td>
 <td className="py-3 px-4 text-sm text-slate-800">-</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )
}

export default Dashboard