export type UserRole = 'weigher' | 'sorting_foreman' | 'sales_clerk' | 'reviewer';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export type BatchStatus = 'created' | 'sorting' | 'sorting_completed' | 'grading' | 'grading_completed' | 'reviewing' | 'completed' | 'stocked';

export type MaterialType = 'mixed_plastic' | 'PET' | 'HDPE' | 'PVC' | 'PP' | 'paper' | 'metal' | 'glass' | 'other';

export type GradeLevel = 'A' | 'B' | 'C' | 'D' | 'E';

export interface InboundBatch {
  id: string;
  batch_no: string;
  source: string;
  supplier: string;
  vehicle_plate: string;
  material_type: MaterialType;
  gross_weight: number;
  tare_weight: number;
  net_weight: number;
  weigher_id: string;
  weigher_name: string;
  status: BatchStatus;
  remark: string;
  created_at: string;
  updated_at: string;
}

export interface SortingRecord {
  id: string;
  batch_id: string;
  batch_no: string;
  team_id: string;
  team_name: string;
  foreman_id: string;
  foreman_name: string;
  sorted_materials: SortedMaterial[];
  total_sorted_weight: number;
  loss_weight: number;
  remark: string;
  created_at: string;
}

export interface SortedMaterial {
  id: string;
  sorting_record_id: string;
  material_type: MaterialType;
  weight: number;
  grade_level: GradeLevel | null;
  unit_price: number | null;
  amount: number | null;
  photo_urls: string[];
  is_stocked: boolean;
}

export interface GradeJudgment {
  id: string;
  batch_id: string;
  sorted_material_id: string;
  material_type: MaterialType;
  original_grade: GradeLevel;
  judged_grade: GradeLevel;
  unit_price: number;
  weight: number;
  amount: number;
  judge_id: string;
  judge_name: string;
  photo_urls: string[];
  remark: string;
  is_reviewed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewRecord {
  id: string;
  grade_judgment_id: string;
  batch_id: string;
  sorted_material_id: string;
  original_grade: GradeLevel;
  original_unit_price: number;
  original_amount: number;
  new_grade: GradeLevel;
  new_unit_price: number;
  new_amount: number;
  grade_difference: string;
  price_difference: number;
  amount_difference: number;
  reviewer_id: string;
  reviewer_name: string;
  reason: string;
  created_at: string;
}

export interface InventoryRecord {
  id: string;
  batch_id: string;
  batch_no: string;
  sorted_material_id: string;
  material_type: MaterialType;
  grade_level: GradeLevel;
  weight: number;
  unit_price: number;
  amount: number;
  warehouse: string;
  location: string;
  stocker_id: string;
  stocker_name: string;
  remark: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
