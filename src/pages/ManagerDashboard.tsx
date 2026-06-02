import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CalendarCheck,
  AlertTriangle,
  Phone,
  MessageSquare,
  Eye,
  CheckCircle,
  Activity,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { members, stats, weeklyActivityData } from '../data/mockData';
import { useRoleStore } from '../store/useRoleStore';

const highRiskMembers = members.filter((m) => m.riskLevel === 'high');
const mediumRiskMembers = members.filter((m) => m.riskLevel === 'medium');
const noMeasurementMembers = members.filter((m) => m.daysSinceLastMeasurement > 30);

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { setRole } = useRoleStore();
  const [riskTab, setRiskTab] = useState<'high' | 'medium' | 'all'>('high');
  const [contactedMembers, setContactedMembers] = useState<Set<string>>(new Set());
  const [scheduledMeasurements, setScheduledMeasurements] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setRole('manager');
  }, [setRole]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleScheduleMeasurement = (memberId: string, memberName: string) => {
    setScheduledMeasurements((prev) => new Set(prev).add(memberId));
    showToast(`已为 ${memberName} 预约体测`);
  };

  const displayMembers =
    riskTab === 'high'
      ? highRiskMembers
      : riskTab === 'medium'
      ? mediumRiskMembers
      : [...highRiskMembers, ...mediumRiskMembers];

  const handleMarkContacted = (memberId: string, memberName: string) => {
    setContactedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
        showToast(`已标记 ${memberName} 为已跟进`);
      }
      return next;
    });
  };

  const handlePhoneContact = (memberName: string) => {
    showToast(`正在拨打 ${memberName} 的电话...`);
  };

  const handleWechatContact = (memberName: string) => {
    showToast(`正在打开与 ${memberName} 的微信聊天...`);
  };

  const handleViewMember = (memberId: string) => {
    navigate('/members');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {toast && (
          <div className="fixed top-4 right-4 bg-teal-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
            {toast}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据大盘</h1>
            <p className="text-gray-500 mt-1">2026年6月2日 星期二</p>
          </div>
          <Button variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新数据
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <Card.Body>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <span className="flex items-center text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">28</p>
              <p className="text-sm text-gray-500 mt-1">活跃会员</p>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-navy-600" />
                </div>
                <span className="flex items-center text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5%
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.week.attendanceRate}%</p>
              <p className="text-sm text-gray-500 mt-1">本周到店率</p>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <span className="flex items-center text-xs text-coral-600 bg-coral-50 px-2 py-1 rounded-full">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -3%
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.month.renewRate}%</p>
              <p className="text-sm text-gray-500 mt-1">本月续费率</p>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-coral-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-coral-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{highRiskMembers.length}</p>
              <p className="text-sm text-gray-500 mt-1">高风险会员</p>
            </Card.Body>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900">本周课程趋势</h2>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="courses" fill="#ff6b35" radius={[4, 4, 0, 0]} name="课程数" />
                  <Bar dataKey="members" fill="#4ecdc4" radius={[4, 4, 0, 0]} name="到店人数" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900">续费风险预警</h2>
            </Card.Header>
            <Card.Body>
              <div className="flex gap-2 mb-4">
                {(['high', 'medium', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRiskTab(tab)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      riskTab === tab
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'high'
                      ? `高风险 (${highRiskMembers.length})`
                      : tab === 'medium'
                      ? `中风险 (${mediumRiskMembers.length})`
                      : `全部`}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {displayMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {member.name}
                        </p>
                        <Badge
                          variant={member.riskLevel === 'high' ? 'danger' : 'warning'}
                        >
                          {member.riskLevel === 'high' ? '高风险' : '中风险'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {member.riskReason}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!contactedMembers.has(member.id) ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-2"
                            title="电话联系"
                            onClick={() => handlePhoneContact(member.name)}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-2"
                            title="微信联系"
                            onClick={() => handleWechatContact(member.name)}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleMarkContacted(member.id, member.name)}
                          >
                            已联系
                          </Button>
                        </>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          已跟进
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">长期未体测会员</h2>
              <Badge variant="warning">{noMeasurementMembers.length} 人</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-3 font-medium text-gray-500 text-sm">会员</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">负责教练</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">上次体测</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">间隔天数</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">课包剩余</th>
                    <th className="pb-3 font-medium text-gray-500 text-sm">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {noMeasurementMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium text-gray-900">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">{member.coachName}</td>
                      <td className="py-3 text-gray-600">{member.lastMeasurementDate}</td>
                      <td className="py-3">
                        <Badge variant="danger">{member.daysSinceLastMeasurement} 天</Badge>
                      </td>
                      <td className="py-3 text-gray-600">{member.packageRemaining} 节</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleViewMember(member.id)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            查看
                          </Button>
                          {scheduledMeasurements.has(member.id) ? (
                            <Badge variant="success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              已预约
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleScheduleMeasurement(member.id, member.name)}
                            >
                              预约体测
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Layout>
  );
}
