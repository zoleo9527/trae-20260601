import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { hasPermission } from '../utils/permissions';
import { generateIdempotencyKey } from '../utils/idempotent';
import { AlertBanner } from '../components/AlertBanner';
import type { CommunicationType } from '../types';

const typeOptions: { value: CommunicationType; label: string }[] = [
  { value: 'wechat', label: '微信' },
  { value: 'phone', label: '电话' },
  { value: 'on_site', label: '现场' },
  { value: 'video', label: '视频' },
  { value: 'letter', label: '信件' },
];

const priorityOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
];

const tagOptions = ['饮食', '日常关怀', '医疗', '费用', '活动安排', '服务投诉', '护工管理', '需要跟进', '需要调查'];

const EMPTY_FORM = {
  elderId: '',
  familyMemberId: '',
  type: 'wechat' as CommunicationType,
  title: '',
  content: '',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  assignedTo: '',
  followUpNeeded: false,
  followUpDate: '',
  tags: [] as string[],
};

function buildFamilyDefaults(getMyFamilyMembers: () => any[], getMyElders: () => any[]) {
  const myMembers = getMyFamilyMembers();
  if (myMembers.length > 0) {
    const firstMember = myMembers[0];
    const firstElder = getMyElders().find((e: any) => e.id === firstMember.elderId);
    return {
      ...EMPTY_FORM,
      elderId: firstElder?.id || '',
      familyMemberId: firstMember.id,
    };
  }
  return { ...EMPTY_FORM };
}

export function CommunicationNew() {
  const navigate = useNavigate();
  const { currentUser, elders, familyMembers, createCommunication, users, getMyElders, getMyFamilyMembers } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(generateIdempotencyKey());

  const isFamily = currentUser?.role === 'family';
  const myElders = isFamily ? getMyElders() : elders;
  const myFamilyMembers = isFamily ? getMyFamilyMembers() : familyMembers;

  const [formData, setFormData] = useState(() => {
    if (isFamily) {
      return buildFamilyDefaults(getMyFamilyMembers, getMyElders);
    }
    return { ...EMPTY_FORM };
  });

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'family') {
      setFormData(buildFamilyDefaults(getMyFamilyMembers, getMyElders));
    } else {
      setFormData(prev => ({
        ...prev,
        elderId: '',
        familyMemberId: '',
        assignedTo: '',
      }));
    }
    setError(null);
  }, [currentUser?.id]);

  const canCreate = currentUser && hasPermission(currentUser.role, 'canCreateCommunication');
  const canAssign = currentUser && hasPermission(currentUser.role, 'canAssignCommunication') && currentUser.role !== 'family';

  const selectedElder = elders.find(e => e.id === formData.elderId);
  const relatedFamilies = isFamily 
    ? myFamilyMembers.filter(f => f.elderId === formData.elderId)
    : familyMembers.filter(f => f.elderId === formData.elderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      setError('您没有创建沟通记录的权限');
      return;
    }

    if (!formData.elderId || !formData.familyMemberId || !formData.title || !formData.content) {
      setError('请填写所有必填项');
      return;
    }

    if (formData.followUpNeeded && !formData.followUpDate) {
      setError('如需跟进，请选择跟进日期');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCommunication(
        {
          ...formData,
          assignedTo: formData.assignedTo || undefined,
          followUpDate: formData.followUpDate || undefined,
          createdBy: currentUser!.id,
        },
        idempotencyKey
      );

      if (result.success && result.data) {
        navigate(`/communications/${result.data.id}`);
      } else {
        setError(result.error || '创建失败，请重试');
      }
    } catch (err) {
      setError('创建失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleElderChange = (elderId: string) => {
    if (isFamily) return;
    setFormData(prev => ({
      ...prev,
      elderId,
      familyMemberId: '',
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">请先登录</h2>
        <Link to="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          返回首页
        </Link>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="text-center py-12">
        <AlertBanner type="danger" title="权限不足" message="您没有创建沟通记录的权限" />
        <Link to="/communications" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/communications" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新建家属沟通</h1>
          <p className="text-gray-500">记录与家属的沟通内容</p>
        </div>
      </div>

      {error && (
        <AlertBanner type="danger" title="提交失败" message={error} />
      )}

      <div className="card max-w-3xl">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  选择老人 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.elderId}
                  onChange={e => handleElderChange(e.target.value)}
                  className="input"
                  required
                  disabled={isFamily}
                >
                  <option value="">请选择</option>
                  {myElders.map(elder => (
                    <option key={elder.id} value={elder.id}>
                      {elder.name} ({elder.age}岁)
                    </option>
                  ))}
                </select>
                {isFamily && formData.elderId && (
                  <p className="text-xs text-gray-500 mt-1">仅可联系您关联的老人</p>
                )}
              </div>

              <div>
                <label className="label">
                  沟通方式 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as CommunicationType }))}
                  className="input"
                  required
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedElder && (
              <div>
                <label className="label">
                  家属联系人 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.familyMemberId}
                  onChange={e => isFamily ? null : setFormData(prev => ({ ...prev, familyMemberId: e.target.value }))}
                  className="input"
                  required
                  disabled={isFamily}
                >
                  <option value="">请选择家属</option>
                  {relatedFamilies.map(family => (
                    <option key={family.id} value={family.id}>
                      {family.name} ({family.relationship}) - {family.phone}
                    </option>
                  ))}
                </select>
                {isFamily && formData.familyMemberId && (
                  <p className="text-xs text-gray-500 mt-1">已自动绑定为您本人</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
                  className="input"
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {canAssign && (
                <div>
                  <label className="label">分配处理人（可选）</label>
                  <select
                    value={formData.assignedTo}
                    onChange={e => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="input"
                  >
                    <option value="">暂不分配</option>
                    {users.filter(u => u.role !== 'family').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="label">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入沟通标题"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">
                沟通内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请详细记录沟通内容..."
                className="input min-h-[150px]"
                required
              />
            </div>

            <div>
              <label className="label">标签</label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={formData.followUpNeeded}
                  onChange={e => setFormData(prev => ({ ...prev, followUpNeeded: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <label htmlFor="followUp" className="text-sm font-medium text-gray-700">
                  需要后续跟进
                </label>
              </div>
              {formData.followUpNeeded && (
                <div>
                  <label className="label">
                    跟进日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={e => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                    className="input"
                  />
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">温馨提示</p>
                <p>提交后系统将自动生成幂等键，防止重复提交。紧急事项请标记为高优先级。</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <Link to="/communications" className="btn btn-secondary">
                取消
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? '提交中...' : '保存记录'}
              </button>
              <span className="text-xs text-gray-400">幂等键: {idempotencyKey.slice(0, 20)}...</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
