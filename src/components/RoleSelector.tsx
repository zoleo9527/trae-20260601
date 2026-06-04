import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { ROLE_LABELS } from '../types';
import type { User } from '../types';

export default function RoleSelector() {
  const { currentUser, setCurrentUser } = useContext(AppContext);
  const [users, setUsers] = useState<User[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  if (!currentUser || users.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span>切换角色</span>
        <span className={`transition-transform ${show ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {show && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">选择当前身份</div>
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => {
                setCurrentUser(user);
                setShow(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                currentUser.id === user.id ? 'bg-beer-50 border-l-4 border-beer-500' : ''
              }`}
            >
              <span className="text-xl">{user.avatar}</span>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</div>
              </div>
              {currentUser.id === user.id && (
                <span className="ml-auto text-beer-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
