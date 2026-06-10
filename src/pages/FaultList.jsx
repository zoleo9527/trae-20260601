import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api.js'

function FaultList() {
  const [faults, setFaults] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [faultTypeFilter, setFaultTypeFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [faultTypes, setFaultTypes] = useState([])
  const [areas, setAreas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    bike_no: '',
    fault_type: '',
    fault_level: '',
    description: '',
    location: '',
    lat: '',
    lng: '',
    reporter: '巡检员'
  })

  useEffect(() => {
    loadDicts()
    loadFaults()
  }, [page, statusFilter, faultTypeFilter, areaFilter])

  const loadDicts = async () => {
    const [typesRes, areasRes] = await Promise.all([
      api.getFaultTypes(),
      api.getAreaList()
    ])
    if (typesRes.success) setFaultTypes(typesRes.data)
    if (areasRes.success) setAreas(areasRes.data)
  }

  const loadFaults = async () => {
    setLoading(true)
    const res = await api.getFaults({
      status: statusFilter,
      faultType: faultTypeFilter,
      area: areaFilter,
      page,
      pageSize
    })
    if (res.success) {
      setFaults(res.data)
      setTotal(res.total)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bike_no || !formData.fault_type || !formData.fault_level || !formData.location || !formData.lat || !formData.lng) {
      alert('请填写完整信息')
      return
    }
    const res = await api.createFault(formData)
    if (res.success) {
      alert('上报成功')
      setShowModal(false)
      setFormData({
        bike_no: '',
        fault_type: '',
        fault_level: '',
        description: '',
        location: '',
        lat: '',
        lng: '',
        reporter: '巡检员'
      })
      loadFaults()
    } else {
      alert(res.message || '上报失败')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="page-header">
        <h2>⚠️ 故障上报</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 上报故障
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label>状态：</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">全部</option>
              <option value="reported">已上报</option>
              <option value="dispatched">已派单</option>
              <option value="repairing">维修中</option>
              <option value="repaired">已修复</option>
            </select>
          </div>
          <div className="filter-item">
            <label>故障类型：</label>
            <select value={faultTypeFilter} onChange={e => { setFaultTypeFilter(e.target.value); setPage(1); }}>
              <option value="all">全部</option>
              {faultTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
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
                  <th>故障编号</th>
                  <th>车辆编号</th>
                  <th>故障类型</th>
                  <th>严重程度</th>
                  <th>位置</th>
                  <th>上报人</th>
                  <th>上报时间</th>
                  <th>状态</th>
                  <th>是否重复</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {faults.map(fault => (
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
                    <td>{fault.reporter}</td>
                    <td>{fault.report_time}</td>
                    <td>
                      <span className={`badge badge-${fault.status}`}>
                        {fault.status_text}
                      </span>
                    </td>
                    <td>
                      {fault.is_duplicate ? (
                        <span className="badge badge-duplicate">重复上报</span>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>否</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/faults/${fault.id}`} className="link">
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
                {faults.length === 0 && (
                  <tr>
                    <td colSpan="10" className="empty">暂无数据</td>
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

      {showModal && (
        <div className="modal-mask" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上报故障</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>车辆编号 *</label>
                    <input
                      type="text"
                      value={formData.bike_no}
                      onChange={e => setFormData({ ...formData, bike_no: e.target.value })}
                      placeholder="请输入车辆编号，如 BK001001"
                    />
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
                  <label>故障描述</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请详细描述故障情况，不能只写“坏了”"
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
                  <label>照片</label>
                  <div className="photo-placeholder">
                    <div className="icon">📷</div>
                    <div>照片占位 (点击上传)</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交上报</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FaultList
