import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Timeline } from './Timeline';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { X, Calendar, Users, Clock, RotateCcw, CheckCircle, XCircle, History, Edit, Trash2 } from 'lucide-react';
import { EnrollmentStatus, Student } from '@/types';

interface EnrollmentDetailProps {
  enrollmentId: string;
  onClose: () => void;
  onShowTimeline?: () => void;
  onActionComplete?: () => void;
}

export function EnrollmentDetail({ enrollmentId, onClose, onShowTimeline, onActionComplete }: EnrollmentDetailProps) {
  const { enrollments, schedules, timelineLogs, currentUser, actions } = useAppStore();
  const enrollment = enrollments.find(e => e.id === enrollmentId);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [editedStudents, setEditedStudents] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState({
    name: '',
    employeeId: '',
    position: '',
    email: '',
    phone: '',
  });

  if (!enrollment) {
    return (
      <div className="p-6 text-center text-gray-500">
        报名不存在
      </div>
    );
  }

  const relatedSchedule = schedules.find(s => s.id === enrollment.scheduleId);

  const enrollmentLogs = timelineLogs.filter(
    (log) => log.entityType === 'enrollment' && log.entityId === enrollment.id
  );

  const canConfirm = currentUser?.role === 'department' && enrollment.status === EnrollmentStatus.PENDING;
  const canReject = currentUser?.role === 'department' && enrollment.status === EnrollmentStatus.PENDING;
  const canReset = currentUser?.role === 'manager' && 
    enrollment.status !== EnrollmentStatus.PENDING && 
    enrollment.status !== EnrollmentStatus.RESET;

  const handleConfirm = () => {
    actions.confirmEnrollment(enrollmentId, enrollment.studentList);
    setShowConfirmModal(false);
    onActionComplete?.();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('请输入退回原因');
      return;
    }
    actions.rejectEnrollment(enrollmentId, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
    onActionComplete?.();
  };

  const handleReset = () => {
    if (!resetReason.trim()) {
      alert('请输入重置原因');
      return;
    }
    actions.resetEnrollment(enrollmentId, resetReason);
    setShowResetModal(false);
    setResetReason('');
    onActionComplete?.();
  };

  const handleEditStudents = () => {
    setEditedStudents([...enrollment.studentList]);
    setShowStudentModal(true);
  };

  const handleSaveStudents = () => {
    actions.saveEnrollmentStudents(enrollmentId, editedStudents);
    setShowStudentModal(false);
  };

  const handleRemoveStudent = (studentId: string) => {
    setEditedStudents(editedStudents.filter((s) => s.id !== studentId));
  };

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">报名详情</h2>
          {onShowTimeline && (
            <button
              onClick={onShowTimeline}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <History className="w-4 h-4" />
              查看完整时间线
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {enrollment.scheduleTitle}
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={enrollment.status} />
              <span className="text-sm text-gray-500">{enrollment.departmentName}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {canConfirm && (
              <>
                <button
                  onClick={handleEditStudents}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  编辑名单
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认名单
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  退回
                </button>
              </>
            )}
            {canReset && (
              <button
                onClick={() => setShowResetModal(true)}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置数据
              </button>
            )}
          </div>
        </div>

        {relatedSchedule && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">培训日期</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {format(new Date(relatedSchedule.startTime), 'yyyy年MM月dd日')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">培训时间</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {format(new Date(relatedSchedule.startTime), 'HH:mm')} - {format(new Date(relatedSchedule.endTime), 'HH:mm')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">报名人数</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {enrollment.studentList.length} 人
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-red-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">报名截止</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {format(new Date(enrollment.deadline), 'yyyy年MM月dd日 HH:mm')}
              </p>
            </div>
          </div>
        )}

        {enrollment.studentList.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">学员名单</h4>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg overflow-hidden border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">姓名</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">工号</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">职位</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">邮箱</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollment.studentList.map((student, index) => (
                    <tr key={student.id} className={cn('border-t border-gray-200', index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <td className="px-4 py-3 text-gray-900 font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-gray-600">{student.employeeId}</td>
                      <td className="px-4 py-3 text-gray-600">{student.position}</td>
                      <td className="px-4 py-3 text-gray-600">{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {enrollment.rejectedReason && enrollment.status === EnrollmentStatus.REJECTED && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-white border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <span className="font-semibold">退回原因：</span>
              {enrollment.rejectedReason}
            </p>
          </div>
        )}

        {enrollment.studentList.length === 0 && enrollment.status === EnrollmentStatus.PENDING && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">提示：</span>
              请点击"编辑名单"按钮添加参训学员
            </p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">状态时间线</h4>
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-100">
            <Timeline logs={enrollmentLogs} />
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认报名</h3>
            <p className="text-sm text-gray-600 mb-4">
              确认后，学员名单将提交给培训经理。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退回报名</h3>
            <p className="text-sm text-gray-600 mb-4">
              请输入退回原因，培训经理将重新安排。
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入退回原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">重置报名数据</h3>
            <p className="text-sm text-gray-600 mb-4">
              重置后，学员名单将被清空，状态将变更为"待确认"。历史记录将被保留。
            </p>
            <textarea
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder="请输入重置原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetReason('');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑学员名单</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">添加新学员</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="姓名"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newStudent.employeeId}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, employeeId: e.target.value }))}
                  placeholder="工号"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newStudent.position}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, position: e.target.value }))}
                  placeholder="职位"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="邮箱"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  if (newStudent.name && newStudent.employeeId) {
                    const student: Student = {
                      id: `student-${Date.now()}-${Math.random()}`,
                      ...newStudent,
                      department: enrollment.departmentName,
                    };
                    setEditedStudents([...editedStudents, student]);
                    setNewStudent({ name: '', employeeId: '', position: '', email: '', phone: '' });
                  }
                }}
                disabled={!newStudent.name || !newStudent.employeeId}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                添加学员
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                已添加 {editedStudents.length} 名学员
              </h4>
              {editedStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无学员,请添加
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">姓名</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">工号</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">职位</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">邮箱</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editedStudents.map((student, index) => (
                        <tr key={student.id} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-4 py-2 text-gray-900 font-medium">{student.name}</td>
                          <td className="px-4 py-2 text-gray-600">{student.employeeId}</td>
                          <td className="px-4 py-2 text-gray-600">{student.position}</td>
                          <td className="px-4 py-2 text-gray-600">{student.email}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleRemoveStudent(student.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {enrollment.history && enrollment.history.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  历史记录 ({enrollment.history.length}条)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {enrollment.history.map((record, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          版本 {record.version}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(record.updatedAt), 'MM-dd HH:mm')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {record.updatedBy} - {record.status}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.studentList.length}人
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSaveStudents}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
