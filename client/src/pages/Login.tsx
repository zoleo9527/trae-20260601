import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Lock, MonitorPlay } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const quickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    await handleSubmit(user, pass);
  };

  const handleSubmit = async (user?: string, pass?: string) => {
    setError('');
    setLoading(true);
    try {
      await login(user || username, pass || password);
    } catch (e: any) {
      setError(e.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  const quickAccounts = [
    { username: 'admin', name: '张网管', role: '网管', desc: '负责机器巡检、日常维护' },
    { username: 'event', name: '李运营', role: '赛事运营', desc: '负责赛事设备、活动支持' },
    { username: 'manager', name: '王店长', role: '店长', desc: '审批复核、全局管理' },
    { username: 'tech', name: '赵技师', role: '技师', desc: '负责维修派单执行' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <MonitorPlay className="w-12 h-12 text-primary-500" />
            <h1 className="text-3xl font-bold text-white">网咖电竞馆管理系统</h1>
          </div>
          <p className="text-gray-400">机器巡检 · 维修派单 · 全流程追溯</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 登录表单 */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">账号登录</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">用户名</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="input pl-10"
                    placeholder="请输入用户名"
                  />
                </div>
              </div>
              <div>
                <label className="label">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="请输入密码"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
              </div>
              <button
                onClick={() => handleSubmit()}
                disabled={loading}
                className="w-full btn btn-primary py-3"
              >
                {loading ? '登录中...' : '登 录'}
              </button>
            </div>
          </div>

          {/* 快速登录 */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">选择角色快速体验</h2>
            <div className="space-y-3">
              {quickAccounts.map(acc => (
                <button
                  key={acc.username}
                  onClick={() => quickLogin(acc.username, '123456')}
                  disabled={loading}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium group-hover:text-primary-400 transition-colors">
                        {acc.name} · {acc.role}
                      </p>
                      <p className="text-gray-400 text-sm mt-0.5">{acc.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-6 text-center">默认密码：123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
