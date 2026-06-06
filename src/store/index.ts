import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Animal,
  MedicalRecord,
  HistoryRecord,
  FollowUpRecord,
  RescueStatus,
  MedicalStatus,
  Role,
  AppState,
  AppActions,
} from '@/types';
import { isToday, isBefore, startOfDay, parseISO } from 'date-fns';

const generateId = () => Math.random().toString(36).substring(2, 11);

const getDemoAnimals = (): Animal[] => [
  {
    id: 'animal-001',
    name: '小黄',
    species: '犬',
    breed: '中华田园犬',
    age: '约2岁',
    gender: '公',
    weight: '12kg',
    color: '黄色',
    description: '右后腿受伤，性格温顺，已驱虫',
    foundLocation: '朝阳区建国路88号附近',
    foundDate: '2026-06-04',
    rescuerName: '张志愿',
    rescuerPhone: '138****1234',
    status: RescueStatus.TREATING,
    medicalStatus: MedicalStatus.TREATING,
    currentLocation: '合作宠物医院（望京店）',
    createdAt: '2026-06-04T10:30:00.000Z',
    updatedAt: '2026-06-05T14:20:00.000Z',
  },
  {
    id: 'animal-002',
    name: '小白',
    species: '猫',
    breed: '英短混',
    age: '约6个月',
    gender: '母',
    weight: '2.5kg',
    color: '白色',
    description: '猫瘟刚痊愈，需要隔离观察，非常亲人',
    foundLocation: '海淀区中关村地铁站出口',
    foundDate: '2026-06-03',
    rescuerName: '李爱心',
    rescuerPhone: '139****5678',
    status: RescueStatus.FOSTERING,
    medicalStatus: MedicalStatus.RECOVERED,
    currentLocation: '王女士家（寄养）',
    fostererName: '王女士',
    fostererPhone: '136****9012',
    createdAt: '2026-06-03T15:45:00.000Z',
    updatedAt: '2026-06-05T09:10:00.000Z',
  },
  {
    id: 'animal-003',
    name: '未命名-0606',
    species: '猫',
    breed: '橘猫',
    age: '约3个月',
    gender: '公',
    color: '橘色',
    description: '流浪幼猫，疑似营养不良，需先体检',
    foundLocation: '西城区西单北大街',
    foundDate: '2026-06-06',
    rescuerName: '赵救助',
    rescuerPhone: '137****3456',
    status: RescueStatus.PENDING,
    medicalStatus: MedicalStatus.NOT_ASSESSED,
    currentLocation: '救助站临时安置点',
    createdAt: '2026-06-06T08:00:00.000Z',
    updatedAt: '2026-06-06T08:00:00.000Z',
  },
  {
    id: 'animal-004',
    name: '大橘',
    species: '猫',
    breed: '橘猫',
    age: '约3岁',
    gender: '公',
    weight: '5.5kg',
    color: '橘白',
    description: '已绝育，性格好，适合家庭领养',
    foundLocation: '东城区东四胡同',
    foundDate: '2026-05-20',
    rescuerName: '陈女士',
    rescuerPhone: '135****7890',
    status: RescueStatus.READY_FOR_ADOPTION,
    medicalStatus: MedicalStatus.RECOVERED,
    currentLocation: '救助站',
    createdAt: '2026-05-20T11:00:00.000Z',
    updatedAt: '2026-06-02T16:30:00.000Z',
  },
  {
    id: 'animal-005',
    name: '黑豆',
    species: '犬',
    breed: '拉布拉多混',
    age: '约1岁',
    gender: '公',
    weight: '20kg',
    color: '黑色',
    description: '皮肤问题正在治疗中，活泼好动',
    foundLocation: '丰台区南三环西路',
    foundDate: '2026-06-01',
    rescuerName: '周先生',
    rescuerPhone: '134****2345',
    status: RescueStatus.TREATING,
    medicalStatus: MedicalStatus.TREATING,
    currentLocation: '合作宠物医院（丰台店）',
    createdAt: '2026-06-01T09:20:00.000Z',
    updatedAt: '2026-06-05T11:00:00.000Z',
  },
  {
    id: 'animal-006',
    name: '花花',
    species: '猫',
    breed: '三花猫',
    age: '约1岁',
    gender: '母',
    weight: '3.2kg',
    color: '三花',
    description: '已绝育，免疫已做，已被领养',
    foundLocation: '通州区新华大街',
    foundDate: '2026-05-15',
    rescuerName: '吴阿姨',
    rescuerPhone: '133****6789',
    status: RescueStatus.ADOPTED,
    medicalStatus: MedicalStatus.RECOVERED,
    currentLocation: '刘先生家（已领养）',
    adopterName: '刘先生',
    adopterPhone: '132****0123',
    adoptionDate: '2026-06-01',
    createdAt: '2026-05-15T14:30:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'animal-007',
    name: '未命名-0605',
    species: '犬',
    breed: '小型串串',
    age: '约1个月',
    gender: '母',
    color: '花色',
    description: '刚出生不久的奶狗，被遗弃在纸箱里',
    foundLocation: '昌平区回龙观地铁站',
    foundDate: '2026-06-05',
    rescuerName: '孙同学',
    rescuerPhone: '131****4567',
    status: RescueStatus.REGISTERED,
    medicalStatus: MedicalStatus.NOT_ASSESSED,
    currentLocation: '救助站临时安置点',
    createdAt: '2026-06-05T17:30:00.000Z',
    updatedAt: '2026-06-05T17:30:00.000Z',
  },
];

const getDemoMedicalRecords = (): MedicalRecord[] => [
  {
    id: 'med-001',
    animalId: 'animal-001',
    type: 'ASSESSMENT',
    title: '初步检查评估',
    description: '右后腿骨折，需要手术固定',
    diagnosis: '右后腿胫骨骨折，轻微脱水',
    prescription: '止痛药、消炎药，术前准备',
    cost: 580,
    veterinarian: '王医生',
    date: '2026-06-04',
    nextFollowUp: '2026-06-07',
    createdAt: '2026-06-04T11:00:00.000Z',
  },
  {
    id: 'med-002',
    animalId: 'animal-001',
    type: 'TREATMENT',
    title: '骨折内固定手术',
    description: '已完成骨折修复手术，恢复良好',
    diagnosis: '术后观察',
    prescription: '抗生素7天，止痛药3天',
    cost: 3500,
    veterinarian: '李医生',
    date: '2026-06-05',
    nextFollowUp: '2026-06-12',
    createdAt: '2026-06-05T15:30:00.000Z',
  },
  {
    id: 'med-003',
    animalId: 'animal-002',
    type: 'TREATMENT',
    title: '猫瘟治疗',
    description: '治疗第7天，症状明显好转',
    diagnosis: '猫瘟热，恢复期',
    prescription: '干扰素、补液、营养补充',
    cost: 2800,
    veterinarian: '张医生',
    date: '2026-06-05',
    nextFollowUp: '2026-06-08',
    createdAt: '2026-06-05T10:00:00.000Z',
  },
  {
    id: 'med-004',
    animalId: 'animal-005',
    type: 'ASSESSMENT',
    title: '皮肤病检查',
    description: '全身多处脱毛、结痂，疑似真菌感染',
    diagnosis: '真菌性皮肤病+耳螨',
    prescription: '药浴每周2次，耳漂每日清洁',
    cost: 320,
    veterinarian: '王医生',
    date: '2026-06-02',
    nextFollowUp: '2026-06-09',
    createdAt: '2026-06-02T14:00:00.000Z',
  },
  {
    id: 'med-005',
    animalId: 'animal-005',
    type: 'FOLLOW_UP',
    title: '第一次复诊',
    description: '皮肤状况有所改善，继续治疗',
    diagnosis: '恢复中',
    prescription: '继续药浴，外用药膏',
    cost: 150,
    veterinarian: '李医生',
    date: '2026-06-05',
    nextFollowUp: '2026-06-12',
    createdAt: '2026-06-05T11:30:00.000Z',
  },
  {
    id: 'med-006',
    animalId: 'animal-004',
    type: 'VACCINATION',
    title: '疫苗接种',
    description: '猫三联第一针',
    prescription: '无',
    cost: 120,
    veterinarian: '张医生',
    date: '2026-06-02',
    nextFollowUp: '2026-06-23',
    createdAt: '2026-06-02T10:00:00.000Z',
  },
];

const getDemoHistoryRecords = (): HistoryRecord[] => [
  {
    id: 'hist-001',
    animalId: 'animal-001',
    action: '登记救助',
    note: '张志愿在建国路发现受伤流浪狗，送至医院',
    operator: '张志愿',
    role: Role.VOLUNTEER,
    timestamp: '2026-06-04T10:30:00.000Z',
  },
  {
    id: 'hist-002',
    animalId: 'animal-001',
    action: '医疗评估',
    fromStatus: RescueStatus.PENDING,
    toStatus: RescueStatus.TREATING,
    note: '右后腿骨折，安排手术治疗',
    operator: '王医生',
    role: Role.VET,
    timestamp: '2026-06-04T11:00:00.000Z',
  },
  {
    id: 'hist-003',
    animalId: 'animal-002',
    action: '登记救助',
    note: '中关村地铁站发现病猫，猫瘟阳性',
    operator: '李爱心',
    role: Role.VOLUNTEER,
    timestamp: '2026-06-03T15:45:00.000Z',
  },
  {
    id: 'hist-004',
    animalId: 'animal-002',
    action: '开始治疗',
    fromStatus: RescueStatus.PENDING,
    toStatus: RescueStatus.TREATING,
    note: '猫瘟治疗方案确定，住院治疗',
    operator: '张医生',
    role: Role.VET,
    timestamp: '2026-06-03T16:30:00.000Z',
  },
  {
    id: 'hist-005',
    animalId: 'animal-002',
    action: '转寄养',
    fromStatus: RescueStatus.TREATING,
    toStatus: RescueStatus.FOSTERING,
    note: '猫瘟痊愈，转王女士家寄养康复',
    operator: '李爱心',
    role: Role.VOLUNTEER,
    timestamp: '2026-06-05T09:10:00.000Z',
  },
  {
    id: 'hist-006',
    animalId: 'animal-006',
    action: '领养登记',
    fromStatus: RescueStatus.READY_FOR_ADOPTION,
    toStatus: RescueStatus.ADOPTED,
    note: '刘先生通过领养审核，已接回家',
    operator: '赵审核',
    role: Role.ADOPTION_REVIEWER,
    timestamp: '2026-06-01T10:00:00.000Z',
  },
];

const getDemoFollowUps = (): FollowUpRecord[] => [
  {
    id: 'fu-001',
    animalId: 'animal-006',
    date: '2026-06-06',
    content: '花花领养后一周回访，确认适应情况',
    operator: '赵审核',
    isCompleted: false,
    nextDate: '2026-06-13',
  },
  {
    id: 'fu-002',
    animalId: 'animal-001',
    date: '2026-06-07',
    content: '小黄术后第三天复查',
    operator: '王医生',
    isCompleted: false,
  },
  {
    id: 'fu-003',
    animalId: 'animal-002',
    date: '2026-06-08',
    content: '小白寄养适应情况回访',
    operator: '李爱心',
    isCompleted: false,
  },
];

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      animals: getDemoAnimals(),
      medicalRecords: getDemoMedicalRecords(),
      historyRecords: getDemoHistoryRecords(),
      followUps: getDemoFollowUps(),
      currentRole: Role.VOLUNTEER,
      currentUser: '当前用户',

      setRole: (role) => set({ currentRole: role }),

      addAnimal: (animal) => {
        const newAnimal: Animal = {
          ...animal,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ animals: [newAnimal, ...state.animals] }));
        get().addHistoryRecord({
          animalId: newAnimal.id,
          action: '登记救助',
          note: animal.description || '新救助动物登记',
          operator: get().currentUser,
          role: get().currentRole,
          timestamp: new Date().toISOString(),
        });
        return newAnimal;
      },

      updateAnimal: (id, updates) => {
        set((state) => ({
          animals: state.animals.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },

      updateAnimalStatus: (id, status, note, extraData) => {
        const animal = get().animals.find((a) => a.id === id);
        if (animal) {
          const updates: Partial<Animal> = { status };

          if (status === RescueStatus.FOSTERING && extraData) {
            if (extraData.fostererName) updates.fostererName = extraData.fostererName;
            if (extraData.fostererPhone) updates.fostererPhone = extraData.fostererPhone;
          }

          if (status === RescueStatus.ADOPTED && extraData) {
            if (extraData.adopterName) updates.adopterName = extraData.adopterName;
            if (extraData.adopterPhone) updates.adopterPhone = extraData.adopterPhone;
            if (extraData.adoptionDate) updates.adoptionDate = extraData.adoptionDate;
          }

          if (status === RescueStatus.RETURNED && extraData?.returnReason) {
            updates.adopterName = undefined;
            updates.adopterPhone = undefined;
            updates.adoptionDate = undefined;
          }

          get().updateAnimal(id, updates);

          let fullNote = note;
          if (extraData) {
            const details: string[] = [];
            if (extraData.fostererName) details.push(`寄养人: ${extraData.fostererName}`);
            if (extraData.fostererPhone) details.push(`电话: ${extraData.fostererPhone}`);
            if (extraData.adopterName) details.push(`领养人: ${extraData.adopterName}`);
            if (extraData.adopterPhone) details.push(`电话: ${extraData.adopterPhone}`);
            if (extraData.returnReason) details.push(`退回原因: ${extraData.returnReason}`);
            if (extraData.closeReason) details.push(`关闭原因: ${extraData.closeReason}`);
            if (details.length > 0) {
              fullNote = note + ' (' + details.join(', ') + ')';
            }
          }

          get().addHistoryRecord({
            animalId: id,
            action: '状态变更',
            fromStatus: animal.status,
            toStatus: status,
            note: fullNote,
            operator: get().currentUser,
            role: get().currentRole,
            timestamp: new Date().toISOString(),
          });

          if (extraData?.followUpDate && extraData?.followUpContent) {
            get().addFollowUp({
              animalId: id,
              date: extraData.followUpDate,
              content: extraData.followUpContent,
              operator: get().currentUser,
              isCompleted: false,
              nextDate: undefined,
            });
          }
        }
      },

      addMedicalRecord: (record) => {
        const newRecord: MedicalRecord = {
          ...record,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ medicalRecords: [newRecord, ...state.medicalRecords] }));
        get().addHistoryRecord({
          animalId: record.animalId,
          action: record.type === 'ASSESSMENT' ? '医疗评估' : record.type === 'TREATMENT' ? '治疗记录' : '回访记录',
          note: record.title,
          operator: record.veterinarian,
          role: Role.VET,
          timestamp: new Date().toISOString(),
        });
        return newRecord;
      },

      addHistoryRecord: (record) => {
        const newRecord: HistoryRecord = {
          ...record,
          id: generateId(),
        };
        set((state) => ({ historyRecords: [newRecord, ...state.historyRecords] }));
      },

      addFollowUp: (followUp) => {
        const newFollowUp: FollowUpRecord = {
          ...followUp,
          id: generateId(),
        };
        set((state) => ({ followUps: [newFollowUp, ...state.followUps] }));
        return newFollowUp;
      },

      completeFollowUp: (id, content) => {
        const followUp = get().followUps.find((f) => f.id === id);
        set((state) => ({
          followUps: state.followUps.map((f) =>
            f.id === id ? { ...f, isCompleted: true, completedAt: new Date().toISOString() } : f
          ),
        }));
        if (followUp) {
          get().addHistoryRecord({
            animalId: followUp.animalId,
            action: '回访完成',
            note: followUp.content + ' → 完成说明：' + content,
            operator: get().currentUser,
            role: get().currentRole,
            timestamp: new Date().toISOString(),
          });
        }
      },

      backupData: () => {
        const data = {
          animals: get().animals,
          medicalRecords: get().medicalRecords,
          historyRecords: get().historyRecords,
          followUps: get().followUps,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        };
        return JSON.stringify(data, null, 2);
      },

      restoreData: (dataString) => {
        try {
          const data = JSON.parse(dataString);
          if (data.animals && data.medicalRecords && data.historyRecords) {
            set({
              animals: data.animals,
              medicalRecords: data.medicalRecords,
              historyRecords: data.historyRecords,
              followUps: data.followUps || [],
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      resetDemoData: () => {
        set({
          animals: getDemoAnimals(),
          medicalRecords: getDemoMedicalRecords(),
          historyRecords: getDemoHistoryRecords(),
          followUps: getDemoFollowUps(),
        });
      },

      getTodayTasks: () => {
        const { animals, followUps } = get();
        const today = startOfDay(new Date());
        return {
          pendingRescue: animals.filter(
            (a) => a.status === RescueStatus.PENDING || a.status === RescueStatus.REGISTERED
          ),
          pendingMedical: animals.filter(
            (a) => a.medicalStatus === MedicalStatus.NOT_ASSESSED && a.status !== RescueStatus.CLOSED
          ),
          followUpsDue: followUps.filter(
            (f) => !f.isCompleted && (isBefore(startOfDay(parseISO(f.date)), today) || isToday(parseISO(f.date)))
          ),
        };
      },
    }),
    {
      name: 'animal-rescue-station-storage',
    }
  )
);

export { RescueStatus, MedicalStatus, Role };
export type { Animal, MedicalRecord, HistoryRecord, FollowUpRecord };
