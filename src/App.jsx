import { useState, useMemo } from 'react'
import { Search, X, Clock, Users, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'

const sampleData = [
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
    ]
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
  '票务主管': '#3498db',
  '检票员': '#27ae60',
  '客服': '#e67e22',
}

function App() {
  const [filters, setFilters] = useState({
    status: '',
    handler: '',
    keyword: '',
  })
  const [selectedTicket, setSelectedTicket] = useState(null)

  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
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
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setFilters({ status: '', handler: '', keyword: '' })
  }

  const handleRowClick = (ticket) => {
    setSelectedTicket(ticket)
  }

  const handleCloseDetails = () => {
    setSelectedTicket(null)
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
                      backgroundColor: `${handlerMap[ticket.handler]}20`,
                      color: handlerMap[ticket.handler],
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      <span style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        backgroundColor: handlerMap[ticket.handler] 
                      }} />
                      {ticket.handler}
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

        {selectedTicket && (
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
                  <span style={{ color: handlerMap[selectedTicket.handler], fontWeight: 500 }}>
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
              </div>

              <div className="section-title">处理历史</div>
              <div className="timeline">
                {selectedTicket.timeline.map((item, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-header">
                      <span className="timeline-user" style={{ color: handlerMap[item.role] }}>
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
                <div className="section-title">渠道库存</div>
                <table className="channel-table">
                  <thead>
                    <tr>
                      <th>渠道名称</th>
                      <th>已配置库存</th>
                      <th>总库存</th>
                      <th>配置进度</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTicket.channels.map((channel, index) => {
                      const progress = channel.total > 0 ? (channel.inventory / channel.total) * 100 : 0
                      return (
                        <tr key={index}>
                          <td>{channel.name}</td>
                          <td>{channel.inventory}</td>
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
    </div>
  )
}

export default App
