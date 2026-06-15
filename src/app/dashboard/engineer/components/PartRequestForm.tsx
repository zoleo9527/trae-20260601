'use client';

import { useState } from 'react';
import { createPartRequest } from '../actions';
import Link from 'next/link';

interface Part {
  id: string;
  partNo: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
}

interface Props {
  parts: Part[];
  orderId: string;
  orderNo: string;
}

export default function PartRequestForm({ parts, orderId, orderNo }: Props) {
  const [selectedParts, setSelectedParts] = useState<{ partId: string; qty: number }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const categories = [...new Set(parts.map((p) => p.category))];

  const filteredParts = parts.filter(
    (p) =>
      (!categoryFilter || p.category === categoryFilter) &&
      (!search || p.name.includes(search) || p.partNo.includes(search))
  );

  const togglePart = (partId: string) => {
    setSelectedParts((prev) => {
      const exists = prev.find((p) => p.partId === partId);
      if (exists) {
        return prev.filter((p) => p.partId !== partId);
      }
      return [...prev, { partId, qty: 1 }];
    });
  };

  const updateQty = (partId: string, qty: number) => {
    setSelectedParts((prev) =>
      prev.map((p) => (p.partId === partId ? { ...p, qty: Math.max(1, qty) } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    selectedParts.forEach((sp) => {
      formData.append('partIds', sp.partId);
      formData.append('quantities', String(sp.qty));
    });
    const result = await createPartRequest(formData);
    if (result.success) {
      window.location.href = `/dashboard/engineer/orders/${orderId}`;
    } else {
      alert(result.error || '提交失败');
    }
  };

  const totalAmount = selectedParts.reduce((sum, sp) => {
    const part = parts.find((p) => p.id === sp.partId);
    return sum + (part ? part.price * sp.qty : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/engineer/orders/${orderId}`} className="text-blue-600 hover:underline text-sm">
            ← 返回工单 {orderNo}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">申请配件</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="搜索配件名称或编号..."
                className="input flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="select max-w-xs"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">全部分类</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {filteredParts.map((part) => {
                const selected = selectedParts.find((s) => s.partId === part.id);
                return (
                  <div
                    key={part.id}
                    onClick={() => togglePart(part.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => togglePart(part.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="font-medium text-gray-900">{part.name}</span>
                          <span className="text-xs text-gray-500 font-mono">#{part.partNo}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500 ml-6">
                          {part.category} · 库存 {part.stock} {part.unit} · 单价 ¥{part.price}
                        </div>
                      </div>
                      {selected && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQty(part.id, selected.qty - 1);
                            }}
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{selected.qty}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQty(part.id, selected.qty + 1);
                            }}
                            className="w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredParts.length === 0 && (
                <div className="text-center py-8 text-gray-400">未找到匹配的配件</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="card sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">申请清单</h3>

            {selectedParts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                还未选择配件
                <p className="text-xs mt-1">点击左侧配件进行选择</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-auto">
                  {selectedParts.map((sp) => {
                    const part = parts.find((p) => p.id === sp.partId)!;
                    return (
                      <div key={sp.partId} className="flex justify-between text-sm py-1 border-b border-gray-50">
                        <div>
                          <div className="font-medium text-gray-900">{part.name}</div>
                          <div className="text-xs text-gray-500">¥{part.price} × {sp.qty}</div>
                        </div>
                        <div className="font-medium">¥{(part.price * sp.qty).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between py-3 border-t border-gray-200 font-semibold">
                  <span>合计</span>
                  <span className="text-lg text-blue-600">¥{totalAmount.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="mt-4">
              <label className="label">申请备注</label>
              <textarea
                name="note"
                className="input min-h-[80px]"
                placeholder="说明更换原因、现场情况等"
              ></textarea>
            </div>

            <input type="hidden" name="orderId" value={orderId} />

            <button
              type="submit"
              className="btn-primary w-full mt-4"
              disabled={selectedParts.length === 0}
            >
              提交配件申请
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
