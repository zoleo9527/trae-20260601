import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api.js'

function InspectionTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [areas, setAreas] = useState([])

  useEffect(() => {
    loadAreas()
    loadTasks()
  }, [page, statusFilter, areaFilter])

  const loadAreas = async () => {
    const res = await api.getAreaList()
    if (res.success) {
      setAreas(res.data)
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    const res = await api.getInspectionTasks({
      status: statusFilter,
      area: areaFilter,
      page,
      pageSize
    })
    if (res.success) {
      setTasks(res.data)
      setTotal(res.total)
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="page-header">
        <h2>📋 巡检任务</h2>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label>状态：</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">全部</option>
              <option value="pending">待执行</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
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
            <span style={{ fontSize: '13px', color: '#999' }}>共 {total} 个任务</span>
          </div>
        </div>

        {loading ? (
          <div className="empty">加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>任务编号</th>
                  <th>巡检员</th>
                  <th>区域</th>
                  <th>巡检路线</th>
                  <th>计划日期</th>
                  <th>状态</th>
                  <th>巡检车辆</th>
                  <th>发现故障</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>{task.task_no}</td>
                    <td>{task.inspector}</td>
                    <td>{task.area}</td>
                    <td>{task.route}</td>
                    <td>{task.plan_date}</td>
                    <td>
                      <span className={`badge badge-${task.status}`}>
                        {task.status_text}
                      </span>
                    </td>
                    <td>{task.bike_count} 辆</td>
                    <td>{task.fault_count} 起</td>
                    <td>
                      <Link to={`/inspection-tasks/${task.id}`} className="link">
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
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

export default InspectionTasks
