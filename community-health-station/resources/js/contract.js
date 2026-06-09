const ContractModule = {
  _currentFilter: 'all',
  _searchTerm: '',

  render() {
    const contracts = Store.getContracts();
    const role = App.getCurrentRole();
    const filtered = contracts.filter(c => {
      if (this._currentFilter !== 'all' && c.status !== this._currentFilter) return false;
      if (this._searchTerm) {
        const s = this._searchTerm.toLowerCase();
        return c.familyHead.name.toLowerCase().includes(s) || c.id.toLowerCase().includes(s);
      }
      return true;
    });

    const statusCounts = { all: contracts.length, '待处理': 0, '处理中': 0, '已退回': 0, '已补充': 0, '已关闭': 0 };
    contracts.forEach(c => { if (statusCounts[c.status] !== undefined) statusCounts[c.status]++; });
    document.getElementById('contractBadge').textContent = statusCounts['待处理'] + statusCounts['已退回'];

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">签约列表</div>
          <div class="btn-group">
            ${role === '全科医生' ? '<button class="btn btn-primary btn-sm" onclick="ContractModule.showCreateForm()">+ 新建签约</button>' : ''}
          </div>
        </div>
        <div class="filter-bar">
          <input type="text" placeholder="搜索户主姓名或编号..." value="${this._searchTerm}" oninput="ContractModule._searchTerm=this.value;App.refreshPage()">
          <select onchange="ContractModule._currentFilter=this.value;App.refreshPage()">
            <option value="all" ${this._currentFilter==='all'?'selected':''}>全部 (${statusCounts.all})</option>
            <option value="待处理" ${this._currentFilter==='待处理'?'selected':''}>待处理 (${statusCounts['待处理']})</option>
            <option value="处理中" ${this._currentFilter==='处理中'?'selected':''}>处理中 (${statusCounts['处理中']})</option>
            <option value="已退回" ${this._currentFilter==='已退回'?'selected':''}>已退回 (${statusCounts['已退回']})</option>
            <option value="已补充" ${this._currentFilter==='已补充'?'selected':''}>已补充 (${statusCounts['已补充']})</option>
            <option value="已关闭" ${this._currentFilter==='已关闭'?'selected':''}>已关闭 (${statusCounts['已关闭']})</option>
          </select>
        </div>
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">暂无签约记录</div></div>' : `
        <table>
          <thead>
            <tr>
              <th>编号</th>
              <th>户主</th>
              <th>签约类型</th>
              <th>全科医生</th>
              <th>护士</th>
              <th>状态</th>
              <th>更新时间</th>
              <th>关联档案</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(c => `
              <tr onclick="ContractModule.showDetail('${c.id}')">
                <td><strong>${c.id}</strong></td>
                <td>${c.familyHead.name}</td>
                <td>${c.contractType}</td>
                <td>${c.assignedDoctor}</td>
                <td>${c.assignedNurse}</td>
                <td>${this._statusBadge(c.status)}</td>
                <td>${c.updatedAt}</td>
                <td>${this._archiveLink(c.id)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      </div>
    `;
  },

  _statusBadge(status) {
    const cls = { '待处理': 'status-pending', '处理中': 'status-processing', '已退回': 'status-returned', '已补充': 'status-supplemented', '已关闭': 'status-closed' };
    return `<span class="status-badge ${cls[status] || ''}">${status}</span>`;
  },

  _archiveLink(contractId) {
    const archives = Store.getArchivesByContract(contractId);
    if (archives.length === 0) return '<span style="color:var(--text-light);font-size:12px">未建档</span>';
    return archives.map(a => `<a class="archive-linked" onclick="event.stopPropagation();App.navigateTo('archive-detail','${a.id}')">${a.id.slice(-3)}</a>`).join(' ');
  },

  showCreateForm() {
    const operators = this._getOperators();
    App.showModal('新建家庭签约', `
      <div class="form-group">
        <label>户主姓名</label>
        <input type="text" id="cf_headName" placeholder="请输入户主姓名" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>身份证号</label>
          <input type="text" id="cf_headIdCard" placeholder="18位身份证号" maxlength="18">
        </div>
        <div class="form-group">
          <label>联系电话</label>
          <input type="text" id="cf_headPhone" placeholder="手机号码" maxlength="11">
        </div>
      </div>
      <div class="form-group">
        <label>签约类型</label>
        <select id="cf_contractType">
          <option value="基本">基本</option>
          <option value="中级" selected>中级</option>
          <option value="高级">高级</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>分配护士</label>
          <select id="cf_nurse">
            ${operators.nurses.map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>分配公卫专员</label>
          <select id="cf_phs">
            ${operators.phs.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>家庭成员</label>
        <div id="cf_members"></div>
        <button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="ContractModule._addMemberRow()">+ 添加成员</button>
      </div>
      <div class="form-group">
        <label>初始备注</label>
        <textarea id="cf_note" placeholder="签约相关备注，将同步至档案建档"></textarea>
      </div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '创建签约', class: 'btn btn-primary', action: 'ContractModule.doCreate()' }
    ]);
  },

  _getOperators() {
    return {
      gps: ['陈志远', '张伟'],
      nurses: ['刘芳', '王静'],
      phs: ['孙丽华', '周敏']
    };
  },

  _addMemberRow() {
    const container = document.getElementById('cf_members');
    const idx = container.children.length;
    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.marginBottom = '8px';
    row.innerHTML = `
      <input type="text" placeholder="姓名" class="cf-member-name">
      <div style="display:flex;gap:6px">
        <select class="cf-member-relation" style="flex:1">
          <option value="配偶">配偶</option>
          <option value="子女">子女</option>
          <option value="父母">父母</option>
          <option value="其他">其他</option>
        </select>
        <button class="btn btn-outline btn-sm" onclick="this.closest('.form-row').remove()">移除</button>
      </div>
    `;
    container.appendChild(row);
  },

  doCreate() {
    const name = document.getElementById('cf_headName').value.trim();
    if (!name) { App.toast('请输入户主姓名'); return; }
    const role = App.getCurrentRole();
    const operator = App.getOperatorName();
    const operators = this._getOperators();
    const data = {
      familyHead: {
        name,
        idCard: document.getElementById('cf_headIdCard').value.trim(),
        phone: document.getElementById('cf_headPhone').value.trim()
      },
      members: [],
      contractType: document.getElementById('cf_contractType').value,
      assignedDoctor: operator,
      assignedNurse: document.getElementById('cf_nurse').value,
      assignedPHS: document.getElementById('cf_phs').value
    };

    document.querySelectorAll('#cf_members .form-row').forEach(row => {
      const mName = row.querySelector('.cf-member-name').value.trim();
      const mRelation = row.querySelector('.cf-member-relation').value;
      if (mName) data.members.push({ name: mName, relation: mRelation, idCard: '', phone: '' });
    });

    const contract = Store.addContract(data);

    const noteText = document.getElementById('cf_note').value.trim();
    if (noteText) {
      Store.addContractNote(contract.id, { author: operator, role, content: noteText });
    }

    App.closeModal();
    App.toast(`签约 ${contract.id} 已创建`);
    App.refreshPage();
  },

  showDetail(contractId) {
    Store.addRecent('contract', contractId, this._getContractLabel(contractId));
    App.navigateTo('contract-detail', contractId);
  },

  _getContractLabel(id) {
    const c = Store.getContract(id);
    return c ? `${c.familyHead.name}-${c.contractType}` : id;
  },

  renderDetail(contractId) {
    const contract = Store.getContract(contractId);
    if (!contract) return '<div class="empty-state">签约不存在</div>';

    const role = App.getCurrentRole();
    const operator = App.getOperatorName();
    const archives = Store.getArchivesByContract(contractId);
    const canProcess = (role === '全科医生' && (contract.status === '待处理' || contract.status === '已补充'));
    const canReturn = (role === '全科医生' && contract.status === '处理中');
    const canSupplement = (role === '全科医生' || role === '护士') && contract.status === '已退回';
    const canClose = (role === '全科医生' && contract.status === '处理中');
    const canReopen = (role === '全科医生' && (contract.status === '已退回' || contract.status === '已补充'));
    const canModify = (role === '全科医生' && contract.status === '处理中');
    const canAddNote = (role === '全科医生' || role === '护士') && contract.status !== '已关闭';
    const canCreateArchive = (role === '公共卫生专员' && contract.status !== '已关闭' && archives.length === 0);

    return `
      <div class="split-view">
        <div>
          <div class="card">
            <div class="card-header">
              <div>
                <span class="card-title">签约 ${contract.id}</span>
                <span style="margin-left:8px">${this._statusBadge(contract.status)}</span>
              </div>
              <div class="btn-group">
                ${canProcess ? `<button class="btn btn-primary btn-sm" onclick="ContractModule.doProcess('${contractId}')">接单处理</button>` : ''}
                ${canReopen ? `<button class="btn btn-warning btn-sm" onclick="ContractModule.doReopen('${contractId}')">重新处理</button>` : ''}
                ${canReturn ? `<button class="btn btn-danger btn-sm" onclick="ContractModule.showReturnForm('${contractId}')">退回</button>` : ''}
                ${canSupplement ? `<button class="btn btn-warning btn-sm" onclick="ContractModule.showSupplementForm('${contractId}')">补充信息</button>` : ''}
                ${canClose ? `<button class="btn btn-success btn-sm" onclick="ContractModule.doClose('${contractId}')">关闭签约</button>` : ''}
                ${canModify ? `<button class="btn btn-outline btn-sm" onclick="ContractModule.showModifyForm('${contractId}')">修改</button>` : ''}
                ${canCreateArchive ? `<button class="btn btn-primary btn-sm" onclick="ContractModule.doCreateArchive('${contractId}')">创建建档</button>` : ''}
              </div>
            </div>
            ${contract.returnReason ? `<div class="change-alert"><span class="change-alert-icon">⚠️</span><div><div class="change-alert-text">退回原因：${contract.returnReason}</div></div></div>` : ''}
            <div class="detail-grid">
              <div class="detail-item"><div class="detail-label">户主</div><div class="detail-value">${contract.familyHead.name}</div></div>
              <div class="detail-item"><div class="detail-label">身份证号</div><div class="detail-value">${contract.familyHead.idCard || '-'}</div></div>
              <div class="detail-item"><div class="detail-label">联系电话</div><div class="detail-value">${contract.familyHead.phone || '-'}</div></div>
              <div class="detail-item"><div class="detail-label">签约类型</div><div class="detail-value">${contract.contractType}</div></div>
              <div class="detail-item"><div class="detail-label">全科医生</div><div class="detail-value">${contract.assignedDoctor}</div></div>
              <div class="detail-item"><div class="detail-label">护士</div><div class="detail-value">${contract.assignedNurse}</div></div>
              <div class="detail-item"><div class="detail-label">公卫专员</div><div class="detail-value">${contract.assignedPHS}</div></div>
              <div class="detail-item"><div class="detail-label">创建时间</div><div class="detail-value">${contract.createdAt}</div></div>
            </div>
            ${contract.members.length > 0 ? `
              <div style="margin-top:12px">
                <div class="detail-label">家庭成员</div>
                <div style="margin-top:4px">${contract.members.map(m => `<span class="member-tag">${m.relation}: ${m.name}</span>`).join('')}</div>
              </div>
            ` : ''}
            ${contract.supplementInfo ? `
              <div style="margin-top:12px">
                <div class="detail-label">补充信息</div>
                <div style="margin-top:4px;padding:8px 12px;background:#f0fdf4;border-radius:6px;font-size:13px">${contract.supplementInfo}</div>
              </div>
            ` : ''}
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">备注</div>
              ${canAddNote ? '<button class="btn btn-outline btn-sm" onclick="ContractModule.showAddNoteForm(\'' + contractId + '\')">+ 添加备注</button>' : ''}
            </div>
            ${contract.notes.length === 0 ? '<div style="color:var(--text-light);font-size:13px">暂无备注</div>' :
              contract.notes.map(n => `
                <div class="note-item">
                  <div class="note-header">
                    <span class="note-author">${n.author}（${n.role}）</span>
                    <span class="note-time">${n.createdAt}</span>
                  </div>
                  <div class="note-content">${n.content}</div>
                </div>
              `).join('')}
            <div style="margin-top:8px;font-size:11px;color:var(--text-light)">备注会自动同步至关联的档案建档记录</div>
          </div>
        </div>

        <div>
          ${archives.length > 0 ? archives.map(a => `
            <div class="card" style="cursor:pointer" onclick="App.navigateTo('archive-detail','${a.id}')">
              <div class="card-header">
                <div class="card-title">关联档案 ${a.id}</div>
                ${ArchiveModule._statusBadge(a.status)}
              </div>
              <div class="detail-grid">
                <div class="detail-item"><div class="detail-label">建档人</div><div class="detail-value">${a.createdBy}</div></div>
                <div class="detail-item"><div class="detail-label">更新时间</div><div class="detail-value">${a.updatedAt}</div></div>
              </div>
              ${a.healthRecords.length > 0 ? `
                <div style="margin-top:10px">
                  <div class="detail-label">健康记录</div>
                  ${a.healthRecords.map(h => `
                    <div class="health-record-row">
                      <span class="hr-name">${h.memberName}</span>
                      <span class="hr-type">${h.recordType}</span>
                      <span class="hr-detail">${h.detail}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              <div style="margin-top:8px;font-size:12px;color:var(--primary)">点击查看详情 →</div>
            </div>
          `).join('') : `
            <div class="card">
              <div style="text-align:center;padding:20px;color:var(--text-light)">
                <div style="font-size:24px;margin-bottom:8px">📁</div>
                <div>尚未创建建档记录</div>
                ${role === '公共卫生专员' && contract.status !== '已关闭' ? '<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="ContractModule.doCreateArchive(\'' + contractId + '\')">创建建档</button>' : ''}
              </div>
            </div>
          `}

          <div class="card">
            <div class="card-header"><div class="card-title">操作历史</div></div>
            ${contract.history.slice().reverse().map(h => `
              <div class="history-item">
                <span class="history-time">${h.at}</span>
                <span class="history-action">${h.action}</span>
                <span class="history-by">${h.by}（${h.role}）</span>
                ${h.detail ? `<span class="history-detail">${h.detail}</span>` : ''}
              </div>
            `).join('')}
          </div>

          <div style="padding:8px 0;font-size:12px;color:var(--text-light)">
            当前角色：${role} | ${this._getRoleActionHint(role, contract.status)}
          </div>
        </div>
      </div>
    `;
  },

  _getRoleActionHint(role, status) {
    const hints = {
      '全科医生': {
        '待处理': '可接单处理',
        '处理中': '可退回、修改、关闭签约',
        '已退回': '可补充信息或重新处理',
        '已补充': '可重新处理',
        '已关闭': '签约已结束'
      },
      '护士': {
        '待处理': '等待全科医生处理',
        '处理中': '可添加备注',
        '已退回': '可补充信息',
        '已补充': '等待全科医生重新处理',
        '已关闭': '签约已结束'
      },
      '公共卫生专员': {
        '待处理': '等待签约处理完成后建档',
        '处理中': '可创建建档记录',
        '已退回': '等待签约方补充信息',
        '已补充': '等待全科医生重新处理',
        '已关闭': '可查看关联档案'
      }
    };
    return (hints[role] && hints[role][status]) || '';
  },

  doProcess(contractId) {
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.processContract(contractId, operator, role);
    App.toast(`签约 ${contractId} 已接单处理`);
    App.refreshPage();
  },

  showReturnForm(contractId) {
    App.showModal('退回签约', `
      <div class="form-group">
        <label>退回原因</label>
        <textarea id="returnReason" placeholder="请详细说明退回原因，便于后续补充" required></textarea>
      </div>
      <div style="font-size:12px;color:var(--text-light);margin-top:8px">退回后，关联的档案建档也会联动标记为"退回补录"</div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '确认退回', class: 'btn btn-danger', action: `ContractModule.doReturn('${contractId}')` }
    ]);
  },

  doReturn(contractId) {
    const reason = document.getElementById('returnReason').value.trim();
    if (!reason) { App.toast('请输入退回原因'); return; }
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.returnContract(contractId, reason, operator, role);
    App.closeModal();
    App.toast(`签约 ${contractId} 已退回`);
    App.refreshPage();
  },

  showSupplementForm(contractId) {
    App.showModal('补充信息', `
      <div class="form-group">
        <label>补充内容</label>
        <textarea id="supplementInfo" placeholder="请输入补充信息" required></textarea>
      </div>
      <div style="font-size:12px;color:var(--text-light);margin-top:8px">补充后签约状态变为"已补充"，关联档案也会联动更新</div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '确认补充', class: 'btn btn-warning', action: `ContractModule.doSupplement('${contractId}')` }
    ]);
  },

  doSupplement(contractId) {
    const info = document.getElementById('supplementInfo').value.trim();
    if (!info) { App.toast('请输入补充内容'); return; }
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.supplementContract(contractId, info, operator, role);
    App.closeModal();
    App.toast(`签约 ${contractId} 已补充信息`);
    App.refreshPage();
  },

  doClose(contractId) {
    if (!confirm('确认关闭此签约？')) return;
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.closeContract(contractId, operator, role);
    App.toast(`签约 ${contractId} 已关闭`);
    App.refreshPage();
  },

  doReopen(contractId) {
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.reopenContract(contractId, operator, role);
    App.toast(`签约 ${contractId} 已恢复处理`);
    App.refreshPage();
  },

  showModifyForm(contractId) {
    const contract = Store.getContract(contractId);
    if (!contract) return;
    App.showModal('修改签约信息', `
      <div class="form-row">
        <div class="form-group">
          <label>户主姓名</label>
          <input type="text" id="mf_headName" value="${contract.familyHead.name}">
        </div>
        <div class="form-group">
          <label>联系电话</label>
          <input type="text" id="mf_headPhone" value="${contract.familyHead.phone}">
        </div>
      </div>
      <div class="form-group">
        <label>签约类型</label>
        <select id="mf_contractType">
          <option value="基本" ${contract.contractType==='基本'?'selected':''}>基本</option>
          <option value="中级" ${contract.contractType==='中级'?'selected':''}>中级</option>
          <option value="高级" ${contract.contractType==='高级'?'selected':''}>高级</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>分配护士</label>
          <select id="mf_nurse">
            ${this._getOperators().nurses.map(n => `<option value="${n}" ${contract.assignedNurse===n?'selected':''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>分配公卫专员</label>
          <select id="mf_phs">
            ${this._getOperators().phs.map(p => `<option value="${p}" ${contract.assignedPHS===p?'selected':''}>${p}</option>`).join('')}
          </div>
      </div>
      <div style="font-size:12px;color:var(--text-light);margin-top:8px">修改后，关联档案建档侧会收到变更通知</div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '确认修改', class: 'btn btn-primary', action: `ContractModule.doModify('${contractId}')` }
    ]);
  },

  doModify(contractId) {
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.modifyContract(contractId, {
      familyHead: {
        ...Store.getContract(contractId).familyHead,
        name: document.getElementById('mf_headName').value.trim(),
        phone: document.getElementById('mf_headPhone').value.trim()
      },
      contractType: document.getElementById('mf_contractType').value,
      assignedNurse: document.getElementById('mf_nurse').value,
      assignedPHS: document.getElementById('mf_phs').value
    }, operator, role);
    App.closeModal();
    App.toast(`签约 ${contractId} 已修改，档案侧已收到通知`);
    App.refreshPage();
  },

  showAddNoteForm(contractId) {
    App.showModal('添加备注', `
      <div class="form-group">
        <label>备注内容</label>
        <textarea id="noteContent" placeholder="请输入备注，此备注将同步至关联的档案建档"></textarea>
      </div>
    `, [
      { text: '取消', class: 'btn btn-outline', action: 'App.closeModal()' },
      { text: '添加', class: 'btn btn-primary', action: `ContractModule.doAddNote('${contractId}')` }
    ]);
  },

  doAddNote(contractId) {
    const content = document.getElementById('noteContent').value.trim();
    if (!content) { App.toast('请输入备注内容'); return; }
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    Store.addContractNote(contractId, { author: operator, role, content });
    App.closeModal();
    App.toast('备注已添加，已同步至关联档案');
    App.refreshPage();
  },

  doCreateArchive(contractId) {
    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    const archive = Store.addArchive(contractId, operator, role);
    App.toast(`建档记录 ${archive.id} 已创建，签约备注已自动继承`);
    App.refreshPage();
  }
};

window.ContractModule = ContractModule;
