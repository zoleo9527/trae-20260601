import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { instructors, departments } from '@/data/mockData';
import { TrainingNeedStatus, ScheduleStatus } from '@/types';
import { X } from 'lucide-react';

interface CreateScheduleModalProps {
  onClose: () => void;
}

export function CreateScheduleModal({ onClose }: CreateScheduleModalProps) {
  const { trainingNeeds, actions } = useAppStore();

  const availableNeeds = trainingNeeds.filter(
    (need) => need.status === TrainingNeedStatus.APPROVED
  );

  const [formData, setFormData] = useState({
    trainingNeedId: '',
    instructorId: '',
    startTime: '',
    endTime: '',
    location: '',
    participantDepartments: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trainingNeedId || !formData.instructorId || !formData.startTime || !formData.endTime) {
      return;
    }

    const need = availableNeeds.find((n) => n.id === formData.trainingNeedId);
    const instructor = instructors.find((i) => i.id === formData.instructorId);

    actions.createSchedule({
      trainingNeedId: formData.trainingNeedId,
      trainingNeedTitle: need?.title || '',
      instructorId: formData.instructorId,
      instructorName: instructor?.name || '',
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      location: formData.location,
      status: ScheduleStatus.SCHEDULED,
      participantDepartments: formData.participantDepartments.length > 0
        ? formData.participantDepartments
        : need?.participantDepartments || [],
    });

    onClose();
  };

  const handleDepartmentToggle = (deptId: string) => {
    setFormData((prev) => ({
      ...prev,
      participantDepartments: prev.participantDepartments.includes(deptId)
        ? prev.participantDepartments.filter((id) => id !== deptId)
        : [...prev.participantDepartments, deptId],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">创建讲师排期</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">培训需求</label>
            <select
              value={formData.trainingNeedId}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, trainingNeedId: e.target.value }));
                const need = availableNeeds.find((n) => n.id === e.target.value);
                if (need) {
                  setFormData((prev) => ({ ...prev, participantDepartments: need.participantDepartments }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择培训需求</option>
              {availableNeeds.map((need) => (
                <option key={need.id} value={need.id}>
                  {need.title} - {need.departmentName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">讲师</label>
            <select
              value={formData.instructorId}
              onChange={(e) => setFormData((prev) => ({ ...prev, instructorId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择讲师</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name} - {instructor.expertise.join(', ')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">培训地点</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="例如：总部3楼培训室A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">参与部门</label>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleDepartmentToggle(dept.id)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    formData.participantDepartments.includes(dept.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建排期
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}