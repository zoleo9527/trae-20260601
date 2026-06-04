import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, MessageSquare, FileText, Clock, Check, AlertTriangle, Send } from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { AlertBanner } from '../components/AlertBanner';
import { formatDateTime } from '../utils/date';
import { hasPermission } from '../utils/permissions';
import type { CommunicationStatus } from '../types';

const typeLabels: Record<string, string> = {
  wechat: '微信',
  phone: '电话',
  on_site: '现场',
  video: '视频',
  letter: '信件',
};

export function CommunicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [resolution, setResolution] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CommunicationStatus>('in_progress');

  const {
    currentUser,
    communications,
    elders,
    familyMembers,
    users,
    updateCommunicationStatus,
    assignCommunication,
  } = useStore();

  const comm = communications.find(c => c.id === id);
  const elder = elders.find(e => e.id === comm?.elderId);
  const family = familyMembers.find(f => f.id === comm?.familyMemberId);
  const assignedToUser = users.find(u => u.id === comm?.assignedTo);
  const createdByUser = users.find(u => u.id === comm?.createdBy);

  if (!comm || !elder) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">沟通记录不存在</h2>
        <Link to="/communications" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          返回列表
        </Link>
      </div>
    );
  }

  const canEdit = currentUser && (
    currentUser.role === 'nurse_manager' ||
    comm.assignedTo === currentUser.id ||
    comm.createdBy === currentUser.id
  );

  const canAssign = currentUser && hasPermission(currentUser.role, 'canAssignCommunication');
  const isStuck = comm.status === 'stuck' || comm.status === 'escalated';

  const handleUpdateStatus = async () => {
    if (selectedStatus === 'completed' && !resolution.trim()) return;
    await updateCommunicationStatus(
      comm.id, 
      selectedStatus, 
      replyContent || undefined, 
      selectedStatus === 'completed' ? resolution : undefined
    );
    setReplyContent('');
    setResolution('');
  };

  const handleAssign = async (userId: string) => {
    await assignCommunication(comm.id, userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/communications" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{comm.title}</h1>
          <p className="text-gray-500">编号：{comm.requestId}</p>
        </div>
      </div>

      {isStuck && (
        <AlertBanner
          type="danger"
          title="⚠️ 此沟通记录异常"
          message={comm.status === 'escalated' 
            ? '该事项已升级，需要管理层介入处理。' 
            : '该沟通已超时未处理，请立即跟进。'}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">沟通详情</h2>
                <StatusBadge status={comm.status} type="communication" />
                <PriorityBadge priority={comm.priority} />
              </div>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageSquare className="h-4 w-4" />
                <span>沟通方式：{typeLabels[comm.type] || comm.type}</span>
                <span className="mx-2">·</span>
                <Clock className="h-4 w-4" />
                <span>创建时间：{formatDateTime(comm.createdAt)}</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{comm.content}</p>
              </div>

              {comm.resolution && (
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <h4 className="font-medium text-success-800 mb-2">处理结果</h4>
                  <p className="text-success-700">{comm.resolution}</p>
                </div>
              )}

              {comm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {comm.tags.map(tag => (
                    <span key={tag} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {comm.followUpNeeded && comm.followUpDate && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">需要跟进，日期：{comm.followUpDate}</span>
                </div>
              )}
            </div>
          </div>

          {canEdit && comm.status !== 'completed' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">更新状态</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">变更状态</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value as CommunicationStatus)}
                    className="input"
                  >
                    <option value="in_progress">处理中</option>
                    <option value="pending">待处理</option>
                    <option value="escalated">已升级</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>

                <div>
                  <label className="label">回复/备注</label>
                  <textarea
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    placeholder="输入回复内容或处理备注..."
                    className="input min-h-[100px]"
                  />
                </div>

                {selectedStatus === 'completed' && (
                  <div>
                    <label className="label">处理结果</label>
                    <textarea
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      placeholder="请输入最终处理结果..."
                      className="input min-h-[80px]"
                    />
                  </div>
                )}

                <button
                  onClick={handleUpdateStatus}
                  className="btn btn-primary flex items-center gap-2"
                  disabled={selectedStatus === 'completed' && !resolution.trim()}
                >
                  <Send className="h-4 w-4" />
                  提交更新
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                状态变更历史
              </h2>
            </div>
            <div className="card-body">
              <StatusTimeline history={comm.statusHistory} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">老人信息</h2>
            </div>
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{elder.name}</p>
                  <p className="text-sm text-gray-500">{elder.age}岁 / {elder.gender === 'male' ? '男' : '女'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">健康状态</span>
                  <span className="text-gray-900">
                    {elder.healthStatus === 'good' ? '良好' : 
                     elder.healthStatus === 'fair' ? '一般' :
                     elder.healthStatus === 'poor' ? '较差' : '危重'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">入住日期</span>
                  <span className="text-gray-900">{elder.checkInDate}</span>
                </div>
              </div>
              <Link to={`/elders/${elder.id}`} className="btn btn-secondary w-full mt-4 block text-center">
                查看完整档案
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">家属信息</h2>
            </div>
            <div className="card-body">
              {family ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{family.name}</p>
                      <p className="text-sm text-gray-500">{family.relationship}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{family.phone}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm">家属信息未记录</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">处理信息</h2>
            </div>
            <div className="card-body space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">创建人</span>
                <span className="text-gray-900">{createdByUser?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">当前处理人</span>
                <span className="text-gray-900">{assignedToUser?.name || '未分配'}</span>
              </div>
              {comm.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">分配时间</span>
                  <span className="text-gray-900">{formatDateTime(comm.assignedAt)}</span>
                </div>
              )}
              {comm.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">完成时间</span>
                  <span className="text-gray-900">{formatDateTime(comm.completedAt)}</span>
                </div>
              )}
            </div>

            {canAssign && comm.status !== 'completed' && (
              <div className="border-t border-gray-200 mt-4 pt-4">
                <label className="label">分配处理人</label>
                <select
                  value={comm.assignedTo || ''}
                  onChange={e => e.target.value && handleAssign(e.target.value)}
                  className="input"
                >
                  <option value="">选择处理人</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isStuck && (
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">异常处理</span>
                </div>
                <p className="text-xs text-red-500 mb-3">
                  此记录已超时或升级，请优先处理
                </p>
                <button
                  onClick={() => setSelectedStatus('in_progress')}
                  className="btn btn-warning w-full flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  开始处理
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
