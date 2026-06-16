const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const AppDatabase = require('./database');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: '餐饮连锁门店缺货申领系统'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function setupIpcHandlers() {
  ipcMain.handle('db:getStores', () => {
    return db.getStores();
  });

  ipcMain.handle('db:getProducts', () => {
    return db.getProducts();
  });

  ipcMain.handle('db:getEmployees', () => {
    return db.getEmployees();
  });

  ipcMain.handle('db:getShortageRequests', (event, filters) => {
    return db.getShortageRequests(filters || {});
  });

  ipcMain.handle('db:createShortageRequest', (event, data) => {
    return db.createShortageRequest(data);
  });

  ipcMain.handle('db:reviewShortageRequest', (event, id, data) => {
    return db.reviewShortageRequest(id, data);
  });

  ipcMain.handle('db:getAllocations', (event, filters) => {
    return db.getAllocations(filters || {});
  });

  ipcMain.handle('db:createAllocation', (event, data) => {
    return db.createAllocation(data);
  });

  ipcMain.handle('db:updateAllocationStatus', (event, id, status) => {
    return db.updateAllocationStatus(id, status);
  });

  ipcMain.handle('db:getReceipts', (event, filters) => {
    return db.getReceipts(filters || {});
  });

  ipcMain.handle('db:createReceipt', (event, data) => {
    return db.createReceipt(data);
  });

  ipcMain.handle('db:getDiscrepancies', (event, filters) => {
    return db.getDiscrepancies(filters || {});
  });

  ipcMain.handle('db:createDiscrepancy', (event, data) => {
    return db.createDiscrepancy(data);
  });

  ipcMain.handle('db:resolveDiscrepancy', (event, id, data) => {
    return db.resolveDiscrepancy(id, data);
  });

  ipcMain.handle('db:getFeedbacks', (event, filters) => {
    return db.getFeedbacks(filters || {});
  });

  ipcMain.handle('db:createFeedback', (event, data) => {
    return db.createFeedback(data);
  });

  ipcMain.handle('db:getDashboardStats', () => {
    return db.getDashboardStats();
  });
}

app.commandLine.appendSwitch('no-sandbox');

app.on('ready', () => {
  db = new AppDatabase();
  setupIpcHandlers();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});