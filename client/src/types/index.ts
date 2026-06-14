export interface Student {
  id: string;
  name: string;
  age: number;
  phone: string;
  parentPhone: string;
}

export interface Rehearsal {
  id: string;
  programId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Attendance {
  id: string;
  rehearsalId: string;
  studentId: string;
  present: boolean;
  reason: string;
  makeupCompleted: boolean;
  costumeCollected: boolean;
  parentConfirmed: boolean;
  actionCompletion: number;
}

export interface Program {
  id: string;
  name: string;
  type: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'preparing' | 'rehearsing' | 'ready';
  performerCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

export interface MakeupTraining {
  id: string;
  studentId: string;
  programId: string;
  date: string;
  startTime: string;
  endTime: string;
  content: string;
  completed: boolean;
  teacher: string;
}

export interface UserRole {
  role: 'admin' | 'teacher' | 'principal';
}
