import React, { useState } from 'react';
import { User, Lock, Flame } from 'lucide-react';
import { authApi } from '../api';
import { useStore } from '../store';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authApi.login(username, password);
      setUser(user);
      onLogin();
    } catch (err) {
      setError('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: string) => {
    setUsername(role);
    setPassword('123456');
    setError('');
    setLoading(true);

    try {
      const user = await authApi.login(role, '123456');
      setUser(user);
      onLogin();
    } catch (err) {
      setError('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-orange-500 rounded-full">
              <Flame className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">火锅店排号系统</h1>
          <p className="text-gray-500 text-center mb-8">等位排号与桌台分配管理</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="请输入用户名"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="请输入密码"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">快速登录：</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('manager')}
                disabled={loading}
                className="py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium disabled:opacity-50"
              >
                前厅经理
              </button>
              <button
                onClick={() => quickLogin('chef')}
                disabled={loading}
                className="py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-sm font-medium disabled:opacity-50"
              >
                后厨主管
              </button>
              <button
                onClick={() => quickLogin('cashier')}
                disabled={loading}
                className="py-2 px-4 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all text-sm font-medium disabled:opacity-50"
              >
                收银员
              </button>
              <button
                onClick={() => quickLogin('admin')}
                disabled={loading}
                className="py-2 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all text-sm font-medium disabled:opacity-50"
              >
                管理员
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">密码均为 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};
