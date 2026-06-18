import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  User,
  Phone,
  Mail,
  FileText,
  History,
  Package,
} from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter, Button, StatusTag } from '@/components/common';
import { ScheduleStatusFlow, ScheduleChangeHistory } from '@/components/schedule';
import { useScheduleStore, useMaterialStore } from '@/store';
import { mockSchedules } from '@/data/mockSchedules';
import dayjs from 'dayjs';

export const ScheduleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSchedule, fetchScheduleById, transitionSchedule, isLoading } = useScheduleStore();
  const { fetchMaterialByScheduleId, currentMaterial } = useMaterialStore();

  React.useEffect(() => {
    if (id) {
      fetchScheduleById(id);
      fetchMaterialByScheduleId(id);
    }
  }, [id]);

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

  const handleTransition = async (action: string) => {
    if (!id) return;

    const actionLabels: Record<string, string> = {
      CONFIRM: '确认',
      APPROVE: '审核通过',
      REJECT: '退回',
      PUBLISH: '发布',
    };

    if (confirm(`确定要${actionLabels[action]}此排班吗？`)) {
      await transitionSchedule(id, { action });
    }
  };

  const participantTypeLabels = {
    STUDENT: '学生',
    ADULT: '成人',
    FAMILY: '亲子',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/schedules')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {schedule.courseName}
          </h1>
          <p className="text-gray-600 mt-1">排班详情</p>
        </div>
        <StatusTag status={schedule.status} type="schedule" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold">基本信息</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">课程名称</p>
                  <p className="font-medium">{schedule.courseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">课程ID</p>
                  <p className="font-medium">{schedule.courseId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">计划时间</p>
                  <p className="font-medium">
                    {dayjs(schedule.scheduledAt).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">活动地点</p>
                  <p className="font-medium">{schedule.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">预计人数</p>
                  <p className="font-medium">{schedule.expectedParticipants}人</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">参与对象</p>
                  <p className="font-medium">
                    {participantTypeLabels[schedule.participantType]}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold">讲师信息</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">讲师姓名</p>
                  <p className="font-medium">{schedule.lecturerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">联系电话</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {schedule.lecturerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">电子邮箱</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {schedule.lecturerEmail}
                  </p>
                </div>
              </div>
              {schedule.lecturerRequirements && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">特殊要求</p>
                  <p className="font-medium">{schedule.lecturerRequirements}</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold">状态流转</h3>
              </div>
            </CardHeader>
            <CardBody>
              <ScheduleStatusFlow currentStatus={schedule.status} />
            </CardBody>
          </Card>

          {schedule.changeHistory && schedule.changeHistory.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold">变更历史</h3>
                </div>
              </CardHeader>
              <CardBody>
                <ScheduleChangeHistory changes={schedule.changeHistory} />
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">操作</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {schedule.status === 'DRAFT' && (
                <Button className="w-full" onClick={() => handleTransition('CONFIRM')}>
                  提交确认
                </Button>
              )}
              {schedule.status === 'PENDING_CONFIRM' && (
                <>
                  <Button className="w-full" onClick={() => handleTransition('APPROVE')}>
                    确认通过
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => handleTransition('REJECT')}
                  >
                    退回修改
                  </Button>
                </>
              )}
              {schedule.status === 'APPROVED' && (
                <Button className="w-full" onClick={() => handleTransition('PUBLISH')}>
                  发布排班
                </Button>
              )}
              {schedule.status === 'PUBLISHED' && (
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => navigate(`/schedules/${schedule.id}/edit`)}
                >
                  编辑排班
                </Button>
              )}
            </CardBody>
          </Card>

          {schedule.materialListId && currentMaterial && (
            <Card
              hover
              className="cursor-pointer"
              onClick={() => navigate(`/materials/${currentMaterial.id}`)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold">关联物料</h3>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">物料状态</span>
                  <StatusTag status={currentMaterial.status} type="material" size="sm" />
                </div>
                <div className="text-sm text-gray-600">
                  <p>准备人: {currentMaterial.preparedByName || '未领取'}</p>
                  <p>物料数量: {currentMaterial.materials.length}项</p>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h3 className="font-semibold">附件</h3>
            </CardHeader>
            <CardBody>
              {schedule.attachments.length > 0 ? (
                <div className="space-y-2">
                  {schedule.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm flex-1 truncate">
                        {attachment.fileName}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">暂无附件</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
