import { useState } from 'react';
import { Calendar, Search, Filter, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { attendanceRecords, members } from '../data/mockData';

export default function Attendance() {
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [dateRange, setDateRange] = useState('week');

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesMember = selectedMember === 'all' || record.memberId === selectedMember;
    return matchesMember;
  });

  const completedCount = filteredRecords.filter((r) => r.status === 'completed').length;
  const cancelledCount = filteredRecords.filter((r) => r.status === 'cancelled').length;

  return (
    <Layout role="coach">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">上课消耗</h1>
            <p className="text-gray-500 mt-1">查看课程消耗记录和课包使用情况</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-navy-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
                <p className="text-sm text-gray-500">总上课次数</p>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-sm text-gray-500">完成课程</p>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-coral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{cancelledCount}</p>
                <p className="text-sm text-gray-500">取消/旷课</p>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {((completedCount / filteredRecords.length) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">出勤率</p>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-500 mb-1">选择会员</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="all">全部会员</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[
                { value: 'week', label: '本周' },
                { value: 'month', label: '本月' },
                { value: 'all', label: '全部' },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value)}
                  className={`px-4 py-2 text-sm transition-colors ${
                    dateRange === range.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">课包使用情况</h2>
          </Card.Header>
          <Card.Body>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 font-medium text-gray-500 text-sm">会员</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">课包进度</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">剩余/总课时</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">状态</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {members.slice(0, 8).map((member) => {
                    const percentage = Math.round(
                      (member.packageRemaining / member.packageTotal) * 100
                    );
                    return (
                      <tr
                        key={member.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.coachName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="w-40">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>使用进度</span>
                              <span>{100 - percentage}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  member.packageRemaining <= 5
                                    ? 'bg-coral-500'
                                    : member.packageRemaining <= 10
                                    ? 'bg-orange-500'
                                    : 'bg-teal-500'
                                }`}
                                style={{ width: `${100 - percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="font-medium">
                            {member.packageRemaining} / {member.packageTotal}
                          </span>
                        </td>
                        <td className="py-4">
                          {member.packageRemaining <= 5 ? (
                            <Badge variant="danger">即将用完</Badge>
                          ) : member.packageRemaining <= 10 ? (
                            <Badge variant="warning">余量不足</Badge>
                          ) : (
                            <Badge variant="success">充足</Badge>
                          )}
                        </td>
                        <td className="py-4">
                          <Button size="sm" variant="secondary">
                            <Package className="w-3.5 h-3.5 mr-1" />
                            续费
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">消课记录</h2>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      record.status === 'completed'
                        ? 'bg-teal-100'
                        : 'bg-coral-100'
                    }`}
                  >
                    {record.status === 'completed' ? (
                      <CheckCircle
                        className="w-5 h-5 text-teal-600"
                      />
                    ) : (
                      <XCircle className="w-5 h-5 text-coral-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {record.memberName}
                      </p>
                      <Badge
                        variant={
                          record.status === 'completed' ? 'success' : 'danger'
                        }
                      >
                        {record.status === 'completed' ? '已完成' : '已取消'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {record.courseType} · {record.coachName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{record.date}</p>
                    <p className="text-sm text-gray-500">消耗 1 课时</p>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}
