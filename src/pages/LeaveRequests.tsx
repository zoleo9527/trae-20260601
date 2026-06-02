import { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  MessageSquare,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { leaveRequests } from '../data/mockData';
import type { LeaveStatus } from '../types';

export default function LeaveRequests() {
  const [tab, setTab] = useState<LeaveStatus | 'all'>('pending');
  const [requests, setRequests] = useState(leaveRequests);

  const filteredRequests =
    tab === 'all'
      ? requests
      : requests.filter((r) => r.status === tab);

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'approved' as const, makeupCourse: '2026-06-10 19:00' } : r
      )
    );
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r))
    );
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">请假补课</h1>
            <p className="text-gray-500 mt-1">处理会员请假申请和补课安排</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-gray-500">待审批</p>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                <p className="text-sm text-gray-500">已通过</p>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-navy-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-500">待补课</p>
              </div>
            </Card.Body>
          </Card>
        </div>

        <Card>
          <Card.Body>
            <div className="flex gap-2">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    tab === t
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'pending'
                    ? `待审批 (${pendingCount})`
                    : t === 'approved'
                    ? `已通过 (${approvedCount})`
                    : t === 'rejected'
                    ? '已拒绝'
                    : '全部'}
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>

        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <Card.Body>
                <div className="flex items-start gap-4">
                  <img
                    src={request.memberAvatar}
                    alt={request.memberName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {request.memberName}
                          </h3>
                          <Badge
                            variant={
                              request.status === 'pending'
                                ? 'warning'
                                : request.status === 'approved'
                                ? 'success'
                                : 'danger'
                            }
                          >
                            {request.status === 'pending'
                              ? '待审批'
                              : request.status === 'approved'
                              ? '已通过'
                              : '已拒绝'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          申请时间：{request.createdAt}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          请假时间：{request.startDate} ~ {request.endDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          共 {Math.ceil(
                            (new Date(request.endDate).getTime() -
                              new Date(request.startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) + 1} 天
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-500 mb-1">请假原因</p>
                      <p className="text-gray-700">{request.reason}</p>
                    </div>

                    {request.makeupCourse && (
                      <div className="bg-teal-50 rounded-lg p-4 mb-4 border border-teal-100">
                        <div className="flex items-center gap-2 text-sm text-teal-700">
                          <CalendarCheck className="w-4 h-4" />
                          <span className="font-medium">补课已安排：</span>
                          <span>{request.makeupCourse}</span>
                        </div>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="flex gap-3">
                        <Button onClick={() => handleApprove(request.id)}>
                          <Check className="w-4 h-4 mr-1" />
                          通过并安排补课
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          拒绝
                        </Button>
                        <Button variant="secondary">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          联系会员
                        </Button>
                      </div>
                    )}

                    {request.status === 'approved' && !request.makeupCourse && (
                      <div className="flex gap-3">
                        <Button>
                          <CalendarCheck className="w-4 h-4 mr-1" />
                          安排补课
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
