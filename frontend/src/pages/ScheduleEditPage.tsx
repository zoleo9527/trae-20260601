import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter, Button, StatusTag } from '@/components/common';
import { useScheduleStore } from '@/store';
import { mockSchedules } from '@/data/mockSchedules';
import { ScheduleStatusMachine } from '@/constants';

export const ScheduleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSchedule, fetchScheduleById, updateSchedule, isLoading } = useScheduleStore();

  const [formData, setFormData] = useState({
    courseName: '',
    scheduledAt: '',
    location: '',
    expectedParticipants: 0,
    participantType: 'STUDENT' as 'STUDENT' | 'ADULT' | 'FAMILY',
    lecturerId: '',
    lecturerName: '',
    lecturerPhone: '',
    lecturerEmail: '',
    lecturerRequirements: '',
  });

  const [changeReason, setChangeReason] = useState('');
  const [showChangeReason, setShowChangeReason] = useState(false);

  useEffect(() => {
    if (id) {
      fetchScheduleById(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentSchedule) {
      setFormData({
        courseName: currentSchedule.courseName,
        scheduledAt: currentSchedule.scheduledAt,
        location: currentSchedule.location,
        expectedParticipants: currentSchedule.expectedParticipants,
        participantType: currentSchedule.participantType as 'STUDENT' | 'ADULT' | 'FAMILY',
        lecturerId: currentSchedule.lecturerId,
        lecturerName: currentSchedule.lecturerName,
        lecturerPhone: currentSchedule.lecturerPhone,
        lecturerEmail: currentSchedule.lecturerEmail,
        lecturerRequirements: currentSchedule.lecturerRequirements || '',
      });
      setShowChangeReason(currentSchedule.status === 'PUBLISHED');
    }
  }, [currentSchedule]);

  const schedule = currentSchedule || mockSchedules.find(s => s.id === id);

  if (!schedule) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">排班不存在</p>
        <Button className="mt-4" onClick={() => navigate('/schedules')}>
          返回列表
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showChangeReason && !changeReason.trim()) {
      alert('请填写变更原因');
      return;
    }

    const payload = {
      ...formData,
      changeReason: showChangeReason ? changeReason : undefined,
      updatedBy: 'user_001',
      updatedByName: '张明',
    };

    const result = await updateSchedule(id!, payload);

    if (result.success) {
      navigate(`/schedules/${id}`, { state: { changed: result.isChanged, changeReason } });
    }
  };

  const participantTypeOptions = [
    { value: 'STUDENT', label: '学生' },
    { value: 'ADULT', label: '成人' },
    { value: 'FAMILY', label: '亲子' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/schedules/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回详情
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-gray-900">编辑排班</h1>
          <p className="text-gray-600 mt-1">{schedule.courseName}</p>
        </div>
        <StatusTag status={schedule.status} type="schedule" />
      </div>

      {showChangeReason && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardBody className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">已发布排班变更</p>
              <p className="text-sm text-yellow-700">
                修改已发布的排班将自动标记相关物料为"受阻"状态，并通知相关人员重新确认物料准备。
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h3 className="font-semibold">基本信息</h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程名称 *</label>
                <input
                  type="text"
                  required
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">计划时间 *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt.replace(' ', 'T')}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value.replace('T', ' ') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动地点 *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预计人数 *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.expectedParticipants}
                  onChange={(e) => setFormData({ ...formData, expectedParticipants: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">参与对象 *</label>
                <select
                  required
                  value={formData.participantType}
                  onChange={(e) => setFormData({ ...formData, participantType: e.target.value as 'STUDENT' | 'ADULT' | 'FAMILY' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {participantTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">讲师信息</h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">讲师姓名 *</label>
                <input
                  type="text"
                  required
                  value={formData.lecturerName}
                  onChange={(e) => setFormData({ ...formData, lecturerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
                <input
                  type="tel"
                  required
                  value={formData.lecturerPhone}
                  onChange={(e) => setFormData({ ...formData, lecturerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电子邮箱</label>
                <input
                  type="email"
                  value={formData.lecturerEmail}
                  onChange={(e) => setFormData({ ...formData, lecturerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">特殊要求</label>
              <textarea
                rows={3}
                value={formData.lecturerRequirements}
                onChange={(e) => setFormData({ ...formData, lecturerRequirements: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入讲师的特殊要求..."
              />
            </div>
          </CardBody>
        </Card>

        {showChangeReason && (
          <Card className="border-red-200">
            <CardHeader>
              <h3 className="font-semibold text-red-700">变更原因 *</h3>
            </CardHeader>
            <CardBody>
              <textarea
                rows={3}
                required
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="请说明变更原因，此原因将通知相关人员..."
              />
            </CardBody>
          </Card>
        )}

        <CardFooter className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(`/schedules/${id}`)}
          >
            取消
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </CardFooter>
      </form>
    </div>
  );
};