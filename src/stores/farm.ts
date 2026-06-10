import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sow, Boar, BreedingPlan, BreedingRecord, FarrowingRecord, VaccineRecord, User, Notification } from '@/types'
import { mockUsers, mockSows, mockBoars, mockBreedingPlans, mockBreedingRecords, mockFarrowingRecords, mockVaccineRecords, mockNotifications } from '@/data/mockData'

export const useFarmStore = defineStore('farm', () => {
  const currentUser = ref<User>(mockUsers[0])
  const sows = ref<Sow[]>(mockSows)
  const boars = ref<Boar[]>(mockBoars)
  const breedingPlans = ref<BreedingPlan[]>(mockBreedingPlans)
  const breedingRecords = ref<BreedingRecord[]>(mockBreedingRecords)
  const farrowingRecords = ref<FarrowingRecord[]>(mockFarrowingRecords)
  const vaccineRecords = ref<VaccineRecord[]>(mockVaccineRecords)
  const notifications = ref<Notification[]>(mockNotifications)

  const emptySows = computed(() => sows.value.filter(s => s.status === 'empty'))
  const activeBoars = computed(() => boars.value.filter(b => b.status === 'active'))
  const pendingPlans = computed(() => breedingPlans.value.filter(p => p.status === 'pending'))
  const unreadNotifications = computed(() => notifications.value.filter(n => !n.read && (n.targetRole === 'all' || n.targetRole === currentUser.value.role)))

  function setCurrentUser(user: User) {
    currentUser.value = user
  }

  function getSowById(id: string): Sow | undefined {
    return sows.value.find(s => s.id === id)
  }

  function getBoarById(id: string): Boar | undefined {
    return boars.value.find(b => b.id === id)
  }

  function updateSow(id: string, updates: Partial<Sow>) {
    const index = sows.value.findIndex(s => s.id === id)
    if (index !== -1) {
      const oldSow = { ...sows.value[index] }
      sows.value[index] = { ...sows.value[index], ...updates, updatedBy: currentUser.value.id, updatedAt: new Date().toISOString().split('T')[0] }
      
      if (updates.status === 'culled' || updates.healthStatus === 'sick') {
        breedingPlans.value.forEach(plan => {
          if (plan.sowId === id && plan.status === 'pending') {
            plan.status = 'cancelled'
            plan.updatedAt = new Date().toISOString().split('T')[0]
            addNotification({
              type: 'warning',
              title: '配种计划取消',
              message: `${oldSow.earTag} 母猪状态变更，相关配种计划已取消`,
              targetRole: 'all',
              relatedId: plan.id
            })
          }
        })
      }
      
      addNotification({
        type: 'info',
        title: '种群档案更新',
        message: `${updates.earTag || oldSow.earTag} 母猪信息已更新`,
        targetRole: 'all',
        relatedId: id
      })
    }
  }

  function addSow(sow: Omit<Sow, 'id' | 'createdBy' | 'updatedBy' | 'updatedAt'>) {
    const newSow: Sow = {
      ...sow,
      id: `s${Date.now()}`,
      createdBy: currentUser.value.id,
      updatedBy: currentUser.value.id,
      updatedAt: new Date().toISOString().split('T')[0]
    }
    sows.value.push(newSow)
    addNotification({
      type: 'success',
      title: '新增母猪',
      message: `${sow.earTag} 母猪已添加到种群档案`,
      targetRole: 'all',
      relatedId: newSow.id
    })
  }

  function batchAddSows(newSows: Omit<Sow, 'id' | 'createdBy' | 'updatedBy' | 'updatedAt'>[]) {
    newSows.forEach(sow => addSow(sow))
  }

  function updateBoar(id: string, updates: Partial<Boar>) {
    const index = boars.value.findIndex(b => b.id === id)
    if (index !== -1) {
      const oldBoar = { ...boars.value[index] }
      boars.value[index] = { ...boars.value[index], ...updates, updatedBy: currentUser.value.id, updatedAt: new Date().toISOString().split('T')[0] }
      
      if (updates.status === 'culled' || updates.healthStatus === 'sick') {
        breedingPlans.value.forEach(plan => {
          if (plan.boarId === id && plan.status === 'pending') {
            plan.status = 'cancelled'
            plan.updatedAt = new Date().toISOString().split('T')[0]
          }
        })
      }
      
      addNotification({
        type: 'info',
        title: '公猪档案更新',
        message: `${updates.earTag || oldBoar.earTag} 公猪信息已更新`,
        targetRole: 'all',
        relatedId: id
      })
    }
  }

  function addBreedingPlan(plan: Omit<BreedingPlan, 'id' | 'createdAt' | 'updatedAt'>) {
    const newPlan: BreedingPlan = {
      ...plan,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    breedingPlans.value.push(newPlan)
    
    const sow = getSowById(plan.sowId)
    const boar = getBoarById(plan.boarId)
    
    addNotification({
      type: 'info',
      title: '新分配种计划',
      message: `${sow?.earTag || plan.sowId} × ${boar?.earTag || plan.boarId} 配种计划已创建`,
      targetRole: 'breeder',
      relatedId: newPlan.id
    })
  }

  function completeBreedingPlan(planId: string, result: 'success' | 'failed', notes?: string) {
    const plan = breedingPlans.value.find(p => p.id === planId)
    if (plan) {
      plan.status = 'completed'
      plan.actualDate = new Date().toISOString().split('T')[0]
      plan.operator = currentUser.value.id
      plan.updatedAt = new Date().toISOString().split('T')[0]

      const record: BreedingRecord = {
        id: `r${Date.now()}`,
        planId,
        sowId: plan.sowId,
        boarId: plan.boarId,
        breedingDate: plan.actualDate,
        type: plan.type,
        result,
        conceptionConfirmed: result === 'success',
        operator: currentUser.value.id,
        notes,
        createdAt: plan.actualDate
      }
      breedingRecords.value.push(record)

      if (result === 'success') {
        const sow = getSowById(plan.sowId)
        if (sow) {
          updateSow(sow.id, { 
            status: 'pregnant', 
            lastBreedingDate: plan.actualDate,
            expectedFarrowingDate: calculateFarrowingDate(plan.actualDate)
          })
        }
        const boar = getBoarById(plan.boarId)
        if (boar) {
          updateBoar(boar.id, { useCount: boar.useCount + 1, lastUsedDate: plan.actualDate })
        }
      }

      addNotification({
        type: result === 'success' ? 'success' : 'warning',
        title: result === 'success' ? '配种成功' : '配种失败',
        message: `${getSowById(plan.sowId)?.earTag} 配种${result === 'success' ? '成功' : '失败'}`,
        targetRole: 'manager',
        relatedId: planId
      })
    }
  }

  function addFarrowingRecord(record: Omit<FarrowingRecord, 'id' | 'createdAt'>) {
    const newRecord: FarrowingRecord = {
      ...record,
      id: `f${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    }
    farrowingRecords.value.push(newRecord)

    const sow = getSowById(record.sowId)
    if (sow) {
      updateSow(sow.id, { 
        status: 'lactating',
        parity: sow.parity + 1,
        litterCount: sow.litterCount + 1
      })
    }

    addNotification({
      type: 'success',
      title: '分娩记录',
      message: `${sow?.earTag} 分娩 ${record.livePigs} 头仔猪`,
      targetRole: 'all',
      relatedId: newRecord.id
    })
  }

  function addVaccineRecord(record: Omit<VaccineRecord, 'id' | 'createdAt'>) {
    const newRecord: VaccineRecord = {
      ...record,
      id: `v${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    }
    vaccineRecords.value.push(newRecord)
  }

  function addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    notifications.value.unshift({
      ...notification,
      id: `n${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString().split('T')[0]
    })
  }

  function markNotificationAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function calculateFarrowingDate(breedingDate: string): string {
    const date = new Date(breedingDate)
    date.setDate(date.getDate() + 114)
    return date.toISOString().split('T')[0]
  }

  return {
    currentUser,
    sows,
    boars,
    breedingPlans,
    breedingRecords,
    farrowingRecords,
    vaccineRecords,
    notifications,
    emptySows,
    activeBoars,
    pendingPlans,
    unreadNotifications,
    setCurrentUser,
    getSowById,
    getBoarById,
    updateSow,
    addSow,
    batchAddSows,
    updateBoar,
    addBreedingPlan,
    completeBreedingPlan,
    addFarrowingRecord,
    addVaccineRecord,
    addNotification,
    markNotificationAsRead
  }
})