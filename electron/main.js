const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: '再生资源分拣中心 - 进厂登记与过磅复核'
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const getDataDir = () => {
  const userData = app.getPath('userData')
  const dataDir = path.join(userData, 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return dataDir
}

ipcMain.handle('read-data', async (_event, fileName) => {
  const filePath = path.join(getDataDir(), fileName)
  if (!fs.existsSync(filePath)) {
    return null
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
})

ipcMain.handle('write-data', async (_event, fileName, data) => {
  const filePath = path.join(getDataDir(), fileName)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return true
})

ipcMain.handle('export-data', async (_event, defaultName, data) => {
  const result = await dialog.showSaveDialog({
    title: '导出数据',
    defaultPath: defaultName,
    filters: [{ name: 'JSON 文件', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) return false
  fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
  return true
})

ipcMain.handle('import-data', async () => {
  const result = await dialog.showOpenDialog({
    title: '导入数据',
    properties: ['openFile'],
    filters: [{ name: 'JSON 文件', extensions: ['json'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const content = fs.readFileSync(result.filePaths[0], 'utf-8')
  return JSON.parse(content)
})
