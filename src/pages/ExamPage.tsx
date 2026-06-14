import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, X, Save } from 'lucide-react';
import { useStore } from '@/stores/appStore';
import { DataTable } from '@/components/common/DataTable';
import { EXAM_SUBJECT_LABELS, type ExamSubject, STUDENT_STATUS_LABELS, type StudentStatus } from '@/types';
import { maskIdCard, formatDate } from '@/utils/formatters';

export function ExamPage() {
  const { students, users, loadStudents, loadUsers, getExams, scheduleExam, recordExamResult, currentUser, updateStudent, getExamsByStudentId } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'scheduled' | 'taken'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showResultForm, setShowResultForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    examSubject: 'THEORY' as ExamSubject,
    examDate: '',
    examVenue: '',
  });
  const [resultData, setResultData] = useState({
    examResult: 'PASSED' as 'PASSED' | 'FAILED',
    isAbsent: false,
    absenceReason: '',
    notes: '',
  });

  useEffect(() => {
    loadUsers();
    loadStudents();
  }, []);

  const exams = getExams().map((exam) => {
    const student = students.find((s) => s.id === exam.studentId);
    const specialist = users.find((u) => u.id === exam.specialistId);
    return {
      ...exam,
      student,
      specialist,
    };
  });

  const filteredExams = exams.filter((exam) => {
    if (filter === 'pending') return exam.examStatus === 'PENDING';
    if (filter === 'scheduled') return exam.examStatus === 'SCHEDULED';
    if (filter === 'taken') return exam.examStatus === 'TAKEN';
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    scheduleExam({
      ...formData,
      examStatus: 'SCHEDULED',
      specialistId: currentUser.id,
    });

    setFormData({
      studentId: '',
      examSubject: 'THEORY',
      examDate: '',
      examVenue: '',
    });
    setShowForm(false);
  };

  const handleRecordResult = (examId: string) => {
    const absenceReason = resultData.isAbsent ? resultData.absenceReason : undefined;
    recordExamResult(examId, resultData.examResult, absenceReason);

    const exam = exams.find((e) => e.id === examId);
    if (exam && exam.student) {
      if (resultData.examResult === 'PASSED') {
        const studentExams = getExamsByStudentId(exam.studentId);
        const passedExams = studentExams.filter((e) => e.examResult === 'PASSED');
        const allSubjectsPassed = ['THEORY', 'SUBJECT2', 'SUBJECT3', 'SUBJECT4'].every((subject) =>
          passedExams.some((e) => e.examSubject === subject)
        );

        if (allSubjectsPassed || exam.examSubject === 'SUBJECT4') {
          updateStudent(exam.studentId, {
            status: 'EXAM_PASSED_FINAL',
          }, '所有科目考试通过');
        }
      } else {
        const reason = resultData.isAbsent 
          ? `考试缺考${resultData.absenceReason ? `: ${resultData.absenceReason}` : ''}，需要补考`
          : `考试不合格${resultData.notes ? `: ${resultData.notes}` : ''}，需要补考`;
        updateStudent(exam.studentId, {
          status: 'PENDING_EXAM_BOOKING',
        }, reason);
      }
    }

    setShowResultForm(null);
    setResultData({
      examResult: 'PASSED',
      isAbsent: false,
      absenceReason: '',
      notes: '',
    });
  };

  const openResultForm = (examId: string) => {
    setShowResultForm(examId);
  };

  const columns = [
    {
      key: 'student',
      title: '学员信息',
      render: (item: any) => (
        <div>
          <div className="font-medium">{item.student?.name || '-'}</div>
          <div className="text-xs text-gray-500">
            {item.student ? maskIdCard(item.student.idCard) : '-'}
          </div>
          <div className="text-xs text-gray-400">
            {item.student ? STUDENT_STATUS_LABELS[item.student.status as StudentStatus] : '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'examSubject',
      title: '考试科目',
      width: '100px',
      render: (item: any) => (
        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm">
          {EXAM_SUBJECT_LABELS[item.examSubject as ExamSubject]}
        </span>
      ),
    },
    {
      key: 'examDate',
      title: '考试日期',
      width: '100px',
      render: (item: any) => (
        <span className="text-sm text-gray-600">
          {item.examDate ? formatDate(item.examDate) : '-'}
        </span>
      ),
    },
    {
      key: 'examStatus',
      title: '预约状态',
      width: '100px',
      render: (item: any) => {
        const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
          PENDING: { label: '待审核', color: 'bg-gray-100 text-gray-600', icon: Clock },
          SCHEDULED: { label: '已预约', color: 'bg-primary-100 text-primary-700', icon: Calendar },
          TAKEN: { label: '已考试', color: 'bg-success-100 text-success-700', icon: CheckCircle },
          ABSENT: { label: '缺考', color: 'bg-danger-100 text-danger-700', icon: XCircle },
        };
        const config = statusConfig[item.examStatus] || statusConfig.PENDING;
        const Icon = config.icon;
        return (
          <span className={`status-badge ${config.color}`}>
            <Icon size={12} className="mr-1" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'examResult',
      title: '考试成绩',
      width: '80px',
      render: (item: any) => {
        if (!item.examResult) return <span className="text-gray-400">-</span>;
        const isPassed = item.examResult === 'PASSED';
        return (
          <span className={`status-badge ${isPassed ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
            {isPassed ? '合格' : '不合格'}
          </span>
        );
      },
    },
    {
      key: 'examVenue',
      title: '考场',
      width: '120px',
      render: (item: any) => (
        <span className="text-sm text-gray-600">{item.examVenue || '-'}</span>
      ),
    },
    {
      key: 'specialist',
      title: '考试专员',
      width: '100px',
      render: (item: any) => (
        <span className="text-sm text-gray-600">{item.specialist?.name || '-'}</span>
      ),
    },
    {
      key: 'absenceReason',
      title: '备注',
      render: (item: any) => (
        <span className="text-sm text-gray-500">
          {item.absenceReason || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (item: any) => (
        <div className="flex gap-2">
          {item.examStatus === 'SCHEDULED' && (
            <button
              onClick={() => openResultForm(item.id)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              录入成绩
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">考试管理</h1>
        {currentUser?.role === 'SPECIALIST' && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Calendar size={18} />
            预约考试
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          待审核
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'scheduled'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          已预约
        </button>
        <button
          onClick={() => setFilter('taken')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'taken'
              ? 'bg-success-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          已考试
        </button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{exams.length}</div>
            <div className="text-sm text-gray-500">总记录</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">
              {exams.filter((e) => e.examStatus === 'PENDING').length}
            </div>
            <div className="text-sm text-amber-600">待审核</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {exams.filter((e) => e.examStatus === 'SCHEDULED').length}
            </div>
            <div className="text-sm text-blue-600">已预约</div>
          </div>
          <div className="p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600">
              {exams.filter((e) => e.examResult === 'PASSED').length}/
              {exams.filter((e) => e.examResult).length}
            </div>
            <div className="text-sm text-success-600">合格率</div>
          </div>
        </div>

        <DataTable columns={columns} data={filteredExams} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">预约考试</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学员 <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="input-field"
                >
                  <option value="">请选择学员</option>
                  {students.filter((s) => ['PENDING_EXAM_BOOKING', 'TRAINING'].includes(s.status)).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentNo}) - {STUDENT_STATUS_LABELS[s.status as StudentStatus]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  考试科目 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.examSubject}
                  onChange={(e) => setFormData({ ...formData, examSubject: e.target.value as ExamSubject })}
                  className="input-field"
                >
                  <option value="THEORY">科目一</option>
                  <option value="SUBJECT2">科目二</option>
                  <option value="SUBJECT3">科目三</option>
                  <option value="SUBJECT4">科目四</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  考试日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  考场 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.examVenue}
                  onChange={(e) => setFormData({ ...formData, examVenue: e.target.value })}
                  className="input-field"
                  placeholder="请输入考场名称"
                />
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
                  预约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResultForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">录入考试成绩</h2>
              <button onClick={() => setShowResultForm(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  考试结果 <span className="text-red-500">*</span>
                </label>
                <select
                  value={resultData.examResult}
                  onChange={(e) => setResultData({ ...resultData, examResult: e.target.value as 'PASSED' | 'FAILED' })}
                  className="input-field"
                >
                  <option value="PASSED">合格</option>
                  <option value="FAILED">不合格</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resultData.isAbsent}
                    onChange={(e) => setResultData({ ...resultData, isAbsent: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">缺考</span>
                </label>
              </div>

              {resultData.isAbsent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    缺考原因
                  </label>
                  <input
                    type="text"
                    value={resultData.absenceReason}
                    onChange={(e) => setResultData({ ...resultData, absenceReason: e.target.value })}
                    className="input-field"
                    placeholder="请输入缺考原因"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <input
                  type="text"
                  value={resultData.notes}
                  onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                  className="input-field"
                  placeholder="请输入备注信息（如考试表现等）"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowResultForm(null)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={() => handleRecordResult(showResultForm)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={16} />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}