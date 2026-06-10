import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api.js'

function BikesList() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [areas, setAreas] = useState([])

  useEffect(() => {
    loadAreas()
    loadBikes()
  }, [page, statusFilter, areaFilter])

  const loadAreas = async () => {
    const res = await api.getAreaList()
    if (res.success) {
      setAreas(res.data)
    }
  }

  const loadBikes = async () => {
    setLoading(true)
    const res = await api.getBikes({
      status: statusFilter,
      area: areaFilter,
      page,
      pageSize
    })
    if (res.success) {
      setBikes(res.data)
      setTotal(res.total)
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="page-header">
        <h2>🚲 车辆列表</h2>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label>状态：</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">全部</option>
              <option value="normal">正常</option>
              <option value="fault">故障</option>
              <option value="repairing">维修中</option>
            </select>
          </div>
          <div className="filter-item">
            <label>区域：</label>
            <select value={areaFilter} onChange={e => { setAreaFilter(e.target.value); setPage(1); }}>
              <option value="all">全部</option>
              {areas.map(area => (
                <option key={area.value} value={area.value}>{area.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <span style={{ fontSize: '13px', color: '#999' }}>共 {total} 辆车</span>
          </div>
        </div>

        {loading ? (
          <div className="empty">加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>车辆编号</th>
                  <th>状态</th>
                  <th>所在区域</th>
                  <th>停放位置</th>
                  <th>上次巡检</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {bikes.map(bike => (
                  <tr key={bike.id}>
                    <td>{bike.bike_no}</td>
                    <td>
                      <span className={`badge badge-${bike.status}`}>
                        {bike.status_text}
                      </span>
                    </td>
                    <td>{bike.area}</td>
                    <td>{bike.location}</td>
                    <td>{bike.last_inspection_date || '-'}</td>
                    <td>
                      <Link to={`/bikes/${bike.id}`} className="link">
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
                {bikes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty">暂无数据</td>
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

export default BikesList
