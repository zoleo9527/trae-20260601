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

function generateId(prefix) {
  const count = operationLogsData.length + 1;
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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
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
  addLog('系统', 'system', 'create_equipment', 'equipment', newEquipment.id, newEquipment.code, '创建设备档案', JSON.stringify(req.body));
  res.json(newEquipment);
});

app.put('/api/equipment/:id', (req, res) => {
  const index = equipmentData.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    const oldEquipment = { ...equipmentData[index] };
    equipmentData[index] = { ...equipmentData[index], ...req.body, updatedAt: new Date().toISOString().split('T')[0] };
    
    const changes = Object.keys(req.body).map(key => `${key}: ${oldEquipment[key]} -> ${req.body[key]}`).join(', ');
    addLog('张主管', 'maintenance_manager', 'update_equipment', 'equipment', req.params.id, equipmentData[index].code, '更新设备档案', changes);
    
    const relatedPlans = maintenancePlansData.filter(p => p.equipmentId === req.params.id);
    relatedPlans.forEach(plan => {
      if (req.body.code) plan.equipmentCode = req.body.code;
      if (req.body.model) plan.equipmentModel = req.body.model;
      if (req.body.customerName) plan.customerName = req.body.customerName;
      if (req.body.responsibleTechnician) plan.responsibleTechnician = req.body.responsibleTechnician;
      plan.updatedAt = new Date().toISOString().split('T')[0];
    });
    
    res.json(equipmentData[index]);
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
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  };
  maintenancePlansData.push(newPlan);
  
  const equipment = equipmentData.find(e => e.id === req.body.equipmentId);
  if (equipment) {
    equipment.nextMaintenanceDate = req.body.scheduledDate;
    equipment.updatedAt = new Date().toISOString().split('T')[0];
  }
  
  addLog('张主管', 'maintenance_manager', 'create_maintenance_plan', 'maintenance_plan', newPlan.id, newPlan.planName, '创建保养计划', `设备：${newPlan.equipmentCode}，计划日期：${newPlan.scheduledDate}`);
  res.json(newPlan);
});

app.put('/api/maintenance-plans/:id', (req, res) => {
  const index = maintenancePlansData.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const oldPlan = { ...maintenancePlansData[index] };
    maintenancePlansData[index] = { ...maintenancePlansData[index], ...req.body, updatedAt: new Date().toISOString().split('T')[0] };
    
    if (req.body.status === 'completed' && !oldPlan.actualDate) {
      maintenancePlansData[index].actualDate = new Date().toISOString().split('T')[0];
      
      const equipment = equipmentData.find(e => e.id === maintenancePlansData[index].equipmentId);
      if (equipment) {
        equipment.lastMaintenanceDate = maintenancePlansData[index].actualDate;
        equipment.status = 'running';
        equipment.updatedAt = new Date().toISOString().split('T')[0];
      }
      
      addLog(maintenancePlansData[index].responsibleTechnician, 'field_technician', 'complete_maintenance', 'maintenance_plan', req.params.id, maintenancePlansData[index].planName, '完成保养计划', `保养项目：${maintenancePlansData[index].items.map(i => i.name).join('、')}`);
    } else {
      const changes = Object.keys(req.body).map(key => `${key}: ${oldPlan[key]} -> ${req.body[key]}`).join(', ');
      addLog('张主管', 'maintenance_manager', 'update_maintenance_plan', 'maintenance_plan', req.params.id, maintenancePlansData[index].planName, '更新保养计划', changes);
    }
    
    res.json(maintenancePlansData[index]);
  } else {
    res.status(404).json({ message: '保养计划不存在' });
  }
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
  addLog('仓库管理员', 'warehouse_manager', 'add_parts', 'parts', newPart.id, newPart.name, '新增配件', `数量：${newPart.quantity}`);
  res.json(newPart);
});

app.put('/api/parts/:id', (req, res) => {
  const index = partsInventoryData.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    const oldPart = { ...partsInventoryData[index] };
    partsInventoryData[index] = { ...partsInventoryData[index], ...req.body, updatedAt: new Date().toISOString().split('T')[0] };
    
    if (req.body.quantity !== undefined && req.body.quantity < oldPart.quantity) {
      const issued = oldPart.quantity - req.body.quantity;
      addLog('仓库管理员', 'warehouse_manager', 'issue_parts', 'parts', req.params.id, partsInventoryData[index].name, `发放配件：${partsInventoryData[index].name} x ${issued}`, '');
    } else if (req.body.quantity !== undefined && req.body.quantity > oldPart.quantity) {
      const added = req.body.quantity - oldPart.quantity;
      addLog('仓库管理员', 'warehouse_manager', 'receive_parts', 'parts', req.params.id, partsInventoryData[index].name, `入库配件：${partsInventoryData[index].name} x ${added}`, '');
    }
    
    res.json(partsInventoryData[index]);
  } else {
    res.status(404).json({ message: '配件不存在' });
  }
});

app.post('/api/parts/:id/issue', (req, res) => {
  const { quantity, recipient, purpose } = req.body;
  const index = partsInventoryData.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    if (partsInventoryData[index].quantity >= quantity) {
      partsInventoryData[index].quantity -= quantity;
      partsInventoryData[index].updatedAt = new Date().toISOString().split('T')[0];
      addLog('仓库管理员', 'warehouse_manager', 'issue_parts', 'parts', req.params.id, partsInventoryData[index].name, `发放配件：${partsInventoryData[index].name} x ${quantity}`, `领取人：${recipient}，用途：${purpose}`);
      res.json(partsInventoryData[index]);
    } else {
      res.status(400).json({ message: '库存不足' });
    }
  } else {
    res.status(404).json({ message: '配件不存在' });
  }
});

app.post('/api/parts/:id/wrong-delivery', (req, res) => {
  const { expectedCode, actualCode } = req.body;
  const part = partsInventoryData.find(p => p.id === req.params.id);
  
  const exception = {
    id: generateId('EX'),
    type: 'wrong_parts_delivery',
    title: '配件错发',
    description: `发错配件型号：${part?.name}`,
    equipmentId: null,
    equipmentCode: null,
    customerName: null,
    status: 'pending',
    priority: 'high',
    createdAt: new Date().toLocaleString('zh-CN'),
    updatedAt: new Date().toLocaleString('zh-CN'),
    assignee: '仓库管理员',
  };
  exceptionsData.unshift(exception);
  
  addLog('仓库管理员', 'warehouse_manager', 'wrong_delivery', 'parts', req.params.id, part?.name || '未知', '配件错发', `应发：${expectedCode}，实发：${actualCode}`);
  
  res.json(exception);
});

app.get('/api/logs', (req, res) => {
  res.json(operationLogsData);
});

app.get('/api/exceptions', (req, res) => {
  res.json(exceptionsData);
});

app.put('/api/exceptions/:id', (req, res) => {
  const index = exceptionsData.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    exceptionsData[index] = { ...exceptionsData[index], ...req.body, updatedAt: new Date().toLocaleString('zh-CN') };
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

app.post('/api/equipment/:id/down', (req, res) => {
  const { reason } = req.body;
  const equipment = equipmentData.find(e => e.id === req.params.id);
  
  if (equipment) {
    const oldStatus = equipment.status;
    equipment.status = 'down';
    equipment.updatedAt = new Date().toISOString().split('T')[0];
    
    const exception = {
      id: generateId('EX'),
      type: 'equipment_down',
      title: '设备停机',
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
    
    addLog(equipment.responsibleTechnician, 'field_technician', 'update_equipment_status', 'equipment', req.params.id, equipment.code, `设备状态变更：${oldStatus} -> down`, reason);
    
    res.json({ equipment, exception });
  } else {
    res.status(404).json({ message: '设备不存在' });
  }
});

app.post('/api/equipment/:id/repair', (req, res) => {
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
    
    addLog(equipment.responsibleTechnician, 'field_technician', 'emergency_repair', 'equipment', req.params.id, equipment.code, '设备维修完成', '设备已恢复运行');
    
    res.json(equipment);
  } else {
    res.status(404).json({ message: '设备不存在' });
  }
});

app.post('/api/check-overdue', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
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
          title: '保养漏做',
          description: `设备${plan.equipmentCode}的保养计划已逾期`,
          equipmentId: plan.equipmentId,
          equipmentCode: plan.equipmentCode,
          customerName: plan.customerName,
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'),
          assignee: plan.responsibleTechnician,
        };
        exceptionsData.unshift(exception);
      }
    }
  });
  
  res.json({ message: '检查完成' });
});

app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ id: u.id, name: u.name, role: u.role })));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
