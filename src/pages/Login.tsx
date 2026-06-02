import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TabBar } from '@/components/UI/TabBar';
import { Button } from '@/components/UI/Button';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

export default function Login() {
  const [role, setRole] = useState<'teacher' | 'principal'>('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useAppStore((state) => state.login);
  const navigate = useNavigate();

  const roleTabs = [
    { id: 'teacher', label: '班主任' },
    { id: 'principal', label: '园长' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate(role === 'teacher' ? '/teacher' : '/principal');
      } else {
        setError('账号或密码错误，请重试');
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-40 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-primary-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-28 h-28 bg-white/10 rounded-full blur-xl" />
        
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-lg" />
          <div className="absolute top-24 left-8 w-16 h-12 bg-white/80 rounded-full blur-sm" />
          <div className="absolute top-20 left-20 w-20 h-14 bg-white/70 rounded-full blur-sm" />
          <div className="absolute top-28 right-12 w-14 h-10 bg-white/75 rounded-full blur-sm" />
          
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32">
            <div className="absolute bottom-0 left-0 w-20 h-24 bg-gradient-to-t from-primary-700/30 to-primary-600/20 rounded-t-full" />
            <div className="absolute bottom-0 left-16 w-24 h-28 bg-gradient-to-t from-primary-700/40 to-primary-600/25 rounded-t-full" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-t from-primary-700/30 to-primary-600/20 rounded-t-full" />
            
            <div className="absolute bottom-6 left-12 w-3 h-8 bg-primary-700/50 rounded-full" />
            <div className="absolute bottom-8 left-20 w-2 h-6 bg-primary-700/40 rounded-full" />
            <div className="absolute bottom-7 right-16 w-3 h-7 bg-primary-700/50 rounded-full" />
            <div className="absolute bottom-5 right-24 w-2 h-5 bg-primary-700/40 rounded-full" />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-sm">
            托育工作台
          </h1>
          <p className="text-white/80 text-lg">用心呵护每一个孩子的成长</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-soft-lg p-8">
            <div className="mb-6">
              <TabBar
                tabs={roleTabs}
                activeTab={role}
                onTabChange={(tabId) => setRole(tabId as 'teacher' | 'principal')}
                className="w-full"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  账号
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'teacher' ? '请输入班主任账号' : '请输入园长账号'}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-gray-800',
                    'bg-gray-50 border-2 border-gray-200',
                    'focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100',
                    'placeholder:text-gray-400 transition-all duration-200'
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl text-gray-800',
                    'bg-gray-50 border-2 border-gray-200',
                    'focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100',
                    'placeholder:text-gray-400 transition-all duration-200'
                  )}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-warning-600 text-sm text-center bg-warning-50 py-2 px-4 rounded-xl"
                >
                  {error}
                </motion.p>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? '登录中...' : '登 录'}
                </Button>
              </div>

              <div className="text-center pt-2">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-primary-600 text-sm hover:text-primary-700 transition-colors"
                >
                  忘记密码？
                </a>
              </div>
            </form>
          </div>

          <p className="text-center text-white/60 text-sm mt-6">
            测试账号：李老师 / 123456 或 王园长 / 123456
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
