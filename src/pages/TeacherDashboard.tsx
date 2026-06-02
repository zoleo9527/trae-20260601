import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Calendar, Users, MessageCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import ChildCard from '@/components/Features/ChildCard';
import QuickRecordModal from '@/components/Features/QuickRecordModal';
import { useAppStore } from '@/store';
import type { Child, Class } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'pending' | 'warnings';

export default function TeacherDashboard() {
  const navigate = useNavigate();

  const currentUser = useAppStore((state) => state.currentUser);
  const logout = useAppStore((state) => state.logout);
  const classes = useAppStore((state) => state.classes);
  const getChildrenByClass = useAppStore((state) => state.getChildrenByClass);
  const getPendingReplyCount = useAppStore((state) => state.getPendingReplyCount);
  const getWarningRecordsCount = useAppStore((state) => state.getWarningRecordsCount);
  const messages = useAppStore((state) => state.messages);
  const children = useAppStore((state) => state.children);
  const records = useAppStore((state) => state.records);
  const markMessageAsRead = useAppStore((state) => state.markMessageAsRead);

  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [classChildren, setClassChildren] = useState<Child[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDayStr = `星期${weekDays[today.getDay()]}`;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const teacherClass = classes.find((c) => c.teacherId === currentUser.id);
    if (teacherClass) {
      setCurrentClass(teacherClass);
      const classChildren = getChildrenByClass(teacherClass.id);
      setClassChildren(classChildren);
      setPendingCount(getPendingReplyCount());
      setWarningCount(getWarningRecordsCount());
    }
  }, [currentUser, classes, getChildrenByClass, getPendingReplyCount, getWarningRecordsCount, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChildClick = (childId: string) => {
    navigate(`/teacher/child/${childId}`);
  };

  const handleQuickRecord = () => {
    setIsModalOpen(true);
  };

  const pendingMessages = messages
    .filter((m) => m.sender === 'parent' && !m.isRead)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || b.timestamp.localeCompare(a.timestamp);
    });

  const warningRecordsForList = records
    .filter((r) => r.severity === 'warning' || r.severity === 'danger')
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 10);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

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
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  if (!currentUser || !currentClass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary-500 to-primary-400 text-white"
      >
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full border-2 border-white/30 shadow-md"
              />
              <div>
                <h1 className="text-xl font-bold">{currentClass.name}</h1>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{dateStr} {weekDayStr}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{classChildren.length}人在园</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="container py-4"
      >
        <div className="flex gap-3 mb-6">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center gap-3 bg-white rounded-2xl p-4 shadow-soft cursor-pointer hover:shadow-soft-lg transition-shadow"
            onClick={() => setViewMode(viewMode === 'pending' ? 'grid' : 'pending')}
          >
            <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-info-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">待回复家长</span>
                {pendingCount > 0 && (
                  <Badge color="warning">{pendingCount}条</Badge>
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">
                {pendingCount > 0 ? `有${pendingCount}位家长等待回复` : '暂无待回复'}
              </p>
            </div>
            {viewMode === 'pending' && <ChevronRight className="w-5 h-5 text-primary-400 rotate-90" />}
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center gap-3 bg-white rounded-2xl p-4 shadow-soft cursor-pointer hover:shadow-soft-lg transition-shadow"
            onClick={() => setViewMode(viewMode === 'warnings' ? 'grid' : 'warnings')}
          >
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">需关注孩子</span>
                {warningCount > 0 && (
                  <Badge color="danger">{warningCount}人</Badge>
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">
                {warningCount > 0 ? `有${warningCount}个孩子需关注` : '全部正常'}
              </p>
            </div>
            {viewMode === 'warnings' && <ChevronRight className="w-5 h-5 text-primary-400 rotate-90" />}
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {viewMode === 'pending' && pendingMessages.length > 0 && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="container overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">待回复家长消息</h3>
                <button
                  onClick={() => {
                    pendingMessages.forEach((m) => {
                      if (!m.isRead && m.sender === 'parent') {
                        markMessageAsRead(m.id);
                      }
                    });
                    setPendingCount(0);
                  }}
                  className="text-xs text-primary-500 hover:text-primary-600"
                >
                  全部已读
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingMessages.slice(0, 5).map((msg) => {
                  const child = children.find((c) => c.id === msg.childId);
                  return (
                    <motion.div
                      key={msg.id}
                      whileHover={{ backgroundColor: 'rgba(99,102,241,0.02)' }}
                      onClick={() => {
                        markMessageAsRead(msg.id);
                        handleChildClick(msg.childId);
                      }}
                      className="flex items-center gap-3 p-4 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">{msg.senderName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-gray-900 text-sm">{child?.name}</span>
                          <span className="text-xs text-gray-400">{msg.senderName}</span>
                          <Badge color={msg.priority === 'high' ? 'danger' : msg.priority === 'medium' ? 'warning' : 'info'}>
                            {msg.priority === 'high' ? '紧急' : msg.priority === 'medium' ? '重要' : '普通'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{msg.content}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'warnings' && warningRecordsForList.length > 0 && (
          <motion.div
            key="warnings"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="container overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">需关注记录</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {warningRecordsForList.map((record) => {
                  const child = children.find((c) => c.id === record.childId);
                  return (
                    <motion.div
                      key={record.id}
                      whileHover={{ backgroundColor: 'rgba(99,102,241,0.02)' }}
                      onClick={() => handleChildClick(record.childId)}
                      className="flex items-center gap-3 p-4 cursor-pointer"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        record.severity === 'danger' ? 'bg-warning-100' : 'bg-yellow-100'
                      )}>
                        <AlertTriangle className={cn(
                          'w-5 h-5',
                          record.severity === 'danger' ? 'text-warning-600' : 'text-yellow-600'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-gray-900 text-sm">{child?.name}</span>
                          <Badge color={record.severity === 'danger' ? 'danger' : 'warning'}>
                            {record.severity === 'danger' ? '紧急' : '需关注'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{record.content}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{formatTime(record.time)}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container pb-24"
      >
        <motion.div variants={itemVariants} className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">班级孩子</h2>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 sm:grid-cols-4 gap-3"
        >
          {classChildren.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
            >
              <ChildCard
                child={child}
                onClick={() => handleChildClick(child.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          onClick={handleQuickRecord}
          className={cn(
            'w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600',
            'shadow-lg shadow-primary-300/50 flex items-center justify-center',
            'hover:shadow-xl hover:shadow-primary-300/60 transition-all duration-300',
            'hover:scale-105 active:scale-95'
          )}
        >
          <Plus className="w-8 h-8 text-white" />
        </button>
      </motion.div>

      <QuickRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        children={classChildren}
        defaultChildId={classChildren[0]?.id}
      />
    </div>
  );
}
