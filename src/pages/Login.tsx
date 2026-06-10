import { useNavigate } from 'react-router-dom';
import { User, Shield, Wheat } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface DemoAccount {
  username: string;
  password: string;
  name: string;
  role: string;
  roleLabel: string;
  icon: typeof User;
  color: string;
  bgColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'feeder1',
    password: '123456',
    name: '张饲养',
    role: 'feeder',
    roleLabel: '饲养员',
    icon: Wheat,
    color: 'text-farm-orange',
    bgColor: 'bg-farm-orange/20',
  },
  {
    username: 'sorter1',
    password: '123456',
    name: '李分拣',
    role: 'sorter',
    roleLabel: '分拣员',
    icon: User,
    color: 'text-farm-green',
    bgColor: 'bg-farm-green/20',
  },
  {
    username: 'manager1',
    password: '123456',
    name: '王场长',
    role: 'manager',
    roleLabel: '场长',
    icon: Shield,
    color: 'text-farm-red',
    bgColor: 'bg-farm-red/20',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (account: DemoAccount) => {
    try {
      const res = await api.auth.login(account.username, account.password);
      login(res.user, res.token);
      navigate('/');
    } catch {
      login(
        { id: Date.now(), name: account.name, role: account.role as 'feeder' | 'sorter' | 'manager', username: account.username },
        'demo-token-' + account.role
      );
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-farm-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-farm-orange/20 rounded-2xl mb-4">
            <Wheat size={36} className="text-farm-orange" />
          </div>
          <h1 className="text-2xl font-bold text-farm-text">蛋鸡养殖场</h1>
          <p className="text-farm-muted text-sm mt-2">鸡舍巡检与产蛋记录系统</p>
        </div>

        <div className="space-y-3">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.username}
              onClick={() => handleLogin(account)}
              className="w-full bg-farm-card border border-farm-border rounded-xl p-5 flex items-center gap-4 hover:border-farm-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className={`w-12 h-12 ${account.bgColor} rounded-xl flex items-center justify-center`}>
                <account.icon size={24} className={account.color} />
              </div>
              <div className="text-left flex-1">
                <div className="text-farm-text font-bold">{account.name}</div>
                <div className="text-farm-muted text-sm">{account.username}</div>
              </div>
              <span className={`${account.bgColor} ${account.color} text-xs px-3 py-1 rounded-full font-bold`}>
                {account.roleLabel}
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-farm-muted/50 text-xs mt-8">
          点击账号卡片即可登录
        </p>
      </div>
    </div>
  );
}
