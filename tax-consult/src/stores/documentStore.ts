import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DocumentChecklistItem, DocumentStatus, StatusChange, DocumentFilter, ResponsibleRole } from '../types';
import { genId } from '../utils/id';
import { nowISO } from '../utils/format';

interface DocumentState {
  items: DocumentChecklistItem[];
  filter: DocumentFilter;
  setFilter: (f: Partial<DocumentFilter>) => void;
  resetFilter: () => void;
  addItem: (data: Omit<DocumentChecklistItem, 'id' | 'status' | 'status_history' | 'submitted_at'>) => DocumentChecklistItem;
  addItems: (items: Omit<DocumentChecklistItem, 'id' | 'status' | 'status_history' | 'submitted_at'>[]) => DocumentChecklistItem[];
  changeStatus: (id: string, toStatus: DocumentStatus, changedBy: string, remark: string) => void;
  updateItem: (id: string, patch: Partial<DocumentChecklistItem>) => void;
  removeItem: (id: string) => void;
  getByConsultation: (consultationId: string) => DocumentChecklistItem[];
  getFiltered: () => DocumentChecklistItem[];
  getCompletionRate: (consultationId: string) => { total: number; confirmed: number; rate: number };
}

const DEFAULT_FILTER: DocumentFilter = {
  status: 'all',
  responsible_role: 'all',
  consultation_id: '',
  search: '',
};

const SEED_DOCS: DocumentChecklistItem[] = [
  {
    id: 'd1', consultation_id: 'c1', document_name: '营业执照副本', document_type: '基础资质',
    status: 'confirmed', responsible_role: 'client_finance', responsible_id: 's5',
    due_date: '2026-06-15', submitted_at: '2026-06-10T10:00:00.000Z',
    status_history: [
      { id: 'dh1', from_status: '', to_status: 'not_submitted', changed_by: 's3', changed_at: '2026-06-10T09:30:00.000Z', remark: '' },
      { id: 'dh2', from_status: 'not_submitted', to_status: 'submitted', changed_by: 's5', changed_at: '2026-06-10T10:00:00.000Z', remark: '' },
      { id: 'dh3', from_status: 'submitted', to_status: 'confirmed', changed_by: 's1', changed_at: '2026-06-10T11:00:00.000Z', remark: '' },
    ],
    remark: '',
  },
  {
    id: 'd2', consultation_id: 'c1', document_name: '企业所得税年度纳税申报表', document_type: '纳税申报',
    status: 'submitted', responsible_role: 'client_finance', responsible_id: 's5',
    due_date: '2026-06-15', submitted_at: '2026-06-11T14:00:00.000Z',
    status_history: [
      { id: 'dh4', from_status: '', to_status: 'not_submitted', changed_by: 's3', changed_at: '2026-06-10T09:30:00.000Z', remark: '' },
      { id: 'dh5', from_status: 'not_submitted', to_status: 'submitted', changed_by: 's5', changed_at: '2026-06-11T14:00:00.000Z', remark: '' },
    ],
    remark: '',
  },
  {
    id: 'd3', consultation_id: 'c1', document_name: '研发费用明细账', document_type: '专项资料',
    status: 'not_submitted', responsible_role: 'consultant', responsible_id: 's1',
    due_date: '2026-06-18', submitted_at: null,
    status_history: [
      { id: 'dh6', from_status: '', to_status: 'not_submitted', changed_by: 's3', changed_at: '2026-06-10T09:30:00.000Z', remark: '待顾问整理' },
    ],
    remark: '需要客户配合提供原始数据',
  },
  {
    id: 'd4', consultation_id: 'c2', document_name: '出口报关单', document_type: '退税资料',
    status: 'returned', responsible_role: 'client_finance', responsible_id: 's6',
    due_date: '2026-06-14', submitted_at: '2026-06-11T16:00:00.000Z',
    status_history: [
      { id: 'dh7', from_status: '', to_status: 'not_submitted', changed_by: 's4', changed_at: '2026-06-11T14:20:00.000Z', remark: '' },
      { id: 'dh8', from_status: 'not_submitted', to_status: 'submitted', changed_by: 's6', changed_at: '2026-06-11T16:00:00.000Z', remark: '' },
      { id: 'dh9', from_status: 'submitted', to_status: 'returned', changed_by: 's2', changed_at: '2026-06-12T10:00:00.000Z', remark: '报关单号不完整，需补充' },
    ],
    remark: '报关单缺失3月份记录',
  },
  {
    id: 'd5', consultation_id: 'c2', document_name: '增值税专用发票', document_type: '退税资料',
    status: 'submitted', responsible_role: 'client_finance', responsible_id: 's6',
    due_date: '2026-06-14', submitted_at: '2026-06-12T09:00:00.000Z',
    status_history: [
      { id: 'dh10', from_status: '', to_status: 'not_submitted', changed_by: 's4', changed_at: '2026-06-11T14:20:00.000Z', remark: '' },
      { id: 'dh11', from_status: 'not_submitted', to_status: 'submitted', changed_by: 's6', changed_at: '2026-06-12T09:00:00.000Z', remark: '' },
    ],
    remark: '',
  },
  {
    id: 'd6', consultation_id: 'c3', document_name: '近三年纳税申报表', document_type: '基础资质',
    status: 'submitted', responsible_role: 'client_finance', responsible_id: 's5',
    due_date: '2026-06-20', submitted_at: '2026-06-12T10:00:00.000Z',
    status_history: [
      { id: 'dh12', from_status: '', to_status: 'not_submitted', changed_by: 's3', changed_at: '2026-06-12T08:30:00.000Z', remark: '' },
      { id: 'dh13', from_status: 'not_submitted', to_status: 'submitted', changed_by: 's5', changed_at: '2026-06-12T10:00:00.000Z', remark: '' },
    ],
    remark: '',
  },
  {
    id: 'd7', consultation_id: 'c3', document_name: '集团架构图', document_type: '专项资料',
    status: 'not_submitted', responsible_role: 'project_manager', responsible_id: 's3',
    due_date: '2026-06-20', submitted_at: null,
    status_history: [
      { id: 'dh14', from_status: '', to_status: 'not_submitted', changed_by: 's3', changed_at: '2026-06-12T08:30:00.000Z', remark: '' },
    ],
    remark: '待项目经理绘制',
  },
];

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      items: SEED_DOCS,
      filter: { ...DEFAULT_FILTER },
      setFilter: (f) => set((st) => ({ filter: { ...st.filter, ...f } })),
      resetFilter: () => set({ filter: { ...DEFAULT_FILTER } }),
      addItem: (data) => {
        const now = nowISO();
        const item: DocumentChecklistItem = {
          ...data,
          id: genId('d'),
          status: 'not_submitted',
          submitted_at: null,
          status_history: [
            { id: genId('dh'), from_status: '', to_status: 'not_submitted', changed_by: data.responsible_id, changed_at: now, remark: '新建资料项' },
          ],
        };
        set((st) => ({ items: [...st.items, item] }));
        return item;
      },
      addItems: (list) => {
        const now = nowISO();
        const added: DocumentChecklistItem[] = list.map((data) => ({
          ...data,
          id: genId('d'),
          status: 'not_submitted' as DocumentStatus,
          submitted_at: null,
          status_history: [
            { id: genId('dh'), from_status: '', to_status: 'not_submitted', changed_by: data.responsible_id, changed_at: now, remark: '批量录入' },
          ],
        }));
        set((st) => ({ items: [...st.items, ...added] }));
        return added;
      },
      changeStatus: (id, toStatus, changedBy, remark) => {
        set((st) => ({
          items: st.items.map((item) => {
            if (item.id !== id) return item;
            const change: StatusChange = {
              id: genId('dh'),
              from_status: item.status,
              to_status: toStatus,
              changed_by: changedBy,
              changed_at: nowISO(),
              remark,
            };
            return {
              ...item,
              status: toStatus,
              status_history: [...item.status_history, change],
              submitted_at: toStatus === 'submitted' ? nowISO() : item.submitted_at,
            };
          }),
        }));
      },
      updateItem: (id, patch) => {
        set((st) => ({
          items: st.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
      },
      removeItem: (id) => {
        set((st) => ({ items: st.items.filter((i) => i.id !== id) }));
      },
      getByConsultation: (cid) => get().items.filter((i) => i.consultation_id === cid),
      getFiltered: () => {
        const { items, filter } = get();
        return items.filter((i) => {
          if (filter.status !== 'all' && i.status !== filter.status) return false;
          if (filter.responsible_role !== 'all' && i.responsible_role !== filter.responsible_role) return false;
          if (filter.consultation_id && i.consultation_id !== filter.consultation_id) return false;
          if (filter.search) {
            const s = filter.search.toLowerCase();
            if (!i.document_name.toLowerCase().includes(s) && !i.document_type.toLowerCase().includes(s)) return false;
          }
          return true;
        });
      },
      getCompletionRate: (cid) => {
        const docs = get().items.filter((i) => i.consultation_id === cid);
        const total = docs.length;
        const confirmed = docs.filter((d) => d.status === 'confirmed').length;
        return { total, confirmed, rate: total === 0 ? 0 : Math.round((confirmed / total) * 100) };
      },
    }),
    { name: 'tax-documents' }
  )
);
