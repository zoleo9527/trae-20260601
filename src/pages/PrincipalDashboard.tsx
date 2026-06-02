import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  MessageCircle,
  LogOut,
  Clock,
  Bell,
  ChevronRight,
  Send,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/store';
import StatsCard from '@/components/Features/StatsCard';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import type { Severity, MessagePriority } from '@/types';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const severityConfig: Record<Severity, { label: string; color: 'warning' | 'danger' }> = {
  normal: { label: '正常', color: 'warning' },
  warning: { label: '需关注', color: 'warning' },
  danger: { label: '紧急', color: 'danger' },
};

const priorityConfig: Record<MessagePriority, { label: string; color: 'success' | 'warning' | 'danger' }> = {
  low: { label: '普通', color: 'success' },
  medium: { label: '重要', color: 'warning' },
  high: { label: '紧急', color: 'danger' },
};

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const [anomalyFilter, setAnomalyFilter] = useState<Severity | 'all'>('all');
  const [urgedMessages, setUrgedMessages] = useState<Set<string>>(new Set());

  const children = useAppStore((state) => state.children);
  const records = useAppStore((state) => state.records);
  const messages = useAppStore((state) => state.messages);
  const classes = useAppStore((state) => state.classes);
  const logout = useAppStore((state) => state.logout);

  const totalChildren = children.length;
  const todayAnomalies = records.filter(
    (r) => r.severity === 'warning' || r.severity === 'danger'
  ).length;
  const pendingReplies = messages.filter(
    (m) => m.sender === 'parent' && !m.isRead
  ).length;

  const anomalyRecords = records
    .filter((r) => r.severity === 'warning' || r.severity === 'danger')
    .filter((r) => (anomalyFilter === 'all' ? true : r.severity === anomalyFilter))
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 10);

  const pendingMessages = messages
    .filter((m) => m.sender === 'parent' && !m.isRead)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || b.timestamp.localeCompare(a.timestamp);
    })
    .slice(0, 8);

  const getChildName = (childId: string) => {
    return children.find((c) => c.id === childId)?.name || '';
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDate = () => {
    const today = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 ${weekDays[today.getDay()]}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAnomalyClick = (childId: string) => {
    navigate(`/principal/child/${childId}`);
  };

  const handleUrgeClick = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUrgedMessages((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      return next;
    });
  };

  const handleViewChild = (childId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/principal/child/${childId}`);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">阳光幼儿园</h1>
                <p className="text-xs text-gray-500">{formatDate()}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </motion.header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">数据概览</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="总在园人数"
              value={totalChildren}
              icon={Users}
              color="primary"
              suffix="人"
            />
            <StatsCard
              title="今日异常数"
              value={todayAnomalies}
              icon={AlertTriangle}
              color="warning"
              suffix="项"
            />
            <StatsCard
              title="待回复家长"
              value={pendingReplies}
              icon={MessageCircle}
              color="info"
              suffix="位"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">异常监控</h2>
            <div className="flex gap-2">
              {(['all', 'danger', 'warning'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAnomalyFilter(filter)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200',
                    anomalyFilter === filter
                      ? 'bg-primary-500 text-white shadow-soft'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  )}
                >
                  {filter === 'all' ? '全部' : severityConfig[filter].label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            {anomalyRecords.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无异常记录</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {anomalyRecords.map((record) => {
                  const childName = getChildName(record.childId);
                  const severity = severityConfig[record.severity];
                  return (
                    <motion.div
                      key={record.id}
                      whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.02)' }}
                      onClick={() => handleAnomalyClick(record.childId)}
                      className="flex items-center justify-between p-4 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            record.severity === 'danger'
                              ? 'bg-warning-100 text-warning-600'
                              : 'bg-yellow-100 text-yellow-600'
                          )}
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{childName}</span>
                            <Badge color={severity.color}>{severity.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{record.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{formatTime(record.time)}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">待回复家长</h2>
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            {pendingMessages.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无待回复消息</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingMessages.map((message) => {
                  const childName = getChildName(message.childId);
                  const priority = priorityConfig[message.priority];
                  const isUrged = urgedMessages.has(message.id);
                  return (
                    <motion.div
                      key={message.id}
                      whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.02)' }}
                      onClick={() => handleAnomalyClick(message.childId)}
                      className="flex items-center justify-between p-4 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium">
                            {message.senderName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{childName}</span>
                            <span className="text-sm text-gray-500">({message.senderName})</span>
                            <Badge color={priority.color}>{priority.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{message.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleViewChild(message.childId, e)}
                          className="whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看
                        </Button>
                        <Button
                          variant={isUrged ? 'ghost' : 'secondary'}
                          size="sm"
                          onClick={(e) => handleUrgeClick(message.id, e)}
                          className={cn('whitespace-nowrap', isUrged && 'text-success-600')}
                          disabled={isUrged}
                        >
                          {isUrged ? (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              已督促
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              督促
                            </>
                          )}
                        </Button>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}
