import { db } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
    await init();
});

async function init() {
    await initNavigation();
    await initMockData();
    await renderBidList();
}

async function initNavigation() {
    const navButtons = document.querySelectorAll('nav button');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => section.classList.add('hidden'));
            
            const sectionId = 'section-' + e.target.id.replace('nav-', '');
            document.getElementById(sectionId).classList.remove('hidden');
            
            if (sectionId === 'section-bid') renderBidList();
            else if (sectionId === 'section-deposit') renderDepositList();
            else if (sectionId === 'section-qualification') renderQualificationList();
            else if (sectionId === 'section-trace') renderTraceList();
        });
    });

    document.getElementById('add-bid-btn').addEventListener('click', showAddBidModal);
    document.getElementById('add-deposit-btn').addEventListener('click', showAddDepositModal);
    document.getElementById('add-qual-btn').addEventListener('click', showAddQualModal);
    document.getElementById('trace-search-btn').addEventListener('click', searchTrace);
    document.getElementById('batch-import-btn').addEventListener('click', batchImport);
    document.getElementById('deposit-status-filter').addEventListener('change', renderDepositList);
    document.getElementById('deposit-slow-filter').addEventListener('change', renderDepositList);
    document.getElementById('qual-status-filter').addEventListener('change', renderQualificationList);

    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
}

async function initMockData() {
    const bids = await db.getAll('bids');
    if (bids.length === 0) {
        const mockBids = [
            {
                id: 'BD001',
                bidNo: 'BD2024001',
                name: 'XX市XX区商业用房',
                location: 'XX市XX区中心大街88号',
                basePrice: 5000000,
                depositAmount: 500000,
                auctionDate: '2024-12-20',
                status: 'active',
                createdAt: new Date().toISOString(),
                operator: '管理员'
            },
            {
                id: 'BD002',
                bidNo: 'BD2024002',
                name: 'XX市XX工业园厂房',
                location: 'XX市XX工业园A区12号',
                basePrice: 8000000,
                depositAmount: 800000,
                auctionDate: '2024-12-25',
                status: 'active',
                createdAt: new Date().toISOString(),
                operator: '管理员'
            },
            {
                id: 'BD003',
                bidNo: 'BD2024003',
                name: 'XX市XX小区住宅',
                location: 'XX市XX小区3号楼1802室',
                basePrice: 1200000,
                depositAmount: 120000,
                auctionDate: '2024-12-28',
                status: 'active',
                createdAt: new Date().toISOString(),
                operator: '管理员'
            }
        ];
        for (const bid of mockBids) {
            await db.add('bids', bid);
            await db.addLog(bid.id, 'bid', '创建标的', `创建标的 ${bid.bidNo} - ${bid.name}`);
        }

        const mockBidders = [
            { id: 'BDR001', name: '张三', idCard: '110101199001011234', phone: '13800138000' },
            { id: 'BDR002', name: '李四', idCard: '110102198505156789', phone: '13900139000' },
            { id: 'BDR003', name: '王五', idCard: '110103199208204567', phone: '13700137000' },
            { id: 'BDR004', name: '赵六', idCard: '110104198811307890', phone: '13600136000' }
        ];
        for (const bidder of mockBidders) {
            await db.add('bidders', bidder);
        }

        const mockDeposits = [
            {
                id: 'DEP001',
                bidId: 'BD001',
                bidderId: 'BDR001',
                amount: 500000,
                payMethod: '银行转账',
                payTime: new Date(Date.now() - 86400000).toISOString(),
                status: 'paid',
                slowRefund: false,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                operator: '财务人员A'
            },
            {
                id: 'DEP002',
                bidId: 'BD001',
                bidderId: 'BDR002',
                amount: 500000,
                payMethod: '网银支付',
                payTime: new Date(Date.now() - 172800000).toISOString(),
                status: 'paid',
                slowRefund: false,
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                operator: '财务人员B'
            },
            {
                id: 'DEP003',
                bidId: 'BD002',
                bidderId: 'BDR003',
                amount: 800000,
                payMethod: '银行转账',
                payTime: new Date(Date.now() - 259200000).toISOString(),
                status: 'refunded',
                refundTime: new Date(Date.now() - 604800000).toISOString(),
                slowRefund: true,
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                operator: '财务人员A'
            },
            {
                id: 'DEP004',
                bidId: 'BD002',
                bidderId: 'BDR004',
                amount: 800000,
                payMethod: '现金',
                payTime: new Date().toISOString(),
                status: 'pending',
                slowRefund: false,
                createdAt: new Date().toISOString(),
                operator: '财务人员C'
            }
        ];
        for (const deposit of mockDeposits) {
            await db.add('deposits', deposit);
            await db.addLog(deposit.id, 'deposit', '创建保证金记录', `竞买人 ${deposit.bidderId} 缴纳保证金 ${deposit.amount}`);
        }

        const mockQuals = [
            {
                id: 'QUAL001',
                bidId: 'BD001',
                bidderId: 'BDR001',
                status: 'approved',
                verifyTime: new Date(Date.now() - 43200000).toISOString(),
                verifyRemark: '资料齐全，资格审核通过',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                operator: '审核员A'
            },
            {
                id: 'QUAL002',
                bidId: 'BD001',
                bidderId: 'BDR002',
                status: 'supplement',
                supplementItems: ['缺少营业执照副本', '缺少授权委托书'],
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                operator: '审核员B'
            },
            {
                id: 'QUAL003',
                bidId: 'BD002',
                bidderId: 'BDR003',
                status: 'dispute',
                disputeReason: '竞买人资格存在争议，需进一步核实',
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                operator: '审核员A'
            },
            {
                id: 'QUAL004',
                bidId: 'BD002',
                bidderId: 'BDR004',
                status: 'pending',
                createdAt: new Date().toISOString(),
                operator: '审核员C'
            }
        ];
        for (const qual of mockQuals) {
            await db.add('qualifications', qual);
            await db.addLog(qual.id, 'qualification', '创建资格审核', `竞买人 ${qual.bidderId} 资格审核状态: ${qual.status}`);
        }
    }
}

function formatMoney(value) {
    return '¥' + value.toLocaleString('zh-CN');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status, type) {
    const statusMap = {
        bid: { active: '进行中', closed: '已结束', canceled: '已取消' },
        deposit: { pending: '待处理', paid: '已到账', refunded: '已退还', dispute: '争议中' },
        qualification: { pending: '待审核', approved: '已通过', rejected: '未通过', supplement: '资料补正', dispute: '资格争议' }
    };
    return statusMap[type][status] || status;
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
}

async function showAddBidModal() {
    const html = `
        <h3>新增标的</h3>
        <div class="form-group">
            <label>标的编号</label>
            <input type="text" id="bid-no" placeholder="如：BD2024004" required>
        </div>
        <div class="form-group">
            <label>标的名称</label>
            <input type="text" id="bid-name" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>标的位置</label>
                <input type="text" id="bid-location">
            </div>
            <div class="form-group">
                <label>起拍价(元)</label>
                <input type="number" id="bid-base-price" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>保证金金额(元)</label>
                <input type="number" id="bid-deposit-amount" required>
            </div>
            <div class="form-group">
                <label>拍卖日期</label>
                <input type="date" id="bid-auction-date" required>
            </div>
        </div>
        <button id="save-bid-btn" class="btn-primary">保存</button>
    `;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('save-bid-btn').addEventListener('click', saveBid);
}

async function saveBid() {
    const bid = {
        id: 'BD' + Date.now().toString().slice(-3),
        bidNo: document.getElementById('bid-no').value,
        name: document.getElementById('bid-name').value,
        location: document.getElementById('bid-location').value,
        basePrice: parseInt(document.getElementById('bid-base-price').value),
        depositAmount: parseInt(document.getElementById('bid-deposit-amount').value),
        auctionDate: document.getElementById('bid-auction-date').value,
        status: 'active',
        createdAt: new Date().toISOString(),
        operator: '当前用户'
    };
    
    try {
        await db.add('bids', bid);
        await db.addLog(bid.id, 'bid', '创建标的', `创建标的 ${bid.bidNo} - ${bid.name}`);
        closeModal();
        await renderBidList();
    } catch (error) {
        alert('保存失败：' + error.message);
    }
}

async function showBidDetail(bidId) {
    const bid = await db.get('bids', bidId);
    const deposits = await db.getAllByIndex('deposits', 'bidId', bidId);
    const qualifications = await db.getAllByIndex('qualifications', 'bidId', bidId);
    const logs = await db.getLogs(bidId, 'bid');
    
    let depositsHtml = '<h4>保证金记录</h4>';
    if (deposits.length === 0) {
        depositsHtml += '<p class="empty-state">暂无保证金记录</p>';
    } else {
        depositsHtml += '<ul>';
        for (const dep of deposits) {
            const bidder = await db.get('bidders', dep.bidderId);
            depositsHtml += `<li>${bidder?.name || dep.bidderId} - ${formatMoney(dep.amount)} - ${getStatusText(dep.status, 'deposit')}</li>`;
        }
        depositsHtml += '</ul>';
    }
    
    let qualHtml = '<h4>资格审核</h4>';
    if (qualifications.length === 0) {
        qualHtml += '<p class="empty-state">暂无资格审核记录</p>';
    } else {
        qualHtml += '<ul>';
        for (const qual of qualifications) {
            const bidder = await db.get('bidders', qual.bidderId);
            qualHtml += `<li>${bidder?.name || qual.bidderId} - ${getStatusText(qual.status, 'qualification')}</li>`;
        }
        qualHtml += '</ul>';
    }
    
    let logsHtml = '<h4>操作日志</h4><div class="timeline">';
    for (const log of logs) {
        logsHtml += `
            <div class="timeline-item">
                <div class="timeline-time">${formatDate(log.createdAt)}</div>
                <div class="timeline-user">${log.operator}</div>
                <div class="timeline-action">${log.action}</div>
                ${log.remark ? `<div class="timeline-remark">${log.remark}</div>` : ''}
            </div>
        `;
    }
    logsHtml += '</div>';
    
    const html = `
        <h3>${bid.bidNo} - ${bid.name}</h3>
        <div class="card-body">
            <p><strong>位置：</strong>${bid.location}</p>
            <p><strong>起拍价：</strong>${formatMoney(bid.basePrice)}</p>
            <p><strong>保证金：</strong>${formatMoney(bid.depositAmount)}</p>
            <p><strong>拍卖日期：</strong>${bid.auctionDate}</p>
            <p><strong>状态：</strong><span class="status-badge status-${bid.status}">${getStatusText(bid.status, 'bid')}</span></p>
            <p><strong>创建人：</strong>${bid.operator}</p>
            <p><strong>创建时间：</strong>${formatDate(bid.createdAt)}</p>
        </div>
        ${depositsHtml}
        ${qualHtml}
        ${logsHtml}
        <button class="btn-secondary" onclick="closeModal()">关闭</button>
    `;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').classList.remove('hidden');
}

async function renderBidList() {
    const bids = await db.getAll('bids');
    const container = document.getElementById('bid-list');
    
    if (bids.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无标的数据</div>';
        return;
    }
    
    let html = '';
    for (const bid of bids) {
        const deposits = await db.getAllByIndex('deposits', 'bidId', bid.id);
        const quals = await db.getAllByIndex('qualifications', 'bidId', bid.id);
        const supplementCount = quals.filter(q => q.status === 'supplement').length;
        const disputeCount = quals.filter(q => q.status === 'dispute').length;
        
        html += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${bid.bidNo} - ${bid.name}</div>
                        <span class="status-badge status-${bid.status}">${getStatusText(bid.status, 'bid')}</span>
                        ${supplementCount > 0 ? `<span class="alert-badge alert-slow">${supplementCount}项资料补正</span>` : ''}
                        ${disputeCount > 0 ? `<span class="alert-badge alert-dispute">${disputeCount}项资格争议</span>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="btn-secondary" onclick="showBidDetail('${bid.id}')">详情</button>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>位置：</strong>${bid.location}</p>
                    <p><strong>起拍价：</strong>${formatMoney(bid.basePrice)} | <strong>保证金：</strong>${formatMoney(bid.depositAmount)}</p>
                    <p><strong>拍卖日期：</strong>${bid.auctionDate} | <strong>保证金缴纳：</strong>${deposits.length}人</p>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function showAddDepositModal() {
    const bids = await db.getAll('bids');
    const bidders = await db.getAll('bidders');
    
    let bidOptions = '<option value="">请选择标的</option>';
    for (const bid of bids) {
        bidOptions += `<option value="${bid.id}" data-amount="${bid.depositAmount}">${bid.bidNo} - ${bid.name}</option>`;
    }
    
    let bidderOptions = '<option value="">请选择竞买人</option>';
    for (const bidder of bidders) {
        bidderOptions += `<option value="${bidder.id}">${bidder.name} - ${bidder.idCard}</option>`;
    }
    
    const html = `
        <h3>新增保证金缴纳记录</h3>
        <div class="form-group">
            <label>标的</label>
            <select id="deposit-bid" required>${bidOptions}</select>
        </div>
        <div class="form-group">
            <label>竞买人</label>
            <select id="deposit-bidder" required>${bidderOptions}</select>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>缴纳金额(元)</label>
                <input type="number" id="deposit-amount" required>
            </div>
            <div class="form-group">
                <label>缴纳方式</label>
                <select id="deposit-method">
                    <option value="银行转账">银行转账</option>
                    <option value="网银支付">网银支付</option>
                    <option value="现金">现金</option>
                    <option value="其他">其他</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>缴纳时间</label>
            <input type="datetime-local" id="deposit-time">
        </div>
        <button id="save-deposit-btn" class="btn-primary">保存</button>
    `;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').classList.remove('hidden');
    
    document.getElementById('deposit-bid').addEventListener('change', (e) => {
        const amount = e.target.options[e.target.selectedIndex].dataset.amount;
        if (amount) {
            document.getElementById('deposit-amount').value = amount;
        }
    });
    document.getElementById('save-deposit-btn').addEventListener('click', saveDeposit);
}

async function saveDeposit() {
    const deposit = {
        id: 'DEP' + Date.now().toString().slice(-3),
        bidId: document.getElementById('deposit-bid').value,
        bidderId: document.getElementById('deposit-bidder').value,
        amount: parseInt(document.getElementById('deposit-amount').value),
        payMethod: document.getElementById('deposit-method').value,
        payTime: document.getElementById('deposit-time').value ? new Date(document.getElementById('deposit-time').value).toISOString() : new Date().toISOString(),
        status: 'pending',
        slowRefund: false,
        createdAt: new Date().toISOString(),
        operator: '当前用户'
    };
    
    try {
        await db.add('deposits', deposit);
        await db.addLog(deposit.id, 'deposit', '创建保证金记录', `竞买人缴纳保证金 ${formatMoney(deposit.amount)}`);
        closeModal();
        await renderDepositList();
    } catch (error) {
        alert('保存失败：' + error.message);
    }
}

async function handleDepositAction(depositId, action) {
    const deposit = await db.get('deposits', depositId);
    const bid = await db.get('bids', deposit.bidId);
    const bidder = await db.get('bidders', deposit.bidderId);
    
    if (action === 'confirm') {
        deposit.status = 'paid';
        await db.put('deposits', deposit);
        await db.addLog(depositId, 'deposit', '确认到账', `确认保证金到账 ${formatMoney(deposit.amount)}`);
        
        const existingQual = await db.getAllByIndex('qualifications', 'bidderId', deposit.bidderId);
        const qualForBid = existingQual.find(q => q.bidId === deposit.bidId);
        if (!qualForBid) {
            const qual = {
                id: 'QUAL' + Date.now().toString().slice(-3),
                bidId: deposit.bidId,
                bidderId: deposit.bidderId,
                status: 'pending',
                createdAt: new Date().toISOString(),
                operator: '系统自动'
            };
            await db.add('qualifications', qual);
            await db.addLog(qual.id, 'qualification', '创建资格审核', '保证金到账自动创建审核任务');
        }
    } else if (action === 'refund') {
        deposit.status = 'refunded';
        deposit.refundTime = new Date().toISOString();
        await db.put('deposits', deposit);
        await db.addLog(depositId, 'deposit', '退还保证金', `退还保证金 ${formatMoney(deposit.amount)}`);
    } else if (action === 'mark-slow') {
        deposit.slowRefund = true;
        await db.put('deposits', deposit);
        await db.addLog(depositId, 'deposit', '标记退还慢', '标记为退还慢提醒');
    }
    
    await renderDepositList();
}

async function renderDepositList() {
    const statusFilter = document.getElementById('deposit-status-filter').value;
    const slowFilter = document.getElementById('deposit-slow-filter').value;
    
    let deposits = await db.getAll('deposits');
    
    if (statusFilter) {
        deposits = deposits.filter(d => d.status === statusFilter);
    }
    if (slowFilter === 'slow') {
        deposits = deposits.filter(d => d.slowRefund);
    }
    
    const container = document.getElementById('deposit-list');
    
    if (deposits.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无保证金记录</div>';
        return;
    }
    
    let html = '';
    for (const deposit of deposits) {
        const bid = await db.get('bids', deposit.bidId);
        const bidder = await db.get('bidders', deposit.bidderId);
        
        let actions = '';
        if (deposit.status === 'pending') {
            actions += `<button class="btn-secondary" onclick="handleDepositAction('${deposit.id}', 'confirm')">确认到账</button>`;
        } else if (deposit.status === 'paid') {
            actions += `<button class="btn-secondary" onclick="handleDepositAction('${deposit.id}', 'refund')">退还保证金</button>`;
        }
        if (deposit.status === 'refunded' && !deposit.slowRefund) {
            actions += `<button class="btn-secondary" onclick="handleDepositAction('${deposit.id}', 'mark-slow')">标记退还慢</button>`;
        }
        
        html += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${bid?.bidNo || deposit.bidId} - ${bidder?.name || deposit.bidderId}</div>
                        <span class="status-badge status-${deposit.status}">${getStatusText(deposit.status, 'deposit')}</span>
                        ${deposit.slowRefund ? '<span class="alert-badge alert-slow">退还慢提醒</span>' : ''}
                    </div>
                    <div class="card-actions">${actions}</div>
                </div>
                <div class="card-body">
                    <p><strong>金额：</strong>${formatMoney(deposit.amount)} | <strong>方式：</strong>${deposit.payMethod}</p>
                    <p><strong>缴纳时间：</strong>${formatDate(deposit.payTime)}</p>
                    ${deposit.refundTime ? `<p><strong>退还时间：</strong>${formatDate(deposit.refundTime)}</p>` : ''}
                    <p><strong>操作人：</strong>${deposit.operator} | <strong>创建时间：</strong>${formatDate(deposit.createdAt)}</p>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function showAddQualModal() {
    const bids = await db.getAll('bids');
    const bidders = await db.getAll('bidders');
    
    let bidOptions = '<option value="">请选择标的</option>';
    for (const bid of bids) {
        bidOptions += `<option value="${bid.id}">${bid.bidNo} - ${bid.name}</option>`;
    }
    
    let bidderOptions = '<option value="">请选择竞买人</option>';
    for (const bidder of bidders) {
        bidderOptions += `<option value="${bidder.id}">${bidder.name} - ${bidder.idCard}</option>`;
    }
    
    const html = `
        <h3>新增资格审核</h3>
        <div class="form-group">
            <label>标的</label>
            <select id="qual-bid" required>${bidOptions}</select>
        </div>
        <div class="form-group">
            <label>竞买人</label>
            <select id="qual-bidder" required>${bidderOptions}</select>
        </div>
        <div class="form-group">
            <label>审核状态</label>
            <select id="qual-status">
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">未通过</option>
                <option value="supplement">资料补正</option>
                <option value="dispute">资格争议</option>
            </select>
        </div>
        <div class="form-group" id="supplement-group" style="display: none;">
            <label>补正项目（每行一项）</label>
            <textarea id="qual-supplement" placeholder="缺少营业执照副本&#10;缺少授权委托书"></textarea>
        </div>
        <div class="form-group" id="remark-group" style="display: none;">
            <label>审核备注</label>
            <textarea id="qual-remark"></textarea>
        </div>
        <button id="save-qual-btn" class="btn-primary">保存</button>
    `;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal').classList.remove('hidden');
    
    document.getElementById('qual-status').addEventListener('change', (e) => {
        document.getElementById('supplement-group').style.display = e.target.value === 'supplement' ? 'block' : 'none';
        document.getElementById('remark-group').style.display = ['approved', 'rejected', 'dispute'].includes(e.target.value) ? 'block' : 'none';
    });
    document.getElementById('save-qual-btn').addEventListener('click', saveQual);
}

async function saveQual() {
    const status = document.getElementById('qual-status').value;
    const qual = {
        id: 'QUAL' + Date.now().toString().slice(-3),
        bidId: document.getElementById('qual-bid').value,
        bidderId: document.getElementById('qual-bidder').value,
        status,
        createdAt: new Date().toISOString(),
        operator: '当前用户'
    };
    
    if (status === 'supplement') {
        qual.supplementItems = document.getElementById('qual-supplement').value.split('\n').filter(item => item.trim());
    } else if (status === 'approved' || status === 'rejected' || status === 'dispute') {
        qual.verifyRemark = document.getElementById('qual-remark').value;
        qual.verifyTime = new Date().toISOString();
    }
    
    try {
        await db.add('qualifications', qual);
        await db.addLog(qual.id, 'qualification', '创建资格审核', `审核状态: ${getStatusText(status, 'qualification')}`);
        closeModal();
        await renderQualificationList();
    } catch (error) {
        alert('保存失败：' + error.message);
    }
}

async function handleQualAction(qualId, action) {
    const qual = await db.get('qualifications', qualId);
    
    if (action === 'approve') {
        qual.status = 'approved';
        qual.verifyTime = new Date().toISOString();
        qual.verifyRemark = qual.verifyRemark || '资格审核通过';
        await db.put('qualifications', qual);
        await db.addLog(qualId, 'qualification', '审核通过', '资格审核通过');
    } else if (action === 'reject') {
        qual.status = 'rejected';
        qual.verifyTime = new Date().toISOString();
        qual.verifyRemark = qual.verifyRemark || '资格审核未通过';
        await db.put('qualifications', qual);
        await db.addLog(qualId, 'qualification', '审核未通过', '资格审核未通过');
    } else if (action === 'supplement') {
        qual.status = 'supplement';
        await db.put('qualifications', qual);
        await db.addLog(qualId, 'qualification', '要求补正', '要求竞买人补充资料');
    } else if (action === 'dispute') {
        qual.status = 'dispute';
        await db.put('qualifications', qual);
        await db.addLog(qualId, 'qualification', '标记争议', '标记为资格争议');
    } else if (action === 'resolve') {
        qual.status = 'approved';
        qual.verifyTime = new Date().toISOString();
        qual.verifyRemark = '争议已解决，资格审核通过';
        await db.put('qualifications', qual);
        await db.addLog(qualId, 'qualification', '解决争议', '资格争议已解决');
    }
    
    await renderQualificationList();
}

async function renderQualificationList() {
    const statusFilter = document.getElementById('qual-status-filter').value;
    
    let qualifications = await db.getAll('qualifications');
    
    if (statusFilter) {
        qualifications = qualifications.filter(q => q.status === statusFilter);
    }
    
    const container = document.getElementById('qual-list');
    
    if (qualifications.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无资格审核记录</div>';
        return;
    }
    
    let html = '';
    for (const qual of qualifications) {
        const bid = await db.get('bids', qual.bidId);
        const bidder = await db.get('bidders', qual.bidderId);
        
        let actions = '';
        if (qual.status === 'pending') {
            actions += `<button class="btn-secondary" onclick="handleQualAction('${qual.id}', 'approve')">通过</button>`;
            actions += `<button class="btn-secondary" onclick="handleQualAction('${qual.id}', 'reject')">拒绝</button>`;
            actions += `<button class="btn-secondary" onclick="handleQualAction('${qual.id}', 'supplement')">补正</button>`;
            actions += `<button class="btn-secondary" onclick="handleQualAction('${qual.id}', 'dispute')">争议</button>`;
        } else if (qual.status === 'supplement') {
            actions += `<button class="btn-secondary" onclick="handleQualAction('${qual.id}', 'approve')">补正完成</button>`;
        } else if (qual.status === 'dispute') {
            actions += `<button class="btn-secondary" onclick="handleQualAction('${qual.id}', 'resolve')">解决争议</button>`;
        }
        
        let supplementHtml = '';
        if (qual.supplementItems && qual.supplementItems.length > 0) {
            supplementHtml = `<p><strong>补正项目：</strong></p><ul>`;
            for (const item of qual.supplementItems) {
                supplementHtml += `<li>${item}</li>`;
            }
            supplementHtml += '</ul>';
        }
        
        html += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${bid?.bidNo || qual.bidId} - ${bidder?.name || qual.bidderId}</div>
                        <span class="status-badge status-${qual.status}">${getStatusText(qual.status, 'qualification')}</span>
                        ${qual.status === 'supplement' ? '<span class="alert-badge alert-slow">需补正</span>' : ''}
                        ${qual.status === 'dispute' ? '<span class="alert-badge alert-dispute">资格争议</span>' : ''}
                    </div>
                    <div class="card-actions">${actions}</div>
                </div>
                <div class="card-body">
                    ${supplementHtml}
                    ${qual.verifyRemark ? `<p><strong>审核备注：</strong>${qual.verifyRemark}</p>` : ''}
                    ${qual.verifyTime ? `<p><strong>审核时间：</strong>${formatDate(qual.verifyTime)}</p>` : ''}
                    <p><strong>操作人：</strong>${qual.operator} | <strong>创建时间：</strong>${formatDate(qual.createdAt)}</p>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function searchTrace() {
    const keyword = document.getElementById('trace-keyword').value.trim();
    if (!keyword) {
        await renderTraceList();
        return;
    }
    
    const bids = await db.getAll('bids');
    const bidders = await db.getAll('bidders');
    const deposits = await db.getAll('deposits');
    const qualifications = await db.getAll('qualifications');
    
    const matchedBids = bids.filter(b => b.bidNo.includes(keyword) || b.name.includes(keyword));
    const matchedBidders = bidders.filter(b => b.name.includes(keyword) || b.idCard.includes(keyword));
    
    let results = [];
    
    for (const bid of matchedBids) {
        results.push({ type: 'bid', item: bid });
    }
    
    for (const bidder of matchedBidders) {
        results.push({ type: 'bidder', item: bidder });
    }
    
    for (const deposit of deposits) {
        const bid = await db.get('bids', deposit.bidId);
        const bidder = await db.get('bidders', deposit.bidderId);
        if (bid?.bidNo.includes(keyword) || bidder?.name.includes(keyword) || bidder?.idCard.includes(keyword)) {
            results.push({ type: 'deposit', item: deposit, bid, bidder });
        }
    }
    
    for (const qual of qualifications) {
        const bid = await db.get('bids', qual.bidId);
        const bidder = await db.get('bidders', qual.bidderId);
        if (bid?.bidNo.includes(keyword) || bidder?.name.includes(keyword) || bidder?.idCard.includes(keyword)) {
            results.push({ type: 'qualification', item: qual, bid, bidder });
        }
    }
    
    renderTraceResults(results);
}

async function renderTraceList() {
    const traces = [];
    
    const deposits = await db.getAll('deposits');
    const qualifications = await db.getAll('qualifications');
    
    for (const deposit of deposits) {
        const bid = await db.get('bids', deposit.bidId);
        const bidder = await db.get('bidders', deposit.bidderId);
        traces.push({ type: 'deposit', item: deposit, bid, bidder });
    }
    
    for (const qual of qualifications) {
        const bid = await db.get('bids', qual.bidId);
        const bidder = await db.get('bidders', qual.bidderId);
        traces.push({ type: 'qualification', item: qual, bid, bidder });
    }
    
    traces.sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt));
    renderTraceResults(traces);
}

function renderTraceResults(results) {
    const container = document.getElementById('trace-list');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无追溯记录</div>';
        return;
    }
    
    let html = '';
    for (const result of results) {
        const { type, item, bid, bidder } = result;
        
        if (type === 'deposit') {
            html += `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">保证金记录</div>
                            <span class="status-badge status-${item.status}">${getStatusText(item.status, 'deposit')}</span>
                            ${item.slowRefund ? '<span class="alert-badge alert-slow">退还慢提醒</span>' : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        <p><strong>标的：</strong>${bid?.bidNo} - ${bid?.name}</p>
                        <p><strong>竞买人：</strong>${bidder?.name} - ${bidder?.idCard}</p>
                        <p><strong>金额：</strong>${formatMoney(item.amount)} | <strong>方式：</strong>${item.payMethod}</p>
                        <p><strong>时间：</strong>${formatDate(item.createdAt)} | <strong>操作人：</strong>${item.operator}</p>
                    </div>
                </div>
            `;
        } else if (type === 'qualification') {
            html += `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">资格审核</div>
                            <span class="status-badge status-${item.status}">${getStatusText(item.status, 'qualification')}</span>
                            ${item.status === 'supplement' ? '<span class="alert-badge alert-slow">需补正</span>' : ''}
                            ${item.status === 'dispute' ? '<span class="alert-badge alert-dispute">资格争议</span>' : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        <p><strong>标的：</strong>${bid?.bidNo} - ${bid?.name}</p>
                        <p><strong>竞买人：</strong>${bidder?.name} - ${bidder?.idCard}</p>
                        ${item.verifyRemark ? `<p><strong>备注：</strong>${item.verifyRemark}</p>` : ''}
                        <p><strong>时间：</strong>${formatDate(item.createdAt)} | <strong>操作人：</strong>${item.operator}</p>
                    </div>
                </div>
            `;
        } else if (type === 'bid') {
            html += `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">标的 ${item.bidNo}</div>
                            <span class="status-badge status-${item.status}">${getStatusText(item.status, 'bid')}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p><strong>名称：</strong>${item.name}</p>
                        <p><strong>位置：</strong>${item.location}</p>
                        <p><strong>起拍价：</strong>${formatMoney(item.basePrice)} | <strong>保证金：</strong>${formatMoney(item.depositAmount)}</p>
                    </div>
                </div>
            `;
        } else if (type === 'bidder') {
            html += `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <div class="card-title">竞买人 ${item.name}</div>
                        </div>
                    </div>
                    <div class="card-body">
                        <p><strong>证件号：</strong>${item.idCard}</p>
                        <p><strong>联系电话：</strong>${item.phone}</p>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
}

async function batchImport() {
    const text = document.getElementById('batch-text').value.trim();
    if (!text) {
        alert('请输入数据');
        return;
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    let successCount = 0;
    let failCount = 0;
    
    for (const line of lines) {
        try {
            const parts = line.split('|');
            if (parts.length < 5) {
                failCount++;
                continue;
            }
            
            const bidNo = parts[0].trim();
            const bidderName = parts[1].trim();
            const idCard = parts[2].trim();
            const amount = parseInt(parts[3].trim());
            const phone = parts[4].trim();
            
            const bids = await db.getAll('bids');
            const bid = bids.find(b => b.bidNo === bidNo);
            if (!bid) {
                failCount++;
                continue;
            }
            
            let bidder = (await db.getAll('bidders')).find(b => b.idCard === idCard);
            if (!bidder) {
                bidder = {
                    id: 'BDR' + Date.now().toString().slice(-3),
                    name: bidderName,
                    idCard,
                    phone
                };
                await db.add('bidders', bidder);
            }
            
            const deposit = {
                id: 'DEP' + Date.now().toString().slice(-3),
                bidId: bid.id,
                bidderId: bidder.id,
                amount,
                payMethod: '批量导入',
                payTime: new Date().toISOString(),
                status: 'pending',
                slowRefund: false,
                createdAt: new Date().toISOString(),
                operator: '批量导入'
            };
            await db.add('deposits', deposit);
            await db.addLog(deposit.id, 'deposit', '批量导入保证金', `竞买人 ${bidder.name} 缴纳保证金 ${formatMoney(amount)}`);
            
            const qual = {
                id: 'QUAL' + Date.now().toString().slice(-3),
                bidId: bid.id,
                bidderId: bidder.id,
                status: 'pending',
                createdAt: new Date().toISOString(),
                operator: '批量导入'
            };
            await db.add('qualifications', qual);
            await db.addLog(qual.id, 'qualification', '批量导入审核', '批量导入自动创建审核任务');
            
            successCount++;
        } catch (error) {
            failCount++;
        }
    }
    
    alert(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条`);
    document.getElementById('batch-text').value = '';
}

window.showBidDetail = showBidDetail;
window.handleDepositAction = handleDepositAction;
window.handleQualAction = handleQualAction;
window.closeModal = closeModal;