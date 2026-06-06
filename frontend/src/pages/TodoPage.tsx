import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TodoItem, UserRole } from '../types';

interface TodoPageProps {
  role: UserRole;
  onViewCase: (caseId: string) => void;
}

const TodoPage: React.FC<TodoPageProps> = ({ role, onViewCase }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, [role]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const data = await api.getTodos(role);
      setTodos(data);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
    setLoading(false);
  };

  const handleExport = () => {
    api.exportTodos(role);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>我的待办</h2>
        <button className="btn btn-primary" onClick={handleExport}>
          导出待办
        </button>
      </div>

      {todos.length === 0 ? (
        <div className="empty-state">
          <p>暂无待办事项</p>
        </div>
      ) : (
        <div className="todo-list">
          {todos.map(todo => (
            <div key={todo.id} className={`todo-item priority-${todo.priority}`}>
              <div className="todo-content">
                <div className="todo-header">
                  <span className="todo-priority">
                    {todo.priority === 'high' ? '高优' : todo.priority === 'medium' ? '中优' : '低优'}
                  </span>
                  {todo.dueDate && (
                    <span className="todo-due">截止：{new Date(todo.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
                <h3 className="todo-title">{todo.title}</h3>
                <p className="todo-desc">{todo.description}</p>
              </div>
              <div className="todo-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => onViewCase(todo.caseId)}
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
