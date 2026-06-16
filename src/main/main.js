const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const Database = require('./database');

app.setName('clothing-customization-manager');

let mainWindow;
let db;

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: '服装定制管理系统'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log.info('主窗口已创建');
}

app.commandLine.appendSwitch('no-sandbox');

app.whenReady().then(() => {
  log.info('应用启动中...');
  
  try {
    db = new Database();
    log.info('数据库初始化成功');
  } catch (error) {
    log.error('数据库初始化失败:', error);
    app.quit();
    return;
  }

  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  ipcMain.handle('db:getAppointments', async (event, filters) => {
    try {
      return db.getAppointments(filters);
    } catch (error) {
      log.error('获取预约失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getAppointment', async (event, id) => {
    try {
      return db.getAppointment(id);
    } catch (error) {
      log.error('获取预约详情失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:createAppointment', async (event, data) => {
    try {
      return db.createAppointment(data);
    } catch (error) {
      log.error('创建预约失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateAppointment', async (event, id, data) => {
    try {
      return db.updateAppointment(id, data);
    } catch (error) {
      log.error('更新预约失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:createStyleConfirmation', async (event, data) => {
    try {
      return db.createStyleConfirmation(data);
    } catch (error) {
      log.error('创建款式确认失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getStyleConfirmations', async (event, filters) => {
    try {
      return db.getStyleConfirmations(filters);
    } catch (error) {
      log.error('获取款式确认失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getStyleConfirmation', async (event, id) => {
    try {
      return db.getStyleConfirmation(id);
    } catch (error) {
      log.error('获取款式确认详情失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateStyleConfirmation', async (event, id, data) => {
    try {
      return db.updateStyleConfirmation(id, data);
    } catch (error) {
      log.error('更新款式确认失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getOperationHistory', async (event, filters) => {
    try {
      return db.getOperationHistory(filters);
    } catch (error) {
      log.error('获取操作历史失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:addOperationHistory', async (event, data) => {
    try {
      return db.addOperationHistory(data);
    } catch (error) {
      log.error('添加操作历史失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getRecentItems', async () => {
    try {
      return db.getRecentItems();
    } catch (error) {
      log.error('获取最近项目失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:addRecentItem', async (event, data) => {
    try {
      return db.addRecentItem(data);
    } catch (error) {
      log.error('添加最近项目失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getDashboardStats', async () => {
    try {
      return db.getDashboardStats();
    } catch (error) {
      log.error('获取仪表盘统计失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getRiskItems', async () => {
    try {
      return db.getRiskItems();
    } catch (error) {
      log.error('获取风险项失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getEmployees', async () => {
    try {
      return db.getEmployees();
    } catch (error) {
      log.error('获取员工列表失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:createMeasurement', async (event, data) => {
    try {
      return db.createMeasurement(data);
    } catch (error) {
      log.error('创建量体记录失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getMeasurements', async (event, appointmentId) => {
    try {
      return db.getMeasurements(appointmentId);
    } catch (error) {
      log.error('获取量体记录失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:createFittingRecord', async (event, data) => {
    try {
      return db.createFittingRecord(data);
    } catch (error) {
      log.error('创建试衣记录失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getFittingRecords', async (event, appointmentId) => {
    try {
      return db.getFittingRecords(appointmentId);
    } catch (error) {
      log.error('获取试衣记录失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:createFabricCard', async (event, data) => {
    try {
      return db.createFabricCard(data);
    } catch (error) {
      log.error('创建面料卡失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getFabricCards', async (event, appointmentId) => {
    try {
      return db.getFabricCards(appointmentId);
    } catch (error) {
      log.error('获取面料卡失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:createTodo', async (event, data) => {
    try {
      return db.createTodo(data);
    } catch (error) {
      log.error('创建待办失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getTodos', async (event, filters) => {
    try {
      return db.getTodos(filters);
    } catch (error) {
      log.error('获取待办失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateTodo', async (event, id, data) => {
    try {
      return db.updateTodo(id, data);
    } catch (error) {
      log.error('更新待办失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:deleteTodo', async (event, id) => {
    try {
      return db.deleteTodo(id);
    } catch (error) {
      log.error('删除待办失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:updateAppointmentOwner', async (event, appointmentId, ownerId, ownerRole) => {
    try {
      return db.updateAppointmentOwner(appointmentId, ownerId, ownerRole);
    } catch (error) {
      log.error('更新预约责任人失败:', error);
      throw error;
    }
  });

  ipcMain.handle('db:getAppointmentsWithOwner', async () => {
    try {
      return db.getAppointmentsWithOwner();
    } catch (error) {
      log.error('获取预约列表失败:', error);
      throw error;
    }
  });

  log.info('IPC 处理器已设置');
}
