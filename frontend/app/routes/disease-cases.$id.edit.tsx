import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { RoleProvider, useRole, ROLE_LABELS } from "~/context/RoleContext";
import { api } from "~/utils/api";

export async function loader({ params }: { params: { id: string } }) {
  const [caseData, ponds, medicines] = await Promise.all([
    api.getDiseaseCase(params.id),
    api.getPonds(),
    api.getMedicines(),
  ]);
  return { caseData, ponds, medicines };
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

function EditDiseaseCase() {
  const { caseData, ponds, medicines } = useLoaderData<typeof loader>();
  const { currentRole, currentUser } = useRole();
  const navigate = useNavigate();
  const [pondId, setPondId] = useState(caseData.pond_id);
  const [diseaseName, setDiseaseName] = useState(caseData.disease_name);
  const [diseaseDescription, setDiseaseDescription] = useState(caseData.disease_description);
  const [severity, setSeverity] = useState(caseData.severity);
  const [suggestedMedication, setSuggestedMedication] = useState(caseData.suggested_medication || '');
  const [selectedMedicines, setSelectedMedicines] = useState<any[]>(
    caseData.medicines.map((m: any) => ({
      medicineId: m.medicine_id,
      suggestedQuantity: m.suggested_quantity,
      dosage: m.dosage || '',
      usageMethod: m.usage_method || '',
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canEdit = currentRole === 'TECHNICIAN' && ['DRAFT', 'REJECTED'].includes(caseData.status);

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
      await api.updateDiseaseCaseDraft(caseData.id, {
        pondId,
        reporterId: currentUser.id,
        diseaseName,
        diseaseDescription,
        severity,
        suggestedMedication,
        medicines: selectedMedicines,
      });
      alert('保存成功');
      navigate(`/disease-cases/${caseData.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="app-container">
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="link-btn" style={{ color: 'white', fontSize: '16px' }} onClick={() => navigate(`/disease-cases/${caseData.id}`)}>← 返回详情</button>
            <h1>✏️ 修改病害单</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
            <RoleSwitcher />
          </div>
        </div>
        <div className="main">
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <h2>当前状态不允许修改</h2>
            <p style={{ color: '#666', marginTop: '8px' }}>只有草稿或被驳回状态的病害单可以修改</p>
            <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate(`/disease-cases/${caseData.id}`)}>
              返回详情
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="link-btn" style={{ color: 'white', fontSize: '16px' }} onClick={() => navigate(`/disease-cases/${caseData.id}`)}>← 返回详情</button>
          <h1>✏️ 修改病害单 - {caseData.case_no}</h1>
          {caseData.status === 'REJECTED' && (
            <span className="status-badge status-REJECTED" style={{ fontSize: '14px' }}>已驳回 - 请补录</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
          <RoleSwitcher />
        </div>
      </div>

      <div className="main">
        {caseData.status === 'REJECTED' && caseData.reject_reason && (
          <div className="reject-box">
            <h4>⚠️ 驳回意见（请根据以下意见补录修改）</h4>
            <p>{caseData.reject_reason}</p>
          </div>
        )}

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
                  {ponds.map((p: any) => (
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
              <input type="text" value={diseaseName} onChange={(e) => setDiseaseName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>病害症状描述 *</label>
              <textarea value={diseaseDescription} onChange={(e) => setDiseaseDescription(e.target.value)} />
            </div>
            <div className="form-group">
              <label>建议用药方案说明</label>
              <textarea value={suggestedMedication} onChange={(e) => setSuggestedMedication(e.target.value)} />
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
                        {medicines.map((m: any) => (
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
            <button type="button" className="btn btn-default" onClick={() => navigate(`/disease-cases/${caseData.id}`)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditDiseaseCasePage() {
  return (
    <RoleProvider>
      <EditDiseaseCase />
    </RoleProvider>
  );
}
