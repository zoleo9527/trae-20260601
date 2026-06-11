'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MaterialType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface MaterialFormItem {
  id?: number;
  name: string;
  type: string;
  remark?: string;
}

const DEFAULT_MATERIALS: MaterialFormItem[] = [
  { name: '销售小票汇总', type: MaterialType.SALES_SLIP },
  { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT },
  { name: '增值税发票', type: MaterialType.INVOICE },
];

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function ReportFormClient({
  editId,
  initialData,
}: {
  editId?: number | null;
  initialData?: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = !!editId;

  const [reportMonth, setReportMonth] = useState(
    initialData?.reportMonth || currentMonth()
  );
  const [salesAmount, setSalesAmount] = useState<string>(
    initialData?.salesAmount ? String(initialData.salesAmount) : ''
  );
  const [rentDeduction, setRentDeduction] = useState<string>(
    initialData?.rentDeduction != null ? String(initialData.rentDeduction) : ''
  );
  const [remark, setRemark] = useState(initialData?.remark || '');
  const [materials, setMaterials] = useState<MaterialFormItem[]>(
    initialData?.materials?.map((m: any) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      remark: m.remark || '',
    })) || DEFAULT_MATERIALS
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const salesNum = parseFloat(salesAmount) || 0;
  const rentNum = parseFloat(rentDeduction) || 0;
  const netSettlement = salesNum - rentNum;
  const deductionRate = salesNum > 0 ? ((rentNum / salesNum) * 100).toFixed(1) : '0.0';

  const addMaterial = () => {
    setMaterials([
      ...materials,
      { name: '', type: MaterialType.OTHER, remark: '' },
    ]);
  };

  const updateMaterial = (idx: number, field: keyof MaterialFormItem, value: string) => {
    const updated = [...materials];
    updated[idx] = { ...updated[idx], [field]: value };
    setMaterials(updated);
  };

  const removeMaterial = (idx: number) => {
    if (materials.length <= 1) return;
    setMaterials(materials.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (submitNow: boolean) => {
    setError('');
    if (!reportMonth) {
      setError('请选择上报月份');
      return;
    }
    if (!salesAmount || salesNum <= 0) {
      setError('请填写正确的销售金额');
      return;
    }
    if (materials.some((m) => !m.name.trim())) {
      setError('请填写所有材料名称');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/reports/write';
      const body: any = {
        id: editId,
        reportMonth,
        salesAmount: salesNum,
        rentDeduction: rentNum,
        remark,
        materials: materials.map((m) => ({
          id: m.id,
          name: m.name.trim(),
          type: m.type,
          remark: m.remark || '',
        })),
        submit: submitNow,
      };

      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/reports/${data.id}`);
      } else {
        const err = await res.json();
        setError(err.error || '保存失败');
      }
    } catch (e) {
      setError('保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/reports"
          className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center"
        >
          ← 返回列表
        </Link>
      </div>

      <div className="card p-6 mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          {isEdit ? '编辑销售上报' : '新建销售上报'}
        </h1>
        <p className="text-slate-500 text-sm">
          填写销售数据并提交，营运督导将收取材料后进入复核
        </p>
      </div>

      {error && (
        <div className="card p-4 mb-6 border-red-200 bg-red-50">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="card p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="label">上报月份 <span className="text-red-500">*</span></label>
            <input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">
                  销售金额（元）<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salesAmount}
                  onChange={(e) => setSalesAmount(e.target.value)}
                  placeholder="0.00"
                  className="input"
                />
              </div>
              <div>
                <label className="label">租金扣点（元）</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rentDeduction}
                  onChange={(e) => setRentDeduction(e.target.value)}
                  placeholder="0.00"
                  className="input"
                />
                {salesNum > 0 && (
                  <p className="text-xs text-slate-500 mt-1">扣点率 {deductionRate}%</p>
                )}
              </div>
              <div>
                <label className="label text-slate-500">净结算金额</label>
                <div className="px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-brand-600 font-semibold">
                  {formatCurrency(netSettlement)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="label">备注</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="选填，补充说明..."
            className="input min-h-[80px]"
          />
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">材料清单</h2>
            <button
              type="button"
              onClick={addMaterial}
              className="btn-ghost text-sm text-brand-600"
            >
              + 添加材料
            </button>
          </div>
          <div className="space-y-3">
            {materials.map((material, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50"
              >
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-5">
                    <label className="label text-xs">材料名称</label>
                    <input
                      type="text"
                      value={material.name}
                      onChange={(e) => updateMaterial(idx, 'name', e.target.value)}
                      className="input text-sm"
                      placeholder="请输入材料名称"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="label text-xs">材料类型</label>
                    <select
                      value={material.type}
                      onChange={(e) => updateMaterial(idx, 'type', e.target.value)}
                      className="input text-sm"
                    >
                      <option value={MaterialType.SALES_SLIP}>销售小票</option>
                      <option value={MaterialType.SETTLEMENT_STATEMENT}>
                        结算对账单
                      </option>
                      <option value={MaterialType.INVOICE}>增值税发票</option>
                      <option value={MaterialType.OTHER}>其他材料</option>
                    </select>
                  </div>
                  <div className="col-span-2 pt-5">
                    {materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMaterial(idx)}
                        className="btn-ghost text-sm text-red-600"
                      >
                        移除
                      </button>
                    )}
                  </div>
                  <div className="col-span-12">
                    <label className="label text-xs">备注</label>
                    <input
                      type="text"
                      value={material.remark || ''}
                      onChange={(e) => updateMaterial(idx, 'remark', e.target.value)}
                      className="input text-sm"
                      placeholder="选填"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
        <Link href="/reports" className="btn-secondary text-center sm:order-1">
          取消
        </Link>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="btn-secondary sm:order-2"
        >
          保存草稿
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="btn-primary sm:order-3"
        >
          {isEdit ? '重新提交' : '提交审核'}
        </button>
      </div>
    </div>
  );
}
