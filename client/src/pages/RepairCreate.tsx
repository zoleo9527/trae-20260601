import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { repairAPI, machineAPI, inspectionAPI } from '../services/api';

const RepairCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    machineId: '',
    inspectionId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    carryOverInspectionNote: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      machineAPI.list(),
      inspectionAPI.list({ status: 'COMPLETED' })
    ]).then(([machinesData, inspectionsData]) => {
      setMachines(machinesData);
      setInspections(inspectionsData.filter((i: any) => i.hasIssue));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (form.inspectionId) {
      const insp = inspections.find((i: any) => i.id === form.inspectionId);
      if (insp) {
        setForm(f => ({
          ...f,
          machineId: insp.machineId,
          title: f.title || `${insp.machine?.machineNo} 维修`,
          description: f.description || insp.overallNote || ''
        }));
      }
    }
  }, [form.inspectionId, inspections]);

  const handleSubmit = async (submitForApproval: boolean) => {
    if (!form.machineId || !form.title.trim() || !form.description.trim()) {
      return alert('请填写完整信息');
    }
    setSubmitting(true);
    try {
      const repair = await repairAPI.create({
        ...form,
        creatorId: user!.id
      });
      if (submitForApproval) {
        await repairAPI.submit(repair.id, { operatorId: user!.id });
      }
      navigate(`/repairs/${repair.id}`);
    } catch (e) {
      alert('创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-800">
        <ArrowLeft size={18} className="mr-1.5" /> 返回
      </button>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-6">新建维修工单</h2>

        <div className="space-y-5">
          <div>
            <label className="label">关联巡检记录（可选）</label>
            <select
              value={form.inspectionId}
              onChange={e => setForm({ ...form, inspectionId: e.target.value })}
              className="input"
            >
              <option value="">不关联巡检</option>
              {inspections.map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.machine?.machineNo} - {i.overallNote?.substring(0, 50)}
                </option>
              ))}
            </select>
            {form.inspectionId && (
              <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.carryOverInspectionNote}
                  onChange={e => setForm({ ...form, carryOverInspectionNote: e.target.checked })}
                  className="w-4 h-4"
                />
                自动带入巡检备注到工单
              </label>
            )}
          </div>

          <div>
            <label className="label">选择设备 <span className="text-red-500">*</span></label>
            <select
              value={form.machineId}
              onChange={e => setForm({ ...form, machineId: e.target.value })}
              className="input"
            >
              <option value="">请选择设备</option>
              {machines.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.machineNo} - {m.name} ({m.area})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">工单标题 <span className="text-red-500">*</span></label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="简短描述问题，如：PC-003 显示器闪屏"
            />
          </div>

          <div>
            <label className="label">问题描述 <span className="text-red-500">*</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input h-32"
              placeholder="详细描述故障现象、出现时间、影响范围等..."
            />
          </div>

          <div>
            <label className="label">优先级</label>
            <select
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
              className="input w-48"
            >
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="CRITICAL">紧急</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 btn btn-secondary"
            >
              <Save size={16} className="mr-1.5" /> 保存草稿
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex-1 btn btn-primary"
            >
              <Send size={16} className="mr-1.5" /> 提交审批
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairCreate;
