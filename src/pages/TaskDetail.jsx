import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api.js'

const invalidDescriptionKeywords = ['坏了', '坏', '不行了', '不能用', '用不了', '坏的', '坏掉', '损坏', '故障']

function validateDescription(desc) {
  if (!desc || desc.trim().length < 5) return '故障描述至少5个字符，请详细描述故障情况'
  const trimmed = desc.trim()
  for (const kw of invalidDescriptionKeywords) {
    if (trimmed === kw || trimmed === kw + '了' || trimmed === '车' + kw || trimmed === kw + '了！' || trimmed === kw + '!') {
      return '故障描述过于简单，请详细说明具体故障现象，不能只写"坏了"'
    }
  }
  return null
}

function parseRouteNodes(route) {
  if (!route) return []
  return route.split(/[→>→➡\-]/).map(s => s.trim()).filter(Boolean)
}

function sortByRouteProximity(bikes, route) {
  const nodes = parseRouteNodes(route)
  if (!nodes.length) return bikes
  return [...bikes].sort((a, b) => {
    const aMatch = nodes.some(n => a.location && a.location.includes(n)) ? 0 : 1
    const bMatch = nodes.some(n => b.location && b.location.includes(n)) ? 0 : 1
    if (aMatch !== bMatch) return aMatch - bMatch
    return a.bike_no.localeCompare(b.bike_no)
  })
}

function TaskDetail() {
  const { id } = useParams()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [faultTypes, setFaultTypes] = useState([])
  const [areaBikes, setAreaBikes] = useState([])
  const [formData, setFormData] = useState({
    bike_no: '',
    fault_type: '',
    fault_level: '',
    description: '',
    location: '',
    lat: '',
    lng: '',
    reporter: ''
  })

  useEffect(() => {
    loadDicts()
    loadTask()
  }, [id])

  const loadDicts = async () => {
    const res = await api.getFaultTypes()
    if (res.success) setFaultTypes(res.data)
  }

  const loadTask = async () => {
    setLoading(true)
    const res = await api.getInspectionTask(id)
    if (res.success) {
      setTask(res.data)
    }
    setLoading(false)
  }

  const openReportModal = async () => {
    const bikesRes = await api.getBikesByArea(task.area)
    const allBikes = bikesRes.success ? bikesRes.data : []
    const normalBikes = sortByRouteProximity(
      allBikes.filter(b => b.status === 'normal'),
      task.route
    )
    setAreaBikes(normalBikes)
    const firstBike = normalBikes[0]
    setFormData({
      bike_no: firstBike ? firstBike.bike_no : '',
      fault_type: '',
      fault_level: '',
      description: '',
      location: firstBike ? firstBike.location : '',
      lat: firstBike ? String(firstBike.lat) : '',
      lng: firstBike ? String(firstBike.lng) : '',
      reporter: task?.inspector || ''
    })
    setShowReportModal(true)
  }

  const handleBikeSelect = (bikeNo) => {
    const selected = areaBikes.find(b => b.bike_no === bikeNo)
    if (selected) {
      setFormData(prev => ({
        ...prev,
        bike_no: selected.bike_no,
        location: selected.location,
        lat: String(selected.lat),
        lng: String(selected.lng)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bike_no || !formData.fault_type || !formData.fault_level || !formData.location || !formData.lat || !formData.lng) {
      alert('请填写完整信息')
      return
    }
    const descError = validateDescription(formData.description)
    if (descError) {
      alert(descError)
      return
    }
    const res = await api.createFault({
      ...formData,
      task_id: parseInt(id)
    })
    if (res.success) {
      alert('上报成功')
      setShowReportModal(false)
      loadTask()
    } else {
      alert(res.message || '上报失败')
    }
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
        <div>
          <h2>📋 巡检任务详情 - {task.task_no}</h2>
          <div style={{ marginTop: '6px', fontSize: '13px', color: '#666' }}>
            负责区域：{task.area} | 巡检员：{task.inspector} | 路线：{task.route}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {task.status === 'in_progress' && (
            <button className="btn btn-primary" onClick={openReportModal}>
              ⚠️ 现场上报故障
            </button>
          )}
          <span className={`badge badge-${task.status}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
            {task.status_text}
          </span>
        </div>
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

      {showReportModal && (
        <div className="modal-mask" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>现场上报故障</h3>
              <button className="modal-close" onClick={() => setShowReportModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ color: '#1565c0', fontWeight: '500', marginBottom: '4px' }}>📋 巡检任务上下文（自动带入）</div>
                  <div>任务编号：{task.task_no} | 巡检员：{task.inspector} | 区域：{task.area}</div>
                  <div>巡检路线：{task.route}</div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>选择车辆 * <span style={{ color: '#999', fontWeight: 'normal', fontSize: '12px' }}>（仅限{task.area}正常车辆）</span></label>
                    {areaBikes.length > 0 ? (
                      <select
                        value={formData.bike_no}
                        onChange={e => handleBikeSelect(e.target.value)}
                      >
                        {areaBikes.map(bike => {
                          const nearRoute = parseRouteNodes(task.route).some(n => bike.location && bike.location.includes(n))
                          return (
                            <option key={bike.bike_no} value={bike.bike_no}>
                              {bike.bike_no} - {bike.location}{nearRoute ? ' 📍路线附近' : ''}
                            </option>
                          )
                        })}
                      </select>
                    ) : (
                      <div style={{ padding: '16px', background: '#fff3e0', borderRadius: '4px', textAlign: 'center', color: '#e65100', fontSize: '13px' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚫</div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>当前区域无可用车辆</div>
                        <div>{task.area} 所有车辆均处于故障或维修状态，无法上报新故障</div>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>上报人</label>
                    <input
                      type="text"
                      value={formData.reporter}
                      onChange={e => setFormData({ ...formData, reporter: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>故障类型 *</label>
                    <select
                      value={formData.fault_type}
                      onChange={e => setFormData({ ...formData, fault_type: e.target.value })}
                    >
                      <option value="">请选择故障类型</option>
                      {faultTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>严重程度 *</label>
                    <select
                      value={formData.fault_level}
                      onChange={e => setFormData({ ...formData, fault_level: e.target.value })}
                    >
                      <option value="">请选择严重程度</option>
                      <option value="minor">轻微</option>
                      <option value="medium">中等</option>
                      <option value="serious">严重</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>故障描述 * <span style={{ color: '#999', fontWeight: 'normal', fontSize: '12px' }}>（至少5字符，禁止只写"坏了"）</span></label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请详细描述故障情况，如：后刹车失灵，捏刹车后车辆仍能滑行，刹车线松动"
                  />
                </div>
                <div className="form-group">
                  <label>位置描述 *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="请输入具体位置，如 国贸地铁站A口"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>纬度 *</label>
                    <input
                      type="text"
                      value={formData.lat}
                      onChange={e => setFormData({ ...formData, lat: e.target.value })}
                      placeholder="如 39.9087"
                    />
                  </div>
                  <div className="form-group">
                    <label>经度 *</label>
                    <input
                      type="text"
                      value={formData.lng}
                      onChange={e => setFormData({ ...formData, lng: e.target.value })}
                      placeholder="如 116.4605"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>现场照片</label>
                  <div className="photo-placeholder">
                    <div className="icon">📷</div>
                    <div>照片占位 (点击上传)</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowReportModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={areaBikes.length === 0}>
                  {areaBikes.length === 0 ? '无可用车辆' : '提交上报'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetail
