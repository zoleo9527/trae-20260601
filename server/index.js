const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { data, getList, getById, insert, update } = require('./db');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const faultTypeMap = {
  brake_failure: '刹车故障',
  qr_damage: '二维码损坏',
  position_offset: '定位偏移',
  tire_flat: '车胎漏气',
  chain_issue: '链条问题',
  seat_damage: '座椅损坏',
  handlebar_issue: '车把问题',
  pedal_issue: '脚踏问题',
  other: '其他'
};

const faultLevelMap = {
  minor: '轻微',
  medium: '中等',
  serious: '严重'
};

const statusMap = {
  normal: '正常',
  fault: '故障',
  repairing: '维修中'
};

const taskStatusMap = {
  pending: '待执行',
  in_progress: '进行中',
  completed: '已完成'
};

const repairTypeMap = {
  on_site_repair: '就地维修',
  pull_back: '拉回维修'
};

const faultStatusMap = {
  reported: '已上报',
  dispatched: '已派单',
  repairing: '维修中',
  repaired: '已修复'
};

app.get('/api/bikes', (req, res) => {
  const { status, area, page = 1, pageSize = 10 } = req.query;
  const filters = {};
  if (status && status !== 'all') filters.status = status;
  if (area && area !== 'all') filters.area = area;

  const result = getList('bikes', filters, parseInt(page), parseInt(pageSize));

  res.json({
    success: true,
    data: result.list.map(bike => ({
      ...bike,
      status_text: statusMap[bike.status] || bike.status
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  });
});

app.get('/api/bikes/by-area/:areaName', (req, res) => {
  const areaName = decodeURIComponent(req.params.areaName);
  const bikes = data.bikes.filter(b => b.area === areaName);
  res.json({
    success: true,
    data: bikes.map(bike => ({
      ...bike,
      status_text: statusMap[bike.status] || bike.status
    }))
  });
});

app.get('/api/bikes/:id', (req, res) => {
  const bike = getById('bikes', req.params.id);
  if (!bike) {
    return res.json({ success: false, message: '车辆不存在' });
  }

  const faults = data.fault_reports
    .filter(f => f.bike_id === bike.id)
    .sort((a, b) => b.report_time.localeCompare(a.report_time));

  res.json({
    success: true,
    data: {
      ...bike,
      status_text: statusMap[bike.status] || bike.status,
      faults
    }
  });
});

app.get('/api/inspection-tasks', (req, res) => {
  const { status, area, page = 1, pageSize = 10 } = req.query;
  const filters = {};
  if (status && status !== 'all') filters.status = status;
  if (area && area !== 'all') filters.area = area;

  const result = getList('inspection_tasks', filters, parseInt(page), parseInt(pageSize));

  res.json({
    success: true,
    data: result.list.map(task => ({
      ...task,
      status_text: taskStatusMap[task.status] || task.status
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  });
});

app.get('/api/inspection-tasks/:id', (req, res) => {
  const task = getById('inspection_tasks', req.params.id);
  if (!task) {
    return res.json({ success: false, message: '任务不存在' });
  }

  const faults = data.fault_reports
    .filter(f => f.task_id === task.id)
    .sort((a, b) => b.report_time.localeCompare(a.report_time));

  res.json({
    success: true,
    data: {
      ...task,
      status_text: taskStatusMap[task.status] || task.status,
      faults: faults.map(f => ({
        ...f,
        fault_type_text: faultTypeMap[f.fault_type] || f.fault_type,
        fault_level_text: faultLevelMap[f.fault_level] || f.fault_level,
        status_text: faultStatusMap[f.status] || f.status
      }))
    }
  });
});

app.get('/api/faults', (req, res) => {
  const { status, faultType, area, page = 1, pageSize = 10 } = req.query;
  const filters = {};
  if (status && status !== 'all') filters.status = status;
  if (faultType && faultType !== 'all') filters.fault_type = faultType;
  if (area && area !== 'all') filters.area = area;

  const result = getList('fault_reports', filters, parseInt(page), parseInt(pageSize));

  res.json({
    success: true,
    data: result.list.map(fault => ({
      ...fault,
      fault_type_text: faultTypeMap[fault.fault_type] || fault.fault_type,
      fault_level_text: faultLevelMap[fault.fault_level] || fault.fault_level,
      status_text: faultStatusMap[fault.status] || fault.status,
      repair_decision_text: fault.repair_decision ? repairTypeMap[fault.repair_decision] : null
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  });
});

app.get('/api/faults/:id', (req, res) => {
  const fault = getById('fault_reports', req.params.id);
  if (!fault) {
    return res.json({ success: false, message: '故障记录不存在' });
  }

  const bike = getById('bikes', fault.bike_id);
  const repair = data.repair_records.find(r => r.fault_id === fault.id) || null;

  let duplicateInfo = null;
  if (fault.is_duplicate && fault.duplicate_of) {
    const orig = getById('fault_reports', fault.duplicate_of);
    if (orig) {
      duplicateInfo = {
        report_no: orig.report_no,
        reporter: orig.reporter,
        report_time: orig.report_time
      };
    }
  }

  const duplicates = data.fault_reports.filter(f => f.duplicate_of === fault.id);

  let taskInfo = null;
  if (fault.task_id) {
    const task = getById('inspection_tasks', fault.task_id);
    if (task) {
      taskInfo = {
        id: task.id,
        task_no: task.task_no,
        area: task.area,
        route: task.route,
        inspector: task.inspector,
        status: task.status,
        status_text: taskStatusMap[task.status] || task.status
      };
    }
  }

  res.json({
    success: true,
    data: {
      ...fault,
      fault_type_text: faultTypeMap[fault.fault_type] || fault.fault_type,
      fault_level_text: faultLevelMap[fault.fault_level] || fault.fault_level,
      status_text: faultStatusMap[fault.status] || fault.status,
      repair_decision_text: fault.repair_decision ? repairTypeMap[fault.repair_decision] : null,
      bike,
      taskInfo,
      repair: repair ? {
        ...repair,
        repair_type_text: repairTypeMap[repair.repair_type] || repair.repair_type
      } : null,
      duplicateInfo,
      duplicates: duplicates.map(d => ({
        ...d,
        fault_type_text: faultTypeMap[d.fault_type] || d.fault_type
      }))
    }
  });
});

const invalidDescriptionKeywords = ['坏了', '坏', '不行了', '不能用', '用不了', '坏的', '坏掉', '损坏', '故障'];

function validateDescription(desc) {
  if (!desc || desc.trim().length < 5) return '故障描述至少5个字符，请详细描述故障情况';
  const trimmed = desc.trim();
  for (const kw of invalidDescriptionKeywords) {
    if (trimmed === kw || trimmed === kw + '了' || trimmed === '车' + kw || trimmed === kw + '了！' || trimmed === kw + '!') {
      return '故障描述过于简单，请详细说明具体故障现象，不能只写"坏了"';
    }
  }
  return null;
}

app.post('/api/faults', (req, res) => {
  const { bike_no, fault_type, fault_level, description, location, lat, lng, reporter, task_id } = req.body;

  if (!bike_no || !fault_type || !fault_level || !location || !lat || !lng || !reporter) {
    return res.json({ success: false, message: '参数不完整' });
  }

  const descError = validateDescription(description);
  if (descError) {
    return res.json({ success: false, message: descError });
  }

  const bike = data.bikes.find(b => b.bike_no === bike_no);
  if (!bike) {
    return res.json({ success: false, message: '车辆不存在' });
  }

  let taskContext = {};
  if (task_id) {
    const task = getById('inspection_tasks', task_id);
    if (!task) {
      return res.json({ success: false, message: '关联巡检任务不存在' });
    }
    if (bike.area !== task.area) {
      return res.json({ success: false, message: `车辆 ${bike_no} 不属于当前任务区域「${task.area}」，该车辆在「${bike.area}」` });
    }
    taskContext = {
      task_id: task.id,
      task_no: task.task_no,
      task_area: task.area,
      task_route: task.route,
      task_inspector: task.inspector
    };
  }

  const report_no = 'FAULT' + Date.now();
  const report_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const photo_placeholder = `photo_${Date.now()}.jpg`;

  const newFault = insert('fault_reports', {
    report_no,
    bike_id: bike.id,
    bike_no,
    fault_type,
    fault_level,
    description: description || '',
    location,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    photo_placeholder,
    reporter,
    report_time,
    task_id: task_id || null,
    task_no: taskContext.task_no || null,
    task_area: taskContext.task_area || null,
    task_route: taskContext.task_route || null,
    task_inspector: taskContext.task_inspector || null,
    is_duplicate: 0,
    duplicate_of: null,
    status: 'reported',
    repair_decision: null,
    dispatcher: null,
    dispatch_time: null
  });

  update('bikes', bike.id, { status: 'fault' });

  if (task_id) {
    const task = getById('inspection_tasks', task_id);
    if (task) {
      update('inspection_tasks', task_id, { fault_count: task.fault_count + 1 });
    }
  }

  res.json({
    success: true,
    data: { id: newFault.id, report_no }
  });
});

app.put('/api/faults/:id/dispatch', (req, res) => {
  const { repair_decision, dispatcher } = req.body;
  const faultId = req.params.id;

  const fault = getById('fault_reports', faultId);
  if (!fault) {
    return res.json({ success: false, message: '故障记录不存在' });
  }

  const dispatch_time = new Date().toISOString().replace('T', ' ').substring(0, 19);

  update('fault_reports', faultId, {
    status: 'dispatched',
    repair_decision,
    dispatcher,
    dispatch_time
  });

  update('bikes', fault.bike_id, { status: 'repairing' });

  const repair_no = 'REP' + Date.now();
  insert('repair_records', {
    repair_no,
    fault_id: parseInt(faultId),
    bike_id: fault.bike_id,
    bike_no: fault.bike_no,
    fault_type: fault.fault_type,
    repair_type: repair_decision,
    repair_location: repair_decision === 'pull_back' ? '维修中心' : fault.location,
    repairer: null,
    parts_used: null,
    cost: 0,
    start_time: null,
    end_time: null,
    status: 'pending',
    result: null
  });

  res.json({ success: true, message: '派单成功' });
});

app.get('/api/repairs', (req, res) => {
  const { status, repairType, page = 1, pageSize = 10 } = req.query;
  const filters = {};
  if (status && status !== 'all') filters.status = status;
  if (repairType && repairType !== 'all') filters.repair_type = repairType;

  const result = getList('repair_records', filters, parseInt(page), parseInt(pageSize));

  res.json({
    success: true,
    data: result.list.map(repair => ({
      ...repair,
      repair_type_text: repairTypeMap[repair.repair_type] || repair.repair_type
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize
  });
});

app.get('/api/repairs/:id', (req, res) => {
  const repair = getById('repair_records', req.params.id);
  if (!repair) {
    return res.json({ success: false, message: '维修记录不存在' });
  }

  const fault = getById('fault_reports', repair.fault_id);
  const bike = getById('bikes', repair.bike_id);

  res.json({
    success: true,
    data: {
      ...repair,
      repair_type_text: repairTypeMap[repair.repair_type] || repair.repair_type,
      fault: fault ? {
        ...fault,
        fault_type_text: faultTypeMap[fault.fault_type] || fault.fault_type,
        fault_level_text: faultLevelMap[fault.fault_level] || fault.fault_level
      } : null,
      bike
    }
  });
});

app.put('/api/repairs/:id/complete', (req, res) => {
  const { repairer, parts_used, cost, result } = req.body;
  const repairId = req.params.id;

  const repair = getById('repair_records', repairId);
  if (!repair) {
    return res.json({ success: false, message: '维修记录不存在' });
  }

  const end_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const start_time = repair.start_time || new Date().toISOString().replace('T', ' ').substring(0, 19);

  update('repair_records', repairId, {
    status: 'completed',
    repairer: repairer || '',
    parts_used: parts_used || '',
    cost: cost || 0,
    result: result || '',
    start_time,
    end_time
  });

  update('fault_reports', repair.fault_id, { status: 'repaired' });

  update('bikes', repair.bike_id, { status: 'normal' });

  res.json({ success: true, message: '维修完成' });
});

app.put('/api/repairs/:id/start', (req, res) => {
  const { repairer } = req.body;
  const repairId = req.params.id;

  const repair = getById('repair_records', repairId);
  if (!repair) {
    return res.json({ success: false, message: '维修记录不存在' });
  }

  if (repair.status !== 'pending') {
    return res.json({ success: false, message: '当前状态不可开始维修' });
  }

  const start_time = new Date().toISOString().replace('T', ' ').substring(0, 19);

  update('repair_records', repairId, {
    status: 'in_progress',
    repairer: repairer || repair.repairer || '',
    start_time
  });

  update('fault_reports', repair.fault_id, { status: 'repairing' });

  res.json({ success: true, message: '开始维修' });
});

app.get('/api/areas', (req, res) => {
  res.json({ success: true, data: data.areas });
});

app.get('/api/statistics/overview', (req, res) => {
  const totalBikes = data.bikes.length;
  const faultBikes = data.bikes.filter(b => b.status === 'fault').length;
  const repairingBikes = data.bikes.filter(b => b.status === 'repairing').length;
  const normalBikes = totalBikes - faultBikes - repairingBikes;

  const today = new Date().toISOString().split('T')[0];
  const todayFaults = data.fault_reports.filter(f => f.report_time.startsWith(today)).length;
  const pendingRepairs = data.repair_records.filter(r => r.status === 'pending').length;
  const inProgressRepairs = data.repair_records.filter(r => r.status === 'in_progress').length;
  const completedRepairs = data.repair_records.filter(r => r.status === 'completed').length;

  const faultTypeCount = {};
  data.fault_reports.forEach(f => {
    faultTypeCount[f.fault_type] = (faultTypeCount[f.fault_type] || 0) + 1;
  });
  const faultTypeStats = Object.entries(faultTypeCount)
    .map(([fault_type, count]) => ({
      fault_type,
      count,
      fault_type_text: faultTypeMap[fault_type] || fault_type
    }))
    .sort((a, b) => b.count - a.count);

  const areaStats = data.areas.map(area => {
    const bikeCount = data.bikes.filter(b => b.area === area.name).length;
    const faultCount = data.fault_reports.filter(f => {
      const bike = data.bikes.find(b => b.id === f.bike_id);
      return bike && bike.area === area.name;
    }).length;
    return {
      area: area.name,
      bike_count: bikeCount,
      fault_count: faultCount
    };
  }).sort((a, b) => b.fault_count - a.fault_count);

  const duplicateCount = data.fault_reports.filter(f => f.is_duplicate === 1).length;

  res.json({
    success: true,
    data: {
      bikes: {
        total: totalBikes,
        normal: normalBikes,
        fault: faultBikes,
        repairing: repairingBikes
      },
      faults: {
        today: todayFaults,
        total: data.fault_reports.length,
        duplicates: duplicateCount
      },
      repairs: {
        pending: pendingRepairs,
        in_progress: inProgressRepairs,
        completed: completedRepairs,
        total: pendingRepairs + inProgressRepairs + completedRepairs
      },
      faultTypeStats,
      areaStats
    }
  });
});

app.get('/api/statistics/hotspots', (req, res) => {
  const locationMap = {};
  data.fault_reports.forEach(f => {
    if (f.is_duplicate) return;
    const key = f.location;
    if (!locationMap[key]) {
      locationMap[key] = {
        location: f.location,
        lat: f.lat,
        lng: f.lng,
        fault_count: 0,
        fault_types: new Set()
      };
    }
    locationMap[key].fault_count++;
    locationMap[key].fault_types.add(f.fault_type);
  });

  const hotspots = Object.values(locationMap)
    .sort((a, b) => b.fault_count - a.fault_count)
    .slice(0, 10)
    .map(item => ({
      ...item,
      fault_type_list: Array.from(item.fault_types).map(t => faultTypeMap[t] || t)
    }));

  res.json({ success: true, data: hotspots });
});

app.get('/api/dict/fault-types', (req, res) => {
  const types = Object.entries(faultTypeMap).map(([value, label]) => ({ value, label }));
  res.json({ success: true, data: types });
});

app.get('/api/dict/areas', (req, res) => {
  const areas = data.areas.map(a => ({ value: a.name, label: a.name }));
  res.json({ success: true, data: areas });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
