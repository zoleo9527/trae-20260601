'use client';

import { useState } from 'react';
import { createRepairOrder } from './actions';

export default function NewRepairOrderClient() {
  const [step, setStep] = useState(1);

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

      <form action={createRepairOrder} className="card max-w-2xl">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">客户基本信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">客户姓名 *</label>
                <input type="text" name="customerName" className="input" required />
              </div>
              <div>
                <label className="label">联系电话 *</label>
                <input type="tel" name="customerPhone" className="input" required />
              </div>
            </div>
            <div>
              <label className="label">服务地址 *</label>
              <input type="text" name="customerAddress" className="input" required placeholder="详细地址，方便工程师上门" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="btn-primary">
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
                <select name="applianceType" className="select" required>
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
                <input type="text" name="applianceBrand" className="input" required placeholder="如：格力、海尔" />
              </div>
              <div>
                <label className="label">型号</label>
                <input type="text" name="applianceModel" className="input" placeholder="选填" />
              </div>
            </div>
            <div>
              <label className="label">故障描述 *</label>
              <textarea
                name="faultDescription"
                className="input min-h-[100px]"
                required
                placeholder="请详细描述故障现象、出现时间、使用年限等信息，便于工程师准备配件"
              ></textarea>
            </div>
            <div>
              <label className="label">优先级</label>
              <select name="priority" className="select max-w-xs">
                <option value="LOW">低</option>
                <option value="NORMAL" selected>普通</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急（2小时内响应）</option>
              </select>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                上一步
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary">
                下一步
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">确认信息并提交</h2>
            <div className="bg-gray-50 rounded-lg p-5 space-y-3">
              <p className="text-sm text-gray-500">请确认以下信息无误后提交，提交后将进入受理流程。</p>
              <div className="text-sm text-gray-600">
                <p>系统将自动生成工单号并分配给客服受理。</p>
                <p className="mt-1">客户会收到短信通知（演示模式）。</p>
              </div>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                返回修改
              </button>
              <button type="submit" className="btn-primary">
                确认提交报修单
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
