import React, { useState, useEffect } from 'react'
import { api } from '../utils/api.js'

function Statistics() {
  const [overview, setOverview] = useState(null)
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [overviewRes, hotspotsRes] = await Promise.all([
      api.getOverview(),
      api.getHotspots()
    ])
    if (overviewRes.success) setOverview(overviewRes.data)
    if (hotspotsRes.success) setHotspots(hotspotsRes.data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="card">
        <div className="empty">加载中...</div>
      </div>
    )
  }

  const maxFaultCount = overview?.areaStats?.length 
    ? Math.max(...overview.areaStats.map(a => a.fault_count)) 
    : 1

  return (
    <div>
      <div className="page-header">
        <h2>📊 区域统计</h2>
      </div>

      <div className="tabs">
        <div 
          className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          总览数据
        </div>
        <div 
          className={`tab-item ${activeTab === 'hotspots' ? 'active' : ''}`}
          onClick={() => setActiveTab('hotspots')}
        >
          高发故障点
        </div>
        <div 
          className={`tab-item ${activeTab === 'areastats' ? 'active' : ''}`}
          onClick={() => setActiveTab('areastats')}
        >
          区域对比
        </div>
      </div>

      {activeTab === 'overview' && overview && (
        <>
          <div className="stat-grid">
            <div className="stat-card blue">
              <div className="stat-icon">🚲</div>
              <div className="stat-label">车辆总数</div>
              <div className="stat-value">{overview.bikes.total}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-label">正常车辆</div>
              <div className="stat-value">{overview.bikes.normal}</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon">⚠️</div>
              <div className="stat-label">故障车辆</div>
              <div className="stat-value">{overview.bikes.fault}</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">🔧</div>
              <div className="stat-label">维修中</div>
              <div className="stat-value">{overview.bikes.repairing}</div>
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat-card orange">
              <div className="stat-icon">📅</div>
              <div className="stat-label">今日新增故障</div>
              <div className="stat-value">{overview.faults.today}</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">📋</div>
              <div className="stat-label">故障总数</div>
              <div className="stat-value">{overview.faults.total}</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">🔄</div>
              <div className="stat-label">重复上报</div>
              <div className="stat-value">{overview.faults.duplicates}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">✔️</div>
              <div className="stat-label">已完成维修</div>
              <div className="stat-value">{overview.repairs.completed}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card">
              <div className="card-header">
                <h3>故障类型分布</h3>
              </div>
              <div className="fault-type-list">
                {overview.faultTypeStats && overview.faultTypeStats.map((item, index) => (
                  <div key={index} className="fault-type-item">
                    <span className="type-name">
                      <span style={{ display: 'inline-block', width: '20px' }}>{index + 1}.</span>
                      {item.fault_type_text}
                    </span>
                    <span className="type-count">{item.count} 起</span>
                  </div>
                ))}
                {(!overview.faultTypeStats || overview.faultTypeStats.length === 0) && (
                  <div className="empty">暂无数据</div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>维修进度</h3>
              </div>
              <div className="fault-type-list">
                <div className="fault-type-item">
                  <span className="type-name">待处理</span>
                  <span className="type-count" style={{ color: '#9c27b0' }}>
                    {overview.repairs.pending} 单
                  </span>
                </div>
                <div className="fault-type-item">
                  <span className="type-name">进行中</span>
                  <span className="type-count" style={{ color: '#1565c0' }}>
                    {overview.repairs.in_progress} 单
                  </span>
                </div>
                <div className="fault-type-item">
                  <span className="type-name">已完成</span>
                  <span className="type-count" style={{ color: '#388e3c' }}>
                    {overview.repairs.completed} 单
                  </span>
                </div>
                <div className="fault-type-item">
                  <span className="type-name">总计</span>
                  <span className="type-count">
                    {overview.repairs.total} 单
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'hotspots' && (
        <div className="card">
          <div className="card-header">
            <h3>🔥 高发故障点 TOP 10</h3>
            <span style={{ fontSize: '13px', color: '#999' }}>按故障数量排序</span>
          </div>
          <div className="hotspot-list">
            {hotspots.map((spot, index) => (
              <div key={index} className="hotspot-item">
                <div className="hotspot-location">
                  <span style={{ 
                    display: 'inline-block', 
                    width: '24px', 
                    height: '24px', 
                    background: index < 3 ? '#e53935' : '#ff9800',
                    color: '#fff',
                    borderRadius: '50%',
                    textAlign: 'center',
                    lineHeight: '24px',
                    fontSize: '12px',
                    marginRight: '8px'
                  }}>
                    {index + 1}
                  </span>
                  {spot.location}
                </div>
                <div className="hotspot-count">
                  累计 {spot.fault_count} 起故障
                </div>
                <div className="hotspot-types">
                  故障类型：{spot.fault_type_list.join('、')}
                </div>
                <div style={{ fontSize: '12px', color: '#bbb', marginTop: '4px' }}>
                  坐标：{spot.lat}, {spot.lng}
                </div>
              </div>
            ))}
            {hotspots.length === 0 && (
              <div className="empty">暂无数据</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'areastats' && overview && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3>各区域车辆数</h3>
            </div>
            <div className="area-bar-chart">
              {overview.areaStats && overview.areaStats.map((area, index) => (
                <div key={index} className="area-bar-item">
                  <div className="area-bar-name">{area.area}</div>
                  <div className="area-bar">
                    <div 
                      className="area-bar-fill" 
                      style={{ 
                        width: `${(area.bike_count / Math.max(...overview.areaStats.map(a => a.bike_count))) * 100}%`,
                        background: 'linear-gradient(90deg, #43a047, #81c784)'
                      }}
                    ></div>
                  </div>
                  <div className="area-bar-value">{area.bike_count} 辆</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>各区域故障数</h3>
            </div>
            <div className="area-bar-chart">
              {overview.areaStats && overview.areaStats.map((area, index) => (
                <div key={index} className="area-bar-item">
                  <div className="area-bar-name">{area.area}</div>
                  <div className="area-bar">
                    <div 
                      className="area-bar-fill" 
                      style={{ 
                        width: `${(area.fault_count / maxFaultCount) * 100}%`,
                        background: 'linear-gradient(90deg, #e53935, #ef9a9a)'
                      }}
                    ></div>
                  </div>
                  <div className="area-bar-value" style={{ color: '#e53935' }}>
                    {area.fault_count} 起
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <h3>区域详细数据</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>区域</th>
                  <th>车辆数</th>
                  <th>故障数</th>
                  <th>故障率</th>
                  <th>故障密度排名</th>
                </tr>
              </thead>
              <tbody>
                {overview.areaStats && overview.areaStats
                  .map((area, index) => ({
                    ...area,
                    rate: area.bike_count > 0 ? ((area.fault_count / area.bike_count) * 100).toFixed(2) : 0
                  }))
                  .sort((a, b) => b.fault_count - a.fault_count)
                  .map((area, index) => (
                    <tr key={index}>
                      <td>
                        {index < 3 ? (
                          <span style={{ 
                            color: index === 0 ? '#ffc107' : index === 1 ? '#9e9e9e' : '#ff9800',
                            fontWeight: '600'
                          }}>
                            {index + 1}
                          </span>
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td>{area.area}</td>
                      <td>{area.bike_count} 辆</td>
                      <td style={{ color: '#e53935', fontWeight: '500' }}>
                        {area.fault_count} 起
                      </td>
                      <td>{area.rate}%</td>
                      <td>
                        {parseFloat(area.rate) > 15 ? (
                          <span className="badge badge-serious">偏高</span>
                        ) : parseFloat(area.rate) > 10 ? (
                          <span className="badge badge-medium">中等</span>
                        ) : (
                          <span className="badge badge-minor">正常</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics
