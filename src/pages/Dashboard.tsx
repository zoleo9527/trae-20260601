import { useEffect } from 'react';
import { FileText, Wallet, AlertCircle, Clock, ArrowRight, TrendingUp, Users, Package } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import Layout from '../components/layout/Layout';
import { statusNames } from '../data/mockData';

export default function Dashboard() {
  const { projects, todos, fetchProjects, fetchTodos, loading } = useProjectStore();

  useEffect(() => {
    fetchProjects();
    fetchTodos();
  }, [fetchProjects, fetchTodos]);

  const stats = [
    { label: '项目总数', value: projects.length, icon: Package, color: 'bg-blue-500' },
    { label: '待审核中标通知', value: projects.filter(p => p.status === 'notice_pending').length, icon: FileText, color: 'bg-amber-500' },
    { label: '待审核退款申请', value: projects.filter(p => p.status === 'refund_pending').length, icon: Wallet, color: 'bg-green-500' },
    { label: '待处理驳回', value: projects.filter(p => p.status === 'notice_rejected' || p.status === 'refund_rejected').length, icon: AlertCircle, color: 'bg-red-500' },
  ];

  const urgentTodos = todos.filter(t => t.priority === 'high').slice(0, 3);
  const recentProjects = projects.slice(0, 5);

  return (
    <Layout title="仪表盘" subtitle="实时监控项目进度与待办事项">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-xl text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">待办事项</h3>
              <a href="/projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                查看全部 <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="divide-y divide-slate-100">
              {urgentTodos.length === 0 ? (
                <div className="p-8 text-center text-slate-500">暂无待办事项</div>
              ) : (
                urgentTodos.map(todo => (
                  <div key={todo.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            todo.priority === 'high' ? 'bg-red-100 text-red-600' :
                            todo.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {todo.priority === 'high' ? '紧急' : todo.priority === 'medium' ? '中等' : '低'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            todo.type === 'notice' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {todo.type === 'notice' ? '中标通知' : '退款申请'}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800 mt-2">{todo.title}</p>
                        <p className="text-sm text-slate-500">{todo.project_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">处理人</p>
                        <p className="font-medium text-slate-700">{todo.assignee}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">最近项目</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="p-8 text-center text-slate-500">暂无项目</div>
              ) : (
                recentProjects.map(project => (
                  <a key={project.id} href={`/projects/${project.id}`} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                      {project.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{project.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{project.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          project.status.includes('pending') ? 'bg-amber-100 text-amber-600' :
                          project.status.includes('rejected') ? 'bg-red-100 text-red-600' :
                          project.status === 'paid' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {statusNames[project.status]}
                        </span>
                      </div>
                    </div>
                    <Clock className="w-5 h-5 text-slate-400" />
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">项目状态分布</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {Object.entries(statusNames).map(([status, label]) => {
                const count = projects.filter(p => p.status === status).length;
                const percentage = projects.length > 0 ? (count / projects.length * 100).toFixed(1) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status.includes('pending') ? 'bg-amber-500' :
                      status.includes('rejected') ? 'bg-red-500' :
                      status.includes('approved') ? 'bg-blue-500' :
                      status === 'paid' ? 'bg-green-500' :
                      status === 'completed' ? 'bg-teal-500' :
                      'bg-slate-400'
                    }`}></div>
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="font-medium text-slate-800">{count}</span>
                    <span className="text-sm text-slate-400">({percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
