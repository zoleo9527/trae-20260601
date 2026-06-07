import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { inspectionAPI, machineAPI } from '../services/api';

const InspectionCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [machineId, setMachineId] = useState('');
  const [checkItems, setCheckItems] = useState<Record<string, boolean>>({
    systemBoot: true,
    displayNormal: true,
    keyboardMouse: true,
    networkStable: true,
    gameLaunch: true,
    peripherals: true,
    cleanliness: true
  });
  const [overallNote, setOverallNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    machineAPI.list().then(data => {
      setMachines(data.filter((m: any) => m.status !== 'SCRAPPED'));
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (complete: boolean) => {
    if (!machineId) return alert('请选择设备');
    setSubmitting(true);
    try {
      const hasIssue = Object.values(checkItems).some(v => v === false);
      const inspection = await inspectionAPI.create({
        machineId,
        inspectorId: user!.id,
        checkItems,
        overallNote,
        hasIssue
      });
      if (complete) {
        await inspectionAPI.complete(inspection.id, { checkItems, overallNote, hasIssue });
      }
      navigate(`/inspections/${inspection.id}`);
    } catch (e) {
      alert('创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const checkItemLabels: Record<string, string> = {
    systemBoot: '系统启动',
    displayNormal: '显示正常',
    keyboardMouse: '键鼠正常',
    networkStable: '网络稳定',
    gameLaunch: '游戏启动',
    peripherals: '外设完好',
    cleanliness: '设备清洁'
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
        <h2 className="text-xl font-bold text-gray-800 mb-6">新建机器巡检</h2>

        <div className="space-y-6">
          <div>
            <label className="label">选择设备 <span className="text-red-500">*</span></label>
            <select value={machineId} onChange={e => setMachineId(e.target.value)} className="input">
              <option value="">请选择设备</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.machineNo} - {m.name} ({m.area})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-3">巡检项目</label>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.entries(checkItemLabels).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <span className="text-gray-700">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checkItems[key]}
                      onChange={e => setCheckItems({ ...checkItems, [key]: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className={`text-sm ${checkItems[key] ? 'text-green-600' : 'text-red-600'}`}>
                      {checkItems[key] ? '正常' : '异常'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">巡检备注</label>
            <textarea
              value={overallNote}
              onChange={e => setOverallNote(e.target.value)}
              className="input h-28"
              placeholder="请描述巡检中发现的问题或其他需要说明的内容..."
            />
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
              <CheckCircle size={16} className="mr-1.5" /> 提交完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionCreate;
