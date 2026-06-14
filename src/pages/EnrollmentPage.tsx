import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, X, CheckCircle, Clock } from 'lucide-react';
import { useStore } from '@/stores/appStore';
import { DataTable } from '@/components/common/DataTable';
import { STUDENT_STATUS_LABELS, type Student, type StudentStatus } from '@/types';
import { maskIdCard, formatDate, getStatusColor, getRelativeTime, cn } from '@/utils/formatters';

export function EnrollmentPage() {
  const { students, users, loadStudents, loadUsers, createStudent, updateStudent, currentUser, notifications, getArchiveByStudentId } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    idCard: '',
    phone: '',
    address: '',
    carType: 'C1' as 'C1' | 'C2',
    enrollmentDate: new Date().toISOString().split('T')[0],
  });

  const coaches = users.filter((u) => u.role === 'COACH');

  useEffect(() => {
    loadUsers();
    loadStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      if (
        !s.name.toLowerCase().includes(kw) &&
        !s.studentNo.toLowerCase().includes(kw) &&
        !s.idCard.includes(kw)
      ) {
        return false;
      }
    }
    if (statusFilter.length > 0 && !statusFilter.includes(s.status)) {
      return false;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    createStudent({
      ...formData,
      status: 'DRAFT' as StudentStatus,
      enrollmentConsultantId: currentUser.id,
    });

    setFormData({
      name: '',
      idCard: '',
      phone: '',
      address: '',
      carType: 'C1',
      enrollmentDate: new Date().toISOString().split('T')[0],
    });
    setShowForm(false);
  };

  const handleStatusChange = (studentId: string, newStatus: StudentStatus, reason?: string | undefined, coachId?: string) => {
    const updates: Partial<Student> = { status: newStatus };
    if (coachId) {
      updates.coachId = coachId;
    }
    updateStudent(studentId, updates, reason);
    if (showDetail === studentId) {
      setShowDetail(null);
    }
  };

  const handleAssignCoach = () => {
    if (!selectedCoachId || !selectedStudent) return;
    const reason = prompt('请输入分配原因：') || `分配教练${coaches.find(c => c.id === selectedCoachId)?.name}`;
    updateStudent(selectedStudent.id, {
      status: 'COACH_ASSIGNED',
      coachId: selectedCoachId,
    }, reason);
    setSelectedCoachId('');
    setShowDetail(null);
  };

  const getAvailableStatuses = (currentStatus: StudentStatus): { value: StudentStatus; label: string; disabled?: boolean }[] => {
    const transitions: Record<StudentStatus, { value: StudentStatus; label: string }[]> = {
      DRAFT: [
        { value: 'DRAFT', label: '草稿' },
        { value: 'PENDING_REVIEW', label: '提交审核' },
      ],
      PENDING_REVIEW: [
        { value: 'PENDING_REVIEW', label: '待审核' },
        { value: 'REVIEW_PASSED', label: '审核通过' },
        { value: 'DRAFT', label: '退回修改' },
      ],
      REVIEW_PASSED: [
        { value: 'REVIEW_PASSED', label: '审核通过' },
        { value: 'PENDING_EXAM', label: '安排体检' },
        { value: 'ARCHIVED', label: '完成建档' },
      ],
      PENDING_EXAM: [
        { value: 'PENDING_EXAM', label: '待体检' },
        { value: 'EXAM_PASSED', label: '体检合格' },
        { value: 'REVIEW_PASSED', label: '重新审核' },
      ],
      EXAM_PASSED: [
        { value: 'EXAM_PASSED', label: '体检合格' },
        { value: 'ARCHIVED', label: '完成建档' },
      ],
      ARCHIVED: [
        { value: 'ARCHIVED', label: '已建档' },
        { value: 'COACH_ASSIGNED', label: '分配教练' },
      ],
      COACH_ASSIGNED: [
        { value: 'COACH_ASSIGNED', label: '已分配教练' },
        { value: 'TRAINING', label: '开始培训' },
      ],
      TRAINING: [
        { value: 'TRAINING', label: '培训中' },
        { value: 'PENDING_EXAM_BOOKING', label: '预约考试' },
      ],
      PENDING_EXAM_BOOKING: [
        { value: 'PENDING_EXAM_BOOKING', label: '待考试' },
        { value: 'EXAM_PASSED_FINAL', label: '考试通过' },
        { value: 'TRAINING', label: '继续培训' },
      ],
      EXAM_PASSED_FINAL: [
        { value: 'EXAM_PASSED_FINAL', label: '考试通过' },
        { value: 'COMPLETED', label: '结业' },
      ],
      COMPLETED: [
        { value: 'COMPLETED', label: '结业' },
      ],
    };
    return transitions[currentStatus] || [{ value: currentStatus, label: STUDENT_STATUS_LABELS[currentStatus] }];
  };

  const selectedStudent = students.find((s) => s.id === showDetail);
  const selectedArchive = selectedStudent ? getArchiveByStudentId(selectedStudent.id) : null;
  const selectedNotifications = notifications.filter((n) => n.studentId === showDetail);

  const columns = [
    {
      key: 'studentNo',
      title: '学员编号',
      width: '120px',
      render: (item: Student) => (
        <span className="font-mono text-sm">{item.studentNo}</span>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      render: (item: Student) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-gray-500">{maskIdCard(item.idCard)}</div>
        </div>
      ),
    },
    {
      key: 'carType',
      title: '车型',
      width: '60px',
      render: (item: Student) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm">{item.carType}</span>
      ),
    },
    {
      key: 'enrollmentDate',
      title: '报名日期',
      width: '100px',
      render: (item: Student) => formatDate(item.enrollmentDate),
    },
    {
      key: 'status',
      title: '状态',
      width: '120px',
      render: (item: Student) => {
        const isStuck = isStuckOrder(item);
        return (
          <span className={cn(
            'status-badge',
            getStatusColor(item.status),
            isStuck && 'animate-pulse'
          )}>
            {isStuck && <AlertCircle size={12} className="mr-1" />}
            {STUDENT_STATUS_LABELS[item.status]}
          </span>
        );
      },
    },
    {
      key: 'consultant',
      title: '招生顾问',
      width: '100px',
      render: (item: Student) => {
        const consultant = users.find((u) => u.id === item.enrollmentConsultantId);
        return consultant?.name || '-';
      },
    },
    {
      key: 'coach',
      title: '教练',
      width: '100px',
      render: (item: Student) => {
        if (!item.coachId) return '-';
        const coach = users.find((u) => u.id === item.coachId);
        return coach?.name || '-';
      },
    },
    {
      key: 'phone',
      title: '联系电话',
      width: '120px',
      render: (item: Student) => item.phone,
    },
    {
      key: 'updatedAt',
      title: '最近操作',
      width: '100px',
      render: (item: Student) => (
        <span className="text-xs text-gray-500">{getRelativeTime(item.updatedAt)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      render: (item: Student) => (
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetail(item.id)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            详情
          </button>
          {currentUser?.role === 'CONSULTANT' || currentUser?.role === 'ADMIN' ? (
            <button
              onClick={() => handleStatusChange(item.id, 'PENDING_REVIEW', '提交审核')}
              className="text-sm text-accent-600 hover:text-accent-700"
            >
              提交
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  const isStuckOrder = (student: Student) => {
    const daysSinceUpdate =
      (Date.now() - new Date(student.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return (
      (student.status === 'PENDING_REVIEW' && daysSinceUpdate > 1) ||
      (student.status === 'PENDING_EXAM' && daysSinceUpdate > 2)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">学员报名</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增学员
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、身份证号、学员编号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            multiple
            value={statusFilter}
            onChange={(e) => setStatusFilter(Array.from(e.target.selectedOptions, (o) => o.value))}
            className="input-field w-64"
          >
            <option value="">全部状态</option>
            {Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filteredStudents}
          rowClassName={(item) => (isStuckOrder(item) ? 'bg-amber-50 border-l-4 border-amber-500' : '')}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">新增学员</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="请输入学员姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  身份证号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.idCard}
                  onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                  className="input-field"
                  placeholder="请输入18位身份证号"
                  maxLength={18}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  placeholder="请输入手机号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">居住地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  placeholder="请输入居住地址"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    报名车型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.carType}
                    onChange={(e) => setFormData({ ...formData, carType: e.target.value as 'C1' | 'C2' })}
                    className="input-field"
                  >
                    <option value="C1">C1（手动挡）</option>
                    <option value="C2">C2（自动挡）</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    报名日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.enrollmentDate}
                    onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedStudent.name}</h2>
                <p className="text-sm text-gray-500">{selectedStudent.studentNo}</p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">身份证号</div>
                  <div className="text-lg font-medium">{maskIdCard(selectedStudent.idCard)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">联系电话</div>
                  <div className="text-lg font-medium">{selectedStudent.phone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">车型</div>
                  <div className="text-lg font-medium">{selectedStudent.carType}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">报名日期</div>
                  <div className="text-lg font-medium">{selectedStudent.enrollmentDate}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">招生顾问</div>
                  <div className="text-lg font-medium">
                    {users.find((u) => u.id === selectedStudent.enrollmentConsultantId)?.name || '-'}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">教练</div>
                  {selectedStudent.status === 'ARCHIVED' || selectedStudent.status === 'COACH_ASSIGNED' || selectedStudent.status === 'TRAINING' ? (
                    selectedStudent.coachId ? (
                      <div className="text-lg font-medium">
                        {users.find((u) => u.id === selectedStudent.coachId)?.name || '-'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={selectedCoachId}
                          onChange={(e) => setSelectedCoachId(e.target.value)}
                          className="input-field text-sm"
                        >
                          <option value="">选择教练</option>
                          {coaches.map((coach) => (
                            <option key={coach.id} value={coach.id}>
                              {coach.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssignCoach}
                          disabled={!selectedCoachId}
                          className="w-full px-3 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          确认分配
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="text-lg font-medium text-gray-400">
                      {selectedStudent.coachId ? users.find((u) => u.id === selectedStudent.coachId)?.name : '-'}
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">状态变更</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500">当前状态</span>
                    <div className={`mt-2 px-4 py-2 rounded-lg inline-flex items-center gap-2 ${getStatusColor(selectedStudent.status)}`}>
                      {STUDENT_STATUS_LABELS[selectedStudent.status]}
                    </div>
                  </div>
                  <div className="flex-1 ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">变更状态</label>
                    <select
                      value={selectedStudent.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as StudentStatus;
                        if (newStatus !== selectedStudent.status) {
                          const reason = prompt('请输入变更原因：');
                          handleStatusChange(selectedStudent.id, newStatus, reason || undefined);
                        }
                      }}
                      className="input-field w-full"
                    >
                      {getAvailableStatuses(selectedStudent.status).map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {selectedArchive && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">档案信息</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-500">档案状态</span>
                      <div className={`mt-1 px-3 py-1 rounded-lg text-sm inline-block ${
                        selectedArchive.archiveStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        selectedArchive.archiveStatus === 'COMPLETE' ? 'bg-success-100 text-success-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedArchive.archiveStatus === 'PENDING' ? '待完善' :
                         selectedArchive.archiveStatus === 'COMPLETE' ? '已完善' : '已锁定'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">资料状态</span>
                      <div className={`mt-1 px-3 py-1 rounded-lg text-sm inline-block ${
                        selectedArchive.documentStatus === 'PENDING' ? 'bg-gray-100 text-gray-600' :
                        'bg-success-100 text-success-700'
                      }`}>
                        {selectedArchive.documentStatus === 'PENDING' ? '待提交' : '已提交'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">缺件数量</span>
                      <div className={`mt-1 px-3 py-1 rounded-lg text-sm inline-block ${
                        selectedArchive.missingDocuments.length > 0 ? 'bg-amber-100 text-amber-700' :
                        'bg-success-100 text-success-700'
                      }`}>
                        {selectedArchive.missingDocuments.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <AlertCircle size={14} />
                            {selectedArchive.missingDocuments.length} 项缺失
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} />
                            完整
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedArchive.missingDocuments.length > 0 && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">缺件清单：</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedArchive.missingDocuments.map((doc, i) => (
                          <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedNotifications.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-4">相关通知</h3>
                  <div className="space-y-2">
                    {selectedNotifications.map((n) => (
                      <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm font-medium">{n.title}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{n.content}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt.replace(' ', 'T')).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}