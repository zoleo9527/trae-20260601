import { useState, useCallback } from 'react'
import type { User, LoanApplication, RiskData, CollectionRecord, QuotaSuggestion, WorkflowRecord, Status } from '@/types'
import { mockUsers, mockApplications, mockRiskData, mockCollectionRecords, mockQuotaSuggestions, mockWorkflowRecords } from '@/data/mockData'

export function useStore() {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0])
  const [applications, setApplications] = useState<LoanApplication[]>(mockApplications)
  const [riskData, setRiskData] = useState<RiskData[]>(mockRiskData)
  const [collectionRecords, setCollectionRecords] = useState<CollectionRecord[]>(mockCollectionRecords)
  const [quotaSuggestions, setQuotaSuggestions] = useState<QuotaSuggestion[]>(mockQuotaSuggestions)
  const [workflowRecords, setWorkflowRecords] = useState<WorkflowRecord[]>(mockWorkflowRecords)
  const [notifications, setNotifications] = useState<{ id: string; message: string; time: string }[]>([])

  const switchUser = useCallback((user: User) => {
    setCurrentUser(user)
  }, [])

  const updateApplicationStatus = useCallback((applicationId: string, newStatus: Status, note: string) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { ...app, status: newStatus } : app
    ))
    
    const application = applications.find(a => a.id === applicationId)
    if (application) {
      const actionMap: Record<Status, string> = {
        pending: '重新提交',
        under_review: '提交审核',
        approved: '批准贷款',
        rejected: '拒绝贷款',
        supplement: '要求补材料',
        urgent: '标记催办',
        completed: '完成',
      }
      
      const newWorkflow: WorkflowRecord = {
        id: `WF${Date.now()}`,
        applicationId,
        action: actionMap[newStatus],
        operator: currentUser.name,
        operateTime: new Date().toLocaleString('zh-CN'),
        note,
        statusBefore: application.status,
        statusAfter: newStatus,
      }
      setWorkflowRecords(prev => [newWorkflow, ...prev])
      
      addNotification(`申请 ${applicationId} 状态已更新为 ${newStatus}`)
    }
  }, [applications, currentUser])

  const addCollectionRecord = useCallback((record: Omit<CollectionRecord, 'id'>) => {
    const newRecord: CollectionRecord = {
      ...record,
      id: `COL${Date.now()}`,
    }
    setCollectionRecords(prev => [newRecord, ...prev])
    addNotification(`已添加催收记录，申请号: ${record.applicationId}`)
  }, [])

  const updateQuotaSuggestion = useCallback((quotaId: string, status: Status) => {
    setQuotaSuggestions(prev => prev.map(q => 
      q.id === quotaId ? { ...q, status } : q
    ))
    addNotification(`额度建议 ${quotaId} 状态已更新`)
  }, [])

  const addNotification = useCallback((message: string) => {
    const newNotification = {
      id: `NOTIFY${Date.now()}`,
      message,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 10))
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return {
    currentUser,
    applications,
    riskData,
    collectionRecords,
    quotaSuggestions,
    workflowRecords,
    notifications,
    switchUser,
    updateApplicationStatus,
    addCollectionRecord,
    updateQuotaSuggestion,
    dismissNotification,
  }
}
