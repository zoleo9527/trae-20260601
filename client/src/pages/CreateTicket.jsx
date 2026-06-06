import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTickets } from '../context/TicketContext'
import { useNavigate } from 'react-router-dom'

export default function CreateTicket() {
  const { user } = useAuth()
  const { createTicket } = useTickets()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'refund',
    orderNo: '',
    productName: '',
    amount: '',
    customerName: '',
    customerPhone: '',
    reason: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await createTicket({
        ...form,
        amount: parseFloat(form.amount)
      })
      if (result && result.id) {
        navigate(`/ticket/${result.id}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '20px' }}>创建工单</h2>

      <div style={{ background: '#f5f7fa', padding: '12px 16px', borderRadius: '6px', marginBottom: '24px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>创建人：</span>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{user?.name}</span>
        <span style={{ fontSize: '14px', color: '#999', marginLeft: '16px' }}>角色：{user?.role === 'assistant' ? '主播助理' : user?.role === 'controller' ? '场控' : '售后组长'}</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label>工单类型</label>
            <select name="type" value={form.type} onChange={handleChange} style={{ width: '100%' }}>
              <option value="refund">退款</option>
              <option value="reissue">补发</option>
            </select>
          </div>
          <div className="form-group">
            <label>订单号</label>
            <input
              type="text"
              name="orderNo"
              value={form.orderNo}
              onChange={handleChange}
              placeholder="请输入订单号"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label>商品名称</label>
            <input
              type="text"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              placeholder="请输入商品名称"
              required
            />
          </div>
          <div className="form-group">
            <label>金额（元）</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="请输入金额"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group">
            <label>客户姓名</label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              placeholder="请输入客户姓名"
              required
            />
          </div>
          <div className="form-group">
            <label>联系电话</label>
            <input
              type="tel"
              name="customerPhone"
              value={form.customerPhone}
              onChange={handleChange}
              placeholder="请输入联系电话"
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label>问题描述</label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="请详细描述问题..."
            rows={4}
            required
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-default"
            onClick={() => navigate('/')}
            style={{ padding: '8px 24px' }}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: '8px 24px' }}
          >
            {loading ? '提交中...' : '提交工单'}
          </button>
        </div>
      </form>
    </div>
  )
}
