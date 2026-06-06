import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTickets } from '../context/TicketContext'

const STATUS_LABELS = {
  pending_review: '待审核',
  processing: '处理中',
  reviewing: '审核中',
  approved: '已审核通过',
  shipped: '已发货',
  completed: '已完成',
  rejected: '已拒绝'
}

const TYPE_LABELS = {
  refund: '退款',
  reissue: '补发'
}

const ROLE_LABELS = {
  assistant: '主播助理',
  controller: '场控',
  lead: '售后组长'
}

const getStatusStyle = (status) => {
  const styles = {
    pending_review: { background: '#fff7e6', color: '#fa8c16' },
    processing: { background: '#e6f4ff', color: '#1890ff' },
    reviewing: { background: '#fff0f6', color: '#eb2f96' },
    approved: { background: '#f6ffed', color: '#52c41a' },
    shipped: { background: '#e6fffb', color: '#13c2c2' },
    completed: { background: '#f6ffed', color: '#52c41a' },
    rejected: { background: '#fff1f0', color: '#ff4d4f' }
  }
  return styles[status] || styles.pending_review
}

const REFUND_FLOW = {
  pending_review: ['processing', 'rejected'],
  processing: ['completed'],
  completed: [],
  rejected: []
}

const REISSUE_FLOW = {
  pending_review: ['reviewing', 'rejected'],
  reviewing: ['approved', 'rejected'],
  approved: ['shipped'],
  shipped: ['completed'],
  completed: [],
  rejected: []
}

const ACTION_LABELS = {
  processing: '开始处理',
  reviewing: '开始审核',
  approved: '审核通过',
  shipped: '确认发货',
  completed: '完成工单',
  rejected: '拒绝'
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fetchTicket, updateTicketStatus } = useTickets()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRemark, setShowRemark] = useState(null)
  const [remark, setRemark] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadTicket()
  }, [id])

  const loadTicket = async () => {
    setLoading(true)
    try {
      const data = await fetchTicket(id)
      setTicket(data)
    } catch (e) {
      console.error('加载工单失败:', e)
      setTicket(null)
    } finally {
      setLoading(false)
    }
  }

  const canPerformAction = (action) => {
    if (!ticket || !user) return false
    if (ticket.status === 'completed' || ticket.status === 'rejected') return false

    if (ticket.type === 'refund') {
      if (user.role === 'controller' || user.role === 'lead') {
        return REFUND_FLOW[ticket.status]?.includes(action)
      }
      return false
    }

    if (ticket.type === 'reissue') {
      if (user.role === 'lead') {
        return REISSUE_FLOW[ticket.status]?.includes(action)
      }
      if (user.role === 'controller') {
        return action === 'shipped' && ticket.status === 'approved'
      }
      return false
    }

    return false
  }

  const getAvailableActions = () => {
    if (!ticket) return []
    const flow = ticket.type === 'refund' ? REFUND_FLOW : REISSUE_FLOW
    const actions = flow[ticket.status] || []
    return actions.filter(action => canPerformAction(action))
  }

  const handleActionClick = (action) => {
    setShowRemark(action)
    setRemark('')
  }

  const handleConfirmAction = async () => {
    if (!showRemark) return
    setActionLoading(true)
    try {
      await updateTicketStatus(id, showRemark, ACTION_LABELS[showRemark], remark)
      setShowRemark(null)
      setRemark('')
      await loadTicket()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelAction = () => {
    setShowRemark(null)
    setRemark('')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return dateStr
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>加载中...</div>
    )
  }

  if (!ticket) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <p style={{ color: '#999', marginBottom: '16px' }}>工单不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>返回列表</button>
      </div>
    )
  }

  const statusStyle = getStatusStyle(ticket.status)
  const availableActions = getAvailableActions()
  const sortedLogs = [...(ticket.logs || [])].sort((a, b) => {
    try {
      return new Date(b.time) - new Date(a.time)
    } catch (e) {
      return 0
    }
  })
  const creator = ticket.logs && ticket.logs[0] ? ticket.logs[0].operator : '-'

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          className="btn btn-default"
          onClick={() => navigate('/')}
          style={{ padding: '6px 16px' }}
        >
          ← 返回列表
        </button>
        <h2 style={{ margin: 0, fontSize: '20px' }}>工单详情</h2>
        <div style={{ width: '80px' }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
              基本信息
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>工单编号</div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{ticket.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>工单类型</div>
                <div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: ticket.type === 'refund' ? '#fff1f0' : '#e6f7ff',
                    color: ticket.type === 'refund' ? '#ff4d4f' : '#1890ff'
                  }}>
                    {TYPE_LABELS[ticket.type] || ticket.type}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>订单号</div>
                <div style={{ fontSize: '14px' }}>{ticket.orderNo}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>当前状态</div>
                <div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: statusStyle.background,
                    color: statusStyle.color
                  }}>
                    {STATUS_LABELS[ticket.status] || ticket.status}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>商品名称</div>
                <div style={{ fontSize: '14px' }}>{ticket.productName}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>金额</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#ff4d4f' }}>¥{ticket.amount != null ? ticket.amount.toFixed(2) : '0.00'}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>客户姓名</div>
                <div style={{ fontSize: '14px' }}>{ticket.customerName}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>联系电话</div>
                <div style={{ fontSize: '14px' }}>{ticket.customerPhone}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>问题描述</div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', background: '#fafafa', padding: '12px', borderRadius: '4px' }}>
                  {ticket.reason}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>创建人</div>
                <div style={{ fontSize: '14px' }}>{creator}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>创建时间</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{formatDate(ticket.createdAt)}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
              操作记录
            </h3>
            {sortedLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无操作记录</div>
            ) : (
              <div style={{ position: 'relative' }}>
                {sortedLogs.map((log, index) => (
                  <div key={index} style={{ display: 'flex', gap: '16px', paddingBottom: index < sortedLogs.length - 1 ? '24px' : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#1890ff',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 2px #1890ff',
                        flexShrink: 0
                      }}></div>
                      {index < sortedLogs.length - 1 && (
                        <div style={{ width: '2px', flex: 1, background: '#f0f0f0', marginTop: '8px' }}></div>
                      )}
                    </div>
                    <div style={{ flex: 1, paddingBottom: '0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>{log?.operator}</span>
                          <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                            ({ROLE_LABELS[log?.operatorRole] || log?.operatorRole})
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#999' }}>{formatDate(log?.time)}</span>
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                        <span style={{ color: '#1890ff' }}>{log?.action}</span>
                      </div>
                      {log?.remark && (
                        <div style={{ fontSize: '13px', color: '#666', background: '#fafafa', padding: '8px 12px', borderRadius: '4px' }}>
                          备注：{log.remark}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
            <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '8px' }}>当前用户</div>
            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>{user?.name}</div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>可用操作</h3>
            
            {showRemark ? (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                    操作：{ACTION_LABELS[showRemark]}
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请输入备注信息（可选）"
                    rows={4}
                    style={{ width: '100%', resize: 'vertical', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmAction}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '8px' }}
                  >
                    {actionLoading ? '处理中...' : '确认'}
                  </button>
                  <button
                    className="btn btn-default"
                    onClick={handleCancelAction}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '8px' }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {availableActions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                    {ticket.status === 'completed' || ticket.status === 'rejected'
                      ? '工单已结束'
                      : '暂无可用操作'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableActions.map((action) => (
                      <button
                        key={action}
                        className={`btn ${action === 'rejected' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => handleActionClick(action)}
                        style={{ padding: '10px', fontSize: '14px' }}
                      >
                        {ACTION_LABELS[action]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
              {ticket.type === 'refund' ? '退款流程' : '补发流程'}
            </h3>
            <div style={{ position: 'relative', paddingLeft: '8px' }}>
              {ticket.type === 'refund' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['pending_review', 'processing', 'completed'].map((status, index) => {
                    const isActive = ticket.status === status
                    const isPassed = ['pending_review', 'processing', 'completed'].indexOf(ticket.status) > index
                    const style = getStatusStyle(status)
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: isActive || isPassed ? style.color : '#f0f0f0',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                        <span style={{
                          fontSize: '14px',
                          color: isActive || isPassed ? '#333' : '#999',
                          fontWeight: isActive ? '500' : 'normal'
                        }}>
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: ticket.status === 'rejected' ? '#ff4d4f' : '#f0f0f0',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      ✕
                    </div>
                    <span style={{
                      fontSize: '14px',
                      color: ticket.status === 'rejected' ? '#ff4d4f' : '#999'
                    }}>
                      已拒绝
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['pending_review', 'reviewing', 'approved', 'shipped', 'completed'].map((status, index) => {
                    const isActive = ticket.status === status
                    const isPassed = ['pending_review', 'reviewing', 'approved', 'shipped', 'completed'].indexOf(ticket.status) > index
                    const style = getStatusStyle(status)
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: isActive || isPassed ? style.color : '#f0f0f0',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                        <span style={{
                          fontSize: '14px',
                          color: isActive || isPassed ? '#333' : '#999',
                          fontWeight: isActive ? '500' : 'normal'
                        }}>
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: ticket.status === 'rejected' ? '#ff4d4f' : '#f0f0f0',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      ✕
                    </div>
                    <span style={{
                      fontSize: '14px',
                      color: ticket.status === 'rejected' ? '#ff4d4f' : '#999'
                    }}>
                      已拒绝
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>操作说明</h3>
            {ticket.type === 'refund' ? (
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                <p style={{ margin: '0 0 8px 0' }}>• <strong>场控和组长</strong>可处理退款工单</p>
                <p style={{ margin: '0 0 8px 0' }}>• 退款流程：待审核 → 处理中 → 已完成</p>
                <p style={{ margin: '0 0 8px 0' }}>• 如有问题可随时拒绝工单</p>
                <p style={{ margin: 0 }}>• 请在处理时备注具体原因和处理方式</p>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                <p style={{ margin: '0 0 8px 0' }}>• <strong>组长</strong>负责审核补发工单</p>
                <p style={{ margin: '0 0 8px 0' }}>• <strong>场控</strong>可在审核通过后确认发货</p>
                <p style={{ margin: '0 0 8px 0' }}>• 补发流程：待审核 → 审核中 → 已审核通过 → 已发货 → 已完成</p>
                <p style={{ margin: 0 }}>• 审核不通过请备注原因并拒绝</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
