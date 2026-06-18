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
  updateMaterialAllocation: (courseId: string, materialId: string, allocatedQty: number, author?: string) => void;
  consumeStock: (materialId: string, qty: number) => void;
  returnStock: (materialId: string, qty: number) => void;
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

      updateMaterialAllocation: (courseId, materialId, allocatedQty, author = '系统') => {
        const state = get();
        const course = state.courses.find((c) => c.id === courseId);
        const material = state.materials.find((m) => m.id === materialId);
        const matName = material?.name || '材料';
        
        if (course && material) {
          const currentAllocation = course.materials.find((m) => m.materialId === materialId);
          const qtyDiff = allocatedQty - (currentAllocation?.allocatedQty || 0);
          
          if (qtyDiff > 0) {
            set((state) => ({
              materials: state.materials.map((m) =>
                m.id === materialId
                  ? { ...m, quantity: Math.max(0, m.quantity - qtyDiff) }
                  : m
              ),
            }));
          } else if (qtyDiff < 0) {
            set((state) => ({
              materials: state.materials.map((m) =>
                m.id === materialId
                  ? { ...m, quantity: m.quantity + Math.abs(qtyDiff) }
                  : m
              ),
            }));
          }
        }

        const isFullyAllocated = course?.materials.every((mat) => {
          if (mat.materialId === materialId) {
            return allocatedQty >= mat.requiredQty;
          }
          return mat.allocatedQty >= mat.requiredQty;
        });

        let newComment = null;
        const currentAllocation = course?.materials.find((m) => m.materialId === materialId);
        const qtyDiff = allocatedQty - (currentAllocation?.allocatedQty || 0);
        
        if (qtyDiff > 0) {
          newComment = {
            id: `cm${Date.now()}`,
            courseId,
            author,
            content: `已领用${matName} ${qtyDiff}${material?.unit || ''}`,
            createdAt: new Date().toLocaleString('zh-CN'),
          };
        } else if (qtyDiff < 0) {
          newComment = {
            id: `cm${Date.now()}`,
            courseId,
            author,
            content: `已归还${matName} ${Math.abs(qtyDiff)}${material?.unit || ''}`,
            createdAt: new Date().toLocaleString('zh-CN'),
          };
        }

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
                  status: isFullyAllocated && course.status === 'supplement' ? 'approved' : course.status,
                  comments: newComment ? [...course.comments, newComment] : course.comments,
                  updatedAt: new Date().toLocaleString('zh-CN'),
                }
              : course
          ),
        }));
      },

      consumeStock: (materialId, qty) => {
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === materialId
              ? { ...m, quantity: Math.max(0, m.quantity - qty) }
              : m
          ),
        }));
      },

      returnStock: (materialId, qty) => {
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === materialId
              ? { ...m, quantity: m.quantity + qty }
              : m
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
