if (typeof Neutralino === 'undefined') {
  window.Neutralino = {
    computer: {},
    events: { on: function() {}, off: function() {} },
    filesystem: {},
    os: {},
    storage: { getData: function(k) { return Promise.resolve(localStorage.getItem('nl_' + k)); }, setData: function(k, v) { localStorage.setItem('nl_' + k, v); return Promise.resolve(); } },
    window: { setTitle: function(t) { document.title = t; } },
    app: { exit: function() { window.close(); } },
    init: function() {}
  };
}

try { Neutralino.init(); } catch(e) {}
