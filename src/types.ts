export enum RescueStatus {
  PENDING = 'PENDING',
  REGISTERED = 'REGISTERED',
  FOSTERING = 'FOSTERING',
  TREATING = 'TREATING',
  READY_FOR_ADOPTION = 'READY_FOR_ADOPTION',
  ADOPTED = 'ADOPTED',
  RETURNED = 'RETURNED',
  CLOSED = 'CLOSED',
}

export enum MedicalStatus {
  NOT_ASSESSED = 'NOT_ASSESSED',
  ASSESSING = 'ASSESSING',
  NEEDS_TREATMENT = 'NEEDS_TREATMENT',
  TREATING = 'TREATING',
  RECOVERED = 'RECOVERED',
}

export enum Role {
  VOLUNTEER = 'VOLUNTEER',
  VET = 'VET',
  ADOPTION_REVIEWER = 'ADOPTION_REVIEWER',
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  weight?: string;
  color: string;
  description: string;
  foundLocation: string;
  foundDate: string;
  rescuerName: string;
  rescuerPhone: string;
  status: RescueStatus;
  medicalStatus: MedicalStatus;
  currentLocation: string;
  fostererName?: string;
  fostererPhone?: string;
  adopterName?: string;
  adopterPhone?: string;
  adoptionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  animalId: string;
  type: 'ASSESSMENT' | 'TREATMENT' | 'FOLLOW_UP' | 'VACCINATION' | 'DEWORMING';
  title: string;
  description: string;
  diagnosis?: string;
  prescription?: string;
  cost?: number;
  veterinarian: string;
  date: string;
  nextFollowUp?: string;
  attachments?: string[];
  createdAt: string;
}

export interface HistoryRecord {
  id: string;
  animalId: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  note: string;
  operator: string;
  role: Role;
  timestamp: string;
}

export interface FollowUpRecord {
  id: string;
  animalId: string;
  date: string;
  content: string;
  operator: string;
  isCompleted: boolean;
  completedAt?: string;
  resultNote?: string;
  nextDate?: string;
}

export interface AppState {
  animals: Animal[];
  medicalRecords: MedicalRecord[];
  historyRecords: HistoryRecord[];
  followUps: FollowUpRecord[];
  currentRole: Role;
  currentUser: string;
}

export interface StatusExtraData {
  fostererName?: string;
  fostererPhone?: string;
  adopterName?: string;
  adopterPhone?: string;
  adoptionDate?: string;
  returnReason?: string;
  closeReason?: string;
  followUpDate?: string;
  followUpContent?: string;
}

export interface AppActions {
  setRole: (role: Role) => void;
  addAnimal: (animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>) => Animal;
  updateAnimal: (id: string, updates: Partial<Animal>) => void;
  updateAnimalStatus: (id: string, status: RescueStatus, note: string, extraData?: StatusExtraData) => void;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt'>) => MedicalRecord;
  addHistoryRecord: (record: Omit<HistoryRecord, 'id'>) => void;
  addFollowUp: (followUp: Omit<FollowUpRecord, 'id'>) => FollowUpRecord;
  completeFollowUp: (id: string, content: string) => void;
  backupData: () => string;
  restoreData: (data: string) => boolean;
  resetDemoData: () => void;
  getTodayTasks: () => {
    pendingRescue: Animal[];
    pendingMedical: Animal[];
    followUpsDue: FollowUpRecord[];
  };
}
