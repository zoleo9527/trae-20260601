import { invoke } from "@tauri-apps/api/core";

const STATUS_LABELS = {
  pending_accept: "待受理",
  accepted_reviewing: "已受理-材料预审中",
  notary_reviewing: "公证员审核中",
  archiving: "归档中",
  correction_issued: "补正通知已发出",
  completed: "已完成",
};

const ROLE_LABELS = {
  window: "窗口人员",
  notary: "公证员",
  archivist: "档案员",
};

const MAT_STATUS_LABELS = {
  pending: "待审",
  passed: "通过",
  rejected: "不通过",
};

let currentRole = "window";
let currentPage = "dashboard";
let currentDetailId = null;

document.addEventListener("DOMContentLoaded", () => {
  render();
});

function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1>公证处窗口</h1>
        <p>预约受理与材料预审系统</p>
      </div>
      <div class="sidebar-nav">
        <div class="nav-item ${currentPage === "dashboard" ? "active" : ""}" data-page="dashboard">
          <span class="nav-icon">📋</span>工作台
        </div>
        <div class="nav-item ${currentPage === "new-appointment" ? "active" : ""}" data-page="new-appointment">
          <span class="nav-icon">➕</span>新建预约
        </div>
        <div class="nav-item ${currentPage === "batch-entry" ? "active" : ""}" data-page="batch-entry">
          <span class="nav-icon">📑</span>批量录入
        </div>
        <div class="nav-item ${currentPage === "detail" ? "active" : ""}" data-page="detail" style="display:${currentDetailId ? 'flex' : 'none'}">
          <span class="nav-icon">📄</span>预约详情
        </div>
        <div class="nav-item ${currentPage === "offline-info" ? "active" : ""}" data-page="offline-info">
          <span class="nav-icon">📴</span>离线说明
        </div>
      </div>
      <div class="sidebar-footer">
        本地运行 · 数据存于本机 SQLite
      </div>
    </nav>
    <div class="main-content">
      <div class="top-bar">
        <h2>${getPageTitle()}</h2>
        <div class="role-selector">
          ${["window", "notary", "archivist"].map(r => `
            <button class="role-btn ${currentRole === r ? "active" : ""}" data-role="${r}">${ROLE_LABELS[r]}</button>
          `).join("")}
        </div>
      </div>
      <div class="content-area" id="content-area"></div>
    </div>
  `;

  document.querySelectorAll(".nav-item").forEach(el => {
    el.addEventListener("click", () => {
      const page = el.dataset.page;
      if (page === "detail" && !currentDetailId) return;
      currentPage = page;
      render();
      loadPage();
    });
  });

  document.querySelectorAll(".role-btn").forEach(el => {
    el.addEventListener("click", () => {
      currentRole = el.dataset.role;
      render();
      loadPage();
    });
  });

  loadPage();
}

function getPageTitle() {
  switch (currentPage) {
    case "dashboard": return "工作台";
    case "new-appointment": return "新建预约单";
    case "batch-entry": return "批量录入预约";
    case "detail": return "预约详情";
    case "offline-info": return "离线使用说明";
    default: return "";
  }
}

async function loadPage() {
  const area = document.getElementById("content-area");
  if (!area) return;

  switch (currentPage) {
    case "dashboard":
      await renderDashboard(area);
      break;
    case "new-appointment":
      renderNewAppointment(area);
      break;
    case "batch-entry":
      renderBatchEntry(area);
      break;
    case "detail":
      if (currentDetailId) await renderDetail(area, currentDetailId);
      else area.innerHTML = '<div class="empty-state"><div class="icon">📄</div><p>请从工作台选择一条预约单查看</p></div>';
      break;
    case "offline-info":
      renderOfflineInfo(area);
      break;
  }
}

async function renderDashboard(area) {
  area.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>';

  try {
    const [items, changes] = await Promise.all([
      invoke("get_dashboard", { role: currentRole }),
      invoke("get_recent_status_changes", { limit: 15 }),
    ]);

    const pendingCount = items.filter(i => i.appointment.status === "pending_accept").length;
    const reviewingCount = items.filter(i => i.appointment.status === "accepted_reviewing").length;
    const notaryCount = items.filter(i => i.appointment.status === "notary_reviewing").length;
    const corrCount = items.filter(i => i.appointment.status === "correction_issued").length;

    area.innerHTML = `
      <div class="stats-row">
        <div class="stat-card">
          <div class="label">待受理</div>
          <div class="value ${pendingCount > 0 ? 'warning' : ''}">${pendingCount}</div>
        </div>
        <div class="stat-card">
          <div class="label">材料预审中</div>
          <div class="value ${reviewingCount > 0 ? 'info' : ''}">${reviewingCount}</div>
        </div>
        <div class="stat-card">
          <div class="label">公证审核中</div>
          <div class="value">${notaryCount}</div>
        </div>
        <div class="stat-card">
          <div class="label">补正通知</div>
          <div class="value ${corrCount > 0 ? 'danger' : ''}">${corrCount}</div>
        </div>
      </div>

      <div class="section-title">待处理单据 <span class="badge">${items.length}</span></div>
      <div class="card">
        ${items.length === 0 ? '<div class="empty-state"><p>当前角色下无待处理单据</p></div>' :
          items.map(item => `
            <div class="appointment-row" data-id="${item.appointment.id}">
              <span class="apt-no">${item.appointment.appointment_no}</span>
              <span class="apt-name">${item.appointment.applicant_name}</span>
              <span class="apt-type">${item.appointment.notary_type}</span>
              <span class="apt-status status-${item.appointment.status}">${STATUS_LABELS[item.appointment.status] || item.appointment.status}</span>
              <span class="apt-time">${item.latest_action_time || item.appointment.updated_at}</span>
              <div class="apt-action">
                ${getQuickActions(item.appointment)}
              </div>
            </div>
          `).join("")}
      </div>

      <div class="section-title">最近状态变化</div>
      <div class="card">
        ${changes.length === 0 ? '<div class="empty-state"><p>暂无状态变化记录</p></div>' :
          changes.map(c => `
            <div class="status-change-item">
              <span class="sc-time">${c.created_at}</span>
              <span class="sc-no">${c.appointment_no}</span>
              <span class="sc-action">${c.applicant_name} — ${c.action}</span>
              <span class="sc-roles">${ROLE_LABELS[c.from_role] || c.from_role} → ${ROLE_LABELS[c.to_role] || c.to_role}</span>
            </div>
          `).join("")}
      </div>
    `;

    area.querySelectorAll(".appointment-row").forEach(el => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".btn")) return;
        currentDetailId = el.dataset.id;
        currentPage = "detail";
        render();
      });
    });

    bindQuickActions(area);
  } catch (e) {
    area.innerHTML = `<div class="card"><p style="color:var(--danger)">加载失败: ${e}</p></div>`;
  }
}

function getQuickActions(apt) {
  const actions = [];
  if (apt.status === "pending_accept" && currentRole === "window") {
    actions.push(`<button class="btn btn-primary btn-sm" data-action="accept" data-id="${apt.id}">受理</button>`);
  }
  if (apt.status === "accepted_reviewing" && currentRole === "window") {
    actions.push(`<button class="btn btn-success btn-sm" data-action="forward-notary" data-id="${apt.id}">转公证员</button>`);
    actions.push(`<button class="btn btn-warning btn-sm" data-action="correction" data-id="${apt.id}">发补正通知</button>`);
  }
  if (apt.status === "notary_reviewing" && currentRole === "notary") {
    actions.push(`<button class="btn btn-success btn-sm" data-action="forward-archivist" data-id="${apt.id}">转档案员</button>`);
    actions.push(`<button class="btn btn-warning btn-sm" data-action="correction" data-id="${apt.id}">发补正通知</button>`);
  }
  if (apt.status === "correction_issued" && currentRole === "window") {
    actions.push(`<button class="btn btn-success btn-sm" data-action="resolve-correction" data-id="${apt.id}">补正完成</button>`);
  }
  if (apt.status === "archiving" && currentRole === "archivist") {
    actions.push(`<button class="btn btn-success btn-sm" data-action="complete" data-id="${apt.id}">归档完成</button>`);
  }
  return actions.join("");
}

function bindQuickActions(area) {
  area.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      try {
        switch (action) {
          case "accept":
            await invoke("accept_appointment", { payload: { appointment_id: id, operator_name: ROLE_LABELS[currentRole] } });
            break;
          case "forward-notary":
            await invoke("forward_appointment", { payload: { appointment_id: id, from_role: "window", to_role: "notary", action: "forward_to_notary", comment: "材料预审通过，转公证员审核", operator_name: ROLE_LABELS[currentRole] } });
            break;
          case "forward-archivist":
            await invoke("forward_appointment", { payload: { appointment_id: id, from_role: "notary", to_role: "archivist", action: "forward_to_archivist", comment: "公证审核通过，转档案员归档", operator_name: ROLE_LABELS[currentRole] } });
            break;
          case "correction":
            showCorrectionModal(id);
            return;
          case "resolve-correction":
            await resolveFirstCorrection(id);
            break;
          case "complete":
            await invoke("complete_appointment", { appointmentId: id, operatorName: ROLE_LABELS[currentRole] });
            break;
        }
        loadPage();
      } catch (e) {
        alert("操作失败: " + e);
      }
    });
  });
}

function showCorrectionModal(appointmentId) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <h3>发出补正通知</h3>
      <div class="form-group">
        <label>补正内容</label>
        <textarea id="corr-content" rows="3" placeholder="请说明需要补正的材料和原因"></textarea>
      </div>
      <div class="form-group">
        <label>补正截止日期</label>
        <input type="date" id="corr-deadline" />
      </div>
      <div class="modal-actions">
        <button class="btn" id="corr-cancel">取消</button>
        <button class="btn btn-danger" id="corr-submit">发出通知</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#corr-cancel").addEventListener("click", () => overlay.remove());
  overlay.querySelector("#corr-submit").addEventListener("click", async () => {
    const content = overlay.querySelector("#corr-content").value.trim();
    if (!content) { alert("请填写补正内容"); return; }
    const deadline = overlay.querySelector("#corr-deadline").value || null;
    try {
      await invoke("issue_correction", {
        payload: {
          appointment_id: appointmentId,
          material_id: null,
          notice_content: content,
          deadline,
          issued_by: ROLE_LABELS[currentRole],
          from_role: currentRole,
        }
      });
      overlay.remove();
      loadPage();
    } catch (e) {
      alert("操作失败: " + e);
    }
  });
}

async function resolveFirstCorrection(appointmentId) {
  try {
    const detail = await invoke("get_appointment_detail", { appointmentId });
    const issued = detail.correction_notices.filter(n => n.status === "issued");
    if (issued.length === 0) { alert("没有待处理的补正通知"); return; }
    await invoke("resolve_correction", { payload: { notice_id: issued[0].id } });
  } catch (e) {
    alert("操作失败: " + e);
  }
}

function renderNewAppointment(area) {
  area.innerHTML = `
    <div class="card" style="max-width:640px">
      <div class="form-row">
        <div class="form-group">
          <label>申请人姓名 *</label>
          <input type="text" id="f-name" placeholder="请输入" />
        </div>
        <div class="form-group">
          <label>证件号码 *</label>
          <input type="text" id="f-idno" placeholder="请输入" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>联系电话</label>
          <input type="text" id="f-phone" placeholder="请输入" />
        </div>
        <div class="form-group">
          <label>公证事项 *</label>
          <select id="f-type">
            <option value="">请选择</option>
            <option value="继承公证">继承公证</option>
            <option value="委托公证">委托公证</option>
            <option value="声明公证">声明公证</option>
            <option value="遗嘱公证">遗嘱公证</option>
            <option value="合同公证">合同公证</option>
            <option value="出生公证">出生公证</option>
            <option value="学历公证">学历公证</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>预约时间 *</label>
        <input type="datetime-local" id="f-time" />
      </div>
      <div style="margin-top:12px">
        <button class="btn btn-primary" id="btn-create">创建预约</button>
        <button class="btn" id="btn-create-review" style="margin-left:8px">创建并直接受理</button>
      </div>
    </div>
  `;

  area.querySelector("#btn-create").addEventListener("click", async () => {
    const payload = getCreatePayload();
    if (!payload) return;
    try {
      await invoke("create_appointment", { payload });
      currentPage = "dashboard";
      render();
    } catch (e) { alert("创建失败: " + e); }
  });

  area.querySelector("#btn-create-review").addEventListener("click", async () => {
    const payload = getCreatePayload();
    if (!payload) return;
    try {
      const apt = await invoke("create_appointment", { payload });
      await invoke("accept_appointment", { payload: { appointment_id: apt.id, operator_name: ROLE_LABELS[currentRole] } });
      currentDetailId = apt.id;
      currentPage = "detail";
      render();
    } catch (e) { alert("操作失败: " + e); }
  });
}

function getCreatePayload() {
  const name = document.getElementById("f-name").value.trim();
  const idno = document.getElementById("f-idno").value.trim();
  const phone = document.getElementById("f-phone").value.trim() || null;
  const type = document.getElementById("f-type").value;
  const time = document.getElementById("f-time").value;

  if (!name) { alert("请输入申请人姓名"); return null; }
  if (!idno) { alert("请输入证件号码"); return null; }
  if (!type) { alert("请选择公证事项"); return null; }
  if (!time) { alert("请选择预约时间"); return null; }

  return { applicant_name: name, applicant_id_no: idno, applicant_phone: phone, notary_type: type, appointment_time: time };
}

function renderBatchEntry(area) {
  area.innerHTML = `
    <div class="card">
      <p style="margin-bottom:12px;font-size:13px;color:var(--text-light)">批量创建预约单，每一行为一条预约记录。</p>
      <div class="batch-entry" id="batch-rows"></div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn" id="btn-add-row">➕ 添加一行</button>
        <button class="btn btn-primary" id="btn-batch-submit">批量创建</button>
      </div>
    </div>
  `;

  addBatchRow();
  addBatchRow();
  addBatchRow();

  area.querySelector("#btn-add-row").addEventListener("click", addBatchRow);
  area.querySelector("#btn-batch-submit").addEventListener("click", async () => {
    const rows = area.querySelectorAll(".batch-row");
    const appointments = [];
    rows.forEach(row => {
      const name = row.querySelector(".bf-name").value.trim();
      const idno = row.querySelector(".bf-idno").value.trim();
      const phone = row.querySelector(".bf-phone").value.trim() || null;
      const type = row.querySelector(".bf-type").value;
      const time = row.querySelector(".bf-time").value;
      if (name && idno && type && time) {
        appointments.push({ applicant_name: name, applicant_id_no: idno, applicant_phone: phone, notary_type: type, appointment_time: time });
      }
    });
    if (appointments.length === 0) { alert("请至少填写一条完整的预约信息"); return; }
    try {
      await invoke("batch_create_appointments", { payload: { appointments } });
      currentPage = "dashboard";
      render();
    } catch (e) { alert("批量创建失败: " + e); }
  });
}

function addBatchRow() {
  const container = document.getElementById("batch-rows");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "batch-row";
  row.innerHTML = `
    <div class="form-group"><label>姓名</label><input class="bf-name" type="text" placeholder="申请人" /></div>
    <div class="form-group"><label>证件号</label><input class="bf-idno" type="text" placeholder="证件号码" /></div>
    <div class="form-group"><label>公证事项</label>
      <select class="bf-type">
        <option value="">选择</option>
        <option value="继承公证">继承公证</option>
        <option value="委托公证">委托公证</option>
        <option value="声明公证">声明公证</option>
        <option value="遗嘱公证">遗嘱公证</option>
        <option value="合同公证">合同公证</option>
        <option value="出生公证">出生公证</option>
        <option value="学历公证">学历公证</option>
        <option value="其他">其他</option>
      </select>
    </div>
    <div class="form-group"><label>预约时间</label><input class="bf-time" type="datetime-local" /></div>
    <div class="form-group"><label>&nbsp;</label><button class="btn btn-sm btn-danger batch-remove">✕</button></div>
  `;
  row.querySelector(".batch-remove").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

async function renderDetail(area, appointmentId) {
  area.innerHTML = '<div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>';

  try {
    const detail = await invoke("get_appointment_detail", { appointmentId });

    area.innerHTML = `
      <div class="detail-layout">
        <div class="detail-main">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div>
                <span class="apt-no" style="font-size:15px">${detail.appointment.appointment_no}</span>
                <span class="apt-status status-${detail.appointment.status}" style="margin-left:8px">${STATUS_LABELS[detail.appointment.status]}</span>
              </div>
              <div>
                ${getQuickActions(detail.appointment)}
              </div>
            </div>
            <div class="form-row" style="margin-bottom:0">
              <div><strong>申请人：</strong>${detail.appointment.applicant_name}</div>
              <div><strong>证件号：</strong>${detail.appointment.applicant_id_no}</div>
              <div><strong>电话：</strong>${detail.appointment.applicant_phone || '-'}</div>
              <div><strong>公证事项：</strong>${detail.appointment.notary_type}</div>
            </div>
            <div style="margin-top:8px;font-size:12px;color:var(--text-light)">
              预约时间：${detail.appointment.appointment_time} &nbsp;|&nbsp;
              当前处理：${ROLE_LABELS[detail.appointment.current_handler_role]} &nbsp;|&nbsp;
              创建：${detail.appointment.created_at}
            </div>
          </div>

          <div class="tab-row">
            <div class="tab-item active" data-tab="materials">材料预审</div>
            <div class="tab-item" data-tab="prereview-history">预审回看</div>
            <div class="tab-item" data-tab="corrections">补正通知</div>
          </div>

          <div id="tab-content"></div>
        </div>

        <div class="detail-sidebar">
          <div class="section-title">流转记录</div>
          <div class="card">
            <div class="timeline">
              ${detail.flow_records.length === 0 ? '<p style="font-size:12px;color:var(--text-light)">暂无流转记录</p>' :
                detail.flow_records.map(f => `
                  <div class="timeline-item">
                    <div class="tl-action">${ROLE_LABELS[f.from_role]} → ${ROLE_LABELS[f.to_role]}：${f.action}</div>
                    <div class="tl-time">${f.created_at}${f.operator_name ? ' · ' + f.operator_name : ''}</div>
                    ${f.comment ? `<div class="tl-comment">${f.comment}</div>` : ''}
                  </div>
                `).join("")}
            </div>
          </div>

          <div style="margin-top:16px">
            <button class="btn" id="btn-add-material" style="width:100%">➕ 添加材料</button>
          </div>
        </div>
      </div>
    `;

    const tabContent = document.getElementById("tab-content");
    renderMaterialsTab(tabContent, detail);

    area.querySelectorAll(".tab-item").forEach(tab => {
      tab.addEventListener("click", () => {
        area.querySelectorAll(".tab-item").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const tabName = tab.dataset.tab;
        if (tabName === "materials") renderMaterialsTab(tabContent, detail);
        else if (tabName === "prereview-history") renderPrereviewHistoryTab(tabContent, appointmentId);
        else if (tabName === "corrections") renderCorrectionsTab(tabContent, detail);
      });
    });

    bindQuickActions(area);

    area.querySelector("#btn-add-material").addEventListener("click", () => {
      showAddMaterialModal(appointmentId);
    });
  } catch (e) {
    area.innerHTML = `<div class="card"><p style="color:var(--danger)">加载失败: ${e}</p></div>`;
  }
}

function renderMaterialsTab(container, detail) {
  if (detail.materials.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><p>暂无材料，点击右侧"添加材料"按钮录入</p></div></div>';
    return;
  }
  container.innerHTML = `
    <div class="card" style="padding:0;overflow:hidden">
      <table class="material-table">
        <thead>
          <tr>
            <th>材料名称</th>
            <th>编号</th>
            <th>必选</th>
            <th>状态</th>
            <th>审核意见</th>
            <th>审核人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${detail.materials.map(m => `
            <tr>
              <td>${m.material_name}</td>
              <td>${m.material_code}</td>
              <td>${m.is_required ? '<span class="tag tag-required">必选</span>' : '<span class="tag tag-optional">可选</span>'}</td>
              <td><span class="mat-status ${m.status}">${MAT_STATUS_LABELS[m.status] || m.status}</span></td>
              <td>${m.review_comment || '-'}</td>
              <td>${m.reviewed_by || '-'}</td>
              <td>
                ${m.status === 'pending' && (currentRole === 'window' || currentRole === 'notary') ? `
                  <button class="btn btn-sm btn-success" data-review="passed" data-mid="${m.id}">通过</button>
                  <button class="btn btn-sm btn-danger" data-review="rejected" data-mid="${m.id}">不通过</button>
                ` : ''}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll("[data-review]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const status = btn.dataset.review;
      const mid = btn.dataset.mid;
      const comment = status === "rejected" ? prompt("请输入不通过原因：") : null;
      try {
        await invoke("review_material", {
          payload: {
            material_id: mid,
            status,
            review_comment: comment,
            reviewed_by: ROLE_LABELS[currentRole],
          }
        });
        loadPage();
      } catch (e) { alert("审核失败: " + e); }
    });
  });
}

async function renderPrereviewHistoryTab(container, appointmentId) {
  container.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';
  try {
    const materials = await invoke("get_prereview_history", { appointmentId });
    if (materials.length === 0) {
      container.innerHTML = '<div class="card"><div class="empty-state"><p>暂无预审记录</p></div></div>';
      return;
    }
    container.innerHTML = `
      <div class="card" style="padding:0;overflow:hidden">
        <table class="material-table">
          <thead>
            <tr><th>材料名称</th><th>编号</th><th>状态</th><th>审核意见</th><th>审核人</th><th>审核时间</th></tr>
          </thead>
          <tbody>
            ${materials.map(m => `
              <tr>
                <td>${m.material_name}</td>
                <td>${m.material_code}</td>
                <td><span class="mat-status ${m.status}">${MAT_STATUS_LABELS[m.status] || m.status}</span></td>
                <td>${m.review_comment || '-'}</td>
                <td>${m.reviewed_by || '-'}</td>
                <td>${m.reviewed_at || '-'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="card"><p style="color:var(--danger)">加载失败: ${e}</p></div>`;
  }
}

function renderCorrectionsTab(container, detail) {
  if (detail.correction_notices.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><p>暂无补正通知</p></div></div>';
    return;
  }
  container.innerHTML = `
    <div>
      ${detail.correction_notices.map(c => {
        const issuerRole = ROLE_LABELS[c.issued_by_role] || c.issued_by_role;
        const returnHint = c.issued_by_role === 'notary' ? '（补正后将恢复至公证员审核）' : c.issued_by_role === 'archivist' ? '（补正后将恢复至档案员归档）' : '';
        return `
        <div class="correction-card ${c.status}">
          <div class="corr-content">${c.notice_content}</div>
          <div class="corr-meta">
            ${c.status === 'issued' ? '待补正' : '已补正'} &nbsp;|&nbsp;
            发出人：${c.issued_by || '-'}（${issuerRole}） &nbsp;|&nbsp;
            发出时间：${c.issued_at}${c.deadline ? ' &nbsp;|&nbsp; 截止：' + c.deadline : ''}
            ${c.resolved_at ? ' &nbsp;|&nbsp; 补正时间：' + c.resolved_at : ''}
            ${c.status === 'issued' && returnHint ? ' &nbsp;|&nbsp; ' + returnHint : ''}
          </div>
          ${c.status === 'issued' && currentRole === 'window' ? `<button class="btn btn-sm btn-success" data-resolve-corr="${c.id}" style="margin-top:8px">标记补正完成</button>` : ''}
        </div>
      `}).join("")}
    </div>
  `;

  container.querySelectorAll("[data-resolve-corr]").forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        await invoke("resolve_correction", { payload: { notice_id: btn.dataset.resolveCorr } });
        loadPage();
      } catch (e) { alert("操作失败: " + e); }
    });
  });
}

function showAddMaterialModal(appointmentId) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <h3>添加材料</h3>
      <div class="form-group">
        <label>材料名称 *</label>
        <input type="text" id="mat-name" placeholder="如：身份证复印件" />
      </div>
      <div class="form-group">
        <label>材料编号 *</label>
        <input type="text" id="mat-code" placeholder="如：CL-001" />
      </div>
      <div class="form-group">
        <label>是否必选</label>
        <select id="mat-required">
          <option value="1">必选</option>
          <option value="0">可选</option>
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn" id="mat-cancel">取消</button>
        <button class="btn btn-primary" id="mat-submit">添加</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#mat-cancel").addEventListener("click", () => overlay.remove());
  overlay.querySelector("#mat-submit").addEventListener("click", async () => {
    const name = overlay.querySelector("#mat-name").value.trim();
    const code = overlay.querySelector("#mat-code").value.trim();
    const required = parseInt(overlay.querySelector("#mat-required").value);
    if (!name || !code) { alert("请填写完整"); return; }
    try {
      await invoke("add_materials", {
        payload: { appointment_id: appointmentId, materials: [{ material_name: name, material_code: code, is_required: required }] },
      });
      overlay.remove();
      loadPage();
    } catch (e) { alert("添加失败: " + e); }
  });
}

function renderOfflineInfo(area) {
  area.innerHTML = `
    <div class="card" style="max-width:640px">
      <h3 style="font-size:15px;margin-bottom:12px">离线可用说明</h3>
      <div style="font-size:13px;line-height:1.8">
        <p><strong>本系统完全离线运行</strong>，所有数据存储于本机 SQLite 数据库，不依赖网络连接。</p>

        <h4 style="margin-top:16px;font-size:14px">技术架构</h4>
        <ul style="padding-left:20px;margin-top:6px">
          <li>桌面框架：Tauri 2.x（Rust 内核）</li>
          <li>数据存储：SQLite 本地数据库，文件位于应用数据目录下</li>
          <li>前端：纯 HTML/CSS/JS，无需网络加载</li>
        </ul>

        <h4 style="margin-top:16px;font-size:14px">离线功能范围</h4>
        <ul style="padding-left:20px;margin-top:6px">
          <li>✅ 创建、受理、批量录入预约单</li>
          <li>✅ 材料预审（通过/不通过）与预审回看</li>
          <li>✅ 补正通知的发出与确认</li>
          <li>✅ 窗口人员→公证员→档案员 全流程流转与留痕</li>
          <li>✅ 工作台仪表盘、状态变化查询</li>
        </ul>

        <h4 style="margin-top:16px;font-size:14px">注意事项</h4>
        <ul style="padding-left:20px;margin-top:6px">
          <li>数据仅存于本机，请定期备份 SQLite 数据库文件</li>
          <li>多台电脑间的数据不自动同步，需手动导入导出</li>
          <li>系统无需安装额外依赖，单机即可运行</li>
        </ul>
      </div>
    </div>
  `;
}
