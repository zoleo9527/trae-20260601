import React from 'react';
import { useAppStore } from '../store/useStore';
import { Role } from '../types';
import { RotateCcw } from 'lucide-react';

const roleLabels: Record<Role, string> = {
  dispatcher: '安装调度',
  installer: '安装师傅',
  customer_service: '售后客服',
};

const Topbar: React.FC = () => {
  const { currentUser, users, setCurrentUser, resetToMockData } = useAppStore();

  const handleRoleChange = (role: Role) => {
    const user = users.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="role-selector">
          {(Object.keys(roleLabels) as Role[]).map((role) => (
            <button
              key={role}
              className={currentUser?.role === role ? 'active' : ''}
              onClick={() => handleRoleChange(role)}
            >
              {roleLabels[role]}
            </button>
          ))}
        </div>
      </div>
      <div className="topbar-right">
        <button
          className="btn btn-ghost btn-sm"
          onClick={resetToMockData}
          title="重置演示数据"
        >
          <RotateCcw size={14} />
          重置数据
        </button>
        {currentUser && (
          <div className="user-info">
            <div className="user-avatar">
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-sm font-medium">{currentUser.name}</span>
            <span className="text-xs text-muted">
              ({roleLabels[currentUser.role]})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
