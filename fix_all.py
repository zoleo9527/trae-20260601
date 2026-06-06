#!/usr/bin/env python3
import re

print("=" * 60)
print("开始修复所有调班流程断点...")
print("=" * 60)

# ==================== 1. 修复 TransferApplication.tsx ====================
print("\n1. 修复 TransferApplication.tsx - handleSubmit 对接共享 store...")
with open('src/pages/TransferApplication.tsx', 'r') as f:
    tApp = f.read()

# 更新 import
old_import = "import { mockStudents, mockClasses, getTransferApplications, submitTransferForAudit, updateTransferApplication } from '../data/mockData';"
new_import = "import { mockStudents, mockClasses, getTransferApplications, submitTransferForAudit, updateTransferApplication, addTransferApplication } from '../data/mockData';"
tApp = tApp.replace(old_import, new_import)

# 修复 handleSubmit
old_submit = '''  const handleSubmit = () => {
    alert('调班申请已提交！请等待校区主管审批。');
    navigate('/students/' + student?.id);
  };'''

new_submit = '''  const handleSubmit = () => {
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
    } else {
      addTransferApplication({
        studentId: student?.id || '',
        studentName: student?.name || '',
        fromClassId: student?.currentClassId || '',
        fromClassName: currentClass?.name || '',
        toClassId: formData.toClassId,
        toClassName: targetClassInfo?.name || '',
        reason: formData.reason as any,
        reasonDetail: formData.reasonDetail,
        initiatorName: '李顾问',
        initiatorRole: '课程顾问',
        status: 'pending_audit',
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
    }
    alert('调班申请已提交！请等待校区主管审批。');
    navigate('/students/' + student?.id);
  };'''

tApp = tApp.replace(old_submit, new_submit)

with open('src/pages/TransferApplication.tsx', 'w') as f:
    f.write(tApp)
print("   ✓ TransferApplication.tsx 修复完成")

# ==================== 2. 修复 StudentList.tsx - 清理重复逻辑 ====================
print("\n2. 修复 StudentList.tsx - 清理重复的 transferStudents 逻辑...")
with open('src/pages/StudentList.tsx', 'r') as f:
    sList = f.read()

# 删除 map 回调内部的重复代码
bad_code = '''                if (activeTab === 'transfer' && !transfer) return null;

                const transferStudents = mockStudents.filter(s => {
    const apps = getTransferApplications();
    return apps.some(t => t.studentId === s.id && t.status !== 'completed' && t.status !== 'rejected');
  });
  const displayStudents = activeTab === 'all' ? filteredStudents : transferStudents;
  return ('''

good_code = '''                if (activeTab === 'transfer' && !transfer) return null;

                return ('''

sList = sList.replace(bad_code, good_code)

with open('src/pages/StudentList.tsx', 'w') as f:
    f.write(sList)
print("   ✓ StudentList.tsx 修复完成")

# ==================== 3. 修复 TransferApproval.tsx - 批准/拒绝对接 store ====================
print("\n3. 修复 TransferApproval.tsx - 批准/拒绝对接共享 store...")
with open('src/pages/TransferApproval.tsx', 'r') as f:
    tAppr = f.read()

# 添加 refreshKey 状态
old_state = '''  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [auditComment, setAuditComment] = useState('');'''

new_state = '''  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [auditComment, setAuditComment] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);'''

tAppr = tAppr.replace(old_state, new_state)

# 在最外层 div 添加 key
old_div = '    <div className="grid grid-2" style={{ gap: 24 }}>'
new_div = '    <div className="grid grid-2" style={{ gap: 24 }} key={refreshKey}>'
tAppr = tAppr.replace(old_div, new_div)

# 修复批准按钮
old_approve = '''                <button
                  className="btn btn-success flex-1"
                  onClick={() => {
                    alert('已批准该调班申请！');
                    setSelectedId(null);
                    setAuditComment('');
                  }}
                >
                  ✅ 批准调班
                </button>'''

new_approve = '''                <button
                  className="btn btn-success flex-1"
                  onClick={() => {
                    if (!selectedId) return;
                    approveTransfer(selectedId, '王主管（校区主管）', auditComment);
                    alert('已批准该调班申请！');
                    setSelectedId(null);
                    setAuditComment('');
                    setRefreshKey(k => k + 1);
                  }}
                >
                  ✅ 批准调班
                </button>'''

tAppr = tAppr.replace(old_approve, new_approve)

# 修复拒绝按钮
old_reject = '''                <button
                  className="btn btn-danger flex-1"
                  onClick={() => {
                    if (!auditComment.trim()) { alert('请填写拒绝原因'); return; }
                    alert('已拒绝该调班申请！');
                    setSelectedId(null);
                    setAuditComment('');
                  }}
                >
                  ❌ 拒绝申请
                </button>'''

new_reject = '''                <button
                  className="btn btn-danger flex-1"
                  onClick={() => {
                    if (!selectedId) return;
                    if (!auditComment.trim()) { alert('请填写拒绝原因'); return; }
                    rejectTransfer(selectedId, '王主管（校区主管）', auditComment);
                    alert('已拒绝该调班申请！');
                    setSelectedId(null);
                    setAuditComment('');
                    setRefreshKey(k => k + 1);
                  }}
                >
                  ❌ 拒绝申请
                </button>'''

tAppr = tAppr.replace(old_reject, new_reject)

with open('src/pages/TransferApproval.tsx', 'w') as f:
    f.write(tAppr)
print("   ✓ TransferApproval.tsx 修复完成")

# ==================== 4. 确认 types 导出 ====================
print("\n4. 检查 src/types/index.ts 导出...")
with open('src/types/index.ts', 'r') as f:
    types = f.read()

checks = [
    ('Student', 'export interface Student'),
    ('ClassInfo', 'export interface ClassInfo'),
    ('CommunicationRecord', 'export interface CommunicationRecord'),
    ('ClassPerformance', 'export interface ClassPerformance'),
    ('ClassTransferApplication', 'export interface ClassTransferApplication'),
    ('User', 'export interface User'),
]

all_good = True
for name, pattern in checks:
    if pattern in types:
        print(f"   ✓ {name} - 已导出")
    else:
        print(f"   ✗ {name} - 缺失导出")
        all_good = False

if all_good:
    print("   ✓ 所有类型均已正确导出")

print("\n" + "=" * 60)
print("✅ 所有断点修复完成！")
print("=" * 60)
