import React, { useState, useEffect } from 'react';
import { getTickets, getExportUrl } from '../services/api';
import { GroupTicket, UserRole, GroupTicketStatus, STATUS_LABELS, ROLE_LABELS } from '../types';

interface TicketListPageProps {
  role: UserRole;
  onViewTicket: (ticketId: string) => void;
}

const TicketListPage: React.FC<TicketListPageProps> = ({ role, onViewTicket }) => {
  const [tickets, setTickets] = useState<GroupTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<GroupTicketStatus | ''>('');
  const [handlerFilter, setHandlerFilter] = useState<UserRole | ''>('');
  const [hasRejectFilter, setHasRejectFilter] = useState<'' | 'true' | 'false'>('');
  const [hasSupplementaryFilter, setHasSupplementaryFilter] = useState<'' | 'true' | 'false'>('');
  const [isOverdueFilter, setIsOverdueFilter] = useState<'' | 'true' | 'false'>('');
  const [isUrgentFilter, setIsUrgentFilter] = useState<'' | 'true' | 'false'>('');

  useEffect(() => {
    loadTickets();
  }, [role, statusFilter, handlerFilter, hasRejectFilter, hasSupplementaryFilter, isOverdueFilter, isUrgentFilter, keyword]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (handlerFilter) params.handler = handlerFilter;
      if (hasRejectFilter) params.hasReject = hasRejectFilter === 'true';
      if (hasSupplementaryFilter) params.hasSupplementary = hasSupplementaryFilter === 'true';
      if (isOverdueFilter) params.isOverdue = isOverdueFilter === 'true';
      if (isUrgentFilter) params.isUrgent = isUrgentFilter === 'true';
      if (keyword) params.keyword = keyword;

      const response = await getTickets(role, params);
      setTickets(response.data || []);
    } catch (error) {
      console.error('加载团体票列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTickets();
  };

  const handleExport = () => {
    const params: any = {};
    if (statusFilter) params.status = statusFilter;
    if (handlerFilter) params.handler = handlerFilter;
    if (hasRejectFilter) params.hasReject = hasRejectFilter === 'true';
    if (hasSupplementaryFilter) params.hasSupplementary = hasSupplementaryFilter === 'true';
    if (isOverdueFilter) params.isOverdue = isOverdueFilter === 'true';
    if (isUrgentFilter) params.isUrgent = isUrgentFilter === 'true';
    if (keyword) params.keyword = keyword;
    window.open(getExportUrl(params), '_blank');
  };

  const getStatusCount = (status: GroupTicketStatus) => tickets.filter(t => t.status === status).length;

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setHandlerFilter('');
    setHasRejectFilter('');
    setHasSupplementaryFilter('');
    setIsOverdueFilter('');
    setIsUrgentFilter('');
  };

  return (
    <div className="ticket-list-page">
      <div className="page-header">
        <h2>团体票记录</h2>
        <button className="export-btn" onClick={handleExport}>导出CSV</button>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">总计</span>
          <span className="stat-value">{tickets.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">待排片</span>
          <span className="stat-value">{getStatusCount('pending_scheduling') + getStatusCount('scheduling_reviewing')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">待核销</span>
          <span className="stat-value">{getStatusCount('scheduling_approved') + getStatusCount('pending_verification') + getStatusCount('verifying')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">待复核</span>
          <span className="stat-value">{getStatusCount('verification_pending_review')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已完成</span>
          <span className="stat-value">{getStatusCount('completed')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已逾期</span>
          <span className="stat-value" style={{ color: '#ff4d4f' }}>{tickets.filter(t => t.isOverdue).length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">临期中</span>
          <span className="stat-value" style={{ color: '#fa8c16' }}>{tickets.filter(t => t.isUrgent).length}</span>
        </div>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="搜索订单号、企业、影片..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">搜索</button>
        </form>

        <div className="filter-fields">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="filter-select">
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select value={handlerFilter} onChange={(e) => setHandlerFilter(e.target.value as any)} className="filter-select">
            <option value="">全部责任人</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select value={hasRejectFilter} onChange={(e) => setHasRejectFilter(e.target.value as any)} className="filter-select">
            <option value="">全部驳回状态</option>
            <option value="true">有驳回</option>
            <option value="false">无驳回</option>
          </select>

          <select value={hasSupplementaryFilter} onChange={(e) => setHasSupplementaryFilter(e.target.value as any)} className="filter-select">
            <option value="">全部补充备注</option>
            <option value="true">有补充备注</option>
            <option value="false">无补充备注</option>
          </select>

          <select value={isOverdueFilter} onChange={(e) => setIsOverdueFilter(e.target.value as any)} className="filter-select">
            <option value="">全部逾期状态</option>
            <option value="true">已逾期</option>
            <option value="false">未逾期</option>
          </select>

          <select value={isUrgentFilter} onChange={(e) => setIsUrgentFilter(e.target.value as any)} className="filter-select">
            <option value="">全部临期状态</option>
            <option value="true">临期中</option>
            <option value="false">非临期</option>
          </select>

          <button onClick={handleReset} className="reset-btn">重置</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>企业名称</th>
              <th>影片</th>
              <th>场次</th>
              <th>票数</th>
              <th>金额</th>
              <th>状态</th>
              <th>时效</th>
              <th>当前责任人</th>
              <th>驳回</th>
              <th>补充备注</th>
              <th>SLA截止</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={14} className="text-center">加载中...</td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center">暂无数据</td>
              </tr>
            ) : tickets.map((ticket) => (
              <tr key={ticket.id} className="ticket-row" onClick={() => onViewTicket(ticket.id)}>
                <td className="order-no">{ticket.orderNo}</td>
                <td>{ticket.companyName}</td>
                <td>{ticket.movieName}</td>
                <td>{ticket.showDate} {ticket.showTime}</td>
                <td>{ticket.ticketCount}张</td>
                <td>¥{ticket.totalAmount}</td>
                <td>
                  <span className="status-tag" style={{ backgroundColor: ticket.statusColor || '#1890ff' }}>
                    {ticket.statusLabel || ticket.status}
                  </span>
                </td>
                <td>
                  {ticket.isOverdue ? (
                    <span className="tag tag-danger">已逾期</span>
                  ) : ticket.isUrgent ? (
                    <span className="tag tag-warning">临期</span>
                  ) : (
                    <span className="tag tag-success">正常</span>
                  )}
                </td>
                <td>{ticket.currentHandlerLabel || ticket.currentHandler}</td>
                <td>
                  {ticket.rejectRecords.length > 0 ? (
                    <span className="tag tag-danger">是({ticket.rejectRecords.length})</span>
                  ) : (
                    <span className="tag tag-default">否</span>
                  )}
                </td>
                <td>
                  {ticket.supplementaryRemark ? (
                    <span className="tag tag-warning">有</span>
                  ) : (
                    <span className="tag tag-default">无</span>
                  )}
                </td>
                <td>
                  {ticket.slaDeadline ? (
                    <span style={{ color: ticket.isOverdue ? '#ff4d4f' : ticket.isUrgent ? '#fa8c16' : 'inherit' }}>
                      {new Date(ticket.slaDeadline).toLocaleDateString('zh-CN')}
                    </span>
                  ) : '-'}
                </td>
                <td>{new Date(ticket.updatedAt).toLocaleString('zh-CN')}</td>
                <td>
                  <button className="link-btn">查看详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketListPage;
