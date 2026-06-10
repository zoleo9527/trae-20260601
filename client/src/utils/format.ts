import dayjs from 'dayjs'

export const formatDate = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

export const formatDateTime = (date: string | Date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export const getAge = (birthDate: string) => {
  const now = dayjs()
  const birth = dayjs(birthDate)
  const years = now.diff(birth, 'year')
  const months = now.diff(birth, 'month') % 12
  if (years > 0) {
    return `${years}岁${months}个月`
  }
  return `${months}个月`
}

export const getStatusText = (status: string, type: 'cattle' | 'note' | 'breeding') => {
  const statusMap: Record<string, Record<string, string>> = {
    cattle: {
      healthy: '健康',
      sick: '生病',
      pregnant: '怀孕',
      calving: '待产',
      sold: '已出售',
      dead: '已死亡',
    },
    note: {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      rejected: '已退回',
    },
    breeding: {
      planned: '计划中',
      completed: '已完成',
      successful: '成功',
      failed: '失败',
      aborted: '终止',
    },
  }
  return statusMap[type][status] || status
}

export const getNoteTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    health: '健康记录',
    breeding: '繁育记录',
    feeding: '喂养记录',
    treatment: '治疗记录',
    other: '其他',
  }
  return typeMap[type] || type
}

export const getBreedingTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    natural: '自然交配',
    artificial: '人工授精',
  }
  return typeMap[type] || type
}

export const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    manager: '牧场主管',
    milker: '挤奶员',
    vet: '兽医',
  }
  return roleMap[role] || role
}