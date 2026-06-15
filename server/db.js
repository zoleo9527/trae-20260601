import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sampleOrders, users, DATA_VERSION } from './sampleData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data.json');

let orders = [];
let orderIdCounter = 1000;

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (data.dataVersion !== DATA_VERSION || !data.orders || !Array.isArray(data.orders)) {
        console.log('[db] data.json 版本不匹配或数据损坏，使用初始样例重置');
        resetData();
        return;
      }
      const order1001 = data.orders.find(o => o.id === 'AD260615-1001');
      if (!order1001 || order1001.status === 'completed') {
        console.log('[db] 检测到AD260615-1001为完成状态或缺失，使用初始样例重置');
        resetData();
        return;
      }
      orders = data.orders || [];
      orderIdCounter = data.orderIdCounter || 1000;
    } else {
      resetData();
    }
  } catch (e) {
    console.log('[db] 加载数据失败，使用初始样例重置:', e.message);
    resetData();
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ orders, orderIdCounter, dataVersion: DATA_VERSION }, null, 2));
}

function generateOrderNo() {
  const date = new Date();
  const prefix = 'AD' + date.getFullYear().toString().slice(2) + 
    (date.getMonth() + 1).toString().padStart(2, '0') + 
    date.getDate().toString().padStart(2, '0');
  return prefix + '-' + (++orderIdCounter).toString().padStart(4, '0');
}

function getOrders({ status, role, urgent, hasIssues, issueType } = {}) {
  let filtered = [...orders];
  
  if (status) {
    filtered = filtered.filter(o => o.status === status);
  }
  
  if (role) {
    const roleStatusMap = {
      'receptionist': ['pending_review', 'created'],
      'designer': ['designing', 'revision_needed'],
      'production': ['approved', 'printing'],
      'quality': ['quality_check'],
      'installer': ['ready_for_install', 'installing'],
      'customer': ['pending_approval']
    };
    const allowedStatuses = roleStatusMap[role];
    if (allowedStatuses) {
      filtered = filtered.filter(o => allowedStatuses.includes(o.status));
    }
  }

  if (urgent === 'true') {
    filtered = filtered.filter(o => o.urgent);
  }

  if (hasIssues === 'true') {
    filtered = filtered.filter(o => o.issues?.some(i => i.status === 'pending'));
  }

  if (issueType) {
    filtered = filtered.filter(o => o.issues?.some(i => i.status === 'pending' && i.type === issueType));
  }
  
  return filtered.sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function getOrderById(id) {
  return orders.find(o => o.id === id);
}

function createOrder(data) {
  const now = new Date().toISOString();
  const order = {
    id: generateOrderNo(),
    orderNo: generateOrderNo(),
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    businessType: data.businessType,
    title: data.title,
    description: data.description,
    width: data.width,
    height: data.height,
    unit: data.unit || 'cm',
    quantity: data.quantity || 1,
    material: data.material,
    colorMode: data.colorMode || 'CMYK',
    status: 'pending_review',
    urgent: data.urgent || false,
    expectedDelivery: data.expectedDelivery,
    installAddress: data.installAddress,
    installTime: data.installTime,
    createdAt: now,
    updatedAt: now,
    currentHandler: 'receptionist',
    history: [{
      status: 'created',
      operator: data.operator || '系统',
      remark: '订单创建',
      timestamp: now
    }],
    revisions: [],
    installation: null,
    customerConfirmation: null,
    issues: []
  };
  
  orders.unshift(order);
  saveData();
  return order;
}

function updateOrder(id, data) {
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  
  orders[idx] = {
    ...orders[idx],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  saveData();
  return orders[idx];
}

function updateOrderStatus(id, status, operator, remark) {
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  
  const now = new Date().toISOString();
  const order = orders[idx];
  
  const handlerMap = {
    'pending_review': 'receptionist',
    'designing': 'designer',
    'pending_approval': 'customer',
    'revision_needed': 'designer',
    'approved': 'production',
    'printing': 'production',
    'quality_check': 'quality',
    'ready_for_install': 'installer',
    'installing': 'installer',
    'completed': null
  };
  
  order.status = status;
  if (status in handlerMap) {
    order.currentHandler = handlerMap[status];
  }
  order.updatedAt = now;
  order.history.push({
    status,
    operator,
    remark,
    timestamp: now
  });
  
  saveData();
  return order;
}

function addRevision(id, revisionData) {
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  
  const now = new Date().toISOString();
  const order = orders[idx];
  
  order.revisions.push({
    id: 'R' + Date.now(),
    ...revisionData,
    timestamp: now
  });

  const after = revisionData.afterData || {};
  const type = revisionData.type;

  if (type === 'dimension') {
    if (after.width !== undefined) order.width = Number(after.width);
    if (after.height !== undefined) order.height = Number(after.height);
    if (after.unit !== undefined) order.unit = after.unit;
  }
  if (type === 'color') {
    if (after.color !== undefined || after.pantone !== undefined) {
      if (after.color !== undefined) order.description += `\n[颜色更新] ${after.color}`;
      if (after.pantone !== undefined) order.colorMode = after.pantone;
    }
  }

  const issueTypeMap = {
    'color': 'color',
    'dimension': 'dimension',
    'content': 'customer_revision',
    'layout': 'design',
    'typography': 'design',
    'other': null
  };
  const matchedIssueType = issueTypeMap[type];
  let resolvedTotal = 0;
  const resolvedTypes = [];

  if (matchedIssueType) {
    for (const issue of order.issues) {
      if (issue.status === 'pending' && issue.type === matchedIssueType) {
        issue.status = 'resolved';
        issue.resolvedAt = now;
        resolvedTotal++;
        resolvedTypes.push(matchedIssueType);
      }
    }
  }

  if (order.status === 'revision_needed') {
    for (const issue of order.issues) {
      if (issue.status === 'pending' && issue.type === 'customer_revision') {
        issue.status = 'resolved';
        issue.resolvedAt = now;
        resolvedTotal++;
        resolvedTypes.push('customer_revision');
      }
    }
  }

  if (resolvedTotal > 0) {
    const uniqueTypes = [...new Set(resolvedTypes)];
    order.history.push({
      status: 'issue_resolved',
      operator: revisionData.operator,
      remark: `改稿自动关闭 ${resolvedTotal} 个问题（${uniqueTypes.join('、')}）`,
      timestamp: now
    });
  }

  order.updatedAt = now;
  order.history.push({
    status: 'revision',
    operator: revisionData.operator,
    remark: `改稿: ${revisionData.description}`,
    timestamp: now
  });
  
  saveData();
  return order;
}

function addInstallationRecord(id, installData) {
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  
  const now = new Date().toISOString();
  const order = orders[idx];
  
  order.installation = {
    ...installData,
    completedAt: now
  };
  
  order.updatedAt = now;
  order.history.push({
    status: 'installation',
    operator: installData.operator,
    remark: installData.issueReported ? '安装完成，存在问题待处理' : '安装完成',
    timestamp: now
  });
  
  if (installData.issueReported) {
    order.issues.push({
      id: 'I' + Date.now(),
      type: 'installation',
      description: installData.remark,
      status: 'pending',
      reportedAt: now
    });
  }
  
  saveData();
  return order;
}

function confirmByCustomer(id, confirmData) {
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  
  const now = new Date().toISOString();
  const order = orders[idx];
  
  order.customerConfirmation = {
    ...confirmData,
    confirmedAt: now
  };
  
  if (confirmData.confirmType === 'approve') {
    order.status = 'approved';
    order.currentHandler = 'production';
  } else if (confirmData.confirmType === 'revise') {
    order.status = 'revision_needed';
    order.currentHandler = 'designer';
    order.issues.push({
      id: 'I' + Date.now(),
      type: 'customer_revision',
      description: confirmData.feedback,
      status: 'pending',
      reportedAt: now
    });
  }
  
  order.updatedAt = now;
  order.history.push({
    status: 'customer_confirm',
    operator: confirmData.customerName,
    remark: confirmData.confirmType === 'approve' ? '客户确认通过' : `客户要求改稿: ${confirmData.feedback}`,
    timestamp: now
  });
  
  saveData();
  return order;
}

function batchUpdateStatus(ids, status, operator, remark) {
  const results = [];
  for (const id of ids) {
    const order = updateOrderStatus(id, status, operator, remark);
    if (order) results.push(order.id);
  }
  return { updated: results.length, ids: results };
}

function resetData() {
  orders = JSON.parse(JSON.stringify(sampleOrders));
  orderIdCounter = 1000 + orders.length;
  saveData();
}

function getStatistics() {
  const now = Date.now();
  const oneHour = 3600000;
  const fourHours = 14400000;

  const issueTypeCount = {
    customer_revision: 0,
    color: 0,
    dimension: 0,
    quality: 0,
    installation: 0,
    design: 0,
    other: 0
  };
  for (const order of orders) {
    for (const issue of order.issues || []) {
      if (issue.status === 'pending') {
        issueTypeCount[issue.type] = (issueTypeCount[issue.type] || 0) + 1;
      }
    }
  }
  
  const stats = {
    total: orders.length,
    byStatus: {},
    urgent: orders.filter(o => o.urgent).length,
    pendingReview: orders.filter(o => o.status === 'pending_review').length,
    designing: orders.filter(o => o.status === 'designing').length,
    pendingApproval: orders.filter(o => o.status === 'pending_approval').length,
    revisionNeeded: orders.filter(o => o.status === 'revision_needed').length,
    printing: orders.filter(o => o.status === 'printing' || o.status === 'approved').length,
    readyForInstall: orders.filter(o => o.status === 'ready_for_install').length,
    installing: orders.filter(o => o.status === 'installing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    openIssues: orders.reduce((sum, o) => sum + (o.issues?.filter(i => i.status === 'pending').length || 0), 0),
    issuesByType: issueTypeCount,
    overdue: orders.filter(o => {
      if (o.status === 'completed' || !o.expectedDelivery) return false;
      return new Date(o.expectedDelivery) < new Date();
    }).length,
    approachingDeadline: orders.filter(o => {
      if (o.status === 'completed' || !o.expectedDelivery) return false;
      const diff = new Date(o.expectedDelivery) - new Date();
      return diff > 0 && diff < fourHours;
    }).length,
    alerts: []
  };
  
  for (const order of orders) {
    const waitTime = now - new Date(order.updatedAt).getTime();
    
    if (order.status === 'pending_review' && waitTime > oneHour) {
      stats.alerts.push({
        type: 'warning',
        orderId: order.id,
        message: `订单 ${order.id} 待审核超过1小时`,
        waitTime: Math.floor(waitTime / 60000)
      });
    }
    
    if (order.status === 'revision_needed' && waitTime > oneHour) {
      stats.alerts.push({
        type: 'danger',
        orderId: order.id,
        message: `订单 ${order.id} 待改稿超过1小时，客户在催`,
        waitTime: Math.floor(waitTime / 60000)
      });
    }
    
    if (order.urgent && order.status !== 'completed' && waitTime > 30 * 60000) {
      stats.alerts.push({
        type: 'danger',
        orderId: order.id,
        message: `急单 ${order.id} 处理超时 ${Math.floor(waitTime / 60000)} 分钟`,
        waitTime: Math.floor(waitTime / 60000)
      });
    }
    
    if (order.issues?.length > 0) {
      const pendingIssues = order.issues.filter(i => i.status === 'pending');
      if (pendingIssues.length > 0) {
        stats.alerts.push({
          type: 'danger',
          orderId: order.id,
          message: `订单 ${order.id} 存在 ${pendingIssues.length} 个待处理问题`,
          issues: pendingIssues.map(i => i.description)
        });
      }
    }
  }
  
  stats.alerts.sort((a, b) => {
    if (a.type === 'danger' && b.type !== 'danger') return -1;
    if (a.type !== 'danger' && b.type === 'danger') return 1;
    return (b.waitTime || 0) - (a.waitTime || 0);
  });
  
  return stats;
}

loadData();

export {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  addRevision,
  addInstallationRecord,
  confirmByCustomer,
  batchUpdateStatus,
  resetData,
  getStatistics,
  users
};
