import { ArrowLeft, Calendar, CheckCircle, Clock, FileVideo, Plus, RotateCcw, Tv, Upload, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { broadcastsApi, materialsApi, ordersApi } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.get(id);
      setOrder(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (materialId, status, notes) => {
    try {
      await materialsApi.review(materialId, {
        status,
        review_notes: notes,
        reviewer: '赵合规',
      });
      setReviewModal(null);
      loadOrder();
    } catch (e) {
      alert('审核失败：' + e.message);
    }
  };

  const handleConfirmBroadcast = async (broadcastId) => {
    try {
      await broadcastsApi.confirm(broadcastId, {
        confirmed_by: '张明',
        notes: '确认播出正常',
      });
      loadOrder();
    } catch (e) {
      alert('确认失败：' + e.message);
    }
  };

  const handleUploadMaterial = async (formData) => {
    try {
      await materialsApi.create({
        order_id: Number(id),
        ...formData,
      });
      setShowUploadForm(false);
      loadOrder();
    } catch (e) {
      alert('素材录入失败：' + e.message);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  if (!order) return <div className="text-center py-20 text-gray-400">订单不存在</div>;

  const canUploadMaterial = ['draft', 'submitted', 'in_review', 'revision_needed', 'material_rejected'].includes(order.status);
  const timeline = (order.audits || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/orders')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{order.order_no}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-gray-500 mt-1">{order.client_name} · {order.brand}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileVideo size={18} /> 素材列表
              </h3>
              {canUploadMaterial && (
                <button onClick={() => setShowUploadForm(true)} className="btn-primary text-xs px-3 py-1.5">
                  <Upload size={14} /> 录入素材
                </button>
              )}
            </div>

            {showUploadForm && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">录入新素材</h4>
                <UploadMaterialForm
                  onSubmit={handleUploadMaterial}
                  onCancel={() => setShowUploadForm(false)}
                />
              </div>
            )}

            <div className="space-y-4">
              {(order.materials || []).map(m => (
                <div key={m.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileVideo size={20} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.file_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.file_type.toUpperCase()} · {m.duration}s · V{m.version}
                        </p>
                        {m.review_notes && (
                          <div className={`mt-2 p-2.5 rounded-lg text-xs ${
                            m.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                            m.status === 'revision_needed' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                            m.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-gray-50 text-gray-600 border border-gray-100'
                          }`}>
                            <span className="font-medium">审核意见：</span>{m.review_notes}
                            {m.reviewer && <span className="ml-2 opacity-75">— {m.reviewer}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} type="material" />
                      {m.status === 'pending_review' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setReviewModal({ id: m.id, status: 'approved' })}
                            className="btn-success text-xs px-3 py-1.5"
                          >
                            <CheckCircle size={14} /> 通过
                          </button>
                          <button
                            onClick={() => setReviewModal({ id: m.id, status: 'rejected' })}
                            className="btn-danger text-xs px-3 py-1.5"
                          >
                            <XCircle size={14} /> 驳回
                          </button>
                          <button
                            onClick={() => setReviewModal({ id: m.id, status: 'revision_needed' })}
                            className="btn-warning text-xs px-3 py-1.5"
                          >
                            <RotateCcw size={14} /> 修改
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(order.materials || []).length === 0 && !showUploadForm && (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">暂无素材</p>
                  {canUploadMaterial && (
                    <button onClick={() => setShowUploadForm(true)} className="btn-primary text-sm">
                      <Plus size={16} /> 录入第一条素材
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={18} /> 排期详情
            </h3>
            {(order.schedules || []).length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无排期</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">频道</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">日期</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">时段</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">版位</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">素材版本</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">状态</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">备注</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.schedules.map(s => (
                      <tr key={s.id} className={s.status === 'conflict' ? 'bg-red-50' : ''}>
                        <td className="py-2.5 px-3 font-medium">{s.channel}</td>
                        <td className="py-2.5 px-3">{s.schedule_date}</td>
                        <td className="py-2.5 px-3">{s.time_slot}</td>
                        <td className="py-2.5 px-3">{s.position}</td>
                        <td className="py-2.5 px-3 text-gray-500">{s.file_name ? `V${s.material_version || 1}` : '-'}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={s.status} type="schedule" /></td>
                        <td className="py-2.5 px-3 text-gray-500 text-xs">{s.conflict_note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(order.broadcasts || []).length > 0 && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tv size={18} /> 播出记录
              </h3>
              <div className="space-y-3">
                {order.broadcasts.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {b.channel} · {b.schedule_date} {b.time_slot}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        实际播出：{b.actual_air_time || '未播出'}
                        {b.notes && <span className="ml-2">· {b.notes}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.confirmed ? (
                        <span className="badge bg-emerald-100 text-emerald-700">
                          ✅ 已确认 · {b.confirmed_by} · {b.confirmed_time}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConfirmBroadcast(b.id)}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          确认播出
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">订单信息</h3>
            <dl className="space-y-3">
              {[
                ['客户', order.client_name],
                ['品牌', order.brand],
                ['产品', order.product],
                ['销售', order.sales_person],
                ['金额', `¥${order.total_amount.toLocaleString()}`],
                ['创建时间', order.created_at],
                ['更新时间', order.updated_at],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-sm text-gray-900 font-medium">{value || '-'}</dd>
                </div>
              ))}
            </dl>
            {order.notes && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-1">备注</p>
                <p className="text-xs text-blue-600">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={16} /> 操作记录
            </h3>
            <div className="space-y-0">
              {timeline.map((a, i) => (
                <div key={i} className="relative pl-6 pb-4 last:pb-0">
                  {i < timeline.length - 1 && (
                    <div className="absolute left-[7px] top-3 bottom-0 w-px bg-gray-200" />
                  )}
                  <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-primary-400 bg-white" />
                  <div>
                    <p className="text-sm text-gray-900 font-medium">
                      {a.action === 'order_status_change' ? '订单状态变更' :
                       a.action === 'material_review' ? '素材审核' :
                       a.action === 'material_upload' ? '素材上传' :
                       a.action === 'schedule_update' ? '排期更新' :
                       a.action === 'schedule_conflict' ? '⚠️ 排期冲突' :
                       a.action === 'broadcast_confirmed' ? '播出确认' : a.action}
                    </p>
                    {a.notes && <p className="text-xs text-gray-500 mt-0.5">{a.notes}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{a.operator} · {a.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {reviewModal && (
        <ReviewModal
          modal={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
}

function UploadMaterialForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    file_name: '',
    file_type: 'video',
    duration: 15,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file_name) {
      alert('请输入素材文件名');
      return;
    }
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">素材文件名 *</label>
          <input
            type="text"
            value={form.file_name}
            onChange={e => setForm({ ...form, file_name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="例如：品牌_广告名_15s_v1.mp4"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">时长(秒)</label>
          <input
            type="number"
            value={form.duration}
            onChange={e => setForm({ ...form, duration: Number(e.target.value) || 15 })}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="5"
            max="60"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">素材类型</label>
        <div className="flex gap-3">
          {['video', 'image', 'audio'].map(t => (
            <label key={t} className="flex items-center gap-1.5 text-sm text-gray-700">
              <input
                type="radio"
                name="file_type"
                value={t}
                checked={form.file_type === t}
                onChange={e => setForm({ ...form, file_type: e.target.value })}
              />
              {{ video: '视频', image: '图片', audio: '音频' }[t]}
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">取消</button>
        <button type="submit" disabled={submitting} className="btn-primary text-xs px-3 py-1.5">
          {submitting ? '提交中...' : '提交素材'}
        </button>
      </div>
    </form>
  );
}

function ReviewModal({ modal, onClose, onSubmit }) {
  const [notes, setNotes] = useState('');
  const statusLabels = {
    approved: '审核通过',
    rejected: '审核驳回',
    revision_needed: '需修改',
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {statusLabels[modal.status]}
        </h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="请输入审核意见..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary">取消</button>
          <button
            onClick={() => onSubmit(modal.id, modal.status, notes)}
            className={`${
              modal.status === 'approved' ? 'btn-success' :
              modal.status === 'rejected' ? 'btn-danger' : 'btn-warning'
            }`}
          >
            确认{statusLabels[modal.status]}
          </button>
        </div>
      </div>
    </div>
  );
}
