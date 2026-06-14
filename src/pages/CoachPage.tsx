import { useEffect, useState } from 'react';
import { User, Clock, TrendingUp, Bell, X, Save } from 'lucide-react';
import { useStore } from '@/stores/appStore';
import { DataTable } from '@/components/common/DataTable';
import { TRAINING_PROGRESS_LABELS, type TrainingProgress, STUDENT_STATUS_LABELS, type StudentStatus } from '@/types';
import { maskIdCard, getRelativeTime } from '@/utils/formatters';

export function CoachPage() {
  const { currentUser, students, loadStudents, notifications, getAssignedStudents, confirmNotification, updateTrainingProgress, updateStudent } = useStore();
  const [showProgressForm, setShowProgressForm] = useState<string | null>(null);
  const [progressData, setProgressData] = useState({
    progress: 'THEORY' as TrainingProgress,
    theoryCompleted: false,
    practiceHours: 0,
    notes: '',
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const myStudents = currentUser?.role === 'COACH'
    ? getAssignedStudents(currentUser.id)
    : [];

  const pendingNotifications = notifications.filter(
    (n) => n.recipientRole === 'COACH' && !n.isConfirmed
  );

  const handleUpdateProgress = (studentId: string) => {
    updateTrainingProgress(studentId, {
      progress: progressData.progress,
      theoryCompleted: progressData.theoryCompleted,
      practiceHours: progressData.practiceHours,
    }, progressData.notes);

    const student = students.find((s) => s.id === studentId);
    if (student) {
      if (student.status === 'COACH_ASSIGNED') {
        updateStudent(studentId, {
          status: 'TRAINING',
        }, '开始培训');
      }

      if (progressData.progress === 'READY_FOR_EXAM' && student.status === 'TRAINING') {
        updateStudent(studentId, {
          status: 'PENDING_EXAM_BOOKING',
        }, '训练完成，准备预约考试');
      }
    }

    setShowProgressForm(null);
    setProgressData({
      progress: 'THEORY',
      theoryCompleted: false,
      practiceHours: 0,
      notes: '',
    });
  };

  const openProgressForm = (studentId: string) => {
    const student = myStudents.find((s) => s.id === studentId);
    if (student?.training) {
      setProgressData({
        progress: student.training.progress,
        theoryCompleted: student.training.theoryCompleted,
        practiceHours: student.training.practiceHours,
        notes: '',
      });
    }
    setShowProgressForm(studentId);
  };

  const columns = [
    {
      key: 'studentNo',
      title: '学员编号',
      width: '120px',
      render: (item: any) => (
        <span className="font-mono text-sm">{item.studentNo}</span>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      render: (item: any) => (
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
      render: (item: any) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm">{item.carType}</span>
      ),
    },
    {
      key: 'training',
      title: '训练进度',
      width: '140px',
      render: (item: any) => {
        const progress = item.training?.progress || 'NOT_STARTED';
        const progressLabels: Record<string, { label: string; color: string }> = {
          NOT_STARTED: { label: '未开始', color: 'bg-gray-100 text-gray-600' },
          THEORY: { label: '理论学习', color: 'bg-blue-100 text-blue-700' },
          PRACTICE_BASIC: { label: '基础练习', color: 'bg-cyan-100 text-cyan-700' },
          PRACTICE_INTERMEDIATE: { label: '进阶练习', color: 'bg-teal-100 text-teal-700' },
          PRACTICE_ADVANCED: { label: '强化练习', color: 'bg-green-100 text-green-700' },
          READY_FOR_EXAM: { label: '准备考试', color: 'bg-success-100 text-success-700' },
        };
        const config = progressLabels[progress] || progressLabels.NOT_STARTED;
        return (
          <div>
            <span className={`status-badge ${config.color}`}>
              {config.label}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              练车 {item.training?.practiceHours || 0} 学时
            </div>
          </div>
        );
      },
    },
    {
      key: 'assignDate',
      title: '分配日期',
      width: '100px',
      render: (item: any) => (
        <span className="text-sm text-gray-600">
          {item.training?.assignDate || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '报名状态',
      width: '100px',
      render: (item: any) => (
        <span className="text-sm text-gray-600">
          {STUDENT_STATUS_LABELS[item.status as StudentStatus] || item.status}
        </span>
      ),
    },
    {
      key: 'lastUpdate',
      title: '最近进度更新',
      width: '120px',
      render: (item: any) => (
        <span className="text-xs text-gray-500">
          {item.training?.lastProgressUpdate ? getRelativeTime(item.training.lastProgressUpdate) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '150px',
      render: (item: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => openProgressForm(item.id)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            记录进度
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">教练工作台</h1>
      </div>

      {pendingNotifications.length > 0 && (
        <div className="card p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="text-amber-500" size={20} />
            <h2 className="font-semibold text-gray-800">待处理变更通知</h2>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
              {pendingNotifications.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingNotifications.slice(0, 3).map((n) => {
              const student = students.find((s) => s.id === n.studentId);
              return (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800">{n.title}</div>
                    <div className="text-sm text-gray-600">
                      {student?.name} - {n.content}
                    </div>
                  </div>
                  <button
                    onClick={() => confirmNotification(n.id)}
                    className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                  >
                    确认
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            我的学员 ({myStudents.length})
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <User size={16} />
              <span className="text-sm">在训学员</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{myStudents.length}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Clock size={16} />
              <span className="text-sm">理论进行中</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {myStudents.filter((s) => s.training?.progress === 'THEORY').length}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <TrendingUp size={16} />
              <span className="text-sm">实操进行中</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {myStudents.filter((s) => ['PRACTICE_BASIC', 'PRACTICE_INTERMEDIATE', 'PRACTICE_ADVANCED'].includes(s.training?.progress || '')).length}
            </div>
          </div>
          <div className="p-4 bg-success-50 rounded-lg">
            <div className="flex items-center gap-2 text-success-500 mb-2">
              <TrendingUp size={16} />
              <span className="text-sm">准备考试</span>
            </div>
            <div className="text-2xl font-bold text-success-600">
              {myStudents.filter((s) => s.training?.progress === 'READY_FOR_EXAM').length}
            </div>
          </div>
        </div>

        <DataTable columns={columns} data={myStudents} />
      </div>

      {showProgressForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">记录训练进度</h2>
              <button onClick={() => setShowProgressForm(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  训练进度 <span className="text-red-500">*</span>
                </label>
                <select
                  value={progressData.progress}
                  onChange={(e) => setProgressData({ ...progressData, progress: e.target.value as TrainingProgress })}
                  className="input-field"
                >
                  {Object.entries(TRAINING_PROGRESS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={progressData.theoryCompleted}
                    onChange={(e) => setProgressData({ ...progressData, theoryCompleted: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">理论考试已通过</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  练车学时
                </label>
                <input
                  type="number"
                  min="0"
                  value={progressData.practiceHours}
                  onChange={(e) => setProgressData({ ...progressData, practiceHours: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="请输入练车学时"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <input
                  type="text"
                  value={progressData.notes}
                  onChange={(e) => setProgressData({ ...progressData, notes: e.target.value })}
                  className="input-field"
                  placeholder="请输入备注信息"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowProgressForm(null)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={() => handleUpdateProgress(showProgressForm)}
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