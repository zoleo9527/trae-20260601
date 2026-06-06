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
  pending: '待审核',
  processing: '处理中',
  completed: '已完成'
}

const TYPE_LABELS = {
  refund: '退款',
  reissue: '补发'
}

export default function Dashboard() {
  const { user } = useAuth()
  const { tickets, loading, fetchTickets } = useTickets()
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.assistant

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    processing: tickets.filter(t => t.status === 'processing').length,
    completed: tickets.filter(t => t.status === 'completed').length
  }

  const filteredTickets = typeFilter === 'all'
    ? tickets
    : tickets.filter(t => t.type === typeFilter)

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
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fa8c16' }}>{stats.pending}</div>
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

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>工单列表</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${typeFilter === 'all' ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setTypeFilter('all')}
              style={{ padding: '6px 16px', fontSize: '14px' }}
            >
              全部
            </button>
            <button
              className={`btn ${typeFilter === 'refund' ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setTypeFilter('refund')}
              style={{ padding: '6px 16px', fontSize: '14px' }}
            >
              退款
            </button>
            <button
              className={`btn ${typeFilter === 'reissue' ? 'btn-primary' : 'btn-default'}`}
              onClick={() => setTypeFilter('reissue')}
              style={{ padding: '6px 16px', fontSize: '14px' }}
            >
              补发
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
              {filteredTickets.map((ticket) => (
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
                      background: ticket.status === 'pending' ? '#fff7e6' :
                        ticket.status === 'processing' ? '#e6f4ff' : '#f6ffed',
                      color: ticket.status === 'pending' ? '#fa8c16' :
                        ticket.status === 'processing' ? '#1890ff' : '#52c41a'
                    }}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{ticket.operatorName}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#999' }}>{ticket.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
