let customers = [];
let equipments = [];
let technicians = [];
let serviceRecords = [];
let partsRequests = [];
let currentServiceId = null;
let currentPartsRequestId = null;
let currentCustomerId = null;

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    loadData();
});

function initNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'service') {
                renderServiceCards(serviceRecords);
            } else if (tabId === 'parts') {
                renderPartsRequests(partsRequests);
            }
        });
    });
}

async function loadData() {
    try {
        const [customersRes, equipmentsRes, techniciansRes, serviceRes, partsRes] = await Promise.all([
            fetch('/api/customers'),
            fetch('/api/equipments'),
            fetch('/api/technicians'),
            fetch('/api/service_records'),
            fetch('/api/parts_requests')
        ]);
        
        customers = await customersRes.json();
        equipments = await equipmentsRes.json();
        technicians = await techniciansRes.json();
        serviceRecords = await serviceRes.json();
        partsRequests = await partsRes.json();
        
        updateDashboard();
        renderEquipmentList();
        renderServiceCards(serviceRecords);
        renderPartsRequests(partsRequests);
        renderRecords();
        populateNewServiceForm();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

function updateDashboard() {
    document.getElementById('total-services').textContent = serviceRecords.length;
    document.getElementById('completed-services').textContent = serviceRecords.filter(s => s.status === '已签收').length;
    document.getElementById('diagnosis-services').textContent = serviceRecords.filter(s => s.status === '诊断完成' || s.status === '已签到').length;
    document.getElementById('parts-requests').textContent = partsRequests.length;
    renderRecentServices();
}

function renderRecentServices() {
    const tbody = document.getElementById('recent-services-body');
    const recent = serviceRecords.slice(0, 5);
    tbody.innerHTML = recent.map(record => `
        <tr>
            <td>${record.customer_name}</td>
            <td>${record.equipment_model}</td>
            <td>${record.service_date}</td>
            <td>${record.technician_name || '-'}</td>
            <td><span class="status-badge ${getStatusClass(record.status)}">${record.status}</span></td>
            <td>${record.fault_type || '-'}</td>
            <td><button class="action-btn" onclick="viewEquipmentFromService(${record.equipment_id})">查看设备档案</button></td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch(status) {
        case '待签到': return 'pending';
        case '已签到': return 'checkedin';
        case '诊断完成': return 'diagnosed';
        case '已签收': return 'signed';
        default: return 'pending';
    }
}

function renderEquipmentList() {
    const list = document.getElementById('equipment-list');
    list.innerHTML = equipments.map(eq => `
        <div class="equipment-card" onclick="showEquipmentDetail(${eq.id})">
            <h4>${eq.model}</h4>
            <p><strong>序列号:</strong> ${eq.serial_number}</p>
            <p><strong>客户:</strong> ${eq.customer_name}</p>
            <p><strong>状态:</strong> ${eq.status}</p>
            <p><strong>位置:</strong> ${eq.location}</p>
        </div>
    `).join('');
}

function showEquipmentDetail(id) {
    fetch(`/api/equipments/${id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('eq-model').textContent = data.model;
            document.getElementById('eq-serial').textContent = data.serial_number;
            document.getElementById('eq-customer').textContent = data.customer_name;
            document.getElementById('eq-purchase').textContent = data.purchase_date || '-';
            document.getElementById('eq-status').textContent = data.status;
            document.getElementById('eq-location').textContent = data.location;
            
            const maintenanceBody = document.getElementById('maintenance-history');
            if (data.maintenance_records.length > 0) {
                maintenanceBody.innerHTML = data.maintenance_records.map(m => `
                    <tr>
                        <td>${m.maintenance_date}</td>
                        <td>${m.type}</td>
                        <td>${m.description}</td>
                        <td>${m.technician}</td>
                        <td>${m.next_maintenance_date || '-'}</td>
                    </tr>
                `).join('');
            } else {
                maintenanceBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">暂无保养记录</td></tr>';
            }
            
            const serviceBody = document.getElementById('service-history');
            if (data.service_records.length > 0) {
                serviceBody.innerHTML = data.service_records.map(s => `
                    <tr>
                        <td>${s.service_date}</td>
                        <td>${s.technician_name || '-'}</td>
                        <td>${s.fault_type || '-'}</td>
                        <td>${s.need_stop ? '是' : '否'}</td>
                        <td>${s.status}</td>
                    </tr>
                `).join('');
            } else {
                serviceBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">暂无服务记录</td></tr>';
            }
            
            document.getElementById('equipment-list').style.display = 'none';
            document.getElementById('equipment-detail').style.display = 'block';
        });
}

function hideEquipmentDetail() {
    document.getElementById('equipment-detail').style.display = 'none';
    document.getElementById('equipment-list').style.display = 'grid';
}

function searchEquipment() {
    const keyword = document.getElementById('equipment-search').value.toLowerCase();
    const filtered = equipments.filter(eq => 
        eq.model.toLowerCase().includes(keyword) || 
        eq.serial_number.toLowerCase().includes(keyword)
    );
    
    const list = document.getElementById('equipment-list');
    list.innerHTML = filtered.map(eq => `
        <div class="equipment-card" onclick="showEquipmentDetail(${eq.id})">
            <h4>${eq.model}</h4>
            <p><strong>序列号:</strong> ${eq.serial_number}</p>
            <p><strong>客户:</strong> ${eq.customer_name}</p>
            <p><strong>状态:</strong> ${eq.status}</p>
            <p><strong>位置:</strong> ${eq.location}</p>
        </div>
    `).join('');
}

function renderServiceCards(records) {
    const cards = document.getElementById('service-cards');
    cards.innerHTML = records.map(record => `
        <div class="service-card status-${getStatusClass(record.status)}">
            <h4>${record.customer_name}</h4>
            <p><strong>设备:</strong> ${record.equipment_model} (${record.equipment_serial})</p>
            <p><strong>服务时间:</strong> ${record.service_date}</p>
            <p><strong>技师:</strong> ${record.technician_name || '-'}</p>
            <span class="status-badge ${getStatusClass(record.status)}">${record.status}</span>
            
            ${record.check_in_time ? `<p><strong>签到时间:</strong> ${record.check_in_time}</p>` : ''}
            ${record.check_in_location ? `<p><strong>签到位置:</strong> ${record.check_in_location}</p>` : ''}
            ${record.diagnosis ? `<p><strong>故障类型:</strong> ${record.fault_type}</p><p><strong>诊断:</strong> ${record.diagnosis}</p>` : ''}
            ${record.need_stop ? '<p style="color: #e74c3c;"><strong>⚠ 需要停机维修</strong></p>' : ''}
            
            <div class="actions">
                <button class="action-btn secondary" onclick="viewEquipmentFromService(${record.equipment_id})">设备档案</button>
                ${record.status === '待签到' ? `<button class="action-btn" onclick="showCheckinModal(${record.id})">签到</button>` : ''}
                ${record.status === '已签到' ? `<button class="action-btn" onclick="showDiagnosisModal(${record.id})">诊断</button>` : ''}
                ${record.status === '诊断完成' ? `<button class="action-btn" onclick="showSignModal(${record.id})">签收</button>` : ''}
                ${record.status === '诊断完成' ? `<button class="action-btn secondary" onclick="showPartsRequestModal(${record.id})">配件申请</button>` : ''}
            </div>
        </div>
    `).join('');
}

function viewEquipmentFromService(equipmentId) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="equipment"]').classList.add('active');
    document.getElementById('equipment').classList.add('active');
    showEquipmentDetail(equipmentId);
}

function filterServices() {
    const status = document.getElementById('status-filter').value;
    let filtered = serviceRecords;
    
    if (status !== 'all') {
        filtered = serviceRecords.filter(s => s.status === status);
    }
    
    renderServiceCards(filtered);
}

function populateNewServiceForm() {
    const customerSelect = document.getElementById('new-service-customer');
    const equipmentSelect = document.getElementById('new-service-equipment');
    const technicianSelect = document.getElementById('new-service-technician');
    
    customerSelect.innerHTML = customers.map(c => 
        `<option value="${c.id}">${c.name}</option>`
    ).join('');
    
    technicianSelect.innerHTML = `<option value="">选择技师</option>` + technicians.map(t => 
        `<option value="${t.id}">${t.name} - ${t.skill}</option>`
    ).join('');
    
    customerSelect.addEventListener('change', () => {
        const customerId = parseInt(customerSelect.value);
        const customerEquipments = equipments.filter(e => e.customer_id === customerId);
        equipmentSelect.innerHTML = customerEquipments.map(e => 
            `<option value="${e.id}">${e.model} (${e.serial_number})</option>`
        ).join('');
    });
    
    customerSelect.dispatchEvent(new Event('change'));
}

function showNewServiceModal() {
    document.getElementById('new-service-modal').classList.add('active');
}

document.getElementById('new-service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        customer_id: parseInt(document.getElementById('new-service-customer').value),
        equipment_id: parseInt(document.getElementById('new-service-equipment').value),
        technician_id: document.getElementById('new-service-technician').value ? 
            parseInt(document.getElementById('new-service-technician').value) : null
    };
    
    await fetch('/api/service_records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    closeModal('new-service-modal');
    loadData();
});

function showCheckinModal(id) {
    currentServiceId = id;
    document.getElementById('checkin-modal').classList.add('active');
}

document.getElementById('checkin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        location: document.getElementById('checkin-location').value
    };
    
    await fetch(`/api/service_records/${currentServiceId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    closeModal('checkin-modal');
    loadData();
});

function showDiagnosisModal(id) {
    currentServiceId = id;
    document.getElementById('diagnosis-modal').classList.add('active');
}

document.getElementById('diagnosis-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        fault_type: document.getElementById('fault-type').value,
        diagnosis: document.getElementById('diagnosis-content').value,
        need_stop: document.getElementById('need-stop').checked
    };
    
    await fetch(`/api/service_records/${currentServiceId}/diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    closeModal('diagnosis-modal');
    loadData();
});

function showSignModal(id) {
    currentServiceId = id;
    document.getElementById('sign-modal').classList.add('active');
}

document.getElementById('sign-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        signature: document.getElementById('sign-name').value
    };
    
    await fetch(`/api/service_records/${currentServiceId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    closeModal('sign-modal');
    loadData();
});

function showPartsRequestModal(id) {
    currentServiceId = id;
    document.getElementById('parts-request-modal').classList.add('active');
}

document.getElementById('parts-request-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        service_record_id: currentServiceId,
        parts_name: document.getElementById('parts-name').value,
        quantity: parseInt(document.getElementById('parts-quantity').value)
    };
    
    try {
        const response = await fetch('/api/parts_requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || '提交失败');
            return;
        }
        
        closeModal('parts-request-modal');
        loadData();
    } catch (error) {
        console.error('提交失败:', error);
        alert('提交失败，请重试');
    }
});

function renderPartsRequests(requests) {
    const list = document.getElementById('parts-list');
    list.innerHTML = requests.map(req => `
        <div class="parts-card">
            <h4>${req.parts_name}</h4>
            <div class="info-row">
                <span><strong>数量:</strong> ${req.quantity}</span>
                <span class="badge ${req.status === '待审核' ? 'pending' : 'approved'}">${req.status}</span>
            </div>
            <div class="info-row">
                <span><strong>仓库状态:</strong></span>
                <span class="badge ${getWarehouseClass(req.warehouse_status)}">${req.warehouse_status}</span>
            </div>
            <p><strong>客户:</strong> ${req.service_info.customer_name}</p>
            <p><strong>设备:</strong> ${req.service_info.equipment_model}</p>
            <p><strong>故障类型:</strong> ${req.service_info.fault_type}</p>
            
            <div class="actions" style="margin-top: 15px;">
                ${req.status === '待审核' ? `<button class="action-btn" onclick="showApproveModal(${req.id})">审核通过</button>` : ''}
                ${req.status === '已审核' ? `<button class="action-btn secondary" onclick="showWarehouseModal(${req.id})">仓库处理</button>` : ''}
            </div>
        </div>
    `).join('');
}

function getWarehouseClass(status) {
    switch(status) {
        case '待处理': return 'pending-warehouse';
        case '备货中': return 'processing';
        case '已发货': return 'shipped';
        default: return 'pending-warehouse';
    }
}

function filterPartsRequests() {
    const status = document.getElementById('parts-status-filter').value;
    const warehouseStatus = document.getElementById('warehouse-status-filter').value;
    
    let filtered = partsRequests;
    
    if (status !== 'all') {
        filtered = filtered.filter(p => p.status === status);
    }
    
    if (warehouseStatus !== 'all') {
        filtered = filtered.filter(p => p.warehouse_status === warehouseStatus);
    }
    
    renderPartsRequests(filtered);
}

function showApproveModal(id) {
    currentPartsRequestId = id;
    const req = partsRequests.find(p => p.id === id);
    
    document.getElementById('approve-info').innerHTML = `
        <p><strong>配件名称:</strong> ${req.parts_name}</p>
        <p><strong>数量:</strong> ${req.quantity}</p>
        <p><strong>客户:</strong> ${req.service_info.customer_name}</p>
        <p><strong>设备:</strong> ${req.service_info.equipment_model}</p>
        <p><strong>故障类型:</strong> ${req.service_info.fault_type}</p>
    `;
    
    document.getElementById('parts-approve-modal').classList.add('active');
}

async function approvePartsRequest() {
    try {
        const response = await fetch(`/api/parts_requests/${currentPartsRequestId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approver_id: 1 })
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || '审核失败');
            return;
        }
        
        closeModal('parts-approve-modal');
        loadData();
    } catch (error) {
        console.error('审核失败:', error);
        alert('审核失败，请重试');
    }
}

function showWarehouseModal(id) {
    currentPartsRequestId = id;
    const req = partsRequests.find(p => p.id === id);
    
    document.getElementById('warehouse-info').innerHTML = `
        <p><strong>配件名称:</strong> ${req.parts_name}</p>
        <p><strong>数量:</strong> ${req.quantity}</p>
        <p><strong>客户:</strong> ${req.service_info.customer_name}</p>
    `;
    
    document.getElementById('warehouse-modal').classList.add('active');
}

async function processWarehouse() {
    const data = {
        status: document.getElementById('warehouse-status').value,
        handler: document.getElementById('warehouse-handler').value
    };
    
    try {
        const response = await fetch(`/api/parts_requests/${currentPartsRequestId}/warehouse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || '处理失败');
            return;
        }
        
        closeModal('warehouse-modal');
        loadData();
    } catch (error) {
        console.error('处理失败:', error);
        alert('处理失败，请重试');
    }
}

function renderRecords() {
    const tbody = document.getElementById('records-body');
    tbody.innerHTML = serviceRecords.map(record => `
        <tr>
            <td>${record.customer_name}</td>
            <td>${record.equipment_model}</td>
            <td>${record.equipment_serial}</td>
            <td>${record.service_date}</td>
            <td>${record.technician_name || '-'}</td>
            <td>${record.fault_type || '-'}</td>
            <td>${record.need_stop ? '是' : '否'}</td>
            <td>${record.diagnosis || '-'}</td>
            <td>${record.customer_signature || '-'}</td>
        </tr>
    `).join('');
}

function filterByDate() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let filtered = serviceRecords;
    
    if (startDate) {
        filtered = filtered.filter(s => s.service_date >= startDate);
    }
    
    if (endDate) {
        filtered = filtered.filter(s => s.service_date <= endDate + ' 23:59:59');
    }
    
    const tbody = document.getElementById('records-body');
    tbody.innerHTML = filtered.map(record => `
        <tr>
            <td>${record.customer_name}</td>
            <td>${record.equipment_model}</td>
            <td>${record.equipment_serial}</td>
            <td>${record.service_date}</td>
            <td>${record.technician_name || '-'}</td>
            <td>${record.fault_type || '-'}</td>
            <td>${record.need_stop ? '是' : '否'}</td>
            <td>${record.diagnosis || '-'}</td>
            <td>${record.customer_signature || '-'}</td>
        </tr>
    `).join('');
}

function viewServiceDetail(id) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="service"]').classList.add('active');
    document.getElementById('service').classList.add('active');
    
    document.getElementById('status-filter').value = 'all';
    renderServiceCards(serviceRecords);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    
    if (modalId === 'new-service-modal') {
        document.getElementById('new-service-form').reset();
    } else if (modalId === 'checkin-modal') {
        document.getElementById('checkin-form').reset();
        document.getElementById('checkin-location').value = '客户现场';
    } else if (modalId === 'diagnosis-modal') {
        document.getElementById('diagnosis-form').reset();
    } else if (modalId === 'sign-modal') {
        document.getElementById('sign-form').reset();
    } else if (modalId === 'parts-request-modal') {
        document.getElementById('parts-request-form').reset();
        document.getElementById('parts-quantity').value = 1;
    } else if (modalId === 'warehouse-modal') {
        document.getElementById('warehouse-handler').value = '';
    }
}
