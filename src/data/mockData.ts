import type { Sow, Boar, BreedingPlan, BreedingRecord, FarrowingRecord, VaccineRecord, User, Notification } from '@/types'

export const mockUsers: User[] = [
  { id: 'u1', name: '张繁育', role: 'breeder', department: '繁育组' },
  { id: 'u2', name: '李兽医', role: 'veterinarian', department: '兽医室' },
  { id: 'u3', name: '王场长', role: 'manager', department: '场部' }
]

export const mockSows: Sow[] = [
  { id: 's1', earTag: 'SO001', breed: '大白猪', birthDate: '2021-03-15', parity: 5, status: 'pregnant', healthStatus: 'healthy', lastBreedingDate: '2024-01-10', expectedFarrowingDate: '2024-05-15', litterCount: 4, createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-01-10' },
  { id: 's2', earTag: 'SO002', breed: '长白猪', birthDate: '2021-05-20', parity: 4, status: 'lactating', healthStatus: 'healthy', lastBreedingDate: '2023-10-05', expectedFarrowingDate: '2024-02-10', litterCount: 3, createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-02-10' },
  { id: 's3', earTag: 'SO003', breed: '大白猪', birthDate: '2022-01-10', parity: 2, status: 'empty', healthStatus: 'healthy', litterCount: 2, createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-01-20' },
  { id: 's4', earTag: 'SO004', breed: '杜洛克', birthDate: '2021-08-25', parity: 3, status: 'empty', healthStatus: 'monitoring', litterCount: 3, createdBy: 'u1', updatedBy: 'u2', updatedAt: '2024-01-15' },
  { id: 's5', earTag: 'SO005', breed: '大白猪', birthDate: '2022-06-05', parity: 1, status: 'pregnant', healthStatus: 'healthy', lastBreedingDate: '2024-02-01', expectedFarrowingDate: '2024-06-08', litterCount: 1, createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-02-01' },
  { id: 's6', earTag: 'SO006', breed: '长白猪', birthDate: '2021-11-15', parity: 4, status: 'weaning', healthStatus: 'healthy', litterCount: 4, createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-02-20' },
  { id: 's7', earTag: 'SO007', breed: '大白猪', birthDate: '2020-09-10', parity: 6, status: 'culled', healthStatus: 'sick', litterCount: 5, createdBy: 'u1', updatedBy: 'u2', updatedAt: '2024-01-25' },
  { id: 's8', earTag: 'SO008', breed: '杜洛克', birthDate: '2022-03-20', parity: 2, status: 'empty', healthStatus: 'healthy', litterCount: 2, createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-02-18' }
]

export const mockBoars: Boar[] = [
  { id: 'b1', earTag: 'BO001', breed: '大白猪', birthDate: '2020-05-10', status: 'active', healthStatus: 'healthy', useCount: 45, lastUsedDate: '2024-02-20', createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-02-20' },
  { id: 'b2', earTag: 'BO002', breed: '杜洛克', birthDate: '2019-12-15', status: 'active', healthStatus: 'healthy', useCount: 62, lastUsedDate: '2024-02-19', createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-02-19' },
  { id: 'b3', earTag: 'BO003', breed: '长白猪', birthDate: '2021-01-20', status: 'rest', healthStatus: 'monitoring', useCount: 28, lastUsedDate: '2024-01-15', createdBy: 'u1', updatedBy: 'u2', updatedAt: '2024-01-15' },
  { id: 'b4', earTag: 'BO004', breed: '大白猪', birthDate: '2020-08-05', status: 'active', healthStatus: 'healthy', useCount: 38, lastUsedDate: '2024-02-18', createdBy: 'u1', updatedBy: 'u1', updatedAt: '2024-02-18' }
]

export const mockBreedingPlans: BreedingPlan[] = [
  { id: 'p1', sowId: 's3', boarId: 'b1', plannedDate: '2024-02-25', status: 'pending', type: 'natural', reason: '常规配种', createdAt: '2024-02-20', updatedAt: '2024-02-20' },
  { id: 'p2', sowId: 's4', boarId: 'b2', plannedDate: '2024-02-28', status: 'pending', type: 'artificial', reason: '品种改良', createdAt: '2024-02-20', updatedAt: '2024-02-20' },
  { id: 'p3', sowId: 's6', boarId: 'b1', plannedDate: '2024-03-05', status: 'pending', type: 'natural', reason: '常规配种', createdAt: '2024-02-20', updatedAt: '2024-02-20' },
  { id: 'p4', sowId: 's8', boarId: 'b4', plannedDate: '2024-02-22', status: 'completed', type: 'natural', reason: '常规配种', actualDate: '2024-02-22', operator: 'u1', createdAt: '2024-02-18', updatedAt: '2024-02-22' },
  { id: 'p5', sowId: 's1', boarId: 'b2', plannedDate: '2024-01-10', status: 'completed', type: 'artificial', reason: '品种改良', actualDate: '2024-01-10', operator: 'u1', createdAt: '2024-01-05', updatedAt: '2024-01-10' },
  { id: 'p6', sowId: 's5', boarId: 'b1', plannedDate: '2024-02-01', status: 'completed', type: 'natural', reason: '常规配种', actualDate: '2024-02-01', operator: 'u1', createdAt: '2024-01-28', updatedAt: '2024-02-01' },
  { id: 'p7', sowId: 's2', boarId: 'b3', plannedDate: '2023-10-05', status: 'completed', type: 'natural', reason: '常规配种', actualDate: '2023-10-05', operator: 'u1', createdAt: '2023-10-01', updatedAt: '2023-10-05' }
]

export const mockBreedingRecords: BreedingRecord[] = [
  { id: 'r1', planId: 'p5', sowId: 's1', boarId: 'b2', breedingDate: '2024-01-10', type: 'artificial', result: 'success', conceptionConfirmed: true, confirmedDate: '2024-01-25', operator: 'u1', createdAt: '2024-01-10' },
  { id: 'r2', planId: 'p6', sowId: 's5', boarId: 'b1', breedingDate: '2024-02-01', type: 'natural', result: 'success', conceptionConfirmed: false, operator: 'u1', notes: '待确认受孕', createdAt: '2024-02-01' },
  { id: 'r3', planId: 'p4', sowId: 's8', boarId: 'b4', breedingDate: '2024-02-22', type: 'natural', result: 'pending', conceptionConfirmed: false, operator: 'u1', createdAt: '2024-02-22' },
  { id: 'r4', planId: 'p7', sowId: 's2', boarId: 'b3', breedingDate: '2023-10-05', type: 'natural', result: 'success', conceptionConfirmed: true, confirmedDate: '2023-10-20', operator: 'u1', createdAt: '2023-10-05' }
]

export const mockFarrowingRecords: FarrowingRecord[] = [
  { id: 'f1', sowId: 's2', planId: 'p7', farrowingDate: '2024-02-10', totalPigs: 12, livePigs: 10, deadPigs: 1, stillborn: 1, operator: 'u1', createdAt: '2024-02-10' },
  { id: 'f2', sowId: 's1', planId: 'p5', farrowingDate: '2024-05-15', totalPigs: 10, livePigs: 9, deadPigs: 0, stillborn: 1, operator: 'u1', notes: '顺产', createdAt: '2024-05-15' }
]

export const mockVaccineRecords: VaccineRecord[] = [
  { id: 'v1', animalId: 's1', animalType: 'sow', vaccineName: '猪瘟疫苗', dose: 2, unit: 'ml', injectionDate: '2024-01-05', nextDueDate: '2024-07-05', operator: 'u2', createdAt: '2024-01-05' },
  { id: 'v2', animalId: 's2', animalType: 'sow', vaccineName: '伪狂犬疫苗', dose: 1, unit: '头份', injectionDate: '2024-02-10', nextDueDate: '2024-08-10', operator: 'u2', createdAt: '2024-02-10' },
  { id: 'v3', animalId: 'b1', animalType: 'boar', vaccineName: '猪瘟疫苗', dose: 2, unit: 'ml', injectionDate: '2024-01-10', nextDueDate: '2024-07-10', operator: 'u2', createdAt: '2024-01-10' },
  { id: 'v4', animalId: 's4', animalType: 'sow', vaccineName: '圆环病毒疫苗', dose: 1, unit: '头份', injectionDate: '2024-01-15', operator: 'u2', notes: '健康监测中', createdAt: '2024-01-15' },
  { id: 'v5', animalId: 's3', animalType: 'sow', vaccineName: '口蹄疫疫苗', dose: 2, unit: 'ml', injectionDate: '2024-02-18', nextDueDate: '2024-08-18', operator: 'u2', createdAt: '2024-02-18' }
]

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'warning', title: '配种计划即将到期', message: 'SO003 母猪的配种计划将于2024-02-25执行，请提前准备', targetRole: 'breeder', read: false, createdAt: '2024-02-20', relatedId: 'p1' },
  { id: 'n2', type: 'info', title: '疫苗接种提醒', message: 'SO001 母猪的猪瘟疫苗将于2024-07-05到期，请安排接种', targetRole: 'veterinarian', read: false, createdAt: '2024-02-20', relatedId: 'v1' },
  { id: 'n3', type: 'success', title: '配种完成', message: 'SO008 母猪已完成配种，请跟踪受孕情况', targetRole: 'manager', read: true, createdAt: '2024-02-22', relatedId: 'p4' },
  { id: 'n4', type: 'warning', title: '母猪状态变更', message: 'SO007 母猪因健康原因已被淘汰', targetRole: 'all', read: false, createdAt: '2024-01-25', relatedId: 's7' }
]