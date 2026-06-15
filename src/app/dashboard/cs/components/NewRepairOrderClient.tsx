'use client';

import { useState } from 'react';
import { createRepairOrder } from '../actions';
import { useRouter } from 'next/navigation';

export default function NewRepairOrderClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    applianceType: '',
    applianceBrand: '',
    applianceModel: '',
    faultDescription: '',
    priority: 'NORMAL',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append('customerName', form.customerName);
    formData.append('customerPhone', form.customerPhone);
    formData.append('customerAddress', form.customerAddress);
    formData.append('applianceType', form.applianceType);
    formData.append('applianceBrand', form.applianceBrand);
    formData.append('applianceModel', form.applianceModel);
    formData.append('faultDescription', form.faultDescription);
    formData.append('priority', form.priority);
    await createRepairOrder(formData);
  };

  const step1Valid = form.customerName.trim() && form.customerPhone.trim() && form.customerAddress.trim();
  const step2Valid = form.applianceType.trim() && form.applianceBrand.trim() && form.faultDescription.trim();

  return (
    <div>
      <div className="flex items-center mb-8">
        {['客户信息', '故障详情', '确认提交'].map((label, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step > i + 1
                  ? 'bg-green-500 text-white'
                  : step === i + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                step >= i + 1 ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
            {i < 2 && <div className="w-16 h-0.5 bg-gray-200 mx-4"></div>}
          </div>
        ))}
      </div>

      <div className="card max-w-2xl">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">客户基本信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">客户姓名 *</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={form.customerName}
                  onChange={(e) => update('customerName', e.target.value)}
                />
              </div>
              <div>
                <label className="label">联系电话 *</label>
                <input
                  type="tel"
                  className="input"
                  required
                  value={form.customerPhone}
                  onChange={(e) => update('customerPhone', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">服务地址 *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="详细地址，方便工程师上门"
                value={form.customerAddress}
                onChange={(e) => update('customerAddress', e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => step1Valid && setStep(2)}
                className={`btn-primary ${!step1Valid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">家电故障详情</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">家电类型 *</label>
                <select
                  className="select"
                  required
                  value={form.applianceType}
                  onChange={(e) => update('applianceType', e.target.value)}
                >
                  <option value="">请选择</option>
                  <option value="空调">空调</option>
                  <option value="冰箱">冰箱</option>
                  <option value="洗衣机">洗衣机</option>
                  <option value="热水器">热水器</option>
                  <option value="微波炉">微波炉</option>
                  <option value="电视">电视</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="label">品牌 *</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="如：格力、海尔"
                  value={form.applianceBrand}
                  onChange={(e) => update('applianceBrand', e.target.value)}
                />
              </div>
              <div>
                <label className="label">型号</label>
                <input
                  type="text"
                  className="input"
                  placeholder="选填"
                  value={form.applianceModel}
                  onChange={(e) => update('applianceModel', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">故障描述 *</label>
              <textarea
                className="input min-h-[100px]"
                required
                placeholder="请详细描述故障现象、出现时间、使用年限等信息，便于工程师准备配件"
                value={form.faultDescription}
                onChange={(e) => update('faultDescription', e.target.value)}
              ></textarea>
            </div>
            <div>
              <label className="label">优先级</label>
              <select
                className="select max-w-xs"
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
              >
                <option value="LOW">低</option>
                <option value="NORMAL">普通</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急（2小时内响应）</option>
              </select>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                上一步
              </button>
              <button
                type="button"
                onClick={() => step2Valid && setStep(3)}
                className={`btn-primary ${!step2Valid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">确认信息并提交</h2>

            <div className="bg-blue-50 rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-blue-900">客户信息</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-gray-500">姓名：</span><span className="font-medium text-gray-900">{form.customerName}</span></div>
                <div><span className="text-gray-500">电话：</span><span className="font-medium text-gray-900 font-mono">{form.customerPhone}</span></div>
                <div className="col-span-2"><span className="text-gray-500">地址：</span><span className="font-medium text-gray-900">{form.customerAddress}</span></div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-green-900">家电与故障</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-gray-500">类型：</span><span className="font-medium text-gray-900">{form.applianceType}</span></div>
                <div><span className="text-gray-500">品牌：</span><span className="font-medium text-gray-900">{form.applianceBrand}</span></div>
                {form.applianceModel && <div className="col-span-2"><span className="text-gray-500">型号：</span><span className="font-medium text-gray-900">{form.applianceModel}</span></div>}
                <div className="col-span-2"><span className="text-gray-500">故障：</span><span className="font-medium text-gray-900">{form.faultDescription}</span></div>
                <div><span className="text-gray-500">优先级：</span><span className="font-medium text-gray-900">
                  {{ LOW: '低', NORMAL: '普通', HIGH: '高', URGENT: '紧急' }[form.priority] || form.priority}
                </span></div>
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                返回修改
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? '提交中...' : '确认提交报修单'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
