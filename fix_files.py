#!/usr/bin/env python3
import re

print("=" * 60)
print("开始修复文件...")
print("=" * 60)

# ==================== 1. TransferApplication.tsx ====================
print("\n1. 修复 TransferApplication.tsx...")
with open('src/pages/TransferApplication.tsx', 'r') as f:
    tApp = f.read()

old = "import { mockStudents, mockClasses, mockTransferApplications } from '../data/mockData';"
new = "import { mockStudents, mockClasses, getTransferApplications, submitTransferForAudit, updateTransferApplication } from '../data/mockData';"
tApp = tApp.replace(old, new)

old2 = "const existingApp = !isNew ? mockTransferApplications.find(t => t.id === id) : null;"
new2 = "const applications = getTransferApplications();\n  const existingApp = !isNew ? applications.find(t => t.id === id) : null;"
tApp = tApp.replace(old2, new2)

# 修复 handleSubmit 函数
old_submit = '''const handleSubmit = () => {
    if (existingApp) {
      submitTransferForAudit(existingApp.id);'''

if 'updateTransferApplication' not in tApp:
    new_submit = '''const handleSubmit = () => {
    if (existingApp) {
      updateTransferApplication(existingApp.id, {
        reason: formData.reason as any,
        reasonDetail: formData.reasonDetail,
        toClassId: formData.toClassId,
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
      submitTransferForAudit(existingApp.id);'''
    tApp = tApp.replace(old_submit, new_submit)

with open('src/pages/TransferApplication.tsx', 'w') as f:
    f.write(tApp)
print("   ✓ TransferApplication.tsx 修复完成")

# ==================== 2. StudentList.tsx ====================
print("\n2. 修复 StudentList.tsx...")
with open('src/pages/StudentList.tsx', 'r') as f:
    sList = f.read()

old = "import { mockStudents, mockClasses, mockTransferApplications, getStatusText, getStatusColor } from '../data/mockData';"
new = "import { mockStudents, mockClasses, getTransferApplications, getStatusText, getStatusColor } from '../data/mockData';"
sList = sList.replace(old, new)

old2 = "return mockTransferApplications.find(t => t.studentId === studentId && t.status !== 'completed' && t.status !== 'rejected');"
new2 = "return getTransferApplications().find(t => t.studentId === studentId && t.status !== 'completed' && t.status !== 'rejected');"
sList = sList.replace(old2, new2)

old3 = "{mockTransferApplications.filter(t => t.status !== 'draft' && t.status !== 'completed' && t.status !== 'rejected').length}"
new3 = "{getTransferApplications().filter(t => t.status !== 'draft' && t.status !== 'completed' && t.status !== 'rejected').length}"
sList = sList.replace(old3, new3)

old4 = "{mockTransferApplications.filter(t => t.status === 'price_confirmed').length}"
new4 = "{getTransferApplications().filter(t => t.status === 'price_confirmed').length}"
sList = sList.replace(old4, new4)

# 修复 transferStudents 和 displayStudents
if 'const transferStudents' not in sList:
    # 在 return 前添加
    old_ret = "  return ("
    new_ret = '''  const transferStudents = mockStudents.filter(s => {
    const apps = getTransferApplications();
    return apps.some(t => t.studentId === s.id && t.status !== 'completed' && t.status !== 'rejected');
  });
  const displayStudents = activeTab === 'all' ? filteredStudents : transferStudents;
  return ('''
    sList = sList.replace(old_ret, new_ret)
    # 把 filteredStudents.map 改成 displayStudents.map
    sList = sList.replace('{filteredStudents.map', '{displayStudents.map')

with open('src/pages/StudentList.tsx', 'w') as f:
    f.write(sList)
print("   ✓ StudentList.tsx 修复完成")

# ==================== 3. StudentDetail.tsx ====================
print("\n3. 修复 StudentDetail.tsx...")
with open('src/pages/StudentDetail.tsx', 'r') as f:
    sDet = f.read()

old = "import { mockStudents, mockClasses, mockCommunications, mockPerformances, mockTransferApplications, getStatusText, getStatusColor } from '../data/mockData';"
new = "import { mockStudents, mockClasses, mockCommunications, mockPerformances, getTransferApplications, getStatusText, getStatusColor } from '../data/mockData';"
sDet = sDet.replace(old, new)

old2 = "const activeTransfer = mockTransferApplications.find(t => t.studentId === id && t.status !== 'completed' && t.status !== 'rejected');"
new2 = "const activeTransfer = getTransferApplications().find(t => t.studentId === id && t.status !== 'completed' && t.status !== 'rejected');"
sDet = sDet.replace(old2, new2)

with open('src/pages/StudentDetail.tsx', 'w') as f:
    f.write(sDet)
print("   ✓ StudentDetail.tsx 修复完成")

# ==================== 4. 确认 types 导出 ====================
print("\n4. 检查 types/index.ts...")
with open('src/types/index.ts', 'r') as f:
    types = f.read()

has_exports = all([
    'export interface Student' in types,
    'export interface ClassInfo' in types,
    'export interface CommunicationRecord' in types,
    'export interface ClassPerformance' in types,
    'export interface ClassTransferApplication' in types,
    'export interface User' in types,
])

if has_exports:
    print("   ✓ 所有类型均已正确导出")
else:
    print("   ⚠ 部分类型导出缺失，需要检查")

print("\n" + "=" * 60)
print("✅ 所有文件修复完成！")
print("=" * 60)
