export interface CourseMaterial {
  materialId: string;
  materialName: string;
  requiredQty: number;
  allocatedQty: number;
  unit: string;
}

export interface Comment {
  id: string;
  courseId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'urgent' | 'supplement' | 'completed';
  creator: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  materials: CourseMaterial[];
  comments: Comment[];
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minStock: number;
}

export type Role = 'educator' | 'engineer' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: Role;
}
