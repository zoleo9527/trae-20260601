import { useEffect, useState } from 'react';
import { Plus, Filter, FileText, Wallet, Eye, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import Layout from '../components/layout/Layout';
import { statusNames, roleNames, mockUsers } from '../data/mockData';
import { Project, ProjectCreateData } from '../types';

type TabType = 'all' | 'notice' | 'refund';

export default function ProjectList() {
  const { projects, fetchProjects, createProject, deleteProject, loading } = useProjectStore();
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProjectCreateData>({
    name: '',
    code: '',
    deposit_amount: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(project => {
    if (selectedTab === 'notice') {
      return project.status === 'notice_pending' || project.status === 'notice_rejected';
    }
    if (selectedTab === 'refund') {
      return project.status === 'refund_pending' || project.status === 'refund_rejected';
    }
    return true;
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.code || !formData.deposit_amount) {
      alert('请填写完整信息');
      return;
    }
    await createProject(formData);
    setFormData({ name: '', code: '', deposit_amount: 0 });
    setShowCreateModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个项目吗？')) {
      await deleteProject(id);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    if (status.includes('pending')) return 'bg-amber-100 text-amber-600';
    if (status.includes('rejected')) return 'bg-red-100 text-red-600';
    if (status.includes('approved')) return 'bg-blue-100 text-blue-600';
    if (status === 'paid') return 'bg-green-100 text-green-600';
    if (status === 'completed') return 'bg-teal-100 text-teal-600';
    return 'bg-slate-100 text-slate-600';
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: '全部项目', icon: <span className="w-4 h-4" /> },
    { id: 'notice', label: '中标通知处理', icon: <FileText className="w-4 h-4" /> },
    { id: 'refund', label: '保证金退还', icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <Layout title="项目管理" subtitle="查看和管理所有项目">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {selectedProjects.length > 0 && (
              <span className="text-sm text-slate-600">
                已选择 {selectedProjects.length} 项
              </span>
            )}
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              筛选
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建项目
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  <button onClick={toggleSelectAll} className="flex items-center gap-2">
                    {selectedProjects.length === filteredProjects.length && filteredProjects.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">项目名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">项目编号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">保证金金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">创建人</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">创建时间</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    暂无项目
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <button onClick={() => toggleSelect(project.id)} className="flex items-center gap-2">
                        {selectedProjects.includes(project.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <a href={`/projects/${project.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {project.name}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{project.code}</td>
                    <td className="px-4 py-4 text-slate-600">
                      ¥{project.deposit_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {project.created_by_user?.name || mockUsers.find(u => u.id === project.created_by)?.name}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {statusNames[project.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {new Date(project.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/projects/${project.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">新建项目</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">项目名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入项目名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">项目编号</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入项目编号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">保证金金额</label>
                <input
                  type="number"
                  value={formData.deposit_amount}
                  onChange={e => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入保证金金额"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
