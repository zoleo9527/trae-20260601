import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Clock, AlertTriangle, Eye, Package } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, StatusTag } from '@/components/common';
import { useScheduleStore } from '@/store';
import { ScheduleStatus } from '@/types';
import dayjs from 'dayjs';

export const ApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const { schedules, fetchSchedules, transitionSchedule } = useScheduleStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchReason, setBatchReason] = useState('');

  React.useEffect(() => {
    fetchSchedules();
  }, []);

  const pendingApproval = schedules.filter(s => s.status === 'APPROVED');
  const pendingConfirm = schedules.filter(s => s.status === 'PENDING_CONFIRM');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === pendingApproval.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingApproval.map(s => s.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) {
      alert('请选择要审核的排班');
      return;
    }

    for (const id of selectedIds) {
      await transitionSchedule(id, {
        action: 'PUBLISH',
        reason: batchReason || '批量审核通过',
      });
    }
    setSelectedIds([]);
    setBatchReason('');
    await fetchSchedules();
  };

  const handleApprove = async (id: string) => {
    await transitionSchedule(id, { action: 'PUBLISH' });
    await fetchSchedules();
  };

  const handleReject = async (id: string) => {
    const reason = prompt('请输入退回原因：');
    if (reason) {
      await transitionSchedule(id, { action: 'REJECT', reason });
      await fetchSchedules();
    }
  };

  const participantTypeLabels = {
    STUDENT: '学生',
    ADULT: '成人',
    FAMILY: '亲子',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">审批中心</h1>
          <p className="text-gray-600 mt-1">处理待审核的排班申请</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold">待活动主管审核</h3>
          {pendingApproval.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === pendingApproval.length && pendingApproval.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-600">全选</span>
              </label>
              {selectedIds.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="批量审核原因..."
                    value={batchReason}
                    onChange={(e) => setBatchReason(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg mr-2"
                  />
                  <Button onClick={handleBatchApprove} size="sm">
                    <Check className="w-4 h-4 mr-1" />
                    批量通过 ({selectedIds.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardBody>
          {pendingApproval.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">暂无待审核的排班申请</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApproval.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                    selectedIds.includes(schedule.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(schedule.id)}
                    onChange={() => toggleSelect(schedule.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{schedule.courseName}</h4>
                      <StatusTag status={schedule.status} type="schedule" size="sm" />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span>{dayjs(schedule.scheduledAt).format('YYYY-MM-DD HH:mm')}</span>
                      <span>{schedule.location}</span>
                      <span>{schedule.lecturerName}</span>
                      <span>{participantTypeLabels[schedule.participantType]}</span>
                      <span>{schedule.expectedParticipants}人</span>
                    </div>
                    {schedule.lecturerRequirements && (
                      <p className="mt-2 text-sm text-gray-500">
                        特殊要求: {schedule.lecturerRequirements}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/schedules/${schedule.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(schedule.id)}>
                      <Check className="w-4 h-4 mr-1" />
                      通过
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(schedule.id)}>
                      <X className="w-4 h-4 mr-1" />
                      退回
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">待社教老师确认</h3>
        </CardHeader>
        <CardBody>
          {pendingConfirm.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">暂无待确认的排班申请</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingConfirm.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{schedule.courseName}</h4>
                      <StatusTag status={schedule.status} type="schedule" size="sm" />
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span>{dayjs(schedule.scheduledAt).format('YYYY-MM-DD HH:mm')}</span>
                      <span>{schedule.location}</span>
                      <span>创建人: {schedule.createdByName}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/schedules/${schedule.id}`)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold">受阻物料预警</h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600 mb-4">
            以下排班的物料准备因排班变更而受阻，请关注处理进度：
          </p>
          <div className="space-y-3">
            {schedules
              .filter(s => s.status === 'CHANGED' && s.materialListId)
              .map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg"
                >
                  <Package className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{schedule.courseName}</p>
                    <p className="text-sm text-gray-600">
                      状态: 已变更 · 物料: 受阻
                    </p>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/schedules/${schedule.id}`)}>
                    查看详情
                  </Button>
                </div>
              ))}
            {schedules.filter(s => s.status === 'CHANGED' && s.materialListId).length === 0 && (
              <p className="text-center text-gray-500 py-4">暂无受阻物料</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};