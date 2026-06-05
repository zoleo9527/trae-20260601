const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {
  getHandlers,
  createOrder, updateOrder, getOrders, getOrderById,
  createDispatch, updateDispatch, getDispatchesByOrder, getDispatches,
  createSignature, updateSignature, getSignaturesByDispatch, getSignatures,
  createException, updateException, getExceptions,
  createHandoverLog, getHandoverLogs,
  getDashboardStats, getOrderFullDetail,
} = require('./src/database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: '鲜花配送站 - 配送派单与签收回传',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle('get-handlers', (_, role) => getHandlers(role));

ipcMain.handle('create-order', (_, o) => createOrder(o));
ipcMain.handle('update-order', (_, id, fields) => updateOrder(id, fields));
ipcMain.handle('get-orders', (_, filter) => getOrders(filter || {}));
ipcMain.handle('get-order-by-id', (_, id) => getOrderById(id));

ipcMain.handle('create-dispatch', (_, d) => createDispatch(d));
ipcMain.handle('update-dispatch', (_, id, fields) => updateDispatch(id, fields));
ipcMain.handle('get-dispatches-by-order', (_, orderId) => getDispatchesByOrder(orderId));
ipcMain.handle('get-dispatches', (_, filter) => getDispatches(filter || {}));

ipcMain.handle('create-signature', (_, s) => createSignature(s));
ipcMain.handle('update-signature', (_, id, fields) => updateSignature(id, fields));
ipcMain.handle('get-signatures-by-dispatch', (_, dispatchId) => getSignaturesByDispatch(dispatchId));
ipcMain.handle('get-signatures', (_, filter) => getSignatures(filter || {}));

ipcMain.handle('create-exception', (_, e) => createException(e));
ipcMain.handle('update-exception', (_, id, fields) => updateException(id, fields));
ipcMain.handle('get-exceptions', (_, filter) => getExceptions(filter || {}));

ipcMain.handle('create-handover-log', (_, l) => createHandoverLog(l));
ipcMain.handle('get-handover-logs', (_, orderId) => getHandoverLogs(orderId));

ipcMain.handle('get-dashboard-stats', () => getDashboardStats());
ipcMain.handle('get-order-full-detail', (_, orderId) => getOrderFullDetail(orderId));
