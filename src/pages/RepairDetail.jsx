import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api.js'

function RepairDetail() {
  const { id } = useParams()
  const [repair, setRepair] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completeData, setCompleteData] = useState({
    repairer: '',
    parts_used: '',
    cost: '',
    result: ''
  })

  useEffect(() => {
    loadRepair()
  }, [id])

  const loadRepair = async () => {
    setLoading(true)
    const res = await api.getRepair(id)
    if (res.success) {
      setRepair(res.data)
    }
    setLoading(false)
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    if (!completeData.repairer || !completeData.result) {
      alert('请填写维修员和维修结果')
      return
    }
    const res = await api.completeRepair(id, {
      ...completeData,
      cost: parseFloat(completeData.cost) || 0
    })
    if (res.success) {
      alert('维修完成')
      setShowCompleteModal(false)
      loadRepair()
    } else {
      alert(res.message || '操作失败')
    }
  }

  const getStatusText = (status) => {
    const map = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成'
    }
    return map[status] || status
  }

  if (loading) {
    return <div className="card"><div className="empty">加载中...</div></div>
  }

  if (!repair) {
    return <div className="card"><div className="empty">维修记录不存在</div></div>
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/repairs">维修去向</Link>
        <span>/</span>
        <span>维修详情</span>
      </div>

      <div className="page-header">
        <h2>🔧 维修详情 - {repair.repair_no}</h2>
        <div>
          {repair.status === 'pending' && (
            <button className="btn btn-primary" onClick={() => {
              setCompleteData({
                repairer: '',
                parts_used: repair.parts_used || '',
                cost: repair.cost || '',
                result: ''
              })
              setShowCompleteModal(true)
            }}>
              开始维修
            </button>
          )}
          {repair.status === 'in_progress' && (
            <button className="btn btn-success" onClick={() => {
              setCompleteData({
                repairer: repair.repairer || '',
                parts_used: repair.parts_used || '',
                cost: repair.cost || '',
                result: repair.result || ''
              })
              setShowCompleteModal(true)
            }}>
              完成维修
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div className="card">
            <h3 className="section-title">维修信息</h3>
            <div className="detail-row">
              <div className="detail-label">维修单号</div>
              <div className="detail-value">{repair.repair_no}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">维修类型</div>
              <div className="detail-value">
                <span className="tag">{repair.repair_type_text}</span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">维修状态</div>
              <div className="detail-value">
                <span className={`badge badge-${repair.status}`}>
                  {getStatusText(repair.status)}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">维修地点</div>
              <div className="detail-value">{repair.repair_location || '-'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">维修员</div>
              <div className="detail-value">{repair.repairer || '待分配'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">开始时间</div>
              <div className="detail-value">{repair.start_time || '未开始'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">结束时间</div>
              <div className="detail-value">{repair.end_time || '未结束'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">使用配件</div>
              <div className="detail-value">{repair.parts_used || '无'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">维修费用</div>
              <div className="detail-value">
                {repair.cost > 0 ? <span style={{ color: '#e53935', fontWeight: '600' }}>¥{repair.cost}</span> : '待核算'}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">维修结果</div>
              <div className="detail-value">{repair.result || '-'}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="section-title">关联车辆</h3>
            {repair.bike ? (
              <>
                <div className="detail-row">
                  <div className="detail-label">车辆编号</div>
                  <div className="detail-value">
                    <Link to={`/bikes/${repair.bike.id}`} className="link">
                      {repair.bike.bike_no}
                    </Link>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">所在区域</div>
                  <div className="detail-value">{repair.bike.area}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">停放位置</div>
                  <div className="detail-value">{repair.bike.location}</div>
                </div>
              </>
            ) : (
              <div className="empty">无车辆信息</div>
            )}
          </div>

          <div className="card">
            <h3 className="section-title">故障信息</h3>
            {repair.fault ? (
              <>
                <div className="detail-row">
                  <div className="detail-label">故障编号</div>
                  <div className="detail-value">
                    <Link to={`/faults/${repair.fault.id}`} className="link">
                      {repair.fault.report_no}
                    </Link>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">故障类型</div>
                  <div className="detail-value">
                    <span className="tag">{repair.fault.fault_type_text}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">严重程度</div>
                  <div className="detail-value">
                    <span className={`badge badge-${repair.fault.fault_level}`}>
                      {repair.fault.fault_level_text}
                    </span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">故障描述</div>
                  <div className="detail-value" style={{ fontSize: '12px' }}>
                    {repair.fault.description || '无'}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty">无故障信息</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <Link to="/repairs" className="btn btn-default">← 返回列表</Link>
      </div>

      {showCompleteModal && (
        <div className="modal-mask" onClick={() => setShowCompleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>维修记录</h3>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}>×</button>
            </div>
            <form onSubmit={handleComplete}>
              <div className="modal-body">
                <div className="form-group">
                  <label>维修员 *</label>
                  <input
                    type="text"
                    value={completeData.repairer}
                    onChange={e => setCompleteData({ ...completeData, repairer: e.target.value })}
                    placeholder="请输入维修员姓名"
                  />
                </div>
                <div className="form-group">
                  <label>使用配件</label>
                  <input
                    type="text"
                    value={completeData.parts_used}
                    onChange={e => setCompleteData({ ...completeData, parts_used: e.target.value })}
                    placeholder="如：刹车线1根, 刹车片1副"
                  />
                </div>
                <div className="form-group">
                  <label>维修费用 (元)</label>
                  <input
                    type="number"
                    value={completeData.cost}
                    onChange={e => setCompleteData({ ...completeData, cost: e.target.value })}
                    placeholder="请输入维修费用"
                  />
                </div>
                <div className="form-group">
                  <label>维修结果 *</label>
                  <textarea
                    value={completeData.result}
                    onChange={e => setCompleteData({ ...completeData, result: e.target.value })}
                    placeholder="请描述维修结果"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowCompleteModal(false)}>取消</button>
                <button type="submit" className="btn btn-success">确认完成</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RepairDetail
