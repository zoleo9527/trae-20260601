import { useNavigate } from 'react-router-dom';
import { Dumbbell, BarChart3 } from 'lucide-react';
import { useRoleStore } from '../store/useRoleStore';

export default function Home() {
  const navigate = useNavigate();
  const { setRole } = useRoleStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-2xl mb-6 shadow-lg shadow-orange-500/30">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">FitPro</h1>
          <p className="text-gray-400 text-lg">私教工作室管理系统</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => {
              setRole('coach');
              navigate('/coach');
            }}
            className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-left hover:bg-white/20 transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">教练工作台</h2>
            <p className="text-gray-400 text-sm">
              查看今日课程、待跟进会员、管理训练计划和体测记录
            </p>
          </button>

          <button
            onClick={() => {
              setRole('manager');
              navigate('/manager');
            }}
            className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-left hover:bg-white/20 transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">店长数据中心</h2>
            <p className="text-gray-400 text-sm">
              查看运营数据、会员活跃度、续费风险预警和体测追踪
            </p>
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-12">
          选择您的角色进入系统
        </p>
      </div>
    </div>
  );
}
