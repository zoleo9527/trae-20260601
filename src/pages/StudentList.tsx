import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, User } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { useStudentStore } from '@/store/useStudentStore';
import { useRenewalStore } from '@/store/useRenewalStore';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';

const classOptions = ['全部', '芭蕾精英班', '中国舞基础班', '中国舞提高班', '街舞初级班', '街舞提高班', '芭蕾基础班'];

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const { students } = useStudentStore();
  const { renewalList } = useRenewalStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('全部');

  const filteredStudents = students.filter(s => {
    const matchSearch = !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = selectedClass === '全部' || s.className === selectedClass;
    return matchSearch && matchClass;
  });

  const getStudentRenewal = (studentId: string) => {
    return renewalList.find(r => r.studentId === studentId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">
          学员档案
        </h1>
        <p className="text-ink-500 mt-1">共 {filteredStudents.length} 位学员</p>
      </div>

      {/* 筛选栏 */}
      <div className="card-base p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* 搜索 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="搜索学员姓名、班级..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          {/* 班级筛选 */}
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-4 h-4 text-ink-400 mr-1" />
            {classOptions.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  selectedClass === cls
                    ? 'bg-wine-100 text-wine-700'
                    : 'text-ink-600 hover:bg-cream-100'
                )}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 学员卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStudents.map((student, index) => {
          const renewal = getStudentRenewal(student.id);
          const progress = (student.remainingClasses / student.totalClasses) * 100;
          const isLow = progress < 20;

          return (
            <div
              key={student.id}
              className="card-base card-hover p-5 cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => navigate(`/student/${student.id}`)}
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={student.name} size="lg" gender={student.gender} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-ink-900 truncate">
                      {student.name}
                    </h3>
                  </div>
                  <p className="text-xs text-ink-500 truncate">{student.className}</p>
                </div>
              </div>

              {/* 课时进度 */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-ink-500">剩余课时</span>
                  <span className={cn(
                    'font-medium',
                    isLow ? 'text-wine-600' : 'text-ink-700'
                  )}>
                    {student.remainingClasses} / {student.totalClasses}
                  </span>
                </div>
                <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isLow ? 'bg-wine-500' : 'bg-gold-400'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 状态标签 */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {renewal && renewal.status !== 'signed' && renewal.status !== 'lost' && (
                    <StatusBadge type="renewal" value={renewal.status} />
                  )}
                  {renewal && renewal.riskLevel !== 'low' && renewal.status !== 'signed' && renewal.status !== 'lost' && (
                    <StatusBadge type="risk" value={renewal.riskLevel} />
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-wine-500 transition-colors" />
              </div>

              {/* 底部信息 */}
              <div className="mt-4 pt-3 border-t border-cream-100 flex items-center justify-between text-xs text-ink-400">
                <span>{student.level}</span>
                <span>入学 {formatDate(student.joinDate)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="card-base p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-ink-400" />
          </div>
          <p className="text-ink-500">没有找到相关学员</p>
        </div>
      )}
    </div>
  );
};

export default StudentList;
