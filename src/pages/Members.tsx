import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Plus, Phone, MessageSquare, MoreHorizontal, ChevronDown, Dumbbell, Activity } from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { members } from '../data/mockData';

export default function Members() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMemberId = searchParams.get('memberId');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string | null>(initialMemberId);
  const [toast, setToast] = useState<string | null>(null);
  const memberRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (initialMemberId) {
      setSelectedMember(initialMemberId);
      setTimeout(() => {
        const el = memberRefs.current[initialMemberId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [initialMemberId]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handlePhoneContact = (memberName: string) => {
    showToast(`正在拨打 ${memberName} 的电话...`);
  };

  const handleWechatContact = (memberName: string) => {
    showToast(`正在打开与 ${memberName} 的微信聊天...`);
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, riskLevel?: string) => {
    if (riskLevel === 'high') return <Badge variant="danger">高风险</Badge>;
    if (riskLevel === 'medium') return <Badge variant="warning">中风险</Badge>;
    if (status === 'active') return <Badge variant="success">活跃</Badge>;
    if (status === 'inactive') return <Badge variant="default">沉睡</Badge>;
    return <Badge variant="default">{status}</Badge>;
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
            <h1 className="text-2xl font-bold text-gray-900">会员管理</h1>
            <p className="text-gray-500 mt-1">共 {members.length} 位会员</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            新增会员
          </Button>
        </div>

        <Card>
          <Card.Body>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索会员姓名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="all">全部状态</option>
                  <option value="active">活跃会员</option>
                  <option value="risk">风险会员</option>
                  <option value="inactive">沉睡会员</option>
                </select>
              </div>
            </div>
          </Card.Body>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              ref={(el) => { memberRefs.current[member.id] = el; }}
            >
              <Card
                hover
                className={
                  selectedMember === member.id
                    ? 'ring-2 ring-orange-500'
                    : ''
                }
              >
                <Card.Body>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.phone}</p>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {getStatusBadge(member.status, member.riskLevel)}
                    <span className="text-xs text-gray-500">
                      入会 {new Date(member.joinDate).toLocaleDateString('zh-CN')}
                    </span>
                  </div>

                  {member.riskReason && (
                    <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg mb-4">
                      ⚠️ {member.riskReason}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">课包进度</p>
                      <p className="font-semibold text-gray-900">
                        {member.packageRemaining}/{member.packageTotal} 节
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">上次到店</p>
                      <p className="font-semibold text-gray-900">
                        {member.daysSinceLastVisit} 天前
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>剩余进度</span>
                      <span>
                        {Math.round(
                          (member.packageRemaining / member.packageTotal) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          member.packageRemaining <= 5
                            ? 'bg-coral-500'
                            : member.packageRemaining <= 10
                            ? 'bg-orange-500'
                            : 'bg-teal-500'
                        }`}
                        style={{
                          width: `${(member.packageRemaining / member.packageTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhoneContact(member.name);
                      }}
                    >
                      <Phone className="w-3.5 h-3.5 mr-1" />
                      电话
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWechatContact(member.name);
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      微信
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        setSelectedMember(
                          selectedMember === member.id ? null : member.id
                        )
                      }
                    >
                      {selectedMember === member.id ? '收起' : '详情'}
                    </Button>
                  </div>

                  {selectedMember === member.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-3">训练目标</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {member.goals.map((goal, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-navy-50 text-navy-700 text-sm rounded-full"
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/training?memberId=${member.id}`)}
                        >
                          <Dumbbell className="w-3.5 h-3.5 mr-1" />
                          训练计划
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/body-measurements?memberId=${member.id}`)}
                        >
                          <Activity className="w-3.5 h-3.5 mr-1" />
                          体测记录
                        </Button>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
