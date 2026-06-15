const API_BASE = 'http://localhost:8000/api';
const TOKEN = '0d6104dc69ceae03fa76bc01ef0ed6406eda2509';

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Authorization': `Token ${TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatMoney(value) {
    if (!value) return '0.00';
    return Number(value).toFixed(2);
}

async function loadDashboard() {
    const todoData = await apiCall('/dashboard/todo/');
    const riskData = await apiCall('/dashboard/risk/');
    const changesData = await apiCall('/dashboard/changes/');
    
    renderTodoList(todoData);
    renderRiskList(riskData);
    renderChangesList(changesData);
}

function renderTodoList(data) {
    const container = document.getElementById('todo-list');
    const count = document.getElementById('todo-count');
    
    count.textContent = data.length;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="loading">暂无待办事项</div>';
        return;
    }
    
    container.innerHTML = data.map(item => `
        <div class="todo-item" onclick="openSurveyDetail(${item.id})">
            <div class="todo-title">${item.title}</div>
            <div class="todo-meta">
                <span class="priority-${item.priority}">${item.priority === 'high' ? '高优先级' : '中优先级'}</span>
                <span>${item.customer_name}</span>
                <span>${formatDate(item.due_date)}</span>
            </div>
        </div>
    `).join('');
}

function renderRiskList(data) {
    const container = document.getElementById('risk-list');
    const count = document.getElementById('risk-count');
    
    count.textContent = data.length;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="loading">暂无风险项</div>';
        return;
    }
    
    container.innerHTML = data.map(item => `
        <div class="risk-item">
            <div class="risk-title">${item.title}</div>
            <div class="risk-meta">
                <span class="level-${item.level}">${item.level === 'high' ? '高风险' : '中风险'}</span>
                <span>${item.customer_name}</span>
                <span>${formatDate(item.created_at)}</span>
            </div>
        </div>
    `).join('');
}

function renderChangesList(data) {
    const container = document.getElementById('changes-list');
    const count = document.getElementById('changes-count');
    
    count.textContent = data.length;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="loading">暂无变更记录</div>';
        return;
    }
    
    container.innerHTML = data.map(item => `
        <div class="change-item">
            <div class="change-title">${item.title}</div>
            <div class="change-meta">
                <span>${item.customer_name}</span>
                <span>${item.operator}</span>
                <span>${formatDate(item.created_at)}</span>
            </div>
        </div>
    `).join('');
}

async function loadSurveys() {
    const status = document.getElementById('survey-status-filter').value;
    const search = document.getElementById('survey-search').value;
    let url = '/surveys/';
    if (status || search) {
        url += '?';
        if (status) url += `status=${status}`;
        if (search) url += status ? `&search=${search}` : `search=${search}`;
    }
    const data = await apiCall(url);
    renderSurveyTable(data);
}

function renderSurveyTable(data) {
    const tbody = document.getElementById('survey-table-body');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td><a href="#" onclick="openSurveyDetail(${item.id})">${item.survey_no}</a></td>
            <td>${item.customer_name}</td>
            <td>${item.location}</td>
            <td><span class="status-badge status-${item.status}">${item.status_display}</span></td>
            <td>${formatDate(item.survey_date)}</td>
            <td class="action-buttons">
                <button class="btn-secondary" onclick="openSurveyDetail(${item.id})">详情</button>
                ${item.status === 'pending' ? `<button class="btn-success" onclick="completeSurvey(${item.id})">完成</button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function loadQuotations() {
    const status = document.getElementById('quotation-status-filter').value;
    const search = document.getElementById('quotation-search').value;
    let url = '/quotations/';
    if (status || search) {
        url += '?';
        if (status) url += `status=${status}`;
        if (search) url += status ? `&search=${search}` : `search=${search}`;
    }
    const data = await apiCall(url);
    renderQuotationTable(data);
}

function renderQuotationTable(data) {
    const tbody = document.getElementById('quotation-table-body');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td><a href="#" onclick="openQuotationDetail(${item.id})">${item.quotation_no}</a></td>
            <td>${item.customer_name}</td>
            <td><a href="#" onclick="openSurveyDetail(${item.survey})">${item.survey_no}</a></td>
            <td><span class="status-badge status-${item.status}">${item.status_display}</span></td>
            <td>¥${formatMoney(item.final_amount)}</td>
            <td>${formatDate(item.valid_until)}</td>
            <td class="action-buttons">
                <button class="btn-secondary" onclick="openQuotationDetail(${item.id})">详情</button>
                ${item.status === 'draft' ? `<button class="btn-primary" onclick="submitQuotation(${item.id})">提交</button>` : ''}
                ${item.status === 'submitted' ? `<button class="btn-success" onclick="approveQuotation(${item.id})">批准</button><button class="btn-danger" onclick="rejectQuotation(${item.id})">拒绝</button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function loadCustomers() {
    const search = document.getElementById('customer-search').value;
    let url = '/customers/';
    if (search) url += `?search=${search}`;
    const data = await apiCall(url);
    renderCustomerTable(data);
}

function renderCustomerTable(data) {
    const tbody = document.getElementById('customer-table-body');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.contact}</td>
            <td>${item.phone}</td>
            <td>${item.address}</td>
            <td class="action-buttons">
                <button class="btn-secondary" onclick="editCustomer(${item.id})">编辑</button>
                <button class="btn-danger" onclick="deleteCustomer(${item.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

async function openSurveyDetail(id) {
    const survey = await apiCall(`/surveys/${id}/`);
    const history = await apiCall(`/surveys/${id}/history/`);
    
    let modalContent = `
        <h2>勘测单详情 - ${survey.survey_no}</h2>
        
        <div class="detail-section">
            <h3>基本信息</h3>
            <div class="detail-row"><span class="detail-label">客户:</span><span class="detail-value">${survey.customer_name}</span></div>
            <div class="detail-row"><span class="detail-label">位置:</span><span class="detail-value">${survey.location}</span></div>
            <div class="detail-row"><span class="detail-label">建筑类型:</span><span class="detail-value">${survey.building_type}</span></div>
            <div class="detail-row"><span class="detail-label">楼层数:</span><span class="detail-value">${survey.floor_count || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">墙面材质:</span><span class="detail-value">${survey.wall_material || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">电源:</span><span class="detail-value">${survey.power_supply ? '有' : '无'}</span></div>
            <div class="detail-row"><span class="detail-label">安装高度:</span><span class="detail-value">${survey.installation_height || '-'}米</span></div>
            <div class="detail-row"><span class="detail-label">勘测日期:</span><span class="detail-value">${formatDate(survey.survey_date)}</span></div>
            <div class="detail-row"><span class="detail-label">状态:</span><span class="detail-value"><span class="status-badge status-${survey.status}">${survey.status_display}</span></span></div>
            <div class="detail-row"><span class="detail-label">勘测员:</span><span class="detail-value">${survey.surveyor_name || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">备注:</span><span class="detail-value">${survey.notes || '-'}</span></div>
        </div>
        
        <div class="detail-section">
            <h3>勘测项目</h3>
            <table class="items-table">
                <thead><tr><th>类型</th><th>描述</th><th>数量</th><th>尺寸</th><th>材料要求</th><th>安装要求</th></tr></thead>
                <tbody>
                    ${survey.items.map(item => `
                        <tr>
                            <td>${item.item_type === 'sign' ? '标识牌' : item.item_type === 'light_box' ? '灯箱' : item.item_type === 'letter' ? '发光字' : item.item_type === 'banner' ? '横幅' : '其他'}</td>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>${item.dimensions || '-'}</td>
                            <td>${item.material_requirements || '-'}</td>
                            <td>${item.installation_requirements || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="detail-section">
            <h3>操作历史</h3>
            <div class="history-list">
                ${history.map(item => `
                    <div class="history-item">
                        <span class="history-time">${formatDate(item.created_at)}</span>
                        <span class="history-type">${item.history_type_display}</span>
                        <span class="history-desc">${item.description}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="form-actions">
            <button class="btn-primary" onclick="showQuotationForm(${survey.id})">创建报价单</button>
            <button class="btn-secondary" onclick="closeModal()">关闭</button>
        </div>
    `;
    
    document.getElementById('modal-body').innerHTML = modalContent;
    document.getElementById('modal').style.display = 'block';
}

async function openQuotationDetail(id) {
    const quotation = await apiCall(`/quotations/${id}/`);
    
    let modalContent = `
        <h2>报价单详情 - ${quotation.quotation_no}</h2>
        
        <div class="detail-section">
            <h3>基本信息</h3>
            <div class="detail-row"><span class="detail-label">客户:</span><span class="detail-value">${quotation.customer_name}</span></div>
            <div class="detail-row"><span class="detail-label">勘测单号:</span><span class="detail-value"><a href="#" onclick="openSurveyDetail(${quotation.survey}); closeModal();">${quotation.survey_no}</a></span></div>
            <div class="detail-row"><span class="detail-label">状态:</span><span class="detail-value"><span class="status-badge status-${quotation.status}">${quotation.status_display}</span></span></div>
            <div class="detail-row"><span class="detail-label">创建日期:</span><span class="detail-value">${formatDate(quotation.created_at)}</span></div>
            <div class="detail-row"><span class="detail-label">有效期至:</span><span class="detail-value">${formatDate(quotation.valid_until)}</span></div>
            <div class="detail-row"><span class="detail-label">创建人:</span><span class="detail-value">${quotation.created_by_name || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">付款条款:</span><span class="detail-value">${quotation.payment_terms || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">交付时间:</span><span class="detail-value">${quotation.delivery_time || '-'}</span></div>
            <div class="detail-row"><span class="detail-label">备注:</span><span class="detail-value">${quotation.notes || '-'}</span></div>
        </div>
        
        <div class="detail-section">
            <h3>报价明细</h3>
            <table class="items-table">
                <thead><tr><th>项目名称</th><th>类型</th><th>数量</th><th>单价</th><th>材料费</th><th>安装费</th><th>小计</th></tr></thead>
                <tbody>
                    ${quotation.items.map(item => `
                        <tr>
                            <td>${item.item_name}</td>
                            <td>${item.item_type}</td>
                            <td>${item.quantity}</td>
                            <td>¥${formatMoney(item.unit_price)}</td>
                            <td>¥${formatMoney(item.total_price)}</td>
                            <td>¥${formatMoney(item.installation_fee)}</td>
                            <td>¥${formatMoney(item.total_price + item.installation_fee)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="detail-section">
            <h3>费用汇总</h3>
            <div class="detail-row"><span class="detail-label">总金额:</span><span class="detail-value">¥${formatMoney(quotation.total_amount)}</span></div>
            <div class="detail-row"><span class="detail-label">折扣:</span><span class="detail-value">${quotation.discount}%</span></div>
            <div class="detail-row"><span class="detail-label">最终金额:</span><span class="detail-value" style="font-weight:bold;">¥${formatMoney(quotation.final_amount)}</span></div>
        </div>
        
        <div class="form-actions">
            ${quotation.status === 'draft' ? `<button class="btn-primary" onclick="submitQuotation(${id})">提交报价</button>` : ''}
            ${quotation.status === 'submitted' ? `<button class="btn-success" onclick="approveQuotation(${id})">批准</button><button class="btn-danger" onclick="rejectQuotation(${id})">拒绝</button>` : ''}
            <button class="btn-secondary" onclick="closeModal()">关闭</button>
        </div>
    `;
    
    document.getElementById('modal-body').innerHTML = modalContent;
    document.getElementById('modal').style.display = 'block';
}

function showSurveyForm(surveyId = null) {
    let modalContent = `
        <h2>${surveyId ? '编辑勘测单' : '新建勘测单'}</h2>
        
        <form id="survey-form">
            <div class="form-row">
                <div class="form-group">
                    <label>客户</label>
                    <select id="survey-customer" required></select>
                </div>
                <div class="form-group">
                    <label>勘测日期</label>
                    <input type="datetime-local" id="survey-date" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>位置</label>
                    <input type="text" id="survey-location" placeholder="例如：万达广场B1层" required>
                </div>
                <div class="form-group">
                    <label>建筑类型</label>
                    <select id="survey-building-type">
                        <option value="商业综合体">商业综合体</option>
                        <option value="写字楼">写字楼</option>
                        <option value="购物中心">购物中心</option>
                        <option value="住宅">住宅</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>楼层数</label>
                    <input type="number" id="survey-floor-count" min="1">
                </div>
                <div class="form-group">
                    <label>墙面材质</label>
                    <input type="text" id="survey-wall-material" placeholder="例如：大理石、玻璃">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>安装高度(米)</label>
                    <input type="number" id="survey-height" step="0.1">
                </div>
                <div class="form-group">
                    <label>电源</label>
                    <select id="survey-power">
                        <option value="true">有</option>
                        <option value="false">无</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>现场条件</label>
                <textarea id="survey-access" placeholder="描述现场施工条件、注意事项等"></textarea>
            </div>
            
            <div class="form-group">
                <label>备注</label>
                <textarea id="survey-notes"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary">保存</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">取消</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-body').innerHTML = modalContent;
    loadCustomersForSelect();
    
    document.getElementById('survey-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            customer: parseInt(document.getElementById('survey-customer').value),
            survey_date: document.getElementById('survey-date').value,
            location: document.getElementById('survey-location').value,
            building_type: document.getElementById('survey-building-type').value,
            floor_count: document.getElementById('survey-floor-count').value || null,
            wall_material: document.getElementById('survey-wall-material').value || null,
            installation_height: document.getElementById('survey-height').value || null,
            power_supply: document.getElementById('survey-power').value === 'true',
            access_condition: document.getElementById('survey-access').value || null,
            notes: document.getElementById('survey-notes').value || null
        };
        
        if (surveyId) {
            await apiCall(`/surveys/${surveyId}/`, 'PUT', data);
        } else {
            await apiCall('/surveys/', 'POST', data);
        }
        
        closeModal();
        loadSurveys();
        loadDashboard();
    });
    
    document.getElementById('modal').style.display = 'block';
}

function showQuotationForm(surveyId = null) {
    let modalContent = `
        <h2>新建报价单</h2>
        
        <form id="quotation-form">
            <div class="form-row">
                <div class="form-group">
                    <label>关联勘测单</label>
                    <select id="quotation-survey" required></select>
                </div>
                <div class="form-group">
                    <label>有效期至</label>
                    <input type="date" id="quotation-valid-until" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>折扣(%)</label>
                    <input type="number" id="quotation-discount" min="0" max="100" value="0">
                </div>
                <div class="form-group">
                    <label>交付时间</label>
                    <input type="text" id="quotation-delivery" placeholder="例如：7个工作日">
                </div>
            </div>
            
            <div class="form-group">
                <label>付款条款</label>
                <textarea id="quotation-payment" placeholder="例如：预付款30%，验收后付清"></textarea>
            </div>
            
            <div class="form-group">
                <label>备注</label>
                <textarea id="quotation-notes"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary">保存</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">取消</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-body').innerHTML = modalContent;
    loadSurveysForSelect();
    
    if (surveyId) {
        document.getElementById('quotation-survey').value = surveyId;
        document.getElementById('quotation-survey').disabled = true;
    }
    
    document.getElementById('quotation-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            survey: parseInt(document.getElementById('quotation-survey').value),
            valid_until: document.getElementById('quotation-valid-until').value,
            discount: parseFloat(document.getElementById('quotation-discount').value) || 0,
            total_amount: 0,
            final_amount: 0,
            payment_terms: document.getElementById('quotation-payment').value || null,
            delivery_time: document.getElementById('quotation-delivery').value || null,
            notes: document.getElementById('quotation-notes').value || null,
            items: []
        };
        
        await apiCall('/quotations/', 'POST', data);
        
        closeModal();
        loadQuotations();
        loadDashboard();
    });
    
    document.getElementById('modal').style.display = 'block';
}

function showCustomerForm(customerId = null) {
    let modalContent = `
        <h2>${customerId ? '编辑客户' : '新建客户'}</h2>
        
        <form id="customer-form">
            <div class="form-group">
                <label>客户名称</label>
                <input type="text" id="customer-name" placeholder="例如：上海万达广场" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>联系人</label>
                    <input type="text" id="customer-contact" placeholder="例如：王经理" required>
                </div>
                <div class="form-group">
                    <label>电话</label>
                    <input type="tel" id="customer-phone" placeholder="例如：13800138000" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>地址</label>
                <input type="text" id="customer-address" placeholder="详细地址">
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn-primary">保存</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">取消</button>
            </div>
        </form>
    `;
    
    document.getElementById('modal-body').innerHTML = modalContent;
    
    document.getElementById('customer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('customer-name').value,
            contact: document.getElementById('customer-contact').value,
            phone: document.getElementById('customer-phone').value,
            address: document.getElementById('customer-address').value || null
        };
        
        if (customerId) {
            await apiCall(`/customers/${customerId}/`, 'PUT', data);
        } else {
            await apiCall('/customers/', 'POST', data);
        }
        
        closeModal();
        loadCustomers();
    });
    
    document.getElementById('modal').style.display = 'block';
}

async function loadCustomersForSelect() {
    const customers = await apiCall('/customers/');
    const select = document.getElementById('survey-customer');
    select.innerHTML = customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadSurveysForSelect() {
    const surveys = await apiCall('/surveys/');
    const completedSurveys = surveys.filter(s => s.status === 'completed' && !s.quotation);
    const select = document.getElementById('quotation-survey');
    select.innerHTML = completedSurveys.map(s => `<option value="${s.id}">${s.survey_no} - ${s.customer_name}</option>`).join('');
}

async function completeSurvey(id) {
    if (confirm('确认完成此勘测单？')) {
        await apiCall(`/surveys/${id}/complete/`, 'POST');
        loadSurveys();
        loadDashboard();
    }
}

async function submitQuotation(id) {
    if (confirm('确认提交此报价单？')) {
        await apiCall(`/quotations/${id}/submit/`, 'POST');
        loadQuotations();
        loadDashboard();
        closeModal();
    }
}

async function approveQuotation(id) {
    if (confirm('确认批准此报价单？')) {
        await apiCall(`/quotations/${id}/approve/`, 'POST');
        loadQuotations();
        loadDashboard();
        closeModal();
    }
}

async function rejectQuotation(id) {
    if (confirm('确认拒绝此报价单？')) {
        await apiCall(`/quotations/${id}/reject/`, 'POST');
        loadQuotations();
        loadDashboard();
        closeModal();
    }
}

function editCustomer(id) {
    showCustomerForm(id);
}

async function deleteCustomer(id) {
    if (confirm('确认删除此客户？')) {
        await apiCall(`/customers/${id}/`, 'DELETE');
        loadCustomers();
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function logout() {
    alert('退出登录');
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    loadSurveys();
    loadQuotations();
    loadCustomers();
    
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            document.querySelectorAll('nav ul li a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            
            document.querySelectorAll('main section').forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('active-section');
            });
            
            document.getElementById(targetId).classList.remove('hidden');
            document.getElementById(targetId).classList.add('active-section');
            
            if (targetId === 'dashboard') loadDashboard();
            else if (targetId === 'surveys') loadSurveys();
            else if (targetId === 'quotations') loadQuotations();
            else if (targetId === 'customers') loadCustomers();
        });
    });
    
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal')) {
            closeModal();
        }
    });
});