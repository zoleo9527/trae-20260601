import { AlertCircle, Clock, User, ChevronRight } from 'lucide-react';
import { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

const statusConfig = {
  pending: { label: '待审核', className: 'bg-gray-100 text-gray-700' },
  approved: { label: '已通过', className: 'bg-green-100 text-green-700' },
  rejected: { label: '已退回', className: 'bg-red-100 text-red-700' },
  urgent: { label: '催办中', className: 'bg-amber-100 text-amber-700' },
  supplement: { label: '补材料', className: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', className: 'bg-blue-100 text-blue-700' },
};

export default function CourseCard({ course, onClick }: CourseCardProps) {
  const status = statusConfig[course.status];
  
  const hasUrgentComment = course.comments.some(
    (c) => c.content.includes('催') || c.content.includes('急')
  );

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
              {course.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {course.description}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.className} whitespace-nowrap`}>
            {status.label}
          </span>
        </div>
        
        {hasUrgentComment && course.status === 'urgent' && (
          <div className="flex items-center gap-1 text-amber-600 mb-3">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">有人催促，请尽快处理</span>
          </div>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{course.creator}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{course.assignee}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.updatedAt}</span>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {course.materials.length} 种材料
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </div>
      </div>
    </div>
  );
}
