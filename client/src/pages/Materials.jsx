import { CheckCircle, FileVideo, RotateCcw, Upload, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { materialsApi } from '../api';
import StatusBadge, { MATERIAL_STATUS_MAP } from '../components/StatusBadge';

export default function Materials() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [uploadModal, setUploadModal] = useState(null);

  useEffect(() => {
    loadMaterials();
  }, [statusFilter]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await materialsApi.list(params);
      setMaterials(data);
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
      loadMaterials();
    } catch (e) {
      alert('审核失败：' + e.message);
    }
  };

  const handleUploadMaterial = async (formData) => {
    try {
      await materialsApi.create(formData);
      setUploadModal(null);
      loadMaterials();
    } catch (e) {
      alert('素材录入失败：' + e.message);
    }
  };

  const pendingCount = materials.filter(m => m.status === 'pending_review').length;
  const approvedCount = materials.filter(m => m.status === 'approved').length;
  const rejectedCount = materials.filter(m => m.status === 'rejected').length;
  const revisionCount = materials.filter(m => m.status === 'revision_needed').length;

  const groupedByOrder = {};
  for (const m of materials) {
    if (!groupedByOrder[m.order_id]) {
      groupedByOrder[m.order_id] = { order_no: m.order_no, client_name: m.client_name, materials: [] };
    }
    groupedByOrder[m.order_id].materials.push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">素材审核</h2>
          <p className="text-gray-500 mt-1">审核客户提交的广告素材，确保合规播出</p>
        </div>
        <button onClick={() => setUploadModal({})} className="btn-primary">
          <Upload size={16} /> 录入素材
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('pending_review')}>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-sm text-gray-500 mt-1">待审核</p>
        </div>
        <div className="card p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('approved')}>
          <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
          <p className="text-sm text-gray-500 mt-1">已通过</p>
        </div>
        <div className="card p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('rejected')}>
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-sm text-gray-500 mt-1">已驳回</p>
        </div>
        <div className="card p-4 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('revision_needed')}>
          <p className="text-2xl font-bold text-orange-600">{revisionCount}</p>
          <p className="text-sm text-gray-500 mt-1">需修改</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!statusFilter ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          全部
        </button>
        {Object.entries(MATERIAL_STATUS_MAP).map(([value, { label }]) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-4">
          {materials.map(m => (
            <div key={m.id} className={`card p-5 ${m.status === 'pending_review' ? 'ring-2 ring-amber-200' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    m.status === 'pending_review' ? 'bg-amber-50' :
                    m.status === 'approved' ? 'bg-emerald-50' :
                    m.status === 'rejected' ? 'bg-red-50' : 'bg-orange-50'
                  }`}>
                    <FileVideo size={24} className={
                      m.status === 'pending_review' ? 'text-amber-500' :
                      m.status === 'approved' ? 'text-emerald-500' :
                      m.status === 'rejected' ? 'text-red-500' : 'text-orange-500'
                    } />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.file_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {m.file_type.toUpperCase()} · {m.duration}s · 版本 V{m.version}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      上传时间：{m.upload_time}
                    </p>
                    <button
                      onClick={() => navigate(`/orders/${m.order_id}`)}
                      className="text-xs text-primary-600 hover:underline mt-1"
                    >
                      {m.order_no} · {m.client_name} →
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={m.status} type="material" />
                  {m.status === 'pending_review' && (
                    <div className="flex gap-2">
                      <button onClick={() => setReviewModal({ id: m.id, status: 'approved' })} className="btn-success text-xs px-3 py-1.5">
                        <CheckCircle size={14} /> 通过
                      </button>
                      <button onClick={() => setReviewModal({ id: m.id, status: 'rejected' })} className="btn-danger text-xs px-3 py-1.5">
                        <XCircle size={14} /> 驳回
                      </button>
                      <button onClick={() => setReviewModal({ id: m.id, status: 'revision_needed' })} className="btn-warning text-xs px-3 py-1.5">
                        <RotateCcw size={14} /> 修改
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {m.review_notes && (
                <div className={`mt-4 ml-16 p-3 rounded-lg text-sm ${
                  m.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                  m.status === 'revision_needed' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                  m.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  'bg-gray-50 text-gray-600 border border-gray-100'
                }`}>
                  <span className="font-medium">审核意见：</span>{m.review_notes}
                  {m.reviewer && <span className="ml-2 opacity-75">— {m.reviewer} · {m.review_time}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {{ approved: '审核通过', rejected: '审核驳回', revision_needed: '需修改' }[reviewModal.status]}
            </h3>
            <textarea
              placeholder="请输入审核意见..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              id="review-notes"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setReviewModal(null)} className="btn-secondary">取消</button>
              <button
                onClick={() => {
                  const notes = document.getElementById('review-notes').value;
                  handleReview(reviewModal.id, reviewModal.status, notes);
                }}
                className={{
                  approved: 'btn-success',
                  rejected: 'btn-danger',
                  revision_needed: 'btn-warning',
                }[reviewModal.status]}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadModal && (
        <UploadMaterialModal
          onClose={() => setUploadModal(null)}
          onSubmit={handleUploadMaterial}
        />
      )}
    </div>
  );
}

function UploadMaterialModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    order_id: '',
    file_name: '',
    file_type: 'video',
    duration: 15,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.order_id || !form.file_name) {
      alert('请填写订单ID和素材文件名');
      return;
    }
    setSubmitting(true);
    await onSubmit({
      ...form,
      order_id: Number(form.order_id),
      duration: Number(form.duration) || 15,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">录入素材</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">订单 ID *</label>
            <input
              type="number"
              value={form.order_id}
              onChange={e => setForm({ ...form, order_id: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入订单ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">素材文件名 *</label>
            <input
              type="text"
              value={form.file_name}
              onChange={e => setForm({ ...form, file_name: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="例如：品牌_广告名_15s_v1.mp4"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">素材类型</label>
              <select
                value={form.file_type}
                onChange={e => setForm({ ...form, file_type: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="video">视频</option>
                <option value="image">图片</option>
                <option value="audio">音频</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时长(秒)</label>
              <input
                type="number"
                value={form.duration}
                onChange={e => setForm({ ...form, duration: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="5"
                max="60"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">取消</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? '提交中...' : '提交素材'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
