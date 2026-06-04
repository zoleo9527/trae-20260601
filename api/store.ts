import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const DATA_FILE = join(DATA_DIR, 'db.json')

export interface DataStore {
  diversions: any[]
  missedItems: any[]
  attachments: any[]
  diversionLogs: any[]
  missedItemLogs: any[]
}

const defaultData: DataStore = {
  diversions: [],
  missedItems: [],
  attachments: [],
  diversionLogs: [],
  missedItemLogs: [],
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readData(): DataStore {
  ensureDataDir()
  if (!existsSync(DATA_FILE)) {
    writeData(defaultData)
    return defaultData
  }
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return defaultData
  }
}

function writeData(data: DataStore) {
  ensureDataDir()
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function loadData(): DataStore {
  const data = readData()
  return {
    diversions: data.diversions ?? [],
    missedItems: data.missedItems ?? [],
    attachments: data.attachments ?? [],
    diversionLogs: data.diversionLogs ?? [],
    missedItemLogs: data.missedItemLogs ?? [],
  }
}

export function saveData(data: Partial<DataStore>) {
  const current = readData()
  const updated = { ...current, ...data }
  writeData(updated)
}

export function initDataIfEmpty(initialData: DataStore) {
  const current = readData()
  if (current.diversions.length === 0 && current.missedItems.length === 0) {
    writeData(initialData)
    return true
  }
  return false
}

export function resetData(initialData: DataStore) {
  writeData(initialData)
}
