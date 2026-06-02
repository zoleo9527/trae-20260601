import type { Class } from '../types';

export const mockClasses: Class[] = [
  {
    id: 'class-1',
    name: '小太阳班',
    teacherId: 'user-1',
    childCount: 8,
  },
];

export const getClassById = (id: string): Class | undefined => {
  return mockClasses.find(cls => cls.id === id);
};

export const getClassesByTeacherId = (teacherId: string): Class[] => {
  return mockClasses.filter(cls => cls.teacherId === teacherId);
};
