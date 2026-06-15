export enum BabyGender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum FeedingType {
  BREAST_MILK = 'breast_milk',
  FORMULA = 'formula',
  MIXED = 'mixed',
}

export interface Baby {
  id: string;
  memberId: string;
  
  name: string;
  gender: BabyGender;
  birthDate: Date;
  
  feedingType: FeedingType;
  preferredFormulaBrand?: string;
  
  allergies?: string[];
  specialNotes?: string;
  
  currentMonthAge: number;
  nextMilestoneMonth: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBabyDto {
  name: string;
  gender: BabyGender;
  birthDate: string;
  feedingType: FeedingType;
  preferredFormulaBrand?: string;
  allergies?: string[];
  specialNotes?: string;
}

export interface UpdateBabyDto {
  name?: string;
  feedingType?: FeedingType;
  preferredFormulaBrand?: string;
  allergies?: string[];
  specialNotes?: string;
}

export function calculateMonthAge(birthDate: Date): number {
  const now = new Date();
  const birth = new Date(birthDate);
  
  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += now.getMonth();
  
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  
  return Math.max(0, months);
}

export function getNextMilestoneMonth(currentMonthAge: number): number {
  const milestones = [0, 1, 3, 6, 9, 12, 18, 24, 36];
  
  for (const milestone of milestones) {
    if (milestone > currentMonthAge) {
      return milestone;
    }
  }
  
  return currentMonthAge + 6;
}