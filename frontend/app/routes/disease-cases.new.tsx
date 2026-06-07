import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { RoleProvider, useRole, ROLE_LABELS } from "~/context/RoleContext";
import { api } from "~/utils/api";

export async function loader() {
  const [ponds, medicines] = await Promise.all([
    api.getPonds(),
    api.getMedicines(),
  ]);
  return { ponds, medicines };
}

function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useRole();
  const roles: Array<'TECHNICIAN' | 'WAREHOUSE_KEEPER' | 'FIELD_MANAGER'> = ['TECHNICIAN', 'WAREHOUSE_KEEPER', 'FIELD_MANAGER'];
  return (
    <div className="role-switcher">
      {roles.map(role => (
        <button key={role} className={`role-btn ${currentRole === role ? 'active' : ''}`} onClick={() => setCurrentRole(role)}>
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}

function NewDiseaseCase() {
  const { ponds, medicines } = useLoaderData<typeof loader>();
  const { currentRole, currentUser } = useRole();
  const navigate = useNavigate();
  const [pondId, setPondId] = useState('');
  const [diseaseName, setDiseaseName] = useState('');
  const [diseaseDescription, setDiseaseDescription] = useState('');
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MODERATE');
  const [suggestedMedication, setSuggestedMedication] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState<{ medicineId: string; suggestedQuantity: number; dosage: string; usageMethod: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMedicine = () => {
    if (medicines.length > 0) {
      setSelectedMedicines([...selectedMedicines, { medicineId: medicines[0].id, suggestedQuantity: 1, dosage: '', usageMethod: '' }]);
    }
  };

  const removeMedicine = (idx: number) => {
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== idx));
  };

  const updateMedicine = (idx: number, field: string, value: any) => {
    const updated = [...selectedMedicines];
    (updated[idx] as any)[field] = value;
    setSelectedMedicines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!pondId || !diseaseName || !diseaseDescription) {
      setError('请填写必填项');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createDiseaseCase({
        pondId,
        reporterId: currentUser.id,
        diseaseName,
        diseaseDescription,
        severity,
        suggestedMedication,
        medicines: selectedMedicines,
      });
      alert('病害单创建成功');
      navigate('/disease-cases');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentRole !== 'TECHNICIAN') {
    return (
      <div className="app-container">
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="link-btn" style={{ color: 'white', fontSize: '16px' }} onClick={() => navigate('/')}>← 返回首页</button>
            <h1>➕ 申报病害</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
            <RoleSwitcher />
          </div>
        </div>
        <div className="main">
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <h2>只有养殖技术员可以申报病害</h2>
            <p style={{ color: '#666', marginTop: '8px' }}>请切换到"养殖技术员"角色</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="link-btn" style={{ color: 'white', fontSize: '16px' }} onClick={() => navigate('/')}>← 返回首页</button>
          <h1>➕ 申报病害</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
          <RoleSwitcher />
        </div>
      </div>

      <div className="main">
        {error && (
          <div className="reject-box">
            <h4>错误</h4>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-title">基本信息</div>
            <div className="grid">
              <div className="form-group">
                <label>选择塘口 *</label>
                <select value={pondId} onChange={(e) => setPondId(e.target.value)}>
                  <option value="">请选择塘口</option>
                  {ponds.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.breed_type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>严重程度 *</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
                  <option value="MILD">轻度</option>
                  <option value="MODERATE">中度</option>
                  <option value="SEVERE">重度</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>病害名称 *</label>
              <input type="text" value={diseaseName} onChange={(e) => setDiseaseName(e.target.value)} placeholder="如：虾弧菌病、细菌性烂鳃等" />
            </div>
            <div className="form-group">
              <label>病害症状描述 *</label>
              <textarea value={diseaseDescription} onChange={(e) => setDiseaseDescription(e.target.value)} placeholder="请详细描述发病情况、症状表现、死鱼/死虾数量等" />
            </div>
            <div className="form-group">
              <label>建议用药方案说明</label>
              <textarea value={suggestedMedication} onChange={(e) => setSuggestedMedication(e.target.value)} placeholder="可选，填写整体的用药思路和注意事项" />
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>💊 建议用药明细</span>
              <button type="button" className="btn btn-default" onClick={addMedicine}>+ 添加药品</button>
            </div>
            {selectedMedicines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                暂未添加药品，点击上方按钮添加
              </div>
            ) : (
              <div>
                {selectedMedicines.map((med, idx) => (
                  <div key={idx} className="medicine-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>药品</label>
                      <select value={med.medicineId} onChange={(e) => updateMedicine(idx, 'medicineId', e.target.value)}>
                        {medicines.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.specification}) 库存: {m.stock_quantity}{m.unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>建议用量</label>
                      <input type="number" min="0" step="0.1" value={med.suggestedQuantity} onChange={(e) => updateMedicine(idx, 'suggestedQuantity', Number(e.target.value))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>用法用量</label>
                      <input type="text" value={med.dosage} onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)} placeholder="如：1瓶/亩·米" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>使用方法</label>
                      <input type="text" value={med.usageMethod} onChange={(e) => updateMedicine(idx, 'usageMethod', e.target.value)} placeholder="如：全池泼洒" />
                    </div>
                    <button type="button" className="btn btn-danger" onClick={() => removeMedicine(idx)} style={{ padding: '8px 12px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-default" onClick={() => navigate('/disease-cases')}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '提交中...' : '创建病害单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewDiseaseCasePage() {
  return (
    <RoleProvider>
      <NewDiseaseCase />
    </RoleProvider>
  );
}
