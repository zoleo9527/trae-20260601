import { reactive } from 'vue'
import type { FeedRecord, ConsumptionAnalysis, TodoItem, ActivityItem, FarmRecord, Role } from './types'
import { getInitialData } from './data/mock'

interface StoreState {
  currentRole: Role
  feedRecords: FeedRecord[]
  analyses: ConsumptionAnalysis[]
  todos: TodoItem[]
  activities: ActivityItem[]
  farmRecords: FarmRecord[]
  selectedRecordId: string | null
}

function createStore(): StoreState {
  const data = getInitialData()
  return reactive<StoreState>({
    currentRole: 'feeder',
    feedRecords: data.feedRecords,
    analyses: data.analyses,
    todos: data.todos,
    activities: data.activities,
    farmRecords: data.farmRecords,
    selectedRecordId: null
  })
}

const store = createStore()

export function useStore() {
  function setRole(role: Role) {
    store.currentRole = role
  }

  function selectRecord(id: string | null) {
    store.selectedRecordId = id
  }

  function getSelectedRecord(): FarmRecord | null {
    if (!store.selectedRecordId) return null
    return store.farmRecords.find(r => r.feed.id === store.selectedRecordId) || null
  }

  function submitFeed(recordId: string, actualAmount: number, keyJudgment: string, attachments: File[]) {
    const fr = store.feedRecords.find(r => r.id === recordId)
    if (!fr) return

    fr.actualAmount = actualAmount
    fr.feedTime = new Date().toTimeString().slice(0, 5)
    fr.status = 'delivered'
    fr.keyJudgment = keyJudgment || null
    fr.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16)

    if (Math.abs(actualAmount - fr.plannedAmount) / fr.plannedAmount > 0.03) {
      fr.riskFlag = true
      fr.riskReason = `投喂量与计划偏差${((Math.abs(actualAmount - fr.plannedAmount) / fr.plannedAmount) * 100).toFixed(1)}%`

      store.todos.push({
        id: `TD-${Date.now()}`,
        role: 'manager',
        title: `${fr.houseName}投喂偏差确认`,
        description: `实际${actualAmount}kg vs 计划${fr.plannedAmount}kg`,
        relatedRecordId: fr.id,
        priority: 'high',
        done: false,
        createdAt: fr.updatedAt
      })

      store.activities.unshift({
        id: `ACT-${Date.now()}`,
        action: '风险标记',
        detail: `${fr.houseName}投喂偏差超3%，已标记风险`,
        operator: '系统',
        role: 'manager',
        timestamp: fr.updatedAt
      })
    }

    const todo = store.todos.find(t => t.relatedRecordId === recordId && t.role === 'feeder' && !t.done)
    if (todo) todo.done = true

    store.activities.unshift({
      id: `ACT-${Date.now() + 1}`,
      action: '投喂完成',
      detail: `${fr.houseName}${fr.feedType}投喂${actualAmount}kg`,
      operator: fr.feeder,
      role: 'feeder',
      timestamp: fr.updatedAt
    })

    rebuildFarmRecords()
  }

  function submitAnalysis(recordId: string, actualConsumption: number, returnReason: string, supplementaryNotes: string) {
    let analysis = store.analyses.find(a => a.feedRecordId === recordId)
    const fr = store.feedRecords.find(r => r.id === recordId)
    if (!fr) return

    const expected = analysis?.expectedConsumption || fr.actualAmount || fr.plannedAmount
    const variance = actualConsumption - expected
    const varianceRate = expected > 0 ? (variance / expected) * 100 : 0
    const status: 'done' | 'issue' = Math.abs(varianceRate) > 3 || !!returnReason ? 'issue' : 'done'

    if (analysis) {
      analysis.actualConsumption = actualConsumption
      analysis.variance = variance
      analysis.varianceRate = Math.round(varianceRate * 10) / 10
      analysis.returnReason = returnReason || null
      analysis.supplementaryNotes = supplementaryNotes || null
      analysis.status = status
      analysis.analyzer = store.currentRole === 'sorter' ? '当前用户' : null
      analysis.analyzedAt = new Date().toISOString().replace('T', ' ').slice(0, 16)
    } else {
      analysis = {
        id: `CA-${Date.now()}`,
        feedRecordId: recordId,
        expectedConsumption: expected,
        actualConsumption,
        variance,
        varianceRate: Math.round(varianceRate * 10) / 10,
        analyzer: store.currentRole === 'sorter' ? '当前用户' : null,
        returnReason: returnReason || null,
        supplementaryNotes: supplementaryNotes || null,
        status,
        analyzedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      }
      store.analyses.push(analysis)
    }

    const todo = store.todos.find(t => t.relatedRecordId === recordId && t.role === 'sorter' && !t.done)
    if (todo) todo.done = true

    store.activities.unshift({
      id: `ACT-${Date.now()}`,
      action: status === 'issue' ? '耗用异常' : '耗用完成',
      detail: `${fr.houseName}实际耗用${actualConsumption}kg，偏差${varianceRate.toFixed(1)}%${returnReason ? '，' + returnReason : ''}`,
      operator: analysis.analyzer || '未知',
      role: 'sorter',
      timestamp: analysis.analyzedAt!
    })

    if (status === 'issue') {
      store.todos.push({
        id: `TD-${Date.now() + 1}`,
        role: 'manager',
        title: `${fr.houseName}耗用异常处理`,
        description: `耗用偏差${varianceRate.toFixed(1)}%${returnReason ? '，' + returnReason : ''}`,
        relatedRecordId: fr.id,
        priority: 'high',
        done: false,
        createdAt: analysis.analyzedAt!
      })
    }

    rebuildFarmRecords()
  }

  function resetData() {
    const data = getInitialData()
    store.feedRecords = data.feedRecords
    store.analyses = data.analyses
    store.todos = data.todos
    store.activities = data.activities
    store.farmRecords = data.farmRecords
    store.selectedRecordId = null
  }

  function rebuildFarmRecords() {
    store.farmRecords = store.feedRecords.map(fr => {
      const analysis = store.analyses.find(a => a.feedRecordId === fr.id) || null
      return { feed: fr, analysis }
    })
  }

  const pendingCount = () => store.todos.filter(t => !t.done && t.role === store.currentRole).length
  const riskCount = () => store.farmRecords.filter(r => r.feed.riskFlag).length
  const recentActivities = () => store.activities.slice(0, 8)

  return {
    state: store,
    setRole,
    selectRecord,
    getSelectedRecord,
    submitFeed,
    submitAnalysis,
    resetData,
    pendingCount,
    riskCount,
    recentActivities
  }
}
