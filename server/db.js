const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'data.json');

let data = {
  bikes: [],
  inspection_tasks: [],
  fault_reports: [],
  repair_records: [],
  areas: []
};

let nextIds = {
  bikes: 1,
  inspection_tasks: 1,
  fault_reports: 1,
  repair_records: 1,
  areas: 1
};

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const loaded = JSON.parse(raw);
      data = loaded.data || data;
      nextIds = loaded.nextIds || nextIds;
    } else {
      seedData();
      saveData();
    }
  } catch (e) {
    console.error('加载数据失败:', e);
    seedData();
  }
}

function saveData() {
  try {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataPath, JSON.stringify({ data, nextIds }, null, 2));
  } catch (e) {
    console.error('保存数据失败:', e);
  }
}

function seedData() {
  data.areas = [
    { id: 1, name: '朝阳区', manager: '张伟', bike_count: 120, fault_count: 23, repair_count: 18 },
    { id: 2, name: '海淀区', manager: '李娜', bike_count: 156, fault_count: 31, repair_count: 24 },
    { id: 3, name: '西城区', manager: '王强', bike_count: 89, fault_count: 15, repair_count: 12 },
    { id: 4, name: '东城区', manager: '刘芳', bike_count: 98, fault_count: 19, repair_count: 16 },
    { id: 5, name: '丰台区', manager: '陈明', bike_count: 110, fault_count: 27, repair_count: 21 }
  ];
  nextIds.areas = 6;

  data.bikes = [
    { id: 1, bike_no: 'BK001001', status: 'normal', area: '朝阳区', location: '国贸地铁站A口', lat: 39.9087, lng: 116.4605, last_inspection_date: '2026-06-08', created_at: '2026-01-15 10:00:00' },
    { id: 2, bike_no: 'BK001002', status: 'fault', area: '朝阳区', location: '三里屯太古里', lat: 39.9342, lng: 116.4517, last_inspection_date: '2026-06-05', created_at: '2026-01-16 10:00:00' },
    { id: 3, bike_no: 'BK001003', status: 'normal', area: '朝阳区', location: '望京SOHO', lat: 39.9926, lng: 116.4745, last_inspection_date: '2026-06-09', created_at: '2026-01-17 10:00:00' },
    { id: 4, bike_no: 'BK001004', status: 'repairing', area: '朝阳区', location: '建外SOHO', lat: 39.9088, lng: 116.4550, last_inspection_date: '2026-06-07', created_at: '2026-01-18 10:00:00' },
    { id: 5, bike_no: 'BK001005', status: 'normal', area: '朝阳区', location: '团结湖公园', lat: 39.9321, lng: 116.4678, last_inspection_date: '2026-06-09', created_at: '2026-01-19 10:00:00' },
    { id: 6, bike_no: 'BK002001', status: 'normal', area: '海淀区', location: '中关村地铁站', lat: 39.9847, lng: 116.3125, last_inspection_date: '2026-06-08', created_at: '2026-01-20 10:00:00' },
    { id: 7, bike_no: 'BK002002', status: 'normal', area: '海淀区', location: '五道口地铁站', lat: 39.9926, lng: 116.3417, last_inspection_date: '2026-06-09', created_at: '2026-01-21 10:00:00' },
    { id: 8, bike_no: 'BK002003', status: 'normal', area: '海淀区', location: '西二旗地铁站', lat: 40.0500, lng: 116.3056, last_inspection_date: '2026-06-09', created_at: '2026-01-22 10:00:00' },
    { id: 9, bike_no: 'BK002004', status: 'normal', area: '海淀区', location: '清华西门', lat: 40.0039, lng: 116.3146, last_inspection_date: '2026-06-08', created_at: '2026-01-23 10:00:00' },
    { id: 10, bike_no: 'BK002005', status: 'normal', area: '海淀区', location: '北大东门', lat: 39.9972, lng: 116.3183, last_inspection_date: '2026-06-08', created_at: '2026-01-24 10:00:00' },
    { id: 11, bike_no: 'BK003001', status: 'normal', area: '西城区', location: '西单地铁站', lat: 39.9139, lng: 116.3742, last_inspection_date: '2026-06-07', created_at: '2026-01-25 10:00:00' },
    { id: 12, bike_no: 'BK003002', status: 'normal', area: '西城区', location: '金融街', lat: 39.9186, lng: 116.3608, last_inspection_date: '2026-06-08', created_at: '2026-01-26 10:00:00' },
    { id: 13, bike_no: 'BK003003', status: 'normal', area: '西城区', location: '宣武门', lat: 39.8992, lng: 116.3736, last_inspection_date: '2026-06-09', created_at: '2026-01-27 10:00:00' },
    { id: 14, bike_no: 'BK004001', status: 'normal', area: '东城区', location: '王府井', lat: 39.9151, lng: 116.4039, last_inspection_date: '2026-06-08', created_at: '2026-01-28 10:00:00' },
    { id: 15, bike_no: 'BK004002', status: 'fault', area: '东城区', location: '东直门', lat: 39.9415, lng: 116.4278, last_inspection_date: '2026-06-06', created_at: '2026-01-29 10:00:00' },
    { id: 16, bike_no: 'BK005001', status: 'normal', area: '丰台区', location: '丽泽商务区', lat: 39.8572, lng: 116.3225, last_inspection_date: '2026-06-07', created_at: '2026-01-30 10:00:00' },
    { id: 17, bike_no: 'BK005002', status: 'fault', area: '丰台区', location: '宋家庄', lat: 39.8315, lng: 116.4275, last_inspection_date: '2026-06-05', created_at: '2026-02-01 10:00:00' }
  ];
  nextIds.bikes = 18;

  data.inspection_tasks = [
    { id: 1, task_no: 'TASK20260610001', inspector: '赵巡检', area: '朝阳区', route: '国贸→三里屯→望京', status: 'in_progress', plan_date: '2026-06-10', start_time: '2026-06-10 08:30:00', end_time: null, bike_count: 15, fault_count: 2, created_at: '2026-06-09 18:00:00' },
    { id: 2, task_no: 'TASK20260610002', inspector: '钱巡检', area: '海淀区', route: '中关村→五道口→西二旗', status: 'pending', plan_date: '2026-06-10', start_time: null, end_time: null, bike_count: 20, fault_count: 0, created_at: '2026-06-09 18:05:00' },
    { id: 3, task_no: 'TASK20260609001', inspector: '孙巡检', area: '西城区', route: '西单→金融街→宣武门', status: 'completed', plan_date: '2026-06-09', start_time: '2026-06-09 09:00:00', end_time: '2026-06-09 17:30:00', bike_count: 18, fault_count: 3, created_at: '2026-06-08 18:00:00' },
    { id: 4, task_no: 'TASK20260609002', inspector: '李巡检', area: '东城区', route: '王府井→东单→东直门', status: 'completed', plan_date: '2026-06-09', start_time: '2026-06-09 08:45:00', end_time: '2026-06-09 16:50:00', bike_count: 12, fault_count: 2, created_at: '2026-06-08 18:05:00' },
    { id: 5, task_no: 'TASK20260610003', inspector: '周巡检', area: '丰台区', route: '丽泽→宋家庄→角门', status: 'pending', plan_date: '2026-06-10', start_time: null, end_time: null, bike_count: 16, fault_count: 0, created_at: '2026-06-09 18:10:00' }
  ];
  nextIds.inspection_tasks = 6;

  data.fault_reports = [
    { id: 1, report_no: 'FAULT20260610001', bike_id: 2, bike_no: 'BK001002', fault_type: 'brake_failure', fault_level: 'serious', description: '后刹车失灵，捏刹车后车辆仍能滑行，刹车线松动', location: '三里屯太古里', lat: 39.9342, lng: 116.4517, photo_placeholder: 'photo_001.jpg', reporter: '赵巡检', report_time: '2026-06-10 09:15:00', task_id: 1, is_duplicate: 0, duplicate_of: null, status: 'dispatched', repair_decision: 'on_site_repair', dispatcher: '调度员王', dispatch_time: '2026-06-10 09:30:00' },
    { id: 2, report_no: 'FAULT20260610002', bike_id: 1, bike_no: 'BK001001', fault_type: 'qr_damage', fault_level: 'minor', description: '车把上的二维码有划痕，部分区域模糊，扫码成功率低', location: '国贸地铁站A口', lat: 39.9087, lng: 116.4605, photo_placeholder: 'photo_002.jpg', reporter: '赵巡检', report_time: '2026-06-10 08:45:00', task_id: 1, is_duplicate: 0, duplicate_of: null, status: 'reported', repair_decision: null, dispatcher: null, dispatch_time: null },
    { id: 3, report_no: 'FAULT20260610003', bike_id: 4, bike_no: 'BK001004', fault_type: 'position_offset', fault_level: 'medium', description: 'GPS定位偏移约500米，APP上显示位置与实际位置不符', location: '建外SOHO', lat: 39.9088, lng: 116.4550, photo_placeholder: 'photo_003.jpg', reporter: '用户举报', report_time: '2026-06-10 10:00:00', task_id: null, is_duplicate: 0, duplicate_of: null, status: 'dispatched', repair_decision: 'pull_back', dispatcher: '调度员李', dispatch_time: '2026-06-10 10:15:00' },
    { id: 4, report_no: 'FAULT20260609001', bike_id: 7, bike_no: 'BK002002', fault_type: 'brake_failure', fault_level: 'serious', description: '前刹车完全失效，刹车把手松动', location: '五道口地铁站', lat: 39.9926, lng: 116.3417, photo_placeholder: 'photo_004.jpg', reporter: '孙巡检', report_time: '2026-06-09 10:30:00', task_id: 3, is_duplicate: 0, duplicate_of: null, status: 'repaired', repair_decision: 'on_site_repair', dispatcher: '调度员王', dispatch_time: '2026-06-09 10:45:00' },
    { id: 5, report_no: 'FAULT20260609002', bike_id: 9, bike_no: 'BK002004', fault_type: 'qr_damage', fault_level: 'minor', description: '二维码被贴小广告覆盖', location: '清华西门', lat: 40.0039, lng: 116.3146, photo_placeholder: 'photo_005.jpg', reporter: '李巡检', report_time: '2026-06-09 14:20:00', task_id: 4, is_duplicate: 0, duplicate_of: null, status: 'repaired', repair_decision: 'on_site_repair', dispatcher: '调度员张', dispatch_time: '2026-06-09 14:35:00' },
    { id: 6, report_no: 'FAULT20260610004', bike_id: 2, bike_no: 'BK001002', fault_type: 'brake_failure', fault_level: 'serious', description: '刹车不好用', location: '三里屯', lat: 39.9340, lng: 116.4520, photo_placeholder: 'photo_006.jpg', reporter: '用户举报', report_time: '2026-06-10 10:05:00', task_id: null, is_duplicate: 1, duplicate_of: 1, status: 'reported', repair_decision: null, dispatcher: null, dispatch_time: null },
    { id: 7, report_no: 'FAULT20260609003', bike_id: 12, bike_no: 'BK003002', fault_type: 'position_offset', fault_level: 'medium', description: '定位漂移严重，实际在金融街却显示在西单', location: '金融街', lat: 39.9186, lng: 116.3608, photo_placeholder: 'photo_007.jpg', reporter: '孙巡检', report_time: '2026-06-09 11:45:00', task_id: 3, is_duplicate: 0, duplicate_of: null, status: 'repaired', repair_decision: 'pull_back', dispatcher: '调度员李', dispatch_time: '2026-06-09 12:00:00' },
    { id: 8, report_no: 'FAULT20260610005', bike_id: 15, bike_no: 'BK004002', fault_type: 'brake_failure', fault_level: 'medium', description: '后刹车有异响，制动效果下降', location: '东直门', lat: 39.9415, lng: 116.4278, photo_placeholder: 'photo_008.jpg', reporter: '用户举报', report_time: '2026-06-10 07:50:00', task_id: null, is_duplicate: 0, duplicate_of: null, status: 'reported', repair_decision: null, dispatcher: null, dispatch_time: null },
    { id: 9, report_no: 'FAULT20260610006', bike_id: 17, bike_no: 'BK005002', fault_type: 'qr_damage', fault_level: 'minor', description: '二维码褪色严重，难以识别', location: '宋家庄', lat: 39.8315, lng: 116.4275, photo_placeholder: 'photo_009.jpg', reporter: '用户举报', report_time: '2026-06-10 09:00:00', task_id: null, is_duplicate: 0, duplicate_of: null, status: 'reported', repair_decision: null, dispatcher: null, dispatch_time: null }
  ];
  nextIds.fault_reports = 10;

  data.repair_records = [
    { id: 1, repair_no: 'REP20260609001', fault_id: 4, bike_id: 7, bike_no: 'BK002002', fault_type: 'brake_failure', repair_type: 'on_site_repair', repair_location: '五道口地铁站', repairer: '刘师傅', parts_used: '刹车线1根, 刹车片1副', cost: 85.0, start_time: '2026-06-09 11:00:00', end_time: '2026-06-09 11:30:00', status: 'completed', result: '更换刹车线和刹车片，测试正常' },
    { id: 2, repair_no: 'REP20260609002', fault_id: 5, bike_id: 9, bike_no: 'BK002004', fault_type: 'qr_damage', repair_type: 'on_site_repair', repair_location: '清华西门', repairer: '陈师傅', parts_used: '二维码贴纸1张', cost: 15.0, start_time: '2026-06-09 15:00:00', end_time: '2026-06-09 15:10:00', status: 'completed', result: '清理小广告，更换新二维码' },
    { id: 3, repair_no: 'REP20260609003', fault_id: 7, bike_id: 12, bike_no: 'BK003002', fault_type: 'position_offset', repair_type: 'pull_back', repair_location: '维修中心-西城站', repairer: '张师傅', parts_used: 'GPS模块1个', cost: 220.0, start_time: '2026-06-09 14:00:00', end_time: '2026-06-09 16:30:00', status: 'completed', result: '更换GPS模块，定位校准正常' },
    { id: 4, repair_no: 'REP20260610001', fault_id: 1, bike_id: 2, bike_no: 'BK001002', fault_type: 'brake_failure', repair_type: 'on_site_repair', repair_location: '三里屯太古里', repairer: '刘师傅', parts_used: null, cost: 0, start_time: '2026-06-10 10:00:00', end_time: null, status: 'in_progress', result: null },
    { id: 5, repair_no: 'REP20260610002', fault_id: 3, bike_id: 4, bike_no: 'BK001004', fault_type: 'position_offset', repair_type: 'pull_back', repair_location: '维修中心-朝阳站', repairer: null, parts_used: null, cost: 0, start_time: null, end_time: null, status: 'pending', result: null }
  ];
  nextIds.repair_records = 6;
}

function getList(table, filters = {}, page = 1, pageSize = 10) {
  let result = [...data[table]];
  
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      if (key === 'area' && table === 'fault_reports') {
        const bikeNos = data.bikes.filter(b => b.area === value).map(b => b.bike_no);
        result = result.filter(item => bikeNos.includes(item.bike_no));
      } else {
        result = result.filter(item => item[key] === value);
      }
    }
  }

  const total = result.length;
  result = result.sort((a, b) => b.id - a.id);
  const offset = (page - 1) * pageSize;
  const paginated = result.slice(offset, offset + pageSize);

  return { list: paginated, total, page, pageSize };
}

function getById(table, id) {
  return data[table].find(item => item.id === parseInt(id)) || null;
}

function insert(table, item) {
  const id = nextIds[table]++;
  const newItem = { id, ...item };
  data[table].push(newItem);
  saveData();
  return { id, ...newItem };
}

function update(table, id, updates) {
  const index = data[table].findIndex(item => item.id === parseInt(id));
  if (index === -1) return null;
  data[table][index] = { ...data[table][index], ...updates };
  saveData();
  return data[table][index];
}

loadData();

module.exports = {
  data,
  getList,
  getById,
  insert,
  update,
  saveData
};
