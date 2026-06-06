import React, { useState, useEffect } from 'react';
import { getTodos } from '../services/api';
import { TodoItem, UserRole, STATUS_LABELS } from '../types';

interface TodoPageProps {
  role: UserRole;
  onViewTicket: (ticketId: string) => void;
}

function enrichTodo(todo: TodoItem): TodoItem {
  let isOverdue = false;
  let isUrgent = false;
  if (todo.slaDeadline) {
    const deadline = new Date(todo.slaDeadline).getTime();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    isOverdue = deadline < now;
    isUrgent = deadline > now && deadline - now < oneDayMs;
  }
  return { ...todo, isOverdue, isUrgent };
}

const TodoPage: React.FC<TodoPageProps> = ({ role, onViewTicket }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, [role]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const res = await getTodos(role);
      if (res.success) {
        setTodos(res.data.map(enrichTodo));
      }
    } catch (e) {
      console.error('加载待办失败', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>我的待办</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge">共 {todos.length} 条</span>
          {todos.filter(t => t.isOverdue).length > 0 && (
            <span className="badge" style={{ backgroundColor: '#fff2f0', color: '#ff4d4f' }}>
              逾期 {todos.filter(t => t.isOverdue).length} 条
            </span>
          )}
          {todos.filter(t => t.isUrgent).length > 0 && (
            <span className="badge" style={{ backgroundColor: '#fff7e6', color: '#fa8c16' }}>
              临期 {todos.filter(t => t.isUrgent).length} 条
            </span>
          )}
        </div>
      </div>

      {todos.length === 0 ? (
        <div className="empty-state">暂无待办事项</div>
      ) : (
        <div className="todo-list">
          {todos.map(todo => (
            <div key={todo.id} className="todo-card">
              <div className="todo-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3>{todo.title}</h3>
                  {todo.isOverdue && (
                    <span className="tag tag-danger">已逾期</span>
                  )}
                  {todo.isUrgent && !todo.isOverdue && (
                    <span className="tag tag-warning">临期</span>
                  )}
                </div>
                <span className={`priority priority-${todo.priority}`}>
                  {todo.priority === 'high' ? '高优先级' : todo.priority === 'medium' ? '中优先级' : '低优先级'}
                </span>
              </div>
              <p className="todo-desc">{todo.description}</p>
              {todo.ticket && (
                <div className="todo-ticket-info">
                  <span className="info-item">
                    <label>企业：</label>
                    {todo.ticket.companyName}
                  </span>
                  <span className="info-item">
                    <label>影片：</label>
                    {todo.ticket.movieName}
                  </span>
                  <span className="info-item">
                    <label>场次：</label>
                    {todo.ticket.showDate} {todo.ticket.showTime}
                  </span>
                  <span
                    className="status-tag"
                    style={{ backgroundColor: todo.ticket.statusColor + '20', color: todo.ticket.statusColor }}
                  >
                    {todo.ticket.statusLabel || STATUS_LABELS[todo.ticket.status]}
                  </span>
                </div>
              )}
              <div className="todo-card-footer">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="todo-time">创建于：{new Date(todo.createdAt).toLocaleString('zh-CN')}</span>
                  {todo.slaDeadline && (
                    <span className="todo-time" style={{ color: todo.isOverdue ? '#ff4d4f' : todo.isUrgent ? '#fa8c16' : '#8c8c8c' }}>
                      SLA截止：{new Date(todo.slaDeadline).toLocaleString('zh-CN')}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => onViewTicket(todo.ticketId)}
                >
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoPage;
