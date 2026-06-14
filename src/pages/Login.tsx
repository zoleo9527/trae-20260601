import { useAppStore } from '../store';
import { UserRole, ROLE_CONFIG } from '../types';
import { Store, Calculator, Wallet } from 'lucide-react';
const roleIcons = {
 counter: Calculator,
 warehouse: Store,
 finance: Wallet,
};
const Login = () => {
 const login = useAppStore((state) => state.login);
 const handleRoleSelect = (role: UserRole) => {
 login(role);
 };
 const roles: UserRole[] = ['counter', 'warehouse', 'finance'];
 return (<div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 <div className="text-center mb-8">
 <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-xl mb-4">
 <Store className="w-8 h-8 text-primary-900"/>
 </div>
 <h1 className="text-3xl font-bold text-white mb-2">典当当品登记系统</h1>
 <p className="text-primary-200">请选择您的角色登录</p>
 </div>

 <div className="grid grid-cols-1 gap-4">
 {roles.map((role) => {
 const config = ROLE_CONFIG[role];
 const Icon = roleIcons[role];
 return (<button key={role} onClick={() => handleRoleSelect(role)} className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:border-gold-400">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
 <Icon className="w-6 h-6 text-gold-400"/>
 </div>
 <div className="text-left">
 <h3 className="text-white font-semibold text-lg">{config.name}</h3>
 <p className="text-primary-200 text-sm">点击登录</p>
 </div>
 </div>
 </button>);
 })}
 </div>

 <div className="mt-8 text-center">
 <p className="text-primary-300 text-sm">
 系统支持离线使用，数据自动同步
 </p>
 </div>
 </div>
 </div>);
};
export default Login;
