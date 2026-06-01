import React, { useState, useMemo, useEffect } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../store/useAppStore'
import { OrderCard } from '../components/OrderCard'
import { OrderDetail } from '../components/OrderDetail'
import {
  ORDER_STATUS_LABELS, OrderStatus, QuoteCalculationInput, Urgency, Customer,
  WORKSPACE_VIEWS
} from '../types'

const statusFilters: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_quote', label: '待报价' },
  { key: 'quoted', label: '已报价' },
  { key: 'customer_approved', label: '客户确认' },
  { key: 'proof_uploaded', label: '待确认打样' },
  { key: 'proof_rejected', label: '打样退回' },
  { key: 'proof_approved', label: '打样确认' },
  { key: 'scheduled', label: '已排产' },
  { key: 'in_production', label: '生产中' },
  { key: 'completed', label: '已完成' },
]

export const SalesView: React.FC = () => {
  const {
    orders, customers, workspace, selectedOrder, setSelectedOrder,
    createOrder, createCustomer, calculateQuote, loadOrders,
    currentUser, updateOrder, saveWorkspace
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'quote' | 'customers'>('list')

  useEffect(() => {
    const view = workspace?.current_view
    if (view === WORKSPACE_VIEWS.SALES_NEW_ORDER) setActiveTab('new')
    else if (view === WORKSPACE_VIEWS.SALES_QUOTE) setActiveTab('quote')
    else if (view === WORKSPACE_VIEWS.SALES_CUSTOMERS) setActiveTab('customers')
    else setActiveTab('list')
  }, [workspace?.current_view])
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)

  const [newOrder, setNewOrder] = useState({
    customer_id: 0,
    product_name: '',
    quantity: 1000,
    size: '210x285',
    paper_type: '铜版纸',
    paper_gsm: 157,
    color: '四色',
    finish: '过光胶',
    urgency: 'normal' as Urgency,
    deadline: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    notes: ''
  })

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: ''
  })

  const filteredOrders = useMemo(() => {
    return orders.filter(o => statusFilter === 'all' || o.status === statusFilter)
  }, [orders, statusFilter])

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending_quote: orders.filter(o => o.status === 'pending_quote').length,
      pending_proof: orders.filter(o => o.status === 'proof_uploaded').length,
      in_production: orders.filter(o => o.status === 'in_production').length,
      urgent: orders.filter(o => o.urgency !== 'normal').length,
      total_value: orders.reduce((sum, o) => sum + (o.quote_amount || 0), 0)
    }
  }, [orders])

  const handleCreateOrder = async () => {
    if (!currentUser || newOrder.customer_id === 0) {
      alert('请选择客户')
      return
    }
    const customer = customers.find(c => c.id === newOrder.customer_id)
    if (!customer) return

    const success = await createOrder({
      ...newOrder,
      customer_name: customer.name,
      created_by: currentUser.id,
      status: 'pending_quote'
    })
    if (success) {
      setShowNewOrder(false)
      setNewOrder({
        customer_id: 0,
        product_name: '',
        quantity: 1000,
        size: '210x285',
        paper_type: '铜版纸',
        paper_gsm: 157,
        color: '四色',
        finish: '过光胶',
        urgency: 'normal',
        deadline: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        notes: ''
      })
    }
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert('请输入客户名称')
      return
    }
    const success = await createCustomer(newCustomer)
    if (success) {
      setShowNewCustomer(false)
      setNewCustomer({ name: '', contact: '', phone: '', email: '', address: '' })
    }
  }

  const handleCalcQuote = () => {
    const input: QuoteCalculationInput = {
      quantity: newOrder.quantity,
      paper_type: newOrder.paper_type,
      paper_gsm: newOrder.paper_gsm,
      size: newOrder.size,
      color: newOrder.color,
      finish: newOrder.finish,
      urgency: newOrder.urgency
    }
    calculateQuote(input)
    setActiveTab('list')
    saveWorkspace({ current_view: WORKSPACE_VIEWS.SALES_DASHBOARD })
  }

  const handleQuickQuote = async (order: typeof orders[0]) => {
    const input: QuoteCalculationInput = {
      quantity: order.quantity,
      paper_type: order.paper_type,
      paper_gsm: order.paper_gsm,
      size: order.size,
      color: order.color,
      finish: order.finish,
      urgency: order.urgency
    }
    await calculateQuote(input)
    setSelectedOrder(order)
  }

  if (activeTab === 'new' || showNewOrder) {
    return (
      <div className="h-full flex flex-col p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-factory-text">➕ 新建订单</h2>
          <button onClick={() => { setShowNewOrder(false); setActiveTab('list'); saveWorkspace({ current_view: WORKSPACE_VIEWS.SALES_DASHBOARD }) }} className="factory-btn text-xs">
            返回列表
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="space-y-4">
            <div className="factory-card">
              <label className="factory-label">客户</label>
              <div className="flex gap-2">
                <select
                  value={newOrder.customer_id}
                  onChange={e => setNewOrder({ ...newOrder, customer_id: parseInt(e.target.value) })}
                  className="factory-input flex-1"
                >
                  <option value={0}>-- 选择客户 --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.contact}</option>
                  ))}
                </select>
                <button onClick={() => setShowNewCustomer(true)} className="factory-btn text-xs">
                  + 新客户
                </button>
              </div>
            </div>

            <div className="factory-card">
              <label className="factory-label">产品名称</label>
              <input
                type="text"
                value={newOrder.product_name}
                onChange={e => setNewOrder({ ...newOrder, product_name: e.target.value })}
                placeholder="如：宣传单、包装盒、画册等"
                className="factory-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="factory-card">
                <label className="factory-label">数量</label>
                <input
                  type="number"
                  value={newOrder.quantity}
                  onChange={e => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) || 0 })}
                  className="factory-input"
                />
              </div>
              <div className="factory-card">
                <label className="factory-label">尺寸 (mm)</label>
                <input
                  type="text"
                  value={newOrder.size}
                  onChange={e => setNewOrder({ ...newOrder, size: e.target.value })}
                  placeholder="210x285"
                  className="factory-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="factory-card">
                <label className="factory-label">纸张类型</label>
                <select
                  value={newOrder.paper_type}
                  onChange={e => setNewOrder({ ...newOrder, paper_type: e.target.value })}
                  className="factory-input"
                >
                  <option value="铜版纸">铜版纸</option>
                  <option value="哑粉纸">哑粉纸</option>
                  <option value="双胶纸">双胶纸</option>
                  <option value="白卡纸">白卡纸</option>
                  <option value="牛皮纸">牛皮纸</option>
                  <option value="特种纸">特种纸</option>
                  <option value="灰板纸">灰板纸</option>
                </select>
              </div>
              <div className="factory-card">
                <label className="factory-label">克重 (g)</label>
                <input
                  type="number"
                  value={newOrder.paper_gsm}
                  onChange={e => setNewOrder({ ...newOrder, paper_gsm: parseInt(e.target.value) || 0 })}
                  className="factory-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="factory-card">
                <label className="factory-label">颜色</label>
                <select
                  value={newOrder.color}
                  onChange={e => setNewOrder({ ...newOrder, color: e.target.value })}
                  className="factory-input"
                >
                  <option value="单色">单色</option>
                  <option value="双色">双色</option>
                  <option value="四色">四色</option>
                  <option value="五色+UV">五色+UV</option>
                </select>
              </div>
              <div className="factory-card">
                <label className="factory-label">后加工</label>
                <select
                  value={newOrder.finish}
                  onChange={e => setNewOrder({ ...newOrder, finish: e.target.value })}
                  className="factory-input"
                >
                  <option value="">无</option>
                  <option value="过光胶">过光胶</option>
                  <option value="过哑胶">过哑胶</option>
                  <option value="UV">UV</option>
                  <option value="烫金">烫金</option>
                  <option value="烫银">烫银</option>
                  <option value="击凸">击凸</option>
                  <option value="裱糊">裱糊</option>
                  <option value="骑马钉">骑马钉</option>
                  <option value="胶装">胶装</option>
                  <option value="精装">精装</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="factory-card">
                <label className="factory-label">紧急程度</label>
                <select
                  value={newOrder.urgency}
                  onChange={e => setNewOrder({ ...newOrder, urgency: e.target.value as Urgency })}
                  className="factory-input"
                >
                  <option value="normal">普通</option>
                  <option value="urgent">加急 (+30%)</option>
                  <option value="emergency">特急 (+60%)</option>
                </select>
              </div>
              <div className="factory-card">
                <label className="factory-label">交货期</label>
                <input
                  type="date"
                  value={newOrder.deadline}
                  onChange={e => setNewOrder({ ...newOrder, deadline: e.target.value })}
                  className="factory-input"
                />
              </div>
            </div>

            <div className="factory-card">
              <label className="factory-label">备注</label>
              <textarea
                value={newOrder.notes}
                onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                className="factory-input"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={handleCalcQuote} className="factory-btn">
                🧮 试算报价
              </button>
              <button onClick={handleCreateOrder} className="factory-btn-primary">
                💾 保存订单
              </button>
            </div>
          </div>

          <div>
            <div className="factory-card sticky top-0">
              <div className="text-xs text-factory-muted mb-3">📋 订单预览</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-factory-muted">客户：</span>
                  <span className="text-factory-text">
                    {customers.find(c => c.id === newOrder.customer_id)?.name || '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-factory-muted">产品：</span>
                  <span className="text-factory-text">{newOrder.product_name || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-factory-muted">数量：</span>
                  <span className="text-factory-text font-mono">{newOrder.quantity.toLocaleString()} 份</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-factory-muted">尺寸：</span>
                  <span className="text-factory-text font-mono">{newOrder.size} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-factory-muted">纸张：</span>
                  <span className="text-factory-text">{newOrder.paper_type} {newOrder.paper_gsm}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-factory-muted">颜色：</span>
                  <span className="text-factory-text">{newOrder.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-factory-muted">后加工：</span>
                  <span className="text-factory-text">{newOrder.finish || '无'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-factory-muted">交货：</span>
                  <span className="text-factory-text font-mono">{newOrder.deadline}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showNewCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="factory-card w-[500px] p-6">
              <h3 className="text-base font-bold text-factory-text mb-4">➕ 新增客户</h3>
              <div className="space-y-3">
                <div>
                  <label className="factory-label">客户名称 *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="factory-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="factory-label">联系人</label>
                    <input
                      type="text"
                      value={newCustomer.contact}
                      onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                      className="factory-input"
                    />
                  </div>
                  <div>
                    <label className="factory-label">电话</label>
                    <input
                      type="text"
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="factory-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="factory-label">邮箱</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="factory-input"
                  />
                </div>
                <div>
                  <label className="factory-label">地址</label>
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="factory-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowNewCustomer(false)} className="factory-btn text-xs">
                  取消
                </button>
                <button onClick={handleCreateCustomer} className="factory-btn-primary text-xs">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'customers') {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-factory-text">👥 客户管理</h2>
          <button onClick={() => setShowNewCustomer(true)} className="factory-btn-primary text-xs">
            + 新增客户
          </button>
        </div>

        <div className="factory-panel flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-6 gap-3 p-3 border-b border-factory-border text-xs font-medium text-factory-muted">
            <div>客户名称</div>
            <div>联系人</div>
            <div>电话</div>
            <div>邮箱</div>
            <div>地址</div>
            <div>创建时间</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {customers.map(customer => (
              <div 
                key={customer.id}
                className="grid grid-cols-6 gap-3 p-3 border-b border-factory-border/50 hover:bg-factory-border/20 text-sm"
              >
                <div className="font-medium text-factory-text">{customer.name}</div>
                <div className="text-factory-text">{customer.contact || '-'}</div>
                <div className="text-factory-text font-mono">{customer.phone || '-'}</div>
                <div className="text-factory-muted text-xs">{customer.email || '-'}</div>
                <div className="text-factory-muted text-xs truncate">{customer.address || '-'}</div>
                <div className="text-factory-muted text-xs font-mono">
                  {dayjs(customer.created_at).format('YYYY-MM-DD')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showNewCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="factory-card w-[500px] p-6">
              <h3 className="text-base font-bold text-factory-text mb-4">➕ 新增客户</h3>
              <div className="space-y-3">
                <div>
                  <label className="factory-label">客户名称 *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="factory-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="factory-label">联系人</label>
                    <input
                      type="text"
                      value={newCustomer.contact}
                      onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                      className="factory-input"
                    />
                  </div>
                  <div>
                    <label className="factory-label">电话</label>
                    <input
                      type="text"
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="factory-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="factory-label">邮箱</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="factory-input"
                  />
                </div>
                <div>
                  <label className="factory-label">地址</label>
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="factory-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowNewCustomer(false)} className="factory-btn text-xs">
                  取消
                </button>
                <button onClick={handleCreateCustomer} className="factory-btn-primary text-xs">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'quote') {
    const pendingQuotes = orders.filter(o => o.status === 'pending_quote')
    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-factory-text">💰 报价管理</h2>
          <div className="text-sm text-factory-muted">
            待报价: <span className="text-yellow-400 font-bold">{pendingQuotes.length}</span> 单
          </div>
        </div>

        <div className="factory-panel flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 gap-3 p-3 border-b border-factory-border text-xs font-medium text-factory-muted">
            <div className="col-span-2">订单号</div>
            <div className="col-span-2">客户</div>
            <div className="col-span-3">产品</div>
            <div className="col-span-1 text-right">数量</div>
            <div className="col-span-1">纸张</div>
            <div className="col-span-1">交期</div>
            <div className="col-span-2 text-center">操作</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {pendingQuotes.map(order => (
              <div 
                key={order.id}
                className="grid grid-cols-12 gap-3 p-3 border-b border-factory-border/50 hover:bg-factory-border/20 items-center text-sm"
              >
                <div className="col-span-2 font-mono text-factory-accent">{order.order_no}</div>
                <div className="col-span-2 text-factory-text truncate">{order.customer_name}</div>
                <div className="col-span-3 text-factory-text truncate">{order.product_name}</div>
                <div className="col-span-1 text-right font-mono">{order.quantity.toLocaleString()}</div>
                <div className="col-span-1 text-factory-muted text-xs">{order.paper_type}</div>
                <div className="col-span-1 font-mono text-xs">{dayjs(order.deadline).format('MM-DD')}</div>
                <div className="col-span-2 flex justify-center gap-2">
                  <button
                    onClick={() => handleQuickQuote(order)}
                    className="factory-btn-primary text-xs py-0.5"
                  >
                    🧮 快速报价
                  </button>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="factory-btn text-xs py-0.5"
                  >
                    详情
                  </button>
                </div>
              </div>
            ))}
            {pendingQuotes.length === 0 && (
              <div className="p-8 text-center text-factory-muted">
                🎉 没有待报价的订单
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-factory-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-factory-text">📋 订单总览</h2>
            <span className="text-xs text-factory-muted">
              共 {filteredOrders.length} 单
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setActiveTab('quote'); saveWorkspace({ current_view: WORKSPACE_VIEWS.SALES_QUOTE }) }}
              className="factory-btn text-xs"
            >
              💰 报价管理
            </button>
            <button 
              onClick={() => { setActiveTab('customers'); saveWorkspace({ current_view: WORKSPACE_VIEWS.SALES_CUSTOMERS }) }}
              className="factory-btn text-xs"
            >
              👥 客户管理
            </button>
            <button 
              onClick={() => { setActiveTab('new'); saveWorkspace({ current_view: WORKSPACE_VIEWS.SALES_NEW_ORDER }) }}
              className="factory-btn-primary text-xs"
            >
              + 新建订单
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-3 mb-3">
          <div className="factory-card bg-factory-bg">
            <div className="text-xs text-factory-muted">总订单</div>
            <div className="text-xl font-bold text-factory-text font-mono">{stats.total}</div>
          </div>
          <div className="factory-card bg-yellow-500/5 border-yellow-500/30">
            <div className="text-xs text-yellow-400">待报价</div>
            <div className="text-xl font-bold text-yellow-400 font-mono">{stats.pending_quote}</div>
          </div>
          <div className="factory-card bg-purple-500/5 border-purple-500/30">
            <div className="text-xs text-purple-400">待确认打样</div>
            <div className="text-xl font-bold text-purple-400 font-mono">{stats.pending_proof}</div>
          </div>
          <div className="factory-card bg-factory-accent/5 border-factory-accent/30">
            <div className="text-xs text-factory-accent">生产中</div>
            <div className="text-xl font-bold text-factory-accent font-mono">{stats.in_production}</div>
          </div>
          <div className="factory-card bg-orange-500/5 border-orange-500/30">
            <div className="text-xs text-orange-400">加急单</div>
            <div className="text-xl font-bold text-orange-400 font-mono">{stats.urgent}</div>
          </div>
          <div className="factory-card bg-green-500/5 border-green-500/30">
            <div className="text-xs text-green-400">总金额</div>
            <div className="text-xl font-bold text-green-400 font-mono">¥{stats.total_value.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          {statusFilters.map(filter => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                statusFilter === filter.key
                  ? 'bg-factory-accent text-white'
                  : 'bg-factory-border text-factory-muted hover:bg-factory-accent/20 hover:text-factory-text'
              }`}
            >
              {filter.label}
              {filter.key !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({orders.filter(o => o.status === filter.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[400px] border-r border-factory-border overflow-y-auto p-3 space-y-3">
          {filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              selected={selectedOrder?.id === order.id}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
          {filteredOrders.length === 0 && (
            <div className="p-8 text-center text-factory-muted">
              没有符合条件的订单
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <OrderDetail />
        </div>
      </div>
    </div>
  )
}
