import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTickets } from '../context/TicketContext'
import { useNavigate } from 'react-router-dom'

const ROLE_STYLES = {
  assistant: { bg: '#e6f4ff', border: '#91caff', color: '#1677ff', title: '主播助理工作台' },
  controller: { bg: '#fff7e6', border: '#ffd591', color: '#fa8c16', title: '场控工作台' },
  lead: { bg: '#f6ffed', border: '#b7eb8f', color: '#52c41a', title: '售后组长工作台' }
}

const STATUS_LABELS = {
  pending_review: '待审核',
  processing: '处理中',
  reviewing: '审核中',
  approved: '已批准',
  shipped: '已发货',
  completed: '已完成',
  rejected: '已拒绝'
}

const TYPE_LABELS = {
  refund: '退款',
  reissue: '补发'
}

const PROCESSING_STATUSES = ['processing', 'reviewing', 'approved', 'shipped']

export default function Dashboard() {
  const { user } = useAuth()
  const { tickets, loading, fetchTickets } = useTickets()
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.assistant

  const stats = {
    total: tickets.length,
    pending_review: tickets.filter(t => t.status === 'pending_review').length,
    processing: tickets.filter(t => PROCESSING_STATUSES.includes(t.status)).length,
    completed: tickets.filter(t => t.status === 'completed').length
  }

  const pendingReviewRefundCount = tickets.filter(t => t.status === 'pending_review' && t.type === 'refund').length
  const pendingReviewReissueCount = tickets.filter(t => t.status === 'pending_review' && t.type === 'reissue').length

  const filteredTickets = tickets.filter(t => {
    const typeMatch = typeFilter === 'all' || t.type === typeFilter
    const statusMatch = statusFilter === 'all' || t.status === statusFilter
    return typeMatch && statusMatch
  })

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending_review':
        return { background: '#fff7e6', color: '#fa8c16' }
      case 'processing':
      case 'reviewing':
        return { background: '#e6f4ff', color: '#1890ff' }
      case 'approved':
      case 'shipped':
        return { background: '#f0f5ff', color: '#2f54eb' }
      case 'completed':
        return { background: '#f6ffed', color: '#52c41a' }
      case 'rejected':
        return { background: '#fff1f0', color: '#ff4d4f' }
      default:
        return { background: '#f5f5f5', color: '#666' }
    }
  }

  const getOperatorName = (ticket) => {
    if (ticket.logs && ticket.logs.length > 0 && ticket.logs[0].operator) {
      return ticket.logs[0].operator
    }
    return '-'
  }

  const handleRoleCardClick = (role) => {
    if (role === 'assistant') {
      navigate('/create')
    } else if (role === 'controller') {
      setTypeFilter('refund')
      setStatusFilter('pending_review')
    } else if (role === 'lead') {
      setTypeFilter('reissue')
      setStatusFilter('pending_review')
    }
  }

  const renderRoleCard = () => {
    const role = user?.role
    if (role === 'assistant') {
      return (
        <div
          className="card"
          onClick={() => handleRoleCardClick('assistant')}
          style={{
            padding: '24px',
            marginBottom: '20px',
            background: '#e6f4ff',
            border: '1px solid #91caff',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#1677ff' }}>新建售后工单</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>快速创建退款或补发工单</p>
          </div>
          <div style={{ fontSize: '32px' }}>+</div>
        </div>
      )
    } else if (role === 'controller') {
      return (
        <div
          className="card"
          onClick={() => handleRoleCardClick('controller')}
          style={{
            padding: '24px',
            marginBottom: '20px',
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#fa8c16' }}>待处理退款工单</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>点击查看待审核的退款工单</p>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fa8c16' }}>{pendingReviewRefundCount}</div>
        </div>
      )
    } else if (role === 'lead') {
      return (
        <div
          className="card"
          onClick={() => handleRoleCardClick('lead')}
          style={{
            padding: '24px',
            marginBottom: '20px',
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#52c41a' }}>待审核补发工单</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>点击查看待审核的补发工单</p>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>{pendingReviewReissueCount}</div>
        </div>
      )
    }
    return null
  }

  const handleFilterChange = (type, status) => {
    setTypeFilter(type)
    setStatusFilter(status)
  }

  return (
    <div>
      <div
        className="card"
        style={{
          padding: '24px',
          marginBottom: '20px',
          background: roleStyle.bg,
          border: `1px solid ${roleStyle.border}`,
          borderRadius: '8px'
        }}
      >
        <h2 style={{ color: roleStyle.color, margin: 0, fontSize: '20px' }}>
          {roleStyle.title}
        </h2>
        <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: '14px' }}>
          欢迎回来，{user?.name}！
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1677ff' }}>{stats.total}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>全部工单</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fa8c16' }}>{stats.pending_review}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>待审核</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>{stats.processing}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>处理中</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>{stats.completed}</div>
          <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>已完成</div>
        </div>
      </div>

      {renderRoleCard()}

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>工单列表</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${typeFilter === 'all' && statusFilter === 'all' ? 'btn-primary' : 'btn-default'}`}
              onClick={() => handleFilterChange('all', 'all')}
              style={{ padding: '6px 16px', fontSize: '14px' }}
            >
              全部
            </button>
            <button
              className={`btn ${typeFilter === 'refund' && statusFilter === 'all' ? 'btn-primary' : 'btn-default'}`}
              onClick={() => handleFilterChange('refund', 'all')}
              style={{ padding: '6px 16px', fontSize: '14px' }}
            >
              退款
            </button>
            <button
              className={`btn ${typeFilter === 'reissue' && statusFilter === 'all' ? 'btn-primary' : 'btn-default'}`}
              onClick={() => handleFilterChange('reissue', 'all')}
              style={{ padding: '6px 16px', fontSize: '14px' }}
            >
              补发
            </button>
            <button
              className={`btn ${typeFilter === 'all' && statusFilter === 'pending_review' ? 'btn-primary' : 'btn-default'}`}
              onClick={() => handleFilterChange('all', 'pending_review')}
              style={{ padding: '6px 16px', fontSize: '14px' }}
            >
              待审核
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/create')}
              style={{ padding: '6px 16px', fontSize: '14px', marginLeft: '8px' }}
            >
              + 新建工单
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无工单数据</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' }}>工单编号</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' }}>类型</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' }}>订单号</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' }}>商品名称</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' }}>金额</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' }}>状态</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' }}>创建人</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' }}>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => {
                const statusStyle = getStatusStyle(ticket.status)
                return (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/ticket/${ticket.id}`)}
                    style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px', fontSize: '14px' }}>{ticket.id}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: ticket.type === 'refund' ? '#fff1f0' : '#e6f7ff',
                        color: ticket.type === 'refund' ? '#ff4d4f' : '#1890ff'
                      }}>
                        {TYPE_LABELS[ticket.type]}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{ticket.orderNo}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{ticket.productName}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>¥{ticket.amount?.toFixed(2)}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: statusStyle.background,
                        color: statusStyle.color
                      }}>
                        {STATUS_LABELS[ticket.status]}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{getOperatorName(ticket)}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#999' }}>{ticket.createdAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
