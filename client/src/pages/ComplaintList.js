import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDate, getRoleLabel } from '../utils';
import StatusModal from '../components/StatusModal';
import CreateComplaintModal from '../components/CreateComplaintModal';
import StatusStats from '../components/StatusStats';

const COMPLAINT_TYPES = {
  billing_quantity: '计费数量异议',
  bottle_damage: '奶瓶损坏',
  bottle_return: '回瓶数量争议',
  delivery_quality: '配送质量问题',
  pricing_issue: '价格问题',
  other: '其他'
};

const DEFAULT_STATUS_LABELS = {
  pending: '待处理',
  processing: '处理中',
  returned: '已退回',
  supplement_needed: '待补材料',
  closed: '已关闭',
  urged: '有人催'
};

const DEFAULT_ROLE_LABELS = {
  clerk: '站点文员',
  delivery: '配送员',
  customer_service: '客服'
};

function ComplaintList({ constants, loading: constantsLoading }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState({ status: '', type: '', customerName: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchAction, setBatchAction] = useState(null);
  const [prefillBill, setPrefillBill] = useState(null);

  const { statusLabels: STATUS_LABELS = DEFAULT_STATUS_LABELS, roleLabels: ROLE_LABELS = DEFAULT_ROLE_LABELS } = constants || {};

  useEffect(() => {
    if (location.state?.fromBill) {
      setPrefillBill(location.state.fromBill);
      setShowCreateModal(true);
    }
  }, [location.state]);

  const fetchComplaints = () => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams(filters);
    fetch(`/api/complaints?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setComplaints(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('加载申诉列表失败:', err);
        setLoadError(err.message);
        setComplaints([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(complaints.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchUpdate = (action) => {
    setBatchAction(action);
    setShowStatusModal(true);
  };

  const confirmBatchUpdate = async ({ newStatus, remark }) => {
    const res = await fetch('/api/complaints/batch-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: selectedIds,
        newStatus,
        remark,
        operator: '张客服',
        operatorRole: 'customer_service'
      })
    });
    
    if (res.ok) {
      setSelectedIds([]);
      setShowStatusModal(false);
      fetchComplaints();
    }
  };

  const handleCreateComplaint = (complaintData) => {
    fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintData)
    }).then(() => {
      setShowCreateModal(false);
      setPrefillBill(null);
      fetchComplaints();
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2>📝 客户申诉</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 新建申诉
        </button>
      </div>

      <div className="card">
        {!loadError && (
          <StatusStats
            data={complaints}
            statusLabels={STATUS_LABELS}
            activeStatus={filters.status}
            onStatusClick={(status) => setFilters({ ...filters, status })}
            onClearFilter={() => setFilters({ ...filters, status: '' })}
          />
        )}
        
        <div className="filter-bar">
          <select 
            value={filters.status} 
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select 
            value={filters.type} 
            onChange={e => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">全部类型</option>
            {Object.entries(COMPLAINT_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <input 
            type="text" 
            placeholder="搜索客户姓名" 
            value={filters.customerName}
            onChange={e => setFilters({ ...filters, customerName: e.target.value })}
          />
          
          <button className="btn btn-default" onClick={() => setFilters({ status: '', type: '', customerName: '' })}>
            重置筛选
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="batch-bar">
            <span>已选择 {selectedIds.length} 项</span>
            <button className="btn btn-sm btn-success" onClick={() => handleBatchUpdate('process')}>
              批量处理
            </button>
            <button className="btn btn-sm btn-warning" onClick={() => handleBatchUpdate('supplement')}>
              批量要求补材料
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => handleBatchUpdate('close')}>
              批量关闭
            </button>
            <button className="btn btn-sm btn-default" onClick={() => setSelectedIds([])}>
              取消选择
            </button>
          </div>
        )}

        {loadError && (
          <div style={{ 
            padding: '16px', 
            background: '#ffebee', 
            border: '1px solid #ef9a9a', 
            borderRadius: '8px', 
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ color: '#c62828', fontWeight: 500 }}>❌ 数据加载失败</span>
              <span style={{ color: '#e57373', marginLeft: '8px' }}>({loadError})</span>
            </div>
            <button className="btn btn-sm btn-default" onClick={fetchComplaints}>
              🔄 重试
            </button>
          </div>
        )}

        {loading && !loadError ? (
          <div className="empty-state">
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⏳</div>
            <div style={{ fontSize: '14px', color: '#666' }}>正在加载申诉数据...</div>
          </div>
        ) : !loadError ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === complaints.length && complaints.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>申诉编号</th>
                  <th>关联账单</th>
                  <th>客户姓名</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>当前处理人</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state">暂无数据</td>
                  </tr>
                ) : (
                  complaints.map(complaint => (
                    <tr key={complaint.id}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(complaint.id)}
                          onChange={() => handleSelect(complaint.id)}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{complaint.complaintNo}</td>
                      <td>
                        {complaint.billNo ? (
                          <button 
                            className="link-btn"
                            onClick={() => navigate(`/bills/${complaint.billId}`)}
                          >
                            {complaint.billNo}
                          </button>
                        ) : '-'}
                      </td>
                      <td>{complaint.customerName}</td>
                      <td>{complaint.typeLabel}</td>
                      <td>
                        <span className={`status-badge status-${complaint.status}`}>
                          {STATUS_LABELS[complaint.status]}
                        </span>
                      </td>
                      <td>
                        {complaint.currentHandler ? (
                          <div className="assignee-info">
                            <span className="assignee-avatar">{complaint.currentHandler.charAt(0)}</span>
                            <div>
                              <div>{complaint.currentHandler}</div>
                              <span className="assignee-role">
                                {getRoleLabel(complaint.currentHandlerRole, ROLE_LABELS)}
                              </span>
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#888' }}>
                        {formatDate(complaint.updatedAt)}
                      </td>
                      <td>
                        <button 
                          className="link-btn" 
                          onClick={() => navigate(`/complaints/${complaint.id}`)}
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {showStatusModal && (
        <StatusModal
          title={`批量${batchAction === 'process' ? '处理' : batchAction === 'supplement' ? '要求补材料' : '关闭'}`}
          constants={constants}
          defaultStatus={
            batchAction === 'process' ? 'processing' :
            batchAction === 'supplement' ? 'supplement_needed' : 'closed'
          }
          onConfirm={confirmBatchUpdate}
          onCancel={() => setShowStatusModal(false)}
        />
      )}

      {showCreateModal && (
        <CreateComplaintModal
          constants={constants}
          prefillBill={prefillBill}
          onConfirm={handleCreateComplaint}
          onCancel={() => {
            setShowCreateModal(false);
            setPrefillBill(null);
          }}
        />
      )}
    </div>
  );
}

export default ComplaintList;
