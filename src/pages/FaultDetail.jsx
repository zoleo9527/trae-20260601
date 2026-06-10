import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api.js'

function FaultDetail() {
  const { id } = useParams()
  const [fault, setFault] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [dispatchData, setDispatchData] = useState({
    repair_decision: '',
    dispatcher: '调度员'
  })

  useEffect(() => {
    loadFault()
  }, [id])

  const loadFault = async () => {
    setLoading(true)
    const res = await api.getFault(id)
    if (res.success) {
      setFault(res.data)
    }
    setLoading(false)
  }

  const handleDispatch = async (e) => {
    e.preventDefault()
    if (!dispatchData.repair_decision) {
      alert('请选择维修方式')
      return
    }
    const res = await api.dispatchFault(id, dispatchData)
    if (res.success) {
      alert('派单成功')
      setShowDispatchModal(false)
      loadFault()
    } else {
      alert(res.message || '派单失败')
    }
  }

  if (loading) {
    return <div className="card"><div className="empty">加载中...</div></div>
  }

  if (!fault) {
    return <div className="card"><div className="empty">故障记录不存在</div></div>
  }

  const getTimeline = () => {
    const events = []
    events.push({
      time: fault.report_time,
      content: `故障上报 - ${fault.reporter}`
    })
    if (fault.dispatch_time) {
      events.push({
        time: fault.dispatch_time,
        content: `调度派单 - ${fault.dispatcher}，${fault.repair_decision_text}`
      })
    }
    if (fault.repair && fault.repair.start_time) {
      events.push({
        time: fault.repair.start_time,
        content: `开始维修 - ${fault.repair.repairer || '待分配'}`
      })
    }
    if (fault.repair && fault.repair.end_time) {
      events.push({
        time: fault.repair.end_time,
        content: `维修完成 - ${fault.repair.result || ''}`
      })
    }
    return events
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/faults">故障上报</Link>
        <span>/</span>
        <span>故障详情</span>
      </div>

      <div className="page-header">
        <div>
          <h2>⚠️ 故障详情 - {fault.report_no}</h2>
          <div style={{ marginTop: '6px' }}>
            {fault.is_duplicate && (
              <span className="badge badge-duplicate" style={{ marginRight: '8px' }}>
                重复上报
              </span>
            )}
            <span className={`badge badge-${fault.status}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
              {fault.status_text}
            </span>
          </div>
        </div>
        {fault.status === 'reported' && (
          <button className="btn btn-primary" onClick={() => setShowDispatchModal(true)}>
            调度派单
          </button>
        )}
      </div>

      {fault.is_duplicate && fault.duplicateInfo && (
        <div className="card" style={{ borderLeft: '4px solid #e53935' }}>
          <div style={{ color: '#e53935', fontWeight: '600', marginBottom: '8px' }}>
            ⚠️ 此条为重复上报
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            原始上报：{fault.duplicateInfo.report_no}，
            上报人：{fault.duplicateInfo.reporter}，
            时间：{fault.duplicateInfo.report_time}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div className="card">
            <h3 className="section-title">故障信息</h3>
            <div className="detail-row">
              <div className="detail-label">故障编号</div>
              <div className="detail-value">{fault.report_no}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">故障类型</div>
              <div className="detail-value">
                <span className="tag">{fault.fault_type_text}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">严重程度</div>
              <div className="detail-value">
                <span className={`badge badge-${fault.fault_level}`}>
                  {fault.fault_level_text}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">故障描述</div>
              <div className="detail-value">{fault.description || '无'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">上报人</div>
              <div className="detail-value">{fault.reporter}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">上报时间</div>
              <div className="detail-value">{fault.report_time}</div>
            </div>
            {fault.task_id && (
              <div className="detail-row">
                <div className="detail-label">关联巡检</div>
                <div className="detail-value">
                  <Link to={`/inspection-tasks/${fault.task_id}`} className="link">
                    查看巡检任务
                  </Link>
                </div>
              </div>
            )}
          </div>

          {fault.taskInfo && (
            <div className="card" style={{ borderLeft: '4px solid #1565c0' }}>
              <h3 className="section-title">巡检任务上下文</h3>
              <div className="detail-row">
                <div className="detail-label">任务编号</div>
                <div className="detail-value">
                  <Link to={`/inspection-tasks/${fault.taskInfo.id}`} className="link">
                    {fault.taskInfo.task_no}
                  </Link>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">巡检区域</div>
                <div className="detail-value">{fault.taskInfo.area}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">巡检路线</div>
                <div className="detail-value">{fault.taskInfo.route}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">巡检员</div>
                <div className="detail-value">{fault.taskInfo.inspector}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">任务状态</div>
                <div className="detail-value">
                  <span className={`badge badge-${fault.taskInfo.status}`}>
                    {fault.taskInfo.status_text}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="section-title">位置信息</h3>
            <div className="detail-row">
              <div className="detail-label">位置描述</div>
              <div className="detail-value">{fault.location}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">经纬度</div>
              <div className="detail-value">{fault.lat}, {fault.lng}</div>
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>现场照片</label>
              <div className="photo-placeholder">
                <div className="icon">📷</div>
                <div>照片占位 - {fault.photo_placeholder}</div>
              </div>
            </div>
          </div>

          {fault.duplicates && fault.duplicates.length > 0 && (
            <div className="card">
              <h3 className="section-title">重复上报记录 ({fault.duplicates.length} 条)</h3>
              <table>
                <thead>
                  <tr>
                    <th>上报编号</th>
                    <th>上报人</th>
                    <th>上报时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {fault.duplicates.map(d => (
                    <tr key={d.id}>
                      <td>{d.report_no}</td>
                      <td>{d.reporter}</td>
                      <td>{d.report_time}</td>
                      <td>
                        <Link to={`/faults/${d.id}`} className="link">查看</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h3 className="section-title">关联车辆</h3>
            {fault.bike ? (
              <>
                <div className="detail-row">
                  <div className="detail-label">车辆编号</div>
                  <div className="detail-value">
                    <Link to={`/bikes/${fault.bike.id}`} className="link">
                      {fault.bike.bike_no}
                    </Link>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">车辆状态</div>
                  <div className="detail-value">
                    <span className={`badge badge-${fault.bike.status}`}>
                      {fault.bike.status === 'normal' ? '正常' : fault.bike.status === 'fault' ? '故障' : '维修中'}
                    </span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">所属区域</div>
                  <div className="detail-value">{fault.bike.area}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">停放位置</div>
                  <div className="detail-value">{fault.bike.location}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">最近巡检</div>
                  <div className="detail-value">{fault.bike.last_inspection_date || '-'}</div>
                </div>
              </>
            ) : (
              <div className="empty">无车辆信息</div>
            )}
          </div>

          {fault.repair_decision && (
            <div className="card">
              <h3 className="section-title">调度决策</h3>
              <div className="detail-row">
                <div className="detail-label">维修方式</div>
                <div className="detail-value">
                  <span className="tag">{fault.repair_decision_text}</span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">调度员</div>
                <div className="detail-value">{fault.dispatcher}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">派单时间</div>
                <div className="detail-value">{fault.dispatch_time}</div>
              </div>
            </div>
          )}

          {fault.repair && (
            <div className="card">
              <h3 className="section-title">维修去向</h3>
              <div className="detail-row">
                <div className="detail-label">维修单号</div>
                <div className="detail-value">
                  <Link to={`/repairs/${fault.repair.id}`} className="link">
                    {fault.repair.repair_no}
                  </Link>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">维修类型</div>
                <div className="detail-value">{fault.repair.repair_type_text}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">维修地点</div>
                <div className="detail-value">{fault.repair.repair_location || '-'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">维修员</div>
                <div className="detail-value">{fault.repair.repairer || '待分配'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">维修状态</div>
                <div className="detail-value">
                  <span className={`badge badge-${fault.repair.status}`}>
                    {fault.repair.status === 'pending' ? '待处理' : fault.repair.status === 'in_progress' ? '进行中' : '已完成'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="section-title">处理时间线</h3>
            <ul className="timeline">
              {getTimeline().map((event, index) => (
                <li key={index}>
                  <div className="timeline-time">{event.time}</div>
                  <div className="timeline-content">{event.content}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <Link to="/faults" className="btn btn-default">← 返回列表</Link>
      </div>

      {showDispatchModal && (
        <div className="modal-mask" onClick={() => setShowDispatchModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>调度派单</h3>
              <button className="modal-close" onClick={() => setShowDispatchModal(false)}>×</button>
            </div>
            <form onSubmit={handleDispatch}>
              <div className="modal-body">
                <div className="form-group">
                  <label>维修方式 *</label>
                  <select
                    value={dispatchData.repair_decision}
                    onChange={e => setDispatchData({ ...dispatchData, repair_decision: e.target.value })}
                  >
                    <option value="">请选择维修方式</option>
                    <option value="on_site_repair">就地维修</option>
                    <option value="pull_back">拉回维修中心</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>调度员</label>
                  <input
                    type="text"
                    value={dispatchData.dispatcher}
                    onChange={e => setDispatchData({ ...dispatchData, dispatcher: e.target.value })}
                  />
                </div>
                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', fontSize: '13px', color: '#666' }}>
                  <div style={{ marginBottom: '6px' }}>📋 故障信息</div>
                  <div>车辆：{fault.bike_no}</div>
                  <div>类型：{fault.fault_type_text}</div>
                  <div>位置：{fault.location}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowDispatchModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认派单</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FaultDetail
