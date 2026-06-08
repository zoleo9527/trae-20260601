import { create } from "zustand"
import type { Cargo, NotifyRecord, PickupAppointment, VerifyChecklist, ExceptionRelease, CargoStatus, NotifyMethod } from "@/types"

const initialCargos: Cargo[] = [
  {
    id: "c1",
    trainNo: "G20260520",
    ticketNo: "HP2026060101",
    goodsName: "汽车配件",
    weight: 2.4,
    consignee: "张建国",
    consigneePhone: "138****2201",
    arrivalTime: "2026-05-27 08:30",
    status: "超期未提",
    exceptionRemark: "到站12天，3次通知无人响应",
  },
  {
    id: "c2",
    trainNo: "G20260530",
    ticketNo: "HP2026060102",
    goodsName: "机电设备",
    weight: 5.6,
    consignee: "李明华",
    consigneePhone: "139****3302",
    arrivalTime: "2026-06-04 14:15",
    status: "已预约",
    exceptionRemark: "委托人王芳提货，委托书身份证号缺失",
  },
  {
    id: "c3",
    trainNo: "G20260605",
    ticketNo: "HP2026060103",
    goodsName: "建材水泥",
    weight: 30,
    consignee: "陈大伟",
    consigneePhone: "137****4403",
    arrivalTime: "2026-06-07 09:00",
    status: "已完成",
    pickupPort: "3号口",
    signer: "陈大伟",
    signTime: "2026-06-07 16:30",
  },
]

const initialNotifies: NotifyRecord[] = [
  { id: "n1", cargoId: "c1", method: "短信", time: "2026-05-27 10:00", operator: "客服-赵敏", result: "已发送，未回复" },
  { id: "n2", cargoId: "c1", method: "电话", time: "2026-05-30 09:30", operator: "客服-赵敏", result: "无人接听" },
  { id: "n3", cargoId: "c1", method: "短信", time: "2026-06-03 14:00", operator: "客服-赵敏", result: "已发送，未回复" },
  { id: "n4", cargoId: "c2", method: "短信", time: "2026-06-04 15:00", operator: "客服-赵敏", result: "已回复，预约6月8日提货" },
  { id: "n5", cargoId: "c3", method: "短信", time: "2026-06-07 09:30", operator: "客服-赵敏", result: "已回复，当天提货" },
]

const initialAppointments: PickupAppointment[] = [
  { id: "a2", cargoId: "c2", pickerName: "王芳", pickerIdCard: "410***1985****2042", relation: "受委托人", appointmentTime: "2026-06-08 10:00" },
  { id: "a3", cargoId: "c3", pickerName: "陈大伟", pickerIdCard: "320***1990****5518", relation: "本人", appointmentTime: "2026-06-07 14:00" },
]

const initialVerifications: VerifyChecklist[] = [
  { cargoId: "c3", items: [{ name: "身份证", passed: true }, { name: "提货单", passed: true }, { name: "委托书", passed: true }, { name: "单位证明", passed: false }], verifiedBy: "货运员-刘强", verifiedTime: "2026-06-07 14:20" },
]

const initialExceptions: ExceptionRelease[] = []

interface CargoStore {
  cargos: Cargo[]
  notifies: NotifyRecord[]
  appointments: PickupAppointment[]
  verifications: VerifyChecklist[]
  exceptions: ExceptionRelease[]

  addCargo: (cargo: Cargo) => void
  sendNotify: (cargoId: string, method: NotifyMethod, operator: string) => void
  makeAppointment: (appointment: PickupAppointment) => void
  verifyChecklist: (checklist: VerifyChecklist) => void
  exceptionRelease: (release: ExceptionRelease) => void
  signOff: (cargoId: string, signer: string, port: string) => void
  setCargoStatus: (cargoId: string, status: CargoStatus) => void
  getNotifyCount: (cargoId: string) => number
  getNotifiesForCargo: (cargoId: string) => NotifyRecord[]
  getAppointmentForCargo: (cargoId: string) => PickupAppointment | undefined
  getVerificationForCargo: (cargoId: string) => VerifyChecklist | undefined
  getExceptionsForCargo: (cargoId: string) => ExceptionRelease[]
}

export const useCargoStore = create<CargoStore>((set, get) => ({
  cargos: initialCargos,
  notifies: initialNotifies,
  appointments: initialAppointments,
  verifications: initialVerifications,
  exceptions: initialExceptions,

  addCargo: (cargo) => set((s) => ({ cargos: [...s.cargos, cargo] })),

  sendNotify: (cargoId, method, operator) => {
    const record: NotifyRecord = {
      id: `n${Date.now()}`,
      cargoId,
      method,
      time: new Date().toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(/\//g, "-"),
      operator,
      result: "已发送",
    }
    set((s) => {
      const cargo = s.cargos.find((c) => c.id === cargoId)
      const newStatus: CargoStatus = cargo?.status === "超期未提" ? "超期未提" : "已通知"
      return {
        notifies: [...s.notifies, record],
        cargos: s.cargos.map((c) => (c.id === cargoId ? { ...c, status: newStatus } : c)),
      }
    })
  },

  makeAppointment: (appointment) =>
    set((s) => ({
      appointments: [...s.appointments, appointment],
      cargos: s.cargos.map((c) => (c.id === appointment.cargoId ? { ...c, status: "已预约" as CargoStatus } : c)),
    })),

  verifyChecklist: (checklist) =>
    set((s) => ({
      verifications: [...s.verifications, checklist],
      cargos: s.cargos.map((c) => (c.id === checklist.cargoId ? { ...c, status: "提货中" as CargoStatus } : c)),
    })),

  exceptionRelease: (release) =>
    set((s) => ({
      exceptions: [...s.exceptions, release],
      cargos: s.cargos.map((c) =>
        c.id === release.cargoId ? { ...c, status: "提货中" as CargoStatus, exceptionRemark: release.reason } : c
      ),
    })),

  signOff: (cargoId, signer, port) =>
    set((s) => ({
      cargos: s.cargos.map((c) =>
        c.id === cargoId
          ? { ...c, status: "已完成" as CargoStatus, signer, signTime: new Date().toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(/\//g, "-"), pickupPort: port }
          : c
      ),
    })),

  setCargoStatus: (cargoId, status) =>
    set((s) => ({
      cargos: s.cargos.map((c) => (c.id === cargoId ? { ...c, status } : c)),
    })),

  getNotifyCount: (cargoId) => get().notifies.filter((n) => n.cargoId === cargoId).length,

  getNotifiesForCargo: (cargoId) => get().notifies.filter((n) => n.cargoId === cargoId),

  getAppointmentForCargo: (cargoId) => get().appointments.find((a) => a.cargoId === cargoId),

  getVerificationForCargo: (cargoId) => get().verifications.find((v) => v.cargoId === cargoId),

  getExceptionsForCargo: (cargoId) => get().exceptions.filter((e) => e.cargoId === cargoId),
}))
