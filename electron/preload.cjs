const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  exportJSON: (data) => ipcRenderer.invoke('app:export-json', data),
  importJSON: () => ipcRenderer.invoke('app:import-json'),
  exportCSV: (data) => ipcRenderer.invoke('app:export-csv', data),
  showMessage: (options) => ipcRenderer.invoke('app:show-message', options),
  getPlatform: () => ipcRenderer.invoke('app:platform'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  isDesktop: () => true,
});

contextBridge.exposeInMainWorld('isDesktopApp', true);
