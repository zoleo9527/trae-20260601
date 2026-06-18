import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Package,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Card, CardBody, StatusTag } from '@/components/common';
import { useScheduleStore, useMaterialStore, useNotificationStore } from '@/store';
import { mockSchedules } from '@/data/mockSchedules';
import { mockMaterials } from '@/data/mockMaterials';
import { mockNotifications } from '@/data/mockNotifications';
import { ScheduleStatusMachine, MaterialStatusMachine } from '@/constants';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { schedules, fetchSchedules } = useScheduleStore();
  const { materials, fetchMaterials } = useMaterialStore();
  const { notifications, fetchNotifications } = useNotificationStore();

  React.useEffect(() => {
    fetchSchedules();
    fetchMaterials();
    fetchNotifications();
  }, []);

  const displaySchedules = schedules.length > 0 ? schedules : mockSchedules;
  const displayMaterials = materials.length > 0 ? materials : mockMaterials;
  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications;

  const pendingConfirm = displaySchedules.filter(s => s.status === 'PENDING_CONFIRM');
  const pendingApprove = displaySchedules.filter(s => s.status === 'APPROVED');
  const inProgressMaterials = displayMaterials.filter(m => m.status === 'IN_PROGRESS');
  const blockedMaterials = displayMaterials.filter(m => m.status === 'BLOCKED');
  const readyMaterials = displayMaterials.filter(m => m.status === 'READY');
  const unreadNotifications = displayNotifications.filter(n => !n.readBy.includes('user_001'));

  const stats = [
    {
      title: '待社教老师确认',
      value: pendingConfirm.length,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => navigate('/schedules?status=PENDING_CONFIRM'),
      description: '等待您确认的排班申请',
    },
    {
      title: '待活动主管审核',
      value: pendingApprove.length,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => navigate('/schedules?status=APPROVED'),
      description: '等待主管审核的排班',
    },
    {
      title: '物料准备中',
      value: inProgressMaterials.length,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => navigate('/materials?status=IN_PROGRESS'),
      description: '正在准备的物料清单',
    },
    {
      title: '已就绪物料',
      value: readyMaterials.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => navigate('/materials?status=READY'),
      description: '等待讲师确认的物料',
    },
    {
      title: '受阻物料',
      value: blockedMaterials.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      onClick: () => navigate('/materials?status=BLOCKED'),
      description: '因排班变更受阻的物料',
    },
    {
      title: '未读通知',
      value: unreadNotifications.length,
      icon: Bell,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      onClick: () => navigate('/notifications'),
      description: '待处理的通知消息',
    },
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'schedule',
      title: '青铜器鉴赏入门',
      action: '排班已发布',
      time: '1小时前',
      user: '刘伟',
      icon: Calendar,
    },
    {
      id: '2',
      type: 'material',
      title: '古钱币探秘',
      action: '物料准备受阻',
      time: '2小时前',
      user: '孙丽',
      icon: AlertTriangle,
    },
    {
      id: '3',
      type: 'schedule',
      title: '书画临摹体验',
      action: '提交确认申请',
      time: '3小时前',
      user: '李华',
      icon: FileText,
    },
    {
      id: '4',
      type: 'material',
      title: '青铜器鉴赏入门',
      action: '物料准备中',
      time: '4小时前',
      user: '赵军',
      icon: Package,
    },
  ];

  const flowSteps = [
    { status: 'DRAFT', label: '草稿', count: displaySchedules.filter(s => s.status === 'DRAFT').length },
    { status: 'PENDING_CONFIRM', label: '待社教老师确认', count: pendingConfirm.length },
    { status: 'APPROVED', label: '待活动主管审核', count: pendingApprove.length },
    { status: 'PUBLISHED', label: '已发布', count: displaySchedules.filter(s => s.status === 'PUBLISHED').length },
    { status: 'CHANGED', label: '已变更', count: displaySchedules.filter(s => s.status === 'CHANGED').length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">工作台</h1>
        <p className="text-gray-600 mt-1">欢迎回来，张明老师</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            hover
            onClick={stat.onClick}
            className="cursor-pointer"
          >
            <CardBody className="p-4">
              <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.description}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">流程进度</h3>
            <button
              onClick={() => navigate('/schedules')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              {flowSteps.map((step, index) => (
                <div key={step.status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.count > 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.count}
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center max-w-[80px]">{step.label}</p>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-300 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">待办事项</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingConfirm.length > 0 && (
              <div className="px-6 py-4">
                <p className="text-sm text-gray-500 mb-3">待确认排班</p>
                {pendingConfirm.slice(0, 2).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between py-2"
                    onClick={() => navigate(`/schedules/${schedule.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{schedule.courseName}</p>
                      <p className="text-xs text-gray-500">{schedule.scheduledAt}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
            {readyMaterials.length > 0 && (
              <div className="px-6 py-4">
                <p className="text-sm text-gray-500 mb-3">待确认物料</p>
                {readyMaterials.slice(0, 2).map((material) => {
                  const schedule = displaySchedules.find(s => s.id === material.scheduleId);
                  return (
                    <div
                      key={material.id}
                      className="flex items-center justify-between py-2"
                      onClick={() => navigate(`/materials/${material.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{schedule?.courseName}</p>
                        <p className="text-xs text-gray-500">物料已就绪</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            )}
            {pendingConfirm.length === 0 && readyMaterials.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                暂无待办事项
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">近期排班</h3>
            <button
              onClick={() => navigate('/schedules')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {displaySchedules.slice(0, 5).map((schedule) => (
              <div
                key={schedule.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/schedules/${schedule.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{schedule.courseName}</p>
                      <StatusTag status={schedule.status} machine={ScheduleStatusMachine} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{schedule.location}</p>
                    <p className="text-xs text-gray-400 mt-1">{schedule.scheduledAt}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{schedule.lecturerName}</p>
                    {schedule.materialListId && (
                      <p className="text-xs text-gray-500">
                        物料: {schedule.materialStatus ? MaterialStatusMachine[schedule.materialStatus as keyof typeof MaterialStatusMachine]?.label : '未创建'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">最近动态</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'schedule' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.action} · {activity.user} · {activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {blockedMaterials.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-900">
                  有 {blockedMaterials.length} 个物料清单受阻
                </p>
                <p className="text-sm text-red-700 mt-1">
                  排班信息变更导致物料需要重新确认，请及时处理
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate('/materials?status=BLOCKED')}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    查看受阻物料
                  </button>
                  <button
                    onClick={() => navigate('/schedules?status=CHANGED')}
                    className="px-4 py-2 bg-white text-red-600 text-sm rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    查看变更排班
                  </button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};