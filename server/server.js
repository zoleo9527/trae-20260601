const express = require('express');
const cors = require('cors');
const { equipment, maintenancePlans, partsInventory, operationLogs, exceptions, users } = require('./data/mockData');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

let equipmentData = [...equipment];
let maintenancePlansData = [...maintenancePlans];
let partsInventoryData = [...partsInventory];
let operationLogsData = [...operationLogs];
let exceptionsData = [...exceptions];
let equipmentChangeRecords = [];
let maintenanceChangeRecords = [];

function generateId(prefix) {
  const count = operationLogsData.length + exceptionsData.length + 1;
  return `${prefix}${String(count).padStart(3, '0')}`;
}

function addLog(operator, role, action, targetType, targetId, targetName, description, detail) {
  const log = {
    id: generateId('LOG'),
    operator,
    role,
    action,
    targetType,
    targetId,
    targetName,
    description,
    detail,
    createdAt: new Date().toLocaleString('zh-CN'),
  };
  operationLogsData.unshift(log);
  return log;
}

function addEquipmentChangeRecord(equipmentId, equipmentCode, changes, operator, reason) {
  const record = {
    id: generateId('ECR'),
    equipmentId,
    equipmentCode,
    changes,
    operator,
    reason,
    createdAt: new Date().toLocaleString('zh-CN'),
    acknowledgedByPlans: [],
  };
  equipmentChangeRecords.unshift(record);
  return record;
}

function addMaintenanceChangeRecord(planId, planName, changeRecordId, acknowledgedBy) {
  const record = {
    id: generateId('MCR'),
    planId,
    planName,
    changeRecordId,
    acknowledgedBy,
    createdAt: new Date().toLocaleString('zh-CN'),
  };
  maintenanceChangeRecords.unshift(record);
  return record;
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user: { id: user.id, name: user.name, role: u.role, username: user.username } });
  } else {
    res.json({ success: false, message: '用户名或密码错误' });
  }
});

app.get('/api/equipment', (req, res) => {
  res.json(equipmentData);
});

app.get('/api/equipment/:id', (req, res) => {
  const equipment = equipmentData.find(e => e.id === req.params.id);
  if (equipment) {
    res.json(equipment);
  } else {
    res.status(404).json({ message: '设备不存在' });
  }
});

app.post('/api/equipment', (req, res) => {
  const newEquipment = {
    id: generateId('EQ'),
    ...req.body,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
  equipmentData.push(newEquipment);
  addLog(req.body.operator || '系统', req.body.operatorRole || 'system', 'create_equipment', 'equipment', newEquipment.id, newEquipment.code, '创建设备档案', JSON.stringify(req.body));
  res.json(newEquipment);
});

app.put('/api/equipment/:id', (req, res) => {
  const index = equipmentData.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    const oldEquipment = { ...equipmentData[index] };
    const changes = [];
    Object.keys(req.body).forEach(key => {
      if (key !== 'operator' && key !== 'operatorRole' && key !== 'reason' && oldEquipment[key] !== req.body[key]) {
        changes.push({ field: key, oldValue: oldEquipment[key], newValue: req.body[key] });
      }
    });
    
    equipmentData[index] = { ...equipmentData[index], ...req.body, updatedAt: new Date().toISOString().split('T')[0] };
    
    const operator = req.body.operator || '张主管';
    const operatorRole = req.body.operatorRole || 'maintenance_manager';
    const reason = req.body.reason || '';
    
    if (changes.length > 0) {
      const changeRecord = addEquipmentChangeRecord(
        req.params.id,
        equipmentData[index].code,
        changes,
        operator,
        reason
      );
      
      const relatedPlans = maintenancePlansData.filter(p => p.equipmentId === req.params.id && p.status !== 'completed');
      relatedPlans.forEach(plan => {
        plan.hasEquipmentChange = true;
        plan.equipmentChangeRecordId = changeRecord.id;
        plan.equipmentChangeAcknowledged = false;
        if (req.body.code) plan.equipmentCode = req.body.code;
        if (req.body.model) plan.equipmentModel = req.body.model;
        if (req.body.customerName) plan.customerName = req.body.customerName;
        if (req.body.responsibleTechnician) plan.responsibleTechnician = req.body.responsibleTechnician;
        plan.updatedAt = new Date().toISOString().split('T')[0];
      });
      
      const exception = {
        id: generateId('EX'),
        type: 'equipment_change',
        title: '设备档案变更',
        description: `设备${equipmentData[index].code}档案已修改，关联保养计划需确认`,
        equipmentId: req.params.id,
        equipmentCode: equipmentData[index].code,
        customerName: equipmentData[index].customerName,
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toLocaleString('zh-CN'),
        updatedAt: new Date().toLocaleString('zh-CN'),
        assignee: equipmentData[index].responsibleTechnician,
        changeRecordId: changeRecord.id,
      };
      exceptionsData.unshift(exception);
      
      addLog(operator, operatorRole, 'update_equipment', 'equipment', req.params.id, equipmentData[index].code, '更新设备档案', `变更内容：${changes.map(c => `${c.field}: ${c.oldValue} -> ${c.newValue}`).join(', ')}${reason ? '，原因：' + reason : ''}`);
    }
    
    res.json({ equipment: equipmentData[index], changeRecord: changes.length > 0 ? equipmentChangeRecords[0] : null });
  } else {
    res.status(404).json({ message: '设备不存在' });
  }
});

app.delete('/api/equipment/:id', (req, res) => {
  const index = equipmentData.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    const equipment = equipmentData[index];
    equipmentData.splice(index, 1);
    addLog('张主管', 'maintenance_manager', 'delete_equipment', 'equipment', req.params.id, equipment.code, '删除设备档案', '');
    res.json({ message: '删除成功' });
  } else {
    res.status(404).json({ message: '设备不存在' });
  }
});

app.post('/api/equipment/:id/report-down', (req, res) => {
  const { reason, operator, operatorRole } = req.body;
  const equipment = equipmentData.find(e => e.id === req.params.id);
  
  if (equipment) {
    const oldStatus = equipment.status;
    equipment.status = 'down';
    equipment.updatedAt = new Date().toISOString().split('T')[0];
    
    const exception = {
      id: generateId('EX'),
      type: 'equipment_down',
      title: '设备停机上报',
      description: reason || `设备${equipment.code}停机`,
      equipmentId: equipment.id,
      equipmentCode: equipment.code,
      customerName: equipment.customerName,
      status: 'pending',
      priority: 'high',
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
      assignee: equipment.responsibleTechnician,
    };
    exceptionsData.unshift(exception);
    
    addLog(operator || equipment.responsibleTechnician, operatorRole || 'field_technician', 'report_equipment_down', 'equipment', req.params.id, equipment.code, `上报设备停机：${oldStatus} -> down`, reason);
    
    res.json({ equipment, exception });
  } else {
    res.status(404).json({ message: '设备不存在' });
  }
});

app.post('/api/equipment/:id/repair-complete', (req, res) => {
  const { operator, operatorRole, repairDetails } = req.body;
  const equipment = equipmentData.find(e => e.id === req.params.id);
  
  if (equipment) {
    equipment.status = 'running';
    equipment.lastMaintenanceDate = new Date().toISOString().split('T')[0];
    equipment.updatedAt = new Date().toISOString().split('T')[0];
    
    const exceptionIndex = exceptionsData.findIndex(e => e.equipmentId === req.params.id && e.type === 'equipment_down' && e.status === 'pending');
    if (exceptionIndex !== -1) {
      exceptionsData[exceptionIndex].status = 'resolved';
      exceptionsData[exceptionIndex].updatedAt = new Date().toLocaleString('zh-CN');
    }
    
    addLog(operator || equipment.responsibleTechnician, operatorRole || 'field_technician', 'complete_repair', 'equipment', req.params.id, equipment.code, '设备维修完成', repairDetails || '设备已恢复运行');
    
    res.json(equipment);
  } else {
    res.status(404).json({ message: '设备不存在' });
  }
});

app.get('/api/equipment-change-records', (req, res) => {
  res.json(equipmentChangeRecords);
});

app.get('/api/equipment-change-records/:id', (req, res) => {
  const record = equipmentChangeRecords.find(r => r.id === req.params.id);
  if (record) {
    res.json(record);
  } else {
    res.status(404).json({ message: '变更记录不存在' });
  }
});

app.get('/api/maintenance-plans', (req, res) => {
  res.json(maintenancePlansData);
});

app.get('/api/maintenance-plans/:id', (req, res) => {
  const plan = maintenancePlansData.find(p => p.id === req.params.id);
  if (plan) {
    res.json(plan);
  } else {
    res.status(404).json({ message: '保养计划不存在' });
  }
});

app.post('/api/maintenance-plans', (req, res) => {
  const newPlan = {
    id: generateId('MP'),
    ...req.body,
    hasEquipmentChange: false,
    equipmentChangeRecordId: null,
    equipmentChangeAcknowledged: false,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
  maintenancePlansData.push(newPlan);
  
  const equipment = equipmentData.find(e => e.id === req.body.equipmentId);
  if (equipment) {
    equipment.nextMaintenanceDate = req.body.scheduledDate;
    equipment.updatedAt = new Date().toISOString().split('T')[0];
  }
  
  addLog(req.body.operator || '张主管', req.body.operatorRole || 'maintenance_manager', 'create_maintenance_plan', 'maintenance_plan', newPlan.id, newPlan.planName, '创建保养计划', `设备：${newPlan.equipmentCode}，计划日期：${newPlan.scheduledDate}`);
  res.json(newPlan);
});

app.put('/api/maintenance-plans/:id', (req, res) => {
  const index = maintenancePlansData.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const oldPlan = { ...maintenancePlansData[index] };
    maintenancePlansData[index] = { ...maintenancePlansData[index], ...req.body, updatedAt: new Date().toISOString().split('T')[0] };
    
    if (req.body.status === 'completed' && oldPlan.status !== 'completed') {
      maintenancePlansData[index].actualDate = new Date().toISOString().split('T')[0];
      maintenancePlansData[index].equipmentChangeAcknowledged = true;
      
      const equipment = equipmentData.find(e => e.id === maintenancePlansData[index].equipmentId);
      if (equipment) {
        equipment.lastMaintenanceDate = maintenancePlansData[index].actualDate;
        equipment.status = 'running';
        equipment.updatedAt = new Date().toISOString().split('T')[0];
      }
      
      const overdueException = exceptionsData.find(
        e => e.type === 'overdue_maintenance' && e.equipmentId === maintenancePlansData[index].equipmentId && e.status === 'pending'
      );
      if (overdueException) {
        overdueException.status = 'resolved';
        overdueException.updatedAt = new Date().toLocaleString('zh-CN');
      }
      
      addLog(req.body.operator || maintenancePlansData[index].responsibleTechnician, req.body.operatorRole || 'field_technician', 'complete_maintenance', 'maintenance_plan', req.params.id, maintenancePlansData[index].planName, '完成保养计划', `保养项目：${maintenancePlansData[index].items.map(i => i.name).join('、')}`);
    } else if (req.body.equipmentChangeAcknowledged === true && oldPlan.equipmentChangeAcknowledged === false) {
      addMaintenanceChangeRecord(req.params.id, maintenancePlansData[index].planName, maintenancePlansData[index].equipmentChangeRecordId, req.body.operator || maintenancePlansData[index].responsibleTechnician);
      addLog(req.body.operator || maintenancePlansData[index].responsibleTechnician, req.body.operatorRole || 'field_technician', 'acknowledge_equipment_change', 'maintenance_plan', req.params.id, maintenancePlansData[index].planName, '确认设备档案变更', '已知晓设备档案修改内容');
    } else {
      const changes = Object.keys(req.body).filter(k => k !== 'operator' && k !== 'operatorRole').map(key => `${key}: ${oldPlan[key]} -> ${req.body[key]}`).join(', ');
      addLog(req.body.operator || '张主管', req.body.operatorRole || 'maintenance_manager', 'update_maintenance_plan', 'maintenance_plan', req.params.id, maintenancePlansData[index].planName, '更新保养计划', changes);
    }
    
    res.json(maintenancePlansData[index]);
  } else {
    res.status(404).json({ message: '保养计划不存在' });
  }
});

app.post('/api/maintenance-plans/:id/acknowledge-change', (req, res) => {
  const plan = maintenancePlansData.find(p => p.id === req.params.id);
  if (plan && plan.hasEquipmentChange && !plan.equipmentChangeAcknowledged) {
    plan.equipmentChangeAcknowledged = true;
    plan.updatedAt = new Date().toISOString().split('T')[0];
    
    addMaintenanceChangeRecord(req.params.id, plan.planName, plan.equipmentChangeRecordId, req.body.operator || plan.responsibleTechnician);
    addLog(req.body.operator || plan.responsibleTechnician, req.body.operatorRole || 'field_technician', 'acknowledge_equipment_change', 'maintenance_plan', req.params.id, plan.planName, '确认设备档案变更', '已知晓设备档案修改内容');
    
    const exception = exceptionsData.find(e => e.changeRecordId === plan.equipmentChangeRecordId && e.status === 'pending');
    if (exception) {
      exception.status = 'resolved';
      exception.updatedAt = new Date().toLocaleString('zh-CN');
    }
    
    res.json(plan);
  } else {
    res.status(400).json({ message: '无需确认或已确认' });
  }
});

app.get('/api/maintenance-change-records', (req, res) => {
  res.json(maintenanceChangeRecords);
});

app.get('/api/parts', (req, res) => {
  res.json(partsInventoryData);
});

app.get('/api/parts/:id', (req, res) => {
  const part = partsInventoryData.find(p => p.id === req.params.id);
  if (part) {
    res.json(part);
  } else {
    res.status(404).json({ message: '配件不存在' });
  }
});

app.post('/api/parts', (req, res) => {
  const newPart = {
    id: generateId('P'),
    ...req.body,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
  partsInventoryData.push(newPart);
  addLog(req.body.operator || '仓库管理员', req.body.operatorRole || 'warehouse_manager', 'add_parts', 'parts', newPart.id, newPart.name, '新增配件', `数量：${newPart.quantity}`);
  res.json(newPart);
});

app.put('/api/parts/:id', (req, res) => {
  const index = partsInventoryData.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const oldPart = { ...partsInventoryData[index] };
    partsInventoryData[index] = { ...partsInventoryData[index], ...req.body, updatedAt: new Date().toISOString().split('T')[0] };
    
    if (req.body.quantity !== undefined && req.body.quantity < oldPart.quantity) {
      const issued = oldPart.quantity - req.body.quantity;
      addLog(req.body.operator || '仓库管理员', req.body.operatorRole || 'warehouse_manager', 'issue_parts', 'parts', req.params.id, partsInventoryData[index].name, `发放配件：${partsInventoryData[index].name} x ${issued}`, req.body.purpose || '');
    } else if (req.body.quantity !== undefined && req.body.quantity > oldPart.quantity) {
      const added = req.body.quantity - oldPart.quantity;
      addLog(req.body.operator || '仓库管理员', req.body.operatorRole || 'warehouse_manager', 'receive_parts', 'parts', req.params.id, partsInventoryData[index].name, `入库配件：${partsInventoryData[index].name} x ${added}`, '');
    }
    
    res.json(partsInventoryData[index]);
  } else {
    res.status(404).json({ message: '配件不存在' });
  }
});

app.post('/api/parts/:id/issue', (req, res) => {
  const { quantity, recipient, purpose, operator, operatorRole } = req.body;
  const index = partsInventoryData.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    if (partsInventoryData[index].quantity >= quantity) {
      partsInventoryData[index].quantity -= quantity;
      partsInventoryData[index].updatedAt = new Date().toISOString().split('T')[0];
      addLog(operator || '仓库管理员', operatorRole || 'warehouse_manager', 'issue_parts', 'parts', req.params.id, partsInventoryData[index].name, `发放配件：${partsInventoryData[index].name} x ${quantity}`, `领取人：${recipient}，用途：${purpose}`);
      res.json(partsInventoryData[index]);
    } else {
      res.status(400).json({ message: '库存不足' });
    }
  } else {
    res.status(404).json({ message: '配件不存在' });
  }
});

app.post('/api/parts/:id/report-wrong-delivery', (req, res) => {
  const { expectedCode, actualCode, recipient, destination, operator, operatorRole } = req.body;
  const part = partsInventoryData.find(p => p.id === req.params.id);
  
  const exception = {
    id: generateId('EX'),
    type: 'wrong_parts_delivery',
    title: '配件错发登记',
    description: `发往${destination || '客户'}的配件型号错误：应发${expectedCode}，实发${actualCode}`,
    equipmentId: null,
    equipmentCode: null,
    customerName: destination,
    status: 'pending',
    priority: 'high',
    createdAt: new Date().toLocaleString('zh-CN'),
    updatedAt: new Date().toLocaleString('zh-CN'),
    assignee: operator || '仓库管理员',
    partId: req.params.id,
    partName: part?.name,
    expectedCode,
    actualCode,
    recipient,
  };
  exceptionsData.unshift(exception);
  
  addLog(operator || '仓库管理员', operatorRole || 'warehouse_manager', 'report_wrong_delivery', 'parts', req.params.id, part?.name || '未知', '登记配件错发', `应发：${expectedCode}，实发：${actualCode}，发往：${destination}`);
  
  res.json(exception);
});

app.post('/api/parts/wrong-delivery/resolve', (req, res) => {
  const { exceptionId, resolution, operator, operatorRole } = req.body;
  const exception = exceptionsData.find(e => e.id === exceptionId);
  
  if (exception && exception.type === 'wrong_parts_delivery') {
    exception.status = 'resolved';
    exception.resolution = resolution;
    exception.updatedAt = new Date().toLocaleString('zh-CN');
    
    addLog(operator || '仓库管理员', operatorRole || 'warehouse_manager', 'resolve_wrong_delivery', 'parts', exception.partId, exception.partName, '处理配件错发', resolution);
    
    res.json(exception);
  } else {
    res.status(404).json({ message: '异常记录不存在' });
  }
});

app.get('/api/logs', (req, res) => {
  res.json(operationLogsData);
});

app.get('/api/exceptions', (req, res) => {
  res.json(exceptionsData);
});

app.get('/api/exceptions/:id', (req, res) => {
  const exception = exceptionsData.find(e => e.id === req.params.id);
  if (exception) {
    res.json(exception);
  } else {
    res.status(404).json({ message: '异常记录不存在' });
  }
});

app.put('/api/exceptions/:id', (req, res) => {
  const index = exceptionsData.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    exceptionsData[index] = { ...exceptionsData[index], ...req.body, updatedAt: new Date().toLocaleString('zh-CN') };
    
    if (req.body.status === 'resolved') {
      addLog(req.body.operator || '张主管', req.body.operatorRole || 'maintenance_manager', 'resolve_exception', 'exception', req.params.id, exceptionsData[index].title, '处理异常', req.body.resolution || '');
    }
    
    res.json(exceptionsData[index]);
  } else {
    res.status(404).json({ message: '异常记录不存在' });
  }
});

app.post('/api/exceptions', (req, res) => {
  const newException = {
    id: generateId('EX'),
    ...req.body,
    createdAt: new Date().toLocaleString('zh-CN'),
    updatedAt: new Date().toLocaleString('zh-CN'),
  };
  exceptionsData.unshift(newException);
  
  if (req.body.type === 'equipment_down') {
    const equipment = equipmentData.find(e => e.id === req.body.equipmentId);
    if (equipment) {
      equipment.status = 'down';
      equipment.updatedAt = new Date().toISOString().split('T')[0];
    }
    addLog(req.body.assignee || '系统', 'field_technician', 'report_issue', 'equipment', req.body.equipmentId, req.body.equipmentCode, req.body.description, '');
  }
  
  res.json(newException);
});

app.post('/api/check-overdue', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const newExceptions = [];
  
  maintenancePlansData.forEach(plan => {
    if (plan.status === 'pending' && plan.scheduledDate < today) {
      plan.status = 'overdue';
      
      const existingException = exceptionsData.find(
        e => e.type === 'overdue_maintenance' && e.equipmentId === plan.equipmentId && e.status === 'pending'
      );
      
      if (!existingException) {
        const exception = {
          id: generateId('EX'),
          type: 'overdue_maintenance',
          title: '保养逾期预警',
          description: `设备${plan.equipmentCode}的保养计划${plan.planName}已逾期，计划日期：${plan.scheduledDate}`,
          equipmentId: plan.equipmentId,
          equipmentCode: plan.equipmentCode,
          customerName: plan.customerName,
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'),
          assignee: plan.responsibleTechnician,
          planId: plan.id,
          planName: plan.planName,
        };
        exceptionsData.unshift(exception);
        newExceptions.push(exception);
        
        addLog('系统', 'system', 'detect_overdue', 'maintenance_plan', plan.id, plan.planName, '检测到保养逾期', `设备：${plan.equipmentCode}，计划日期：${plan.scheduledDate}`);
      }
    }
  });
  
  res.json({ message: '检查完成', newExceptions });
});

app.get('/api/overdue-warnings', (req, res) => {
  const overduePlans = maintenancePlansData.filter(p => p.status === 'overdue');
  const overdueExceptions = exceptionsData.filter(e => e.type === 'overdue_maintenance' && e.status === 'pending');
  res.json({ plans: overduePlans, exceptions: overdueExceptions });
});

app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ id: u.id, name: u.name, role: u.role, username: u.username })));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});