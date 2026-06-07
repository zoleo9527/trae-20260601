import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDate, getRoleLabel, formatMoney } from '../utils';
import HistoryList from '../components/HistoryList';
import StatusModal from '../components/StatusModal';

function BillDetail({ constants }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null);

  const fetchBill = () => {
    setLoading(true);
    fetch(`/api/bills/${id}`)
      .then(res => res.json())
      .then(data => {
        setBill(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBill();
  }, [id]);

  const handleStatusUpdate = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async ({ newStatus, remark }) => {
    const actionMap = {
      process: '开始处理',
      return: '退回',
      supplement: '要求补材料',
      urge: '催促',
      close: '关闭',
      assign: '分配处理'
    };

    const res = await fetch(`/api/bills/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: actionMap[statusAction] || '状态更新',
        newStatus,
        remark,
        operator: '王文员',
        operatorRole: 'clerk'
      })
    });
    
    if (res.ok) {
      setShowStatusModal(false);
      fetchBill();
    }
  };

  const handleCreateComplaint = () => {
    navigate('/complaints', {
      state: {
        fromBill: {
          id: bill.id,
          billNo: bill.billNo,
          customerName: bill.customerName,
          customerPhone: bill.customerPhone,
          address: bill.address
        }
      }
    });
  };

  if (!constants || !constants.STATUS_LABELS || loading) {
    return <div className="empty-state">加载中...</div>;
  }

  if (!bill) {
    return <div className="empty-state">账单不存在</div>;
  }

  const { STATUS_LABELS = {}, ROLE_LABELS = {} } = constants;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/bills">月结账单</Link>
        <span className="separator">/</span>
        <span className="current">{bill.billNo}</span>
      </div>

      <div className="page-header">
        <div>
          <h2>
            {bill.billNo} - {bill.customerName}
            <span 
              className={`status-badge status-${bill.status}`} 
              style={{ marginLeft: '12px' }}
            >
              {STATUS_LABELS[bill.status]}
            </span>
          </h2>
          <p style={{ color: '#888', marginTop: '4px' }}>
            月份：{bill.month} | 创建时间：{formatDate(bill.createdAt)}
          </p>
        </div>
        <div className="action-bar">
          {bill.status !== 'closed' && (
            <>
              <button className="btn btn-success" onClick={() => handleStatusUpdate('process')}>
                开始处理
              </button>
              <button className="btn btn-warning" onClick={() => handleStatusUpdate('return')}>
                退回
              </button>
              <button className="btn btn-warning" onClick={() => handleStatusUpdate('supplement')}>
                要求补材料
              </button>
              <button className="btn btn-danger" onClick={() => handleStatusUpdate('urge')}>
                标记催促
              </button>
              <button className="btn btn-primary" onClick={handleCreateComplaint}>
                发起申诉
              </button>
              <button className="btn btn-default" onClick={() => handleStatusUpdate('close')}>
                关闭
              </button>
            </>
          )}
          <button className="btn btn-default" onClick={() => navigate('/bills')}>
            返回列表
          </button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          基本信息
        </button>
        <button 
          className={`tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          关联申诉 ({bill.relatedComplaints?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          处理历史
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <h3 className="section-title">客户信息</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">客户姓名</span>
              <span className="detail-value">{bill.customerName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">联系电话</span>
              <span className="detail-value">{bill.customerPhone}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">配送地址</span>
              <span className="detail-value">{bill.address}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">配送路线</span>
              <span className="detail-value">{bill.route}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">配送员</span>
              <span className="detail-value">{bill.deliveryPerson}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账单月份</span>
              <span className="detail-value">{bill.month}</span>
            </div>
          </div>

          <h3 className="section-title" style={{ marginTop: '24px' }}>费用明细</h3>
          <table className="milk-types-table">
            <thead>
              <tr>
                <th>奶品名称</th>
                <th>数量</th>
                <th>单价</th>
                <th>金额</th>
              </tr>
            </thead>
            <tbody>
              {bill.milkTypes?.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.price)}</td>
                  <td>{formatMoney(item.amount)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600 }}>合计</td>
                <td className="amount-highlight">{formatMoney(bill.totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="section-title" style={{ marginTop: '24px' }}>回瓶情况</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">已退回瓶子数</span>
              <span className="detail-value">{bill.bottleReturned} 个</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">待退回瓶子数</span>
              <span className="detail-value">{bill.bottlePending} 个</span>
            </div>
          </div>

          <h3 className="section-title" style={{ marginTop: '24px' }}>处理信息</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">负责人</span>
              <span className="detail-value">
                {bill.assignee ? (
                  <div className="assignee-info">
                    <span className="assignee-avatar">{bill.assignee.charAt(0)}</span>
                    <div>
                      <div>{bill.assignee}</div>
                      <span className="assignee-role">
                        {getRoleLabel(bill.assigneeRole, ROLE_LABELS)}
                      </span>
                    </div>
                  </div>
                ) : '-'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">当前处理人</span>
              <span className="detail-value">
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
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">当前状态</span>
              <span className="detail-value">
                <span className={`status-badge status-${bill.status}`}>
                  {STATUS_LABELS[bill.status]}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">最后更新时间</span>
              <span className="detail-value">{formatDate(bill.updatedAt)}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="card">
          <h3 className="section-title">关联的客户申诉</h3>
          {!bill.relatedComplaints || bill.relatedComplaints.length === 0 ? (
            <div className="empty-state">
              暂无关联申诉
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={handleCreateComplaint}>
                  + 新建申诉
                </button>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>申诉编号</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>处理人</th>
                    <th>更新时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.relatedComplaints.map(complaint => (
                    <tr key={complaint.id}>
                      <td style={{ fontWeight: 500 }}>{complaint.complaintNo}</td>
                      <td>{complaint.typeLabel}</td>
                      <td>
                        <span className={`status-badge status-${complaint.status}`}>
                          {STATUS_LABELS[complaint.status]}
                        </span>
                      </td>
                      <td>{complaint.currentHandler || '-'}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3 className="section-title">处理历史记录</h3>
          <HistoryList history={bill.history} constants={constants} />
        </div>
      )}

      {showStatusModal && (
        <StatusModal
          title={`${statusAction === 'process' ? '开始处理' : 
                  statusAction === 'return' ? '退回' : 
                  statusAction === 'supplement' ? '要求补材料' : 
                  statusAction === 'urge' ? '标记催促' : '关闭'}`}
          constants={constants}
          defaultStatus={
            statusAction === 'process' ? 'processing' :
            statusAction === 'return' ? 'returned' :
            statusAction === 'supplement' ? 'supplement_needed' :
            statusAction === 'urge' ? 'urged' : 'closed'
          }
          onConfirm={confirmStatusUpdate}
          onCancel={() => setShowStatusModal(false)}
        />
      )}
    </div>
  );
}

export default BillDetail;
