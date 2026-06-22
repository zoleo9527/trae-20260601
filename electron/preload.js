const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readData: (fileName) => ipcRenderer.invoke('read-data', fileName),
  writeData: (fileName, data) => ipcRenderer.invoke('write-data', fileName, data),
  exportData: (defaultName, data) => ipcRenderer.invoke('export-data', defaultName, data),
  importData: () => ipcRenderer.invoke('import-data')
})
