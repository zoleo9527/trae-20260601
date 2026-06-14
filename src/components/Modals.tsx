import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { TAX_TYPES, PRIORITY_LABELS, type ConsultationStatus, type UserRole } from '../types';
import { X, User, Plus, Minus, AlertCircle, ListChecks, FileText } from 'lucide-react';
import type { CreateConsultationRequest } from '../types';

interface CreateConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateConsultationModal({
  isOpen,
  onClose,
}: CreateConsultationModalProps) {
  const { users, createConsultation } = useAppStore();
  const [formData, setFormData] = useState<CreateConsultationRequest>({
    clientName: '',
    taxType: TAX_TYPES[0],
    description: '',
    consultantId: undefined,
    projectManagerId: undefined,
    clientFinanceId: undefined,
    deadline: '',
    priority: 2,
    amount: undefined,
    remarks: '',
  });

  const consultants = users.filter((u) => u.role === 'consultant');
  const managers = users.filter((u) => u.role === 'project_manager');
  const finances = users.filter((u) => u.role === 'client_finance');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.description.trim()) {
      alert('请填写客户名称和咨询描述');
      return;
    }

    try {
      const req: CreateConsultationRequest = {
        ...formData,
        deadline: formData.deadline || undefined,
        remarks: formData.remarks || undefined,
      };
      await createConsultation(req);
      onClose();
      setFormData({
        clientName: '',
        taxType: TAX_TYPES[0],
        description: '',
        consultantId: undefined,
        projectManagerId: undefined,
        clientFinanceId: undefined,
        deadline: '',
        priority: 2,
        amount: undefined,
        remarks: '',
      });
    } catch (error) {
      alert('创建失败: ' + String(error));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">新建咨询受理</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                客户名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入客户名称"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                税种 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.taxType}
                onChange={(e) =>
                  setFormData({ ...formData, taxType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TAX_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />
                税务顾问
              </label>
              <select
                value={formData.consultantId || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    consultantId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                {consultants.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />
                项目经理
              </label>
              <select
                value={formData.projectManagerId || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectManagerId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                {managers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />
                客户财务
              </label>
              <select
                value={formData.clientFinanceId || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clientFinanceId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                {finances.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                金额（元）
              </label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="可选"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              咨询描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请详细描述咨询内容、客户需求等..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="其他需要说明的事项..."
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            创建咨询
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: number;
}

interface DocTemplate {
  category: string;
  items: { name: string; desc?: string; required: boolean }[];
}

const DOC_TEMPLATES: DocTemplate[] = [
  {
    category: '企业所得税汇算清缴',
    items: [
      { name: '近一年度会计报表（资产负债表、利润表）', required: true },
      { name: '近一年度科目余额表（末级）', required: true },
      { name: '近一年度增值税纳税申报表', required: true },
      { name: '近一年度企业所得税季度预缴申报表', required: true },
      { name: '固定资产折旧明细表', required: true },
      { name: '无形资产摊销明细表', required: false },
      { name: '长期待摊费用摊销明细表', required: false },
      { name: '职工薪酬明细表（含工资、福利费、教育经费、工会经费）', required: true },
      { name: '业务招待费、广告费、业务宣传费明细', required: true },
      { name: '研发费用辅助账（如有）', desc: '享受加计扣除需提供', required: false },
      { name: '税收优惠备案表/批复文件', required: false },
      { name: '以前年度企业所得税年度申报表', required: false },
    ],
  },
  {
    category: '研发费用加计扣除',
    items: [
      { name: '研发项目立项文件', required: true },
      { name: '研发人员名单及工资薪金明细', required: true },
      { name: '研发工时记录', required: true },
      { name: '研发领料单/直接投入明细', required: true },
      { name: '研发设备清单及折旧分配表', required: true },
      { name: '研发费用辅助账（分项目）', required: true },
      { name: '研发费用汇总表', required: true },
      { name: '技术合同（委托/合作研发）', required: false },
      { name: '专利/软著等知识产权证书', required: false },
      { name: '科技型中小企业入库编号', required: false },
    ],
  },
  {
    category: '土地增值税清算',
    items: [
      { name: '国有土地使用权出让合同/转让协议', required: true },
      { name: '土地使用权证', required: true },
      { name: '项目立项批复文件', required: true },
      { name: '建设用地规划许可证', required: true },
      { name: '建设工程规划许可证', required: true },
      { name: '建筑工程施工许可证', required: true },
      { name: '商品房预售许可证', required: true },
      { name: '建设工程竣工验收备案表', required: true },
      { name: '项目规划总平面图', required: true },
      { name: '土地出让金/转让款支付凭证及发票', required: true },
      { name: '开发成本明细账及凭证', required: true },
      { name: '工程结算报告/审核报告', required: true },
      { name: '商品房销售台账（含合同、面积、金额）', required: true },
      { name: '已缴土地增值税完税凭证', required: true },
      { name: '预缴申报表及完税凭证', required: true },
    ],
  },
  {
    category: '税务稽查应对',
    items: [
      { name: '税务稽查通知书', required: true },
      { name: '自查报告（如已提交）', required: false },
      { name: '稽查期间会计凭证、账簿、报表', required: true },
      { name: '稽查期间各税种纳税申报表及完税凭证', required: true },
      { name: '发票领用存明细及已开发票清单', required: true },
      { name: '重大合同（购销、投资、借款、关联交易等）', required: true },
      { name: '关联交易明细及同期资料', required: false },
      { name: '资产损失税前扣除资料', required: false },
      { name: '税收优惠相关备案及证明资料', required: false },
      { name: '历次税务检查结论/处理决定书', required: false },
    ],
  },
  {
    category: '股权转让涉税',
    items: [
      { name: '股权转让协议', required: true },
      { name: '转让方及受让方身份证明/营业执照', required: true },
      { name: '被投资企业股东会决议', required: true },
      { name: '股权转让工商变更登记资料', required: true },
      { name: '被投资企业股权转让基准日会计报表', required: true },
      { name: '被投资企业资产负债表（近一年）', required: true },
      { name: '股权原值证明（出资凭证、验资报告等）', required: true },
      { name: '资产评估报告（如有）', required: false },
      { name: '股权转让款支付凭证', required: true },
      { name: '被投资企业不动产/无形资产清单（如有大额资产）', required: false },
      { name: '以前年度分红记录', required: false },
    ],
  },
  {
    category: '常用基础资料',
    items: [
      { name: '营业执照副本复印件', required: true },
      { name: '税务登记证/纳税人资格认定书', required: false },
      { name: '公司章程', required: true },
      { name: '验资报告/最新出资证明', required: false },
      { name: '法定代表人身份证复印件', required: false },
      { name: '银行开户许可证/基本户信息', required: false },
      { name: '房屋租赁合同（如有）', required: false },
      { name: '重大业务合同（选送）', required: false },
    ],
  },
];

export function AddDocumentModal({
  isOpen,
  onClose,
  consultationId,
}: AddDocumentModalProps) {
  const { createDocument, currentUser } = useAppStore();
  const [mode, setMode] = useState<'single' | 'batch'>('batch');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [required, setRequired] = useState(true);
  const [selectedTpl, setSelectedTpl] = useState<DocTemplate | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const selectTemplate = (tpl: DocTemplate) => {
    setSelectedTpl(tpl);
    setCheckedItems(new Set(tpl.items.map((_, i) => i)));
  };

  const toggleCheck = (idx: number) => {
    const s = new Set(checkedItems);
    if (s.has(idx)) s.delete(idx);
    else s.add(idx);
    setCheckedItems(s);
  };

  const toggleAll = () => {
    if (!selectedTpl) return;
    if (checkedItems.size === selectedTpl.items.length) {
      setCheckedItems(new Set());
    } else {
      setCheckedItems(new Set(selectedTpl.items.map((_, i) => i)));
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('请填写资料名称');
      return;
    }
    try {
      await createDocument({
        consultationId,
        itemName: itemName.trim(),
        itemDescription: itemDescription.trim() || undefined,
        required,
        operator: currentUser?.name || '系统',
      });
      setItemName('');
      setItemDescription('');
      setRequired(true);
    } catch (error) {
      alert('添加失败: ' + String(error));
    }
  };

  const handleAddBatch = async () => {
    if (!selectedTpl) {
      alert('请先选择资料模板');
      return;
    }
    const indices = Array.from(checkedItems).sort();
    if (indices.length === 0) {
      alert('请至少勾选一项资料');
      return;
    }
    setSubmitting(true);
    try {
      for (const i of indices) {
        const it = selectedTpl.items[i];
        await createDocument({
          consultationId,
          itemName: it.name,
          itemDescription: it.desc,
          required: it.required,
          operator: currentUser?.name || '系统',
        });
      }
      // 重置状态，保留弹窗方便继续添加
      setSelectedTpl(null);
      setCheckedItems(new Set());
    } catch (error) {
      alert('批量添加失败: ' + String(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold">添加资料项</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              支持模板批量添加，适合高频资料录入
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-2 border-b border-gray-100 bg-slate-50/50 flex items-center gap-1.5">
          <button
            onClick={() => setMode('batch')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'batch'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            模板批量添加
          </button>
          <button
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              mode === 'single'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            自定义单项
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {mode === 'single' ? (
            <form onSubmit={handleAddSingle}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  资料名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：近三年增值税纳税申报表"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  资料说明
                </label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus-focus-visible:outline-none"
                  placeholder="补充说明（可选）"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required-single"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="required-single" className="text-sm text-gray-700">
                  这是必填资料
                </label>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <ListChecks size={12} />
                  选择资料模板（点击快速预设常用资料）
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DOC_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.category}
                      onClick={() => selectTemplate(tpl)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        selectedTpl?.category === tpl.category
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      {tpl.category}
                      <span className="ml-1 opacity-70 font-normal">
                        ({tpl.items.length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTpl && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-700">
                      {selectedTpl.category} · 共 {selectedTpl.items.length} 项
                    </div>
                    <button
                      onClick={toggleAll}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {checkedItems.size === selectedTpl.items.length
                        ? '取消全选'
                        : '全选'}
                    </button>
                  </div>
                  <div className="max-h-[45vh] overflow-auto p-1">
                    {selectedTpl.items.map((it, idx) => {
                      const checked = checkedItems.has(idx);
                      return (
                        <label
                          key={idx}
                          className={`flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            checked ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheck(idx)}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-gray-800">
                                {it.name}
                              </span>
                              {it.required ? (
                                <span className="inline-flex px-1 py-0.5 text-[10px] bg-red-50 text-red-600 rounded border border-red-100 font-medium">
                                  必填
                                </span>
                              ) : (
                                <span className="inline-flex px-1 py-0.5 text-[10px] bg-gray-50 text-gray-500 rounded border border-gray-200">
                                  选填
                                </span>
                              )}
                            </div>
                            {it.desc && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {it.desc}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
                    <span>
                      已选{' '}
                      <span className="font-semibold text-blue-600 tabular-nums">
                        {checkedItems.size}
                      </span>{' '}
                      项
                    </span>
                    <span>
                      必填 {selectedTpl.items.filter((i) => i.required).length} /
                      选填 {selectedTpl.items.filter((i) => !i.required).length}
                    </span>
                  </div>
                </div>
              )}

              {!selectedTpl && (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  <FileText size={24} className="mx-auto mb-2 opacity-40" />
                  <p>请在上方选择一个资料模板开始</p>
                  <p className="text-xs mt-1 opacity-70">
                    也可切换到「自定义单项」手工添加
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-slate-50/50">
          {mode === 'batch' && selectedTpl && (
            <div className="text-xs text-gray-500">
              将为咨询添加{' '}
              <span className="font-semibold text-blue-600 tabular-nums">
                {checkedItems.size}
              </span>{' '}
              份资料
            </div>
          )}
          {mode === 'batch' && !selectedTpl && <div />}
          {mode === 'single' && <div />}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              关闭
            </button>

            {mode === 'single' ? (
              <button
                onClick={handleAddSingle}
                className="px-5 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium"
              >
                添加并继续
              </button>
            ) : (
              <button
                onClick={handleAddBatch}
                disabled={!selectedTpl || checkedItems.size === 0 || submitting}
                className="px-5 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {submitting
                  ? `添加中...`
                  : `批量添加 ${checkedItems.size > 0 ? `(${checkedItems.size})` : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BatchCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_TEMPLATES: {
  label: string;
  desc: string;
  taxType: string;
  priority: number;
}[] = [
  { label: '年度汇算清缴', desc: '年度企业所得税汇算清缴咨询与申报辅导', taxType: '企业所得税', priority: 2 },
  { label: '研发加计扣除', desc: '研发费用加计扣除项目资料准备与申报', taxType: '企业所得税', priority: 3 },
  { label: '税务稽查应对', desc: '配合税务稽查，提供政策支持与资料整理', taxType: '增值税', priority: 3 },
  { label: '股权转让', desc: '股权转让涉税分析、计算与申报', taxType: '个人所得税', priority: 2 },
  { label: '土增清算', desc: '土地增值税清算项目全流程咨询', taxType: '土地增值税', priority: 2 },
  { label: '税收优惠申请', desc: '高新技术企业/小微企业等税收优惠申请', taxType: '企业所得税', priority: 2 },
];

export function BatchCreateModal({
  isOpen,
  onClose,
}: BatchCreateModalProps) {
  const { users, batchCreate } = useAppStore();
  const [items, setItems] = useState<CreateConsultationRequest[]>([
    createEmptyItem(),
  ]);
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [batchTax, setBatchTax] = useState('');
  const [batchConsultant, setBatchConsultant] = useState('');
  const [batchManager, setBatchManager] = useState('');
  const [batchFinance, setBatchFinance] = useState('');
  const [batchPriority, setBatchPriority] = useState('');
  const [batchDeadlineDays, setBatchDeadlineDays] = useState('');

  function createEmptyItem(): CreateConsultationRequest {
    return {
      clientName: '',
      taxType: TAX_TYPES[0],
      description: '',
      consultantId: undefined,
      projectManagerId: undefined,
      clientFinanceId: undefined,
      deadline: '',
      priority: 2,
      amount: undefined,
      remarks: '',
    };
  }

  const addRow = (n = 1) => {
    const newRows = Array.from({ length: n }, () => createEmptyItem());
    setItems([...items, ...newRows]);
  };

  const removeRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const clearFilled = () => {
    setItems([createEmptyItem()]);
  };

  const updateItem = (
    index: number,
    field: keyof CreateConsultationRequest,
    value: any
  ) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    const newItems = [...items];
    newItems.forEach((it) => {
      if (!it.description) it.description = tpl.desc;
      if (!it.clientName || it.taxType === TAX_TYPES[0]) it.taxType = tpl.taxType;
      if (!it.clientName || it.priority === 2) it.priority = tpl.priority;
    });
    setItems(newItems);
  };

  const applyBatchField = () => {
    const newItems = [...items];
    newItems.forEach((it) => {
      if (batchTax) it.taxType = batchTax;
      if (batchConsultant) it.consultantId = Number(batchConsultant);
      if (batchManager) it.projectManagerId = Number(batchManager);
      if (batchFinance) it.clientFinanceId = Number(batchFinance);
      if (batchPriority) it.priority = Number(batchPriority);
      if (batchDeadlineDays) {
        const d = new Date();
        d.setDate(d.getDate() + Number(batchDeadlineDays));
        it.deadline = d.toISOString().split('T')[0];
      }
    });
    setItems(newItems);
    setBatchTax('');
    setBatchConsultant('');
    setBatchManager('');
    setBatchFinance('');
    setBatchPriority('');
    setBatchDeadlineDays('');
  };

  const parsePasteText = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split('\n').filter((l) => l.trim());
    const parsed: CreateConsultationRequest[] = lines.map((line) => {
      // 支持 Tab、逗号、多空格 分隔：客户 税种 描述
      const parts = line.split(/\t|,|，|\s{2,}/).map((p) => p.trim()).filter(Boolean);
      const item = createEmptyItem();
      if (parts[0]) item.clientName = parts[0];
      if (parts[1] && TAX_TYPES.includes(parts[1])) item.taxType = parts[1];
      if (parts[2]) item.description = parts[2];
      // 如果只有一列，可能是"客户+税种描述"混合，尝试拆分
      if (parts.length === 1 && parts[0]) {
        const matched = TAX_TYPES.find((t) => parts[0].includes(t));
        if (matched) {
          item.clientName = parts[0].replace(matched, '').trim() || parts[0];
          item.taxType = matched;
        }
      }
      return item;
    });
    // 如果当前首行是空的，替换；否则追加
    const firstEmpty = items.length === 1 && !items[0].clientName && !items[0].description;
    setItems(firstEmpty ? parsed : [...items, ...parsed]);
    setPasteText('');
    setShowPaste(false);
  };

  const handleSubmit = async () => {
    const validItems = items.filter(
      (item) => item.clientName.trim() && item.description.trim()
    );

    if (validItems.length === 0) {
      alert('请至少填写一条完整的记录（客户名称和咨询描述为必填）');
      return;
    }

    try {
      const cleanedItems = validItems.map((item) => ({
        ...item,
        deadline: item.deadline || undefined,
        remarks: item.remarks || undefined,
      }));
      await batchCreate(cleanedItems);
      onClose();
      setItems([createEmptyItem()]);
    } catch (error) {
      alert('批量创建失败: ' + String(error));
    }
  };

  if (!isOpen) return null;

  const consultants = users.filter((u) => u.role === 'consultant');
  const managers = users.filter((u) => u.role === 'project_manager');
  const finances = users.filter((u) => u.role === 'client_finance');

  const validCount = items.filter((i) => i.clientName && i.description).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold">批量录入咨询</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              适合高频录入场景，支持模板、批量设置、粘贴文本解析
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b border-gray-100 px-4 py-2.5 space-y-2.5 flex-shrink-0 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-500 mr-1">快捷模板：</span>
              {QUICK_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  title={`填充：${t.desc}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <span className="text-xs text-gray-500 mr-1">批量设置：</span>
              <select
                value={batchTax}
                onChange={(e) => setBatchTax(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[90px]"
              >
                <option value="">税种(不改)</option>
                {TAX_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={batchConsultant}
                onChange={(e) => setBatchConsultant(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[90px]"
              >
                <option value="">顾问(不改)</option>
                {consultants.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={batchManager}
                onChange={(e) => setBatchManager(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[90px]"
              >
                <option value="">经理(不改)</option>
                {managers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={batchFinance}
                onChange={(e) => setBatchFinance(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[90px]"
              >
                <option value="">财务(不改)</option>
                {finances.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={batchPriority}
                onChange={(e) => setBatchPriority(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[80px]"
              >
                <option value="">优先级</option>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                max="365"
                placeholder="N天后截止"
                value={batchDeadlineDays}
                onChange={(e) => setBatchDeadlineDays(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-[100px]"
              />
              <button
                onClick={applyBatchField}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              >
                应用到全部
              </button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button
                onClick={() => setShowPaste(!showPaste)}
                className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 font-medium"
              >
                粘贴文本导入
              </button>
              <button
                onClick={() => addRow(5)}
                className="px-2.5 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50"
              >
                +5 空行
              </button>
              <button
                onClick={clearFilled}
                className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                清空
              </button>
            </div>

            {showPaste && (
              <div className="p-2.5 bg-white rounded border border-blue-200 space-y-2">
                <div className="text-xs text-gray-600">
                  粘贴文本，每行一条。支持 Tab/逗号/空格 分隔：
                  <span className="text-gray-400 ml-2">格式：客户名称 [Tab] 税种 [Tab] 咨询描述</span>
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={5}
                  placeholder={'华润集团\t增值税\t税务稽查应对\n万科地产\t土地增值税\t土增清算辅导\n华为技术'}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowPaste(false);
                      setPasteText('');
                    }}
                    className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                  >
                    取消
                  </button>
                  <button
                    onClick={parsePasteText}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                  >
                    解析并追加
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b w-8">
                      #
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b min-w-[140px]">
                      客户名称 *
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b min-w-[90px]">
                      税种 *
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b min-w-[200px]">
                      咨询描述 *
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b w-[100px]">
                      顾问
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b w-[100px]">
                      经理
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b w-[100px]">
                      财务
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b w-[70px]">
                      优先级
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-b w-[120px]">
                      截止日期
                    </th>
                    <th className="px-2 py-1.5 border-b w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 ${
                        item.clientName && item.description
                          ? 'bg-green-50/30'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-2 py-1.5 text-xs text-gray-400 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={item.clientName}
                          onChange={(e) =>
                            updateItem(index, 'clientName', e.target.value)
                          }
                          placeholder="客户名称"
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-400"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={item.taxType}
                          onChange={(e) =>
                            updateItem(index, 'taxType', e.target.value)
                          }
                          className="w-full px-1.5 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {TAX_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, 'description', e.target.value)
                          }
                          placeholder="咨询描述/需求"
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-400"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={item.consultantId || ''}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'consultantId',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-</option>
                          {consultants.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={item.projectManagerId || ''}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'projectManagerId',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-</option>
                          {managers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={item.clientFinanceId || ''}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'clientFinanceId',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-</option>
                          {finances.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={item.priority}
                          onChange={(e) =>
                            updateItem(index, 'priority', Number(e.target.value))
                          }
                          className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={item.deadline}
                          onChange={(e) =>
                            updateItem(index, 'deadline', e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          disabled={items.length === 1}
                          className="p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
            <button
              type="button"
              onClick={() => addRow(1)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium"
            >
              <Plus size={14} />
              添加一行
            </button>

            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
                共 <span className="font-semibold text-gray-700 tabular-nums">{items.length}</span> 条
                {validCount > 0 && (
                  <span className="ml-2">
                    · 有效{' '}
                    <span className="font-semibold text-green-600 tabular-nums">
                      {validCount}
                    </span>{' '}
                    条
                  </span>
                )}
                {validCount < items.length && (
                  <span className="ml-2 text-amber-600">
                    {items.length - validCount} 条待完善
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={validCount === 0}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            批量创建 {validCount > 0 && `(${validCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface StatusChangeOption {
  status: ConsultationStatus;
  handlerRole: UserRole;
  label: string;
}

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: number;
  option: StatusChangeOption | null;
  currentHandlerName?: string;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  consultationId,
  option,
  currentHandlerName,
}: StatusChangeModalProps) {
  const { updateStatus, currentUser, users } = useAppStore();
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasonRequired =
    option?.status === '已退回' ||
    option?.status === '待补录' ||
    option?.status === '补录中' ||
    option?.status === '待复核';

  const getHandlerNameByRole = (role: UserRole): string => {
    const roleUsers = users.filter((u) => u.role === role);
    return roleUsers.length > 0 ? roleUsers[0].name : currentHandlerName || '待分配';
  };

  const handleSubmit = async () => {
    if (!option || !currentUser) return;
    if (reasonRequired && !reason.trim()) {
      alert('请填写原因');
      return;
    }

    setSubmitting(true);
    try {
      await updateStatus({
        id: consultationId,
        status: option.status,
        currentHandler: getHandlerNameByRole(option.handlerRole),
        handlerRole: option.handlerRole,
        reason: reason.trim() || undefined,
        remarks: remarks.trim() || undefined,
        operator: currentUser.name,
        operatorRole: currentUser.role as UserRole,
      });
      onClose();
      setReason('');
      setRemarks('');
    } catch (error) {
      alert('操作失败: ' + String(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !option) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{option.label}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              状态变更为：<span className="font-medium text-gray-700">{option.status}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {reasonRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <AlertCircle size={14} className="inline mr-1 text-red-500" />
                原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  option.status === '已退回'
                    ? '请填写退回原因，例如：资料不完整、信息有误等...'
                    : option.status === '待补录'
                    ? '请填写需要补录的具体内容说明...'
                    : option.status === '补录中'
                    ? '请填写补录范围或说明...'
                    : '请填写复核说明...'
                }
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="补充说明（可选）"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <p>
              <strong>流转说明：</strong>
              操作人：<span className="font-medium">{currentUser?.name || '-'}</span>
              {' · '}
              处理人角色：<span className="font-medium">
                {option.handlerRole === 'consultant'
                  ? '税务顾问'
                  : option.handlerRole === 'project_manager'
                  ? '项目经理'
                  : '客户财务'}
              </span>
            </p>
            <p className="text-blue-600 mt-1">
              本次操作将记录至操作日志，责任可追溯。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (reasonRequired && !reason.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '处理中...' : '确认操作'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface UpdateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  documentName: string;
  currentStatus: string;
}

export function UpdateDocumentModal({
  isOpen,
  onClose,
  documentId,
  documentName,
  currentStatus,
}: UpdateDocumentModalProps) {
  const { updateDocument, currentUser } = useAppStore();
  const [status, setStatus] = useState(currentStatus);
  const [providedBy, setProvidedBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [remarks, setRemarks] = useState('');
  const [incompleteReason, setIncompleteReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const docStatusOptions: { value: string; label: string }[] = [
    { value: '已要求提供', label: '已要求提供' },
    { value: '客户已提供', label: '客户已提供' },
    { value: '已收到', label: '已收到' },
    { value: '已豁免', label: '已豁免' },
  ];

  const handleSubmit = async () => {
    if (!currentUser) return;

    setSubmitting(true);
    try {
      await updateDocument({
        id: documentId,
        status: status as any,
        providedBy: providedBy.trim() || undefined,
        receivedBy: receivedBy.trim() || undefined,
        remarks: remarks.trim() || undefined,
        incompleteReason: incompleteReason.trim() || undefined,
        operator: currentUser.name,
        operatorRole: currentUser.role as UserRole,
      });
      onClose();
      setProvidedBy('');
      setReceivedBy('');
      setRemarks('');
      setIncompleteReason('');
    } catch (error) {
      alert('操作失败: ' + String(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">更新资料状态</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-sm">
              {documentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              状态
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {docStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {status === '客户已提供' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                提供人
              </label>
              <input
                type="text"
                value={providedBy}
                onChange={(e) => setProvidedBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：孙财务"
                autoFocus
              />
            </div>
          )}

          {status === '已收到' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提供人
                </label>
                <input
                  type="text"
                  value={providedBy}
                  onChange={(e) => setProvidedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：孙财务"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  接收人
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={currentUser?.name || '接收人姓名'}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              不完整原因（如资料缺失请填写）
            </label>
            <textarea
              value={incompleteReason}
              onChange={(e) => setIncompleteReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="可选：如原件缺失、盖章不清晰、缺少签字等"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="补充说明（可选）"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '处理中...' : '确认更新'}
          </button>
        </div>
      </div>
    </div>
  );
}
