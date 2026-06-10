import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import {
  ChevronDown,
  RefreshCw,
  User,
  Clock,
} from 'lucide-react';
import { resetApi } from '../api/endpoints';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { currentRole, roles, setRole, showToastMessage } = useAppStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const currentRoleInfo = roles.find((r) => r.id === currentRole);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = async () => {
    if (!confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      return;
    }

    setIsResetting(true);
    try {
      await resetApi.reset();
      showToastMessage('数据重置成功', 'success');
      navigate('/');
      window.location.reload();
    } catch (error) {
      showToastMessage('数据重置失败', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const [currentTime, setCurrentTime] = useState(formatTime());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(formatTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-cream-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 text-forest-600">
        <Clock className="w-4 h-4" />
        <span className="text-sm">{currentTime}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          数据重置
        </button>

        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-forest-50 transition-colors"
          >
            <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-forest-700" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-forest-900">{currentRoleInfo?.name}</p>
              <p className="text-xs text-forest-500">{currentRoleInfo?.description}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-forest-500 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card border border-cream-200 py-2 animate-slide-in-right z-50">
              <p className="px-4 py-2 text-xs font-medium text-forest-500 uppercase">切换角色</p>
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setRole(role.id);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-forest-50 transition-colors ${
                    currentRole === role.id ? 'bg-forest-50 text-forest-900' : 'text-forest-700'
                  }`}
                >
                  <p className="text-sm font-medium">{role.name}</p>
                  <p className="text-xs text-forest-500">{role.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
