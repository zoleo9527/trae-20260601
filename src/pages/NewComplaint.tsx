import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { TYPE_LABELS, SOURCE_LABELS, PRIORITY_LABELS } from '../../shared/types';
import type { ComplaintType, Priority, CreateComplaintRequest } from '../../shared/types';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewComplaint() {
  const navigate = useNavigate();
  const { createComplaint, currentUserName } = useStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    type: 'venue' as ComplaintType,
    source: 'onsite' as 'phone' | 'onsite' | 'wechat' | 'other',
    priority: 'medium' as Priority,
    title: '',
    description: '',
    relatedCoach: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.title || !form.description) {
      alert('请填写必填项');
      return;
    }

    setLoading(true);
    try {
      const data: CreateComplaintRequest = {
        ...form,
        createdBy: currentUserName,
      };
      const result = await createComplaint(data);
      navigate(`/complaints/${result.id}`);
    } catch (e) {
      console.error('创建失败:', e);
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} />
        返回
      </button>

      <div className="card p-8">
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-6">新建投诉记录</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                客户姓名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
                placeholder="请输入客户姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系电话 <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
                placeholder="请输入联系电话"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                投诉类型 <span className="text-rose-500">*</span>
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                来源渠道 <span className="text-rose-500">*</span>
              </label>
              <select
                name="source"
                value={form.source}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级 <span className="text-rose-500">*</span>
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              投诉标题 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
              placeholder="请简要描述投诉内容"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细描述 <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
              placeholder="请详细描述投诉情况..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              涉及教练（可选）
            </label>
            <input
              type="text"
              name="relatedCoach"
              value={form.relatedCoach}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
              placeholder="如涉及教练，请填写姓名"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Link to="/complaints" className="btn-secondary flex-1 text-center">
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? '保存中...' : '保存投诉记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
