let stores = [];
let products = [];
let allocationsForReceipt = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    loadDashboard();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

async function loadInitialData() {
    stores = await window.api.getStores();
    products = await window.api.getProducts();
    
    populateStoreSelects();
}

function populateStoreSelects() {
    const selects = [
        'requestStoreFilter', 'requestStore', 
        'allocationStoreFilter', 
        'receiptStoreFilter', 
        'discrepancyStoreFilter',
        'feedbackStore'
    ];
    
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.id;
                option.textContent = store.name;
                select.appendChild(option);
            });
        }
    });
}

function updateCurrentTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function showSection(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelector(`.nav-item[data-section="${section}"]`).classList.add('active');
    document.getElementById(`${section}-section`).classList.add('active');
    
    switch (section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'requests':
            loadShortageRequests();
            break;
        case 'allocations':
            loadAllocations();
            break;
        case 'receipts':
            loadReceipts();
            break;
        case 'discrepancies':
            loadDiscrepancies();
            break;
        case 'feedbacks':
            loadFeedbacks();
            break;
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function loadDashboard() {
    const stats = await window.api.getDashboardStats();
    
    document.getElementById('pendingRequests').textContent = stats.pendingRequests;
    document.getElementById('affectBusiness').textContent = stats.affectBusiness;
    document.getElementById('pendingAllocations').textContent = stats.pendingAllocations;
    document.getElementById('pendingReceipts').textContent = stats.pendingReceipts;
    document.getElementById('pendingDiscrepancies').textContent = stats.pendingDiscrepancies;
    
    await loadPendingRequestsList();
    await loadAffectBusinessList();
    await loadPendingAllocationsList();
}

async function loadPendingRequestsList() {
    const requests = await window.api.getShortageRequests({ status: 'pending' });
    const container = document.getElementById('pendingRequestsList');
    
    if (requests.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无待审核申领</div>';
        return;
    }
    
    container.innerHTML = requests.slice(0, 5).map(r => `
        <div style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 500;">${r.store_name} - ${r.product_name}</div>
            <div style="font-size: 0.75rem; color: #64748b;">申请 ${r.requested_qty} ${r.product_unit}</div>
        </div>
    `).join('');
}

async function loadAffectBusinessList() {
    const requests = await window.api.getShortageRequests({ affect_business: true });
    const container = document.getElementById('affectBusinessList');
    
    if (requests.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无影响营业的缺货</div>';
        return;
    }
    
    container.innerHTML = requests.slice(0, 5).map(r => `
        <div style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 500;">${r.store_name} - ${r.product_name}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${getStatusLabel(r.status)}</div>
        </div>
    `).join('');
}

async function loadPendingAllocationsList() {
    const allocations = await window.api.getAllocations({ status: 'allocated' });
    const container = document.getElementById('pendingAllocationsList');
    
    if (allocations.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无待发货配货</div>';
        return;
    }
    
    container.innerHTML = allocations.slice(0, 5).map(a => `
        <div style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 500;">${a.store_name} - ${a.product_name}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${a.warehouse} - ${a.shipping_date}</div>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    const labels = {
        'pending': '待审核',
        'approved': '已批准',
        'allocated': '已配货',
        'shipped': '已发货',
        'received': '已到货',
        'rejected': '已拒绝',
        'completed': '已完成',
        'discrepancy': '有差异'
    };
    return labels[status] || status;
}

async function loadShortageRequests() {
    const filters = {
        store_id: document.getElementById('requestStoreFilter').value || undefined,
        status: document.getElementById('requestStatusFilter').value || undefined
    };
    
    const requests = await window.api.getShortageRequests(filters);
    const tbody = document.getElementById('requestsTableBody');
    
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = requests.map(r => `
        <tr>
            <td>${r.store_name}</td>
            <td>${r.product_name}</td>
            <td>${r.product_spec || '-'}</td>
            <td>${r.requested_qty} ${r.product_unit}</td>
            <td>${r.affect_business === 1 ? '<span style="color: #dc2626;">是</span>' : '否'}</td>
            <td>${r.reason}</td>
            <td><span class="status-badge ${r.status}">${getStatusLabel(r.status)}</span></td>
            <td>${r.created_by_name || '-'}</td>
            <td>
                ${r.status === 'pending' ? `
                    <button class="btn btn-secondary action-btn" onclick="showReviewModal(${r.id})">审核</button>
                ` : r.status === 'approved' ? `
                    <button class="btn btn-primary action-btn" onclick="showAllocationModal(${r.id}, '${r.store_name}', '${r.product_name}', ${r.requested_qty})">配货</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function showNewRequestModal() {
    document.getElementById('requestForm').reset();
    document.getElementById('requestUnit').value = '';
    
    document.getElementById('requestProduct').innerHTML = '';
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} (${p.code})`;
        document.getElementById('requestProduct').appendChild(option);
    });
    
    document.getElementById('requestProduct').addEventListener('change', updateProductUnit);
    document.getElementById('newRequestModal').classList.add('active');
}

function updateProductUnit() {
    const productId = document.getElementById('requestProduct').value;
    const product = products.find(p => p.id == productId);
    if (product) {
        document.getElementById('requestUnit').value = product.unit;
    }
}

async function saveRequest() {
    const data = {
        store_id: parseInt(document.getElementById('requestStore').value),
        product_id: parseInt(document.getElementById('requestProduct').value),
        requested_qty: parseInt(document.getElementById('requestQty').value),
        reason: document.getElementById('requestReason').value,
        affect_business: document.getElementById('requestAffectBusiness').checked,
        created_by: 1
    };
    
    await window.api.createShortageRequest(data);
    closeModal('newRequestModal');
    loadShortageRequests();
    loadDashboard();
}

function showReviewModal(id) {
    document.getElementById('reviewRequestId').value = id;
    document.getElementById('reviewStatus').value = 'approved';
    document.getElementById('reviewNote').value = '';
    
    window.api.getShortageRequests({ status: 'pending' }).then(requests => {
        const request = requests.find(r => r.id == id);
        if (request) {
            document.getElementById('reviewStoreName').textContent = request.store_name;
            document.getElementById('reviewProductName').textContent = request.product_name;
            document.getElementById('reviewRequestQty').textContent = `${request.requested_qty} ${request.product_unit}`;
            document.getElementById('reviewRequestReason').textContent = request.reason;
        }
    });
    
    document.getElementById('reviewRequestModal').classList.add('active');
}

async function saveReview() {
    const id = parseInt(document.getElementById('reviewRequestId').value);
    const data = {
        status: document.getElementById('reviewStatus').value,
        reviewed_by: 6,
        review_note: document.getElementById('reviewNote').value
    };
    
    await window.api.reviewShortageRequest(id, data);
    closeModal('reviewRequestModal');
    loadShortageRequests();
    loadDashboard();
}

function showAllocationModal(requestId, storeName, productName, requestedQty) {
    document.getElementById('allocationRequestId').value = requestId;
    document.getElementById('allocationStoreName').textContent = storeName;
    document.getElementById('allocationProductName').textContent = productName;
    document.getElementById('allocationRequestedQty').textContent = requestedQty;
    document.getElementById('allocationQty').value = requestedQty;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('allocationDate').value = today;
    document.getElementById('allocationTrackingNo').value = '';
    
    document.getElementById('createAllocationModal').classList.add('active');
}

async function saveAllocation() {
    const data = {
        request_id: parseInt(document.getElementById('allocationRequestId').value),
        allocated_qty: parseInt(document.getElementById('allocationQty').value),
        allocated_by: 10,
        warehouse: document.getElementById('allocationWarehouse').value,
        shipping_date: document.getElementById('allocationDate').value,
        tracking_no: document.getElementById('allocationTrackingNo').value
    };
    
    await window.api.createAllocation(data);
    closeModal('createAllocationModal');
    loadShortageRequests();
    loadAllocations();
    loadDashboard();
}

async function loadAllocations() {
    const filters = {
        store_id: document.getElementById('allocationStoreFilter').value || undefined,
        status: document.getElementById('allocationStatusFilter').value || undefined
    };
    
    const allocations = await window.api.getAllocations(filters);
    const tbody = document.getElementById('allocationsTableBody');
    
    if (allocations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = allocations.map(a => `
        <tr>
            <td>${a.store_name}</td>
            <td>${a.product_name}</td>
            <td>${a.requested_qty || '-'}</td>
            <td>${a.allocated_qty}</td>
            <td>${a.warehouse}</td>
            <td>${a.shipping_date || '-'}</td>
            <td>${a.tracking_no || '-'}</td>
            <td><span class="status-badge ${a.status}">${getStatusLabel(a.status)}</span></td>
            <td>
                ${a.status === 'allocated' ? `
                    <button class="btn btn-primary action-btn" onclick="markAsShipped(${a.id})">发货</button>
                ` : a.status === 'shipped' ? `
                    <button class="btn btn-success action-btn" onclick="showNewReceiptModal(${a.id})">验收</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

async function markAsShipped(id) {
    await window.api.updateAllocationStatus(id, 'shipped');
    loadAllocations();
    loadDashboard();
}

async function loadReceipts() {
    const filters = {
        store_id: document.getElementById('receiptStoreFilter').value || undefined,
        status: document.getElementById('receiptStatusFilter').value || undefined
    };
    
    const receipts = await window.api.getReceipts(filters);
    const tbody = document.getElementById('receiptsTableBody');
    
    if (receipts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = receipts.map(r => `
        <tr>
            <td>${r.store_name}</td>
            <td>${r.product_name}</td>
            <td>${r.allocated_qty || '-'}</td>
            <td>${r.received_qty || '-'}</td>
            <td>${r.tracking_no || '-'}</td>
            <td>${r.received_at ? new Date(r.received_at).toLocaleString('zh-CN') : '-'}</td>
            <td><span class="status-badge ${r.status}">${getStatusLabel(r.status)}</span></td>
            <td>${r.received_by_name || '-'}</td>
            <td>
                ${r.status !== 'completed' ? `
                    <button class="btn btn-primary action-btn" onclick="showNewReceiptModal(${r.allocation_id})">验收</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

async function showNewReceiptModal(allocationId) {
    allocationsForReceipt = await window.api.getAllocations({ status: 'shipped' });
    
    document.getElementById('receiptForm').reset();
    document.getElementById('receiptAllocation').innerHTML = '';
    document.getElementById('receiptStoreName').textContent = '';
    document.getElementById('receiptProductName').textContent = '';
    document.getElementById('receiptAllocatedQty').textContent = '';
    document.getElementById('receiptTempRange').textContent = '';
    document.getElementById('discrepancyFields').style.display = 'none';
    
    allocationsForReceipt.forEach(a => {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = `${a.store_name} - ${a.product_name} (${a.allocated_qty})`;
        document.getElementById('receiptAllocation').appendChild(option);
    });
    
    if (allocationId) {
        document.getElementById('receiptAllocation').value = allocationId;
        updateReceiptAllocationInfo(allocationId);
    }
    
    document.getElementById('receiptAllocation').addEventListener('change', (e) => {
        updateReceiptAllocationInfo(e.target.value);
    });
    
    document.getElementById('receiptHasDiscrepancy').addEventListener('change', toggleDiscrepancyFields);
    
    document.getElementById('newReceiptModal').classList.add('active');
}

function updateReceiptAllocationInfo(allocationId) {
    const allocation = allocationsForReceipt.find(a => a.id == allocationId);
    if (allocation) {
        document.getElementById('receiptStoreName').textContent = allocation.store_name;
        document.getElementById('receiptProductName').textContent = allocation.product_name;
        document.getElementById('receiptAllocatedQty').textContent = allocation.allocated_qty;
        
        const product = products.find(p => p.id == allocation.product_id);
        if (product && product.is_cold_chain === 1) {
            document.getElementById('receiptTempRange').textContent = 
                `(要求: ${product.temperature_min}°C ~ ${product.temperature_max}°C)`;
        } else {
            document.getElementById('receiptTempRange').textContent = '';
        }
    }
}

function toggleDiscrepancyFields() {
    const hasDiscrepancy = document.getElementById('receiptHasDiscrepancy').checked;
    document.getElementById('discrepancyFields').style.display = hasDiscrepancy ? 'block' : 'none';
}

async function saveReceipt() {
    const allocationId = parseInt(document.getElementById('receiptAllocation').value);
    const allocation = allocationsForReceipt.find(a => a.id == allocationId);
    
    const data = {
        allocation_id: allocationId,
        store_id: allocation.store_id,
        received_qty: parseInt(document.getElementById('receiptQty').value),
        received_by: 1
    };
    
    const hasDiscrepancy = document.getElementById('receiptHasDiscrepancy').checked;
    const status = hasDiscrepancy ? 'discrepancy' : 'completed';
    data.status = status;
    
    const receiptResult = await window.api.createReceipt(data);
    
    if (hasDiscrepancy) {
        const discrepancyType = document.getElementById('discrepancyType').value;
        const discrepancyDesc = document.getElementById('discrepancyDesc').value;
        
        let qtyDiff = 0;
        let temperature = null;
        
        if (discrepancyType === 'shortage') {
            qtyDiff = data.received_qty - allocation.allocated_qty;
        } else if (discrepancyType === 'excess') {
            qtyDiff = data.received_qty - allocation.allocated_qty;
        } else if (discrepancyType === 'temperature') {
            temperature = parseFloat(document.getElementById('receiptTemperature').value);
        }
        
        await window.api.createDiscrepancy({
            receipt_id: receiptResult[0].id,
            type: discrepancyType,
            description: discrepancyDesc,
            qty_diff: qtyDiff,
            temperature: temperature
        });
    }
    
    closeModal('newReceiptModal');
    loadReceipts();
    loadDiscrepancies();
    loadDashboard();
}

async function loadDiscrepancies() {
    const filters = {
        store_id: document.getElementById('discrepancyStoreFilter').value || undefined,
        status: document.getElementById('discrepancyStatusFilter').value || undefined
    };
    
    const discrepancies = await window.api.getDiscrepancies(filters);
    const tbody = document.getElementById('discrepanciesTableBody');
    
    if (discrepancies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无数据</td></tr>';
        return;
    }
    
    const typeLabels = {
        'shortage': '数量不足',
        'excess': '数量超额',
        'wrong_item': '错配商品',
        'temperature': '温度异常',
        'spec': '规格不符',
        'other': '其他'
    };
    
    tbody.innerHTML = discrepancies.map(d => `
        <tr>
            <td>${d.store_name}</td>
            <td>${typeLabels[d.type] || d.type}</td>
            <td>${d.description}</td>
            <td>${d.qty_diff !== 0 ? d.qty_diff : '-'}</td>
            <td>${d.temperature ? `${d.temperature}°C` : '-'}</td>
            <td><span class="status-badge ${d.status === 'reported' ? 'pending' : 'resolved'}">${d.status === 'reported' ? '待处理' : '已解决'}</span></td>
            <td>
                ${d.status === 'reported' ? `
                    <button class="btn btn-primary action-btn" onclick="showResolveModal(${d.id}, '${d.store_name}', '${typeLabels[d.type]}', '${d.description}')">处理</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function showResolveModal(id, storeName, type, desc) {
    document.getElementById('resolveDiscrepancyId').value = id;
    document.getElementById('resolveStoreName').textContent = storeName;
    document.getElementById('resolveDiscrepancyType').textContent = type;
    document.getElementById('resolveDiscrepancyDesc').textContent = desc;
    document.getElementById('resolveNote').value = '';
    
    document.getElementById('resolveDiscrepancyModal').classList.add('active');
}

async function saveResolve() {
    const id = parseInt(document.getElementById('resolveDiscrepancyId').value);
    const data = {
        resolved_by: 10,
        resolve_note: document.getElementById('resolveNote').value
    };
    
    await window.api.resolveDiscrepancy(id, data);
    closeModal('resolveDiscrepancyModal');
    loadDiscrepancies();
    loadDashboard();
}

async function loadFeedbacks() {
    const filters = {
        store_id: document.getElementById('feedbackStoreFilter').value || undefined
    };
    
    const feedbacks = await window.api.getFeedbacks(filters);
    const tbody = document.getElementById('feedbacksTableBody');
    
    if (feedbacks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无数据</td></tr>';
        return;
    }
    
    const typeLabels = {
        'general': '一般反馈',
        'receipt': '验收反馈',
        'suggestion': '建议',
        'complaint': '投诉'
    };
    
    tbody.innerHTML = feedbacks.map(f => `
        <tr>
            <td>${f.store_name}</td>
            <td><span class="status-badge ${f.type}">${typeLabels[f.type] || f.type}</span></td>
            <td>${f.content}</td>
            <td>${f.created_by_name || '-'}</td>
            <td>${f.created_at ? new Date(f.created_at).toLocaleString('zh-CN') : '-'}</td>
        </tr>
    `).join('');
}

function showNewFeedbackModal() {
    document.getElementById('feedbackForm').reset();
    document.getElementById('newFeedbackModal').classList.add('active');
}

async function saveFeedback() {
    const data = {
        store_id: parseInt(document.getElementById('feedbackStore').value),
        type: document.getElementById('feedbackType').value,
        content: document.getElementById('feedbackContent').value,
        created_by: 1
    };
    
    await window.api.createFeedback(data);
    closeModal('newFeedbackModal');
    loadFeedbacks();
}