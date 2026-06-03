import { useState } from 'react';
import { X, Plus, Minus, Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Table, MaterialItem, TableCard, SoundSystem, MotionLine, TableShape } from '@shared/types';

interface PlanFormProps {
  banquetId: string;
  existingHall?: string;
  onClose: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export default function PlanForm({ banquetId, existingHall, onClose }: PlanFormProps) {
  const { createVersion, currentRole } = useAppStore();
  const [hall, setHall] = useState(existingHall || '');
  const [tableCount, setTableCount] = useState(10);
  const [seatsPerTable, setSeatsPerTable] = useState(10);
  const [tableShape, setTableShape] = useState<TableShape>('round');
  const [hasMainTable, setHasMainTable] = useState(true);
  const [mainTableSeats, setMainTableSeats] = useState(12);
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: generateId(), name: '餐椅', quantity: 100, unit: '把', category: 'hall', status: 'pending', scope: 'hall' },
    { id: generateId(), name: '桌布', quantity: 10, unit: '块', category: 'hall', status: 'pending', scope: 'hall' },
    { id: generateId(), name: '骨碟', quantity: 100, unit: '个', category: 'both', status: 'pending', scope: 'both' },
    { id: generateId(), name: '红酒杯', quantity: 200, unit: '个', category: 'both', status: 'pending', scope: 'both' },
    { id: generateId(), name: '晚宴套餐', quantity: 100, unit: '份', category: 'kitchen', status: 'pending', scope: 'kitchen' },
  ]);
  const [tableCards, setTableCards] = useState<TableCard[]>([]);
  const [soundSystem, setSoundSystem] = useState<SoundSystem[]>([
    { id: generateId(), name: '主音箱', position: { x: 50, y: 50 }, type: 'main', status: 'available' },
    { id: generateId(), name: '无线麦克风', position: { x: 350, y: 50 }, type: 'wireless_mic', status: 'available' },
  ]);
  const [motionLines, setMotionLines] = useState<MotionLine[]>([
    { id: generateId(), name: '宾客动线', path: [{ x: 20, y: 20 }, { x: 700, y: 20 }, { x: 700, y: 480 }], type: 'guest' },
    { id: generateId(), name: '服务动线', path: [{ x: 720, y: 100 }, { x: 720, y: 400 }], type: 'service' },
  ]);
  const [remark, setRemark] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialQty, setNewMaterialQty] = useState(1);
  const [newMaterialUnit, setNewMaterialUnit] = useState('个');
  const [newMaterialCategory, setNewMaterialCategory] = useState<'hall' | 'kitchen' | 'both'>('hall');
  const [newCardContent, setNewCardContent] = useState('');
  const [newCardType, setNewCardType] = useState<'guest' | 'vip' | 'family' | 'other'>('guest');
  const [submitting, setSubmitting] = useState(false);

  const totalGuests = tableCount * seatsPerTable + (hasMainTable ? mainTableSeats : 0);

  const handleTableCountChange = (delta: number) => {
    const newCount = Math.max(1, tableCount + delta);
    setTableCount(newCount);
  };

  const addMaterial = () => {
    if (!newMaterialName.trim()) return;
    setMaterials(prev => [...prev, {
      id: generateId(),
      name: newMaterialName,
      quantity: newMaterialQty,
      unit: newMaterialUnit,
      category: newMaterialCategory,
      status: 'pending',
      scope: newMaterialCategory === 'both' ? 'both' : newMaterialCategory,
    }]);
    setNewMaterialName('');
    setNewMaterialQty(1);
  };

  const removeMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const addTableCard = () => {
    if (!newCardContent.trim()) return;
    setTableCards(prev => [...prev, {
      id: generateId(),
      tableId: '',
      content: newCardContent,
      type: newCardType,
    }]);
    setNewCardContent('');
  };

  const removeTableCard = (id: string) => {
    setTableCards(prev => prev.filter(c => c.id !== id));
  };

  const toggleSoundSystem = (id: string) => {
    setSoundSystem(prev => prev.map(s =>
      s.id === id ? { ...s, status: s.status === 'available' ? 'missing' : 'available' } : s
    ));
  };

  const addSoundSystem = () => {
    setSoundSystem(prev => [...prev, {
      id: generateId(),
      name: '投影仪',
      position: { x: 350, y: 400 },
      type: 'projector' as const,
      status: 'available',
    }]);
  };

  const removeSoundSystem = (id: string) => {
    setSoundSystem(prev => prev.filter(s => s.id !== id));
  };

  const toggleMotionLine = (id: string) => {
    setMotionLines(prev => prev.map(m =>
      m.id === id ? { ...m, type: m.type === 'guest' ? 'service' : m.type === 'service' ? 'bride' : m.type === 'bride' ? 'emergency' : 'guest' } : m
    ));
  };

  const handleSubmit = async () => {
    if (!hall.trim()) return;
    setSubmitting(true);

    const tableLayout: Table[] = [
      ...Array.from({ length: tableCount }, (_, i) => ({
        id: generateId(),
        tableNumber: `${i + 1}`,
        shape: tableShape,
        seats: seatsPerTable,
        x: 80 + (i % 6) * 120,
        y: 100 + Math.floor(i / 6) * 110,
        rotation: 0,
      })),
      ...(hasMainTable ? [{
        id: generateId(),
        tableNumber: '主桌',
        shape: 'round' as const,
        seats: mainTableSeats,
        x: 380,
        y: 350,
        rotation: 0,
      }] : []),
    ];

    try {
      await createVersion(banquetId, {
        hall,
        tableLayout,
        materials,
        tableCards,
        soundSystem,
        motionLines,
        remark,
        changeDescription: changeDescription || '提交新方案版本',
        createdBy: currentRole === 'sales' ? '销售经理' : currentRole === 'hall_manager' ? '厅面主管' : '后厨主管',
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = currentRole === 'sales' ? '销售' : currentRole === 'hall_manager' ? '厅面主管' : '后厨主管';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-wine-800 via-wine-700 to-wine-900 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">提交方案版本</h2>
            <p className="text-champagne-200/90 text-sm">当前角色：{roleLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-wine-600 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">宴会厅</label>
            <input
              type="text"
              value={hall}
              onChange={e => setHall(e.target.value)}
              placeholder="例：水晶宴会厅A"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-500/50 focus:border-champagne-500"
            />
          </div>

          <div className="bg-champagne-50 rounded-xl p-5 border border-champagne-200">
            <h3 className="font-semibold text-wine-800 mb-4">桌型设置</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">桌数</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTableCountChange(-1)} className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={tableCount}
                    onChange={e => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border border-gray-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
                  />
                  <button onClick={() => handleTableCountChange(1)} className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">每桌人数</label>
                <select
                  value={seatsPerTable}
                  onChange={e => setSeatsPerTable(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
                >
                  {[6, 8, 10, 12].map(n => <option key={n} value={n}>{n}人</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">桌型</label>
                <select
                  value={tableShape}
                  onChange={e => setTableShape(e.target.value as TableShape)}
                  className="w-full border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
                >
                  <option value="round">圆桌</option>
                  <option value="square">方桌</option>
                  <option value="rectangle">长桌</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="bg-white rounded-lg px-3 py-1.5 border border-champagne-200 text-sm">
                  <span className="text-gray-500">预计</span>
                  <span className="font-bold text-wine-700 mx-1">{totalGuests}</span>
                  <span className="text-gray-500">位宾客</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMainTable}
                  onChange={e => setHasMainTable(e.target.checked)}
                  className="w-4 h-4 text-wine-600 rounded focus:ring-wine-500"
                />
                设主桌
              </label>
              {hasMainTable && (
                <select
                  value={mainTableSeats}
                  onChange={e => setMainTableSeats(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
                >
                  {[10, 12, 14, 16, 18, 20].map(n => <option key={n} value={n}>主桌{n}人</option>)}
                </select>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">物资清单</h3>
            <div className="space-y-2 mb-3">
              {materials.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="flex-1 font-medium text-gray-700">{m.name}</span>
                  <span className="text-sm text-gray-500">{m.quantity} {m.unit}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.category === 'hall' ? 'bg-blue-50 text-blue-700' :
                    m.category === 'kitchen' ? 'bg-forest-50 text-forest-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {m.category === 'hall' ? '厅面' : m.category === 'kitchen' ? '后厨' : '双部门'}
                  </span>
                  <button onClick={() => removeMaterial(m.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMaterialName}
                onChange={e => setNewMaterialName(e.target.value)}
                placeholder="物资名称"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
              />
              <input
                type="number"
                value={newMaterialQty}
                onChange={e => setNewMaterialQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
              />
              <select
                value={newMaterialUnit}
                onChange={e => setNewMaterialUnit(e.target.value)}
                className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
              >
                {['个', '张', '把', '块', '套', '份', '双', '人份'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select
                value={newMaterialCategory}
                onChange={e => setNewMaterialCategory(e.target.value as 'hall' | 'kitchen' | 'both')}
                className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
              >
                <option value="hall">厅面</option>
                <option value="kitchen">后厨</option>
                <option value="both">双部门</option>
              </select>
              <button onClick={addMaterial} className="px-3 py-2 bg-champagne-100 text-wine-700 rounded-lg hover:bg-champagne-200 transition-colors text-sm font-medium">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">台卡安排</h3>
            <div className="space-y-2 mb-3">
              {tableCards.map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.type === 'vip' ? 'bg-amber-50 text-amber-700' :
                    c.type === 'family' ? 'bg-pink-50 text-pink-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {c.type === 'vip' ? '贵宾' : c.type === 'family' ? '亲友' : c.type === 'guest' ? '来宾' : '其他'}
                  </span>
                  <span className="flex-1 font-medium text-gray-700">{c.content}</span>
                  <button onClick={() => removeTableCard(c.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={newCardType}
                onChange={e => setNewCardType(e.target.value as typeof newCardType)}
                className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
              >
                <option value="guest">来宾</option>
                <option value="vip">贵宾</option>
                <option value="family">亲友</option>
                <option value="other">其他</option>
              </select>
              <input
                type="text"
                value={newCardContent}
                onChange={e => setNewCardContent(e.target.value)}
                placeholder="台卡内容（如：男方亲友）"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500/50"
                onKeyDown={e => e.key === 'Enter' && addTableCard()}
              />
              <button onClick={addTableCard} className="px-3 py-2 bg-champagne-100 text-wine-700 rounded-lg hover:bg-champagne-200 transition-colors text-sm font-medium">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">音响/设备</h3>
            <div className="space-y-2 mb-3">
              {soundSystem.map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className="flex-1 font-medium text-gray-700">{s.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === 'available' ? 'bg-forest-50 text-forest-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {s.status === 'available' ? '可用' : '缺失'}
                  </span>
                  <button onClick={() => toggleSoundSystem(s.id)} className="text-xs text-wine-600 hover:text-wine-800 font-medium">
                    切换状态
                  </button>
                  <button onClick={() => removeSoundSystem(s.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addSoundSystem} className="flex items-center gap-1 text-sm text-wine-600 hover:text-wine-800 font-medium">
              <Plus size={14} />
              添加投影设备
            </button>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">动线规划</h3>
            <div className="space-y-2">
              {motionLines.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                  <span className={`w-3 h-3 rounded-full ${
                    m.type === 'bride' ? 'bg-red-500' :
                    m.type === 'guest' ? 'bg-forest-500' :
                    m.type === 'service' ? 'bg-champagne-500' :
                    'bg-orange-500'
                  }`}></span>
                  <span className="flex-1 font-medium text-gray-700">{m.name}</span>
                  <span className="text-xs text-gray-500">点击切换类型</span>
                  <button onClick={() => toggleMotionLine(m.id)} className="text-xs text-wine-600 hover:text-wine-800 font-medium">
                    {m.type === 'guest' ? '宾客' : m.type === 'service' ? '服务' : m.type === 'bride' ? '新人' : '应急'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">变更说明</label>
            <input
              type="text"
              value={changeDescription}
              onChange={e => setChangeDescription(e.target.value)}
              placeholder="描述本次方案变更内容，如：客户增加2桌，新增5名儿童"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-500/50 focus:border-champagne-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="补充说明..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-champagne-500/50 focus:border-champagne-500 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {tableCount}桌 + {hasMainTable ? '1主桌' : '无主桌'} · {totalGuests}人 · {materials.length}项物资
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors">
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !hall.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-wine-700 to-wine-800 text-white rounded-lg hover:from-wine-800 hover:to-wine-900 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {submitting ? '提交中...' : '提交方案'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
