
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw, User } from 'lucide-react';
import { Role } from '../../types';
import { ROLE_CONFIG } from '../../utils/constants';
import { useData } from '../../contexts/DataContext';

interface TopBarProps {
  role: Role;
}

export function TopBar({ role }: TopBarProps) {
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role];
  const roleColor = config.color;
  const { resetData } = useData();

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？这将恢复初始演示数据。')) {
      resetData();
      window.location.reload();
    }
  };

  return (
    <header className={`bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between`}>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">返回首页</span>
        </button>
        
        <div className="h-6 w-px bg-gray-300" />
        
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-${roleColor} flex items-center justify-center text-white font-semibold`}>
            {config.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{config.name}</p>
            <p className="text-xs text-gray-500">当前角色</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重置数据</span>
        </button>

        <div className="h-8 w-px bg-gray-300" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">系统管理员</p>
            <p className="text-xs text-gray-500">在线</p>
          </div>
        </div>
      </div>
    </header>
  );
}
