import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, FileText, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { useProjectStore } from '../stores';
import { ProjectStatusLabels, ProjectStatus, StatusHistory } from '../types';
import clsx from 'clsx';

const statusConfig: Record<ProjectStatus, { color: string; icon: any; nextAction?: string }> = {
  draft: { color: 'gray', icon: FileText, nextAction: '提交初审' },
  initial_review: { color: 'yellow', icon: Clock, nextAction: '初审通过' },
  re_review: { color: 'orange', icon: Clock, nextAction: '复审通过' },
  approved: { color: 'green', icon: CheckCircle },
  rejected: { color: 'red', icon: AlertCircle, nextAction: '重新提交' },
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProjectStatus, loading } = useProjectStore();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [history, setHistory] = useState<StatusHistory[]>([]);

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchStatusHistory();
    }
  }, [id]);

  const fetchStatusHistory = async () => {
    try {
      const result = await fetch(`/api/status-history?entityType=project&entityId=${id}`);
      const data = await result.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('获取状态历史失败:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!currentProject || !statusReason.trim()) return;

    const statusTransitions: Record<ProjectStatus, ProjectStatus | null> = {
      draft: 'initial_review',
      initial_review: 're_review',
      re_review: 'approved',
      approved: null,
      rejected: 'draft',
    };

    const nextStatus = statusTransitions[currentProject.status];
    if (!nextStatus) return;

    try {
      await updateProjectStatus(currentProject.id, nextStatus, statusReason);
      setShowStatusModal(false);
      setStatusReason('');
      fetchStatusHistory();
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const config = statusConfig[currentProject.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentProject.name}</h1>
              <p className="text-sm text-gray-500 mt-1">项目编号: {currentProject.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                `bg-${config.color}-100 text-${config.color}-700`
              )}>
                <StatusIcon className="w-4 h-4" />
                {ProjectStatusLabels[currentProject.status]}
              </span>
              {config.nextAction && (
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {config.nextAction}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">基本信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">委托单位</span>
                  <span className="text-sm font-medium text-gray-900">{currentProject.client}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">预算金额</span>
                  <span className="text-sm font-medium text-gray-900">¥{currentProject.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">招标方式</span>
                  <span className="text-sm font-medium text-gray-900">{currentProject.biddingType}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">责任人员</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">立项负责人</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{currentProject.handler}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">文件编制负责人</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{currentProject.documentHandler}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">立项原因</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentProject.reason}</p>
            </div>
          </div>

          {currentProject.status === 'approved' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">文件编制</h3>
                <Link
                  to={`/documents?projectId=${currentProject.id}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  查看文件编制详情
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">状态变更历史</h2>
        </div>
        <div className="p-6">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">暂无状态变更记录</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {history.map((record, index) => (
                  <div key={record.id} className="relative pl-10">
                    <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-primary-600 border-2 border-white" />
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {record.fromStatus ? `${ProjectStatusLabels[record.fromStatus as ProjectStatus]} → ` : ''}
                          {ProjectStatusLabels[record.toStatus as ProjectStatus]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(record.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{record.reason}</p>
                      <p className="text-xs text-gray-400">操作人: {record.changedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">更新状态</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                变更原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入变更原因"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={!statusReason.trim() || loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
