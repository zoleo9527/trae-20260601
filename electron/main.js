const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { initDatabase, seedDemoData } = require('./database/db')
const stallHandlers = require('./database/handlers/stalls')
const tenantHandlers = require('./database/handlers/tenants')
const rentHandlers = require('./database/handlers/rent')
const utilityHandlers = require('./database/handlers/utilities')
const hygieneHandlers = require('./database/handlers/hygiene')
const deductionHandlers = require('./database/handlers/deductions')
const reportHandlers = require('./database/handlers/reports')

function isDevMode() {
  if (process.env.NODE_ENV === 'development') return true
  if (process.argv.includes('--dev') || process.argv.includes('--development')) return true
  if (!app.isPackaged) return true
  const distPath = path.join(__dirname, '../dist/index.html')
  return !fs.existsSync(distPath)
}

const isDev = isDevMode()
console.log(`运行模式: ${isDev ? '开发模式' : '生产模式'}`)

let mainWindow
let db

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: '市场摊位管理系统',
    backgroundColor: '#f5f7fa',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
    console.error('页面加载失败:', errorCode, errorDesc)
    if (isDev) {
      mainWindow.loadURL('http://localhost:5173')
    }
  })

  const loadPage = () => {
    if (isDev) {
      mainWindow.loadURL('http://localhost:5173')
        .catch(() => {
          console.log('等待开发服务器启动，3秒后重试...')
          setTimeout(loadPage, 3000)
        })
      mainWindow.webContents.openDevTools()
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }
  }

  loadPage()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  db = initDatabase()
  seedDemoData(db)
  
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (db) db.close()
  if (process.platform !== 'darwin') app.quit()
})

function setupIpcHandlers() {
  const handlers = {
    ...stallHandlers(db),
    ...tenantHandlers(db),
    ...rentHandlers(db),
    ...utilityHandlers(db),
    ...hygieneHandlers(db),
    ...deductionHandlers(db),
    ...reportHandlers(db)
  }

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, (event, ...args) => {
      try {
        return { success: true, data: handler(...args) }
      } catch (error) {
        console.error(`[${channel}] Error:`, error)
        return { success: false, error: error.message }
      }
    })
  }

  ipcMain.handle('print:html', (event, html) => {
    const printWindow = new BrowserWindow({ show: false })
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({}, (success) => {
        printWindow.close()
        event.reply('print:complete', success)
      })
    })
  })

  ipcMain.handle('shell:openExternal', (event, url) => {
    return shell.openExternal(url)
  })
}
