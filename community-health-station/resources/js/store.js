const EventBus = {
  _listeners: {},
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  },
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },
  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => {
      try { cb(data); } catch (e) { console.error(`EventBus error on ${event}:`, e); }
    });
  }
};

const Store = {
  _cache: { contracts: [], archives: [], notifications: [], recentItems: [] },

  _read(key) {
    try {
      const raw = localStorage.getItem(`chs_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  _write(key, data) {
    localStorage.setItem(`chs_${key}`, JSON.stringify(data));
  },

  init() {
    this._cache.contracts = this._read('contracts') || [];
    this._cache.archives = this._read('archives') || [];
    this._cache.notifications = this._read('notifications') || [];
    this._cache.recentItems = this._read('recentItems') || [];
    if (this._cache.contracts.length === 0) this._seedDemoData();
  },

  _seedDemoData() {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const contracts = [
      {
        id: 'CT-20260601-001',
        familyHead: { name: '王建国', idCard: '310105196503122718', phone: '13901661234' },
        members: [
          { name: '李秀兰', relation: '配偶', idCard: '310105196809052726', phone: '13901661235' },
          { name: '王晓明', relation: '子女', idCard: '310105199203152713', phone: '13801881236' }
        ],
        contractType: '中级',
        assignedDoctor: '陈志远',
        assignedNurse: '刘芳',
        assignedPHS: '孙丽华',
        status: '处理中',
        notes: [
          { id: 1, author: '陈志远', role: '全科医生', content: '户主高血压III级，需每月随访；配偶糖尿病II型', createdAt: '2026-06-01 09:30' },
          { id: 2, author: '刘芳', role: '护士', content: '老人行动不便，随访安排上门', createdAt: '2026-06-01 10:15' }
        ],
        returnReason: '',
        supplementInfo: '',
        createdAt: '2026-06-01 09:00',
        updatedAt: '2026-06-01 10:15',
        history: [
          { action: '创建签约', by: '陈志远', role: '全科医生', at: '2026-06-01 09:00', detail: '' },
          { action: '接单处理', by: '陈志远', role: '全科医生', at: '2026-06-01 09:15', detail: '' },
          { action: '添加备注', by: '陈志远', role: '全科医生', at: '2026-06-01 09:30', detail: '户主高血压III级' },
          { action: '添加备注', by: '刘芳', role: '护士', at: '2026-06-01 10:15', detail: '随访安排上门' }
        ]
      },
      {
        id: 'CT-20260603-002',
        familyHead: { name: '赵德明', idCard: '310102197001083514', phone: '13601885678' },
        members: [
          { name: '周桂英', relation: '配偶', idCard: '310102197205063528', phone: '13601885679' }
        ],
        contractType: '基本',
        assignedDoctor: '陈志远',
        assignedNurse: '刘芳',
        assignedPHS: '孙丽华',
        status: '已退回',
        notes: [
          { id: 1, author: '陈志远', role: '全科医生', content: '身份证信息需核实，户口本地址与实际居住地不一致', createdAt: '2026-06-03 14:00' }
        ],
        returnReason: '户籍地址与居住地址不一致，需补充居住证明',
        supplementInfo: '',
        createdAt: '2026-06-03 10:00',
        updatedAt: '2026-06-03 14:00',
        history: [
          { action: '创建签约', by: '陈志远', role: '全科医生', at: '2026-06-03 10:00', detail: '' },
          { action: '接单处理', by: '陈志远', role: '全科医生', at: '2026-06-03 10:30', detail: '' },
          { action: '添加备注', by: '陈志远', role: '全科医生', at: '2026-06-03 14:00', detail: '身份证信息需核实' },
          { action: '退回', by: '陈志远', role: '全科医生', at: '2026-06-03 14:00', detail: '户籍地址与居住地址不一致' }
        ]
      },
      {
        id: 'CT-20260605-003',
        familyHead: { name: '陈建华', idCard: '310104198512064513', phone: '15001789012' },
        members: [
          { name: '吴美珍', relation: '配偶', idCard: '310104198803074527', phone: '15001789013' },
          { name: '陈思远', relation: '子女', idCard: '310104201005094511', phone: '' },
          { name: '陈思雨', relation: '子女', idCard: '310104201208114528', phone: '' }
        ],
        contractType: '高级',
        assignedDoctor: '张伟',
        assignedNurse: '刘芳',
        assignedPHS: '孙丽华',
        status: '已关闭',
        notes: [
          { id: 1, author: '张伟', role: '全科医生', content: '两子女未成年，需关注预防接种', createdAt: '2026-06-05 11:00' },
          { id: 2, author: '孙丽华', role: '公共卫生专员', content: '已建档，儿童预防接种已录入', createdAt: '2026-06-05 15:30' }
        ],
        returnReason: '',
        supplementInfo: '',
        createdAt: '2026-06-05 09:00',
        updatedAt: '2026-06-05 16:00',
        history: [
          { action: '创建签约', by: '张伟', role: '全科医生', at: '2026-06-05 09:00', detail: '' },
          { action: '接单处理', by: '张伟', role: '全科医生', at: '2026-06-05 09:20', detail: '' },
          { action: '添加备注', by: '张伟', role: '全科医生', at: '2026-06-05 11:00', detail: '两子女未成年' },
          { action: '关闭签约', by: '张伟', role: '全科医生', at: '2026-06-05 16:00', detail: '签约完成，已建档' }
        ]
      }
    ];

    const archives = [
      {
        id: 'AR-20260601-001',
        contractId: 'CT-20260601-001',
        familyHeadName: '王建国',
        healthRecords: [
          { memberName: '王建国', recordType: '慢性病', detail: '高血压III级，苯磺酸氨氯地平 5mg qd', date: '2026-06-01' },
          { memberName: '李秀兰', recordType: '慢性病', detail: '糖尿病II型，二甲双胍 500mg bid', date: '2026-06-01' }
        ],
        status: '建档中',
        inheritedNotes: [
          { author: '陈志远', role: '全科医生', content: '户主高血压III级，需每月随访；配偶糖尿病II型', fromContractAt: '2026-06-01 09:30' },
          { author: '刘芳', role: '护士', content: '老人行动不便，随访安排上门', fromContractAt: '2026-06-01 10:15' }
        ],
        ownNotes: [
          { id: 1, author: '孙丽华', role: '公共卫生专员', content: '首次随访定于6月15日，已通知家属', createdAt: '2026-06-01 14:00' }
        ],
        changeAlerts: [
          {
            id: 'ca-1',
            type: 'note_synced',
            title: '签约新增备注',
            detail: '刘芳(护士)添加签约备注',
            createdAt: '2026-06-01 10:15',
            confirmed: false,
            confirmedBy: '',
            confirmedAt: ''
          }
        ],
        returnReason: '',
        supplementInfo: '',
        createdBy: '孙丽华',
        processedBy: '孙丽华',
        createdAt: '2026-06-01 13:00',
        updatedAt: '2026-06-01 14:00',
        history: [
          { action: '创建建档', by: '孙丽华', role: '公共卫生专员', at: '2026-06-01 13:00', detail: '关联签约 CT-20260601-001' },
          { action: '接单建档', by: '孙丽华', role: '公共卫生专员', at: '2026-06-01 13:30', detail: '' },
          { action: '添加备注', by: '孙丽华', role: '公共卫生专员', at: '2026-06-01 14:00', detail: '首次随访定于6月15日' }
        ]
      },
      {
        id: 'AR-20260605-001',
        contractId: 'CT-20260605-003',
        familyHeadName: '陈建华',
        healthRecords: [
          { memberName: '陈思远', recordType: '预防接种', detail: '已接种：乙肝疫苗3剂次、百白破3剂次', date: '2026-06-05' },
          { memberName: '陈思雨', recordType: '预防接种', detail: '已接种：乙肝疫苗3剂次、百白破2剂次（缺第3剂）', date: '2026-06-05' }
        ],
        status: '已关闭',
        inheritedNotes: [
          { author: '张伟', role: '全科医生', content: '两子女未成年，需关注预防接种', fromContractAt: '2026-06-05 11:00' }
        ],
        ownNotes: [
          { id: 1, author: '孙丽华', role: '公共卫生专员', content: '已建档，儿童预防接种已录入', createdAt: '2026-06-05 15:30' }
        ],
        changeAlerts: [],
        returnReason: '',
        supplementInfo: '',
        createdBy: '孙丽华',
        processedBy: '孙丽华',
        createdAt: '2026-06-05 14:00',
        updatedAt: '2026-06-05 16:00',
        history: [
          { action: '创建建档', by: '孙丽华', role: '公共卫生专员', at: '2026-06-05 14:00', detail: '关联签约 CT-20260605-003' },
          { action: '接单建档', by: '孙丽华', role: '公共卫生专员', at: '2026-06-05 14:30', detail: '' },
          { action: '添加备注', by: '孙丽华', role: '公共卫生专员', at: '2026-06-05 15:30', detail: '儿童预防接种已录入' },
          { action: '关闭建档', by: '孙丽华', role: '公共卫生专员', at: '2026-06-05 16:00', detail: '建档完成' }
        ]
      }
    ];

    this._cache.contracts = contracts;
    this._cache.archives = archives;
    this._cache.recentItems = [
      { type: 'contract', id: 'CT-20260601-001', label: '王建国-中级', openedAt: '2026-06-01 13:00' },
      { type: 'archive', id: 'AR-20260601-001', label: '王建国-建档', openedAt: '2026-06-01 13:30' },
      { type: 'contract', id: 'CT-20260605-003', label: '陈建华-高级', openedAt: '2026-06-05 14:00' }
    ];
    this._persist();
  },

  _persist() {
    this._write('contracts', this._cache.contracts);
    this._write('archives', this._cache.archives);
    this._write('notifications', this._cache.notifications);
    this._write('recentItems', this._cache.recentItems);
  },

  _genId(prefix) {
    const d = new Date();
    const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const seq = String(this._cache.contracts.length + this._cache.archives.length + 1).padStart(3, '0');
    return `${prefix}-${ds}-${seq}`;
  },

  _now() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },

  getContracts() { return [...this._cache.contracts]; },

  getContract(id) { return this._cache.contracts.find(c => c.id === id) || null; },

  getArchives() { return [...this._cache.archives]; },

  getArchive(id) { return this._cache.archives.find(a => a.id === id) || null; },

  getArchivesByContract(contractId) { return this._cache.archives.filter(a => a.contractId === contractId); },

  getNotifications() { return [...this._cache.notifications]; },

  getRecentItems() { return [...this._cache.recentItems]; },

  getArchivesWithUnconfirmedChanges() {
    return this._cache.archives.filter(a => a.changeAlerts && a.changeAlerts.some(ca => !ca.confirmed));
  },

  _addChangeAlertToArchive(archive, type, title, detail) {
    if (!archive.changeAlerts) archive.changeAlerts = [];
    const alert = {
      id: `ca-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      detail,
      createdAt: this._now(),
      confirmed: false,
      confirmedBy: '',
      confirmedAt: ''
    };
    archive.changeAlerts.push(alert);
    archive.updatedAt = this._now();
    return alert;
  },

  confirmChangeAlert(archiveId, alertId) {
    const archive = this._cache.archives.find(a => a.id === archiveId);
    if (!archive || !archive.changeAlerts) return null;
    const alert = archive.changeAlerts.find(ca => ca.id === alertId);
    if (!alert || alert.confirmed) return null;
    const operator = window.App ? App.getOperatorName() : '';
    const role = window.App ? App.getCurrentRole() : '';
    alert.confirmed = true;
    alert.confirmedBy = operator;
    alert.confirmedAt = this._now();
    archive.history.push({
      action: '确认变更',
      by: operator,
      role,
      at: this._now(),
      detail: `确认：${alert.title}`
    });
    this._persist();
    EventBus.emit('archive:changed', { archiveId, action: 'alert_confirmed' });
    return alert;
  },

  confirmAllChangeAlerts(archiveId) {
    const archive = this._cache.archives.find(a => a.id === archiveId);
    if (!archive || !archive.changeAlerts) return 0;
    const operator = window.App ? App.getOperatorName() : '';
    const role = window.App ? App.getCurrentRole() : '';
    let count = 0;
    archive.changeAlerts.filter(ca => !ca.confirmed).forEach(ca => {
      ca.confirmed = true;
      ca.confirmedBy = operator;
      ca.confirmedAt = this._now();
      count++;
    });
    if (count > 0) {
      archive.history.push({
        action: '批量确认变更',
        by: operator,
        role,
        at: this._now(),
        detail: `确认 ${count} 条变更`
      });
      this._persist();
      EventBus.emit('archive:changed', { archiveId, action: 'alerts_confirmed' });
    }
    return count;
  },

  addContract(data) {
    const contract = {
      id: this._genId('CT'),
      ...data,
      status: '待处理',
      notes: [],
      returnReason: '',
      supplementInfo: '',
      createdAt: this._now(),
      updatedAt: this._now(),
      history: [{ action: '创建签约', by: data.assignedDoctor, role: '全科医生', at: this._now(), detail: '' }]
    };
    this._cache.contracts.unshift(contract);
    this._addRecent('contract', contract.id, `${contract.familyHead.name}-${contract.contractType}`);
    this._persist();
    EventBus.emit('contract:created', contract);
    EventBus.emit('contract:changed', { contractId: contract.id, action: 'created' });
    return contract;
  },

  updateContract(id, updates) {
    const idx = this._cache.contracts.findIndex(c => c.id === id);
    if (idx === -1) return null;
    Object.assign(this._cache.contracts[idx], updates, { updatedAt: this._now() });
    this._persist();
    EventBus.emit('contract:changed', { contractId: id, action: 'updated', updates });
    return this._cache.contracts[idx];
  },

  addContractNote(contractId, note) {
    const contract = this._cache.contracts.find(c => c.id === contractId);
    if (!contract) return null;
    const noteObj = { id: Date.now(), ...note, createdAt: this._now() };
    contract.notes.push(noteObj);
    contract.updatedAt = this._now();
    contract.history.push({ action: '添加备注', by: note.author, role: note.role, at: this._now(), detail: note.content.slice(0, 30) });
    this._persist();

    this._cache.archives.filter(a => a.contractId === contractId).forEach(archive => {
      archive.inheritedNotes.push({
        author: note.author,
        role: note.role,
        content: note.content,
        fromContractAt: noteObj.createdAt
      });
      archive.updatedAt = this._now();
      archive.history.push({ action: '签约备注同步', by: '系统', role: '系统', at: this._now(), detail: `${note.author}(${note.role})添加签约备注` });
      this._addChangeAlertToArchive(archive, 'note_synced', '签约新增备注', `${note.author}(${note.role})添加了签约备注`);
    });

    this._addNotification(contractId, 'contract', `签约 ${contractId} 新增备注`, note.content);

    this._persist();
    EventBus.emit('contract:noteAdded', { contractId, note: noteObj });
    EventBus.emit('archive:changed', { contractId, action: 'note_synced' });
    return noteObj;
  },

  processContract(contractId, operator, role) {
    const contract = this._cache.contracts.find(c => c.id === contractId);
    if (!contract) return null;
    const prev = contract.status;
    contract.status = '处理中';
    contract.updatedAt = this._now();
    contract.history.push({ action: '接单处理', by: operator, role, at: this._now(), detail: '' });
    this._persist();
    this._addNotification(contractId, 'contract', `签约 ${contractId} 已被 ${operator}(${role}) 接单处理`, '');
    EventBus.emit('contract:changed', { contractId, action: 'processed', from: prev, to: '处理中' });
    return contract;
  },

  returnContract(contractId, reason, operator, role) {
    const contract = this._cache.contracts.find(c => c.id === contractId);
    if (!contract) return null;
    const prev = contract.status;
    contract.status = '已退回';
    contract.returnReason = reason;
    contract.updatedAt = this._now();
    contract.history.push({ action: '退回', by: operator, role, at: this._now(), detail: reason });
    this._persist();
    this._addNotification(contractId, 'contract', `签约 ${contractId} 已退回`, reason);

    this._cache.archives.filter(a => a.contractId === contractId).forEach(archive => {
      archive.status = '退回补录';
      archive.returnReason = `关联签约被退回：${reason}`;
      archive.updatedAt = this._now();
      archive.history.push({ action: '签约退回联动', by: '系统', role: '系统', at: this._now(), detail: `关联签约 ${contractId} 被退回` });
      this._addChangeAlertToArchive(archive, 'contract_returned', '签约被退回', `签约 ${contractId} 被退回，原因：${reason}`);
    });
    this._persist();
    EventBus.emit('contract:changed', { contractId, action: 'returned', from: prev, to: '已退回' });
    EventBus.emit('archive:changed', { contractId, action: 'contract_returned' });
    return contract;
  },

  supplementContract(contractId, info, operator, role) {
    const contract = this._cache.contracts.find(c => c.id === contractId);
    if (!contract) return null;
    const prev = contract.status;
    contract.status = '已补充';
    contract.supplementInfo = info;
    contract.updatedAt = this._now();
    contract.history.push({ action: '补充信息', by: operator, role, at: this._now(), detail: info.slice(0, 50) });
    this._persist();
    this._addNotification(contractId, 'contract', `签约 ${contractId} 已补充信息`, info);

    this._cache.archives.filter(a => a.contractId === contractId).forEach(archive => {
      archive.status = '已补充';
      archive.supplementInfo = `签约补充：${info}`;
      archive.updatedAt = this._now();
      archive.history.push({ action: '签约补充联动', by: '系统', role: '系统', at: this._now(), detail: `关联签约 ${contractId} 补充信息` });
      this._addChangeAlertToArchive(archive, 'contract_supplemented', '签约已补充信息', `签约 ${contractId} 补充：${info.slice(0, 50)}`);
    });
    this._persist();
    EventBus.emit('contract:changed', { contractId, action: 'supplemented', from: prev, to: '已补充' });
    EventBus.emit('archive:changed', { contractId, action: 'contract_supplemented' });
    return contract;
  },

  closeContract(contractId, operator, role) {
    const contract = this._cache.contracts.find(c => c.id === contractId);
    if (!contract) return null;
    const prev = contract.status;
    contract.status = '已关闭';
    contract.updatedAt = this._now();
    contract.history.push({ action: '关闭签约', by: operator, role, at: this._now(), detail: '' });
    this._persist();
    this._addNotification(contractId, 'contract', `签约 ${contractId} 已关闭`, '');
    EventBus.emit('contract:changed', { contractId, action: 'closed', from: prev, to: '已关闭' });
    return contract;
  },

  reopenContract(contractId, operator, role) {
    const contract = this._cache.contracts.find(c => c.id === contractId);
    if (!contract) return null;
    const prev = contract.status;
    contract.status = '处理中';
    contract.updatedAt = this._now();
    contract.history.push({ action: '重新处理', by: operator, role, at: this._now(), detail: `从 ${prev} 恢复` });
    this._persist();
    this._addNotification(contractId, 'contract', `签约 ${contractId} 重新处理`, '');

    this._cache.archives.filter(a => a.contractId === contractId).forEach(archive => {
      if (archive.status === '退回补录' || archive.status === '已补充') {
        archive.status = '建档中';
        archive.updatedAt = this._now();
        archive.history.push({ action: '签约恢复联动', by: '系统', role: '系统', at: this._now(), detail: `关联签约 ${contractId} 恢复处理` });
        this._addChangeAlertToArchive(archive, 'contract_reopened', '签约恢复处理', `签约 ${contractId} 从 ${prev} 恢复处理`);
      }
    });
    this._persist();
    EventBus.emit('contract:changed', { contractId, action: 'reopened', from: prev, to: '处理中' });
    EventBus.emit('archive:changed', { contractId, action: 'contract_reopened' });
    return contract;
  },

  modifyContract(contractId, updates, operator, role) {
    const contract = this._cache.contracts.find(c => c.id === contractId);
    if (!contract) return null;
    Object.assign(contract, updates, { updatedAt: this._now() });
    contract.history.push({ action: '修改签约', by: operator, role, at: this._now(), detail: '签约内容已变更' });
    this._persist();
    this._addNotification(contractId, 'contract', `签约 ${contractId} 内容已被 ${operator}(${role}) 修改`, '请档案建档侧关注变更');

    this._cache.archives.filter(a => a.contractId === contractId).forEach(archive => {
      if (contract.notes.length > archive.inheritedNotes.length) {
        contract.notes.forEach(cn => {
          if (!archive.inheritedNotes.some(in_ => in_.content === cn.content && in_.fromContractAt === cn.createdAt)) {
            archive.inheritedNotes.push({
              author: cn.author,
              role: cn.role,
              content: cn.content,
              fromContractAt: cn.createdAt
            });
          }
        });
      }
      archive.updatedAt = this._now();
      archive.history.push({ action: '签约变更通知', by: '系统', role: '系统', at: this._now(), detail: `关联签约 ${contractId} 内容变更` });
      this._addChangeAlertToArchive(archive, 'contract_modified', '签约内容已修改', `签约 ${contractId} 被 ${operator}(${role}) 修改`);
    });
    this._persist();
    EventBus.emit('contract:changed', { contractId, action: 'modified', updates });
    EventBus.emit('archive:changed', { contractId, action: 'contract_modified' });
    return contract;
  },

  addArchive(contractId, operator, role) {
    const contract = this._cache.contracts.find(c => c.id === contractId);
    if (!contract) return null;
    const archive = {
      id: this._genId('AR'),
      contractId,
      familyHeadName: contract.familyHead.name,
      healthRecords: [],
      status: '待建档',
      inheritedNotes: contract.notes.map(n => ({
        author: n.author,
        role: n.role,
        content: n.content,
        fromContractAt: n.createdAt
      })),
      ownNotes: [],
      changeAlerts: [],
      returnReason: '',
      supplementInfo: '',
      createdBy: operator,
      processedBy: '',
      createdAt: this._now(),
      updatedAt: this._now(),
      history: [{ action: '创建建档', by: operator, role, at: this._now(), detail: `关联签约 ${contractId}` }]
    };
    this._cache.archives.unshift(archive);
    this._addRecent('archive', archive.id, `${contract.familyHead.name}-建档`);
    this._persist();
    this._addNotification(contractId, 'contract', `签约 ${contractId} 已创建建档记录`, `建档编号 ${archive.id}`);
    EventBus.emit('archive:created', archive);
    return archive;
  },

  updateArchive(id, updates) {
    const idx = this._cache.archives.findIndex(a => a.id === id);
    if (idx === -1) return null;
    Object.assign(this._cache.archives[idx], updates, { updatedAt: this._now() });
    this._persist();
    EventBus.emit('archive:changed', { archiveId: id, action: 'updated' });
    return this._cache.archives[idx];
  },

  addArchiveNote(archiveId, note) {
    const archive = this._cache.archives.find(a => a.id === archiveId);
    if (!archive) return null;
    const noteObj = { id: Date.now(), ...note, createdAt: this._now() };
    archive.ownNotes.push(noteObj);
    archive.updatedAt = this._now();
    archive.history.push({ action: '添加备注', by: note.author, role: note.role, at: this._now(), detail: note.content.slice(0, 30) });
    this._persist();
    return noteObj;
  },

  processArchive(archiveId, operator, role) {
    const archive = this._cache.archives.find(a => a.id === archiveId);
    if (!archive) return null;
    const prev = archive.status;
    archive.status = '建档中';
    archive.processedBy = operator;
    archive.updatedAt = this._now();
    archive.history.push({ action: '接单建档', by: operator, role, at: this._now(), detail: '' });
    this._persist();
    this._addNotification(archive.contractId, 'archive', `建档 ${archiveId} 已被 ${operator}(${role}) 接单`, '');
    EventBus.emit('archive:changed', { archiveId, action: 'processed', from: prev, to: '建档中' });
    return archive;
  },

  returnArchive(archiveId, reason, operator, role) {
    const archive = this._cache.archives.find(a => a.id === archiveId);
    if (!archive) return null;
    const prev = archive.status;
    archive.status = '退回补录';
    archive.returnReason = reason;
    archive.updatedAt = this._now();
    archive.history.push({ action: '退回补录', by: operator, role, at: this._now(), detail: reason });
    this._persist();
    this._addNotification(archive.contractId, 'archive', `建档 ${archiveId} 退回补录`, reason);
    EventBus.emit('archive:changed', { archiveId, action: 'returned', from: prev, to: '退回补录' });
    return archive;
  },

  supplementArchive(archiveId, info, operator, role) {
    const archive = this._cache.archives.find(a => a.id === archiveId);
    if (!archive) return null;
    const prev = archive.status;
    archive.status = '已补充';
    archive.supplementInfo = info;
    archive.updatedAt = this._now();
    archive.history.push({ action: '补充信息', by: operator, role, at: this._now(), detail: info.slice(0, 50) });
    this._persist();
    this._addNotification(archive.contractId, 'archive', `建档 ${archiveId} 已补充信息`, info);
    EventBus.emit('archive:changed', { archiveId, action: 'supplemented', from: prev, to: '已补充' });
    return archive;
  },

  closeArchive(archiveId, operator, role) {
    const archive = this._cache.archives.find(a => a.id === archiveId);
    if (!archive) return null;
    const prev = archive.status;
    archive.status = '已关闭';
    archive.updatedAt = this._now();
    archive.history.push({ action: '关闭建档', by: operator, role, at: this._now(), detail: '建档完成' });
    this._persist();
    this._addNotification(archive.contractId, 'archive', `建档 ${archiveId} 已关闭`, '');
    EventBus.emit('archive:changed', { archiveId, action: 'closed', from: prev, to: '已关闭' });
    return archive;
  },

  reopenArchive(archiveId, operator, role) {
    const archive = this._cache.archives.find(a => a.id === archiveId);
    if (!archive) return null;
    const prev = archive.status;
    archive.status = '建档中';
    archive.updatedAt = this._now();
    archive.history.push({ action: '重新建档', by: operator, role, at: this._now(), detail: `从 ${prev} 恢复` });
    this._persist();
    EventBus.emit('archive:changed', { archiveId, action: 'reopened', from: prev, to: '建档中' });
    return archive;
  },

  batchAddContracts(contractsData, operator, role) {
    const results = [];
    contractsData.forEach(data => {
      const contract = this.addContract({ ...data, assignedDoctor: operator });
      results.push(contract);
    });
    return results;
  },

  _addRecent(type, id, label) {
    const existing = this._cache.recentItems.findIndex(r => r.type === type && r.id === id);
    if (existing !== -1) this._cache.recentItems.splice(existing, 1);
    this._cache.recentItems.unshift({ type, id, label, openedAt: this._now() });
    if (this._cache.recentItems.length > 20) this._cache.recentItems = this._cache.recentItems.slice(0, 20);
    this._persist();
  },

  addRecent(type, id, label) {
    this._addRecent(type, id, label);
  },

  _addNotification(contractId, sourceType, title, detail) {
    this._cache.notifications.unshift({
      id: Date.now() + Math.random(),
      contractId,
      sourceType,
      title,
      detail,
      read: false,
      createdAt: this._now()
    });
    if (this._cache.notifications.length > 50) this._cache.notifications = this._cache.notifications.slice(0, 50);
    this._persist();
    EventBus.emit('notification:new', { contractId, title });
  },

  markNotificationRead(notifId) {
    const n = this._cache.notifications.find(n => n.id === notifId);
    if (n) { n.read = true; this._persist(); }
  },

  markAllNotificationsRead() {
    this._cache.notifications.forEach(n => n.read = true);
    this._persist();
  },

  clearAllData() {
    localStorage.removeItem('chs_contracts');
    localStorage.removeItem('chs_archives');
    localStorage.removeItem('chs_notifications');
    localStorage.removeItem('chs_recentItems');
    this._cache = { contracts: [], archives: [], notifications: [], recentItems: [] };
    this._seedDemoData();
  }
};

window.EventBus = EventBus;
window.Store = Store;
