import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Calendar,
  Clock,
  Filter,
  Image,
  MessageSquare,
  UtensilsCrossed,
  Activity,
  BookOpen,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { TabBar, type TabItem } from '@/components/UI/TabBar';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import HealthAlertPanel from '@/components/Features/HealthAlertPanel';
import Timeline from '@/components/Features/Timeline';
import PhotoWall from '@/components/Features/PhotoWall';
import MealNapChart from '@/components/Features/MealNapChart';
import MessageList from '@/components/Features/MessageList';
import type { RecordType, UserRole } from '@/types';
import { RECORD_TYPE_LABELS, RECORD_TYPE_ICONS } from '@/types';
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

const tabs: TabItem[] = [
  { id: 'timeline', label: '时间线', icon: <Clock className="w-4 h-4" /> },
  { id: 'photos', label: '照片', icon: <Image className="w-4 h-4" /> },
  { id: 'meal', label: '饮食睡眠', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: 'messages', label: '家长消息', icon: <MessageSquare className="w-4 h-4" /> },
];

const filterTypes: (RecordType | 'all')[] = ['all', 'arrival', 'meal', 'nap', 'mood', 'health', 'other'];

export default function ChildDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const currentUser = useAppStore((state) => state.currentUser);
  const userRole: UserRole = location.pathname.startsWith('/principal') ? 'principal' : (currentUser?.role ?? 'teacher');

  const [activeTab, setActiveTab] = useState('timeline');
  const [timelineFilter, setTimelineFilter] = useState<RecordType | 'all'>('all');

  const getChildById = useAppStore((state) => state.getChildById);
  const getRecordsByChild = useAppStore((state) => state.getRecordsByChild);
  const getPhotosByChild = useAppStore((state) => state.getPhotosByChild);
  const getMessagesByChild = useAppStore((state) => state.getMessagesByChild);
  const getHealthAlertsByChild = useAppStore((state) => state.getHealthAlertsByChild);

  const child = useMemo(() => (id ? getChildById(id) : undefined), [id, getChildById]);
  const records = useMemo(() => (id ? getRecordsByChild(id) : []), [id, getRecordsByChild]);
  const photos = useMemo(() => (id ? getPhotosByChild(id) : []), [id, getPhotosByChild]);
  const messages = useMemo(() => (id ? getMessagesByChild(id) : []), [id, getMessagesByChild]);
  const healthAlerts = useMemo(() => (id ? getHealthAlertsByChild(id) : []), [id, getHealthAlertsByChild]);

  const isTeacher = userRole === 'teacher';

  const handleBack = () => {
    navigate(userRole === 'principal' ? '/principal' : '/teacher');
  };

  const handleCallParent = () => {
    if (child?.parentPhone) {
      window.location.href = `tel:${child.parentPhone}`;
    }
  };

  const handleAddPhoto = () => {
  };

  if (!child) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">未找到孩子信息</p>
          <Button onClick={handleBack} className="mt-4">
            返回
          </Button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              {filterTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTimelineFilter(type)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200',
                    timelineFilter === type
                      ? 'bg-primary-500 text-white shadow-soft'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  )}
                >
                  {type === 'all' ? (
                    <Filter className="w-4 h-4" />
                  ) : (
                    <span>{RECORD_TYPE_ICONS[type]}</span>
                  )}
                  {type === 'all' ? '全部' : RECORD_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <Timeline records={records} filter={timelineFilter} />
          </motion.div>
        );

      case 'photos':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PhotoWall photos={photos} onAddPhoto={isTeacher ? handleAddPhoto : undefined} />
          </motion.div>
        );

      case 'meal':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MealNapChart records={records} className="mb-6" />
            <div className="bg-white rounded-2xl shadow-soft p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
                详细记录
              </h3>
              <div className="space-y-3">
                {records
                  .filter((r) => r.type === 'meal' || r.type === 'nap')
                  .sort((a, b) => b.time.localeCompare(a.time))
                  .slice(0, 10)
                  .map((record) => (
                    <div
                      key={record.id}
                      className="flex items-start gap-3 p-3 bg-cream-50 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                        <span className="text-base">{RECORD_TYPE_ICONS[record.type]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {RECORD_TYPE_LABELS[record.type]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(record.time).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{record.content}</p>
                        {record.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {record.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-xs bg-white text-gray-600 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        );

      case 'messages':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={isTeacher ? 'h-[500px]' : ''}
          >
            <MessageList messages={messages} child={child} readOnly={!isTeacher} />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-50"
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center h-14">
            <button
              onClick={handleBack}
              className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="flex-1 text-center font-semibold text-gray-900">
              {child.name}的详情
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </motion.header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-6"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <div className="bg-white rounded-2xl shadow-soft p-5">
            <div className="flex items-start gap-4">
              <img
                src={child.avatar}
                alt={child.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-soft"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{child.name}</h2>
                  <Badge color="info">{child.age}岁</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>入园：{child.admissionDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{child.parentName}</p>
                    <p className="text-sm text-gray-500">{child.parentPhone}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCallParent}
                    className="flex-shrink-0"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    联系家长
                  </Button>
                </div>
                {child.allergies.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1.5">过敏史</p>
                    <div className="flex flex-wrap gap-1.5">
                      {child.allergies.map((allergy, idx) => (
                        <Badge key={idx} color="danger">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <HealthAlertPanel healthAlerts={healthAlerts} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-6"
          />
          {renderTabContent()}
        </motion.div>
      </motion.main>
    </div>
  );
}
