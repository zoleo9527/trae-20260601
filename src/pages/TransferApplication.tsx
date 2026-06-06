import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockStudents, mockClasses, getTransferApplications, submitTransferForAudit, updateTransferApplication } from '../data/mockData';

export default function TransferApplication() {
  const { id, studentId } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const applications = getTransferApplications();
  const existingApp = !isNew ? applications.find(t => t.id === id) : null;
  const sid = isNew ? studentId : existingApp?.studentId;
  const student = mockStudents.find(s => s.id === sid);
  const currentClass = mockClasses.find(c => c.id === student?.currentClassId);

  const determineStep = () => {
    if (!existingApp) return 1;
    if (existingApp.status === 'draft') return 1;
    if (existingApp.status === 'trial_class') return 2;
    if (existingApp.trialResult && !existingApp.priceConfirmed) return 3;
    if (existingApp.priceConfirmed) return 4;
    return 1;
  };

  const [step, setStep] = useState(determineStep());
  const [formData, setFormData] = useState({
    reason: existingApp?.reason || '',
    reasonDetail: existingApp?.reasonDetail || '',
    toClassId: existingApp?.toClassId || '',
    trialDate: existingApp?.trialDate || '',
    trialResult: existingApp?.trialResult || 'pending',
    trialFeedback: existingApp?.trialFeedback || '',
    trialTeacherName: existingApp?.trialTeacherName || '',
    parentConfirmed: existingApp?.parentConfirmed || false,
  });

  const availableClasses = mockClasses.filter(c => c.id !== student?.currentClassId && c.subject === currentClass?.subject);
  const targetClass = mockClasses.find(c => c.id === formData.toClassId);
  const priceDiff = targetClass && currentClass && student
    ? Math.round((targetClass.pricePerHour - currentClass.pricePerHour) * student.remainingHours)
    : 0;

  const steps = [
    { num: 1, title: '填写调班原因' },
    { num: 2, title: '试听反馈' },
    { num: 3, title: '课时差价' },
    { num: 4, title: '家长确认' },
    { num: 5, title: '提交审核' },
  ];

  const handleNext = () => step < 5 && setStep(step + 1);
  const handlePrev = () => step > 1 && setStep(step - 1);
  const handleSubmit = () => {
    const targetClassInfo = mockClasses.find(c => c.id === formData.toClassId);
    if (existingApp) {
      updateTransferApplication(existingApp.id, {
        reason: formData.reason as any,
        reasonDetail: formData.reasonDetail,
        toClassId: formData.toClassId,
        toClassName: targetClassInfo?.name || '',
        trialDate: formData.trialDate,
        trialResult: formData.trialResult as any,
        trialFeedback: formData.trialFeedback,
        trialTeacherName: formData.trialTeacherName,
        parentConfirmed: formData.parentConfirmed,
        priceConfirmed: true,
        priceDifference: priceDiff,
        remainingHoursFrom: student?.remainingHours || 0,
        remainingHoursTo: student?.remainingHours || 0,
      });
      submitTransferForAudit(existingApp.id);
    }
    alert('调班申请已提交！请等待校区主管审批。');
    navigate('/students/' + student?.id);
  };

  if (!student) return <div className="empty-state">未找到学员信息</div>;

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>
              {isNew ? '发起调班申请' : '继续调班申请'} - {student.name}
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/students/' + student.id)}>
              返回档案
            </button>
          </div>
          <div className="steps mb-4">
            {steps.map((s, i) => (
              <div key={s.num} className={`step-item ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
                <div className="step-circle">{step > s.num ? '✓' : s.num}</div>
                <div className="step-title">{s.title}</div>
                {i < steps.length - 1 && <div className="step-line" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>填写调班原因</h3>
              <div className="form-group">
                <label className="form-label">当前班级</label>
                <div className="form-input" style={{ background: '#f3f4f6' }}>
                  {currentClass?.name}（剩余 {student.remainingHours} 课时）
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">调班原因 *</label>
                <select className="form-select" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}>
                  <option value="">请选择调班原因</option>
                  <option value="能力不匹配">能力不匹配（现有班级难度不合适）</option>
                  <option value="家长要求换班">家长要求换班</option>
                  <option value="老师建议留级">老师建议留级</option>
                  <option value="时间冲突">时间冲突</option>
                  <option value="其他">其他原因</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">原因说明 *</label>
                <textarea className="form-textarea" placeholder="请详细说明调班原因..." value={formData.reasonDetail} onChange={e => setFormData({ ...formData, reasonDetail: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">目标班级 *</label>
                <select className="form-select" value={formData.toClassId} onChange={e => setFormData({ ...formData, toClassId: e.target.value })}>
                  <option value="">请选择目标班级</option>
                  {availableClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}（{c.subject} · ¥{c.pricePerHour}/课时）</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>试听反馈</h3>
              <div className="card mb-4" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <div className="card-body">
                  <div className="grid grid-2">
                    <div><div className="text-sm text-gray">原班级</div><div style={{ fontWeight: 500 }}>{currentClass?.name}</div></div>
                    <div><div className="text-sm text-gray">目标班级</div><div style={{ fontWeight: 500 }}>{targetClass?.name || '未选择'}</div></div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">试听安排</label>
                <input type="date" className="form-input" value={formData.trialDate} onChange={e => setFormData({ ...formData, trialDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">试听结果</label>
                <select className="form-select" value={formData.trialResult} onChange={e => setFormData({ ...formData, trialResult: e.target.value })}>
                  <option value="pending">待安排</option>
                  <option value="pass">✅ 试听通过</option>
                  <option value="fail">❌ 试听不通过</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">试听老师</label>
                <input type="text" className="form-input" placeholder="请输入试听老师姓名" value={formData.trialTeacherName} onChange={e => setFormData({ ...formData, trialTeacherName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">试听反馈</label>
                <textarea className="form-textarea" placeholder="请填写试听反馈内容..." value={formData.trialFeedback} onChange={e => setFormData({ ...formData, trialFeedback: e.target.value })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>课时差价确认</h3>
              <div className="card mb-4" style={{ boxShadow: 'none', border: '2px solid #6366f1', background: '#eef2ff' }}>
                <div className="card-body">
                  <div className="text-center" style={{ marginBottom: 16 }}>
                    <div className="text-sm text-gray">课时差价</div>
                    <div style={{ fontSize: 32, fontWeight: 700 }}>{priceDiff >= 0 ? '+' : ''}¥{priceDiff}</div>
                  </div>
                  <div className="grid grid-2" style={{ gap: 20 }}>
                    <div>
                      <div className="text-sm text-gray">原班级</div>
                      <div style={{ fontWeight: 500 }}>{currentClass?.name}</div>
                      <div className="text-sm text-gray">¥{currentClass?.pricePerHour}/课时</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray">目标班级</div>
                      <div style={{ fontWeight: 500 }}>{targetClass?.name}</div>
                      <div className="text-sm text-gray">¥{targetClass?.pricePerHour}/课时</div>
                    </div>
                  </div>
                  <hr style={{ margin: '16px 0' }} />
                  <div className="text-sm text-gray">
                    计算公式：(目标单价 - 原单价) × 剩余课时 = ({targetClass?.pricePerHour} - {currentClass?.pricePerHour}) × {student.remainingHours} = {priceDiff >= 0 ? '+' : ''}¥{priceDiff}
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-gray">课时差价将在下一步家长确认后，由财务统一处理</div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>家长确认</h3>
              <div className="card mb-4" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <div className="card-header">调班申请摘要</div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                  <span className="text-gray">学员姓名</span><span style={{ fontWeight: 500 }}>{student.name}</span>
                  <span className="text-gray">调班原因</span><span>{formData.reason}</span>
                  <span className="text-gray">原因说明</span><span>{formData.reasonDetail}</span>
                  <span className="text-gray">原班级</span><span>{currentClass?.name}</span>
                  <span className="text-gray">目标班级</span><span>{targetClass?.name}</span>
                  <span className="text-gray">课时差价</span>
                  <span style={{ fontWeight: 600, color: priceDiff >= 0 ? '#ef4444' : '#10b981' }}>
                    {priceDiff >= 0 ? '+' : ''}¥{priceDiff}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-checkbox flex items-center gap-3" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.parentConfirmed} onChange={e => setFormData({ ...formData, parentConfirmed: e.target.checked })} />
                  <span>我是 {student.parentName}（{student.parentPhone}），已知晓上述调班内容及课时差价，同意调班申请。</span>
                </label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>提交审核</h3>
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>信息填写完成</div>
                <div className="text-sm text-gray" style={{ marginTop: 8 }}>确认无误后提交给校区主管审批</div>
              </div>
              <div className="card mt-4" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                  <span className="text-gray">调班原因</span><span>{formData.reason}</span>
                  <span className="text-gray">试听结果</span><span>{formData.trialResult === 'pass' ? '✅ 通过' : formData.trialResult === 'fail' ? '❌ 不通过' : '⏳ 待安排'}</span>
                  <span className="text-gray">课时差价</span><span>{priceDiff >= 0 ? '+' : ''}¥{priceDiff}</span>
                  <span className="text-gray">家长确认</span><span>{formData.parentConfirmed ? '✅ 已确认' : '❌ 未确认'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button className="btn btn-secondary" onClick={handlePrev} disabled={step === 1}>
              {step === 1 ? '' : '上一步'}
            </button>
            {step < 5 ? (
              <button className="btn btn-primary" onClick={handleNext}>下一步</button>
            ) : (
              <button className="btn btn-success" onClick={handleSubmit} disabled={!formData.parentConfirmed}>提交审核</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
