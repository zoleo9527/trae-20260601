const BatchModule = {
  _rows: [],
  _rowId: 0,

  render() {
    const role = App.getCurrentRole();
    const canBatch = role === '全科医生';
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">批量录入签约</div>
          ${canBatch ? `
            <div class="btn-group">
              <button class="btn btn-outline btn-sm" onclick="BatchModule.addRow()">+ 添加一行</button>
              <button class="btn btn-outline btn-sm" onclick="BatchModule.addSampleRows()">填充示例数据</button>
              <button class="btn btn-primary btn-sm" onclick="BatchModule.doBatchCreate()">批量创建</button>
            </div>
          ` : ''}
        </div>
        ${!canBatch ? '<div style="padding:20px;text-align:center;color:var(--text-light)"><div style="font-size:24px;margin-bottom:8px">🔒</div>批量录入仅限全科医生操作</div>' : `
        <div style="overflow-x:auto">
          <table class="batch-table">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>户主姓名</th>
                <th>身份证号</th>
                <th>联系电话</th>
                <th>签约类型</th>
                <th>分配护士</th>
                <th>分配公卫专员</th>
                <th>备注</th>
                <th style="width:60px">操作</th>
              </tr>
            </thead>
            <tbody id="batchTableBody">
              ${this._rows.map((row, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><input type="text" value="${row.headName}" onchange="BatchModule._rows[${i}].headName=this.value" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px"></td>
                  <td><input type="text" value="${row.idCard}" onchange="BatchModule._rows[${i}].idCard=this.value" style="width:130px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px"></td>
                  <td><input type="text" value="${row.phone}" onchange="BatchModule._rows[${i}].phone=this.value" style="width:110px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px"></td>
                  <td>
                    <select onchange="BatchModule._rows[${i}].contractType=this.value" style="padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px">
                      <option value="基本" ${row.contractType==='基本'?'selected':''}>基本</option>
                      <option value="中级" ${row.contractType==='中级'?'selected':''}>中级</option>
                      <option value="高级" ${row.contractType==='高级'?'selected':''}>高级</option>
                    </select>
                  </td>
                  <td>
                    <select onchange="BatchModule._rows[${i}].nurse=this.value" style="padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px">
                      ${ContractModule._getOperators().nurses.map(n => `<option value="${n}" ${row.nurse===n?'selected':''}>${n}</option>`).join('')}
                    </select>
                  </td>
                  <td>
                    <select onchange="BatchModule._rows[${i}].phs=this.value" style="padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px">
                      ${ContractModule._getOperators().phs.map(p => `<option value="${p}" ${row.phs===p?'selected':''}>${p}</option>`).join('')}
                    </select>
                  </td>
                  <td><input type="text" value="${row.note}" onchange="BatchModule._rows[${i}].note=this.value" style="width:150px;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:12px"></td>
                  <td><button class="btn btn-outline btn-sm" onclick="BatchModule.removeRow(${i})">删除</button></td>
                </tr>
              `).join('')}
              ${this._rows.length === 0 ? '<tr><td colspan="9" style="text-align:center;color:var(--text-light);padding:20px">点击"添加一行"开始批量录入</td></tr>' : ''}
            </tbody>
          </table>
        </div>
        `}
      </div>

      ${this._results.length > 0 ? `
        <div class="card">
          <div class="card-header"><div class="card-title">批量创建结果</div></div>
          <table>
            <thead>
              <tr><th>编号</th><th>户主</th><th>类型</th><th>状态</th></tr>
            </thead>
            <tbody>
              ${this._results.map(r => `
                <tr onclick="ContractModule.showDetail('${r.id}')">
                  <td><strong>${r.id}</strong></td>
                  <td>${r.familyHead.name}</td>
                  <td>${r.contractType}</td>
                  <td>${ContractModule._statusBadge(r.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    `;
  },

  _results: [],

  addRow() {
    this._rows.push({
      id: this._rowId++,
      headName: '',
      idCard: '',
      phone: '',
      contractType: '中级',
      nurse: ContractModule._getOperators().nurses[0],
      phs: ContractModule._getOperators().phs[0],
      note: ''
    });
    App.refreshPage();
  },

  addSampleRows() {
    this._rows = [
      { id: this._rowId++, headName: '钱伟明', idCard: '310108198305126714', phone: '13501782345', contractType: '基本', nurse: '刘芳', phs: '孙丽华', note: '独居老人' },
      { id: this._rowId++, headName: '孙丽芳', idCard: '310101199007083528', phone: '13801891234', contractType: '高级', nurse: '王静', phs: '周敏', note: '双胞胎子女' },
      { id: this._rowId++, headName: '周志强', idCard: '310103196805014513', phone: '13701673456', contractType: '中级', nurse: '刘芳', phs: '孙丽华', note: '糖尿病史' }
    ];
    App.refreshPage();
  },

  removeRow(idx) {
    this._rows.splice(idx, 1);
    App.refreshPage();
  },

  doBatchCreate() {
    const validRows = this._rows.filter(r => r.headName.trim());
    if (validRows.length === 0) { App.toast('请至少填写一行有效数据'); return; }

    const operator = App.getOperatorName();
    const role = App.getCurrentRole();
    const contractsData = validRows.map(r => ({
      familyHead: { name: r.headName.trim(), idCard: r.idCard.trim(), phone: r.phone.trim() },
      members: [],
      contractType: r.contractType,
      assignedDoctor: operator,
      assignedNurse: r.nurse,
      assignedPHS: r.phs,
      _note: r.note.trim()
    }));

    this._results = Store.batchAddContracts(contractsData, operator, role);
    contractsData.forEach((d, i) => {
      if (d._note) {
        Store.addContractNote(this._results[i].id, { author: operator, role, content: d._note });
      }
    });

    this._rows = [];
    App.toast(`已批量创建 ${this._results.length} 条签约`);
    App.refreshPage();
  }
};

window.BatchModule = BatchModule;
