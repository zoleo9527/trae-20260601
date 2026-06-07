import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, getRoleLabel, formatMoney } from '../utils';
import StatusModal from '../components/StatusModal';
import CreateBillModal from '../components/CreateBillModal';
import StatusStats from '../components/StatusStats';

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

function BillList({ constants, loading: constantsLoading }) {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState({ status: '', month: '', customerName: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchAction, setBatchAction] = useState(null);

  const { statusLabels: STATUS_LABELS = DEFAULT_STATUS_LABELS, roleLabels: ROLE_LABELS = DEFAULT_ROLE_LABELS } = constants || {};

  const fetchBills = () => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams(filters);
    fetch(`/api/bills?${params}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setBills(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('加载账单列表失败:', err);
        setLoadError(err.message);
        setBills([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBills();
  }, [filters]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(bills.map(b => b.id));
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
    const res = await fetch('/api/bills/batch-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: selectedIds,
        newStatus,
        remark,
        operator: '王文员',
        operatorRole: 'clerk'
      })
    });
    
    if (res.ok) {
      setSelectedIds([]);
      setShowStatusModal(false);
      fetchBills();
    }
  };

  const handleCreateBill = (billData) => {
    fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    }).then(() => {
      setShowCreateModal(false);
      fetchBills();
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2>📋 月结账单</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 新建账单
        </button>
      </div>

      <div className="card">
        {!loadError && (
          <StatusStats
            data={bills}
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
          
          <input 
            type="month" 
            value={filters.month}
            onChange={e => setFilters({ ...filters, month: e.target.value })}
            placeholder="月份"
          />
          
          <input 
            type="text" 
            placeholder="搜索客户姓名" 
            value={filters.customerName}
            onChange={e => setFilters({ ...filters, customerName: e.target.value })}
          />
          
          <button className="btn btn-default" onClick={() => setFilters({ status: '', month: '', customerName: '' })}>
            重置筛选
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="batch-bar">
            <span>已选择 {selectedIds.length} 项</span>
            <button className="btn btn-sm btn-success" onClick={() => handleBatchUpdate('process')}>
              批量处理
            </button>
            <button className="btn btn-sm btn-warning" onClick={() => handleBatchUpdate('urge')}>
              批量标记催促
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
            <button className="btn btn-sm btn-default" onClick={fetchBills}>
              🔄 重试
            </button>
          </div>
        )}

        {loading && !loadError ? (
          <div className="empty-state">
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⏳</div>
            <div style={{ fontSize: '14px', color: '#666' }}>正在加载账单数据...</div>
          </div>
        ) : !loadError ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === bills.length && bills.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>账单编号</th>
                  <th>客户姓名</th>
                  <th>月份</th>
                  <th>路线</th>
                  <th>配送员</th>
                  <th>金额</th>
                  <th>回瓶</th>
                  <th>状态</th>
                  <th>当前处理人</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="empty-state">暂无数据</td>
                  </tr>
                ) : (
                  bills.map(bill => (
                    <tr key={bill.id}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(bill.id)}
                          onChange={() => handleSelect(bill.id)}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{bill.billNo}</td>
                      <td>{bill.customerName}</td>
                      <td>{bill.month}</td>
                      <td>{bill.route}</td>
                      <td>{bill.deliveryPerson}</td>
                      <td className="amount-highlight">{formatMoney(bill.totalAmount)}</td>
                      <td>
                        已退: {bill.bottleReturned} / 待退: {bill.bottlePending}
                      </td>
                      <td>
                        <span className={`status-badge status-${bill.status}`}>
                          {STATUS_LABELS[bill.status]}
                        </span>
                      </td>
                      <td>
                        {bill.currentHandler ? (
                          <div className="assignee-info">
                            <span className="assignee-avatar">{bill.currentHandler.charAt(0)}</span>
                            <div>
                              <div>{bill.currentHandler}</div>
                              <span className="assignee-role">
                                {getRoleLabel(bill.currentHandlerRole, ROLE_LABELS)}
                              </span>
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#888' }}>
                        {formatDate(bill.updatedAt)}
                      </td>
                      <td>
                        <button 
                          className="link-btn" 
                          onClick={() => navigate(`/bills/${bill.id}`)}
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
          title={`批量${batchAction === 'process' ? '处理' : batchAction === 'urge' ? '催促' : '关闭'}`}
          constants={constants}
          defaultStatus={
            batchAction === 'process' ? 'processing' :
            batchAction === 'urge' ? 'urged' : 'closed'
          }
          onConfirm={confirmBatchUpdate}
          onCancel={() => setShowStatusModal(false)}
        />
      )}

      {showCreateModal && (
        <CreateBillModal
          constants={constants}
          onConfirm={handleCreateBill}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default BillList;
