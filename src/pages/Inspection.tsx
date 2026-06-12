import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  KeyRound,
  UserCheck,
  CalendarDays,
  FileEdit,
  Save,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import StepNavigator from '@/components/common/StepNavigator';
import PhotoUploader from '@/components/common/PhotoUploader';
import { InspectionStatusBadge } from '@/components/common/StatusBadge';
import { generateId, formatCurrency } from '@/utils/formatters';
import type { Inspection, InspectionItem, InspectionStatus, KeyHandover } from '@/types';

const DEFAULT_CATEGORIES = ['墙面', '地面', '天花', '门窗', '空调', '消防', '家具'];

const INSPECTION_OPTIONS: { value: InspectionStatus; label: string; className: string }[] = [
  { value: 'normal', label: '正常', className: 'bg-sage-50 text-sage-700 border-sage-200 hover:bg-sage-100 data-[active=true]:bg-sage-500 data-[active=true]:text-white data-[active=true]:border-sage-500' },
  { value: 'damaged', label: '损坏', className: 'bg-coral-50 text-coral-700 border-coral-200 hover:bg-coral-100 data-[active=true]:bg-coral-500 data-[active=true]:text-white data-[active=true]:border-coral-500' },
  { value: 'missing', label: '缺失', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500' },
];

export default function InspectionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const app = useAppStore((s) => s.getApplicationById(id || ''));
  const updateInspection = useAppStore((s) => s.updateInspection);
  const updateApplicationStatus = useAppStore((s) => s.updateApplicationStatus);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const defaultItems: InspectionItem[] = DEFAULT_CATEGORIES.map((cat, idx) => ({
    id: `itm_default_${idx}`,
    category: cat,
    name: `${cat}检查`,
    status: 'normal' as InspectionStatus,
    description: '',
    photos: [],
  }));

  const defaultKeys: KeyHandover[] = [
    { type: '入户大门钥匙', quantity: 5, handedOver: false },
    { type: '办公室内门钥匙', quantity: 8, handedOver: false },
    { type: '抽屉柜钥匙', quantity: 12, handedOver: false },
    { type: '门禁卡', quantity: 15, handedOver: false },
  ];

  const [inspection, setInspection] = useState<Inspection>(
    app?.inspection || {
      id: generateId('ins'),
      inspector: '王经理',
      inspectionDate: new Date().toISOString().slice(0, 10),
      items: defaultItems,
      keys: defaultKeys,
      remark: '',
    }
  );

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const updateItem = (itemId: string, patch: Partial<InspectionItem>) => {
    setInspection((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    }));
  };

  const updateKey = (idx: number, patch: Partial<KeyHandover>) => {
    setInspection((prev) => ({
      ...prev,
      keys: prev.keys.map((k, i) => (i === idx ? { ...k, ...patch } : k)),
    }));
  };

  const handleSave = () => {
    updateInspection(app.id, inspection);
    navigate(`/application/${app.id}/cost`);
  };

  if (!app) {
    return (
      <div className="text-center py-20 text-navy-500">
        申请记录不存在
      </div>
    );
  }

  const damagedCount = inspection.items.filter((i) => i.status !== 'normal').length;
  const estimatedTotal = inspection.items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);

  return (
    <div className="animate-fade-in opacity-0">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/application/${app.id}`)}
          className="w-10 h-10 rounded-lg bg-white border border-navy-100 flex items-center justify-center text-navy-600 hover:bg-navy-50 transition-colors"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2} />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">退场验收</h1>
          <p className="text-sm text-navy-500 mt-1">运营经理对房屋状况进行逐项验收并拍照记录</p>
        </div>
      </div>

      <StepNavigator currentStep={1} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 animate-fade-in-up opacity-0 stagger-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">
                <FileEdit className="w-5 h-5 text-navy-600" />
                验收清单
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-navy-500">
                  异常项：<span className="font-semibold text-coral-600">{damagedCount}</span>
                </span>
                <span className="text-navy-500">
                  预估维修：<span className="font-serif font-semibold text-amber-600 money-text">{formatCurrency(estimatedTotal)}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {inspection.items.map((item, idx) => {
                const isExpanded = expandedItems.has(item.id) || item.status !== 'normal';
                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg overflow-hidden transition-all duration-200 animate-fade-in-up opacity-0 ${
                      item.status !== 'normal'
                        ? 'border-coral-200 bg-coral-50/30'
                        : 'border-navy-100 bg-white hover:border-navy-200'
                    }`}
                    style={{ animationDelay: `${50 + idx * 40}ms` }}
                  >
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium shrink-0 ${
                            item.status === 'normal'
                              ? 'bg-sage-100 text-sage-600'
                              : item.status === 'damaged'
                              ? 'bg-coral-100 text-coral-600'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.category.charAt(0)}
                        </div>
                        <span className="font-medium text-navy-800">{item.name}</span>
                      </div>
                      <InspectionStatusBadge status={item.status} />
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-navy-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-navy-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-navy-100/50 space-y-4 animate-fade-in">
                        <div>
                          <p className="text-xs text-navy-500 mb-2">验收状态</p>
                          <div className="flex gap-2">
                            {INSPECTION_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => updateItem(item.id, { status: opt.value })}
                                data-active={item.status === opt.value}
                                className={`px-4 py-1.5 rounded text-sm font-medium border transition-all ${opt.className}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.status !== 'normal' && (
                          <>
                            <div>
                              <p className="text-xs text-navy-500 mb-2">问题描述</p>
                              <textarea
                                className="input-field min-h-[70px] resize-none"
                                placeholder="请详细描述损坏或缺失情况..."
                                value={item.description}
                                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                              />
                            </div>
                            <div>
                              <p className="text-xs text-navy-500 mb-2">现场照片</p>
                              <PhotoUploader
                                photos={item.photos}
                                onChange={(photos) => updateItem(item.id, { photos })}
                              />
                            </div>
                            <div>
                              <p className="text-xs text-navy-500 mb-2">预估维修费用（元）</p>
                              <input
                                type="number"
                                className="input-field max-w-[200px]"
                                placeholder="0.00"
                                value={item.estimatedCost || ''}
                                onChange={(e) =>
                                  updateItem(item.id, { estimatedCost: Number(e.target.value) || 0 })
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-2">
            <h2 className="section-title">
              <KeyRound className="w-5 h-5 text-navy-600" />
              钥匙及物品交接
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100">
                    <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">物品类型</th>
                    <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">应归还数量</th>
                    <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider w-40">交接状态</th>
                  </tr>
                </thead>
                <tbody>
                  {inspection.keys.map((key, idx) => (
                    <tr key={idx} className="border-b border-navy-50 last:border-0">
                      <td className="py-3 px-3 text-navy-800">{key.type}</td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          className="input-field max-w-[100px] py-1.5"
                          value={key.quantity}
                          onChange={(e) => updateKey(idx, { quantity: Number(e.target.value) })}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={key.handedOver}
                            onChange={(e) => updateKey(idx, { handedOver: e.target.checked })}
                            className="w-4 h-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500"
                          />
                          <span className={key.handedOver ? 'text-sage-600 font-medium' : 'text-navy-500'}>
                            {key.handedOver ? '已交接' : '未交接'}
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-3">
            <h2 className="section-title">
              <FileEdit className="w-5 h-5 text-navy-600" />
              验收结论
            </h2>
            <textarea
              className="input-field min-h-[100px] resize-none"
              placeholder="请填写验收整体结论及备注说明..."
              value={inspection.remark}
              onChange={(e) => setInspection((prev) => ({ ...prev, remark: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 sticky top-6 animate-fade-in-up opacity-0 stagger-4">
            <h3 className="font-serif text-base font-semibold text-navy-800 mb-4">验收信息</h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="label-field">验收人</label>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-navy-400" strokeWidth={2} />
                  <input
                    className="input-field"
                    value={inspection.inspector}
                    onChange={(e) => setInspection((prev) => ({ ...prev, inspector: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label-field">验收日期</label>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-navy-400" strokeWidth={2} />
                  <input
                    type="date"
                    className="input-field"
                    value={inspection.inspectionDate}
                    onChange={(e) => setInspection((prev) => ({ ...prev, inspectionDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-navy-100">
                <div className="flex justify-between py-2">
                  <span className="text-navy-500">验收项总数</span>
                  <span className="text-navy-800 font-medium">{inspection.items.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-navy-500">异常项</span>
                  <span className="text-coral-600 font-medium">{damagedCount}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-navy-500">已交接钥匙</span>
                  <span className="text-sage-600 font-medium">
                    {inspection.keys.filter((k) => k.handedOver).length}/
                    {inspection.keys.length}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-navy-100 mt-2 pt-4">
                  <span className="text-navy-600 font-medium">预估维修费</span>
                  <span className="font-serif text-lg font-semibold text-amber-600 money-text">
                    {formatCurrency(estimatedTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-navy-100 space-y-3">
              <button onClick={handleSave} className="btn-primary w-full">
                <Save className="w-4 h-4" />
                保存验收结果
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  updateApplicationStatus(app.id, 'costing');
                  navigate(`/application/${app.id}/cost`);
                }}
                className="btn-secondary w-full"
              >
                跳过，直接核算费用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
