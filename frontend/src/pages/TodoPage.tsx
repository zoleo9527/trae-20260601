import React, { useState, useEffect } from 'react';
import { getTodos } from '../services/api';
import { TodoItem, UserRole, STATUS_LABELS } from '../types';

interface TodoPageProps {
  role: UserRole;
  onViewTicket: (ticketId: string) => void;
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
        setTodos(res.data);
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
        <span className="badge">共 {todos.length} 条</span>
      </div>

      {todos.length === 0 ? (
        <div className="empty-state">暂无待办事项</div>
      ) : (
        <div className="todo-list">
          {todos.map(todo => (
            <div key={todo.id} className="todo-card">
              <div className="todo-card-header">
                <h3>{todo.title}</h3>
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
                <span className="todo-time">创建于：{new Date(todo.createdAt).toLocaleString('zh-CN')}</span>
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
