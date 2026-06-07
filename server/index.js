const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { 
  STATUS, 
  STATUS_LABELS, 
  ROLES, 
  ROLE_LABELS, 
  bills, 
  complaints, 
  createHistoryEntry 
} = require('./data');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    statuses: STATUS,
    statusLabels: STATUS_LABELS,
    roles: ROLES,
    roleLabels: ROLE_LABELS
  });
});

app.get('/api/bills', (req, res) => {
  const { status, month, customerName } = req.query;
  let filtered = [...bills];
  
  if (status) {
    filtered = filtered.filter(b => b.status === status);
  }
  if (month) {
    filtered = filtered.filter(b => b.month === month);
  }
  if (customerName) {
    filtered = filtered.filter(b => b.customerName.includes(customerName));
  }
  
  res.json(filtered);
});

app.get('/api/bills/:id', (req, res) => {
  const bill = bills.find(b => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ error: '账单不存在' });
  }
  
  const relatedComplaints = complaints.filter(c => c.billId === bill.id);
  
  res.json({
    ...bill,
    relatedComplaints
  });
});

app.post('/api/bills', (req, res) => {
  const { 
    customerName, customerPhone, address, route, deliveryPerson,
    month, milkTypes, bottleReturned, bottlePending, assignee, assigneeRole
  } = req.body;
  
  const totalAmount = milkTypes.reduce((sum, item) => sum + item.amount, 0);
  
  const newBill = {
    id: uuidv4(),
    billNo: `YJ${month.replace('-', '')}${String(bills.length + 1).padStart(3, '0')}`,
    customerName,
    customerPhone,
    address,
    route,
    deliveryPerson,
    month,
    totalAmount,
    milkTypes,
    bottleReturned: bottleReturned || 0,
    bottlePending: bottlePending || 0,
    status: STATUS.PENDING,
    assignee,
    assigneeRole,
    currentHandler: assignee,
    currentHandlerRole: assigneeRole,
    history: [
      createHistoryEntry('创建账单', '王文员', ROLES.CLERK, '手动创建账单', null, STATUS.PENDING)
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  bills.unshift(newBill);
  res.status(201).json(newBill);
});

app.put('/api/bills/:id/status', (req, res) => {
  const { id } = req.params;
  const { action, newStatus, remark, operator, operatorRole, assignee, assigneeRole } = req.body;
  
  const billIndex = bills.findIndex(b => b.id === id);
  if (billIndex === -1) {
    return res.status(404).json({ error: '账单不存在' });
  }
  
  const bill = bills[billIndex];
  const previousStatus = bill.status;
  
  bill.history.push(
    createHistoryEntry(action, operator, operatorRole, remark, previousStatus, newStatus)
  );
  
  bill.status = newStatus;
  bill.updatedAt = new Date().toISOString();
  
  if (assignee) {
    bill.assignee = assignee;
    bill.assigneeRole = assigneeRole;
    bill.currentHandler = assignee;
    bill.currentHandlerRole = assigneeRole;
  }
  
  if (newStatus === STATUS.CLOSED) {
    bill.currentHandler = null;
    bill.currentHandlerRole = null;
  }
  
  res.json(bill);
});

app.post('/api/bills/batch-update', (req, res) => {
  const { ids, newStatus, remark, operator, operatorRole } = req.body;
  
  const updatedBills = [];
  
  ids.forEach(id => {
    const billIndex = bills.findIndex(b => b.id === id);
    if (billIndex !== -1) {
      const bill = bills[billIndex];
      const previousStatus = bill.status;
      
      bill.history.push(
        createHistoryEntry('批量处理', operator, operatorRole, remark || '批量操作', previousStatus, newStatus)
      );
      
      bill.status = newStatus;
      bill.updatedAt = new Date().toISOString();
      
      if (newStatus === STATUS.CLOSED) {
        bill.currentHandler = null;
        bill.currentHandlerRole = null;
      }
      
      updatedBills.push(bill);
    }
  });
  
  res.json({ updated: updatedBills.length, bills: updatedBills });
});

app.get('/api/complaints', (req, res) => {
  const { status, type, customerName } = req.query;
  let filtered = [...complaints];
  
  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  if (type) {
    filtered = filtered.filter(c => c.type === type);
  }
  if (customerName) {
    filtered = filtered.filter(c => c.customerName.includes(customerName));
  }
  
  res.json(filtered);
});

app.get('/api/complaints/:id', (req, res) => {
  const complaint = complaints.find(c => c.id === req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: '申诉不存在' });
  }
  
  let relatedBill = null;
  if (complaint.billId) {
    relatedBill = bills.find(b => b.id === complaint.billId) || null;
  }
  
  res.json({
    ...complaint,
    relatedBill
  });
});

app.post('/api/complaints', (req, res) => {
  const { 
    billId, billNo, customerName, customerPhone, address,
    type, typeLabel, description, assignee, assigneeRole
  } = req.body;
  
  const newComplaint = {
    id: uuidv4(),
    complaintNo: `TS${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(complaints.length + 1).padStart(3, '0')}`,
    billId: billId || null,
    billNo: billNo || null,
    customerName,
    customerPhone,
    address,
    type,
    typeLabel,
    description,
    status: STATUS.PENDING,
    assignee,
    assigneeRole,
    currentHandler: assignee,
    currentHandlerRole: assigneeRole,
    history: [
      createHistoryEntry('创建申诉', '张客服', ROLES.CUSTOMER_SERVICE, '客户提交申诉', null, STATUS.PENDING)
    ],
    evidences: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  complaints.unshift(newComplaint);
  res.status(201).json(newComplaint);
});

app.put('/api/complaints/:id/status', (req, res) => {
  const { id } = req.params;
  const { action, newStatus, remark, operator, operatorRole, assignee, assigneeRole } = req.body;
  
  const complaintIndex = complaints.findIndex(c => c.id === id);
  if (complaintIndex === -1) {
    return res.status(404).json({ error: '申诉不存在' });
  }
  
  const complaint = complaints[complaintIndex];
  const previousStatus = complaint.status;
  
  complaint.history.push(
    createHistoryEntry(action, operator, operatorRole, remark, previousStatus, newStatus)
  );
  
  complaint.status = newStatus;
  complaint.updatedAt = new Date().toISOString();
  
  if (assignee) {
    complaint.assignee = assignee;
    complaint.assigneeRole = assigneeRole;
    complaint.currentHandler = assignee;
    complaint.currentHandlerRole = assigneeRole;
  }
  
  if (newStatus === STATUS.CLOSED) {
    complaint.currentHandler = null;
    complaint.currentHandlerRole = null;
  }
  
  res.json(complaint);
});

app.post('/api/complaints/batch-update', (req, res) => {
  const { ids, newStatus, remark, operator, operatorRole } = req.body;
  
  const updatedComplaints = [];
  
  ids.forEach(id => {
    const complaintIndex = complaints.findIndex(c => c.id === id);
    if (complaintIndex !== -1) {
      const complaint = complaints[complaintIndex];
      const previousStatus = complaint.status;
      
      complaint.history.push(
        createHistoryEntry('批量处理', operator, operatorRole, remark || '批量操作', previousStatus, newStatus)
      );
      
      complaint.status = newStatus;
      complaint.updatedAt = new Date().toISOString();
      
      if (newStatus === STATUS.CLOSED) {
        complaint.currentHandler = null;
        complaint.currentHandlerRole = null;
      }
      
      updatedComplaints.push(complaint);
    }
  });
  
  res.json({ updated: updatedComplaints.length, complaints: updatedComplaints });
});

app.post('/api/complaints/:id/evidence', (req, res) => {
  const { id } = req.params;
  const { fileName } = req.body;
  
  const complaintIndex = complaints.findIndex(c => c.id === id);
  if (complaintIndex === -1) {
    return res.status(404).json({ error: '申诉不存在' });
  }
  
  const complaint = complaints[complaintIndex];
  const newEvidence = {
    id: uuidv4(),
    name: fileName,
    uploadedAt: new Date().toISOString()
  };
  
  complaint.evidences.push(newEvidence);
  complaint.updatedAt = new Date().toISOString();
  
  complaint.history.push(
    createHistoryEntry('补充材料', '客户', 'customer', `上传了材料：${fileName}`, complaint.status, complaint.status)
  );
  
  if (complaint.status === STATUS.SUPPLEMENT_NEEDED) {
    complaint.status = STATUS.PROCESSING;
    complaint.history.push(
      createHistoryEntry('材料已补充', '系统', 'system', '客户已补充材料，转处理中', STATUS.SUPPLEMENT_NEEDED, STATUS.PROCESSING)
    );
  }
  
  res.json(complaint);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
