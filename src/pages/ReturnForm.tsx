import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhotoUpload } from '../components/PhotoUpload';
import { useAppStore } from '../store/appStore';
import type { ReturnCase } from '../types';

export function ReturnForm() {
  const navigate = useNavigate();
  const { addCase } = useAppStore();
  const [formData, setFormData] = useState({
    customerName: '',
    productName: '',
    batchNo: '',
    returnQuantity: '',
    unit: 'kg',
    returnReason: 'odor' as 'odor' | 'spec' | 'other',
    reasonDetail: '',
  });
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; description: string; uploadedAt: string }>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: ReturnCase = {
      id: `case-${Date.now()}`,
      caseNo: `RT${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      customerName: formData.customerName,
      productName: formData.productName,
      batchNo: formData.batchNo,
      returnQuantity: Number(formData.returnQuantity),
      unit: formData.unit,
      returnReason: formData.returnReason,
      reasonDetail: formData.reasonDetail,
      customerPhotos: photos.map((p) => p.url),
      status: 'registered',
      registeredAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      registeredBy: '张质检',
    };
    addCase(newCase);
    navigate('/');
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">退货登记</h2>
          <p className="text-slate-500 mt-1">录入客户退货信息，启动追溯流程</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#1E3A5F] rounded-full" />
            基本信息
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="客户名称" required>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleChange('customerName', e.target.value)}
                placeholder="请输入客户名称"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                required
              />
            </FormField>
            <FormField label="产品名称" required>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleChange('productName', e.target.value)}
                placeholder="请输入产品名称"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                required
              />
            </FormField>
            <FormField label="产品批号" required>
              <input
                type="text"
                value={formData.batchNo}
                onChange={(e) => handleChange('batchNo', e.target.value)}
                placeholder="如 B2026052803"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow font-mono"
                required
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="退货数量" required>
                <input
                  type="number"
                  value={formData.returnQuantity}
                  onChange={(e) => handleChange('returnQuantity', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  required
                />
              </FormField>
              <FormField label="单位">
                <select
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="件">件</option>
                  <option value="箱">箱</option>
                </select>
              </FormField>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#E63946] rounded-full" />
            退货原因
          </h3>
          <div className="space-y-5">
            <FormField label="原因分类" required>
              <div className="flex gap-4">
                {[
                  { value: 'odor', label: '异味问题', desc: '客户反映有异味或变质' },
                  { value: 'spec', label: '规格不符', desc: '尺寸、重量、肥瘦比例等' },
                  { value: 'other', label: '其他问题', desc: '包装、运输等其他原因' },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.returnReason === item.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="returnReason"
                      value={item.value}
                      checked={formData.returnReason === item.value}
                      onChange={(e) => handleChange('returnReason', e.target.value)}
                      className="sr-only"
                    />
                    <div className="font-medium text-slate-800">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label="详细描述">
              <textarea
                value={formData.reasonDetail}
                onChange={(e) => handleChange('reasonDetail', e.target.value)}
                placeholder="请详细描述客户反馈的问题..."
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
              />
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#F4A261] rounded-full" />
            客户提供照片
          </h3>
          <p className="text-sm text-slate-500 mb-4">上传客户提供的问题照片（可选）</p>
          <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={6} placeholderMode />
        </div>

        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A5F] text-white rounded-md hover:bg-[#2a4d7a] transition-colors shadow-sm font-medium"
          >
            <Save className="w-5 h-5" />
            保存并提交
          </button>
        </div>
      </form>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
