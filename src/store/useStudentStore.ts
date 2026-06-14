import { create } from 'zustand';
import { Student } from '@/types';
import { mockStudents } from '@/data/students';

interface StudentState {
  students: Student[];
  getStudentById: (id: string) => Student | undefined;
  updateStudent: (id: string, updates: Partial<Student>) => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: mockStudents,

  getStudentById: (id) => {
    return get().students.find(s => s.id === id);
  },

  updateStudent: (id, updates) => {
    set(state => ({
      students: state.students.map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  },
}));
