import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConsultationRecord, ConsultationStatus, StatusChange, ConsultationFilter } from '../types';
import { genId, genCaseNumber } from '../utils/id';
import { nowISO } from '../utils/format';

interface ConsultationState {
  records: ConsultationRecord[];
  filter: ConsultationFilter;
  setFilter: (f: Partial<ConsultationFilter>) => void;
  resetFilter: () => void;
  addRecord: (data: Omit<ConsultationRecord, 'id' | 'case_number' | 'status' | 'status_history' | 'created_at' | 'updated_at'>) => ConsultationRecord;
  changeStatus: (id: string, toStatus: ConsultationStatus, changedBy: string, remark: string) => void;
  updateRecord: (id: string, patch: Partial<ConsultationRecord>) => void;
  getById: (id: string) => ConsultationRecord | undefined;
  getFiltered: () => ConsultationRecord[];
  batchAdd: (items: Omit<ConsultationRecord, 'id' | 'case_number' | 'status' | 'status_history' | 'created_at' | 'updated_at'>[]) => ConsultationRecord[];
}

const DEFAULT_FILTER: ConsultationFilter = {
  status: 'all',
  consultant_id: '',
  project_manager_id: '',
  client_finance_id: '',
  search: '',
  date_from: '',
  date_to: '',
};

const SEED_RECORDS: ConsultationRecord[] = [
  {
    id: 'c1',
    case_number: 'TX-20260610-1001',
    client_name: '华诚科技有限公司',
    client_contact: '刘洋',
    consultant_id: 's1',
    project_manager_id: 's3',
    client_finance_id: 's5',
    consultation_type: '企业所得税汇算清缴',
    description: '2025年度企业所得税汇算清缴咨询，涉及研发费用加计扣除',
    status: 'processing',
    status_history: [
      { id: 'h1', from_status: '', to_status: 'pending', changed_by: 's3', changed_at: '2026-06-10T09:00:00.000Z', remark: '客户来电咨询' },
      { id: 'h2', from_status: 'pending', to_status: 'accepted', changed_by: 's1', changed_at: '2026-06-10T09:30:00.000Z', remark: '受理并分配' },
      { id: 'h3', from_status: 'accepted', to_status: 'processing', changed_by: 's1', changed_at: '2026-06-10T10:00:00.000Z', remark: '开始处理' },
    ],
    created_at: '2026-06-10T09:00:00.000Z',
    updated_at: '2026-06-10T10:00:00.000Z',
    remark: '',
  },
  {
    id: 'c2',
    case_number: 'TX-20260611-2001',
    client_name: '盛达贸易集团',
    client_contact: '陈静',
    consultant_id: 's2',
    project_manager_id: 's4',
    client_finance_id: 's6',
    consultation_type: '增值税退税',
    description: '出口退税申请流程及资料准备',
    status: 'returned',
    status_history: [
      { id: 'h4', from_status: '', to_status: 'pending', changed_by: 's4', changed_at: '2026-06-11T14:00:00.000Z', remark: '提交咨询' },
      { id: 'h5', from_status: 'pending', to_status: 'accepted', changed_by: 's2', changed_at: '2026-06-11T14:20:00.000Z', remark: '受理' },
      { id: 'h6', from_status: 'accepted', to_status: 'processing', changed_by: 's2', changed_at: '2026-06-11T15:00:00.000Z', remark: '资料审核中' },
      { id: 'h7', from_status: 'processing', to_status: 'returned', changed_by: 's2', changed_at: '2026-06-12T10:00:00.000Z', remark: '客户资料不完整，退回补充' },
    ],
    created_at: '2026-06-11T14:00:00.000Z',
    updated_at: '2026-06-12T10:00:00.000Z',
    remark: '客户报关单缺失',
  },
  {
    id: 'c3',
    case_number: 'TX-20260612-3001',
    client_name: '明远制造有限公司',
    client_contact: '周磊',
    consultant_id: 's1',
    project_manager_id: 's3',
    client_finance_id: 's5',
    consultation_type: '税务筹划',
    description: '集团架构调整税务筹划方案',
    status: 'reviewing',
    status_history: [
      { id: 'h8', from_status: '', to_status: 'pending', changed_by: 's3', changed_at: '2026-06-12T08:00:00.000Z', remark: '新咨询' },
      { id: 'h9', from_status: 'pending', to_status: 'accepted', changed_by: 's1', changed_at: '2026-06-12T08:30:00.000Z', remark: '' },
      { id: 'h10', from_status: 'accepted', to_status: 'processing', changed_by: 's1', changed_at: '2026-06-12T09:00:00.000Z', remark: '' },
      { id: 'h11', from_status: 'processing', to_status: 'supplementary', changed_by: 's1', changed_at: '2026-06-12T14:00:00.000Z', remark: '需补录历史纳税数据' },
      { id: 'h12', from_status: 'supplementary', to_status: 'reviewing', changed_by: 's3', changed_at: '2026-06-13T09:00:00.000Z', remark: '补录完成，提交复核' },
    ],
    created_at: '2026-06-12T08:00:00.000Z',
    updated_at: '2026-06-13T09:00:00.000Z',
    remark: '',
  },
];

export const useConsultationStore = create<ConsultationState>()(
  persist(
    (set, get) => ({
      records: SEED_RECORDS,
      filter: { ...DEFAULT_FILTER },
      setFilter: (f) => set((st) => ({ filter: { ...st.filter, ...f } })),
      resetFilter: () => set({ filter: { ...DEFAULT_FILTER } }),
      addRecord: (data) => {
        const now = nowISO();
        const rec: ConsultationRecord = {
          ...data,
          id: genId('c'),
          case_number: genCaseNumber(),
          status: 'pending',
          status_history: [
            { id: genId('h'), from_status: '', to_status: 'pending', changed_by: data.project_manager_id, changed_at: now, remark: '新建咨询受理' },
          ],
          created_at: now,
          updated_at: now,
        };
        set((st) => ({ records: [...st.records, rec] }));
        return rec;
      },
      changeStatus: (id, toStatus, changedBy, remark) => {
        set((st) => ({
          records: st.records.map((r) => {
            if (r.id !== id) return r;
            const change: StatusChange = {
              id: genId('h'),
              from_status: r.status,
              to_status: toStatus,
              changed_by: changedBy,
              changed_at: nowISO(),
              remark,
            };
            return {
              ...r,
              status: toStatus,
              status_history: [...r.status_history, change],
              updated_at: nowISO(),
            };
          }),
        }));
      },
      updateRecord: (id, patch) => {
        set((st) => ({
          records: st.records.map((r) =>
            r.id === id ? { ...r, ...patch, updated_at: nowISO() } : r
          ),
        }));
      },
      getById: (id) => get().records.find((r) => r.id === id),
      getFiltered: () => {
        const { records, filter } = get();
        return records.filter((r) => {
          if (filter.status !== 'all' && r.status !== filter.status) return false;
          if (filter.consultant_id && r.consultant_id !== filter.consultant_id) return false;
          if (filter.project_manager_id && r.project_manager_id !== filter.project_manager_id) return false;
          if (filter.client_finance_id && r.client_finance_id !== filter.client_finance_id) return false;
          if (filter.search) {
            const s = filter.search.toLowerCase();
            const match =
              r.case_number.toLowerCase().includes(s) ||
              r.client_name.toLowerCase().includes(s) ||
              r.description.toLowerCase().includes(s) ||
              r.consultation_type.toLowerCase().includes(s);
            if (!match) return false;
          }
          if (filter.date_from && r.created_at < filter.date_from) return false;
          if (filter.date_to && r.created_at > filter.date_to + 'T23:59:59.999Z') return false;
          return true;
        });
      },
      batchAdd: (items) => {
        const added: ConsultationRecord[] = [];
        const now = nowISO();
        for (const data of items) {
          const rec: ConsultationRecord = {
            ...data,
            id: genId('c'),
            case_number: genCaseNumber(),
            status: 'pending',
            status_history: [
              { id: genId('h'), from_status: '', to_status: 'pending', changed_by: data.project_manager_id, changed_at: now, remark: '批量录入' },
            ],
            created_at: now,
            updated_at: now,
          };
          added.push(rec);
        }
        set((st) => ({ records: [...st.records, ...added] }));
        return added;
      },
    }),
    { name: 'tax-consultations' }
  )
);
