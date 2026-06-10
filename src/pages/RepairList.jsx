import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api.js'

const faultTypeMap = {
  brake_failure: '刹车故障',
  qr_damage: '二维码损坏',
  position_offset: '定位偏移',
  tire_flat: '车胎漏气',
  chain_issue: '链条问题',
  seat_damage: '座椅损坏',
  handlebar_issue: '车把问题',
  pedal_issue: '脚踏问题',
  other: '其他'
}

function RepairList() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [repairTypeFilter, setRepairTypeFilter] = useState('all')

  useEffect(() => {
    loadRepairs()
  }, [page, statusFilter, repairTypeFilter])

  const loadRepairs = async () => {
    setLoading(true)
    const res = await api.getRepairs({
      status: statusFilter,
      repairType: repairTypeFilter,
      page,
      pageSize
    })
    if (res.success) {
      setRepairs(res.data)
      setTotal(res.total)
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  const getStatusText = (status) => {
    const map = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成'
    }
    return map[status] || status
  }

  return (
    <div>
      <div className="page-header">
        <h2>🔧 维修去向</h2>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label>状态：</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">全部</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div className="filter-item">
            <label>维修方式：</label>
            <select value={repairTypeFilter} onChange={e => { setRepairTypeFilter(e.target.value); setPage(1); }}>
              <option value="all">全部</option>
              <option value="on_site_repair">就地维修</option>
              <option value="pull_back">拉回维修</option>
            </select>
          </div>
          <div className="filter-item">
            <span style={{ fontSize: '13px', color: '#999' }}>共 {total} 条记录</span>
          </div>
        </div>

        {loading ? (
          <div className="empty">加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>维修单号</th>
                  <th>车辆编号</th>
                  <th>故障类型</th>
                  <th>维修方式</th>
                  <th>维修地点</th>
                  <th>维修员</th>
                  <th>状态</th>
                  <th>费用</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map(repair => (
                  <tr key={repair.id}>
                    <td>{repair.repair_no}</td>
                    <td>{repair.bike_no}</td>
                    <td>{faultTypeMap[repair.fault_type] || repair.fault_type}</td>
                    <td>
                      <span className="tag">{repair.repair_type_text}</span>
                    </td>
                    <td>{repair.repair_location || '-'}</td>
                    <td>{repair.repairer || '待分配'}</td>
                    <td>
                      <span className={`badge badge-${repair.status}`}>
                        {getStatusText(repair.status)}
                      </span>
                    </td>
                    <td>{repair.cost > 0 ? `¥${repair.cost}` : '-'}</td>
                    <td>
                      <Link to={`/repairs/${repair.id}`} className="link">
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
                {repairs.length === 0 && (
                  <tr>
                    <td colSpan="9" className="empty">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </button>
              <span>第 {page} / {totalPages || 1} 页</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RepairList
