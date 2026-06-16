let currentSection = 'dashboard';
let currentAppointmentId = null;
let currentStyleConfirmationId = null;
let employees = [];

document.addEventListener('DOMContentLoaded', async () => {
    updateTime();
    setInterval(updateTime, 1000);
    
    setupNavigation();
    setupTabs();
    
    await loadEmployees();
    await loadDashboard();
});

function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            if (section) {
                showSection(section);
            }
            
            const step = item.dataset.step;
            if (step) {
                filterByWorkflow(step);
            }
        });
    });
}

function showSection(section) {
    currentSection = section;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');
    
    switch (section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'recent':
            loadRecentItems();
            break;
        case 'history':
            loadOperationHistory();
            break;
    }
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            btn.closest('.detail-tabs').querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            
            btn.closest('.modal-content').querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            btn.closest('.modal-content').querySelector(`#tab-${tab}`).classList.add('active');
        });
    });
}

async function loadEmployees() {
    try {
        employees = await window.api.getEmployees();
        
        const tailorSelect = document.getElementById('tailorId');
        const patternSelect = document.getElementById('patternMakerId');
        const serviceSelect = document.getElementById('customerServiceId');
        
        const tailors = employees.filter(e => e.role === 'tailor');
        const patterns = employees.filter(e => e.role === 'pattern_maker');
        const services = employees.filter(e => e.role === 'customer_service');
        
        tailorSelect.innerHTML = '<option value="">请选择量体师</option>' +
            tailors.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        
        patternSelect.innerHTML = '<option value="">请选择版师</option>' +
            patterns.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        
        serviceSelect.innerHTML = '<option value="">请选择客服</option>' +
            services.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        
    } catch (error) {
        console.error('加载员工列表失败:', error);
    }
}

async function loadDashboard() {
    try {
        const stats = await window.api.getDashboardStats();
        
        document.getElementById('pendingCount').textContent = stats.pending_appointments;
        document.getElementById('inProgressCount').textContent = stats.in_progress_appointments;
        document.getElementById('todayCount').textContent = stats.today_appointments;
        document.getElementById('pendingStyles').textContent = stats.pending_style_confirmations;
        
        await loadRiskItems();
        await loadRecentChanges();
        await loadTodos();
    } catch (error) {
        console.error('加载仪表盘失败:', error);
    }
}

async function loadRiskItems() {
    try {
        const riskItems = await window.api.getRiskItems();
        const container = document.getElementById('riskItemsList');
        
        if (riskItems.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无风险项</div>';
            return;
        }
        
        container.innerHTML = riskItems.map(item => `
            <div class="risk-item ${item.severity}" onclick="viewAppointment(${item.appointment_id})">
                <div class="risk-icon">⚠️</div>
                <div class="risk-content">
                    <div class="risk-title">${item.customer_name}</div>
                    <div class="risk-message">${item.message}</div>
                    <div class="risk-date">预约日期: ${item.appointment_date}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载风险项失败:', error);
    }
}

async function loadRecentChanges() {
    try {
        const history = await window.api.getOperationHistory({ limit: 5 });
        const container = document.getElementById('recentChangesList');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无最近变更</div>';
            return;
        }
        
        container.innerHTML = history.map(item => {
            const icon = getOperationIcon(item.operation_type);
            const time = new Date(item.created_at).toLocaleString('zh-CN');
            
            return `
                <div class="history-item">
                    <div class="history-icon">${icon}</div>
                    <div class="history-content">
                        <div class="history-description">${item.description}</div>
                        <div class="history-meta">
                            ${time} · ${item.operator_name || '系统'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('加载最近变更失败:', error);
    }
}

function getOperationIcon(type) {
    const icons = {
        'create': '✨',
        'update': '✏️',
        'delete': '🗑️',
        'status_change': '🔄',
        'approve': '✅',
        'reject': '❌',
        'warning': '⚠️',
        'complete': '🎉'
    };
    return icons[type] || '📋';
}

async function loadAppointments() {
    try {
        const status = document.getElementById('appointmentStatusFilter').value;
        const date = document.getElementById('appointmentDateFilter').value;
        
        const filters = {};
        if (status) filters.status = status;
        if (date) filters.date = date;
        
        const appointments = await window.api.getAppointments(filters);
        const tbody = document.getElementById('appointmentsTableBody');
        
        if (appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无预约数据</td></tr>';
            return;
        }
        
        tbody.innerHTML = appointments.map(apt => {
            const statusBadge = getStatusBadge(apt.status);
            const date = new Date(apt.appointment_date).toLocaleDateString('zh-CN');
            
            return `
                <tr>
                    <td>${apt.customer_name}</td>
                    <td>${date}</td>
                    <td>${apt.appointment_time || '-'}</td>
                    <td>${apt.tailor_name || '-'}</td>
                    <td>${apt.pattern_maker_name || '-'}</td>
                    <td>${statusBadge}</td>
                    <td>${apt.notes || '-'}</td>
                    <td>
                        <button class="action-btn" onclick="viewAppointment(${apt.id})">查看</button>
                        <button class="action-btn" onclick="editAppointment(${apt.id})">编辑</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('加载预约列表失败:', error);
    }
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': '待处理',
        'confirmed': '已确认',
        'in_progress': '进行中',
        'completed': '已完成',
        'risk': '风险项',
        'approved': '已批准',
        'rejected': '已拒绝'
    };
    
    return `<span class="status-badge ${status}">${statusMap[status] || status}</span>`;
}

function filterAppointments(status) {
    if (status === 'today') {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDateFilter').value = today;
    } else {
        document.getElementById('appointmentStatusFilter').value = status;
    }
    showSection('appointments');
    loadAppointments();
}

async function filterByWorkflow(step) {
    const roleMap = {
        'tailor': 'tailor_id',
        'pattern': 'pattern_maker_id',
        'service': 'customer_service_id'
    };
    
    const roleField = roleMap[step];
    const roleEmployees = employees.filter(e => e.role === (step === 'tailor' ? 'tailor' : step === 'pattern' ? 'pattern_maker' : 'customer_service'));
    
    if (roleEmployees.length > 0) {
        document.getElementById('appointmentStatusFilter').value = '';
        document.getElementById('appointmentDateFilter').value = '';
        showSection('appointments');
        
        const appointments = await window.api.getAppointments({});
        const filteredAppointments = appointments.filter(apt => apt[roleField] === roleEmployees[0].id);
        
        const tbody = document.getElementById('appointmentsTableBody');
        
        if (filteredAppointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无该角色的预约数据</td></tr>';
            return;
        }
        
        tbody.innerHTML = filteredAppointments.map(apt => {
            const statusBadge = getStatusBadge(apt.status);
            const date = new Date(apt.appointment_date).toLocaleDateString('zh-CN');
            
            return `
                <tr>
                    <td>${apt.customer_name}</td>
                    <td>${date}</td>
                    <td>${apt.appointment_time || '-'}</td>
                    <td>${apt.tailor_name || '-'}</td>
                    <td>${apt.pattern_maker_name || '-'}</td>
                    <td>${statusBadge}</td>
                    <td>${apt.notes || '-'}</td>
                    <td>
                        <button class="action-btn" onclick="viewAppointment(${apt.id})">查看</button>
                        <button class="action-btn" onclick="editAppointment(${apt.id})">编辑</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function showNewAppointmentModal() {
    document.getElementById('appointmentModalTitle').textContent = '新建预约';
    document.getElementById('appointmentForm').reset();
    document.getElementById('appointmentId').value = '';
    
    document.getElementById('appointmentDate').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('appointmentModal').classList.add('active');
}

async function editAppointment(id) {
    try {
        const appointment = await window.api.getAppointment(id);
        
        document.getElementById('appointmentModalTitle').textContent = '编辑预约';
        document.getElementById('appointmentId').value = appointment.id;
        document.getElementById('customerName').value = appointment.customer_name;
        document.getElementById('customerPhone').value = appointment.customer_phone || '';
        document.getElementById('appointmentDate').value = appointment.appointment_date;
        document.getElementById('appointmentTime').value = appointment.appointment_time || '';
        document.getElementById('tailorId').value = appointment.tailor_id || '';
        document.getElementById('patternMakerId').value = appointment.pattern_maker_id || '';
        document.getElementById('customerServiceId').value = appointment.customer_service_id || '';
        document.getElementById('appointmentStatus').value = appointment.status;
        document.getElementById('appointmentNotes').value = appointment.notes || '';
        
        document.getElementById('appointmentModal').classList.add('active');
    } catch (error) {
        console.error('加载预约详情失败:', error);
    }
}

async function saveAppointment() {
    try {
        const id = document.getElementById('appointmentId').value;
        const data = {
            customer_name: document.getElementById('customerName').value,
            customer_phone: document.getElementById('customerPhone').value,
            appointment_date: document.getElementById('appointmentDate').value,
            appointment_time: document.getElementById('appointmentTime').value,
            tailor_id: document.getElementById('tailorId').value || null,
            pattern_maker_id: document.getElementById('patternMakerId').value || null,
            customer_service_id: document.getElementById('customerServiceId').value || null,
            status: document.getElementById('appointmentStatus').value,
            notes: document.getElementById('appointmentNotes').value
        };
        
        if (!data.customer_name || !data.appointment_date) {
            alert('请填写必填项');
            return;
        }
        
        if (id) {
            await window.api.updateAppointment(parseInt(id), data);
        } else {
            await window.api.createAppointment(data);
        }
        
        closeModal('appointmentModal');
        loadAppointments();
        loadDashboard();
    } catch (error) {
        console.error('保存预约失败:', error);
        alert('保存失败: ' + error.message);
    }
}

async function viewAppointment(id) {
    try {
        const appointment = await window.api.getAppointment(id);
        currentAppointmentId = id;
        
        document.getElementById('appointmentDetailTitle').textContent = 
            `${appointment.customer_name} - 预约详情`;
        
        document.getElementById('detailCustomerName').textContent = appointment.customer_name;
        document.getElementById('detailCustomerPhone').textContent = appointment.customer_phone || '-';
        document.getElementById('detailAppointmentDate').textContent = 
            new Date(appointment.appointment_date).toLocaleDateString('zh-CN');
        document.getElementById('detailAppointmentTime').textContent = 
            appointment.appointment_time || '-';
        document.getElementById('detailTailor').textContent = appointment.tailor_name || '-';
        document.getElementById('detailPatternMaker').textContent = appointment.pattern_maker_name || '-';
        document.getElementById('detailCustomerService').textContent = appointment.customer_service_name || '-';
        
        const statusBadge = getStatusBadge(appointment.status);
        document.getElementById('detailStatus').innerHTML = statusBadge.outerHTML;
        
        document.getElementById('detailNotes').textContent = appointment.notes || '-';
        
        renderMeasurements(appointment.measurements || []);
        renderFabricCards(appointment.fabric_cards || []);
        renderStyleConfirmations(appointment.style_confirmations || []);
        renderFittingRecords(appointment.fitting_records || []);
        
        await window.api.addRecentItem({
            item_type: 'appointment',
            item_id: id,
            item_title: `${appointment.customer_name} - ${appointment.notes || '预约'}`,
            accessed_by: 1
        });
        
        document.getElementById('appointmentDetailModal').classList.add('active');
    } catch (error) {
        console.error('加载预约详情失败:', error);
    }
}

function renderMeasurements(measurements) {
    const container = document.getElementById('measurementsList');
    
    if (measurements.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无量体记录</div>';
        return;
    }
    
    container.innerHTML = measurements.map(m => {
        const date = new Date(m.measured_at).toLocaleString('zh-CN');
        
        return `
            <div class="record-card">
                <div class="record-header">
                    <div class="record-title">量体记录</div>
                    <div class="record-date">${date}</div>
                </div>
                <div class="record-grid">
                    <div class="record-field">
                        <label>身高:</label> ${m.height || '-'} cm
                    </div>
                    <div class="record-field">
                        <label>体重:</label> ${m.weight || '-'} kg
                    </div>
                    <div class="record-field">
                        <label>胸围:</label> ${m.bust || '-'} cm
                    </div>
                    <div class="record-field">
                        <label>腰围:</label> ${m.waist || '-'} cm
                    </div>
                    <div class="record-field">
                        <label>臀围:</label> ${m.hip || '-'} cm
                    </div>
                    <div class="record-field">
                        <label>肩宽:</label> ${m.shoulder_width || '-'} cm
                    </div>
                    <div class="record-field">
                        <label>臂长:</label> ${m.arm_length || '-'} cm
                    </div>
                    <div class="record-field">
                        <label>腿长:</label> ${m.leg_length || '-'} cm
                    </div>
                </div>
                ${m.notes ? `<div class="record-field" style="margin-top: 8px;"><label>备注:</label> ${m.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderFabricCards(fabricCards) {
    const container = document.getElementById('fabricCardsList');
    
    if (fabricCards.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无面料卡</div>';
        return;
    }
    
    container.innerHTML = fabricCards.map(fc => `
        <div class="record-card">
            <div class="record-header">
                <div class="record-title">${fc.fabric_name}</div>
                <div class="record-date">¥${fc.price_per_meter || 0}/米</div>
            </div>
            <div class="record-grid">
                <div class="record-field">
                    <label>编号:</label> ${fc.fabric_code || '-'}
                </div>
                <div class="record-field">
                    <label>颜色:</label> ${fc.color || '-'}
                </div>
                <div class="record-field">
                    <label>花纹:</label> ${fc.pattern || '-'}
                </div>
                <div class="record-field">
                    <label>供应商:</label> ${fc.supplier || '-'}
                </div>
                <div class="record-field">
                    <label>幅宽:</label> ${fc.width || '-'} cm
                </div>
            </div>
            ${fc.notes ? `<div class="record-field" style="margin-top: 8px;"><label>备注:</label> ${fc.notes}</div>` : ''}
        </div>
    `).join('');
}

function renderStyleConfirmations(styleConfirmations) {
    const container = document.getElementById('styleConfirmationsList');
    
    if (styleConfirmations.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无款式确认</div>';
        return;
    }
    
    container.innerHTML = styleConfirmations.map(sc => {
        const statusBadge = getStatusBadge(sc.approval_status);
        const isPending = sc.approval_status === 'pending';
        
        return `
            <div class="record-card">
                <div class="record-header">
                    <div class="record-title">${sc.style_name}</div>
                    ${statusBadge}
                </div>
                <div class="record-grid">
                    <div class="record-field">
                        <label>类型:</label> ${sc.style_type || '-'}
                    </div>
                    <div class="record-field">
                        <label>创建人:</label> ${sc.created_by_name || '-'}
                    </div>
                </div>
                <div class="record-details" id="style-details-${sc.id}" style="display: none;">
                    ${sc.design_description ? `
                        <div class="record-field">
                            <label>设计描述:</label> ${sc.design_description}
                        </div>
                    ` : ''}
                    <div class="record-field">
                        <label>审批人:</label> ${sc.approved_by_name || '-'}
                    </div>
                    <div class="record-field">
                        <label>备注:</label> ${sc.notes || '-'}
                    </div>
                </div>
                <div style="margin-top: 12px;">
                    <button class="btn btn-secondary" onclick="toggleStyleDetails(${sc.id})">${isPending ? '展开详情' : '查看详情'}</button>
                    ${isPending ? `
                        <button class="btn btn-success" onclick="quickApprove(${sc.id})">批准</button>
                        <button class="btn btn-danger" onclick="quickReject(${sc.id})">拒绝</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function toggleStyleDetails(id) {
    const details = document.getElementById(`style-details-${id}`);
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
}

function renderFittingRecords(fittingRecords) {
    const container = document.getElementById('fittingRecordsList');
    
    if (fittingRecords.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无试衣记录</div>';
        return;
    }
    
    container.innerHTML = fittingRecords.map(fr => {
        const date = new Date(fr.fitting_date).toLocaleDateString('zh-CN');
        const stars = '★'.repeat(fr.fit_rating || 0) + '☆'.repeat(5 - (fr.fit_rating || 0));
        
        return `
            <div class="record-card">
                <div class="record-header">
                    <div class="record-title">${fr.fitting_stage}</div>
                    <div class="record-date">${date}</div>
                </div>
                <div class="record-grid">
                    <div class="record-field">
                        <label>合身度:</label> <span style="color: #faad14;">${stars}</span>
                    </div>
                    <div class="record-field">
                        <label>试衣师:</label> ${fr.fitter_name || '-'}
                    </div>
                </div>
                ${fr.issues ? `
                    <div class="record-field" style="margin-top: 8px;">
                        <label>问题:</label> ${fr.issues}
                    </div>
                ` : ''}
                ${fr.adjustments ? `
                    <div class="record-field" style="margin-top: 4px;">
                        <label>调整:</label> ${fr.adjustments}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function editCurrentAppointment() {
    closeModal('appointmentDetailModal');
    editAppointment(currentAppointmentId);
}

function showNewMeasurementModal() {
    document.getElementById('measurementForm').reset();
    document.getElementById('measurementAppointmentId').value = currentAppointmentId;
    document.getElementById('measurementModal').classList.add('active');
}

async function saveMeasurement() {
    try {
        const data = {
            appointment_id: parseInt(document.getElementById('measurementAppointmentId').value),
            height: parseFloat(document.getElementById('measurementHeight').value) || null,
            weight: parseFloat(document.getElementById('measurementWeight').value) || null,
            bust: parseFloat(document.getElementById('measurementBust').value) || null,
            waist: parseFloat(document.getElementById('measurementWaist').value) || null,
            hip: parseFloat(document.getElementById('measurementHip').value) || null,
            shoulder_width: parseFloat(document.getElementById('measurementShoulder').value) || null,
            arm_length: parseFloat(document.getElementById('measurementArm').value) || null,
            leg_length: parseFloat(document.getElementById('measurementLeg').value) || null,
            notes: document.getElementById('measurementNotes').value,
            measured_by: 1
        };
        
        await window.api.createMeasurement(data);
        
        closeModal('measurementModal');
        await refreshAppointmentDetail();
    } catch (error) {
        console.error('保存量体记录失败:', error);
        alert('保存失败: ' + error.message);
    }
}

function showNewFabricCardModal() {
    document.getElementById('fabricCardForm').reset();
    document.getElementById('fabricCardAppointmentId').value = currentAppointmentId;
    document.getElementById('fabricCardModal').classList.add('active');
}

async function saveFabricCard() {
    try {
        const data = {
            appointment_id: parseInt(document.getElementById('fabricCardAppointmentId').value),
            fabric_name: document.getElementById('fabricName').value,
            fabric_code: document.getElementById('fabricCode').value,
            color: document.getElementById('fabricColor').value,
            pattern: document.getElementById('fabricPattern').value,
            supplier: document.getElementById('fabricSupplier').value,
            price_per_meter: parseFloat(document.getElementById('fabricPrice').value) || null,
            width: parseFloat(document.getElementById('fabricWidth').value) || null,
            notes: document.getElementById('fabricNotes').value,
            created_by: 1
        };
        
        if (!data.fabric_name) {
            alert('请填写面料名称');
            return;
        }
        
        await window.api.createFabricCard(data);
        
        closeModal('fabricCardModal');
        await refreshAppointmentDetail();
    } catch (error) {
        console.error('保存面料卡失败:', error);
        alert('保存失败: ' + error.message);
    }
}

function showNewStyleConfirmationModal() {
    document.getElementById('styleConfirmationForm').reset();
    document.getElementById('styleConfirmationAppointmentId').value = currentAppointmentId;
    document.getElementById('styleConfirmationId').value = '';
    document.getElementById('styleConfirmationModal').classList.add('active');
}

async function saveStyleConfirmation() {
    try {
        const id = document.getElementById('styleConfirmationId').value;
        const data = {
            appointment_id: parseInt(document.getElementById('styleConfirmationAppointmentId').value),
            style_name: document.getElementById('styleName').value,
            style_type: document.getElementById('styleType').value,
            design_description: document.getElementById('styleDescription').value,
            notes: document.getElementById('styleNotes').value,
            created_by: 1
        };
        
        if (!data.style_name) {
            alert('请填写款式名称');
            return;
        }
        
        if (id) {
            await window.api.updateStyleConfirmation(parseInt(id), data);
        } else {
            await window.api.createStyleConfirmation(data);
        }
        
        closeModal('styleConfirmationModal');
        await refreshAppointmentDetail();
    } catch (error) {
        console.error('保存款式确认失败:', error);
        alert('保存失败: ' + error.message);
    }
}

async function approveStyleConfirmation(id) {
    const styleId = id || currentStyleConfirmationId;
    try {
        await window.api.updateStyleConfirmation(styleId, {
            approval_status: 'approved',
            approved_by: 1
        });
        
        await refreshAppointmentDetail();
        loadDashboard();
    } catch (error) {
        console.error('批准款式确认失败:', error);
        alert('操作失败: ' + error.message);
    }
}

async function rejectStyleConfirmation(id) {
    const styleId = id || currentStyleConfirmationId;
    try {
        await window.api.updateStyleConfirmation(styleId, {
            approval_status: 'rejected',
            approved_by: 1
        });
        
        await refreshAppointmentDetail();
        loadDashboard();
    } catch (error) {
        console.error('拒绝款式确认失败:', error);
        alert('操作失败: ' + error.message);
    }
}

function showNewFittingRecordModal() {
    document.getElementById('fittingRecordForm').reset();
    document.getElementById('fittingRecordAppointmentId').value = currentAppointmentId;
    document.getElementById('fittingDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('fittingRecordModal').classList.add('active');
}

async function saveFittingRecord() {
    try {
        const data = {
            appointment_id: parseInt(document.getElementById('fittingRecordAppointmentId').value),
            fitting_stage: document.getElementById('fittingStage').value,
            fitting_date: document.getElementById('fittingDate').value,
            fit_rating: parseInt(document.getElementById('fittingRating').value) || null,
            issues: document.getElementById('fittingIssues').value,
            adjustments: document.getElementById('fittingAdjustments').value,
            notes: document.getElementById('fittingNotes').value,
            fitter_id: 1
        };
        
        if (!data.fitting_stage) {
            alert('请选择试衣阶段');
            return;
        }
        
        await window.api.createFittingRecord(data);
        
        closeModal('fittingRecordModal');
        await refreshAppointmentDetail();
    } catch (error) {
        console.error('保存试衣记录失败:', error);
        alert('保存失败: ' + error.message);
    }
}

async function refreshAppointmentDetail() {
    const appointment = await window.api.getAppointment(currentAppointmentId);
    
    const statusBadge = getStatusBadge(appointment.status);
    document.getElementById('detailStatus').innerHTML = statusBadge;
    
    document.getElementById('current-owner-name').textContent = appointment.current_owner_name || '未分配';
    if (appointment.current_owner_role) {
        const roleLabels = {
            'tailor': '量体师',
            'pattern_maker': '版师',
            'customer_service': '客服'
        };
        document.getElementById('current-owner-badge').textContent = roleLabels[appointment.current_owner_role] || appointment.current_owner_role;
    }
    
    renderMeasurements(appointment.measurements || []);
    renderFabricCards(appointment.fabric_cards || []);
    renderStyleConfirmations(appointment.style_confirmations || []);
    renderFittingRecords(appointment.fitting_records || []);
    renderAppointmentTodos(currentAppointmentId);
}



async function quickApprove(id) {
    try {
        await window.api.updateStyleConfirmation(id, {
            approval_status: 'approved',
            approved_by: 1
        });
        
        loadDashboard();
    } catch (error) {
        console.error('批准款式确认失败:', error);
    }
}

async function quickReject(id) {
    try {
        await window.api.updateStyleConfirmation(id, {
            approval_status: 'rejected',
            approved_by: 1
        });
        
        loadDashboard();
    } catch (error) {
        console.error('拒绝款式确认失败:', error);
    }
}

async function loadRecentItems() {
    try {
        const recentItems = await window.api.getRecentItems();
        const container = document.getElementById('recentItemsGrid');
        
        if (recentItems.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无最近打开的项目</div>';
            return;
        }
        
        const typeLabels = {
            'appointment': '量体预约',
            'style_confirmation': '款式确认',
            'measurement': '量体记录',
            'fabric_card': '面料卡',
            'fitting_record': '试衣记录'
        };
        
        const roleLabels = {
            'tailor': '量体师',
            'pattern_maker': '版师',
            'customer_service': '客服'
        };
        
        container.innerHTML = recentItems.map(item => {
            const time = new Date(item.last_accessed).toLocaleString('zh-CN');
            const accessedBy = employees.find(e => e.id === item.accessed_by);
            const operatorName = accessedBy?.name || '未知';
            const operatorRole = accessedBy ? roleLabels[accessedBy.role] || accessedBy.role : '-';
            
            return `
                <div class="recent-item-card" onclick="openRecentItem('${item.item_type}', ${item.item_id})">
                    <div class="recent-item-header">
                        <span class="recent-item-type">${typeLabels[item.item_type] || item.item_type}</span>
                        <span class="recent-item-operator">${operatorName} (${operatorRole})</span>
                    </div>
                    <div class="recent-item-title">${item.item_title}</div>
                    <div class="recent-item-footer">
                        <span class="recent-item-time">最后访问: ${time}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('加载最近项目失败:', error);
    }
}

async function openRecentItem(type, id) {
    if (type === 'appointment') {
        await viewAppointment(id);
    } else if (type === 'style_confirmation') {
        const styleConfirmation = await window.api.getStyleConfirmation(id);
        if (styleConfirmation && styleConfirmation.appointment_id) {
            await viewAppointment(styleConfirmation.appointment_id);
            setTimeout(() => {
                document.querySelector('.tab-btn[data-tab="styles"]').click();
            }, 100);
        }
    }
}

async function loadOperationHistory() {
    try {
        const entityType = document.getElementById('historyEntityFilter').value;
        
        const filters = { limit: 100 };
        if (entityType) filters.entity_type = entityType;
        
        const history = await window.api.getOperationHistory(filters);
        const tbody = document.getElementById('historyTableBody');
        
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无操作历史</td></tr>';
            return;
        }
        
        tbody.innerHTML = history.map(item => {
            const time = new Date(item.created_at).toLocaleString('zh-CN');
            const icon = getOperationIcon(item.operation_type);
            
            const typeLabels = {
                'appointment': '量体预约',
                'measurement': '量体记录',
                'style_confirmation': '款式确认',
                'fabric_card': '面料卡',
                'fitting_record': '试衣记录',
                'todo': '待办事项'
            };
            
            const operationLabels = {
                'create': '创建',
                'update': '更新',
                'delete': '删除',
                'status_change': '状态变更',
                'approve': '批准',
                'approved': '批准',
                'reject': '拒绝',
                'rejected': '拒绝',
                'warning': '警告',
                'complete': '完成'
            };
            
            const source = getSourceInfo(item);
            const summary = getChangeSummary(item);
            
            return `
                <tr>
                    <td>${time}</td>
                    <td>${icon} ${operationLabels[item.operation_type] || item.operation_type}</td>
                    <td>${typeLabels[item.entity_type] || item.entity_type}</td>
                    <td>${item.operator_name || '系统'}</td>
                    <td>${source}</td>
                    <td title="${item.description}">${summary}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('加载操作历史失败:', error);
    }
}

function getSourceInfo(item) {
    if (item.entity_type === 'appointment') {
        return '预约管理';
    } else if (item.entity_type === 'measurement') {
        return '量体记录';
    } else if (item.entity_type === 'style_confirmation') {
        return '款式确认';
    } else if (item.entity_type === 'fabric_card') {
        return '面料管理';
    } else if (item.entity_type === 'fitting_record') {
        return '试衣记录';
    } else if (item.entity_type === 'todo') {
        return '待办管理';
    }
    return '系统';
}

function getChangeSummary(item) {
    if (!item.description) return '-';
    
    if (item.description.length <= 30) {
        return item.description;
    }
    
    return item.description.substring(0, 30) + '...';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function loadTodos() {
    try {
        const todos = await window.api.getTodos({ status: 'pending' });
        const container = document.getElementById('todosList');
        const countElement = document.getElementById('pendingTodos');
        
        countElement.textContent = todos.length;
        
        if (todos.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无待办事项</div>';
            return;
        }
        
        container.innerHTML = todos.map(item => {
            const time = new Date(item.created_at).toLocaleDateString('zh-CN');
            const priorityLabel = { high: '高', medium: '中', low: '低' };
            
            return `
                <div class="todo-item ${item.priority}" onclick="viewAppointment(${item.appointment_id})">
                    <div class="todo-icon">📋</div>
                    <div class="todo-content">
                        <div class="todo-title">${item.title}</div>
                        <div class="todo-meta">
                            ${item.customer_name} · 优先级: ${priorityLabel[item.priority]} · ${time}
                        </div>
                    </div>
                    <div class="todo-actions">
                        <button class="btn btn-success" onclick="completeTodo(${item.id})">完成</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('加载待办失败:', error);
    }
}

function showNewTodoModal(appointmentId = null) {
    document.getElementById('todoForm').reset();
    document.getElementById('todoModalTitle').textContent = '新建待办';
    document.getElementById('todoId').value = '';
    document.getElementById('todoAppointmentId').value = appointmentId || currentAppointmentId;
    
    updateTodoEmployeeOptions();
    
    document.getElementById('todoModal').classList.add('active');
}

function updateTodoEmployeeOptions() {
    const role = document.getElementById('todoAssigneeRole').value;
    const select = document.getElementById('todoAssignee');
    
    const filtered = employees.filter(e => e.role === role);
    select.innerHTML = '<option value="">请选择人员</option>' +
        filtered.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

async function saveTodo() {
    try {
        const id = document.getElementById('todoId').value;
        const data = {
            appointment_id: parseInt(document.getElementById('todoAppointmentId').value),
            title: document.getElementById('todoTitle').value,
            description: document.getElementById('todoDescription').value,
            assignee_id: document.getElementById('todoAssignee').value || null,
            assignee_role: document.getElementById('todoAssigneeRole').value,
            priority: document.getElementById('todoPriority').value,
            due_date: document.getElementById('todoDueDate').value,
            created_by: 1
        };
        
        if (!data.title) {
            alert('请填写待办标题');
            return;
        }
        
        if (id) {
            await window.api.updateTodo(parseInt(id), data);
        } else {
            await window.api.createTodo(data);
        }
        
        closeModal('todoModal');
        loadTodos();
        loadDashboard();
    } catch (error) {
        console.error('保存待办失败:', error);
        alert('保存失败: ' + error.message);
    }
}

async function completeTodo(id) {
    try {
        await window.api.updateTodo(id, { status: 'completed' });
        loadTodos();
        loadDashboard();
    } catch (error) {
        console.error('完成待办失败:', error);
    }
}

function showTransferOwnerModal() {
    document.getElementById('transferAppointmentId').value = currentAppointmentId;
    document.getElementById('transferRole').value = 'tailor';
    updateTransferEmployeeOptions();
    
    document.getElementById('transferOwnerModal').classList.add('active');
}

function updateTransferEmployeeOptions() {
    const role = document.getElementById('transferRole').value;
    const select = document.getElementById('transferEmployee');
    
    const filtered = employees.filter(e => e.role === role);
    select.innerHTML = '<option value="">请选择人员</option>' +
        filtered.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

async function transferOwner() {
    try {
        const appointmentId = parseInt(document.getElementById('transferAppointmentId').value);
        const ownerId = parseInt(document.getElementById('transferEmployee').value);
        const ownerRole = document.getElementById('transferRole').value;
        
        if (!ownerId) {
            alert('请选择责任人');
            return;
        }
        
        await window.api.updateAppointmentOwner(appointmentId, ownerId, ownerRole);
        
        await window.api.createTodo({
            appointment_id: appointmentId,
            title: `任务已转移给${employees.find(e => e.id === ownerId)?.name}`,
            description: document.getElementById('transferNote').value,
            assignee_id: ownerId,
            assignee_role: ownerRole,
            priority: 'high'
        });
        
        closeModal('transferOwnerModal');
        await viewAppointment(currentAppointmentId);
        loadDashboard();
    } catch (error) {
        console.error('转移责任人失败:', error);
        alert('操作失败: ' + error.message);
    }
}

async function updateAppointmentStatusBasedOnDetails(appointment) {
    try {
        let newStatus = appointment.status;
        const styleConfirmations = appointment.style_confirmations || [];
        const fittingRecords = appointment.fitting_records || [];
        const measurements = appointment.measurements || [];
        
        const allStylesApproved = styleConfirmations.length > 0 && 
            styleConfirmations.every(sc => sc.approval_status === 'approved');
        const hasRejectedStyle = styleConfirmations.some(sc => sc.approval_status === 'rejected');
        const hasMeasurements = measurements.length > 0;
        const hasFittingIssues = fittingRecords.some(fr => fr.issues && fr.issues.trim());
        const hasFinalFitting = fittingRecords.some(fr => fr.fitting_stage === '成衣检查');
        
        if (appointment.status === 'pending') {
            if (hasMeasurements && allStylesApproved) {
                newStatus = 'in_progress';
            }
        } else if (appointment.status === 'confirmed') {
            if (hasMeasurements && allStylesApproved) {
                newStatus = 'in_progress';
            }
        } else if (appointment.status === 'in_progress') {
            if (hasRejectedStyle) {
                newStatus = 'risk';
            } else if (hasFinalFitting && !hasFittingIssues) {
                const finalFitting = fittingRecords.find(fr => fr.fitting_stage === '成衣检查');
                if (finalFitting && finalFitting.fit_rating >= 4) {
                    newStatus = 'completed';
                }
            } else if (hasFittingIssues) {
                newStatus = 'risk';
            }
        }
        
        if (newStatus !== appointment.status) {
            await window.api.updateAppointment(appointment.id, { 
                status: newStatus,
                operator_id: 1,
                operator_name: '系统'
            });
            
            await window.api.addOperationHistory({
                operation_type: 'status_change',
                entity_type: 'appointment',
                entity_id: appointment.id,
                description: `系统自动更新状态: ${appointment.status} → ${newStatus}`,
                operator_id: 1,
                operator_name: '系统'
            });
        }
    } catch (error) {
        console.error('更新预约状态失败:', error);
    }
}

function renderWorkflowKanban(appointment) {
    const roleLabels = {
        tailor: '量体师',
        pattern_maker: '版师',
        customer_service: '客服'
    };
    
    document.getElementById('tailor-name').textContent = appointment.tailor_name || '-';
    document.getElementById('pattern-name').textContent = appointment.pattern_maker_name || '-';
    document.getElementById('service-name').textContent = appointment.customer_service_name || '-';
    
    document.getElementById('tailor-status').textContent = appointment.tailor_id ? '已分配' : '未分配';
    document.getElementById('pattern-status').textContent = appointment.pattern_maker_id ? '已分配' : '未分配';
    document.getElementById('service-status').textContent = appointment.customer_service_id ? '已分配' : '未分配';
    
    const tailorCard = document.getElementById('kanban-tailor');
    const patternCard = document.getElementById('kanban-pattern');
    const serviceCard = document.getElementById('kanban-service');
    
    tailorCard.classList.remove('active', 'current-owner');
    patternCard.classList.remove('active', 'current-owner');
    serviceCard.classList.remove('active', 'current-owner');
    
    if (appointment.current_owner_role === 'tailor') {
        tailorCard.classList.add('current-owner');
    } else if (appointment.current_owner_role === 'pattern_maker') {
        patternCard.classList.add('current-owner');
    } else if (appointment.current_owner_role === 'customer_service') {
        serviceCard.classList.add('current-owner');
    }
    
    document.getElementById('current-owner-name').textContent = appointment.current_owner_name || '未分配';
    document.getElementById('current-owner-badge').textContent = 
        appointment.current_owner_role ? roleLabels[appointment.current_owner_role] : '-';
}

async function viewAppointment(id) {
    try {
        const appointment = await window.api.getAppointment(id);
        currentAppointmentId = id;
        
        document.getElementById('appointmentDetailTitle').textContent = 
            `${appointment.customer_name} - 预约详情`;
        
        document.getElementById('detailCustomerName').textContent = appointment.customer_name;
        document.getElementById('detailCustomerPhone').textContent = appointment.customer_phone || '-';
        document.getElementById('detailAppointmentDate').textContent = 
            new Date(appointment.appointment_date).toLocaleDateString('zh-CN');
        document.getElementById('detailAppointmentTime').textContent = 
            appointment.appointment_time || '-';
        document.getElementById('detailTailor').textContent = appointment.tailor_name || '-';
        document.getElementById('detailPatternMaker').textContent = appointment.pattern_maker_name || '-';
        document.getElementById('detailCustomerService').textContent = appointment.customer_service_name || '-';
        
        const statusBadge = getStatusBadge(appointment.status);
        document.getElementById('detailStatus').innerHTML = statusBadge.outerHTML;
        
        document.getElementById('detailNotes').textContent = appointment.notes || '-';
        
        renderWorkflowKanban(appointment);
        renderMeasurements(appointment.measurements || []);
        renderFabricCards(appointment.fabric_cards || []);
        renderStyleConfirmations(appointment.style_confirmations || []);
        renderFittingRecords(appointment.fitting_records || []);
        renderAppointmentTodos(appointment.id);
        
        updateAppointmentStatusBasedOnDetails(appointment);
        
        await window.api.addRecentItem({
            item_type: 'appointment',
            item_id: id,
            item_title: `${appointment.customer_name} - ${appointment.notes || '预约'}`,
            accessed_by: 1
        });
        
        document.getElementById('appointmentDetailModal').classList.add('active');
    } catch (error) {
        console.error('加载预约详情失败:', error);
    }
}

async function renderAppointmentTodos(appointmentId) {
    const container = document.getElementById('appointmentTodosList');
    
    try {
        const todos = await window.api.getTodos({ appointment_id: appointmentId });
        
        if (todos.length === 0) {
            container.innerHTML = '<div class="todo-add-btn" onclick="showNewTodoModal()">+ 添加待办</div>';
            return;
        }
        
        container.innerHTML = todos.map(item => {
            const priorityLabel = { high: '高', medium: '中', low: '低' };
            
            return `
                <div class="todo-item ${item.priority} ${item.status === 'completed' ? 'completed' : ''}">
                    <div class="todo-icon">${item.status === 'completed' ? '✅' : '📋'}</div>
                    <div class="todo-content">
                        <div class="todo-title">${item.title}</div>
                        <div class="todo-meta">
                            指派: ${item.assignee_name || '-'} · 优先级: ${priorityLabel[item.priority]}
                        </div>
                    </div>
                    <div class="todo-actions">
                        ${item.status !== 'completed' ? `
                            <button class="btn btn-success" onclick="completeTodo(${item.id})">完成</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('') + '<div class="todo-add-btn" onclick="showNewTodoModal()">+ 添加待办</div>';
    } catch (error) {
        console.error('加载预约待办失败:', error);
        container.innerHTML = '<div class="todo-add-btn" onclick="showNewTodoModal()">+ 添加待办</div>';
    }
}

async function approveStyleConfirmation() {
    try {
        await window.api.updateStyleConfirmation(currentStyleConfirmationId, {
            approval_status: 'approved',
            approved_by: 1
        });
        
        await window.api.createTodo({
            appointment_id: currentAppointmentId,
            title: '款式确认已批准，开始制作纸样',
            description: '根据批准的款式确认开始纸样制作',
            assignee_role: 'pattern_maker',
            priority: 'high'
        });
        
        await refreshAppointmentDetail();
        loadDashboard();
    } catch (error) {
        console.error('批准款式确认失败:', error);
        alert('操作失败: ' + error.message);
    }
}

async function saveMeasurement() {
    try {
        const data = {
            appointment_id: parseInt(document.getElementById('measurementAppointmentId').value),
            height: parseFloat(document.getElementById('measurementHeight').value) || null,
            weight: parseFloat(document.getElementById('measurementWeight').value) || null,
            bust: parseFloat(document.getElementById('measurementBust').value) || null,
            waist: parseFloat(document.getElementById('measurementWaist').value) || null,
            hip: parseFloat(document.getElementById('measurementHip').value) || null,
            shoulder_width: parseFloat(document.getElementById('measurementShoulder').value) || null,
            arm_length: parseFloat(document.getElementById('measurementArm').value) || null,
            leg_length: parseFloat(document.getElementById('measurementLeg').value) || null,
            notes: document.getElementById('measurementNotes').value,
            measured_by: 1
        };
        
        await window.api.createMeasurement(data);
        
        await window.api.createTodo({
            appointment_id: data.appointment_id,
            title: '量体完成，待确认款式',
            description: '量体数据已录入，等待客户确认款式',
            assignee_role: 'customer_service',
            priority: 'high'
        });
        
        closeModal('measurementModal');
        await refreshAppointmentDetail();
    } catch (error) {
        console.error('保存量体记录失败:', error);
        alert('保存失败: ' + error.message);
    }
}

async function saveFittingRecord() {
    try {
        const data = {
            appointment_id: parseInt(document.getElementById('fittingRecordAppointmentId').value),
            fitting_stage: document.getElementById('fittingStage').value,
            fitting_date: document.getElementById('fittingDate').value,
            fit_rating: parseInt(document.getElementById('fittingRating').value) || null,
            issues: document.getElementById('fittingIssues').value,
            adjustments: document.getElementById('fittingAdjustments').value,
            notes: document.getElementById('fittingNotes').value,
            fitter_id: 1
        };
        
        if (!data.fitting_stage) {
            alert('请选择试衣阶段');
            return;
        }
        
        await window.api.createFittingRecord(data);
        
        if (data.issues && data.issues.trim()) {
            await window.api.createTodo({
                appointment_id: data.appointment_id,
                title: `试衣发现问题: ${data.issues.substring(0, 30)}...`,
                description: `试衣问题: ${data.issues}\n调整方案: ${data.adjustments}`,
                assignee_role: 'tailor',
                priority: 'high'
            });
        }
        
        closeModal('fittingRecordModal');
        await refreshAppointmentDetail();
    } catch (error) {
        console.error('保存试衣记录失败:', error);
        alert('保存失败: ' + error.message);
    }
}
