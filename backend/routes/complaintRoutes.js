const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { complaints, users, STATUS, STATUS_LABEL, ROLES, COMPLAINT_TYPES } = require('../data/mockData');

function formatNow() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function getUserById(id) {
  return users.find(u => u.id === id);
}

function addRemark(complaint, content, operatorName, type) {
  complaint.remarkList.push({
    id: uuidv4(),
    content,
    operator: operatorName,
    time: formatNow(),
    type
  });
}

function addStatusHistory(complaint, status, operatorName, remark) {
  complaint.statusHistory.push({
    status,
    operator: operatorName,
    time: formatNow(),
    remark
  });
}

router.get('/meta/types', (req, res) => {
  res.json({ code: 0, data: COMPLAINT_TYPES });
});

router.get('/meta/statuses', (req, res) => {
  res.json({ code: 0, data: STATUS_LABEL });
});

router.get('/', (req, res) => {
  const { status, type, keyword, role, userId } = req.query;
  let result = [...complaints];

  if (status) {
    result = result.filter(c => c.status === status);
  }
  if (type) {
    result = result.filter(c => c.type === type);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    result = result.filter(c => 
      c.complaintNo.toLowerCase().includes(kw) ||
      c.title.toLowerCase().includes(kw) ||
      c.visitorName.includes(kw)
    );
  }

  if (role && userId) {
    if (role === ROLES.PICKING_GUIDE) {
      result = result.filter(c => 
        c.assignedTo === userId && 
        [STATUS.PENDING_VERIFY, STATUS.VERIFYING, STATUS.RETURNED].includes(c.status)
      );
    } else if (role === ROLES.WAREHOUSE_STAFF) {
      result = result.filter(c => 
        [STATUS.PENDING_COMPENSATION, STATUS.COMPENSATING].includes(c.status)
      );
    } else if (role === ROLES.CUSTOMER_SERVICE) {
      result = result.filter(c => 
        [STATUS.PENDING_CLOSE].includes(c.status) ||
        c.registerBy === userId
      );
    }
  }

  result.sort((a, b) => new Date(b.registerTime) - new Date(a.registerTime));

  res.json({
    code: 0,
    data: result,
    total: result.length
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ code: 1, message: '记录不存在' });
  }
  res.json({ code: 0, data: complaint });
});

router.post('/', (req, res) => {
  const { type, title, visitorName, visitorPhone, orchardArea, description, registerRemark, assignedTo, responsibilityUnclear, responsibilityNote } = req.body;
  const registerBy = req.body.registerBy || 'u1';
  const registerUser = getUserById(registerBy);
  const assignedUser = getUserById(assignedTo || 'u2');

  const now = formatNow();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(complaints.filter(c => c.complaintNo.includes(dateStr)).length + 1).padStart(3, '0');
  const complaintNo = `TS${dateStr}${seq}`;

  const newComplaint = {
    id: uuidv4(),
    complaintNo,
    type,
    title,
    visitorName,
    visitorPhone,
    orchardArea,
    description,
    registerBy,
    registerByName: registerUser?.name || '系统',
    registerTime: now,
    registerRemark: registerRemark || '',
    responsibilityUnclear: !!responsibilityUnclear,
    responsibilityNote: responsibilityNote || '',
    status: STATUS.PENDING_VERIFY,
    assignedTo: assignedTo || 'u2',
    assignedToName: assignedUser?.name || '',
    assignTime: now,
    verifyResult: '',
    verifyRemark: '',
    verifyTime: '',
    needCompensation: null,
    compensationPlan: '',
    compensationItems: [],
    compensationAmount: 0,
    compensator: '',
    compensatorName: '',
    compensateTime: '',
    compensateRemark: '',
    receiverName: '',
    receiverPhone: '',
    receiverSign: false,
    returnReason: '',
    returnRemark: '',
    returnTime: '',
    closeRemark: '',
    closeTime: '',
    remarkList: [],
    statusHistory: []
  };

  addStatusHistory(newComplaint, STATUS.PENDING_VERIFY, registerUser?.name || '系统', '投诉登记');
  if (registerRemark) {
    addRemark(newComplaint, registerRemark, registerUser?.name || '系统', '登记');
  }

  complaints.unshift(newComplaint);

  res.json({ code: 0, data: newComplaint, message: '登记成功' });
});

router.put('/:id/claim', (req, res) => {
  const { id } = req.params;
  const { operatorId } = req.body;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ code: 1, message: '记录不存在' });
  }
  const operator = getUserById(operatorId || 'u2');

  complaint.status = STATUS.VERIFYING;
  addStatusHistory(complaint, STATUS.VERIFYING, operator?.name || '', '认领核实');

  res.json({ code: 0, data: complaint, message: '已认领' });
});

router.put('/:id/verify', (req, res) => {
  const { id } = req.params;
  const { verifyResult, verifyRemark, needCompensation, compensationPlan, compensationItems, compensationAmount, operatorId } = req.body;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ code: 1, message: '记录不存在' });
  }
  const operator = getUserById(operatorId || 'u2');
  const now = formatNow();

  complaint.verifyResult = verifyResult || '';
  complaint.verifyRemark = verifyRemark || '';
  complaint.verifyTime = now;
  complaint.needCompensation = needCompensation;

  if (verifyResult) {
    addRemark(complaint, verifyResult, operator?.name || '', '核实');
  }
  if (verifyRemark) {
    addRemark(complaint, verifyRemark, operator?.name || '', '核实');
  }

  if (needCompensation) {
    complaint.compensationPlan = compensationPlan || '';
    complaint.compensationItems = compensationItems || [];
    complaint.compensationAmount = compensationAmount || 0;
    complaint.status = STATUS.PENDING_COMPENSATION;
    addStatusHistory(complaint, STATUS.PENDING_COMPENSATION, operator?.name || '', '核实通过，待补偿');
  } else {
    complaint.status = STATUS.PENDING_CLOSE;
    addStatusHistory(complaint, STATUS.PENDING_CLOSE, operator?.name || '', '核实完成，无需补偿');
  }

  res.json({ code: 0, data: complaint, message: '核实完成' });
});

router.put('/:id/compensate', (req, res) => {
  const { id } = req.params;
  const { compensateRemark, receiverName, receiverPhone, operatorId } = req.body;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ code: 1, message: '记录不存在' });
  }
  const operator = getUserById(operatorId || 'u4');
  const now = formatNow();

  complaint.compensator = operatorId || 'u4';
  complaint.compensatorName = operator?.name || '';
  complaint.compensateTime = now;
  complaint.compensateRemark = compensateRemark || '';
  complaint.receiverName = receiverName || '';
  complaint.receiverPhone = receiverPhone || '';
  complaint.receiverSign = true;
  complaint.status = STATUS.PENDING_CLOSE;

  addStatusHistory(complaint, STATUS.PENDING_CLOSE, operator?.name || '', '补偿已发放');
  if (compensateRemark) {
    addRemark(complaint, compensateRemark, operator?.name || '', '发放');
  }

  res.json({ code: 0, data: complaint, message: '发放完成' });
});

router.put('/:id/return', (req, res) => {
  const { id } = req.params;
  const { returnReason, returnRemark, operatorId } = req.body;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ code: 1, message: '记录不存在' });
  }
  const operator = getUserById(operatorId || 'u4');
  const now = formatNow();

  complaint.returnReason = returnReason || '';
  complaint.returnRemark = returnRemark || '';
  complaint.returnTime = now;
  complaint.status = STATUS.RETURNED;

  addStatusHistory(complaint, STATUS.RETURNED, operator?.name || '', `退回：${returnReason || ''}`);
  if (returnRemark) {
    addRemark(complaint, returnRemark, operator?.name || '', '退回');
  }

  res.json({ code: 0, data: complaint, message: '已退回' });
});

router.put('/:id/close', (req, res) => {
  const { id } = req.params;
  const { closeRemark, operatorId } = req.body;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ code: 1, message: '记录不存在' });
  }
  const operator = getUserById(operatorId || 'u1');
  const now = formatNow();

  complaint.closeRemark = closeRemark || '';
  complaint.closeTime = now;
  complaint.status = STATUS.COMPLETED;

  addStatusHistory(complaint, STATUS.COMPLETED, operator?.name || '', '已结案');
  if (closeRemark) {
    addRemark(complaint, closeRemark, operator?.name || '', '结案');
  }

  res.json({ code: 0, data: complaint, message: '已结案' });
});

router.put('/:id/reject', (req, res) => {
  const { id } = req.params;
  const { rejectReason, operatorId } = req.body;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ code: 1, message: '记录不存在' });
  }
  const operator = getUserById(operatorId || 'u1');

  complaint.status = STATUS.REJECTED;
  addStatusHistory(complaint, STATUS.REJECTED, operator?.name || '', `驳回：${rejectReason || ''}`);

  res.json({ code: 0, data: complaint, message: '已驳回' });
});

router.post('/:id/remarks', (req, res) => {
  const { id } = req.params;
  const { content, operatorId, type } = req.body;
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    return res.status(404).json({ code: 1, message: '记录不存在' });
  }
  const operator = getUserById(operatorId || 'u1');

  addRemark(complaint, content, operator?.name || '', type || '补充');

  res.json({ code: 0, data: complaint.remarkList, message: '备注已添加' });
});

module.exports = router;
