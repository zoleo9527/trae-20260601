import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Plus,
  Trash2,
  AlertTriangle,
  Paperclip,
  User,
  Car,
  Save,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Order, TireSpec } from '@shared/types';
import { ERROR_CODES } from '@shared/types';

interface TireForm {
  brand: string;
  size: string;
  loadIndex: string;
  speedRating: string;
  unitPrice: string;
  quantity: string;
}

const emptyTire: TireForm = {
  brand: '',
  size: '',
  loadIndex: '',
  speedRating: '',
  unitPrice: '',
  quantity: '1',
};

const BRAND_OPTIONS = ['米其林', '倍耐力', '马牌', '固特异', '普利司通', '邓禄普', '韩泰', '佳通'];
const SIZE_OPTIONS = ['205/55 R16', '225/55 R17', '225/45 R18', '235/45 R18', '245/45 R18', '245/40 R19', '255/40 R19', '275/40 R18'];
const LOAD_INDEX = ['88', '91', '95', '96', '97', '99', '100', '101', '103', '105'];
const SPEED_RATING = ['V', 'W', 'Y', 'H', 'T'];

export default function TireSelection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tires, setTires] = useState<TireForm[]>([{ ...emptyTire }]);
  const [newBasis, setNewBasis] = useState('');
  const [basisList, setBasisList] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'TECHNICIAN') {
      setError('只有技师角色可执行轮胎选型操作');
    }
    if (!id) return;
    (async () => {
      setLoading(true);
      const res = await api.getOrder(id);
      if (res.code === 0 && res.data) {
        const o = res.data as unknown as Order;
        setOrder(o);
        setBasisList(o.basisMaterials || []);
        if (o.tireSpecs && o.tireSpecs.length > 0) {
          setTires(
            o.tireSpecs.map((t: TireSpec) => ({
              brand: t.brand,
              size: t.size,
              loadIndex: t.loadIndex,
              speedRating: t.speedRating,
              unitPrice: String(t.unitPrice),
              quantity: String(t.quantity),
            })),
          );
        }
        if (o.status === 'PENDING_SELECTION' || o.status === 'QUOTE_REJECTED') {
          await api.claimSelection(id);
          const updated = await api.getOrder(id);
          if (updated.code === 0 && updated.data) {
            setOrder(updated.data as unknown as Order);
          }
        }
      } else {
        setError(res.message);
      }
      setLoading(false);
    })();
  }, [id, user, navigate]);

  const updateTire = (idx: number, field: keyof TireForm, value: string) => {
    setTires((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const addTire = () => setTires((prev) => [...prev, { ...emptyTire }]);

  const removeTire = (idx: number) => {
    if (tires.length <= 1) return;
    setTires((prev) => prev.filter((_, i) => i !== idx));
  };

  const addBasis = () => {
    const v = newBasis.trim();
    if (!v) return;
    setBasisList((prev) => [...prev, v]);
    setNewBasis('');
  };

  const removeBasis = (idx: number) => {
    setBasisList((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = tires.reduce(
    (sum, t) => sum + (Number(t.unitPrice) || 0) * (Number(t.quantity) || 0),
    0,
  );
  const laborFee = tires.reduce((sum, t) => sum + (Number(t.quantity) || 0) * 50, 0);
  const total = subtotal + laborFee;

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    setError('');

    const payload = {
      tireSpecs: tires.map((t) => ({
        brand: t.brand,
        size: t.size,
        loadIndex: t.loadIndex,
        speedRating: t.speedRating,
        unitPrice: Number(t.unitPrice),
        quantity: Number(t.quantity),
      })),
      basis: basisList.filter(
        (b) => !order?.basisMaterials?.includes(b),
      ),
    };

    for (const ts of payload.tireSpecs) {
      if (!ts.brand || !ts.size || ts.unitPrice <= 0 || ts.quantity <= 0) {
        setError('请完整填写所有轮胎规格信息（品牌、规格、单价、数量）');
        setSubmitting(false);
        return;
      }
    }

    const res = await api.submitSelection(id, payload);
    setSubmitting(false);
    if (res.code === ERROR_CODES.SUCCESS) {
      navigate(`/orders/${id}`);
    } else {
      setError(res.message);
    }
  };

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="font-mono text-sm text-carbon-500 uppercase tracking-wider animate-pulse">
          加载选型信息...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 border-2 border-carbon-300 flex items-center justify-center hover:border-ochre-700 hover:text-ochre-800 transition-colors"
            title="返回详情（保留筛选）"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-carbon-400">
                TIRE SELECTION · 技师责任区
              </p>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-ochre-50 border-2 border-ochre-300 font-mono text-xs uppercase tracking-wider text-ochre-800">
                <Wrench size={12} strokeWidth={2} />
                {order.status === 'QUOTE_REJECTED' ? '重新选型' : '选型中'}
              </span>
            </div>
            <h1 className="font-display text-4xl tracking-wider text-carbon-800 leading-none mt-1">
              轮胎选型 · {order.orderNo}
            </h1>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 border-2 border-red-400 bg-red-50 flex items-start gap-3">
          <AlertTriangle size={20} strokeWidth={2} className="text-red-700 shrink-0 mt-0.5" />
          <div className="font-mono text-sm text-red-800">{error}</div>
        </div>
      )}

      {order.rejectReason && (
        <div className="p-5 border-2 border-red-400 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} strokeWidth={2} className="text-red-700" />
            <span className="font-mono text-xs uppercase tracking-wider text-red-700 font-semibold">
              上一次报价被驳回原因（请重点关注）
            </span>
          </div>
          <p className="font-mono text-sm text-red-900">{order.rejectReason}</p>
        </div>
      )}

      <div className="card p-6">
        <h2 className="section-title">客户信息速览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <User size={16} strokeWidth={2} className="text-carbon-500" />
            <div>
              <div className="label-text">客户</div>
              <div className="font-mono text-sm font-semibold text-carbon-800">
                {order.customerName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Car size={16} strokeWidth={2} className="text-carbon-500" />
            <div>
              <div className="label-text">车牌</div>
              <div className="font-mono text-sm font-semibold text-carbon-800">
                {order.vehiclePlate}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Car size={16} strokeWidth={2} className="text-carbon-500" />
            <div>
              <div className="label-text">车型</div>
              <div className="font-mono text-sm font-semibold text-carbon-800">
                {order.vehicleModel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wrench size={16} strokeWidth={2} className="text-ochre-700" />
            <div>
              <div className="label-text">选型责任人</div>
              <div className="font-mono text-sm font-semibold text-ochre-800">
                {user?.name}
              </div>
            </div>
          </div>
        </div>
        {order.remark && (
          <div className="mt-4 p-3 bg-carbon-50 border-2 border-carbon-100 font-mono text-sm text-carbon-700">
            <span className="font-semibold">前台备注：</span>
            {order.remark}
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">轮胎规格明细</h2>
          <button onClick={addTire} className="btn-secondary text-xs py-2">
            <Plus size={16} strokeWidth={2} className="mr-1" />
            新增一条
          </button>
        </div>

        <div className="space-y-4">
          {tires.map((t, idx) => (
            <div
              key={idx}
              className="p-5 border-2 border-carbon-200 bg-carbon-50/50 animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-semibold text-carbon-700 uppercase tracking-wider">
                  轮胎 #{idx + 1}
                </span>
                {tires.length > 1 && (
                  <button
                    onClick={() => removeTire(idx)}
                    className="text-red-600 hover:text-red-800 font-mono text-xs uppercase tracking-wider flex items-center gap-1"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                    移除
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="label-text">品牌 *</label>
                  <select
                    value={t.brand}
                    onChange={(e) => updateTire(idx, 'brand', e.target.value)}
                    className="input-field"
                  >
                    <option value="">选择品牌</option>
                    {BRAND_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">规格 *</label>
                  <select
                    value={t.size}
                    onChange={(e) => updateTire(idx, 'size', e.target.value)}
                    className="input-field"
                  >
                    <option value="">选择规格</option>
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">载重指数</label>
                  <select
                    value={t.loadIndex}
                    onChange={(e) => updateTire(idx, 'loadIndex', e.target.value)}
                    className="input-field"
                  >
                    <option value="">选填</option>
                    {LOAD_INDEX.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">速度级别</label>
                  <select
                    value={t.speedRating}
                    onChange={(e) => updateTire(idx, 'speedRating', e.target.value)}
                    className="input-field"
                  >
                    <option value="">选填</option>
                    {SPEED_RATING.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">单价(¥) *</label>
                  <input
                    type="number"
                    min="0"
                    value={t.unitPrice}
                    onChange={(e) => updateTire(idx, 'unitPrice', e.target.value)}
                    className="input-field"
                    placeholder="例如 1180"
                  />
                </div>
                <div>
                  <label className="label-text">数量 *</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={t.quantity}
                    onChange={(e) => updateTire(idx, 'quantity', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              {Number(t.unitPrice) > 0 && Number(t.quantity) > 0 && (
                <div className="mt-3 pt-3 border-t border-carbon-200 text-right">
                  <span className="font-mono text-xs text-carbon-500 uppercase tracking-wider mr-2">
                    小计：
                  </span>
                  <span className="font-mono text-lg font-bold text-ochre-800">
                    ¥{(Number(t.unitPrice) * Number(t.quantity)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Paperclip size={20} strokeWidth={2} className="text-carbon-600" />
          <h2 className="section-title mb-0">选型依据材料</h2>
          <span className="font-mono text-xs text-carbon-400 uppercase tracking-wider">
            旧台账 / 现场记录 / 沟通截图 描述
          </span>
        </div>

        {basisList.length > 0 && (
          <ul className="space-y-2 mb-4">
            {basisList.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between p-3 bg-carbon-50 border-2 border-carbon-100"
              >
                <span className="font-mono text-sm text-carbon-700 flex items-center gap-2">
                  <span className="w-6 h-6 bg-brass-500 text-white flex items-center justify-center font-mono text-xs">
                    {i + 1}
                  </span>
                  {m}
                  {order.basisMaterials?.includes(m) && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-carbon-200 text-carbon-600 uppercase tracking-wider">
                      已有
                    </span>
                  )}
                </span>
                {!order.basisMaterials?.includes(m) && (
                  <button
                    onClick={() => removeBasis(i)}
                    className="text-red-600 hover:text-red-800 font-mono text-xs uppercase tracking-wider"
                  >
                    移除
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newBasis}
            onChange={(e) => setNewBasis(e.target.value)}
            placeholder="录入依据描述，例如：旧台账显示上次更换为马牌CSC5..."
            className="input-field flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBasis())}
          />
          <button onClick={addBasis} className="btn-secondary">
            <Plus size={16} strokeWidth={2} className="mr-1" />
            添加
          </button>
        </div>
      </div>

      <div className="card-accent p-6">
        <h2 className="section-title">报价预览（提交后自动生成）</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-carbon-50 border-2 border-carbon-200">
            <div className="label-text">轮胎小计</div>
            <div className="font-mono text-xl font-bold text-carbon-800">
              ¥{subtotal.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-carbon-50 border-2 border-carbon-200">
            <div className="label-text">工时费 (¥50/条)</div>
            <div className="font-mono text-xl font-bold text-carbon-800">
              ¥{laborFee.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-carbon-50 border-2 border-carbon-200">
            <div className="label-text">优惠</div>
            <div className="font-mono text-xl font-bold text-green-700">¥0</div>
          </div>
          <div className="p-4 bg-ochre-50 border-2 border-ochre-300">
            <div className="label-text">预计合计</div>
            <div className="font-mono text-2xl font-bold text-ochre-800">
              ¥{total.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <Link to={`/orders/${order.id}`} className="btn-secondary">
          取消
        </Link>
        <button
          onClick={handleSubmit}
          disabled={submitting || user?.role !== 'TECHNICIAN'}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} strokeWidth={2} className="mr-2" />
          {submitting ? '提交中...' : '提交选型，进入报价审核'}
        </button>
      </div>
    </div>
  );
}
