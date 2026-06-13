import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { TodoList } from '@/components/TodoList';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ScheduleDetail } from '@/components/ScheduleDetail';
import { EnrollmentDetail } from '@/components/EnrollmentDetail';
import { TrainingNeedDetail } from '@/components/TrainingNeedDetail';
import { TrainingNeedList } from '@/components/TrainingNeedList';
import { ScheduleList } from '@/components/ScheduleList';
import { EnrollmentTaskList } from '@/components/EnrollmentTaskList';
import { CreateScheduleModal } from '@/components/CreateScheduleModal';
import { InstructorScheduleList } from '@/components/InstructorScheduleList';
import { ConfirmEnrollmentModal } from '@/components/ConfirmEnrollmentModal';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  ClipboardList,
  Building2,
  GraduationCap,
  ChevronRight,
  User,
  Briefcase,
  CheckCircle,
  X
} from 'lucide-react';

export default function Home() {
  const { currentUser, todos, actions } = useAppStore();
  
  useEffect(() => {
    actions.fetchTodos();
  }, [currentUser]);

  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<string | null>(null);
  const [selectedTrainingNeed, setSelectedTrainingNeed] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState<string | null>(null);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState<string | null>(null);

  const getRoleName = () => {
    switch (currentUser?.role) {
      case 'manager': return '培训经理';
      case 'department': return '部门负责人';
      case 'instructor': return '讲师';
      default: return '未知';
    }
  };

  const getRoleIcon = () => {
    switch (currentUser?.role) {
      case 'manager': return <Briefcase className="w-5 h-5" />;
      case 'department': return <Building2 className="w-5 h-5" />;
      case 'instructor': return <GraduationCap className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const renderManagerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrainingNeedList 
          onViewDetail={(id) => setSelectedTrainingNeed(id)}
        />
        <ScheduleList 
          onViewDetail={(id) => setSelectedSchedule(id)}
          onCreateSchedule={() => setShowCreateSchedule(true)}
        />
      </div>
    </div>
  );

  const renderDepartmentDashboard = () => (
    <div className="space-y-6">
      <EnrollmentTaskList 
        onViewDetail={(id) => {
          setSelectedEnrollment(id);
        }}
      />
    </div>
  );

  const renderInstructorDashboard = () => (
    <div className="space-y-6">
      <InstructorScheduleList 
        onViewDetail={(id) => setSelectedSchedule(id)}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                企业内训管理系统
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                  {getRoleIcon()}
                  <span className="font-medium">{getRoleName()}</span>
                </div>
                {currentUser && (
                  <div className="text-gray-500">
                    · {currentUser.name}
                    {currentUser.departmentName && ` - ${currentUser.departmentName}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          <RoleSwitcher />
        </div>

        {currentUser && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                待办事项
              </h2>
              <div className="text-sm text-gray-500 mb-3">
                智能聚合：自动呈现今天要办、已拖延、刚退回的数据
              </div>
              <TodoList
                onViewSchedule={(id) => setSelectedSchedule(id)}
                onViewEnrollment={(id) => setSelectedEnrollment(id)}
                onViewTrainingNeed={(id) => setSelectedTrainingNeed(id)}
                onConfirmSchedule={(id) => setSelectedSchedule(id)}
                onRejectSchedule={(id) => setSelectedSchedule(id)}
                onConfirmEnrollment={(id) => setSelectedEnrollment(id)}
                onRejectEnrollment={(id) => setSelectedEnrollment(id)}
              />
            </div>

            {currentUser.role === 'manager' && renderManagerDashboard()}
            {currentUser.role === 'department' && renderDepartmentDashboard()}
            {currentUser.role === 'instructor' && renderInstructorDashboard()}
          </>
        )}

        {selectedTrainingNeed && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <TrainingNeedDetail
                needId={selectedTrainingNeed}
                onClose={() => setSelectedTrainingNeed(null)}
              />
            </div>
          </div>
        )}

        {selectedSchedule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ScheduleDetail
                scheduleId={selectedSchedule}
                onClose={() => setSelectedSchedule(null)}
                onShowTimeline={() => setShowTimeline(`schedule-${selectedSchedule}`)}
                onActionComplete={() => {
                  setSelectedSchedule(null);
                  actions.fetchTodos();
                }}
              />
            </div>
          </div>
        )}

        {selectedEnrollment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <EnrollmentDetail
                enrollmentId={selectedEnrollment}
                onClose={() => setSelectedEnrollment(null)}
                onShowTimeline={() => setShowTimeline(`enrollment-${selectedEnrollment}`)}
                onActionComplete={() => {
                  setSelectedEnrollment(null);
                  actions.fetchTodos();
                }}
              />
            </div>
          </div>
        )}

        {showCreateSchedule && (
          <CreateScheduleModal 
            onClose={() => setShowCreateSchedule(false)} 
          />
        )}

        {showEnrollmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ConfirmEnrollmentModal
                enrollment={useAppStore.getState().enrollments.find(e => e.id === showEnrollmentModal)!}
                onClose={() => {
                  setShowEnrollmentModal(null);
                  actions.fetchTodos();
                }}
              />
            </div>
          </div>
        )}

        {showTimeline && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">完整时间线</h2>
                  <button
                    onClick={() => setShowTimeline(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 text-center">
                    时间线详情已加载
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
