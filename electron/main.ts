import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'path'
import fs from 'fs'
import {
  initDatabase, calculateQuote, createOrder, updateOrder, updateOrderStatus,
  getOrders, getOrderById, getCustomers, createCustomer, getProofsByOrder,
  createProof, reviewProof, getMachines, updateMachineStatus, getSchedules,
  createSchedule, updateSchedule, getWorkspaceState, saveWorkspaceState,
  getUsers, exportAllData, importData
} from './database'
import type {
  Customer, Order, Proof, Machine, Schedule, User,
  WorkspaceState, OrderStatus, MachineStatus,
  QuoteCalculationInput, QuoteResult, DatabaseResult, UserRole
} from './types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null
let currentUser: User | null = null
let db: any = null

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  db = initDatabase()
  
  const result = getUsers()
  if (result.success && result.data && result.data.length > 0) {
    currentUser = result.data[0]
  }
  
  createWindow()
})

app.on('quit', () => {
  if (db) {
    db.close()
  }
})

ipcMain.handle('get-workspace-state', async (): Promise<DatabaseResult<WorkspaceState>> => {
  return getWorkspaceState()
})

ipcMain.handle('save-workspace-state', async (_, state: Partial<WorkspaceState>): Promise<DatabaseResult<WorkspaceState>> => {
  return saveWorkspaceState(state)
})

ipcMain.handle('get-users', async (): Promise<DatabaseResult<User[]>> => {
  return getUsers()
})

ipcMain.handle('get-current-user', async (): Promise<DatabaseResult<User>> => {
  if (currentUser) {
    return { success: true, data: currentUser }
  }
  return { success: false, error: 'No user logged in' }
})

ipcMain.handle('switch-role', async (_, role: UserRole): Promise<DatabaseResult<User>> => {
  const result = await getUsers()
  if (!result.success || !result.data) {
    return { success: false, error: result.error || 'Failed to get users' }
  }
  const user = result.data.find((u: User) => u.role === role)
  if (user) {
    currentUser = user
    return { success: true, data: user }
  }
  return { success: false, error: 'User not found for role' }
})

ipcMain.handle('get-orders', async (_, status?: OrderStatus, fromDate?: string, toDate?: string, search?: string): Promise<DatabaseResult<Order[]>> => {
  return getOrders(status, fromDate, toDate, search)
})

ipcMain.handle('get-order-by-id', async (_, id: number): Promise<DatabaseResult<Order>> => {
  return getOrderById(id)
})

ipcMain.handle('create-order', async (_, order: Omit<Order, 'id' | 'order_no' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Order>> => {
  return createOrder(order)
})

ipcMain.handle('update-order', async (_, id: number, updates: Partial<Order>): Promise<DatabaseResult<Order>> => {
  return updateOrder(id, updates)
})

ipcMain.handle('update-order-status', async (_, orderId: number, newStatus: OrderStatus, userId: number, note?: string): Promise<DatabaseResult<Order>> => {
  return updateOrderStatus(orderId, newStatus, userId, note)
})

ipcMain.handle('calculate-quote', async (_, input: QuoteCalculationInput): Promise<QuoteResult> => {
  return calculateQuote(input)
})

ipcMain.handle('get-customers', async (_, search?: string): Promise<DatabaseResult<Customer[]>> => {
  return getCustomers(search)
})

ipcMain.handle('create-customer', async (_, customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Customer>> => {
  return createCustomer(customer)
})

ipcMain.handle('get-proofs-by-order', async (_, orderId: number): Promise<DatabaseResult<Proof[]>> => {
  return getProofsByOrder(orderId)
})

ipcMain.handle('create-proof', async (_, proof: Omit<Proof, 'id' | 'uploaded_at' | 'is_current'>): Promise<DatabaseResult<Proof>> => {
  return createProof(proof)
})

ipcMain.handle('review-proof', async (_, proofId: number, status: 'approved' | 'rejected', userId: number, feedback?: string): Promise<DatabaseResult<Proof>> => {
  return reviewProof(proofId, status, userId, feedback)
})

ipcMain.handle('select-proof-file', async (): Promise<{ canceled: boolean; filePaths?: string[] }> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'pdf', 'ai', 'cdr'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

ipcMain.handle('get-machines', async (): Promise<DatabaseResult<Machine[]>> => {
  return getMachines()
})

ipcMain.handle('update-machine-status', async (_, id: number, status: MachineStatus, note?: string): Promise<DatabaseResult<Machine>> => {
  return updateMachineStatus(id, status, note)
})

ipcMain.handle('get-schedules', async (_, date?: string, machineId?: number): Promise<DatabaseResult<(Schedule & { order: Order; machine: Machine })[]>> => {
  return getSchedules(date, machineId)
})

ipcMain.handle('create-schedule', async (_, schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Schedule>> => {
  return createSchedule(schedule)
})

ipcMain.handle('update-schedule', async (_, id: number, updates: Partial<Schedule>): Promise<DatabaseResult<Schedule>> => {
  return updateSchedule(id, updates)
})

ipcMain.handle('export-data', async (): Promise<DatabaseResult<any>> => {
  return exportAllData()
})

ipcMain.handle('import-data', async (_, data: any): Promise<DatabaseResult<{ count: number }>> => {
  return importData(data)
})

ipcMain.handle('show-export-dialog', async (_, defaultPath: string): Promise<{ canceled: boolean; filePath?: string }> => {
  const result = await dialog.showSaveDialog({
    defaultPath,
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  })
  return result
})

ipcMain.handle('show-import-dialog', async (): Promise<{ canceled: boolean; filePaths?: string[] }> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  })
  return result
})

ipcMain.handle('read-json-file', async (_, filePath: string): Promise<any> => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    throw e
  }
})

ipcMain.handle('write-json-file', async (_, filePath: string, data: any): Promise<DatabaseResult<void>> => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
})
