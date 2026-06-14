import { useState, useMemo } from 'react';
import type { UserRole, PawnRecord, TodoItem } from '../types';
import { mockRecords, getTodosByRole, roleNames, statusNames, statusColors } from '../mockData';
import RecordDetailDrawer from '../components/RecordDetailDrawer';
import '../styles/PawnStorageWorkbench.css';

interface Props {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

type TabType = 'todo' | 'abnormal' | 'completed' | 'all';

export default function PawnStorageWorkbench({ currentRole, onRoleChange }: Props) {
  const [records, setRecords] = useState<PawnRecord[]>(mockRecords);
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [selectedRecord, setSelectedRecord] = useState<PawnRecord | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const todos = useMemo(() => getTodosByRole(currentRole, records), [currentRole, records]);

  const abnormalRecords = useMemo(() => records.filter(r => r.status === 'abnormal'), [records]);
  const completedRecords = useMemo(() => records.filter(r => r.status === 'completed'), [records]);

  const stats = useMemo(() => ({
    todo: todos.length,
    abnormal: abnormalRecords.length,
    completed: completedRecords.length,
    total: records.length
  }), [todos.length, abnormalRecords.length, completedRecords.length, records.length]);

  const todoRecords = useMemo(() => {
    const todoIds = new Set(todos.map(t => t.pawnRecordId));
    return records.filter(r => todoIds.has(r.id));
  }, [todos, records]);

  const displayedRecords = useMemo(() => {
    let result: PawnRecord[] = [];
    
    switch (activeTab) {
      case 'todo':
        result = todoRecords;
        break;
      case 'abnormal':
        result = abnormalRecords;
        break;
      case 'completed':
        result = completedRecords;
        break;
      case 'all':
        result = records;
        break;
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(r => 
        r.pawnNo.toLowerCase().includes(keyword) ||
        r.customerName.toLowerCase().includes(keyword) ||
        r.itemName.toLowerCase().includes(keyword)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [activeTab, todoRecords, abnormalRecords, completedRecords, records, searchKeyword, filterStatus]);

  const handleUpdateRecord = (updatedRecord: PawnRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setSelectedRecord(updatedRecord);
  };

  const handleTodoClick = (todo: TodoItem) => {
    const record = records.find(r => r.id === todo.pawnRecordId);
    if (record) {
      setSelectedRecord(record);
    }
  };

  const tabs = [
    { key: 'todo' as TabType, label: '待办', count: stats.todo, color: '#3b82f6' },
    { key: 'abnormal' as TabType, label: '异常', count: stats.abnormal, color: '#ef4444' },
    { key: 'completed' as TabType, label: '已完成', count: stats.completed, color: '#10b981' },
    { key: 'all' as TabType, label: '全部', count: stats.total, color: '#64748b' }
  ];

  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const priorityLabels = { high: '高', medium: '中', low: '低' };

  return (
    <div className="workbench-container">
      <header className="workbench-header">
        <div className="header-left">
          <h1 className="title">典当行-入库保管与照片留证</h1>
          <span className="subtitle">业务工作台</span>
        </div>
        <div className="header-right">
          <div className="role-switcher">
            <span className="role-label">当前角色：</span>
            <div className="role-buttons">
              {(['counter', 'warehouse', 'finance'] as UserRole[]).map(role => (
                <button
                  key={role}
                  className={`role-btn ${currentRole === role ? 'active' : ''}`}
                  onClick={() => onRoleChange(role)}
                >
                  {roleNames[role]}
                </button>
              ))}
            </div>
          </div>
          <div className="user-info">
            <div className="avatar">
              {currentRole === 'counter' ? '李' : currentRole === 'warehouse' ? '赵' : '孙'}
            </div>
            <div className="user-detail">
              <span className="user-name">
                {currentRole === 'counter' ? '李评估师' : currentRole === 'warehouse' ? '赵库管' : '孙会计'}
              </span>
              <span className="user-role">{roleNames[currentRole]}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="workbench-content">
        <aside className="sidebar">
          <div className="stat-cards">
            {tabs.slice(0, 3).map(tab => (
              <div 
                key={tab.key} 
                className={`stat-card ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <div className="stat-icon" style={{ backgroundColor: `${tab.color}15`, color: tab.color }}>
                  {tab.key === 'todo' ? '📋' : tab.key === 'abnormal' ? '⚠️' : '✅'}
                </div>
                <div className="stat-info">
                  <span className="stat-value" style={{ color: tab.color }}>{tab.count}</span>
                  <span className="stat-label">{tab.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="todo-section">
            <h3 className="section-title">
              <span>我的待办</span>
              <span className="todo-count">{todos.length}</span>
            </h3>
            <div className="todo-list">
              {todos.length === 0 ? (
                <div className="empty-todo">
                  <span>暂无待办事项</span>
                </div>
              ) : (
                todos.map(todo => (
                  <div 
                    key={todo.id} 
                    className="todo-item"
                    onClick={() => handleTodoClick(todo)}
                  >
                    <div className="todo-priority" style={{ backgroundColor: priorityColors[todo.priority] }}>
                      {priorityLabels[todo.priority]}
                    </div>
                    <div className="todo-content">
                      <div className="todo-title">{todo.title}</div>
                      <div className="todo-desc">{todo.description}</div>
                      <div className="todo-meta">
                        <span className="todo-no">{todo.pawnNo}</span>
                        <span className="todo-time">{todo.createdAt}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="content-header">
            <div className="tabs">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span className="tab-count" style={{ backgroundColor: `${tab.color}15`, color: tab.color }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="content-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="搜索当号、客户、物品..."
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">全部状态</option>
                {Object.entries(statusNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="records-table-container">
            <table className="records-table">
              <thead>
                <tr>
                  <th>当号</th>
                  <th>客户信息</th>
                  <th>物品信息</th>
                  <th>评估金额</th>
                  <th>入库状态</th>
                  <th>照片状态</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {displayedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      <div className="empty-content">
                        <span className="empty-icon">📭</span>
                        <span className="empty-text">暂无{activeTab === 'todo' ? '待办' : activeTab === 'abnormal' ? '异常' : activeTab === 'completed' ? '已完成' : ''}记录</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRecords.map(record => (
                    <tr 
                      key={record.id} 
                      className="record-row"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td>
                        <span className="pawn-no">{record.pawnNo}</span>
                      </td>
                      <td>
                        <div className="customer-info">
                          <span className="customer-name">{record.customerName}</span>
                          <span className="customer-phone">{record.customerPhone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="item-info">
                          <span className="item-name">{record.itemName}</span>
                          <span className="item-category">{record.itemCategory}</span>
                        </div>
                      </td>
                      <td>
                        <div className="amount-info">
                          <span className="estimated">估值 ¥{record.estimatedValue.toLocaleString()}</span>
                          <span className="pawn-amount">放款 ¥{record.pawnAmount.toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge storage-${record.storageStatus}`}>
                          {record.storageStatus === 'pending' ? '待入库' : 
                           record.storageStatus === 'stored' ? '已入库' : '已退回'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge photo-${record.photoStatus}`}>
                          {record.photoStatus === 'pending' ? '待拍照' : 
                           record.photoStatus === 'taken' ? '已拍照' : '已退回'}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="status-badge main-status"
                          style={{ 
                            backgroundColor: `${statusColors[record.status]}15`,
                            color: statusColors[record.status] 
                          }}
                        >
                          {statusNames[record.status]}
                        </span>
                      </td>
                      <td>
                        <span className="update-time">{record.updatedAt}</span>
                      </td>
                      <td>
                        <button 
                          className="action-btn"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
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
        </main>
      </div>

      {selectedRecord && (
        <RecordDetailDrawer
          record={selectedRecord}
          currentRole={currentRole}
          onClose={() => setSelectedRecord(null)}
          onUpdate={handleUpdateRecord}
        />
      )}
    </div>
  );
}
