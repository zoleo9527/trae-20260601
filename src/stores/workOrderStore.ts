import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkOrder, FilterParams, PolicyJudgment, Approval, SignReceipt } from '../types';
import { mockWorkOrders } from '../data/mockData';

interface WorkOrderState {
  workOrders: WorkOrder[];
  currentWorkOrder: WorkOrder | null;
  filters: FilterParams;
  loading: boolean;
  draftPolicyJudgments: Record<string, Partial<PolicyJudgment>>;
  
  fetchWorkOrders: () => void;
  getWorkOrderById: (id: string) => WorkOrder | null;
  setCurrentWorkOrder: (workOrder: WorkOrder | null) => void;
  startPolicyJudge: (id: string, userName: string) => void;
  submitPolicyJudgment: (id: string, judgment: PolicyJudgment) => void;
  saveDraft: (id: string, draft: Partial<PolicyJudgment>) => void;
  getDraft: (id: string) => Partial<PolicyJudgment> | null;
  clearDraft: (id: string) => void;
  submitApproval: (id: string, approval: Approval) => void;
  submitSignReceipt: (id: string, receipt: SignReceipt) => void;
  completeProcess: (id: string) => void;
  setFilters: (filters: FilterParams) => void;
  getFilteredWorkOrders: () => WorkOrder[];
  getWorkOrdersByStatus: (statuses: string[]) => WorkOrder[];
  getNextWorkOrder: (currentId: string, statuses?: string[]) => WorkOrder | null;
  getPrevWorkOrder: (currentId: string, statuses?: string[]) => WorkOrder | null;
}

export const useWorkOrderStore = create<WorkOrderState>()(
  persist(
    (set, get) => ({
      workOrders: mockWorkOrders,
      currentWorkOrder: null,
      filters: {},
      loading: false,
      draftPolicyJudgments: {},
      
      fetchWorkOrders: () => {
        set({ loading: true });
        setTimeout(() => {
          set({ loading: false });
        }, 500);
      },
      
      getWorkOrderById: (id: string) => {
        return get().workOrders.find(wo => wo.id === id) || null;
      },
      
      setCurrentWorkOrder: (workOrder: WorkOrder | null) => {
        set({ currentWorkOrder: workOrder });
      },
      
      startPolicyJudge: (id: string, userName: string) => {
        set(state => ({
          workOrders: state.workOrders.map(wo => {
            if (wo.id === id && wo.status === '待判断') {
              return {
                ...wo,
                status: '判断中' as const,
                updatedAt: new Date().toISOString(),
                historyRemarks: [
                  ...wo.historyRemarks,
                  {
                    id: `remark-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    operator: userName,
                    role: '税务顾问',
                    action: '开始政策判断',
                    detail: '税务顾问开始处理政策判断'
                  }
                ]
              };
            }
            return wo;
          })
        }));
      },
      
      submitPolicyJudgment: (id: string, judgment: PolicyJudgment) => {
        set(state => ({
          workOrders: state.workOrders.map(wo => {
            if (wo.id === id) {
              return {
                ...wo,
                policyJudgment: judgment,
                status: '待审批' as const,
                updatedAt: new Date().toISOString(),
                historyRemarks: [
                  ...wo.historyRemarks,
                  {
                    id: `remark-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    operator: judgment.judgedBy,
                    role: '税务顾问',
                    action: '完成政策判断',
                    detail: `判断依据：${judgment.judgmentBasis}\n政策引用：${judgment.policyReference}\n风险提示：${judgment.riskWarning}\n处理意见：${judgment.handlingSuggestion}`
                  }
                ]
              };
            }
            return wo;
          })
        }));
      },
      
      saveDraft: (id: string, draft: Partial<PolicyJudgment>) => {
        set(state => ({
          draftPolicyJudgments: {
            ...state.draftPolicyJudgments,
            [id]: draft
          }
        }));
      },
      
      getDraft: (id: string) => {
        return get().draftPolicyJudgments[id] || null;
      },
      
      clearDraft: (id: string) => {
        set(state => {
          const newDrafts = { ...state.draftPolicyJudgments };
          delete newDrafts[id];
          return { draftPolicyJudgments: newDrafts };
        });
      },
      
      submitApproval: (id: string, approval: Approval) => {
        set(state => ({
          workOrders: state.workOrders.map(wo => {
            if (wo.id === id) {
              const newStatus = approval.approvalResult === '通过' ? '审批通过' as const : '审批驳回' as const;
              return {
                ...wo,
                approval,
                status: newStatus,
                updatedAt: new Date().toISOString(),
                historyRemarks: [
                  ...wo.historyRemarks,
                  {
                    id: `remark-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    operator: approval.approvedBy,
                    role: '项目经理',
                    action: approval.approvalResult === '通过' ? '审批通过' : '审批驳回',
                    detail: approval.approvalResult === '通过' 
                      ? `审批意见：${approval.approvalOpinion}`
                      : `驳回原因：${approval.rejectReason}`
                  }
                ]
              };
            }
            return wo;
          })
        }));
      },
      
      submitSignReceipt: (id: string, receipt: SignReceipt) => {
        set(state => ({
          workOrders: state.workOrders.map(wo => {
            if (wo.id === id) {
              return {
                ...wo,
                signReceipt: receipt,
                status: '已签收' as const,
                updatedAt: new Date().toISOString(),
                historyRemarks: [
                  ...wo.historyRemarks,
                  {
                    id: `remark-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    operator: receipt.receivedBy,
                    role: '客户财务',
                    action: '确认签收',
                    detail: `签收确认：${receipt.receiptConfirm}\n签收备注：${receipt.receiptRemark}`
                  }
                ]
              };
            }
            return wo;
          })
        }));
      },
      
      completeProcess: (id: string) => {
        set(state => ({
          workOrders: state.workOrders.map(wo => {
            if (wo.id === id && wo.status === '已签收') {
              return {
                ...wo,
                status: '处理完成' as const,
                updatedAt: new Date().toISOString(),
                historyRemarks: [
                  ...wo.historyRemarks,
                  {
                    id: `remark-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    operator: '系统',
                    role: '系统',
                    action: '处理完成',
                    detail: '工单处理流程已完成'
                  }
                ]
              };
            }
            return wo;
          })
        }));
      },
      
      setFilters: (filters: FilterParams) => {
        set({ filters });
      },
      
      getFilteredWorkOrders: () => {
        const { workOrders, filters } = get();
        let filtered = [...workOrders];
        
        if (filters.status && filters.status.length > 0) {
          filtered = filtered.filter(wo => filters.status!.includes(wo.status));
        }
        
        if (filters.businessType) {
          filtered = filtered.filter(wo => wo.businessType === filters.businessType);
        }
        
        if (filters.urgencyLevel) {
          filtered = filtered.filter(wo => wo.urgencyLevel === filters.urgencyLevel);
        }
        
        if (filters.keyword) {
          const keyword = filters.keyword.toLowerCase();
          filtered = filtered.filter(wo => 
            wo.orderNo.toLowerCase().includes(keyword) ||
            wo.customerName.toLowerCase().includes(keyword)
          );
        }
        
        return filtered;
      },
      
      getWorkOrdersByStatus: (statuses: string[]) => {
        const { workOrders } = get();
        return workOrders.filter(wo => statuses.includes(wo.status));
      },
      
      getNextWorkOrder: (currentId: string, statuses?: string[]) => {
        const filtered = statuses 
          ? get().getWorkOrdersByStatus(statuses)
          : get().getFilteredWorkOrders();
        const currentIndex = filtered.findIndex(wo => wo.id === currentId);
        if (currentIndex < filtered.length - 1) {
          return filtered[currentIndex + 1];
        }
        return null;
      },
      
      getPrevWorkOrder: (currentId: string, statuses?: string[]) => {
        const filtered = statuses 
          ? get().getWorkOrdersByStatus(statuses)
          : get().getFilteredWorkOrders();
        const currentIndex = filtered.findIndex(wo => wo.id === currentId);
        if (currentIndex > 0) {
          return filtered[currentIndex - 1];
        }
        return null;
      }
    }),
    {
      name: 'workorder-storage'
    }
  )
);
