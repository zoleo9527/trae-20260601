import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Users, Trash2 } from 'lucide-react';
import { Enrollment, Student } from '@/types';

interface ConfirmEnrollmentModalProps {
  enrollment: Enrollment;
  onClose: () => void;
}

export function ConfirmEnrollmentModal({ enrollment, onClose }: ConfirmEnrollmentModalProps) {
  const { actions } = useAppStore();

  const [students, setStudents] = useState<Student[]>([...enrollment.studentList]);
  const [newStudent, setNewStudent] = useState({
    name: '',
    employeeId: '',
    position: '',
    email: '',
    phone: '',
  });

  const addStudent = () => {
    if (!newStudent.name || !newStudent.employeeId) return;
    const student: Student = {
      id: `student-${Date.now()}`,
      ...newStudent,
      department: enrollment.departmentName,
    };
    setStudents([...students, student]);
    setNewStudent({ name: '', employeeId: '', position: '', email: '', phone: '' });
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter((s) => s.id !== id));
  };

  const handleConfirm = () => {
    actions.confirmEnrollment(enrollment.id, students);
    onClose();
  };

  const handleReject = () => {
    actions.rejectEnrollment(enrollment.id, '部门主动退回');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">确认学员名单</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">培训信息</h3>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-100">
              <p className="text-sm font-medium text-gray-900">{enrollment.scheduleTitle}</p>
              <p className="text-sm text-gray-500 mt-1">{enrollment.departmentName}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">学员名单</h3>
            {students.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-8 text-center border border-gray-100">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无学员，请添加</p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg overflow-hidden border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">姓名</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">工号</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">职位</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">邮箱</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 text-gray-900 font-medium">{student.name}</td>
                        <td className="px-4 py-3 text-gray-600">{student.employeeId}</td>
                        <td className="px-4 py-3 text-gray-600">{student.position}</td>
                        <td className="px-4 py-3 text-gray-600">{student.email}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeStudent(student.id)}
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

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">添加学员</h4>
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
              onClick={addStudent}
              disabled={!newStudent.name || !newStudent.employeeId}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              添加学员
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            退回报名
          </button>
          <button
            onClick={handleConfirm}
            disabled={students.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            确认报名
          </button>
        </div>
      </div>
    </div>
  );
}
