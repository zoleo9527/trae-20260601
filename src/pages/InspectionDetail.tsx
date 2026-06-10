import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, Save, Send, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { Inspection, Attachment } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  pending: '待巡检',
  in_progress: '巡检中',
  pending_confirm: '待确认',
  completed: '已完成',
  anomaly: '异常',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-farm-muted/20 text-farm-muted',
  in_progress: 'bg-blue-500/20 text-blue-400',
  pending_confirm: 'bg-farm-orange/20 text-farm-orange',
  completed: 'bg-farm-green/20 text-farm-green',
  anomaly: 'bg-farm-red/20 text-farm-red',
};

interface FormData {
  temperature: string;
  humidity: string;
  ventilation: string;
  water_status: string;
  feed_status: string;
  flock_status: string;
  notes: string;
}

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [form, setForm] = useState<FormData>({
    temperature: '',
    humidity: '',
    ventilation: '',
    water_status: '',
    feed_status: '',
    flock_status: '',
    notes: '',
  });

  const fetchInspection = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.inspections.get(Number(id));
      const data = res.data;
      setInspection(data);
      setAttachments(data.attachments || []);
      setForm({
        temperature: data.temperature?.toString() || '',
        humidity: data.humidity?.toString() || '',
        ventilation: data.ventilation || '',
        water_status: data.water_status || '',
        feed_status: data.feed_status || '',
        flock_status: data.flock_status || '',
        notes: data.notes || '',
      });
    } catch {
      // silently handle
    }
  }, [id]);

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await api.inspections.update(Number(id), {
        temperature: form.temperature ? Number(form.temperature) : null,
        humidity: form.humidity ? Number(form.humidity) : null,
        ventilation: form.ventilation || null,
        water_status: form.water_status || null,
        feed_status: form.feed_status || null,
        flock_status: form.flock_status || null,
        notes: form.notes || null,
      });
      fetchInspection();
    } catch {
      // silently handle
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await api.inspections.update(Number(id), {
        temperature: form.temperature ? Number(form.temperature) : null,
        humidity: form.humidity ? Number(form.humidity) : null,
        ventilation: form.ventilation || null,
        water_status: form.water_status || null,
        feed_status: form.feed_status || null,
        flock_status: form.flock_status || null,
        notes: form.notes || null,
        status: 'pending_confirm',
      });
      navigate('/inspection');
    } catch {
      // silently handle
    }
  };

  const handleReportAnomaly = async () => {
    if (!id || !inspection) return;
    try {
      await api.anomalies.create({
        type: 'inspection',
        source_type: 'inspection',
        source_id: Number(id),
        coop_id: inspection.coop_id,
        description: `巡检卡#${id}上报异常: ${form.notes || '待补充'}`,
        severity: 'high',
        reporter_id: user?.id || 0,
      });
      navigate('/inspection');
    } catch {
      // silently handle
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      await api.upload.file(file, 'inspection', Number(id));
      fetchInspection();
    } catch {
      // silently handle
    }
  };

  const getElapsed = () => {
    if (!inspection) return '';
    const start = inspection.claimed_at || inspection.created_at;
    const end = inspection.completed_at || Math.floor(Date.now() / 1000);
    const minutes = Math.floor((end - start) / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m}m`;
  };

  const isOverdue = () => {
    if (!inspection || inspection.status === 'completed') return false;
    const start = inspection.claimed_at || inspection.created_at;
    return Math.floor(Date.now() / 1000) - start > 7200;
  };

  if (!inspection) {
    return (
      <div className="text-center text-farm-muted py-16">
        加载中...
      </div>
    );
  }

  const canEdit = inspection.status === 'in_progress' && inspection.inspector_id === user?.id;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/inspection')}
        className="flex items-center gap-2 text-farm-muted hover:text-farm-text mb-4 text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        返回列表
      </button>

      <div className={`bg-farm-card border rounded-lg p-5 mb-4 ${isOverdue() ? 'border-farm-red animate-pulse-overdue' : 'border-farm-border'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-farm-text font-bold text-lg">
              {inspection.coop_code || `鸡舍#${inspection.coop_id}`}
            </h2>
            <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[inspection.status]}`}>
              {STATUS_LABELS[inspection.status]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-farm-muted text-sm">
            <Clock size={14} />
            <span className={`font-mono ${isOverdue() ? 'text-farm-red' : ''}`}>
              {getElapsed()}
            </span>
          </div>
        </div>
        <div className="text-farm-muted text-xs">
          巡检员: {inspection.inspector_name || '未分配'} | 创建时间: {new Date(inspection.created_at * 1000).toLocaleString('zh-CN')}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-farm-card border border-farm-border rounded-lg p-5">
          <h3 className="text-farm-text font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-farm-orange rounded-full" />
            温湿度
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-farm-muted text-xs block mb-1">温度 (°C)</label>
              <input
                type="number"
                step="0.1"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                disabled={!canEdit}
                className="w-full bg-farm-darker border border-farm-border rounded px-3 py-2 text-farm-text font-mono text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-farm-muted text-xs block mb-1">湿度 (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.humidity}
                onChange={(e) => setForm({ ...form, humidity: e.target.value })}
                disabled={!canEdit}
                className="w-full bg-farm-darker border border-farm-border rounded px-3 py-2 text-farm-text font-mono text-sm disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="bg-farm-card border border-farm-border rounded-lg p-5">
          <h3 className="text-farm-text font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-farm-green rounded-full" />
            通风 / 饮水 / 采食
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-farm-muted text-xs block mb-1">通风状态</label>
              <select
                value={form.ventilation}
                onChange={(e) => setForm({ ...form, ventilation: e.target.value })}
                disabled={!canEdit}
                className="w-full bg-farm-darker border border-farm-border rounded px-3 py-2 text-farm-text text-sm disabled:opacity-50"
              >
                <option value="">请选择</option>
                <option value="normal">正常</option>
                <option value="weak">偏弱</option>
                <option value="strong">偏强</option>
                <option value="abnormal">异常</option>
              </select>
            </div>
            <div>
              <label className="text-farm-muted text-xs block mb-1">饮水状态</label>
              <select
                value={form.water_status}
                onChange={(e) => setForm({ ...form, water_status: e.target.value })}
                disabled={!canEdit}
                className="w-full bg-farm-darker border border-farm-border rounded px-3 py-2 text-farm-text text-sm disabled:opacity-50"
              >
                <option value="">请选择</option>
                <option value="normal">正常</option>
                <option value="low">偏低</option>
                <option value="abnormal">异常</option>
              </select>
            </div>
            <div>
              <label className="text-farm-muted text-xs block mb-1">采食状态</label>
              <select
                value={form.feed_status}
                onChange={(e) => setForm({ ...form, feed_status: e.target.value })}
                disabled={!canEdit}
                className="w-full bg-farm-darker border border-farm-border rounded px-3 py-2 text-farm-text text-sm disabled:opacity-50"
              >
                <option value="">请选择</option>
                <option value="normal">正常</option>
                <option value="low">偏低</option>
                <option value="high">偏高</option>
                <option value="abnormal">异常</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-farm-card border border-farm-border rounded-lg p-5">
          <h3 className="text-farm-text font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-farm-yellow rounded-full" />
            鸡群状态
          </h3>
          <select
            value={form.flock_status}
            onChange={(e) => setForm({ ...form, flock_status: e.target.value })}
            disabled={!canEdit}
            className="w-full bg-farm-darker border border-farm-border rounded px-3 py-2 text-farm-text text-sm disabled:opacity-50"
          >
            <option value="">请选择</option>
            <option value="normal">正常</option>
            <option value="lethargic">萎靡</option>
            <option value="aggressive">攻击性强</option>
            <option value="crowded">拥挤</option>
            <option value="abnormal">异常</option>
          </select>
        </div>

        <div className="bg-farm-card border border-farm-border rounded-lg p-5">
          <h3 className="text-farm-text font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-farm-muted rounded-full" />
            备注
          </h3>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={!canEdit}
            rows={3}
            className="w-full bg-farm-darker border border-farm-border rounded px-3 py-2 text-farm-text text-sm disabled:opacity-50 resize-none"
          />
        </div>

        <div className="bg-farm-card border border-farm-border rounded-lg p-5">
          <h3 className="text-farm-text font-bold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full" />
            附件
          </h3>
          <div className="flex flex-wrap gap-3 mb-3">
            {attachments.map((att) => (
              <div key={att.id} className="relative w-20 h-20 bg-farm-darker rounded border border-farm-border overflow-hidden">
                <img
                  src={`/api/uploads/${att.filename}`}
                  alt={att.original_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {canEdit && (
            <label className="inline-flex items-center gap-2 bg-farm-darker border border-farm-border text-farm-muted hover:text-farm-text px-3 py-2 rounded text-sm cursor-pointer transition-colors">
              <Upload size={14} />
              上传图片
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-farm-card border border-farm-border text-farm-text px-5 py-2.5 rounded-lg text-sm hover:bg-farm-border transition-colors"
          >
            <Save size={16} />
            保存
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-farm-orange text-white px-5 py-2.5 rounded-lg text-sm hover:bg-farm-orange/80 transition-colors"
          >
            <Send size={16} />
            提交待确认
          </button>
          <button
            onClick={handleReportAnomaly}
            className="flex items-center gap-2 bg-farm-red/20 text-farm-red px-5 py-2.5 rounded-lg text-sm hover:bg-farm-red/30 transition-colors"
          >
            <AlertTriangle size={16} />
            上报异常
          </button>
        </div>
      )}
    </div>
  );
}
