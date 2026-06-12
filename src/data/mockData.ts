import { Cattle, VeterinaryRecord, QuarantineRecord, ExceptionRecord, MilkingRecord, FeedingPlan } from '@/types';

export const cattleData: Cattle[] = [
  { id: 1, tagId: 'C001', name: '花花', birthDate: '2020-03-15', breed: '荷斯坦', weight: 650, status: 'healthy', createdAt: '2020-03-15 10:00:00' },
  { id: 2, tagId: 'C002', name: '大黑', birthDate: '2019-11-20', breed: '西门塔尔', weight: 720, status: 'quarantine', createdAt: '2019-11-20 08:00:00' },
  { id: 3, tagId: 'C003', name: '小白', birthDate: '2021-05-08', breed: '荷斯坦', weight: 580, status: 'healthy', createdAt: '2021-05-08 14:00:00' },
  { id: 4, tagId: 'C004', name: '壮壮', birthDate: '2018-09-10', breed: '夏洛莱', weight: 800, status: 'treatment', createdAt: '2018-09-10 09:00:00' },
  { id: 5, tagId: 'C005', name: '美美', birthDate: '2022-01-12', breed: '荷斯坦', weight: 520, status: 'healthy', createdAt: '2022-01-12 11:00:00' },
  { id: 6, tagId: 'C006', name: '乐乐', birthDate: '2021-08-25', breed: '荷斯坦', weight: 600, status: 'quarantine', createdAt: '2021-08-25 16:00:00' },
];

export const veterinaryData: VeterinaryRecord[] = [
  { id: 1, cattleId: 1, examDate: '2024-01-15', vetName: '李兽医', symptoms: '食欲不振，精神萎靡', diagnosis: '轻微消化不良', treatment: '口服益生菌', status: 'completed', createdAt: '2024-01-15 09:00:00', updatedAt: '2024-01-15 11:00:00', operator: '张三' },
  { id: 2, cattleId: 2, examDate: '2024-01-16', vetName: '王兽医', symptoms: '发烧40.5度，咳嗽', diagnosis: '疑似牛流感', treatment: '隔离观察+抗病毒治疗', status: 'pending', createdAt: '2024-01-16 10:00:00', updatedAt: '2024-01-16 10:00:00', operator: '李四' },
  { id: 3, cattleId: 3, examDate: '2024-01-17', vetName: '李兽医', symptoms: '乳房肿胀，乳汁异常', diagnosis: '乳腺炎', treatment: '抗生素治疗', status: 'rejected', rejectReason: '诊断不明确，需重新检查', createdAt: '2024-01-17 14:00:00', updatedAt: '2024-01-18 09:00:00', operator: '王五' },
  { id: 4, cattleId: 4, examDate: '2024-01-18', vetName: '王兽医', symptoms: '跛行，腿部肿胀', diagnosis: '关节炎症', treatment: '消炎止痛', status: 'completed', createdAt: '2024-01-18 08:00:00', updatedAt: '2024-01-18 16:00:00', operator: '张三' },
  { id: 5, cattleId: 5, examDate: '2024-01-19', vetName: '李兽医', symptoms: '腹泻，脱水', diagnosis: '肠道感染', treatment: '补液+抗生素', status: 'pending', createdAt: '2024-01-19 09:00:00', updatedAt: '2024-01-19 09:00:00', operator: '李四' },
  { id: 6, cattleId: 6, examDate: '2024-01-20', vetName: '王兽医', symptoms: '呼吸困难，流鼻涕', diagnosis: '呼吸道感染', treatment: '抗生素雾化治疗', status: 'processing', createdAt: '2024-01-20 11:00:00', updatedAt: '2024-01-20 11:00:00', operator: '王五' },
];

export const quarantineData: QuarantineRecord[] = [
  { id: 1, vetRecordId: 2, cattleId: 2, startDate: '2024-01-16', reason: '疑似牛流感，需隔离观察', status: 'quarantining', createdAt: '2024-01-16 10:30:00', updatedAt: '2024-01-16 10:30:00', operator: '李四' },
  { id: 2, vetRecordId: 3, cattleId: 3, startDate: '2024-01-17', reason: '乳腺炎，防止传染', status: 'pending', createdAt: '2024-01-17 14:30:00', updatedAt: '2024-01-17 14:30:00', operator: '王五' },
  { id: 3, vetRecordId: 6, cattleId: 6, startDate: '2024-01-20', reason: '呼吸道感染，需隔离治疗', status: 'quarantining', createdAt: '2024-01-20 11:30:00', updatedAt: '2024-01-20 11:30:00', operator: '王五' },
];

export const exceptionData: ExceptionRecord[] = [
  { id: 1, vetRecordId: 3, quarantineId: null, type: 'reject', description: '诊断不明确，需重新检查', action: '退回补录', createdAt: '2024-01-18 09:00:00', operator: '王五' },
  { id: 2, vetRecordId: 2, quarantineId: 1, type: 'warning', description: '隔离时间超过72小时', action: '提醒兽医复查', createdAt: '2024-01-19 10:00:00', operator: '李四' },
  { id: 3, vetRecordId: 5, quarantineId: null, type: 'warning', description: '待处理超过24小时', action: '尽快处理', createdAt: '2024-01-20 09:00:00', operator: '系统' },
];

export const milkingData: MilkingRecord[] = [
  { id: 1, cattleId: 1, milkingTime: '2024-01-20 06:00:00', amount: 28.5, quality: 'good', operator: '张三', createdAt: '2024-01-20 06:00:00' },
  { id: 2, cattleId: 3, milkingTime: '2024-01-20 06:30:00', amount: 25.2, quality: 'normal', operator: '李四', createdAt: '2024-01-20 06:30:00' },
  { id: 3, cattleId: 5, milkingTime: '2024-01-20 07:00:00', amount: 22.8, quality: 'good', operator: '王五', createdAt: '2024-01-20 07:00:00' },
];

export const feedingData: FeedingPlan[] = [
  { id: 1, cattleId: 1, feedType: '青贮饲料', amount: 25, feedingTime: '2024-01-20 08:00:00', status: 'completed', operator: '张三', createdAt: '2024-01-20 08:00:00' },
  { id: 2, cattleId: 3, feedType: '混合饲料', amount: 20, feedingTime: '2024-01-20 08:30:00', status: 'completed', operator: '李四', createdAt: '2024-01-20 08:30:00' },
  { id: 3, cattleId: 5, feedType: '青贮饲料', amount: 22, feedingTime: '2024-01-20 09:00:00', status: 'pending', operator: '王五', createdAt: '2024-01-20 09:00:00' },
];
