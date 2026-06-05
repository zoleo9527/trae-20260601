import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'ski-resort.json')

export interface AttachmentPlaceholder {
  id: string
  name: string
  type: string
  url?: string
  isPlaceholder?: boolean
}

export interface Equipment {
  id: string
  code: string
  name: string
  type: string
  status: 'available' | 'rented' | 'maintenance'
}

export interface Student {
  id: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
}

export interface Coach {
  id: string
  name: string
  qualification: string
}

export interface Patrol {
  id: string
  name: string
  role: string
}

export interface Course {
  id: string
  coachId: string
  date: string
  startTime: string
  endTime: string
  maxStudents: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  cancelReason?: string
  confirmedByCoachAt?: string
}

export interface CheckinRecord {
  id: string
  courseId: string
  studentId: string
  status: 'pending' | 'checked_in' | 'no_show'
  checkedInAt?: string
}

export interface RescueRecord {
  id: string
  date: string
  location: string
  description: string
  patientName: string
  severity: 'minor' | 'moderate' | 'severe'
  patrolId?: string
  attachments: AttachmentPlaceholder[]
}

export interface RentalRecord {
  id: string
  equipmentId: string
  studentId: string
  rentedAt: string
  returnedAt?: string
  status: 'active' | 'returned'
  abnormal?: {
    type: string
    note: string
    actualReturner?: string
  }
}

export interface SkiResortData {
  equipment: Equipment[]
  students: Student[]
  coaches: Coach[]
  patrols: Patrol[]
  courses: Course[]
  checkinRecords: CheckinRecord[]
  rescueRecords: RescueRecord[]
  rentalRecords: RentalRecord[]
}

function generateId(): string {
  return crypto.randomUUID()
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function createSeedData(): SkiResortData {
  const today = getToday()

  const equipment: Equipment[] = [
    { id: generateId(), code: 'SK-001', name: '双板滑雪板-标准', type: 'ski', status: 'available' },
    { id: generateId(), code: 'SK-002', name: '双板滑雪板-加长', type: 'ski', status: 'available' },
    { id: generateId(), code: 'SB-001', name: '单板滑雪板-初级', type: 'snowboard', status: 'available' },
    { id: generateId(), code: 'SB-002', name: '单板滑雪板-中级', type: 'snowboard', status: 'rented' },
    { id: generateId(), code: 'HM-001', name: '头盔-成人款', type: 'helmet', status: 'available' },
    { id: generateId(), code: 'GG-001', name: '滑雪护目镜-防雾', type: 'goggles', status: 'available' },
    { id: generateId(), code: 'BT-001', name: '双板雪靴-42码', type: 'boots', status: 'available' },
    { id: generateId(), code: 'BT-002', name: '双板雪靴-39码', type: 'boots', status: 'maintenance' },
  ]

  const students: Student[] = [
    { id: generateId(), name: '张小明', level: 'beginner' },
    { id: generateId(), name: '李思雨', level: 'intermediate' },
    { id: generateId(), name: '王大鹏', level: 'advanced' },
    { id: generateId(), name: '赵雪晴', level: 'beginner' },
    { id: generateId(), name: '陈飞宇', level: 'intermediate' },
    { id: generateId(), name: '刘梦琪', level: 'advanced' },
  ]

  const coaches: Coach[] = [
    { id: generateId(), name: '孙志强', qualification: '高级教练' },
    { id: generateId(), name: '周雅文', qualification: '中级教练' },
    { id: generateId(), name: '吴国庆', qualification: '高级教练' },
    { id: generateId(), name: '郑晓峰', qualification: '初级教练' },
  ]

  const patrols: Patrol[] = [
    { id: generateId(), name: '马卫东', role: '安全巡逻员' },
    { id: generateId(), name: '黄海波', role: '安全巡逻员' },
    { id: generateId(), name: '林安全', role: '安全巡逻员' },
  ]

  const courses: Course[] = [
    {
      id: generateId(), coachId: coaches[0].id, date: today,
      startTime: '09:00', endTime: '11:00', maxStudents: 8,
      status: 'completed', confirmedByCoachAt: `${today}T08:50:00.000Z`,
    },
    {
      id: generateId(), coachId: coaches[1].id, date: today,
      startTime: '13:00', endTime: '15:00', maxStudents: 6,
      status: 'in_progress', confirmedByCoachAt: `${today}T12:55:00.000Z`,
    },
    {
      id: generateId(), coachId: coaches[2].id, date: today,
      startTime: '15:30', endTime: '17:30', maxStudents: 10,
      status: 'pending',
    },
  ]

  const checkinRecords: CheckinRecord[] = [
    {
      id: generateId(), courseId: courses[0].id, studentId: students[0].id,
      status: 'checked_in', checkedInAt: `${today}T08:55:00.000Z`,
    },
    {
      id: generateId(), courseId: courses[0].id, studentId: students[1].id,
      status: 'checked_in', checkedInAt: `${today}T08:57:00.000Z`,
    },
    {
      id: generateId(), courseId: courses[0].id, studentId: students[2].id,
      status: 'no_show',
    },
    {
      id: generateId(), courseId: courses[1].id, studentId: students[3].id,
      status: 'checked_in', checkedInAt: `${today}T12:58:00.000Z`,
    },
    {
      id: generateId(), courseId: courses[1].id, studentId: students[4].id,
      status: 'pending',
    },
    {
      id: generateId(), courseId: courses[2].id, studentId: students[5].id,
      status: 'pending',
    },
  ]

  const rescueRecords: RescueRecord[] = [
    {
      id: generateId(), date: today, location: '中级雪道3号弯',
      description: '学员在转弯时摔倒，右脚踝疑似扭伤', patientName: '赵雪晴',
      severity: 'moderate', patrolId: patrols[0].id,
      attachments: [
        { id: generateId(), name: '现场照片.jpg', type: 'image/jpeg' },
        { id: generateId(), name: '伤情记录.pdf', type: 'application/pdf' },
      ],
    },
  ]

  const rentalRecords: RentalRecord[] = [
    {
      id: generateId(), equipmentId: equipment[3].id, studentId: students[1].id,
      rentedAt: `${today}T08:30:00.000Z`, status: 'active',
    },
    {
      id: generateId(), equipmentId: equipment[1].id, studentId: students[0].id,
      rentedAt: `${today}T08:20:00.000Z`, returnedAt: `${today}T11:05:00.000Z`,
      status: 'returned',
    },
  ]

  return { equipment, students, coaches, patrols, courses, checkinRecords, rescueRecords, rentalRecords }
}

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(DATA_FILE)) {
    const seedData = createSeedData()
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2), 'utf-8')
  }
}

export function readData(): SkiResortData {
  ensureDataFile()
  const raw = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(raw) as SkiResortData
}

export function writeData(data: SkiResortData): void {
  ensureDataFile()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function resetData(): void {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE)
  }
  ensureDataFile()
}

export { generateId, getToday }
