const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-setuid-sandbox');

const isDev = process.env.NODE_ENV === 'development';
const isMac = process.platform === 'darwin';

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 720,
    backgroundColor: '#0a0a18',
    title: '学院公共仪器预约管理台',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5178');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

ipcMain.handle('app:export-json', async (_event, data) => {
  try {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const defaultName = `instrument-reservation-backup-${stamp}.json`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出数据备份',
      defaultPath: defaultName,
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false };
    }

    fs.writeFileSync(result.filePath, data, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    console.error('Export error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:import-json', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入数据备份',
      properties: ['openFile'],
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false };
    }

    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, content, filePath: result.filePaths[0] };
  } catch (err) {
    console.error('Import error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:export-csv', async (_event, data) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '导出预约记录',
      defaultPath: 'reservations.csv',
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false };
    }

    fs.writeFileSync(result.filePath, '\uFEFF' + data, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    console.error('CSV export error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:show-message', async (_event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('app:platform', () => {
  return process.platform;
});

ipcMain.handle('app:version', () => {
  return app.getVersion();
});
