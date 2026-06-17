import { useState, useMemo } from 'react'
import { Search, X, Clock, Users, AlertCircle, CheckCircle, ChevronRight, Send, RefreshCw, CheckSquare, UserMinus, UserPlus } from 'lucide-react'

const initialData = [
  {
    id: 'TK001',
    ticketName: '成人票',
    category: '基础票种',
    price: 120,
    status: 'processing',
    handler: '票务主管',
    handlerName: '李明',
    blockReason: '渠道库存同步中',
    configProgress: 80,
    createdAt: '2024-01-15 09:00',
    channels: [
      { name: '官方网站', inventory: 500, total: 500, status: 'completed' },
      { name: 'OTA平台', inventory: 300, total: 500, status: 'processing' },
      { name: '线下窗口', inventory: 200, total: 300, status: 'completed' },
      { name: '合作旅行社', inventory: 0, total: 200, status: 'pending' },
    ],
    timeline: [
      { user: '李明', role: '票务主管', action: '创建票种', time: '2024-01-15 09:00', remark: '根据市场调研确定成人票定价120元' },
      { user: '王芳', role: '系统管理员', action: '配置规则', time: '2024-01-15 10:30', remark: '设置有效期为购票后7天内使用' },
      { user: '张伟', role: '检票员', action: '闸机测试', time: '2024-01-15 14:00', remark: '闸机扫码测试通过，支持纸质票和电子票' },
      { user: '李明', role: '票务主管', action: '渠道配置', time: '2024-01-16 09:30', remark: '开始配置各销售渠道库存' },
    ]
  },
  {
    id: 'TK002',
    ticketName: '儿童票',
    category: '优惠票种',
    price: 60,
    status: 'blocked',
    handler: '客服',
    handlerName: '陈静',
    blockReason: '年龄限制规则待确认',
    configProgress: 45,
    createdAt: '2024-01-16 11:00',
    channels: [
      { name: '官方网站', inventory: 0, total: 300, status: 'pending' },
      { name: 'OTA平台', inventory: 0, total: 200, status: 'pending' },
      { name: '线下窗口', inventory: 100, total: 200, status: 'processing' },
      { name: '合作旅行社', inventory: 0, total: 100, status: 'pending' },
    ],
    timeline: [
      { user: '李明', role: '票务主管', action: '创建票种', time: '2024-01-16 11:00', remark: '儿童票定价60元，适用于1.2-1.5米儿童' },
      { user: '陈静', role: '客服', action: '收到投诉', time: '2024-01-16 15:30', remark: '游客反馈年龄界定不清晰，建议增加身高测量指引' },
      { user: '李明', role: '票务主管', action: '暂停配置', time: '2024-01-16 16:00', remark: '暂停配置，等待规则确认' },
    ]
  },
  {
    id: 'TK003',
    ticketName: '学生票',
    category: '优惠票种',
    price: 80,
    status: 'pending',
    handler: '票务主管',
    handlerName: '李明',
    blockReason: '学生证验证接口未完成',
    configProgress: 30,
    createdAt: '2024-01-17 08:30',
    channels: [
      { name: '官方网站', inventory: 0, total: 200, status: 'pending' },
      { name: 'OTA平台', inventory: 0, total: 150, status: 'pending' },
      { name: '线下窗口', inventory: 0, total: 100, status: 'pending' },
      { name: '合作旅行社', inventory: 0, total: 50, status: 'pending' },
    ],
    timeline: [
      { user: '李明', role: '票务主管', action: '创建票种', time: '2024-01-17 08:30', remark: '学生票定价80元，需验证学生证' },
    ]
  },
  {
    id: 'TK004',
    ticketName: '老年票',
    category: '优惠票种',
    price: 50,
    status: 'completed',
    handler: '检票员',
    handlerName: '张伟',
    blockReason: null,
    configProgress: 100,
    createdAt: '2024-01-10 10:00',
    channels: [
      { name: '官方网站', inventory: 150, total: 150, status: 'completed' },
      { name: 'OTA平台', inventory: 100, total: 100, status: 'completed' },
      { name: '线下窗口', inventory: 200, total: 200, status: 'completed' },
      { name: '合作旅行社', inventory: 50, total: 50, status: 'completed' },
    ],
    timeline: [
      { user: '李明', role: '票务主管', action: '创建票种', time: '2024-01-10 10:00', remark: '老年票定价50元，适用于65岁以上老人' },
      { user: '王芳', role: '系统管理员', action: '配置规则', time: '2024-01-10 11:30', remark: '设置身份证自动识别年龄' },
      { user: '张伟', role: '检票员', action: '闸机测试', time: '2024-01-10 14:00', remark: '老年票通道测试完成' },
      { user: '李明', role: '票务主管', action: '渠道配置', time: '2024-01-11 09:00', remark: '各渠道库存配置完成' },
      { user: '张伟', role: '检票员', action: '正式启用', time: '2024-01-12 08:00', remark: '老年票正式上线销售' },
    ],
    completionSnapshot: {
      channels: [
        { name: '官方网站', inventory: 150, total: 150, status: 'completed' },
        { name: 'OTA平台', inventory: 100, total: 100, status: 'completed' },
        { name: '线下窗口', inventory: 200, total: 200, status: 'completed' },
        { name: '合作旅行社', inventory: 50, total: 50, status: 'completed' },
      ],
      configProgress: 100,
      blockReason: null,
      completedAt: '2024-01-12 08:00',
    }
  },
  {
    id: 'TK005',
    ticketName: '家庭套票',
    category: '组合票种',
    price: 280,
    status: 'processing',
    handler: '票务主管',
    handlerName: '李明',
    blockReason: '套餐组合待审核',
    configProgress: 65,
    createdAt: '2024-01-18 09:00',
    channels: [
      { name: '官方网站', inventory: 100, total: 100, status: 'completed' },
      { name: 'OTA平台', inventory: 80, total: 100, status: 'processing' },
      { name: '线下窗口', inventory: 50, total: 50, status: 'completed' },
      { name: '合作旅行社', inventory: 0, total: 50, status: 'pending' },
    ],
    timeline: [
      { user: '李明', role: '票务主管', action: '创建票种', time: '2024-01-18 09:00', remark: '家庭套票包含2大1小，定价280元' },
      { user: '王芳', role: '系统管理员', action: '配置规则', time: '2024-01-18 10:30', remark: '设置套票有效期为购票后30天内使用' },
    ]
  },
  {
    id: 'TK006',
    ticketName: '年卡',
    category: '特殊票种',
    price: 680,
    status: 'blocked',
    handler: '客服',
    handlerName: '陈静',
    blockReason: '照片上传功能异常',
    configProgress: 55,
    createdAt: '2024-01-14 08:00',
    channels: [
      { name: '官方网站', inventory: 0, total: 200, status: 'pending' },
      { name: 'OTA平台', inventory: 0, total: 100, status: 'pending' },
      { name: '线下窗口', inventory: 50, total: 100, status: 'processing' },
      { name: '合作旅行社', inventory: 0, total: 50, status: 'pending' },
    ],
    timeline: [
      { user: '李明', role: '票务主管', action: '创建票种', time: '2024-01-14 08:00', remark: '年卡定价680元，全年不限次' },
      { user: '王芳', role: '系统管理员', action: '配置规则', time: '2024-01-14 09:30', remark: '设置年卡需上传持卡人照片' },
      { user: '陈静', role: '客服', action: '收到投诉', time: '2024-01-15 11:00', remark: '多名用户反馈照片上传失败，系统报错' },
      { user: '王芳', role: '系统管理员', action: '排查问题', time: '2024-01-15 14:00', remark: '发现图片上传接口超时，已联系技术部门' },
    ]
  },
]

const statusMap = {
  pending: { label: '待处理', className: 'status-pending' },
  processing: { label: '处理中', className: 'status-processing' },
  completed: { label: '已完成', className: 'status-completed' },
  blocked: { label: '已阻塞', className: 'status-blocked' },
}

const handlerMap = {
  '票务主管': { color: '#3498db', names: ['李明', '王芳'] },
  '检票员': { color: '#27ae60', names: ['张伟', '刘洋'] },
  '客服': { color: '#e74c3c', names: ['陈静', '赵丽'] },
}

const transitionActions = {
  pending: [
    { action: '开始处理', nextStatus: 'processing' },
    { action: '标记阻塞', nextStatus: 'blocked' },
  ],
  processing: [
    { action: '继续处理', nextStatus: 'processing' },
    { action: '完成配置', nextStatus: 'completed' },
    { action: '标记阻塞', nextStatus: 'blocked' },
  ],
  blocked: [
    { action: '重新处理', nextStatus: 'processing' },
    { action: '继续阻塞', nextStatus: 'blocked' },
  ],
  completed: [
    { action: '重新打开', nextStatus: 'processing' },
  ],
}

function App() {
  const [tickets, setTickets] = useState(initialData)
  const [filters, setFilters] = useState({
    status: '',
    handler: '',
    keyword: '',
  })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [newRemark, setNewRemark] = useState('')
  const [transferHandler, setTransferHandler] = useState('')
  const [transferName, setTransferName] = useState('')
  const [blockReasonInput, setBlockReasonInput] = useState('')
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false)

  const filteredData = useMemo(() => {
    return tickets.filter(item => {
      if (filters.status && item.status !== filters.status) return false
      if (filters.handler && item.handler !== filters.handler) return false
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        return item.ticketName.toLowerCase().includes(kw) ||
               item.id.toLowerCase().includes(kw) ||
               item.category.toLowerCase().includes(kw)
      }
      return true
    })
  }, [tickets, filters])

  const getCurrentTicket = useMemo(() => {
    if (!selectedTicket) return null
    return tickets.find(t => t.id === selectedTicket.id)
  }, [selectedTicket, tickets])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setFilters({ status: '', handler: '', keyword: '' })
  }

  const handleRowClick = (ticket) => {
    setSelectedTicket(ticket)
    setNewRemark('')
    setTransferHandler('')
    setTransferName('')
    setBlockReasonInput('')
    setShowBlockReasonModal(false)
  }

  const handleCloseDetails = () => {
    setSelectedTicket(null)
    setNewRemark('')
    setTransferHandler('')
    setTransferName('')
    setBlockReasonInput('')
    setShowBlockReasonModal(false)
  }

  const getCurrentTime = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  const addRemark = () => {
    if (!newRemark.trim() || !selectedTicket) return
    
    const newTimelineItem = {
      user: selectedTicket.handlerName,
      role: selectedTicket.handler,
      action: '添加备注',
      time: getCurrentTime(),
      remark: newRemark.trim(),
    }

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          timeline: [...t.timeline, newTimelineItem],
        }
      }
      return t
    }))

    setSelectedTicket(prev => ({
      ...prev,
      timeline: [...prev.timeline, newTimelineItem],
    }))

    setNewRemark('')
  }

  const handleTransfer = () => {
    if (!transferHandler || !transferName || !selectedTicket) return

    const newTimelineItem = {
      user: selectedTicket.handlerName,
      role: selectedTicket.handler,
      action: `转派给${transferHandler}`,
      time: getCurrentTime(),
      remark: `转派至${transferHandler}${transferName}处理`,
    }

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          handler: transferHandler,
          handlerName: transferName,
          timeline: [...t.timeline, newTimelineItem],
        }
      }
      return t
    }))

    setSelectedTicket(prev => ({
      ...prev,
      handler: transferHandler,
      handlerName: transferName,
      timeline: [...prev.timeline, newTimelineItem],
    }))

    setTransferHandler('')
    setTransferName('')
  }

  const handleStatusChange = (action, nextStatus) => {
    if (!selectedTicket) return

    let actionText = action
    let remark = ''
    let newBlockReason = selectedTicket.blockReason

    if (action === '开始处理') {
      actionText = '开始处理'
      remark = '开始配置票种信息'
    } else if (action === '完成配置') {
      actionText = '完成配置'
      remark = '票种配置已完成，所有渠道库存同步完毕'
      newBlockReason = null
    } else if (action === '标记阻塞') {
      setBlockReasonInput(selectedTicket.blockReason || '')
      setShowBlockReasonModal(true)
      return
    } else if (action === '重新处理') {
      actionText = '重新处理'
      remark = '问题已解决，重新开始配置'
    } else if (action === '继续处理') {
      actionText = '继续处理'
      remark = '继续配置票种信息'
    } else if (action === '继续阻塞') {
      actionText = '继续阻塞'
      remark = '问题尚未解决，继续暂停'
    } else if (action === '重新打开') {
      actionText = '重新打开'
      remark = '需要调整配置，重新打开处理'
    }

    const newTimelineItem = {
      user: selectedTicket.handlerName,
      role: selectedTicket.handler,
      action: actionText,
      time: getCurrentTime(),
      remark,
    }

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        const updated = {
          ...t,
          status: nextStatus,
          blockReason: newBlockReason,
          timeline: [...t.timeline, newTimelineItem],
        }
        
        if (nextStatus === 'completed') {
          updated.blockReason = null
          updated.configProgress = 100
          updated.channels = updated.channels.map(c => ({ ...c, inventory: c.total, status: 'completed' }))
          updated.completionSnapshot = {
            channels: JSON.parse(JSON.stringify(updated.channels)),
            configProgress: 100,
            blockReason: null,
            completedAt: getCurrentTime(),
          }
        } else if (nextStatus === 'processing' && t.status === 'completed') {
          if (t.completionSnapshot) {
            updated.channels = JSON.parse(JSON.stringify(t.completionSnapshot.channels))
            updated.configProgress = t.completionSnapshot.configProgress
            updated.blockReason = t.completionSnapshot.blockReason
          } else {
            const completedCount = t.channels.filter(c => c.status === 'completed').length
            updated.configProgress = Math.round((completedCount / t.channels.length) * 100)
            if (completedCount < t.channels.length) {
              updated.blockReason = '部分渠道库存未完成'
            }
          }
        }
        
        return updated
      }
      return t
    }))

    setSelectedTicket(prev => {
      const updated = {
        ...prev,
        status: nextStatus,
        blockReason: newBlockReason,
        timeline: [...prev.timeline, newTimelineItem],
      }
      
      if (nextStatus === 'completed') {
        updated.blockReason = null
        updated.configProgress = 100
        updated.channels = updated.channels.map(c => ({ ...c, inventory: c.total, status: 'completed' }))
        updated.completionSnapshot = {
          channels: JSON.parse(JSON.stringify(updated.channels)),
          configProgress: 100,
          blockReason: null,
          completedAt: getCurrentTime(),
        }
      } else if (nextStatus === 'processing' && prev.status === 'completed') {
        if (prev.completionSnapshot) {
          updated.channels = JSON.parse(JSON.stringify(prev.completionSnapshot.channels))
          updated.configProgress = prev.completionSnapshot.configProgress
          updated.blockReason = prev.completionSnapshot.blockReason
        } else {
          const completedCount = prev.channels.filter(c => c.status === 'completed').length
          updated.configProgress = Math.round((completedCount / prev.channels.length) * 100)
          if (completedCount < prev.channels.length) {
            updated.blockReason = '部分渠道库存未完成'
          }
        }
      }
      
      return updated
    })
  }

  const confirmBlock = () => {
    if (!selectedTicket) return

    const actionText = '标记阻塞'
    const remark = blockReasonInput.trim() || '票种配置遇到问题，已暂停'
    const newBlockReason = blockReasonInput.trim() || '配置暂停'

    const newTimelineItem = {
      user: selectedTicket.handlerName,
      role: selectedTicket.handler,
      action: actionText,
      time: getCurrentTime(),
      remark,
    }

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'blocked',
          blockReason: newBlockReason,
          timeline: [...t.timeline, newTimelineItem],
        }
      }
      return t
    }))

    setSelectedTicket(prev => ({
      ...prev,
      status: 'blocked',
      blockReason: newBlockReason,
      timeline: [...prev.timeline, newTimelineItem],
    }))

    setShowBlockReasonModal(false)
    setBlockReasonInput('')
  }

  const updateChannelInventory = (channelIndex, inventory) => {
    if (!selectedTicket) return
    
    const numInventory = parseInt(inventory) || 0
    const channel = selectedTicket.channels[channelIndex]
    const oldInventory = channel.inventory
    const newStatus = numInventory >= channel.total ? 'completed' : numInventory > 0 ? 'processing' : 'pending'

    let newTimelineItem = null
    if (numInventory !== oldInventory) {
      newTimelineItem = {
        user: selectedTicket.handlerName,
        role: selectedTicket.handler,
        action: `更新库存`,
        time: getCurrentTime(),
        remark: `${channel.name}库存从${oldInventory}调整为${numInventory}`,
      }
    }

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        const newChannels = [...t.channels]
        newChannels[channelIndex] = {
          ...newChannels[channelIndex],
          inventory: numInventory,
          status: newStatus,
        }

        const completedCount = newChannels.filter(c => c.status === 'completed').length
        const newProgress = Math.round((completedCount / newChannels.length) * 100)
        
        let newBlockReason = t.blockReason
        if (completedCount === newChannels.length) {
          newBlockReason = null
        }

        const isStatusChangeNeeded = t.status === 'completed' && completedCount < newChannels.length

        const updated = {
          ...t,
          channels: newChannels,
          configProgress: newProgress,
          blockReason: newBlockReason,
          timeline: newTimelineItem ? [...t.timeline, newTimelineItem] : t.timeline,
        }

        if (isStatusChangeNeeded) {
          updated.status = 'processing'
          updated.blockReason = '库存调整导致配置未完成'
          const statusChangeItem = {
            user: t.handlerName,
            role: t.handler,
            action: '状态变更',
            time: getCurrentTime(),
            remark: '库存调整导致配置未完成，自动撤销完成态',
          }
          updated.timeline = [...updated.timeline, statusChangeItem]
        }

        return updated
      }
      return t
    }))

    setSelectedTicket(prev => {
      const newChannels = [...prev.channels]
      newChannels[channelIndex] = {
        ...newChannels[channelIndex],
        inventory: numInventory,
        status: newStatus,
      }

      const completedCount = newChannels.filter(c => c.status === 'completed').length
      const newProgress = Math.round((completedCount / newChannels.length) * 100)
      
      let newBlockReason = prev.blockReason
      if (completedCount === newChannels.length) {
        newBlockReason = null
      }

      const isStatusChangeNeeded = prev.status === 'completed' && completedCount < newChannels.length

      const updated = {
        ...prev,
        channels: newChannels,
        configProgress: newProgress,
        blockReason: newBlockReason,
        timeline: newTimelineItem ? [...prev.timeline, newTimelineItem] : prev.timeline,
      }

      if (isStatusChangeNeeded) {
        updated.status = 'processing'
        updated.blockReason = '库存调整导致配置未完成'
        const statusChangeItem = {
          user: prev.handlerName,
          role: prev.handler,
          action: '状态变更',
          time: getCurrentTime(),
          remark: '库存调整导致配置未完成，自动撤销完成态',
        }
        updated.timeline = [...updated.timeline, statusChangeItem]
      }

      return updated
    })
  }

  const markChannelCompleted = (channelIndex) => {
    if (!selectedTicket) return
    const channel = selectedTicket.channels[channelIndex]
    updateChannelInventory(channelIndex, channel.total)
  }

  const isFullyCompleted = (ticket) => {
    if (ticket.status !== 'completed') return false
    return ticket.channels.every(c => c.status === 'completed') && ticket.configProgress === 100
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>景区票务 - 票种配置与渠道库存管理</h1>
      </header>

      <main className="main-content">
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-group">
              <label>状态</label>
              <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="blocked">已阻塞</option>
              </select>
            </div>

            <div className="filter-group">
              <label>处理人</label>
              <select value={filters.handler} onChange={(e) => handleFilterChange('handler', e.target.value)}>
                <option value="">全部人员</option>
                <option value="票务主管">票务主管</option>
                <option value="检票员">检票员</option>
                <option value="客服">客服</option>
              </select>
            </div>

            <div className="filter-group">
              <Search style={{ width: 18, height: 18, color: '#666' }} />
              <input
                type="text"
                placeholder="搜索票种名称/编号"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
              />
            </div>

            <div className="filter-actions">
              <button className="btn btn-secondary" onClick={handleReset}>重置筛选</button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>票种编号</th>
                <th>票种名称</th>
                <th>分类</th>
                <th>价格</th>
                <th>状态</th>
                <th>处理人</th>
                <th>配置进度</th>
                <th>阻塞原因</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(ticket => (
                <tr key={ticket.id} onClick={() => handleRowClick(ticket)} style={{ cursor: 'pointer' }}>
                  <td><strong>{ticket.id}</strong></td>
                  <td>{ticket.ticketName}</td>
                  <td>{ticket.category}</td>
                  <td>¥{ticket.price}</td>
                  <td>
                    <span className={`status-badge ${statusMap[ticket.status].className}`}>
                      {statusMap[ticket.status].label}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center',
                      gap: 6,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: `${handlerMap[ticket.handler].color}20`,
                      color: handlerMap[ticket.handler].color,
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      <span style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: handlerMap[ticket.handler].color 
                      }} />
                      {ticket.handler} - {ticket.handlerName}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar" style={{ width: '100px' }}>
                      <div 
                        className="progress-fill" 
                        style={{ width: `${ticket.configProgress}%` }} 
                      />
                    </div>
                    <span style={{ fontSize: '12px', marginLeft: '8px' }}>{ticket.configProgress}%</span>
                  </td>
                  <td>
                    {ticket.blockReason ? (
                      <span style={{ color: '#e74c3c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={14} />
                        {ticket.blockReason}
                      </span>
                    ) : (
                      <span style={{ color: '#27ae60', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} />
                        正常
                      </span>
                    )}
                  </td>
                  <td>{ticket.createdAt}</td>
                  <td>
                    <span style={{ color: '#3498db', display: 'flex', alignItems: 'center', gap: 2 }}>
                      查看详情 <ChevronRight size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="empty-state">
              <Search size={48} />
              <p>没有找到符合条件的票种</p>
            </div>
          )}
        </div>

        {selectedTicket && getCurrentTicket && (
          <div className="details-panel">
            <div className="panel-header">
              <h3>{selectedTicket.id} - {selectedTicket.ticketName} 详情</h3>
              <button className="close-btn" onClick={handleCloseDetails}>
                <X size={18} />
              </button>
            </div>

            <div className="panel-content">
              <div className="section-title">基本信息</div>
              <div className="info-grid">
                <div className="info-item">
                  <label>票种编号</label>
                  <span>{selectedTicket.id}</span>
                </div>
                <div className="info-item">
                  <label>票种名称</label>
                  <span>{selectedTicket.ticketName}</span>
                </div>
                <div className="info-item">
                  <label>分类</label>
                  <span>{selectedTicket.category}</span>
                </div>
                <div className="info-item">
                  <label>价格</label>
                  <span>¥{selectedTicket.price}</span>
                </div>
                <div className="info-item">
                  <label>状态</label>
                  <span className={`status-badge ${statusMap[selectedTicket.status].className}`}>
                    {statusMap[selectedTicket.status].label}
                  </span>
                </div>
                <div className="info-item">
                  <label>处理人</label>
                  <span style={{ color: handlerMap[selectedTicket.handler].color, fontWeight: 500 }}>
                    {selectedTicket.handler} - {selectedTicket.handlerName}
                  </span>
                </div>
                <div className="info-item">
                  <label>配置进度</label>
                  <span>{selectedTicket.configProgress}%</span>
                </div>
                <div className="info-item">
                  <label>创建时间</label>
                  <span>{selectedTicket.createdAt}</span>
                </div>
                {selectedTicket.blockReason && (
                  <div className="info-item">
                    <label>阻塞原因</label>
                    <span style={{ color: '#e74c3c' }}>{selectedTicket.blockReason}</span>
                  </div>
                )}
                {selectedTicket.completionSnapshot && (
                  <div className="info-item">
                    <label>上次完成时间</label>
                    <span style={{ color: '#666' }}>{selectedTicket.completionSnapshot.completedAt}</span>
                  </div>
                )}
              </div>

              {isFullyCompleted(selectedTicket) && (
                <div className="completion-summary">
                  <div className="completion-icon">
                    <CheckCircle size={48} style={{ color: '#27ae60' }} />
                  </div>
                  <div className="completion-content">
                    <h4>配置完成</h4>
                    <p>票种 {selectedTicket.ticketName} 已完成全部配置工作，所有渠道库存已同步完毕。</p>
                    <div className="completion-stats">
                      <div className="stat-item">
                        <span className="stat-value">{selectedTicket.channels.length}</span>
                        <span className="stat-label">销售渠道</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{selectedTicket.channels.reduce((sum, c) => sum + c.total, 0)}</span>
                        <span className="stat-label">总库存</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">¥{selectedTicket.price}</span>
                        <span className="stat-label">票价</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="action-section">
                <div className="action-group">
                  <h4>状态推进</h4>
                  <div className="action-buttons">
                    {transitionActions[selectedTicket.status]?.map((item, index) => (
                      <button
                        key={index}
                        className={`btn btn-action btn-${item.nextStatus}`}
                        onClick={() => handleStatusChange(item.action, item.nextStatus)}
                      >
                        <RefreshCw size={14} style={{ marginRight: 6 }} />
                        {item.action}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="action-group">
                  <h4>转派处理</h4>
                  <div className="transfer-controls">
                    <select 
                      value={transferHandler} 
                      onChange={(e) => {
                        setTransferHandler(e.target.value)
                        setTransferName('')
                      }}
                    >
                      <option value="">选择角色</option>
                      {Object.entries(handlerMap).map(([role, data]) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {transferHandler && (
                      <select value={transferName} onChange={(e) => setTransferName(e.target.value)}>
                        <option value="">选择人员</option>
                        {handlerMap[transferHandler]?.names.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    )}
                    <button 
                      className="btn btn-primary" 
                      onClick={handleTransfer}
                      disabled={!transferHandler || !transferName}
                    >
                      <UserMinus size={14} style={{ marginRight: 6 }} />
                      转派
                    </button>
                  </div>
                </div>

                <div className="action-group">
                  <h4>添加备注</h4>
                  <div className="remark-input">
                    <textarea
                      value={newRemark}
                      onChange={(e) => setNewRemark(e.target.value)}
                      placeholder="输入备注内容..."
                      rows={3}
                    />
                    <button 
                      className="btn btn-primary" 
                      onClick={addRemark}
                      disabled={!newRemark.trim()}
                    >
                      <Send size={14} style={{ marginRight: 6 }} />
                      添加备注
                    </button>
                  </div>
                </div>
              </div>

              <div className="section-title">处理历史</div>
              <div className="timeline">
                {selectedTicket.timeline.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-header">
                      <span className="timeline-user" style={{ color: handlerMap[item.role]?.color || '#333' }}>
                        {item.user} ({item.role})
                      </span>
                      <span className="timeline-time">
                        <Clock size={12} style={{ marginRight: 4 }} />
                        {item.time}
                      </span>
                    </div>
                    <div className="timeline-action">
                      <Users size={14} style={{ marginRight: 6 }} />
                      {item.action}
                    </div>
                    {item.remark && (
                      <div className="timeline-remark">备注: {item.remark}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="channel-section">
                <div className="section-title">渠道库存管理</div>
                <table className="channel-table">
                  <thead>
                    <tr>
                      <th>渠道名称</th>
                      <th>已配置库存</th>
                      <th>总库存</th>
                      <th>配置进度</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTicket.channels.map((channel, index) => {
                      const progress = channel.total > 0 ? (channel.inventory / channel.total) * 100 : 0
                      return (
                        <tr key={index}>
                          <td>{channel.name}</td>
                          <td>
                            <input
                              type="number"
                              value={channel.inventory}
                              onChange={(e) => updateChannelInventory(index, e.target.value)}
                              min="0"
                              max={channel.total}
                              className="inventory-input"
                            />
                          </td>
                          <td>{channel.total}</td>
                          <td>
                            <div className="progress-bar" style={{ width: '80px' }}>
                              <div className="progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <span style={{ fontSize: '12px', marginLeft: '6px' }}>{Math.round(progress)}%</span>
                          </td>
                          <td>
                            <span className={`status-badge ${statusMap[channel.status].className}`}>
                              {statusMap[channel.status].label}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-mini"
                              onClick={() => markChannelCompleted(index)}
                              disabled={channel.status === 'completed'}
                            >
                              <CheckSquare size={14} />
                              完成
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {showBlockReasonModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>标记阻塞</h3>
            <p>请输入阻塞原因：</p>
            <textarea
              value={blockReasonInput}
              onChange={(e) => setBlockReasonInput(e.target.value)}
              placeholder="请输入阻塞原因..."
              rows={4}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowBlockReasonModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={confirmBlock}>确认阻塞</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
