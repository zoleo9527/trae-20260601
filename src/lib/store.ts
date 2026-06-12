import { create } from 'zustand';

export type UserRole = 'project_specialist' | 'review_secretary' | 'finance' | 'admin';

export type RegistrationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';

export type ClarificationStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';

interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AppState {
  currentUser: User | null;
  currentRole: UserRole;
  selectedRegistrations: string[];
  setSelectedRegistrations: (ids: string[]) => void;
  setCurrentUser: (user: User) => void;
  setCurrentRole: (role: UserRole) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: 'user-001',
    username: 'specialist1',
    name: '张专员',
    role: 'project_specialist'
  },
  currentRole: 'project_specialist',
  selectedRegistrations: [],
  setSelectedRegistrations: (ids) => set({ selectedRegistrations: ids }),
  setCurrentUser: (user) => set({ currentUser: user, currentRole: user.role }),
  setCurrentRole: (role) => set({ currentRole: role })
}));

export const roleLabels: Record<UserRole, string> = {
  project_specialist: '项目专员',
  review_secretary: '评审秘书',
  finance: '财务',
  admin: '管理员'
};

export const statusLabels: Record<RegistrationStatus, string> = {
  pending: '待处理',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已退回',
  completed: '已完成'
};

export const clarificationStatusLabels: Record<ClarificationStatus, string> = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已退回',
  published: '已发布'
};

export const statusColors: Record<RegistrationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800'
};

export const clarificationStatusColors: Record<ClarificationStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-blue-100 text-blue-800'
};