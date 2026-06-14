import { create } from 'zustand';
import { ClassFeedback, FeedbackStatus } from '@/types';
import { mockFeedback } from '@/data/feedback';
import { generateId } from '@/utils/date';

interface FeedbackState {
  feedbackList: ClassFeedback[];
  selectedFeedbackId: string | null;
  filterStatus: FeedbackStatus | 'all';
  searchQuery: string;

  getFeedbackById: (id: string) => ClassFeedback | undefined;
  getFeedbackByStudentId: (studentId: string) => ClassFeedback[];
  setSelectedFeedbackId: (id: string | null) => void;
  setFilterStatus: (status: FeedbackStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  addFeedback: (feedback: Omit<ClassFeedback, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateFeedbackStatus: (id: string, status: FeedbackStatus, handledBy?: string, handleNote?: string) => void;
  getFilteredFeedback: () => ClassFeedback[];
  getPendingCount: () => number;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedbackList: mockFeedback,
  selectedFeedbackId: null,
  filterStatus: 'all',
  searchQuery: '',

  getFeedbackById: (id) => {
    return get().feedbackList.find(f => f.id === id);
  },

  getFeedbackByStudentId: (studentId) => {
    return get().feedbackList
      .filter(f => f.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  setSelectedFeedbackId: (id) => set({ selectedFeedbackId: id }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  addFeedback: (feedback) => {
    const now = new Date().toISOString();
    const newFeedback: ClassFeedback = {
      ...feedback,
      id: generateId('f'),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    set(state => ({
      feedbackList: [newFeedback, ...state.feedbackList],
    }));
  },

  updateFeedbackStatus: (id, status, handledBy, handleNote) => {
    const now = new Date().toISOString();
    set(state => ({
      feedbackList: state.feedbackList.map(f =>
        f.id === id
          ? { ...f, status, updatedAt: now, handledBy, handleNote }
          : f
      ),
    }));
  },

  getFilteredFeedback: () => {
    const { feedbackList, filterStatus, searchQuery } = get();
    const { getStudentById: getStudent } = useStudentStore.getState();
    
    let filtered = [...feedbackList];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => {
        const student = getStudent(f.studentId);
        return (
          f.content.toLowerCase().includes(query) ||
          f.teacher.toLowerCase().includes(query) ||
          f.className.toLowerCase().includes(query) ||
          student?.name.toLowerCase().includes(query) ||
          f.tags.some(t => t.toLowerCase().includes(query))
        );
      });
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getPendingCount: () => {
    return get().feedbackList.filter(f => f.status === 'pending').length;
  },
}));

import { useStudentStore } from './useStudentStore';
