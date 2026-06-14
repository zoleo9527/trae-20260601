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
        returned: '退回申请',
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
    const quota = quotaSuggestions.find(q => q.id === quotaId)
    if (!quota) return

    setQuotaSuggestions(prev => prev.map(q => 
      q.id === quotaId ? { ...q, status } : q
    ))

    let relatedAction = ''
    let applicationStatusUpdate: Status | null = null

    switch (status) {
      case 'approved':
        relatedAction = '批准额度建议'
        applicationStatusUpdate = 'approved'
        break
      case 'rejected':
        relatedAction = '拒绝额度建议'
        applicationStatusUpdate = 'rejected'
        break
      case 'returned':
        relatedAction = '退回额度建议'
        applicationStatusUpdate = 'returned'
        break
      case 'completed':
        relatedAction = '完成额度建议'
        applicationStatusUpdate = 'completed'
        break
      default:
        relatedAction = '更新额度建议状态'
    }

    const newWorkflow: WorkflowRecord = {
      id: `WF${Date.now()}`,
      applicationId: quota.applicationId,
      action: relatedAction,
      operator: currentUser.name,
      operateTime: new Date().toLocaleString('zh-CN'),
      note: `额度建议 ${quotaId} ${status}`,
      statusBefore: quota.status,
      statusAfter: status,
    }
    setWorkflowRecords(prev => [newWorkflow, ...prev])

    if (applicationStatusUpdate) {
      setApplications(prev => prev.map(app => 
        app.id === quota.applicationId ? { ...app, status: applicationStatusUpdate } : app
      ))
      
      const application = applications.find(a => a.id === quota.applicationId)
      if (application) {
        const appWorkflow: WorkflowRecord = {
          id: `WF${Date.now()}`,
          applicationId: quota.applicationId,
          action: applicationStatusUpdate === 'approved' ? '批准贷款' : applicationStatusUpdate === 'rejected' ? '拒绝贷款' : applicationStatusUpdate === 'returned' ? '退回申请' : '完成申请',
          operator: currentUser.name,
          operateTime: new Date().toLocaleString('zh-CN'),
          note: `关联额度建议 ${quotaId} ${status}`,
          statusBefore: application.status,
          statusAfter: applicationStatusUpdate,
        }
        setWorkflowRecords(prev => [appWorkflow, ...prev])
      }
    }

    addNotification(`额度建议 ${quotaId} 状态已更新为 ${status}`)
  }, [quotaSuggestions, applications, currentUser])

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
