const ArchiveModule = {
  _currentFilter: 'all',
  _priorityFilter: 'all',
  _typeFilter: 'all',
  _searchTerm: '',

  init() {},

  _getUnconfirmedCount(archive) {
    if (!archive.changeAlerts) return 0;
    return archive.changeAlerts.filter(ca => !ca.confirmed).length;
  },

  _getHighestPriority(archive) {
    if (!archive.changeAlerts) return null;
    const unconfirmed = archive.changeAlerts.filter(ca => !ca.confirmed);
    if (unconfirmed.length === 0) return null;
    const order = { high: 0, medium: 1, low: 2 };
    return unconfirmed.sort((a, b) => (order[a.priority] || 1) - (order[b.priority] || 1))[0].priority;
  },

  _getLastChangedAt(archive) {
    if (!archive.changeAlerts) return '';
    const unconfirmed = archive.changeAlerts.filter(ca => !ca.confirmed);
    if (unconfirmed.length === 0) return archive.updatedAt;
    return unconfirmed.sort((a, b) => b.lastChangedAt.localeCompare(a.lastChangedAt))[0].lastChangedAt;
  },

  _getResponsiblePerson(archive) {
    const contract = Store.getContract(archive.contractId);
    return contract ? contract.assignedPHS : archive.createdBy;
  },

  _priorityBadge(priority) {
    const cls = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
    const labels = { high: '高', medium: '中', low: '低' };
    return `<span class="priority-badge ${cls[priority] || ''}">${labels[priority] || priority}</span>`;
  },

  _typeLabel(type) {
    const labels = {
      'note_synced': '备注同步',
      'contract_returned': '签约退回',
      'contract_supplemented': '签约补充',
      'contract_modified': '签约修改',
      'contract_reopened': '签约恢复'
    };
    return labels[type] || type;
  },

  render() {
    const archives = Store.getArchives();
    const unconfirmedTotal = archives.filter(a => this._getUnconfirmedCount(a) > 0).length;

    const highCount = archives.filter(a => this._getHighestPriority(a) === 'high').length;

    const filtered = archives.filter(a => {
      if (this._currentFilter === '__unconfirmed__') {
        if (this._getUnconfirmedCount(a) === 0) return false;
      } else if (this._currentFilter !== 'all' && a.status !== this._currentFilter) {
        return false;
      }

      if (this._priorityFilter !== 'all') {
        const hp = this._getHighestPriority(a);
        const hasMatchingPriority = (a.changeAlerts || []).filter(ca => !ca.confirmed).some(ca => ca.priority === this._priorityFilter);
        if (!hasMatchingPriority && hp !== this._priorityFilter) return false;
      }

      if (this._typeFilter !== 'all') {
        const hasMatchingType = (a.changeAlerts || []).filter(ca => !ca.confirmed).some(ca => ca.type === this._typeFilter);
        if (!hasMatchingType) return false;
      }

      if (this._searchTerm) {
        const s = this._searchTerm.toLowerCase();
        return a.familyHeadName.toLowerCase().includes(s) || a.id.toLowerCase().includes(s) || a.contractId.toLowerCase().includes(s);
      }
      return true;
    });

    const statusCounts = { all: archives.length, '待建档': 0, '建档中': 0, '退回补录': 0, '已补充': 0, '已关闭': 0 };
    archives.forEach(a => { if (statusCounts[a.status] !== undefined) statusCounts[a.status]++; });
    document.getElementById('archiveBadge').textContent = statusCounts['待建档'] + statusCounts['退回补录'] + unconfirmedTotal;

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">档案列表</div>
        </div>
        <div class="filter-bar">
          <input type="text" placeholder="搜索户主姓名、档案编号或签约编号..." value="${this._searchTerm}" oninput="ArchiveModule._searchTerm=this.value;App.refreshPage()">
          <select onchange="ArchiveModule._currentFilter=this.value;App.refreshPage()">
            <option value="all" ${this._currentFilter==='all'?'selected':''}>全部 (${statusCounts.all})</option>
            <option value="__unconfirmed__" ${this._currentFilter==='__unconfirmed__'?'selected':''}>未确认变更 (${unconfirmedTotal})</option>
            <option value="待建档" ${this._currentFilter==='待建档'?'selected':''}>待建档 (${statusCounts['待建档']})</option>
            <option value="建档中" ${this._currentFilter==='建档中'?'selected':''}>建档中 (${statusCounts['建档中']})</option>
            <option value="退回补录" ${this._currentFilter==='退回补录'?'selected':''}>退回补录 (${statusCounts['退回补录']})</option>
            <option value="已补充" ${this._currentFilter==='已补充'?'selected':''}>已补充 (${statusCounts['已补充']})</option>
            <option value="已关闭" ${this._currentFilter==='已关闭'?'selected':''}>已关闭 (${statusCounts['已关闭']})</option>
          </select>
          <select onchange="ArchiveModule._priorityFilter=this.value;App.refreshPage()">
            <option value="all" ${this._priorityFilter==='all'?'selected':''}>全部优先级</option>
            <option value="high" ${this._priorityFilter==='high'?'selected':''}>高优先级 (${highCount})</option>
            <option value="medium" ${this._priorityFilter==='medium'?'selected':''}>中优先级</option>
            <option value="low" ${this._priorityFilter==='low'?'selected':''}>低优先级</option>
          </select>
          <select onchange="ArchiveModule._typeFilter=this.value;App.refreshPage()">
            <option value="all" ${this._typeFilter==='all'?'selected':''}>全部变更类型</option>
            <option value="contract_returned" ${this._typeFilter==='contract_returned'?'selected':''}>签约退回</option>
            <option value="contract_modified" ${this._typeFilter==='contract_modified'?'selected':''}>签约修改</option>
            <option value="note_synced" ${this._typeFilter==='note_synced'?'selected':''}>备注同步</option>
            <option value="contract_supplemented" ${this._typeFilter==='contract_supplemented'?'selected':''}>签约补充</option>
            <option value="contract_reopened" ${this._typeFilter==='contract_reopened'?'selected':''}>签约恢复</option>
          </select>
        </div>
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📁</div><div class="empty-state-text">暂无匹配的建档记录</div></div>' : `
        <table>
          <thead>
            <tr>
              <th>档案编号</th>
              <th>关联签约</th>
              <th>户主</th>
              <th>状态</th>
              <th>最高优先级</th>
              <th>签约变更</th>
              <th>最后变更</th>
              <th>建档人</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(a => {
              const unconfirmedCount = this._getUnconfirmedCount(a);
              const highestPriority = this._getHighestPriority(a);
              const lastChangedAt = this._getLastChangedAt(a);
              const unconfirmedTypes = [...new Set((a.changeAlerts || []).filter(ca => !ca.confirmed).map(ca => ca.type))];
              return `
                <tr onclick="ArchiveModule.showDetail('${a.id}')" ${highestPriority === 'high' ? 'style="background:#fffbeb"' : ''}>
                  <td><strong>${a.id}</strong></td>
                  <td><a class="archive-linked" onclick="event.stopPropagation();App.navigateTo('contract-detail','${a.contractId}')">${a.contractId}</a></td>
                  <td>${a.familyHeadName}</td>
                  <td>${this._statusBadge(a.status)}</td>
                  <td>${highestPriority ? this._priorityBadge(highestPriority) : '<span style="color:var(--text-light);font-size:12px">-</span>'}</td>
                  <td>${unconfirmedCount > 0 ? `<span class="contract-change-flag">⚡ ${unconfirmedCount}条未确认</span><br><span style="font-size:11px;color:var(--text-secondary)">${unconfirmedTypes.map(t => this._typeLabel(t)).join('、')}</span>` : '<span style="color:var(--text-light);font-size:12px">-</span>'}</td>
                  <td style="font-size:12px">${lastChangedAt || '-'}</td>
                  <td>${a.createdBy}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>`}
      </div>
    `;
  },

  _statusBadge(status) {
    const cls = { '待建档': 'status-archive-pending', '建档中': 'status-archive-processing', '退回补录': 'status-archive-returned', '已补充': 'status-archive-supplemented', '已关闭': 'status-closed' };
    return `<span class="status-badge ${cls[status] || ''}">${status}</span>`;
  },

  showDetail(archiveId) {
    Store.addRecent('archive', archiveId, this._getArchiveLabel(archiveId));
    App.navigateTo('archive-detail', archiveId);
  },

  _getArchiveLabel(id) {
    const a = Store.getArchive(id);
    return a ? `${a.familyHeadName}-建档` : id;
  },

  renderDetail(archiveId) {
    const archive = Store.getArchive(archiveId);
    if (!archive) return '<div class="empty-state">档案不存在</div>';

    const contract = Store.getContract(archive.contractId);
    const role = App.getCurrentRole();
    const operator = App.getOperatorName();

    const canProcess = (role === '公共卫生专员') && (archive.status === '待建档' || archive.status === '已补充');
    const canReturn = (role === '公共卫生专员') && archive.status === '建档中';
    const canSupplement = (role === '公共卫生专员' || role === '护士') && archive.status === '退回补录';
    const canClose = (role === '公共卫生专员') && archive.status === '建档中';
    const canReopen = (role === '公共卫生专员') && (archive.status === '退回补录' || archive.status === '已补充');
    const canAddNote = (role === '公共卫生专员' || role === '护士') && archive.status !== '已关闭';
    const canAddHealthRecord = (role === '公共卫生专员') && archive.status === '建档中';

    const unconfirmedAlerts = (archive.changeAlerts || []).filter(ca => !ca.confirmed);
    const confirmedAlerts = (archive.changeAlerts || []).filter(ca => ca.confirmed);
    const hasHighPriority = unconfirmedAlerts.some(ca => ca.priority === 'high');
    const sortedUnconfirmed = [...unconfirmedAlerts].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] || 1) - (order[b.priority] || 1);
    });

    return `
      <div class="split-view">
        <div>
          ${sortedUnconfirmed.length > 0 ? `
            <div class="card" style="border:2px solid ${hasHighPriority ? '#dc2626' : '#f59e0b'};background:${hasHighPriority ? '#fef2f2' : '#fffbeb'}">
              <div class="card-header">
                <div class="card-title" style="color:${hasHighPriority ? '#991b1b' : '#92400e'}">
                  ${hasHighPriority ? '🔴' : '⚡'} 签约变更提醒（${sortedUnconfirmed.length}条未确认${hasHighPriority ? '，含高优先级' : ''}）
                </div>
                <button class="btn ${hasHighPriority ? 'btn-danger' : 'btn-warning'} btn-sm" onclick="ArchiveModule.doConfirmAllAlerts('${archiveId}')">全部已知悉</button>
              </div>
              ${sortedUnconfirmed.map(ca => `
                <div class="change-alert" style="margin-bottom:8px;${ca.priority === 'high' ? 'border-left:3px solid #dc2626;' : ''}">
                  <div style="display:flex;align-items:flex-start;gap:8px">
                    <div style="flex-shrink:0;margin-top:2px">${this._priorityBadge(ca.priority)}</div>
                    <div style="flex:1">
                      <div style="display:flex;justify-content:space-between;align-items:center">
                        <div class="change-alert-text"><strong>${ca.title}</strong> <span style="font-size:11px;color:var(--text-light)">${this._typeLabel(ca.type)}</span></div>
                      </div>
                      <div style="font-size:12px;color:${ca.priority === 'high' ? '#7f1d1d' : '#78350f'}">${ca.detail}</div>
                      <div style="font-size:11px;color:${ca.priority === 'high' ? '#991b1b' : '#92400e'};margin-top:2px">
                        优先级来源：${ca.priorityReason || '-'}
                      </div>
                      <div class="change-alert-time">变更时间：${ca.lastChangedAt || ca.createdAt}</div>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="ArchiveModule.doConfirmAlert('${archiveId}','${ca.id}')" style="flex-shrink:0">已知悉</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="card">
            <div class="card-header">
              <div>
                <span class="card-title">档案 ${archive.id}</span>
                <span style="margin-left:8px">${this._statusBadge(archive.status)}</span>
              </div>
              <div class="btn-group">
                ${canProcess ? `<button class="btn btn-primary btn-sm" onclick="ArchiveModule.doProcess('${archiveId}')">接单建档</button>` : ''}
                ${canReopen ? `<button class="btn btn-warning btn-sm" onclick="ArchiveModule.doReopen('${archiveId}')">重新建档</button>` : ''}
                ${canReturn ? `<button class="btn btn-danger btn-sm" onclick="ArchiveModule.showReturnForm('${archiveId}')">退回补录</button>` : ''}
                ${canSupplement ? `<button class="btn btn-warning btn-sm" onclick="ArchiveModule.showSupplementForm('${archiveId}')">补充信息</button>` : ''}
                ${canClose ? `<button class="btn btn-success btn-sm" onclick="ArchiveModule.doClose('${archiveId}')">关闭建档</button>` : ''}
              </div>
            </div>
            ${archive.returnReason ? `<div class="change-alert"><span class="change-alert-icon">⚠️</span><div><div class="change-alert-text">${archive.returnReason}</div></div></div>` : ''}
            <div class="detail-grid">
              <div class="detail-item"><div class="detail-label">关联签约</div><div class="detail-value"><a class="archive-linked" onclick="App.navigateTo('contract-detail','${archive.contractId}')">${archive.contractId}</a></div></div>
              <div class="detail-item"><div class="detail-label">户主</div><div class="detail-value">${archive.familyHeadName}</div></div>
              <div class="detail-item"><div class="detail-label">建档人</div><div class="detail-value">${archive.createdBy}</div></div>
              <div class="detail-item"><div class="detail-label">处理人</div><div class="detail-value">${archive.processedBy || '-'}</div></div>
              <div class="detail-item"><div class="detail-label">创建时间</div><div class="detail-value">${archive.createdAt}</div></div>
              <div class="detail-item"><div class="detail-label">更新时间</div><div class="detail-value">${archive.updatedAt}</div></div>
            </div>
            ${archive.supplementInfo ? `
              <div style="margin-top:12px">
                <div class="detail-label">补充信息</div>
                <div style="margin-top:4px;padding:8px 12px;background:#f0fdf4;border-radius:6px;font-size:13px">${archive.supplementInfo}</div>
              </div>
            ` : ''}
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">健康记录</div>
              ${canAddHealthRecord ? '<button class="btn btn-outline btn-sm" onclick="ArchiveModule.showAddHealthRecordForm(\'' + archiveId + '\')">+ 添加记录</button>' : ''}
            </div>
            ${archive.healthRecords.length === 0 ? '<div style="color:var(--text-light);font-size:13px">暂无健康记录</div>' :
              archive.healthRecords.map(h => `
                <div class="health-record-row">
                  <span class="hr-name">${h.memberName}</span>
                  <span class="hr-type">${h.recordType}</span>
                  <span class="hr-detail">${h.detail}</span>
                  <span style="font-size:11px;color:var(--text-light)">${h.date}</span>
                </div>
              `).join('')}
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">建档备注</div>
              ${canAddNote ? '<button class="btn btn-outline btn-sm" onclick="ArchiveModule.showAddNoteForm(\'' + archiveId + '\')">+ 添加备注</button>' : ''}
            </div>
            ${archive.ownNotes.length === 0 ? '<div style="color:var(--text-light);font-size:13px">暂无建档备注</div>' :
              archive.ownNotes.map(n => `
                <div class="note-item">
                  <div class="note-header">
                    <span class="note-author">${n.author}（${n.role}）</span>
                    <span class="note-time">${n.createdAt}</span>
                  </div>
                  <div class="note-content">${n.content}</div>
                </div>
              `).join('')}
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">签约备注（继承）</div>
            </div>
            ${archive.inheritedNotes.length === 0 ? '<div style="color:var(--text-light);font-size:13px">暂无继承的签约备注</div>' :
              archive.inheritedNotes.map(n => `
                <div class="note-item inherited">
                  <div class="note-header">
                    <span class="note-author">${n.author}（${n.role}）</span>
                    <span class="note-time">${n.fromContractAt}</span>
                  </div>
                  <div class="note-content">${n.content}</div>
                  <div class="note-source">来源：家庭签约</div>
                </div>
              `).join('')}
            ${contract && contract.notes.length > archive.inheritedNotes.length ? `
              <div class="change-alert" style="margin-top:12px">
                <span class="change-alert-icon">⚡</span>
                <div>
                  <div class="change-alert-text">签约侧有新备注尚未同步，点击同步</div>
                  <button class="btn btn-outline btn-sm" style="margin-top:6px" onclick="ArchiveModule.syncNotes('${archiveId}')">同步签约备注</button>
                </div>
              </div>
            ` : ''}
          </div>

          ${confirmedAlerts.length > 0 ? `
            <div class="card">
              <div class="card-header"><div class="card-title">已确认变更记录</div></div>
              ${confirmedAlerts.map(ca => `
                <div style="padding:8px 12px;border-left:3px solid ${ca.priority === 'high' ? '#dc2626' : ca.priority === 'medium' ? '#d97706' : '#6b7280'};background:#f8fafc;border-radius:0 6px 6px 0;margin-bottom:6px">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:13px;font-weight:500">${ca.title} ${this._priorityBadge(ca.priority)}</span>
                    <span class="status-badge status-closed">已确认</span>
                  </div>
                  <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${ca.detail}</div>
                  <div style="font-size:11px;color:var(--text-light);margin-top:2px">
                    变更时间：${ca.lastChangedAt || ca.createdAt} → 确认人：${ca.confirmedBy}（${ca.confirmedAt}）
                  </div>
                  <div style="font-size:11px;color:var(--text-light)">
                    优先级：${ca.priority === 'high' ? '高' : ca.priority === 'medium' ? '中' : '低'} | 来源：${ca.priorityReason || '-'}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${contract ? `
            <div class="card" style="cursor:pointer" onclick="App.navigateTo('contract-detail','${contract.id}')">
              <div class="card-header">
                <div class="card-title">关联签约</div>
                ${ContractModule._statusBadge(contract.status)}
              </div>
              <div class="detail-grid">
                <div class="detail-item"><div class="detail-label">签约编号</div><div class="detail-value">${contract.id}</div></div>
                <div class="detail-item"><div class="detail-label">签约类型</div><div class="detail-value">${contract.contractType}</div></div>
                <div class="detail-item"><div class="detail-label">全科医生</div><div class="detail-value">${contract.assignedDoctor}</div></div>
                <div class="detail-item"><div class="detail-label">护士</div><div class="detail-value">${contract.assignedNurse}</div></div>
              </div>
              <div style="margin-top:8px;font-size:12px;color:var(--primary)">点击查看签约详情 →</div>
            </div>
          ` : ''}

          <div class="card">
            <div class="card-header"><div class="card-title">操作历史</div></div>
            ${archive.history.slice().reverse().map(h => `
              <div class="history-item">
                <span class="history-time">${h.at}</span>
                <span class="history-action">${h.action}</span>
                <span class="history-by">${h.by}（${h.role}）</span>
                ${h.detail ? `<span class="history-detail">${h.detail}</span>` : ''}
              </div>
            `).join('')}
          </div>

          <div style="padding:8px 0;font-size:12px;color:var(--text-light)">
            当前角色：${role} | ${this._getRoleActionHint(role, archive.status)}
          </div>
        </div>
      </div>
    `;
  },

  _getRoleActionHint(role, status) {
    const hints = {
      '全科医生': {
        '待建档': '等待公卫专员建档',
        '建档中': '档案处理中，签约备注持续同步',
        '退回补录': '档案需要补录信息',
        '已补充': '等待公卫专员重新建档',
        '已关闭': '建档已完成'
      },
      '护士': {
        '待建档': '等待公卫专员建档',
        '建档中': '可添加建档备注',
        '退回补录': '可补充信息',
        '已补充': '等待公卫专员重新建档',
        '已关闭': '建档已完成'
      },
      '公共卫生专员': {
        '待建档': '可接单建档',
        '建档中': '可添加健康记录、退回补录、关闭',
        '退回补录': '可补充信息或重新建档',
        '已补充': '可重新建档',
        '已关闭': '建档已完成'
      }
    };
    return (hints[role] && hints[role][status]) || '';
  },

  doProcess(archiveId) {
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.processArchive(archiveId, operator, role);
    App.toast(`档案 ${archiveId} 已接单建档`);
    App.refreshPage();
  },

  showReturnForm(archiveId) {
    App.showModal('退回补录', `
      <div class="form-group">
        <label>退回原因</label>
        <textarea id="archiveReturnReason" placeholder="请说明需要补录的内容" required></textarea>
      </div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '确认退回', class: 'btn btn-danger', action: `ArchiveModule.doReturn('${archiveId}')` }
    ]);
  },

  doReturn(archiveId) {
    const reason = document.getElementById('archiveReturnReason').value.trim();
    if (!reason) { App.toast('请输入退回原因'); return; }
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.returnArchive(archiveId, reason, operator, role);
    App.closeModal();
    App.toast(`档案 ${archiveId} 已退回补录`);
    App.refreshPage();
  },

  showSupplementForm(archiveId) {
    App.showModal('补充信息', `
      <div class="form-group">
        <label>补充内容</label>
        <textarea id="archiveSupplementInfo" placeholder="请输入补充信息" required></textarea>
      </div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '确认补充', class: 'btn btn-warning', action: `ArchiveModule.doSupplement('${archiveId}')` }
    ]);
  },

  doSupplement(archiveId) {
    const info = document.getElementById('archiveSupplementInfo').value.trim();
    if (!info) { App.toast('请输入补充内容'); return; }
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.supplementArchive(archiveId, info, operator, role);
    App.closeModal();
    App.toast(`档案 ${archiveId} 已补充信息`);
    App.refreshPage();
  },

  doClose(archiveId) {
    if (!confirm('确认关闭此建档记录？')) return;
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.closeArchive(archiveId, operator, role);
    App.toast(`档案 ${archiveId} 已关闭`);
    App.refreshPage();
  },

  doReopen(archiveId) {
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.reopenArchive(archiveId, operator, role);
    App.toast(`档案 ${archiveId} 已恢复建档`);
    App.refreshPage();
  },

  showAddNoteForm(archiveId) {
    App.showModal('添加建档备注', `
      <div class="form-group">
        <label>备注内容</label>
        <textarea id="archiveNoteContent" placeholder="请输入建档备注"></textarea>
      </div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '添加', class: 'btn btn-primary', action: `ArchiveModule.doAddNote('${archiveId}')` }
    ]);
  },

  doAddNote(archiveId) {
    const content = document.getElementById('archiveNoteContent').value.trim();
    if (!content) { App.toast('请输入备注内容'); return; }
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.addArchiveNote(archiveId, { author: operator, role, content });
    App.closeModal();
    App.toast('建档备注已添加');
    App.refreshPage();
  },

  showAddHealthRecordForm(archiveId) {
    const archive = Store.getArchive(archiveId);
    const contract = archive ? Store.getContract(archive.contractId) : null;
    const members = contract ? [contract.familyHead.name, ...contract.members.map(m => m.name)] : [];
    App.showModal('添加健康记录', `
      <div class="form-row">
        <div class="form-group">
          <label>家庭成员</label>
          <select id="hr_member">
            ${members.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>记录类型</label>
          <select id="hr_type">
            <option value="慢性病">慢性病</option>
            <option value="预防接种">预防接种</option>
            <option value="随访记录">随访记录</option>
            <option value="体检记录">体检记录</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>详细内容</label>
        <textarea id="hr_detail" placeholder="请输入健康记录详情"></textarea>
      </div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '添加', class: 'btn btn-primary', action: `ArchiveModule.doAddHealthRecord('${archiveId}')` }
    ]);
  },

  doAddHealthRecord(archiveId) {
    const memberName = document.getElementById('hr_member').value;
    const recordType = document.getElementById('hr_type').value;
    const detail = document.getElementById('hr_detail').value.trim();
    if (!detail) { App.toast('请输入详细内容'); return; }
    const archive = Store.getArchive(archiveId);
    const now = Store._now().split(' ')[0];
    archive.healthRecords.push({ memberName, recordType, detail, date: now });
    archive.updatedAt = Store._now();
    archive.history.push({ action: '添加健康记录', by: App.getOperatorName(), role: App.getCurrentRole(), at: Store._now(), detail: `${memberName} - ${recordType}` });
    Store.updateArchive(archiveId, { healthRecords: archive.healthRecords });
    App.closeModal();
    App.toast('健康记录已添加');
    App.refreshPage();
  },

  doConfirmAlert(archiveId, alertId) {
    const result = Store.confirmChangeAlert(archiveId, alertId);
    if (result) {
      App.toast(`变更已确认：${result.title}（${result.priority === 'high' ? '高' : result.priority === 'medium' ? '中' : '低'}优先级，确认人：${result.confirmedBy}）`);
    } else {
      App.toast('确认失败，变更可能已确认或不存在');
    }
    App.refreshPage();
  },

  doConfirmAllAlerts(archiveId) {
    const count = Store.confirmAllChangeAlerts(archiveId);
    if (count > 0) {
      App.toast(`已确认 ${count} 条变更提醒`);
    } else {
      App.toast('无需确认的变更');
    }
    App.refreshPage();
  },

  syncNotes(archiveId) {
    const archive = Store.getArchive(archiveId);
    const contract = Store.getContract(archive.contractId);
    if (!archive || !contract) return;
    let added = 0;
    contract.notes.forEach(cn => {
      if (!archive.inheritedNotes.some(in_ => in_.content === cn.content && in_.fromContractAt === cn.createdAt)) {
        archive.inheritedNotes.push({
          author: cn.author,
          role: cn.role,
          content: cn.content,
          fromContractAt: cn.createdAt
        });
        added++;
      }
    });
    if (added > 0) {
      archive.updatedAt = Store._now();
      archive.history.push({ action: '手动同步备注', by: App.getOperatorName(), role: App.getCurrentRole(), at: Store._now(), detail: `同步 ${added} 条签约备注` });
      Store.updateArchive(archiveId, { inheritedNotes: archive.inheritedNotes });
      App.toast(`已同步 ${added} 条签约备注`);
    } else {
      App.toast('无需同步，备注已是最新');
    }
    App.refreshPage();
  }
};

window.ArchiveModule = ArchiveModule;
