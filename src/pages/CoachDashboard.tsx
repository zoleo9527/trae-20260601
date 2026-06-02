import { useState } from 'react';
import {
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Package,
  CalendarX,
  ChevronRight,
  Plus
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { todayCourses, members } from '../data/mockData';
import type { Course, Member } from '../types';

const getStatusColor = (status: Course['status']) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'scheduled':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
};

const getStatusText = (status: Course['status']) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'scheduled':
      return '待上课';
    case 'cancelled':
      return '已取消';
    case 'no-show':
      return '未到店';
    default:
      return status;
  }
};

const getRiskIcon = (reason: string) => {
  if (reason.includes('课包')) return <Package className="w-4 h-4" />;
  if (reason.includes('未到')) return <CalendarX className="w-4 h-4" />;
  if (reason.includes('停滞') || reason.includes('平台期'))
    return <TrendingDown className="w-4 h-4" />;
  return <AlertTriangle className="w-4 h-4" />;
};

const followUpMembers = members.filter((m) => m.riskLevel && m.riskLevel !== 'low');

export default function CoachDashboard() {
  const [courses, setCourses] = useState(todayCourses);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const handleCheckIn = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, status: 'completed' as const } : c
      )
    );
  };

  const handleFollowUp = (memberId: string) => {
    setSelectedMember(memberId === selectedMember ? null : memberId);
  };

  const completedCount = courses.filter((c) => c.status === 'completed').length;
  const scheduledCount = courses.filter((c) => c.status === 'scheduled').length;

  return (
    <Layout role="coach">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">教练工作台</h1>
            <p className="text-gray-500 mt-1">2026年6月2日 星期二</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              预约课程
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-sm text-gray-500">已完成</p>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-navy-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{scheduledCount}</p>
                <p className="text-sm text-gray-500">待上课</p>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{followUpMembers.length}</p>
                <p className="text-sm text-gray-500">待跟进</p>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-coral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">28</p>
                <p className="text-sm text-gray-500">在籍会员</p>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">今日课程</h2>
                  <Badge variant="info">{courses.length} 节课</Badge>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                {courses.map((course, index) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-gray-900">{course.startTime}</p>
                      <p className="text-xs text-gray-500">{course.endTime}</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200" />
                    <img
                      src={course.memberAvatar}
                      alt={course.memberName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{course.memberName}</p>
                        <Badge variant={getStatusColor(course.status)}>
                          {getStatusText(course.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{course.type}</p>
                      {course.notes && (
                        <p className="text-xs text-gray-400 mt-1">{course.notes}</p>
                      )}
                    </div>
                    {course.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(course.id)}
                        className="btn-hover"
                      >
                        签到消课
                      </Button>
                    )}
                    {course.status === 'completed' && (
                      <Button size="sm" variant="ghost">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">待跟进会员</h2>
                  <Badge variant="warning">{followUpMembers.length} 人</Badge>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                {followUpMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedMember === member.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleFollowUp(member.id)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {member.name}
                          </p>
                          <Badge
                            variant={
                              member.riskLevel === 'high'
                                ? 'danger'
                                : member.riskLevel === 'medium'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {member.riskLevel === 'high'
                              ? '高风险'
                              : member.riskLevel === 'medium'
                              ? '中风险'
                              : '低风险'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-orange-600 mb-2">
                          {getRiskIcon(member.riskReason || '')}
                          <span className="truncate">{member.riskReason}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>剩余 {member.packageRemaining} 节</span>
                          <span>{member.daysSinceLastVisit} 天未到店</span>
                        </div>
                      </div>
                    </div>

                    {selectedMember === member.id && (
                      <div className="mt-4 pt-4 border-t border-orange-200 flex gap-2">
                        <Button size="sm" variant="secondary" className="flex-1">
                          <Phone className="w-3.5 h-3.5 mr-1" />
                          电话
                        </Button>
                        <Button size="sm" variant="secondary" className="flex-1">
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          微信
                        </Button>
                        <Button size="sm" className="flex-1">
                          <User className="w-3.5 h-3.5 mr-1" />
                          详情
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
