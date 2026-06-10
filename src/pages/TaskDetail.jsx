import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api.js'

function TaskDetail() {
  const { id } = useParams()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTask()
  }, [id])

  const loadTask = async () => {
    setLoading(true)
    const res = await api.getInspectionTask(id)
    if (res.success) {
      setTask(res.data)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="card"><div className="empty">加载中...</div></div>
  }

  if (!task) {
    return <div className="card"><div className="empty">任务不存在</div></div>
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/inspection-tasks">巡检任务</Link>
        <span>/</span>
        <span>任务详情</span>
      </div>

      <div className="page-header">
        <h2>📋 巡检任务详情 - {task.task_no}</h2>
        <span className={`badge badge-${task.status}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
          {task.status_text}
        </span>
      </div>

      <div className="card">
        <h3 className="section-title">任务信息</h3>
        <div className="form-row">
          <div className="detail-row" style={{ flexDirection: 'column', border: 'none', padding: '0' }}>
            <div className="detail-label">任务编号</div>
            <div className="detail-value">{task.task_no}</div>
          </div>
          <div className="detail-row" style={{ flexDirection: 'column', border: 'none', padding: '0' }}>
            <div className="detail-label">任务状态</div>
            <div className="detail-value">
              <span className={`badge badge-${task.status}`}>{task.status_text}</span>
            </div>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-label">巡检员</div>
          <div className="detail-value">{task.inspector}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">负责区域</div>
          <div className="detail-value">{task.area}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">巡检路线</div>
          <div className="detail-value">{task.route}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">计划日期</div>
          <div className="detail-value">{task.plan_date}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">开始时间</div>
          <div className="detail-value">{task.start_time || '未开始'}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">结束时间</div>
          <div className="detail-value">{task.end_time || '未结束'}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">巡检车辆数</div>
          <div className="detail-value">{task.bike_count} 辆</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">发现故障数</div>
          <div className="detail-value">
            <span style={{ color: '#e53935', fontWeight: '600' }}>{task.fault_count} 起</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">
          本次巡检上报故障 ({task.faults ? task.faults.length : 0} 起)
        </h3>
        {task.faults && task.faults.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>故障编号</th>
                <th>车辆编号</th>
                <th>故障类型</th>
                <th>严重程度</th>
                <th>位置</th>
                <th>上报时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {task.faults.map(fault => (
                <tr key={fault.id}>
                  <td>{fault.report_no}</td>
                  <td>{fault.bike_no}</td>
                  <td>{fault.fault_type_text}</td>
                  <td>
                    <span className={`badge badge-${fault.fault_level}`}>
                      {fault.fault_level_text}
                    </span>
                  </td>
                  <td>{fault.location}</td>
                  <td>{fault.report_time}</td>
                  <td>
                    <span className={`badge badge-${fault.status}`}>
                      {fault.status_text}
                    </span>
                  </td>
                  <td>
                    <Link to={`/faults/${fault.id}`} className="link">查看</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">暂无故障记录</div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <Link to="/inspection-tasks" className="btn btn-default">← 返回列表</Link>
      </div>
    </div>
  )
}

export default TaskDetail
