'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { PracticeRecord, StageReview, PracticeStatus, ReviewStatus, Role } from '../types';

const dataPath = path.join(process.cwd(), 'data', 'store.json');

interface DataStore {
  practiceRecords: PracticeRecord[];
  stageReviews: StageReview[];
  students: Array<{
    id: string;
    name: string;
    age: number;
    instrument: string;
    level: string;
    parentPhone: string;
  }>;
}

async function readData(): Promise<DataStore> {
  try {
    const content = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { practiceRecords: [], stageReviews: [], students: [] };
  }
}

async function writeData(data: DataStore): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getPracticeRecords(filters?: {
  studentName?: string;
  instrument?: string;
  status?: PracticeStatus;
}): Promise<PracticeRecord[]> {
  const data = await readData();
  let records = data.practiceRecords;
  
  if (filters) {
    if (filters.studentName) {
      records = records.filter(r => r.studentName.includes(filters.studentName!));
    }
    if (filters.instrument) {
      records = records.filter(r => r.instrument === filters.instrument);
    }
    if (filters.status) {
      records = records.filter(r => r.status === filters.status);
    }
  }
  
  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getStageReviews(filters?: {
  studentName?: string;
  instrument?: string;
  status?: ReviewStatus;
}): Promise<StageReview[]> {
  const data = await readData();
  let reviews = data.stageReviews;
  
  if (filters) {
    if (filters.studentName) {
      reviews = reviews.filter(r => r.studentName.includes(filters.studentName!));
    }
    if (filters.instrument) {
      reviews = reviews.filter(r => r.instrument === filters.instrument);
    }
    if (filters.status) {
      reviews = reviews.filter(r => r.status === filters.status);
    }
  }
  
  return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getTodayPendingRecords(): Promise<PracticeRecord[]> {
  const data = await readData();
  const today = new Date().toISOString().split('T')[0];
  return data.practiceRecords.filter(r => 
    r.status === '待处理' && r.practiceDate === today
  );
}

export async function getOverdueRecords(): Promise<PracticeRecord[]> {
  const data = await readData();
  const today = new Date().toISOString().split('T')[0];
  return data.practiceRecords.filter(r => 
    r.status === '超时' || (r.status === '待处理' && r.practiceDate < today)
  );
}

export async function getReturnedRecords(): Promise<PracticeRecord[]> {
  const data = await readData();
  return data.practiceRecords.filter(r => r.status === '已退回');
}

export async function getPendingReviews(): Promise<StageReview[]> {
  const data = await readData();
  return data.stageReviews.filter(r => r.status === '待点评');
}

export async function getWaitingConfirmReviews(): Promise<StageReview[]> {
  const data = await readData();
  return data.stageReviews.filter(r => r.status === '待确认');
}

export async function handlePracticeRecord(
  recordId: string,
  note: string,
  status: PracticeStatus,
  handlerRole: Role
): Promise<{ success: boolean; message: string }> {
  const data = await readData();
  const index = data.practiceRecords.findIndex(r => r.id === recordId);
  
  if (index === -1) {
    return { success: false, message: '记录不存在' };
  }
  
  const practiceRecord = data.practiceRecords[index];
  const isConfirming = status === '已确认' && practiceRecord.status !== '已确认';
  
  data.practiceRecords[index] = {
    ...practiceRecord,
    note,
    status,
    updatedAt: new Date().toLocaleString('zh-CN'),
    handledBy: handlerRole,
  };
  
  if (isConfirming) {
    const existingReview = data.stageReviews.find(
      r => r.studentId === practiceRecord.studentId && r.status === '待点评'
    );
    
    if (!existingReview) {
      const stages = ['第一阶段', '第二阶段', '第三阶段', '第四阶段', '第五阶段'];
      const currentStageIndex = Math.min(
        data.stageReviews.filter(r => r.studentId === practiceRecord.studentId).length,
        stages.length - 1
      );
      
      const newReview: StageReview = {
        id: `r${Date.now()}`,
        studentId: practiceRecord.studentId,
        studentName: practiceRecord.studentName,
        instrument: practiceRecord.instrument,
        stage: stages[currentStageIndex],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        overallEvaluation: '',
        skillsEvaluation: { technique: 0, expression: 0, rhythm: 0, progress: 0 },
        improvementSuggestions: '',
        nextStageGoals: '',
        status: '待点评',
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        relatedPracticeNotes: [note] || [],
        reviewedBy: null,
        confirmedBy: null,
      };
      
      data.stageReviews.push(newReview);
      data.practiceRecords[index].reviewId = newReview.id;
    } else {
      if (note && !existingReview.relatedPracticeNotes.includes(note)) {
        existingReview.relatedPracticeNotes.push(note);
      }
      data.practiceRecords[index].reviewId = existingReview.id;
    }
  }
  
  await writeData(data);
  return { success: true, message: '处理成功' };
}

export async function submitStageReview(
  reviewId: string,
  data: Partial<StageReview>,
  reviewerRole: Role
): Promise<{ success: boolean; message: string }> {
  const store = await readData();
  const index = store.stageReviews.findIndex(r => r.id === reviewId);
  
  if (index === -1) {
    return { success: false, message: '点评不存在' };
  }
  
  const relatedNotes = store.practiceRecords
    .filter(r => r.studentId === store.stageReviews[index].studentId && r.status === '已确认' && r.note)
    .map(r => r.note);
  
  store.stageReviews[index] = {
    ...store.stageReviews[index],
    ...data,
    relatedPracticeNotes: relatedNotes,
    status: '待确认',
    updatedAt: new Date().toLocaleString('zh-CN'),
    reviewedBy: reviewerRole,
  };
  
  await writeData(store);
  return { success: true, message: '点评提交成功' };
}

export async function confirmStageReview(
  reviewId: string,
  confirmerRole: Role
): Promise<{ success: boolean; message: string }> {
  const data = await readData();
  const index = data.stageReviews.findIndex(r => r.id === reviewId);
  
  if (index === -1) {
    return { success: false, message: '点评不存在' };
  }
  
  const review = data.stageReviews[index];
  
  data.stageReviews[index] = {
    ...review,
    status: '已完成',
    updatedAt: new Date().toLocaleString('zh-CN'),
    confirmedBy: confirmerRole,
  };
  
  data.practiceRecords.forEach(record => {
    if (record.reviewId === reviewId) {
      record.status = '已完成';
      record.updatedAt = new Date().toLocaleString('zh-CN');
    }
  });
  
  await writeData(data);
  return { success: true, message: '确认成功' };
}

export async function getDashboardStats(role: Role): Promise<{
  todayPending: number;
  overdueCount: number;
  returnedCount: number;
  pendingReviews: number;
  waitingConfirm: number;
}> {
  const data = await readData();
  const today = new Date().toISOString().split('T')[0];
  
  const todayPending = data.practiceRecords.filter(r => 
    r.status === '待处理' && r.practiceDate === today
  ).length;
  
  const overdueCount = data.practiceRecords.filter(r => 
    r.status === '超时' || (r.status === '待处理' && r.practiceDate < today)
  ).length;
  
  const returnedCount = data.practiceRecords.filter(r => r.status === '已退回').length;
  
  const pendingReviews = data.stageReviews.filter(r => r.status === '待点评').length;
  
  const waitingConfirm = data.stageReviews.filter(r => r.status === '待确认').length;
  
  if (role === '教务老师') {
    return { todayPending, overdueCount, returnedCount, pendingReviews: 0, waitingConfirm: 0 };
  }
  
  if (role === '任课老师') {
    return { todayPending: 0, overdueCount: 0, returnedCount, pendingReviews, waitingConfirm: 0 };
  }
  
  return { todayPending: 0, overdueCount: 0, returnedCount: 0, pendingReviews: 0, waitingConfirm };
}

export async function getStudents(): Promise<Array<{
  id: string;
  name: string;
  age: number;
  instrument: string;
  level: string;
  parentPhone: string;
}>> {
  const data = await readData();
  return data.students;
}