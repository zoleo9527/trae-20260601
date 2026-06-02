import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { initDatabase } from './database'
import { registerHandlers } from './ipc'

let mainWindow: BrowserWindow | null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 768,
    title: '门禁卡管理系统',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  initDatabase()
  registerHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('app:showSaveDialog', async (_, options) => {
  return dialog.showSaveDialog(mainWindow!, options)
})

ipcMain.handle('app:showOpenDialog', async (_, options) => {
  return dialog.showOpenDialog(mainWindow!, options)
})

ipcMain.handle('app:getPath', async (_, name) => {
  return app.getPath(name)
})
