(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function t(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(i){if(i.ep)return;i.ep=!0;const o=t(i);fetch(i.href,o)}})();async function d(a,e={},t){return window.__TAURI_INTERNALS__.invoke(a,e,t)}const _={pending_accept:"待受理",accepted_reviewing:"已受理-材料预审中",notary_reviewing:"公证员审核中",archiving:"归档中",correction_issued:"补正通知已发出",completed:"已完成"},l={window:"窗口人员",notary:"公证员",archivist:"档案员"},g={pending:"待审",passed:"通过",rejected:"不通过"};let r="window",p="dashboard",m=null;document.addEventListener("DOMContentLoaded",()=>{u()});function u(){const a=document.getElementById("app");a.innerHTML=`
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1>公证处窗口</h1>
        <p>预约受理与材料预审系统</p>
      </div>
      <div class="sidebar-nav">
        <div class="nav-item ${p==="dashboard"?"active":""}" data-page="dashboard">
          <span class="nav-icon">📋</span>工作台
        </div>
        <div class="nav-item ${p==="new-appointment"?"active":""}" data-page="new-appointment">
          <span class="nav-icon">➕</span>新建预约
        </div>
        <div class="nav-item ${p==="batch-entry"?"active":""}" data-page="batch-entry">
          <span class="nav-icon">📑</span>批量录入
        </div>
        <div class="nav-item ${p==="detail"?"active":""}" data-page="detail" style="display:${m?"flex":"none"}">
          <span class="nav-icon">📄</span>预约详情
        </div>
        <div class="nav-item ${p==="offline-info"?"active":""}" data-page="offline-info">
          <span class="nav-icon">📴</span>离线说明
        </div>
      </div>
      <div class="sidebar-footer">
        本地运行 · 数据存于本机 SQLite
      </div>
    </nav>
    <div class="main-content">
      <div class="top-bar">
        <h2>${L()}</h2>
        <div class="role-selector">
          ${["window","notary","archivist"].map(e=>`
            <button class="role-btn ${r===e?"active":""}" data-role="${e}">${l[e]}</button>
          `).join("")}
        </div>
      </div>
      <div class="content-area" id="content-area"></div>
    </div>
  `,document.querySelectorAll(".nav-item").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.page;t==="detail"&&!m||(p=t,u(),v())})}),document.querySelectorAll(".role-btn").forEach(e=>{e.addEventListener("click",()=>{r=e.dataset.role,u(),v()})}),v()}function L(){switch(p){case"dashboard":return"工作台";case"new-appointment":return"新建预约单";case"batch-entry":return"批量录入预约";case"detail":return"预约详情";case"offline-info":return"离线使用说明";default:return""}}async function v(){const a=document.getElementById("content-area");if(a)switch(p){case"dashboard":await x(a);break;case"new-appointment":q(a);break;case"batch-entry":T(a);break;case"detail":m?await M(a,m):a.innerHTML='<div class="empty-state"><div class="icon">📄</div><p>请从工作台选择一条预约单查看</p></div>';break;case"offline-info":C(a);break}}async function x(a){a.innerHTML='<div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>';try{const[e,t]=await Promise.all([d("get_dashboard",{role:r}),d("get_recent_status_changes",{limit:15})]),n=e.filter(s=>s.appointment.status==="pending_accept").length,i=e.filter(s=>s.appointment.status==="accepted_reviewing").length,o=e.filter(s=>s.appointment.status==="notary_reviewing").length,c=e.filter(s=>s.appointment.status==="correction_issued").length;a.innerHTML=`
      <div class="stats-row">
        <div class="stat-card">
          <div class="label">待受理</div>
          <div class="value ${n>0?"warning":""}">${n}</div>
        </div>
        <div class="stat-card">
          <div class="label">材料预审中</div>
          <div class="value ${i>0?"info":""}">${i}</div>
        </div>
        <div class="stat-card">
          <div class="label">公证审核中</div>
          <div class="value">${o}</div>
        </div>
        <div class="stat-card">
          <div class="label">补正通知</div>
          <div class="value ${c>0?"danger":""}">${c}</div>
        </div>
      </div>

      <div class="section-title">待处理单据 <span class="badge">${e.length}</span></div>
      <div class="card">
        ${e.length===0?'<div class="empty-state"><p>当前角色下无待处理单据</p></div>':e.map(s=>`
            <div class="appointment-row" data-id="${s.appointment.id}">
              <span class="apt-no">${s.appointment.appointment_no}</span>
              <span class="apt-name">${s.appointment.applicant_name}</span>
              <span class="apt-type">${s.appointment.notary_type}</span>
              <span class="apt-status status-${s.appointment.status}">${_[s.appointment.status]||s.appointment.status}</span>
              <span class="apt-time">${s.latest_action_time||s.appointment.updated_at}</span>
              <div class="apt-action">
                ${w(s.appointment)}
              </div>
            </div>
          `).join("")}
      </div>

      <div class="section-title">最近状态变化</div>
      <div class="card">
        ${t.length===0?'<div class="empty-state"><p>暂无状态变化记录</p></div>':t.map(s=>`
            <div class="status-change-item">
              <span class="sc-time">${s.created_at}</span>
              <span class="sc-no">${s.appointment_no}</span>
              <span class="sc-action">${s.applicant_name} — ${s.action}</span>
              <span class="sc-roles">${l[s.from_role]||s.from_role} → ${l[s.to_role]||s.to_role}</span>
            </div>
          `).join("")}
      </div>
    `,a.querySelectorAll(".appointment-row").forEach(s=>{s.addEventListener("click",b=>{b.target.closest(".btn")||(m=s.dataset.id,p="detail",u())})}),$(a)}catch(e){a.innerHTML=`<div class="card"><p style="color:var(--danger)">加载失败: ${e}</p></div>`}}function w(a){const e=[];return a.status==="pending_accept"&&r==="window"&&e.push(`<button class="btn btn-primary btn-sm" data-action="accept" data-id="${a.id}">受理</button>`),a.status==="accepted_reviewing"&&r==="window"&&(e.push(`<button class="btn btn-success btn-sm" data-action="forward-notary" data-id="${a.id}">转公证员</button>`),e.push(`<button class="btn btn-warning btn-sm" data-action="correction" data-id="${a.id}">发补正通知</button>`)),a.status==="notary_reviewing"&&r==="notary"&&(e.push(`<button class="btn btn-success btn-sm" data-action="forward-archivist" data-id="${a.id}">转档案员</button>`),e.push(`<button class="btn btn-warning btn-sm" data-action="correction" data-id="${a.id}">发补正通知</button>`)),a.status==="correction_issued"&&r==="window"&&e.push(`<button class="btn btn-success btn-sm" data-action="resolve-correction" data-id="${a.id}">补正完成</button>`),a.status==="archiving"&&r==="archivist"&&e.push(`<button class="btn btn-success btn-sm" data-action="complete" data-id="${a.id}">归档完成</button>`),e.join("")}function $(a){a.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",async()=>{const t=e.dataset.action,n=e.dataset.id;try{switch(t){case"accept":await d("accept_appointment",{payload:{appointment_id:n,operator_name:l[r]}});break;case"forward-notary":await d("forward_appointment",{payload:{appointment_id:n,from_role:"window",to_role:"notary",action:"forward_to_notary",comment:"材料预审通过，转公证员审核",operator_name:l[r]}});break;case"forward-archivist":await d("forward_appointment",{payload:{appointment_id:n,from_role:"notary",to_role:"archivist",action:"forward_to_archivist",comment:"公证审核通过，转档案员归档",operator_name:l[r]}});break;case"correction":E(n);return;case"resolve-correction":await S(n);break;case"complete":await d("complete_appointment",{appointmentId:n,operatorName:l[r]});break}v()}catch(i){alert("操作失败: "+i)}})})}function E(a){const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
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
  `,document.body.appendChild(e),e.querySelector("#corr-cancel").addEventListener("click",()=>e.remove()),e.querySelector("#corr-submit").addEventListener("click",async()=>{const t=e.querySelector("#corr-content").value.trim();if(!t){alert("请填写补正内容");return}const n=e.querySelector("#corr-deadline").value||null;try{await d("issue_correction",{payload:{appointment_id:a,material_id:null,notice_content:t,deadline:n,issued_by:l[r],from_role:r}}),e.remove(),v()}catch(i){alert("操作失败: "+i)}})}async function S(a){try{const t=(await d("get_appointment_detail",{appointmentId:a})).correction_notices.filter(n=>n.status==="issued");if(t.length===0){alert("没有待处理的补正通知");return}await d("resolve_correction",{payload:{notice_id:t[0].id}})}catch(e){alert("操作失败: "+e)}}function q(a){a.innerHTML=`
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
  `,a.querySelector("#btn-create").addEventListener("click",async()=>{const e=f();if(e)try{await d("create_appointment",{payload:e}),p="dashboard",u()}catch(t){alert("创建失败: "+t)}}),a.querySelector("#btn-create-review").addEventListener("click",async()=>{const e=f();if(e)try{const t=await d("create_appointment",{payload:e});await d("accept_appointment",{payload:{appointment_id:t.id,operator_name:l[r]}}),m=t.id,p="detail",u()}catch(t){alert("操作失败: "+t)}})}function f(){const a=document.getElementById("f-name").value.trim(),e=document.getElementById("f-idno").value.trim(),t=document.getElementById("f-phone").value.trim()||null,n=document.getElementById("f-type").value,i=document.getElementById("f-time").value;return a?e?n?i?{applicant_name:a,applicant_id_no:e,applicant_phone:t,notary_type:n,appointment_time:i}:(alert("请选择预约时间"),null):(alert("请选择公证事项"),null):(alert("请输入证件号码"),null):(alert("请输入申请人姓名"),null)}function T(a){a.innerHTML=`
    <div class="card">
      <p style="margin-bottom:12px;font-size:13px;color:var(--text-light)">批量创建预约单，每一行为一条预约记录。</p>
      <div class="batch-entry" id="batch-rows"></div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn" id="btn-add-row">➕ 添加一行</button>
        <button class="btn btn-primary" id="btn-batch-submit">批量创建</button>
      </div>
    </div>
  `,y(),y(),y(),a.querySelector("#btn-add-row").addEventListener("click",y),a.querySelector("#btn-batch-submit").addEventListener("click",async()=>{const e=a.querySelectorAll(".batch-row"),t=[];if(e.forEach(n=>{const i=n.querySelector(".bf-name").value.trim(),o=n.querySelector(".bf-idno").value.trim(),c=n.querySelector(".bf-phone").value.trim()||null,s=n.querySelector(".bf-type").value,b=n.querySelector(".bf-time").value;i&&o&&s&&b&&t.push({applicant_name:i,applicant_id_no:o,applicant_phone:c,notary_type:s,appointment_time:b})}),t.length===0){alert("请至少填写一条完整的预约信息");return}try{await d("batch_create_appointments",{payload:{appointments:t}}),p="dashboard",u()}catch(n){alert("批量创建失败: "+n)}})}function y(){const a=document.getElementById("batch-rows");if(!a)return;const e=document.createElement("div");e.className="batch-row",e.innerHTML=`
    <div class="form-group"><label>姓名</label><input class="bf-name" type="text" placeholder="申请人" /></div>
    <div class="form-group"><label>证件号</label><input class="bf-idno" type="text" placeholder="证件号码" /></div>
    <div class="form-group"><label>联系电话</label><input class="bf-phone" type="text" placeholder="选填" /></div>
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
  `,e.querySelector(".batch-remove").addEventListener("click",()=>e.remove()),a.appendChild(e)}async function M(a,e){a.innerHTML='<div class="empty-state"><div class="icon">⏳</div><p>加载中...</p></div>';try{const t=await d("get_appointment_detail",{appointmentId:e});a.innerHTML=`
      <div class="detail-layout">
        <div class="detail-main">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div>
                <span class="apt-no" style="font-size:15px">${t.appointment.appointment_no}</span>
                <span class="apt-status status-${t.appointment.status}" style="margin-left:8px">${_[t.appointment.status]}</span>
              </div>
              <div>
                ${w(t.appointment)}
              </div>
            </div>
            <div class="form-row" style="margin-bottom:0">
              <div><strong>申请人：</strong>${t.appointment.applicant_name}</div>
              <div><strong>证件号：</strong>${t.appointment.applicant_id_no}</div>
              <div><strong>电话：</strong>${t.appointment.applicant_phone||"-"}</div>
              <div><strong>公证事项：</strong>${t.appointment.notary_type}</div>
            </div>
            <div style="margin-top:8px;font-size:12px;color:var(--text-light)">
              预约时间：${t.appointment.appointment_time} &nbsp;|&nbsp;
              当前处理：${l[t.appointment.current_handler_role]} &nbsp;|&nbsp;
              创建：${t.appointment.created_at}
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
              ${t.flow_records.length===0?'<p style="font-size:12px;color:var(--text-light)">暂无流转记录</p>':t.flow_records.map(i=>`
                  <div class="timeline-item">
                    <div class="tl-action">${l[i.from_role]} → ${l[i.to_role]}：${i.action}</div>
                    <div class="tl-time">${i.created_at}${i.operator_name?" · "+i.operator_name:""}</div>
                    ${i.comment?`<div class="tl-comment">${i.comment}</div>`:""}
                  </div>
                `).join("")}
            </div>
          </div>

          <div style="margin-top:16px">
            <button class="btn" id="btn-add-material" style="width:100%">➕ 添加材料</button>
          </div>
        </div>
      </div>
    `;const n=document.getElementById("tab-content");h(n,t),a.querySelectorAll(".tab-item").forEach(i=>{i.addEventListener("click",()=>{a.querySelectorAll(".tab-item").forEach(c=>c.classList.remove("active")),i.classList.add("active");const o=i.dataset.tab;o==="materials"?h(n,t):o==="prereview-history"?k(n,e):o==="corrections"&&H(n,t)})}),$(a),a.querySelector("#btn-add-material").addEventListener("click",()=>{A(e)})}catch(t){a.innerHTML=`<div class="card"><p style="color:var(--danger)">加载失败: ${t}</p></div>`}}function h(a,e){if(e.materials.length===0){a.innerHTML='<div class="card"><div class="empty-state"><p>暂无材料，点击右侧"添加材料"按钮录入</p></div></div>';return}a.innerHTML=`
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
          ${e.materials.map(t=>`
            <tr>
              <td>${t.material_name}</td>
              <td>${t.material_code}</td>
              <td>${t.is_required?'<span class="tag tag-required">必选</span>':'<span class="tag tag-optional">可选</span>'}</td>
              <td><span class="mat-status ${t.status}">${g[t.status]||t.status}</span></td>
              <td>${t.review_comment||"-"}</td>
              <td>${t.reviewed_by||"-"}</td>
              <td>
                ${t.status==="pending"&&(r==="window"||r==="notary")?`
                  <button class="btn btn-sm btn-success" data-review="passed" data-mid="${t.id}">通过</button>
                  <button class="btn btn-sm btn-danger" data-review="rejected" data-mid="${t.id}">不通过</button>
                `:""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `,a.querySelectorAll("[data-review]").forEach(t=>{t.addEventListener("click",async()=>{const n=t.dataset.review,i=t.dataset.mid,o=n==="rejected"?prompt("请输入不通过原因："):null;try{await d("review_material",{payload:{material_id:i,status:n,review_comment:o,reviewed_by:l[r]}}),v()}catch(c){alert("审核失败: "+c)}})})}async function k(a,e){a.innerHTML='<div class="empty-state"><p>加载中...</p></div>';try{const t=await d("get_prereview_history",{appointmentId:e});if(t.length===0){a.innerHTML='<div class="card"><div class="empty-state"><p>暂无预审记录</p></div></div>';return}a.innerHTML=`
      <div class="card" style="padding:0;overflow:hidden">
        <table class="material-table">
          <thead>
            <tr><th>材料名称</th><th>编号</th><th>状态</th><th>审核意见</th><th>审核人</th><th>审核时间</th></tr>
          </thead>
          <tbody>
            ${t.map(n=>`
              <tr>
                <td>${n.material_name}</td>
                <td>${n.material_code}</td>
                <td><span class="mat-status ${n.status}">${g[n.status]||n.status}</span></td>
                <td>${n.review_comment||"-"}</td>
                <td>${n.reviewed_by||"-"}</td>
                <td>${n.reviewed_at||"-"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}catch(t){a.innerHTML=`<div class="card"><p style="color:var(--danger)">加载失败: ${t}</p></div>`}}function H(a,e){if(e.correction_notices.length===0){a.innerHTML='<div class="card"><div class="empty-state"><p>暂无补正通知</p></div></div>';return}a.innerHTML=`
    <div>
      ${e.correction_notices.map(t=>{const n=l[t.issued_by_role]||t.issued_by_role,i=t.issued_by_role==="notary"?"（补正后将恢复至公证员审核）":t.issued_by_role==="archivist"?"（补正后将恢复至档案员归档）":"";return`
        <div class="correction-card ${t.status}">
          <div class="corr-content">${t.notice_content}</div>
          <div class="corr-meta">
            ${t.status==="issued"?"待补正":"已补正"} &nbsp;|&nbsp;
            发出人：${t.issued_by||"-"}（${n}） &nbsp;|&nbsp;
            发出时间：${t.issued_at}${t.deadline?" &nbsp;|&nbsp; 截止："+t.deadline:""}
            ${t.resolved_at?" &nbsp;|&nbsp; 补正时间："+t.resolved_at:""}
            ${t.status==="issued"&&i?" &nbsp;|&nbsp; "+i:""}
          </div>
          ${t.status==="issued"&&r==="window"?`<button class="btn btn-sm btn-success" data-resolve-corr="${t.id}" style="margin-top:8px">标记补正完成</button>`:""}
        </div>
      `}).join("")}
    </div>
  `,a.querySelectorAll("[data-resolve-corr]").forEach(t=>{t.addEventListener("click",async()=>{try{await d("resolve_correction",{payload:{notice_id:t.dataset.resolveCorr}}),v()}catch(n){alert("操作失败: "+n)}})})}function A(a){const e=document.createElement("div");e.className="modal-overlay",e.innerHTML=`
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
  `,document.body.appendChild(e),e.querySelector("#mat-cancel").addEventListener("click",()=>e.remove()),e.querySelector("#mat-submit").addEventListener("click",async()=>{const t=e.querySelector("#mat-name").value.trim(),n=e.querySelector("#mat-code").value.trim(),i=parseInt(e.querySelector("#mat-required").value);if(!t||!n){alert("请填写完整");return}try{await d("add_materials",{payload:{appointment_id:a,materials:[{material_name:t,material_code:n,is_required:i}]}}),e.remove(),v()}catch(o){alert("添加失败: "+o)}})}function C(a){a.innerHTML=`
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
  `}
