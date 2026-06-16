const Neutralino = {
  init: function() {
    return new Promise((resolve) => {
      if (window.NL_MODE === 'window') {
        this._initNativeAPI();
      }
      resolve();
    });
  },
  
  _initNativeAPI: function() {
    const apiNames = ['app', 'os', 'storage', 'filesystem'];
    apiNames.forEach(apiName => {
      this[apiName] = {};
      const methods = ['getInfo', 'exit', 'showNotification', 'read', 'write', 'append', 'remove', 'list', 'createDirectory', 'removeDirectory', 'getStats', 'exists'];
      methods.forEach(method => {
        this[apiName][method] = function() {
          return new Promise((resolve) => {
            resolve({ success: true, data: {} });
          });
        };
      });
    });
  },
  
  app: {
    getInfo: function() { return Promise.resolve({ success: true, data: { version: '1.0.0' } }); },
    exit: function() { return Promise.resolve({ success: true }); },
    showNotification: function(title, content) { 
      return Promise.resolve({ success: true }); 
    }
  },
  
  os: {
    getEnv: function(name) { return Promise.resolve({ success: true, data: '' }); },
    execCommand: function(cmd) { return Promise.resolve({ success: true, data: '' }); }
  },
  
  storage: {
    setData: function(key, value) { return Promise.resolve({ success: true }); },
    getData: function(key) { return Promise.resolve({ success: true, data: null }); },
    deleteData: function(key) { return Promise.resolve({ success: true }); }
  },
  
  filesystem: {
    readFile: function(path) { return Promise.resolve({ success: true, data: '' }); },
    writeFile: function(path, data) { return Promise.resolve({ success: true }); },
    appendFile: function(path, data) { return Promise.resolve({ success: true }); },
    removeFile: function(path) { return Promise.resolve({ success: true }); },
    createDirectory: function(path) { return Promise.resolve({ success: true }); },
    removeDirectory: function(path) { return Promise.resolve({ success: true }); },
    readDirectory: function(path) { return Promise.resolve({ success: true, data: [] }); },
    getStats: function(path) { return Promise.resolve({ success: true, data: {} }); },
    exists: function(path) { return Promise.resolve({ success: true, data: false }); }
  }
};

window.Neutralino = Neutralino;
window.NL_MODE = 'window';
window.NL_PORT = 0;