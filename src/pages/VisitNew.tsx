import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { hasPermission } from '../utils/permissions';
import { generateIdempotencyKey } from '../utils/idempotent';
import { AlertBanner } from '../components/AlertBanner';

const EMPTY_FORM = {
  elderId: '',
  familyMemberId: '',
  visitorName: '',
  visitorPhone: '',
  visitorIdCard: '',
  numberOfVisitors: 1,
  requestedDate: '',
  requestedTimeSlot: '',
  visitType: 'regular' as 'regular' | 'special' | 'emergency',
  purpose: '',
};

function buildFamilyDefaults(currentUser: { id: string; name: string; phone: string }, getMyFamilyMembers: () => any[], getMyElders: () => any[]) {
  const myMembers = getMyFamilyMembers();
  if (myMembers.length > 0) {
    const firstMember = myMembers[0];
    const firstElder = getMyElders().find((e: any) => e.id === firstMember.elderId);
    return {
      ...EMPTY_FORM,
      elderId: firstElder?.id || '',
      familyMemberId: firstMember.id,
      visitorName: currentUser.name,
      visitorPhone: currentUser.phone,
    };
  }
  return { ...EMPTY_FORM, visitorName: currentUser.name, visitorPhone: currentUser.phone };
}

export function VisitNew() {
  const navigate = useNavigate();
  const { currentUser, elders, familyMembers, createVisitAppointment, getMyElders, getMyFamilyMembers } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(generateIdempotencyKey());

  const isFamily = currentUser?.role === 'family';
  const myElders = isFamily ? getMyElders() : elders;
  const myFamilyMembers = isFamily ? getMyFamilyMembers() : familyMembers;

  const [formData, setFormData] = useState(() => {
    if (isFamily && currentUser) {
      return buildFamilyDefaults(currentUser, getMyFamilyMembers, getMyElders);
    }
    return { ...EMPTY_FORM };
  });

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'family') {
      setFormData(buildFamilyDefaults(currentUser, getMyFamilyMembers, getMyElders));
    } else {
      setFormData(prev => ({
        ...prev,
        elderId: '',
        familyMemberId: '',
        visitorName: '',
        visitorPhone: '',
      }));
    }
    setError(null);
  }, [currentUser?.id]);

  const canCreate = currentUser && hasPermission(currentUser.role, 'canCreateVisit');

  const selectedElder = elders.find(e => e.id === formData.elderId);
  const relatedFamilies = isFamily 
    ? myFamilyMembers.filter(f => f.elderId === formData.elderId)
    : familyMembers.filter(f => f.elderId === formData.elderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      setError('您没有创建预约的权限');
      return;
    }

    if (!formData.elderId || !formData.familyMemberId || !formData.visitorName || 
        !formData.visitorPhone || !formData.requestedDate || !formData.requestedTimeSlot) {
      setError('请填写所有必填项');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createVisitAppointment(
        {
          ...formData,
          notes: undefined,
          createdBy: currentUser!.id,
        },
        idempotencyKey
      );

      if (result.success && result.data) {
        navigate(`/visits/${result.data.id}`);
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
      visitorName: '',
      visitorPhone: '',
    }));
  };

  const handleFamilyChange = (familyId: string) => {
    if (isFamily) return;
    const family = familyMembers.find(f => f.id === familyId);
    if (family) {
      setFormData(prev => ({
        ...prev,
        familyMemberId: familyId,
        visitorName: family.name,
        visitorPhone: family.phone,
      }));
    }
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
        <AlertBanner type="danger" title="权限不足" message="您没有创建探视预约的权限" />
        <Link to="/visits" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/visits" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新建探视预约</h1>
          <p className="text-gray-500">创建新的探视预约申请</p>
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
                  <p className="text-xs text-gray-500 mt-1">仅可预约您关联的老人</p>
                )}
              </div>

              <div>
                <label className="label">
                  探视类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.visitType}
                  onChange={e => setFormData(prev => ({ ...prev, visitType: e.target.value as 'regular' | 'special' | 'emergency' }))}
                  className="input"
                  required
                >
                  <option value="regular">常规探视</option>
                  <option value="special">特殊探视</option>
                  <option value="emergency">紧急探视</option>
                </select>
              </div>
            </div>

            {selectedElder && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">家属联系人</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      选择家属 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.familyMemberId}
                      onChange={e => handleFamilyChange(e.target.value)}
                      className="input"
                      required
                      disabled={isFamily}
                    >
                      <option value="">请选择家属</option>
                      {relatedFamilies.map(family => (
                        <option key={family.id} value={family.id}>
                          {family.name} ({family.relationship})
                        </option>
                      ))}
                    </select>
                    {isFamily && formData.familyMemberId && (
                      <p className="text-xs text-gray-500 mt-1">已自动绑定为您本人</p>
                    )}
                  </div>
                  <div>
                    <label className="label">探视人数</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.numberOfVisitors}
                      onChange={e => setFormData(prev => ({ ...prev, numberOfVisitors: parseInt(e.target.value) || 1 }))}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  访客姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.visitorName}
                  onChange={e => isFamily ? null : setFormData(prev => ({ ...prev, visitorName: e.target.value }))}
                  placeholder="请输入访客姓名"
                  className="input"
                  required
                  readOnly={isFamily}
                />
                {isFamily && <p className="text-xs text-gray-500 mt-1">已自动填充为您本人姓名</p>}
              </div>
              <div>
                <label className="label">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.visitorPhone}
                  onChange={e => isFamily ? null : setFormData(prev => ({ ...prev, visitorPhone: e.target.value }))}
                  placeholder="请输入联系电话"
                  className="input"
                  required
                  readOnly={isFamily}
                />
                {isFamily && <p className="text-xs text-gray-500 mt-1">已自动填充为您的联系电话</p>}
              </div>
            </div>

            <div>
              <label className="label">身份证号（可选）</label>
              <input
                type="text"
                value={formData.visitorIdCard}
                onChange={e => setFormData(prev => ({ ...prev, visitorIdCard: e.target.value }))}
                placeholder="请输入访客身份证号"
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  探视日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.requestedDate}
                  onChange={e => setFormData(prev => ({ ...prev, requestedDate: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">
                  探视时段 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.requestedTimeSlot}
                  onChange={e => setFormData(prev => ({ ...prev, requestedTimeSlot: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">请选择时段</option>
                  <option value="09:00-11:00">上午 09:00-11:00</option>
                  <option value="14:00-16:00">下午 14:00-16:00</option>
                  <option value="15:00-17:00">下午 15:00-17:00</option>
                  <option value="19:00-20:00">晚上 19:00-20:00</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">探视目的</label>
              <textarea
                value={formData.purpose}
                onChange={e => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                placeholder="请简要描述探视目的"
                className="input min-h-[80px]"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">温馨提示</p>
                <p>提交后系统将自动生成幂等键，防止重复提交。预约需经护理主管审批后方可生效。</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <Link to="/visits" className="btn btn-secondary">
                取消
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? '提交中...' : '提交预约'}
              </button>
              <span className="text-xs text-gray-400">幂等键: {idempotencyKey.slice(0, 20)}...</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
