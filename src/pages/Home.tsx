import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Plus, Bell, AlertTriangle } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';
import CourseCard from '@/components/CourseCard';

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已退回' },
  { value: 'urgent', label: '催办中' },
  { value: 'supplement', label: '补材料' },
  { value: 'completed', label: '已完成' },
];

const roleOptions = [
  { value: 'all', label: '全部角色' },
  { value: 'educator', label: '展教员' },
  { value: 'engineer', label: '设备工程师' },
  { value: 'teacher', label: '活动老师' },
];

const users = [
  { id: 'u1', name: '张教员', role: 'educator' as const },
  { id: 'u2', name: '李工程师', role: 'engineer' as const },
  { id: 'u3', name: '王老师', role: 'teacher' as const },
  { id: 'u4', name: '刘教员', role: 'educator' as const },
  { id: 'u5', name: '陈工程师', role: 'engineer' as const },
  { id: 'u6', name: '赵老师', role: 'teacher' as const },
];

export default function Home() {
  const navigate = useNavigate();
  const { courses, filterStatus, filterRole, setFilterStatus, setFilterRole } = useCourseStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter((course) => {
    const statusMatch = filterStatus === 'all' || course.status === filterStatus;
    const searchMatch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let roleMatch = true;
    if (filterRole === 'educator') {
      roleMatch = users.some((u) => u.name === course.creator && u.role === 'educator');
    } else if (filterRole === 'engineer') {
      roleMatch = users.some((u) => u.name === course.assignee && u.role === 'engineer');
    } else if (filterRole === 'teacher') {
      roleMatch = users.some((u) => u.name === course.assignee && u.role === 'teacher');
    }
    
    return statusMatch && searchMatch && roleMatch;
  });

  const urgentCount = courses.filter((c) => c.status === 'urgent').length;
  const rejectedCount = courses.filter((c) => c.status === 'rejected').length;
  const supplementCount = courses.filter((c) => c.status === 'supplement').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索课程名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Plus className="w-5 h-5" />
              <span>新建课程</span>
            </button>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {urgentCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">催办中</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{urgentCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">已退回</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">补材料</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{supplementCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">快捷筛选</span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">状态：</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">角色：</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => navigate(`/course/${course.id}`)}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无匹配的课程</p>
        </div>
      )}
    </div>
  );
}
