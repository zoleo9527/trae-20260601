import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, FileText, Wallet, Eye, Edit2, Trash2, CheckSquare, Square, CheckCircle, XCircle, AlertTriangle, Info, DollarSign } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import Layout from '../components/layout/Layout';
import { statusNames, mockUsers } from '../data/mockData';
import { ProjectCreateData } from '../types';

type TabType = 'all' | 'notice_pending' | 'notice_rejected' | 'notice_approved' | 'refund_pending' | 'refund_approved' | 'refund_rejected' | 'paid';
type BatchActionType = 'approve' | 'reject' | 'pay';

const tabConfig: Record<TabType, { label: string; icon: React.ReactNode; statuses: string[] }> = {
  all: { label: '全部项目', icon: <span className="w-4 h-4" />, statuses: [] },
  notice_pending: { label: '待审核', icon: <FileText className="w-4 h-4" />, statuses: ['notice_pending'] },
  notice_rejected: { label: '待补录', icon: <FileText className="w-4 h-4" />, statuses: ['notice_rejected'] },
  notice_approved: { label: '已通过', icon: <FileText className="w-4 h-4" />, statuses: ['notice_approved'] },
  refund_pending: { label: '待审核', icon: <Wallet className="w-4 h-4" />, statuses: ['refund_pending', 'refund_approved'] },
  refund_rejected: { label: '待补充', icon: <Wallet className="w-4 h-4" />, statuses: ['refund_rejected'] },
  refund_approved: { label: '待打款', icon: <Wallet className="w-4 h-4" />, statuses: ['refund_approved'] },
  paid: { label: '已打款', icon: <Wallet className="w-4 h-4" />, statuses: ['paid'] },
};

const emptyStateMessages: Record<string, { title: string; description: string }> = {
  notice_pending: { title: '暂无待审核的中标通知', description: '所有中标通知都已处理完毕' },
  notice_rejected: { title: '暂无待补录的中标通知', description: '所有驳回的中标通知都已补录' },
  notice_approved: { title: '暂无已通过的中标通知', description: '' },
  refund_pending: { title: '暂无待处理的退款申请', description: '所有退款申请都已处理完毕' },
  refund_approved: { title: '暂无待打款的项目', description: '所有审核通过的退款申请都已打款' },
  refund_rejected: { title: '暂无待补充材料的退款申请', description: '所有驳回的退款申请都已补充材料' },
  paid: { title: '暂无已打款的项目', description: '' },
  all: { title: '暂无项目', description: '点击新建项目按钮创建第一个项目' },
};

export default function ProjectList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType;
  
  const { projects, fetchProjects, createProject, deleteProject, loading, currentUser, batchApproveNotice, batchApproveRefund, batchRejectNotice, batchRejectRefund } = useProjectStore();
  const [selectedTab, setSelectedTab] = useState<TabType>(tabParam || 'all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showBatchRejectModal, setShowBatchRejectModal] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');
  const [batchResult, setBatchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState<ProjectCreateData>({
    name: '',
    code: '',
    deposit_amount: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && tabConfig[tab]) {
      setSelectedTab(tab);
      setSelectedProjects([]);
    } else if (!tab) {
      setSelectedTab('all');
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setSelectedTab(tab);
    setSelectedProjects([]);
    setShowBatchActions(false);
    setBatchResult(null);
    if (tab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const canProcessProject = (project: typeof projects[0], action?: BatchActionType): boolean => {
    if (selectedTab === 'notice_pending') {
      return currentUser?.role === 'review_secretary' && project.status === 'notice_pending';
    }
    if (selectedTab === 'notice_rejected') {
      return currentUser?.role === 'project_manager' && project.status === 'notice_rejected';
    }
    if (selectedTab === 'refund_pending') {
      if (currentUser?.role === 'finance') {
        if (project.status === 'refund_pending') {
          return action === 'approve' || action === 'reject';
        }
        if (project.status === 'refund_approved') {
          return action === 'pay';
        }
      }
      return false;
    }
    if (selectedTab === 'refund_rejected') {
      return currentUser?.role === 'project_manager' && project.status === 'refund_rejected';
    }
    return false;
  };

  const canApproveProject = (project: typeof projects[0]): boolean => {
    return canProcessProject(project, 'approve');
  };

  const canPayProject = (project: typeof projects[0]): boolean => {
    return canProcessProject(project, 'pay');
  };

  const getUnprocessableReason = (project: typeof projects[0]): string => {
    if (selectedTab === 'notice_pending') {
      if (project.status === 'notice_pending') return currentUser?.role === 'review_secretary' ? '待审核' : '无权限';
      return '不可处理';
    }
    if (selectedTab === 'notice_rejected') {
      if (project.status === 'notice_rejected') return currentUser?.role === 'project_manager' ? '待补录' : '无权限';
      return '不可处理';
    }
    if (selectedTab === 'refund_pending') {
      if (project.status === 'refund_pending') return currentUser?.role === 'finance' ? '待审核' : '无权限';
      if (project.status === 'refund_approved') return currentUser?.role === 'finance' ? '待打款' : '无权限';
      return '不可处理';
    }
    if (selectedTab === 'refund_rejected') {
      if (project.status === 'refund_rejected') return currentUser?.role === 'project_manager' ? '待补充' : '无权限';
      return '不可处理';
    }
    return '不可处理';
  };

  const filteredProjects = projects.filter(project => {
    if (selectedTab === 'all') {
      return true;
    }
    return tabConfig[selectedTab]?.statuses.includes(project.status);
  });

  const approveableProjects = filteredProjects.filter(canApproveProject);
  const payableProjects = filteredProjects.filter(canPayProject);
  const processableProjects = [...approveableProjects, ...payableProjects];
  
  const selectedApprovable = selectedProjects.filter(id => canApproveProject(projects.find(p => p.id === id)!));
  const selectedPayable = selectedProjects.filter(id => canPayProject(projects.find(p => p.id === id)!));
  const selectedProcessable = [...selectedApprovable, ...selectedPayable];
  const selectedUnprocessable = selectedProjects.filter(id => !processableProjects.map(p => p.id).includes(id));

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
    if (selectedProjects.length === processableProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(processableProjects.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    if (canApproveProject(project) || canPayProject(project)) {
      setSelectedProjects(prev =>
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
    }
  };

  const canBatchApprove = selectedApprovable.length > 0 && (
    (selectedTab === 'notice_pending' && currentUser?.role === 'review_secretary') ||
    (selectedTab === 'refund_pending' && currentUser?.role === 'finance')
  );

  const canBatchPay = selectedPayable.length > 0 && selectedTab === 'refund_pending' && currentUser?.role === 'finance';

  const handleBatchApprove = async () => {
    if (selectedApprovable.length === 0) {
      setBatchResult({ success: false, message: '没有可批量审核的项目' });
      return;
    }

    let processedCount = 0;
    if (selectedTab === 'notice_pending') {
      await batchApproveNotice(selectedApprovable);
      processedCount = selectedApprovable.length;
    } else if (selectedTab === 'refund_pending') {
      await batchApproveRefund(selectedApprovable);
      processedCount = selectedApprovable.length;
    }
    
    setBatchResult({ success: true, message: `成功批量审核 ${processedCount} 个项目` });
    setSelectedProjects([]);
    setShowBatchActions(false);
    
    setTimeout(() => setBatchResult(null), 3000);
  };

  const handleBatchPay = async () => {
    if (selectedPayable.length === 0) {
      setBatchResult({ success: false, message: '没有可批量打款的项目' });
      return;
    }

    const { processPayment } = useProjectStore.getState();
    for (const projectId of selectedPayable) {
      await processPayment(projectId);
    }
    
    setBatchResult({ success: true, message: `成功批量打款 ${selectedPayable.length} 个项目` });
    setSelectedProjects([]);
    setShowBatchActions(false);
    
    setTimeout(() => setBatchResult(null), 3000);
  };

  const handleBatchReject = async () => {
    if (selectedApprovable.length === 0) {
      setBatchResult({ success: false, message: '没有可批量驳回的项目' });
      setShowBatchRejectModal(false);
      return;
    }

    if (selectedTab === 'notice_pending') {
      await batchRejectNotice(selectedApprovable, batchRejectReason);
    } else if (selectedTab === 'refund_pending') {
      await batchRejectRefund(selectedApprovable, batchRejectReason);
    }
    
    setBatchResult({ success: true, message: `成功批量驳回 ${selectedApprovable.length} 个项目` });
    setSelectedProjects([]);
    setShowBatchActions(false);
    setShowBatchRejectModal(false);
    setBatchRejectReason('');
    
    setTimeout(() => setBatchResult(null), 3000);
  };

  const getStatusColor = (status: string) => {
    if (status.includes('pending')) return 'bg-amber-100 text-amber-600';
    if (status.includes('rejected')) return 'bg-red-100 text-red-600';
    if (status.includes('approved')) return 'bg-blue-100 text-blue-600';
    if (status === 'paid') return 'bg-green-100 text-green-600';
    if (status === 'completed') return 'bg-teal-100 text-teal-600';
    return 'bg-slate-100 text-slate-600';
  };

  const getEmptyStateMessage = () => {
    return emptyStateMessages[selectedTab] || emptyStateMessages.all;
  };

  const getTabGroup = (tab: TabType): string => {
    if (tab.startsWith('notice')) return 'notice';
    if (tab.startsWith('refund') || tab === 'paid') return 'refund';
    return 'all';
  };

  const currentTabGroup = getTabGroup(selectedTab);

  const tabGroups = [
    {
      key: 'notice',
      label: '中标通知',
      icon: <FileText className="w-4 h-4" />,
      tabs: [
        { key: 'notice_pending' as TabType, label: '待审核', roles: ['review_secretary'] },
        { key: 'notice_rejected' as TabType, label: '待补录', roles: ['project_manager'] },
        { key: 'notice_approved' as TabType, label: '已通过', roles: [] },
      ],
    },
    {
      key: 'refund',
      label: '保证金退还',
      icon: <Wallet className="w-4 h-4" />,
      tabs: [
        { key: 'refund_pending' as TabType, label: '待处理', roles: ['finance'] },
        { key: 'refund_rejected' as TabType, label: '待补充', roles: ['project_manager'] },
        { key: 'paid' as TabType, label: '已打款', roles: [] },
      ],
    },
  ];

  const getVisibleTabs = () => {
    if (currentUser?.role === 'review_secretary') {
      return tabGroups.map(group => ({
        ...group,
        tabs: group.key === 'notice' 
          ? group.tabs.filter(t => t.key === 'notice_pending' || t.key === 'notice_rejected' || t.key === 'notice_approved')
          : [],
      }));
    }
    if (currentUser?.role === 'project_manager') {
      return tabGroups.map(group => ({
        ...group,
        tabs: group.tabs.filter(t => t.roles.includes('project_manager') || t.roles.length === 0),
      })).filter(group => group.tabs.length > 0);
    }
    if (currentUser?.role === 'finance') {
      return tabGroups.map(group => ({
        ...group,
        tabs: group.key === 'refund' 
          ? group.tabs.filter(t => t.key === 'refund_pending' || t.key === 'refund_rejected' || t.key === 'paid')
          : [],
      }));
    }
    return tabGroups;
  };

  return (
    <Layout title="项目管理" subtitle="查看和管理所有项目">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-4 h-4" />
              全部
            </button>
            
            {getVisibleTabs().map(group => (
              <div key={group.key} className="flex items-center gap-1 border-l border-slate-200 pl-2">
                {group.tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      selectedTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {selectedProjects.length > 0 && (
              <>
                <span className="text-sm text-slate-600">
                  已选择 {selectedProjects.length} 项
                  {selectedApprovable.length > 0 && <span className="text-green-600 ml-1">（{selectedApprovable.length} 项可审核）</span>}
                  {selectedPayable.length > 0 && <span className="text-blue-600 ml-1">（{selectedPayable.length} 项可打款）</span>}
                </span>
                {(canBatchApprove || canBatchPay) && (
                  <button
                    onClick={() => setShowBatchActions(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    批量处理
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedProjects([]);
                    setShowBatchActions(false);
                    setBatchResult(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消选择
                </button>
              </>
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

        {batchResult && (
          <div className={`p-4 ${batchResult.success ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'}`}>
            <div className="flex items-center gap-2">
              {batchResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${batchResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {batchResult.message}
              </span>
            </div>
          </div>
        )}

        {selectedUnprocessable.length > 0 && (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <span className="font-medium text-amber-800">提示：</span>
                <span className="text-amber-700">
                  已选择 {selectedUnprocessable.length} 个不可处理的项目（状态已变更或无权限），这些项目不会被批量操作。
                </span>
              </div>
            </div>
          </div>
        )}

        {showBatchActions && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-blue-800 font-medium">
                  批量操作：
                  {selectedApprovable.length > 0 && <span className="text-green-700">{selectedApprovable.length} 项可审核</span>}
                  {selectedPayable.length > 0 && <span className="text-blue-700 ml-2">{selectedPayable.length} 项可打款</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canBatchApprove && (
                  <>
                    <button
                      onClick={() => setShowBatchRejectModal(true)}
                      disabled={selectedApprovable.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      批量驳回
                    </button>
                    <button
                      onClick={handleBatchApprove}
                      disabled={selectedApprovable.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      批量通过
                    </button>
                  </>
                )}
                {canBatchPay && (
                  <button
                    onClick={handleBatchPay}
                    disabled={selectedPayable.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DollarSign className="w-4 h-4" />
                    批量打款
                  </button>
                )}
                <button
                  onClick={() => setShowBatchActions(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  {selectedTab !== 'all' && processableProjects.length > 0 ? (
                    <button onClick={toggleSelectAll} className="flex items-center gap-2">
                      {selectedProjects.length === processableProjects.length && processableProjects.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  ) : <span />}
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
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        {currentTabGroup === 'notice' ? (
                          <FileText className="w-8 h-8 text-slate-400" />
                        ) : (
                          <Wallet className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <p className="text-slate-600 font-medium">{getEmptyStateMessage().title}</p>
                      {getEmptyStateMessage().description && (
                        <p className="text-sm text-slate-400 mt-1">{getEmptyStateMessage().description}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => {
                  const isApprovable = canApproveProject(project);
                  const isPayable = canPayProject(project);
                  const isProcessable = isApprovable || isPayable;
                  const isSelected = selectedProjects.includes(project.id);
                  return (
                    <tr 
                      key={project.id} 
                      className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'} ${!isProcessable && isSelected ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-4">
                        {selectedTab !== 'all' && isProcessable ? (
                          <button onClick={() => toggleSelect(project.id)} className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        ) : selectedTab !== 'all' && !isProcessable ? (
                          <div className="flex items-center gap-2">
                            <Square className="w-4 h-4 text-slate-300" />
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {getUnprocessableReason(project)}
                            </span>
                          </div>
                        ) : <span />}
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
                  );
                })
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

      {showBatchRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">批量驳回</h3>
            <p className="text-sm text-slate-500 mb-4">
              将驳回 {selectedApprovable.length} 个可审核项目
              {selectedPayable.length > 0 && (
                <span className="text-blue-600">（{selectedPayable.length} 个待打款项目不会被驳回）</span>
              )}
            </p>
            <textarea
              value={batchRejectReason}
              onChange={e => setBatchRejectReason(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="请输入驳回理由..."
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBatchRejectModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBatchReject}
                disabled={!batchRejectReason.trim() || selectedApprovable.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}