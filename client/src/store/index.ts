import { create } from 'zustand';
import type { Student, Program, Rehearsal, Attendance, MakeupTraining } from '../types';
import { mockStudents, mockPrograms, mockRehearsals, mockAttendances, mockMakeupTrainings } from '../data/mockData';

interface Store {
  students: Student[];
  programs: Program[];
  rehearsals: Rehearsal[];
  attendances: Attendance[];
  makeupTrainings: MakeupTraining[];
  userRole: 'admin' | 'teacher' | 'principal';
  
  setUserRole: (role: 'admin' | 'teacher' | 'principal') => void;
  addAttendance: (attendance: Omit<Attendance, 'id'>) => void;
  updateAttendance: (id: string, updates: Partial<Attendance>) => void;
  addMakeupTraining: (training: Omit<MakeupTraining, 'id'>) => void;
  updateMakeupTraining: (id: string, updates: Partial<MakeupTraining>) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
}

export const useStore = create<Store>((set) => ({
  students: mockStudents,
  programs: mockPrograms,
  rehearsals: mockRehearsals,
  attendances: mockAttendances,
  makeupTrainings: mockMakeupTrainings,
  userRole: 'admin',
  
  setUserRole: (role) => set({ userRole: role }),
  
  addAttendance: (attendance) => set((state) => ({
    attendances: [...state.attendances, { ...attendance, id: `a${Date.now()}` }],
  })),
  
  updateAttendance: (id, updates) => set((state) => ({
    attendances: state.attendances.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  })),
  
  addMakeupTraining: (training) => set((state) => {
    const newTraining = { ...training, id: `m${Date.now()}` };
    let updatedAttendances = state.attendances;
    
    if (newTraining.attendanceId && newTraining.completed) {
      updatedAttendances = state.attendances.map((a) => 
        a.id === newTraining.attendanceId 
          ? { ...a, makeupCompleted: true }
          : a
      );
    }
    
    return {
      makeupTrainings: [...state.makeupTrainings, newTraining],
      attendances: updatedAttendances,
    };
  }),
  
  updateMakeupTraining: (id, updates) => set((state) => {
    const existingTraining = state.makeupTrainings.find((m) => m.id === id);
    const oldAttendanceId = existingTraining?.attendanceId;
    const newAttendanceId = updates.attendanceId !== undefined ? updates.attendanceId : oldAttendanceId;
    const newCompleted = updates.completed !== undefined ? updates.completed : (existingTraining?.completed || false);
    
    const updatedTrainings = state.makeupTrainings.map((m) => 
      m.id === id ? { ...m, ...updates } : m
    );
    
    let updatedAttendances = state.attendances;
    
    if (oldAttendanceId && oldAttendanceId !== newAttendanceId) {
      updatedAttendances = updatedAttendances.map((a) => 
        a.id === oldAttendanceId 
          ? { ...a, makeupCompleted: false }
          : a
      );
    }
    
    if (newAttendanceId) {
      updatedAttendances = updatedAttendances.map((a) => 
        a.id === newAttendanceId 
          ? { ...a, makeupCompleted: newCompleted }
          : a
      );
    }
    
    return {
      makeupTrainings: updatedTrainings,
      attendances: updatedAttendances,
    };
  }),
  
  updateProgram: (id, updates) => set((state) => ({
    programs: state.programs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  })),
}));
