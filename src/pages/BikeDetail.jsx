import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
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

const faultLevelMap = {
  minor: '轻微',
  medium: '中等',
  serious: '严重'
}

const faultStatusMap = {
  reported: '已上报',
  dispatched: '已派单',
  repairing: '维修中',
  repaired: '已修复'
}

function BikeDetail() {
  const { id } = useParams()
  const [bike, setBike] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBike()
  }, [id])

  const loadBike = async () => {
    setLoading(true)
    const res = await api.getBike(id)
    if (res.success) {
      setBike(res.data)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="card"><div className="empty">加载中...</div></div>
  }

  if (!bike) {
    return <div className="card"><div className="empty">车辆不存在</div></div>
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/bikes">车辆列表</Link>
        <span>/</span>
        <span>车辆详情</span>
      </div>

      <div className="page-header">
        <h2>🚲 车辆详情 - {bike.bike_no}</h2>
        <span className={`badge badge-${bike.status}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
          {bike.status_text}
        </span>
      </div>

      <div className="card">
        <h3 className="section-title">基本信息</h3>
        <div className="detail-row">
          <div className="detail-label">车辆编号</div>
          <div className="detail-value">{bike.bike_no}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">车辆状态</div>
          <div className="detail-value">
            <span className={`badge badge-${bike.status}`}>{bike.status_text}</span>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-label">所在区域</div>
          <div className="detail-value">{bike.area}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">停放位置</div>
          <div className="detail-value">{bike.location}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">经纬度</div>
          <div className="detail-value">{bike.lat}, {bike.lng}</div>
        </div>
        <div className="detail-row">
          <div className="detail-label">上次巡检</div>
          <div className="detail-value">{bike.last_inspection_date || '暂无记录'}</div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">故障记录</h3>
        {bike.faults && bike.faults.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>故障编号</th>
                <th>故障类型</th>
                <th>严重程度</th>
                <th>上报时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {bike.faults.map(fault => (
                <tr key={fault.id}>
                  <td>{fault.report_no}</td>
                  <td>{faultTypeMap[fault.fault_type] || fault.fault_type}</td>
                  <td>
                    <span className={`badge badge-${fault.fault_level}`}>
                      {faultLevelMap[fault.fault_level] || fault.fault_level}
                    </span>
                  </td>
                  <td>{fault.report_time}</td>
                  <td>
                    <span className={`badge badge-${fault.status}`}>
                      {faultStatusMap[fault.status] || fault.status}
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
        <Link to="/bikes" className="btn btn-default">← 返回列表</Link>
      </div>
    </div>
  )
}

export default BikeDetail
