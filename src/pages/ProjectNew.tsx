import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useProjectStore } from '../stores';
import { BiddingTypes } from '../types';

export default function ProjectNew() {
  const navigate = useNavigate();
  const { createProject, loading } = useProjectStore();
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    budget: '',
    biddingType: '公开招标' as const,
    handler: '',
    documentHandler: '',
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入项目名称';
    if (!formData.client.trim()) newErrors.client = '请输入委托单位';
    if (!formData.budget || Number(formData.budget) <= 0) newErrors.budget = '请输入有效的预算金额';
    if (!formData.handler.trim()) newErrors.handler = '请选择立项负责人';
    if (!formData.documentHandler.trim()) newErrors.documentHandler = '请选择文件编制负责人';
    if (!formData.reason.trim()) newErrors.reason = '请输入立项原因（必填）';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createProject({
        ...formData,
        budget: Number(formData.budget),
        status: 'draft',
      });
      navigate('/projects');
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">新建立项</h1>
          <p className="text-sm text-gray-500 mt-1">填写项目基本信息发起立项</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                项目名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入项目名称"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                委托单位 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.client ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入委托单位"
              />
              {errors.client && <p className="text-red-500 text-xs mt-1">{errors.client}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预算金额（元） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.budget ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入预算金额"
              />
              {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                招标方式 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.biddingType}
                onChange={(e) => setFormData({ ...formData, biddingType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {BiddingTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                立项负责人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.handler}
                onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.handler ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入立项负责人"
              />
              {errors.handler && <p className="text-red-500 text-xs mt-1">{errors.handler}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文件编制负责人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.documentHandler}
                onChange={(e) => setFormData({ ...formData, documentHandler: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.documentHandler ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入文件编制负责人"
              />
              {errors.documentHandler && <p className="text-red-500 text-xs mt-1">{errors.documentHandler}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              立项原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请详细说明为什么这个项目要立项（包括委托单位需求、内部审批情况等）"
            />
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存并提交初审'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
