import type { DiseaseReport, IsolationRecord } from '@/types'

const STORAGE_KEY_REPORTS = 'disease_reports'
const STORAGE_KEY_ISOLATIONS = 'isolation_records'

function generateCode(prefix: string): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${dateStr}-${random}`
}

function getStoredData<T>(key: string): T[] {
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : []
}

function setStoredData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

const initialReports: DiseaseReport[] = [
  {
    id: '1',
    reportCode: 'EP-20260608-0001',
    reporterRole: 'feeder',
    reporterName: '张饲养',
    barnNumber: 'A-01',
    chickenCount: 5000,
    symptomDescription: '部分鸡只出现食欲减退、羽毛蓬乱症状，持续2天',
    symptomPhotos: [],
    suspectedDisease: '传染性支气管炎',
    severity: 'high',
    status: 'pending',
    createdAt: '2026-06-08T09:30:00Z'
  },
  {
    id: '2',
    reportCode: 'EP-20260607-0002',
    reporterRole: 'sorter',
    reporterName: '李分拣',
    barnNumber: 'B-03',
    chickenCount: 3500,
    symptomDescription: '蛋品出现薄壳蛋、畸形蛋比例上升',
    symptomPhotos: [],
    suspectedDisease: '鸡新城疫',
    severity: 'critical',
    status: 'confirmed',
    createdAt: '2026-06-07T14:20:00Z',
    processedBy: '王场长',
    processedAt: '2026-06-07T16:00:00Z'
  },
  {
    id: '3',
    reportCode: 'EP-20260606-0003',
    reporterRole: 'feeder',
    reporterName: '赵饲养',
    barnNumber: 'C-02',
    chickenCount: 4200,
    symptomDescription: '个别鸡只出现呼吸道症状',
    symptomPhotos: [],
    suspectedDisease: '禽流感',
    severity: 'medium',
    status: 'isolating',
    createdAt: '2026-06-06T10:15:00Z',
    processedBy: '王场长',
    processedAt: '2026-06-06T11:30:00Z',
    isolationId: 'iso-1'
  }
]

const initialIsolations: IsolationRecord[] = [
  {
    id: 'iso-1',
    isolationCode: 'ISO-20260606-0001',
    reportId: '3',
    reportCode: 'EP-20260606-0003',
    barnNumber: 'C-02',
    isolatedChickenCount: 4200,
    isolationStartDate: '2026-06-06',
    isolationReason: '疑似禽流感病例，需隔离观察',
    handlingMeasures: '1. 立即将病鸡转移至隔离区\n2. 对原鸡舍进行全面消毒\n3. 加强通风换气\n4. 每日观察记录',
    handler: '王场长',
    status: 'active',
    createdAt: '2026-06-06T11:30:00Z'
  }
]

function initData(): void {
  if (!localStorage.getItem(STORAGE_KEY_REPORTS)) {
    setStoredData(STORAGE_KEY_REPORTS, initialReports)
  }
  if (!localStorage.getItem(STORAGE_KEY_ISOLATIONS)) {
    setStoredData(STORAGE_KEY_ISOLATIONS, initialIsolations)
  }
}

initData()

export const mockApi = {
  getReports(role?: 'feeder' | 'sorter' | 'manager'): DiseaseReport[] {
    const reports = getStoredData<DiseaseReport>(STORAGE_KEY_REPORTS)
    if (role === 'feeder' || role === 'sorter') {
      return reports.filter(r => r.reporterRole === role)
    }
    return reports
  },

  getReportById(id: string): DiseaseReport | undefined {
    return getStoredData<DiseaseReport>(STORAGE_KEY_REPORTS).find(r => r.id === id)
  },

  createReport(data: Omit<DiseaseReport, 'id' | 'reportCode' | 'createdAt' | 'status'>): DiseaseReport {
    const reports = getStoredData<DiseaseReport>(STORAGE_KEY_REPORTS)
    const newReport: DiseaseReport = {
      ...data,
      id: Date.now().toString(),
      reportCode: generateCode('EP'),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    reports.push(newReport)
    setStoredData(STORAGE_KEY_REPORTS, reports)
    return newReport
  },

  updateReportStatus(id: string, status: DiseaseReport['status'], processedBy?: string, rejectReason?: string): DiseaseReport | undefined {
    const reports = getStoredData<DiseaseReport>(STORAGE_KEY_REPORTS)
    const index = reports.findIndex(r => r.id === id)
    if (index === -1) return undefined

    reports[index] = {
      ...reports[index],
      status,
      processedBy,
      processedAt: new Date().toISOString(),
      rejectReason
    }
    setStoredData(STORAGE_KEY_REPORTS, reports)
    return reports[index]
  },

  getIsolations(): IsolationRecord[] {
    return getStoredData<IsolationRecord>(STORAGE_KEY_ISOLATIONS)
  },

  getIsolationById(id: string): IsolationRecord | undefined {
    return getStoredData<IsolationRecord>(STORAGE_KEY_ISOLATIONS).find(i => i.id === id)
  },

  getIsolationByReportId(reportId: string): IsolationRecord | undefined {
    return getStoredData<IsolationRecord>(STORAGE_KEY_ISOLATIONS).find(i => i.reportId === reportId)
  },

  createIsolation(data: Omit<IsolationRecord, 'id' | 'isolationCode' | 'createdAt' | 'status'>): IsolationRecord {
    const isolations = getStoredData<IsolationRecord>(STORAGE_KEY_ISOLATIONS)
    const newIsolation: IsolationRecord = {
      ...data,
      id: `iso-${Date.now()}`,
      isolationCode: generateCode('ISO'),
      status: 'active',
      createdAt: new Date().toISOString()
    }
    isolations.push(newIsolation)
    setStoredData(STORAGE_KEY_ISOLATIONS, isolations)

    const reports = getStoredData<DiseaseReport>(STORAGE_KEY_REPORTS)
    const reportIndex = reports.findIndex(r => r.id === data.reportId)
    if (reportIndex !== -1) {
      reports[reportIndex].status = 'isolating'
      reports[reportIndex].isolationId = newIsolation.id
      setStoredData(STORAGE_KEY_REPORTS, reports)
    }

    return newIsolation
  },

  releaseIsolation(id: string): IsolationRecord | undefined {
    const isolations = getStoredData<IsolationRecord>(STORAGE_KEY_ISOLATIONS)
    const index = isolations.findIndex(i => i.id === id)
    if (index === -1) return undefined

    isolations[index] = {
      ...isolations[index],
      status: 'released',
      isolationEndDate: new Date().toISOString().slice(0, 10)
    }
    setStoredData(STORAGE_KEY_ISOLATIONS, isolations)

    const reports = getStoredData<DiseaseReport>(STORAGE_KEY_REPORTS)
    const reportIndex = reports.findIndex(r => r.id === isolations[index].reportId)
    if (reportIndex !== -1) {
      reports[reportIndex].status = 'resolved'
      setStoredData(STORAGE_KEY_REPORTS, reports)
    }

    return isolations[index]
  },

  getStats() {
    const reports = getStoredData<DiseaseReport>(STORAGE_KEY_REPORTS)
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      confirmed: reports.filter(r => r.status === 'confirmed').length,
      isolating: reports.filter(r => r.status === 'isolating').length,
      resolved: reports.filter(r => r.status === 'resolved').length
    }
  }
}
