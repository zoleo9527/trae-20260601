import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Device, InspectionReport, RiskFlag, HistoryEntry, Grade, RiskType, RiskSeverity, Role, RiskStatus, InspectionItem } from '@/types'
import { mockDevices, mockInspectionReports, mockRiskFlags, mockHistoryEntries } from '@/data/mockData'

const GRADE_PRICE_RATIO: Record<Grade, number> = {
  A: 1.05,
  B: 0.9,
  C: 0.72,
  D: 0.55,
  scrap: 0.25,
}

function calcFinalPrice(estimatedPrice: number, grade: Grade, items: InspectionItem[], appearanceScore: number): number {
  const ratio = GRADE_PRICE_RATIO[grade]
  let basePrice = Math.round(estimatedPrice * ratio)
  const failCount = items.filter((i) => i.result === 'fail').length
  const passCount = items.filter((i) => i.result === 'pass').length
  const totalCount = failCount + passCount || 1
  const defectAdjust = Math.max(-0.2, -failCount * 0.03)
  const appearanceAdjust = (appearanceScore - 7) * 0.01
  const qualityAdjust = totalCount > 0 ? (passCount / totalCount - 0.8) * 0.05 : 0
  const final = Math.round(basePrice * (1 + defectAdjust + appearanceAdjust + qualityAdjust))
  return Math.max(50, final)
}

interface DeviceStore {
  devices: Device[]
  inspectionReports: Record<string, InspectionReport>
  riskFlags: RiskFlag[]
  historyEntries: HistoryEntry[]
  selectedDeviceIds: string[]

  setSelectedDeviceIds: (ids: string[]) => void
  toggleDeviceSelection: (id: string) => void
  clearSelection: () => void

  addDevice: (device: Omit<Device, 'id' | 'status' | 'receivedAt' | 'inspectedAt' | 'inspectedBy' | 'paidAt' | 'paidBy' | 'finalPrice' | 'grade'>) => void
  batchReceiveDevices: (ids: string[]) => void
  batchAdjustPrice: (ids: string[], percent: number) => void
  startInspection: (id: string) => void
  submitInspection: (deviceId: string, report: InspectionReport, grade: Grade) => void
  confirmPrice: (id: string, finalPrice?: number) => void
  markPriceRegret: (id: string, reason: string) => void
  returnDevice: (id: string) => void
  updatePaymentAccount: (id: string, account: string, bank: string) => void
  verifyPayment: (id: string) => void
  executePayment: (ids: string[]) => void
  flagRisk: (deviceId: string, type: RiskType, description: string, severity: RiskSeverity) => void
  updateRiskStatus: (riskId: string, status: RiskStatus) => void
  resolveRisk: (riskId: string) => void
  addNote: (deviceId: string, content: string, operator: string, role: Role) => void
  addHistoryEntry: (deviceId: string, action: string, operator: string, role: Role, detail: string) => void
  resetData: () => void
}

let idCounter = 100
const generateId = (prefix: string) => {
  idCounter++
  return `${prefix}-${String(idCounter).padStart(3, '0')}`
}

export const useDeviceStore = create<DeviceStore>()(
  persist(
    (set, get) => ({
      devices: mockDevices,
      inspectionReports: mockInspectionReports,
      riskFlags: mockRiskFlags,
      historyEntries: mockHistoryEntries,
      selectedDeviceIds: [],

      setSelectedDeviceIds: (ids) => set({ selectedDeviceIds: ids }),

      toggleDeviceSelection: (id) =>
        set((state) => {
          const exists = state.selectedDeviceIds.includes(id)
          return {
            selectedDeviceIds: exists
              ? state.selectedDeviceIds.filter((i) => i !== id)
              : [...state.selectedDeviceIds, id],
          }
        }),

      clearSelection: () => set({ selectedDeviceIds: [] }),

      addDevice: (deviceData) => {
        const id = generateId('DEV')
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-')
        const newDevice: Device = {
          ...deviceData,
          id,
          status: 'received',
          finalPrice: null,
          grade: null,
          receivedAt: now,
          inspectedAt: null,
          inspectedBy: null,
          paidAt: null,
          paidBy: null,
        }
        set((state) => ({
          devices: [...state.devices, newDevice],
        }))
        get().addHistoryEntry(id, '设备登记', deviceData.receivedBy, 'receiver', `登记${deviceData.brand} ${deviceData.model}，外观评分${deviceData.appearanceScore}分，预估价${deviceData.estimatedPrice}元，客户${deviceData.customerName}送机`)
      },

      batchReceiveDevices: (ids) => {
        set((state) => ({
          devices: state.devices.map((d) =>
            ids.includes(d.id) ? { ...d, status: 'received' as const } : d
          ),
        }))
        ids.forEach((id) => {
          get().addHistoryEntry(id, '批量确认收货', '小李', 'receiver', '通过批量操作确认收货')
        })
      },

      batchAdjustPrice: (ids, percent) => {
        set((state) => ({
          devices: state.devices.map((d) => {
            if (!ids.includes(d.id)) return d
            const newPrice = Math.round(d.estimatedPrice * (1 + percent / 100))
            return { ...d, estimatedPrice: newPrice }
          }),
        }))
        ids.forEach((id) => {
          get().addHistoryEntry(id, '批量调价', '小李', 'receiver', `预估价调整${percent > 0 ? '+' : ''}${percent}%`)
        })
      },

      startInspection: (id) => {
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-')
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === id ? { ...d, status: 'inspecting' as const, inspectedAt: now, inspectedBy: '老王' } : d
          ),
        }))
        get().addHistoryEntry(id, '开始检测', '老王', 'inspector', '领取设备开始检测')
      },

      submitInspection: (deviceId, report, grade) => {
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-')
        const gradeLabel = grade === 'scrap' ? '废机' : `${grade}级`
        const device = get().devices.find((d) => d.id === deviceId)
        const finalPrice = device
          ? calcFinalPrice(device.estimatedPrice, grade, report.items, device.appearanceScore)
          : 0
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === deviceId ? { ...d, status: 'graded' as const, grade, finalPrice, inspectedAt: now } : d
          ),
          inspectionReports: { ...state.inspectionReports, [deviceId]: { ...report, submittedAt: now } },
        }))
        get().addHistoryEntry(deviceId, '提交检测报告', '老王', 'inspector', `检测完成，判定${gradeLabel}，建议价${finalPrice}元。${report.gradeReason}`)
        if (report.hiddenDefects.length > 0) {
          get().flagRisk(deviceId, 'hidden_defect', `发现暗病：${report.hiddenDefects.join('；')}`, 'high')
        }
        const failCount = report.items.filter((i) => i.result === 'fail').length
        if (failCount >= 3 || grade === 'scrap') {
          get().flagRisk(deviceId, 'review', `该设备检测异常（${failCount}项不通过），建议纳入复盘`, failCount >= 5 ? 'high' : 'medium')
        }
      },

      confirmPrice: (id, finalPrice) => {
        const device = get().devices.find((d) => d.id === id)
        const price = finalPrice ?? device?.finalPrice ?? device?.estimatedPrice ?? 0
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === id ? { ...d, status: 'confirmed' as const, finalPrice: price } : d
          ),
        }))
        get().addHistoryEntry(id, '客户确认价格', '小李', 'receiver', `客户确认接受${price}元报价`)
      },

      markPriceRegret: (id, reason) => {
        get().flagRisk(id, 'price_regret', reason, 'high')
        const risk = get().riskFlags.find((r) => r.deviceId === id && r.type === 'price_regret' && r.status === 'pending')
        if (risk) get().updateRiskStatus(risk.id, 'processing')
        get().addHistoryEntry(id, '客户拒绝报价', '小李', 'receiver', reason)
      },

      returnDevice: (id) => {
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === id ? { ...d, status: 'returned' as const } : d
          ),
        }))
        get().addHistoryEntry(id, '设备退回', '小李', 'receiver', '协商未果，设备退回客户')
        const risks = get().riskFlags.filter((r) => r.deviceId === id && r.status !== 'resolved')
        risks.forEach((r) => get().resolveRisk(r.id))
      },

      updatePaymentAccount: (id, account, bank) => {
        const device = get().devices.find((d) => d.id === id)
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === id ? { ...d, paymentAccount: account, paymentBank: bank } : d
          ),
        }))
        get().addHistoryEntry(id, '更新收款账号', '赵姐', 'finance', `账号由${device?.paymentBank} ${device?.paymentAccount} 变更为${bank} ${account}`)
        const risk = get().riskFlags.find((r) => r.deviceId === id && r.type === 'payment_error' && r.status !== 'resolved')
        if (risk) {
          get().resolveRisk(risk.id)
          get().addHistoryEntry(id, '打款异常解决', '赵姐', 'finance', '收款账号已更新，打款异常标记解除')
        }
      },

      verifyPayment: (id) => {
        const device = get().devices.find((d) => d.id === id)
        if (!device) return
        const sameBankAcc = device.paymentAccount && device.paymentBank
        if (!sameBankAcc) {
          get().flagRisk(id, 'payment_error', '收款账号信息不完整，需客户补充', 'high')
          get().addHistoryEntry(id, '账号核验异常', '赵姐', 'finance', '收款账号信息不完整')
          return
        }
        const risk = get().riskFlags.find((r) => r.deviceId === id && r.type === 'payment_error' && r.status !== 'resolved')
        if (!risk) {
          set((state) => ({
            devices: state.devices.map((d) =>
              d.id === id ? { ...d, status: 'paying' as const } : d
            ),
          }))
          get().addHistoryEntry(id, '账号核验通过', '赵姐', 'finance', '收款账号与客户信息一致，核验通过')
        }
      },

      executePayment: (ids) => {
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-')
        const payableIds: string[] = []
        ids.forEach((id) => {
          const hasError = get().riskFlags.some((r) => r.deviceId === id && r.type === 'payment_error' && r.status !== 'resolved')
          if (!hasError) payableIds.push(id)
        })
        set((state) => ({
          devices: state.devices.map((d) =>
            payableIds.includes(d.id) ? { ...d, status: 'completed' as const, paidAt: now, paidBy: '赵姐' } : d
          ),
        }))
        payableIds.forEach((id) => {
          const device = get().devices.find((d) => d.id === id)
          if (device) {
            get().addHistoryEntry(id, '执行打款', '赵姐', 'finance', `打款${device.finalPrice}元至${device.paymentBank} ${device.paymentAccount}，已核实`)
            get().addHistoryEntry(id, '流程完成', '系统', 'manager', '设备回收流程完成，最终状态：已打款')
          }
        })
      },

      flagRisk: (deviceId, type, description, severity) => {
        const id = generateId('RISK')
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-')
        const newRisk: RiskFlag = {
          id,
          deviceId,
          type,
          severity,
          description,
          status: 'pending',
          createdAt: now,
          resolvedAt: null,
        }
        set((state) => ({
          riskFlags: [...state.riskFlags, newRisk],
        }))
        const typeLabel: Record<RiskType, string> = {
          price_regret: '估价反悔',
          hidden_defect: '暗病争议',
          payment_error: '打款异常',
          review: '复盘提醒',
        }
        get().addHistoryEntry(deviceId, `风险标记：${typeLabel[type]}`, '系统', 'manager', description)
      },

      updateRiskStatus: (riskId, status) => {
        const risk = get().riskFlags.find((r) => r.id === riskId)
        if (!risk) return
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-')
        set((state) => ({
          riskFlags: state.riskFlags.map((r) =>
            r.id === riskId ? { ...r, status, resolvedAt: status === 'resolved' ? now : r.resolvedAt } : r
          ),
        }))
        const statusLabel: Record<RiskStatus, string> = {
          pending: '待处理',
          processing: '处理中',
          resolved: '已解决',
        }
        get().addHistoryEntry(risk.deviceId, `风险状态更新`, '小李', 'manager', `风险标记状态更新为：${statusLabel[status]}`)
      },

      resolveRisk: (riskId) => get().updateRiskStatus(riskId, 'resolved'),

      addNote: (deviceId, content, operator, role) => {
        get().addHistoryEntry(deviceId, '添加备注', operator, role, content)
      },

      addHistoryEntry: (deviceId, action, operator, role, detail) => {
        const id = generateId('H')
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).replace(/\//g, '-')
        const entry: HistoryEntry = { id, deviceId, action, operator, role, detail, timestamp: now }
        set((state) => ({
          historyEntries: [...state.historyEntries, entry],
        }))
      },

      resetData: () =>
        set({
          devices: mockDevices,
          inspectionReports: mockInspectionReports,
          riskFlags: mockRiskFlags,
          historyEntries: mockHistoryEntries,
          selectedDeviceIds: [],
        }),
    }),
    {
      name: 'digital-recycle-store',
    }
  )
)
