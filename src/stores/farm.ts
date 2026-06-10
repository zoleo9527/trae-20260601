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
        const statusText = updates.status === 'culled' ? '淘汰' : '患病'
        breedingPlans.value.forEach(plan => {
          if (plan.sowId === id && plan.status === 'pending') {
            plan.status = 'cancelled'
            plan.updatedAt = new Date().toISOString().split('T')[0]
            plan.cancelledBy = currentUser.value.id
            plan.cancelledReason = `母猪${statusText}`
            plan.affectedSowStatus = updates.status === 'culled' ? 'culled' : 'sick'
            addNotification({
              type: 'warning',
              title: '配种计划取消',
              message: `${oldSow.earTag} 母猪${statusText}，相关配种计划已取消`,
              targetRole: 'all',
              relatedId: plan.id
            })
          }
        })
      }
      
      addNotification({
        type: 'info',
        title: '种群档案更新',
        message: `${updates.earTag || oldSow.earTag} 母猪信息已更新${updates.changeReason ? `（${updates.changeReason}）` : ''}`,
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
            expectedFarrowingDate: calculateFarrowingDate(plan.actualDate),
            changeReason: '配种成功确认受孕',
            changeSource: 'breeding'
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
        litterCount: sow.litterCount + 1,
        changeReason: `分娩${record.livePigs}头仔猪`,
        changeSource: 'farrowing'
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

    if (record.animalType === 'sow') {
      const sow = getSowById(record.animalId)
      if (sow && record.notes && record.notes.includes('异常')) {
        updateSow(sow.id, {
          healthStatus: 'monitoring',
          changeReason: `疫苗接种异常: ${record.notes}`,
          changeSource: 'vaccine'
        })
        addNotification({
          type: 'warning',
          title: '疫苗异常',
          message: `${sow.earTag} 疫苗接种记录异常，已标记监测`,
          targetRole: 'veterinarian',
          relatedId: newRecord.id
        })
      }
    }
  }

  function confirmConception(recordId: string) {
    const record = breedingRecords.value.find(r => r.id === recordId)
    if (record) {
      record.conceptionConfirmed = true
      record.confirmedDate = new Date().toISOString().split('T')[0]
      
      const sow = getSowById(record.sowId)
      if (sow) {
        updateSow(sow.id, {
          changeReason: `受孕确认 (${record.breedingDate})`,
          changeSource: 'breeding',
          updatedBy: currentUser.value.id
        })
      }
      
      addNotification({
        type: 'success',
        title: '受孕确认',
        message: `${sow?.earTag} 受孕已确认`,
        targetRole: 'manager',
        relatedId: recordId
      })
    }
  }

  function handleVaccineException(vaccineId: string, action: 'resolve' | 'monitor') {
    const record = vaccineRecords.value.find(r => r.id === vaccineId)
    if (record) {
      const sow = getSowById(record.animalId)
      if (sow && action === 'resolve') {
        updateSow(sow.id, {
          healthStatus: 'healthy',
          changeReason: '疫苗异常已处理完成',
          changeSource: 'vaccine'
        })
        addNotification({
          type: 'success',
          title: '疫苗异常已处理',
          message: `${sow.earTag} 疫苗异常已解决`,
          targetRole: 'veterinarian',
          relatedId: vaccineId
        })
      }
    }
  }

  function handlePlanException(planId: string, action: 'ignore' | 'reschedule') {
    const plan = breedingPlans.value.find(p => p.id === planId)
    if (plan) {
      if (action === 'ignore') {
        plan.cancelledReason = `${plan.cancelledReason} (已处理)`
        plan.updatedAt = new Date().toISOString().split('T')[0]
      } else if (action === 'reschedule') {
        plan.status = 'pending'
        plan.cancelledReason = undefined
        plan.cancelledBy = undefined
        plan.affectedSowStatus = undefined
        plan.updatedAt = new Date().toISOString().split('T')[0]
      }
    }
  }

  function getTasksForRole(role: string) {
    const tasks: { id: string; title: string; description: string; type: string; priority: 'high' | 'medium' | 'low' }[] = []
    
    if (role === 'breeder') {
      const pendingPlans = breedingPlans.value.filter(p => p.status === 'pending')
      pendingPlans.forEach(plan => {
        const sow = getSowById(plan.sowId)
        const boar = getBoarById(plan.boarId)
        tasks.push({
          id: plan.id,
          title: '待执行配种',
          description: `${sow?.earTag || plan.sowId} × ${boar?.earTag || plan.boarId}`,
          type: 'breeding',
          priority: plan.plannedDate < new Date().toISOString().split('T')[0] ? 'high' : 'medium'
        })
      })
      
      const pendingRecords = breedingRecords.value.filter(r => r.result === 'success' && !r.conceptionConfirmed)
      pendingRecords.forEach(record => {
        const sow = getSowById(record.sowId)
        tasks.push({
          id: record.id,
          title: '待确认受孕',
          description: `${sow?.earTag || record.sowId} 配种成功，待确认受孕`,
          type: 'conception',
          priority: 'medium'
        })
      })
    }
    
    if (role === 'veterinarian') {
      const upcomingVaccinations = vaccineRecords.value.filter(r => {
        if (!r.nextDueDate) return false
        const dueDate = new Date(r.nextDueDate)
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        return dueDate <= nextWeek
      })
      upcomingVaccinations.forEach(record => {
        const animal = record.animalType === 'sow' ? getSowById(record.animalId) : getBoarById(record.animalId)
        tasks.push({
          id: record.id,
          title: '疫苗即将到期',
          description: `${animal?.earTag || record.animalId} 的${record.vaccineName}即将到期`,
          type: 'vaccine',
          priority: 'high'
        })
      })
      
      const sickAnimals = sows.value.filter(s => s.healthStatus === 'sick' || s.healthStatus === 'monitoring')
      sickAnimals.forEach(sow => {
        tasks.push({
          id: sow.id,
          title: '健康监测',
          description: `${sow.earTag} ${sow.healthStatus === 'sick' ? '患病' : '监测中'}`,
          type: 'health',
          priority: sow.healthStatus === 'sick' ? 'high' : 'medium'
        })
      })
    }
    
    if (role === 'manager') {
      const cancelledPlans = breedingPlans.value.filter(p => p.status === 'cancelled' && !p.cancelledReason?.includes('已处理'))
      cancelledPlans.forEach(plan => {
        const sow = getSowById(plan.sowId)
        tasks.push({
          id: plan.id,
          title: '配种计划异常',
          description: `${sow?.earTag || plan.sowId} 的配种计划被取消: ${plan.cancelledReason}`,
          type: 'exception',
          priority: 'high'
        })
      })
      
      const overduePlans = breedingPlans.value.filter(p => p.status === 'pending' && p.plannedDate < new Date().toISOString().split('T')[0])
      overduePlans.forEach(plan => {
        const sow = getSowById(plan.sowId)
        tasks.push({
          id: plan.id,
          title: '配种计划逾期',
          description: `${sow?.earTag || plan.sowId} 的配种计划已逾期`,
          type: 'overdue',
          priority: 'high'
        })
      })
    }
    
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
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
    markNotificationAsRead,
    getTasksForRole,
    confirmConception,
    handleVaccineException,
    handlePlanException
  }
})