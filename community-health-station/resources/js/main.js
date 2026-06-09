const App = {
  _currentPage: 'contract-list',
  _currentParam: null,
  _roleOperators: {
    '全科医生': ['陈志远', '张伟'],
    '护士': ['刘芳', '王静'],
    '公共卫生专员': ['孙丽华', '周敏']
  },
  _operatorIndex: { '全科医生': 0, '护士': 0, '公共卫生专员': 0 },

  init() {
    Store.init();
    ArchiveModule.init();

    document.querySelectorAll('#nav .nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.page;
        if (page) this.navigateTo(page);
      });
    });

    document.getElementById('currentRole').addEventListener('change', (e) => {
      this._updateRoleDisplay();
      this.refreshPage();
    });

    document.getElementById('notificationBell').addEventListener('click', () => {
      const panel = document.getElementById('notifPanel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      this._renderNotifications();
    });

    document.getElementById('btnMarkAllRead').addEventListener('click', () => {
      Store.markAllNotificationsRead();
      this._renderNotifications();
      this._updateNotifCount();
    });

    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') this.closeModal();
    });

    document.getElementById('btnResetData').addEventListener('click', () => {
      if (confirm('确认重置所有数据？将恢复初始演示数据。')) {
        Store.clearAllData();
        this.refreshPage();
        this.toast('数据已重置');
      }
    });

    EventBus.on('notification:new', () => {
      this._updateNotifCount();
    });

    EventBus.on('contract:changed', (data) => {
      if (this._currentPage === 'archive-list' || (this._currentPage === 'archive-detail')) {
        this.refreshPage();
      }
    });

    this._updateRoleDisplay();
    this._updateNotifCount();
    this.refreshPage();
  },

  getCurrentRole() {
    return document.getElementById('currentRole').value;
  },

  getOperatorName() {
    const role = this.getCurrentRole();
    const ops = this._roleOperators[role];
    const idx = this._operatorIndex[role] || 0;
    return ops[idx % ops.length];
  },

  _updateRoleDisplay() {
    const role = this.getCurrentRole();
    const badge = document.getElementById('roleBadge');
    const nameEl = document.getElementById('operatorName');

    badge.textContent = role;
    badge.className = 'role-badge';
    if (role === '全科医生') badge.classList.add('role-gp');
    else if (role === '护士') badge.classList.add('role-nurse');
    else badge.classList.add('role-phs');

    nameEl.textContent = this.getOperatorName();

    nameEl.style.cursor = 'pointer';
    nameEl.title = '点击切换同角色人员';
    nameEl.onclick = () => {
      const idx = this._operatorIndex[role] || 0;
      this._operatorIndex[role] = (idx + 1) % this._roleOperators[role].length;
      nameEl.textContent = this.getOperatorName();
    };
  },

  navigateTo(page, param) {
    this._currentPage = page;
    this._currentParam = param || null;

    document.querySelectorAll('#nav .nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page || (page.includes('detail') && el.dataset.page === page.split('-')[0] + '-list'));
    });

    this.refreshPage();
  },

  refreshPage() {
    const content = document.getElementById('content');
    const title = document.getElementById('pageTitle');
    const subtitle = document.getElementById('pageSubtitle');

    switch (this._currentPage) {
      case 'contract-list':
        title.textContent = '家庭签约';
        subtitle.textContent = '';
        content.innerHTML = ContractModule.render();
        break;
      case 'contract-detail':
        title.textContent = '家庭签约';
        subtitle.textContent = '签约详情';
        content.innerHTML = ContractModule.renderDetail(this._currentParam);
        break;
      case 'archive-list':
        title.textContent = '档案建档';
        subtitle.textContent = '';
        content.innerHTML = ArchiveModule.render();
        break;
      case 'archive-detail':
        title.textContent = '档案建档';
        subtitle.textContent = '建档详情';
        content.innerHTML = ArchiveModule.renderDetail(this._currentParam);
        break;
      case 'batch-entry':
        title.textContent = '批量录入';
        subtitle.textContent = '';
        content.innerHTML = BatchModule.render();
        break;
      case 'recent':
        title.textContent = '最近打开';
        subtitle.textContent = '';
        content.innerHTML = RecentModule.render();
        break;
      default:
        title.textContent = '家庭签约';
        subtitle.textContent = '';
        content.innerHTML = ContractModule.render();
    }
  },

  showModal(title, bodyHtml, buttons) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    const footer = document.getElementById('modalFooter');
    footer.innerHTML = '';
    buttons.forEach(btn => {
      const el = document.createElement('button');
      el.className = btn.class;
      el.textContent = btn.text;
      el.onclick = () => { eval(btn.action); };
      footer.appendChild(el);
    });
    document.getElementById('modal').style.display = 'flex';
  },

  closeModal() {
    document.getElementById('modal').style.display = 'none';
  },

  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3000);
  },

  _updateNotifCount() {
    const notifs = Store.getNotifications();
    const unread = notifs.filter(n => !n.read).length;
    const countEl = document.getElementById('notifCount');
    if (unread > 0) {
      countEl.textContent = unread;
      countEl.style.display = 'inline-block';
    } else {
      countEl.style.display = 'none';
    }
  },

  _renderNotifications() {
    const notifs = Store.getNotifications().slice(0, 20);
    const list = document.getElementById('notifList');
    if (notifs.length === 0) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-light)">暂无通知</div>';
      return;
    }
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="App._handleNotifClick(${n.id}, '${n.sourceType}', '${n.contractId}')">
        <div class="notif-item-title">${n.title}</div>
        ${n.detail ? `<div class="notif-item-detail">${n.detail}</div>` : ''}
        <div class="notif-item-time">${n.createdAt}</div>
      </div>
    `).join('');
  },

  _handleNotifClick(notifId, sourceType, contractId) {
    Store.markNotificationRead(notifId);
    this._updateNotifCount();
    if (sourceType === 'contract') {
      this.navigateTo('contract-detail', contractId);
    } else {
      const archives = Store.getArchivesByContract(contractId);
      if (archives.length > 0) {
        this.navigateTo('archive-detail', archives[0].id);
      } else {
        this.navigateTo('contract-detail', contractId);
      }
    }
    document.getElementById('notifPanel').style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
