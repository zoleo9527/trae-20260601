import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course, Material } from '@/types';
import { mockCourses, materials } from '@/data/mockData';

interface CourseStore {
  courses: Course[];
  materials: Material[];
  filterStatus: string;
  filterRole: string;
  setFilterStatus: (status: string) => void;
  setFilterRole: (role: string) => void;
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  updateCourseStatus: (id: string, status: Course['status']) => void;
  addComment: (courseId: string, author: string, content: string) => void;
  updateMaterialAllocation: (courseId: string, materialId: string, allocatedQty: number) => void;
  getFilteredCourses: () => Course[];
  exportData: () => string;
  importData: (data: string) => boolean;
}

export const useCourseStore = create<CourseStore>()(
  persist(
    (set, get) => ({
      courses: mockCourses,
      materials: materials,
      filterStatus: 'all',
      filterRole: 'all',

      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterRole: (role) => set({ filterRole: role }),

      addCourse: (courseData) => {
        const newCourse: Course = {
          ...courseData,
          id: `c${Date.now()}`,
          createdAt: new Date().toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'),
          comments: [{
            id: `cm${Date.now()}`,
            courseId: `c${Date.now()}`,
            author: courseData.creator,
            content: '课程已创建，请等待审核。',
            createdAt: new Date().toLocaleString('zh-CN'),
          }],
        };
        set((state) => ({ courses: [...state.courses, newCourse] }));
      },

      updateCourseStatus: (id, status) => {
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === id
              ? { ...course, status, updatedAt: new Date().toLocaleString('zh-CN') }
              : course
          ),
        }));
      },

      addComment: (courseId, author, content) => {
        const newComment = {
          id: `cm${Date.now()}`,
          courseId,
          author,
          content,
          createdAt: new Date().toLocaleString('zh-CN'),
        };
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  comments: [...course.comments, newComment],
                  updatedAt: new Date().toLocaleString('zh-CN'),
                }
              : course
          ),
        }));
      },

      updateMaterialAllocation: (courseId, materialId, allocatedQty) => {
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  materials: course.materials.map((mat) =>
                    mat.materialId === materialId
                      ? { ...mat, allocatedQty }
                      : mat
                  ),
                  updatedAt: new Date().toLocaleString('zh-CN'),
                }
              : course
          ),
        }));
      },

      getFilteredCourses: () => {
        const { courses, filterStatus, filterRole } = get();
        return courses.filter((course) => {
          const statusMatch = filterStatus === 'all' || course.status === filterStatus;
          let roleMatch = true;
          if (filterRole === 'educator') {
            roleMatch = users.some((u) => u.name === course.creator && u.role === 'educator');
          } else if (filterRole === 'engineer') {
            roleMatch = users.some((u) => u.name === course.assignee && u.role === 'engineer');
          } else if (filterRole === 'teacher') {
            roleMatch = users.some((u) => u.name === course.assignee && u.role === 'teacher');
          }
          return statusMatch && roleMatch;
        });
      },

      exportData: () => {
        return JSON.stringify({ courses: get().courses, materials: get().materials }, null, 2);
      },

      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.courses && parsed.materials) {
            set({ courses: parsed.courses, materials: parsed.materials });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'course-storage',
    }
  )
);

const users = [
  { id: 'u1', name: '张教员', role: 'educator' as const },
  { id: 'u2', name: '李工程师', role: 'engineer' as const },
  { id: 'u3', name: '王老师', role: 'teacher' as const },
  { id: 'u4', name: '刘教员', role: 'educator' as const },
  { id: 'u5', name: '陈工程师', role: 'engineer' as const },
  { id: 'u6', name: '赵老师', role: 'teacher' as const },
];
