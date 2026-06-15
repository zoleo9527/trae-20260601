interface OrderData {
  id: string
  customer_name: string
  phone: string
  device_model: string
  serial_number: string | null
  issue_description: string
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

interface InspectionData {
  id: string
  order_id: string
  technician_id: string
  technician_name: string
  appearance_condition: string
  screen_condition: string
  battery_condition: string
  accessories: string | null
  description: string
  status: string
  created_at: string
}

interface WarrantyData {
  id: string
  order_id: string
  manager_id: string
  manager_name: string
  warranty_type: string
  warranty_period: number
  responsibility: string
  approved: number
  approved_at: string | null
  created_at: string
}

interface NoteData {
  id: string
  order_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

interface InspectionPhotoData {
  id: string
  order_id: string
  file_path: string
  description: string | null
  created_at: string
}

interface SparePartData {
  id: string
  name: string
  sku: string
  quantity: number
  location: string | null
  created_at: string
  updated_at: string
}

interface SparePartUsageData {
  id: string
  order_id: string
  spare_part_id: string
  spare_part_name: string
  spare_part_sku: string
  quantity: number
  used_by: string
  used_by_name: string
  used_at: string
}

let orders: OrderData[] = []
let inspections: InspectionData[] = []
let warranties: WarrantyData[] = []
let notes: NoteData[] = []
let inspectionPhotos: InspectionPhotoData[] = []
let spareParts: SparePartData[] = []
let sparePartUsages: SparePartUsageData[] = []

const STATUS_FLOW = {
  pending: ['inspection_pending'],
  inspection_pending: ['warranty_pending'],
  warranty_pending: ['repairing'],
  repairing: ['completed'],
  completed: []
}

export const validateStatusTransition = (currentStatus: string, newStatus: string): { valid: boolean; message?: string } => {
  const allowed = STATUS_FLOW[currentStatus as keyof typeof STATUS_FLOW]
  if (!allowed) {
    return { valid: false, message: '无效的当前状态' }
  }
  if (!allowed.includes(newStatus)) {
    return { valid: false, message: `状态流转错误：${currentStatus} 不能直接转换为 ${newStatus}，允许的流转：${allowed.join(', ')}` }
  }
  return { valid: true }
}

export const db = {
  prepare: (query: string) => ({
    all: (...params: any[]) => {
      return executeQuery(query, params, true)
    },
    get: (...params: any[]) => {
      return executeQuery(query, params, false)
    },
    run: (...params: any[]) => {
      executeQuery(query, params, false)
    },
    exec: (sql: string) => {
      // For CREATE TABLE and DELETE operations
    }
  })
}

function executeQuery(query: string, params: any[], returnAll: boolean): any {
  if (query.startsWith('SELECT * FROM orders')) {
    let result = [...orders]
    if (query.includes('WHERE status = ?')) {
      result = result.filter(o => o.status === params[0])
    } else if (query.includes('WHERE customer_name LIKE')) {
      const search = params[0].replace(/%/g, '')
      result = result.filter(o => 
        o.customer_name.includes(search) || 
        o.phone.includes(search) || 
        o.device_model.includes(search)
      )
    } else if (query.includes('WHERE id = ?')) {
      result = result.filter(o => o.id === params[0])
    }
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return returnAll ? result : result[0]
  }
  
  if (query.startsWith('SELECT * FROM notes')) {
    const orderId = params[0]
    let result = notes.filter(n => n.order_id === orderId)
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return returnAll ? result : result[0]
  }
  
  if (query.startsWith('SELECT * FROM inspections')) {
    const orderId = params[0]
    const result = inspections.filter(i => i.order_id === orderId)
    return returnAll ? result : result[0]
  }
  
  if (query.startsWith('SELECT * FROM warranties')) {
    const orderId = params[0]
    const result = warranties.filter(w => w.order_id === orderId)
    return returnAll ? result : result[0]
  }
  
  if (query.startsWith('SELECT * FROM inspection_photos')) {
    const orderId = params[0]
    const result = inspectionPhotos.filter(p => p.order_id === orderId)
    return returnAll ? result : result[0]
  }
  
  if (query.startsWith('SELECT * FROM spare_parts')) {
    let result = [...spareParts]
    result.sort((a, b) => a.name.localeCompare(b.name))
    return returnAll ? result : result[0]
  }
  
  if (query.startsWith('SELECT * FROM spare_part_usages')) {
    const orderId = params[0]
    let result = sparePartUsages.filter(u => u.order_id === orderId)
    result.sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime())
    return returnAll ? result : result[0]
  }
  
  if (query.startsWith('INSERT INTO orders')) {
    orders.push({
      id: params[0],
      customer_name: params[1],
      phone: params[2],
      device_model: params[3],
      serial_number: params[4] || null,
      issue_description: params[5],
      status: params[6],
      created_by: params[7],
      created_at: params[8],
      updated_at: params[9]
    })
  }
  
  if (query.startsWith('UPDATE orders SET status')) {
    const order = orders.find(o => o.id === params[2])
    if (order) {
      const validation = validateStatusTransition(order.status, params[0])
      if (!validation.valid) {
        throw new Error(validation.message)
      }
      orders = orders.map(o => 
        o.id === params[2] ? { ...o, status: params[0], updated_at: params[1] } : o
      )
    }
  }
  
  if (query.startsWith('DELETE FROM orders')) {
    const orderId = params[0]
    orders = orders.filter(o => o.id !== orderId)
    notes = notes.filter(n => n.order_id !== orderId)
    inspections = inspections.filter(i => i.order_id !== orderId)
    warranties = warranties.filter(w => w.order_id !== orderId)
    inspectionPhotos = inspectionPhotos.filter(p => p.order_id !== orderId)
    sparePartUsages = sparePartUsages.filter(u => u.order_id !== orderId)
  }
  
  if (query.startsWith('INSERT INTO inspections')) {
    const existingIndex = inspections.findIndex(i => i.order_id === params[1])
    if (existingIndex !== -1) {
      inspections[existingIndex] = {
        id: inspections[existingIndex].id,
        order_id: params[1],
        technician_id: params[2],
        technician_name: params[3],
        appearance_condition: params[4],
        screen_condition: params[5],
        battery_condition: params[6],
        accessories: params[7] || null,
        description: params[8],
        status: params[9],
        created_at: params[10]
      }
    } else {
      inspections.push({
        id: params[0],
        order_id: params[1],
        technician_id: params[2],
        technician_name: params[3],
        appearance_condition: params[4],
        screen_condition: params[5],
        battery_condition: params[6],
        accessories: params[7] || null,
        description: params[8],
        status: params[9],
        created_at: params[10]
      })
    }
  }
  
  if (query.startsWith('UPDATE inspections')) {
    const index = inspections.findIndex(i => i.order_id === params[9])
    if (index !== -1) {
      inspections[index] = {
        ...inspections[index],
        technician_id: params[0],
        technician_name: params[1],
        appearance_condition: params[2],
        screen_condition: params[3],
        battery_condition: params[4],
        accessories: params[5] || null,
        description: params[6],
        status: params[7],
        created_at: params[8]
      }
    }
  }
  
  if (query.startsWith('INSERT INTO warranties')) {
    const existingIndex = warranties.findIndex(w => w.order_id === params[1])
    if (existingIndex !== -1) {
      warranties[existingIndex] = {
        ...warranties[existingIndex],
        manager_id: params[2],
        manager_name: params[3],
        warranty_type: params[4],
        warranty_period: params[5],
        responsibility: params[6],
        approved: params[7],
        approved_at: params[8] || null
      }
    } else {
      warranties.push({
        id: params[0],
        order_id: params[1],
        manager_id: params[2],
        manager_name: params[3],
        warranty_type: params[4],
        warranty_period: params[5],
        responsibility: params[6],
        approved: params[7],
        approved_at: params[8] || null,
        created_at: params[9]
      })
    }
  }
  
  if (query.startsWith('INSERT INTO notes')) {
    const newNote = {
      id: params[0],
      order_id: params[1],
      user_id: params[2],
      user_name: params[3],
      content: params[4],
      created_at: params[5]
    }
    notes.push(newNote)
    return newNote
  }
  
  if (query.startsWith('INSERT INTO spare_parts')) {
    const newPart = {
      id: params[0],
      name: params[1],
      sku: params[2],
      quantity: params[3],
      location: params[4] || null,
      created_at: params[5],
      updated_at: params[6]
    }
    spareParts.push(newPart)
    return newPart
  }
  
  if (query.startsWith('UPDATE spare_parts')) {
    const index = spareParts.findIndex(s => s.id === params[5])
    if (index !== -1) {
      spareParts[index] = {
        ...spareParts[index],
        name: params[0],
        sku: params[1],
        quantity: params[2],
        location: params[3] || null,
        updated_at: params[4]
      }
    }
  }
  
  if (query.startsWith('DELETE FROM spare_parts')) {
    spareParts = spareParts.filter(s => s.id !== params[0])
    sparePartUsages = sparePartUsages.filter(u => u.spare_part_id !== params[0])
  }
  
  if (query.startsWith('INSERT INTO spare_part_usages')) {
    const part = spareParts.find(p => p.id === params[2])
    if (!part) {
      throw new Error('备件不存在')
    }
    if (part.quantity < params[4]) {
      throw new Error(`库存不足：${part.name} 当前库存 ${part.quantity}，需要 ${params[4]}`)
    }
    
    spareParts = spareParts.map(p => 
      p.id === params[2] ? { ...p, quantity: p.quantity - params[4] } : p
    )
    
    const usage = {
      id: params[0],
      order_id: params[1],
      spare_part_id: params[2],
      spare_part_name: part.name,
      spare_part_sku: part.sku,
      quantity: params[4],
      used_by: params[5],
      used_by_name: params[6],
      used_at: params[7]
    }
    sparePartUsages.push(usage)
    return usage
  }
  
  if (query.startsWith('INSERT INTO inspection_photos')) {
    const photo = {
      id: params[0],
      order_id: params[1],
      file_path: params[2],
      description: params[3] || null,
      created_at: params[4]
    }
    inspectionPhotos.push(photo)
    return photo
  }
  
  if (query.startsWith('DELETE FROM inspection_photos')) {
    inspectionPhotos = inspectionPhotos.filter(p => p.order_id === params[0])
  }
  
  return null
}

export const getOrderById = (id: string): OrderData | undefined => {
  return orders.find(o => o.id === id)
}

export const getSparePartById = (id: string): SparePartData | undefined => {
  return spareParts.find(p => p.id === id)
}

export const initDatabase = () => {
  console.log('Tables created successfully')
}

export const insertSampleData = (): Promise<void> => {
  return new Promise((resolve) => {
    orders = []
    inspections = []
    warranties = []
    notes = []
    inspectionPhotos = []
    spareParts = []
    sparePartUsages = []

    orders = [
      { id: 'ORD-001', customer_name: '张三', phone: '13800138001', device_model: 'iPhone 15 Pro', serial_number: 'F19P2X3Q4R5S', issue_description: '屏幕出现竖线，触控不灵敏', status: 'completed', created_by: '前台-王芳', created_at: '2026-01-10 09:30:00', updated_at: '2026-01-12 16:00:00' },
      { id: 'ORD-002', customer_name: '李四', phone: '13900139002', device_model: '华为 Mate60 Pro', serial_number: 'HW20260105002', issue_description: '电池鼓包，续航严重下降', status: 'warranty_pending', created_by: '前台-王芳', created_at: '2026-01-12 10:15:00', updated_at: '2026-01-12 15:30:00' },
      { id: 'ORD-003', customer_name: '王五', phone: '13700137003', device_model: '小米14 Ultra', serial_number: 'MI20260108003', issue_description: '后置摄像头无法对焦', status: 'inspection_pending', created_by: '前台-李明', created_at: '2026-01-13 08:45:00', updated_at: '2026-01-13 08:45:00' },
      { id: 'ORD-004', customer_name: '赵六', phone: '13600136004', device_model: 'OPPO Find X7', serial_number: 'OP20260110004', issue_description: '充电接口松动，无法快充', status: 'repairing', created_by: '前台-李明', created_at: '2026-01-14 11:00:00', updated_at: '2026-01-14 14:00:00' },
      { id: 'ORD-005', customer_name: '钱七', phone: '13500135005', device_model: 'vivo X100 Pro', serial_number: 'VV20260111005', issue_description: '扬声器有杂音，通话声音小', status: 'pending', created_by: '前台-王芳', created_at: '2026-01-15 09:00:00', updated_at: '2026-01-15 09:00:00' }
    ]

    inspections = [
      { id: 'INS-001', order_id: 'ORD-001', technician_id: 'tech-001', technician_name: '维修师-刘强', appearance_condition: '良好', screen_condition: '有竖线', battery_condition: '正常', accessories: '原装充电器、数据线', description: '屏幕显示异常，触控IC故障，需要更换屏幕总成', status: 'approved', created_at: '2026-01-10 10:30:00' },
      { id: 'INS-002', order_id: 'ORD-002', technician_id: 'tech-002', technician_name: '维修师-陈刚', appearance_condition: '轻微划痕', screen_condition: '正常', battery_condition: '鼓包严重', accessories: '无配件', description: '电池严重鼓包，存在安全隐患，需要立即更换电池', status: 'approved', created_at: '2026-01-12 14:00:00' },
      { id: 'INS-003', order_id: 'ORD-004', technician_id: 'tech-001', technician_name: '维修师-刘强', appearance_condition: '良好', screen_condition: '正常', battery_condition: '正常', accessories: '原装充电器', description: '充电接口针脚氧化，需要更换充电口', status: 'approved', created_at: '2026-01-14 13:00:00' }
    ]

    warranties = [
      { id: 'WAR-001', order_id: 'ORD-001', manager_id: 'mgr-001', manager_name: '店长-张伟', warranty_type: '厂家保修', warranty_period: 90, responsibility: '厂家负责', approved: 1, approved_at: '2026-01-10 11:00:00', created_at: '2026-01-10 10:45:00' },
      { id: 'WAR-002', order_id: 'ORD-004', manager_id: 'mgr-001', manager_name: '店长-张伟', warranty_type: '店铺保修', warranty_period: 30, responsibility: '店铺负责', approved: 1, approved_at: '2026-01-14 13:30:00', created_at: '2026-01-14 13:20:00' }
    ]

    notes = [
      { id: 'NT-001', order_id: 'ORD-001', user_id: 'front-001', user_name: '前台-王芳', content: '客户描述屏幕在使用中突然出现竖线', created_at: '2026-01-10 09:35:00' },
      { id: 'NT-002', order_id: 'ORD-001', user_id: 'front-001', user_name: '前台-王芳', content: '维修师刘强已接单', created_at: '2026-01-10 09:40:00' },
      { id: 'NT-003', order_id: 'ORD-001', user_id: 'tech-001', user_name: '维修师-刘强', content: '【系统自动】提交质检报告：外观良好，屏幕有竖线，电池正常', created_at: '2026-01-10 10:30:00' },
      { id: 'NT-004', order_id: 'ORD-001', user_id: 'mgr-001', user_name: '店长-张伟', content: '【系统自动】确认售后保修：厂家保修，90天，厂家负责', created_at: '2026-01-10 11:00:00' },
      { id: 'NT-005', order_id: 'ORD-001', user_id: 'tech-001', user_name: '维修师-刘强', content: '领用备件：iPhone 15 Pro 屏幕总成 x1', created_at: '2026-01-11 10:00:00' },
      { id: 'NT-006', order_id: 'ORD-001', user_id: 'tech-001', user_name: '维修师-刘强', content: '屏幕更换完成，测试正常', created_at: '2026-01-12 15:30:00' },
      { id: 'NT-007', order_id: 'ORD-001', user_id: 'front-001', user_name: '前台-王芳', content: '已通知客户取机', created_at: '2026-01-12 16:00:00' },
      { id: 'NT-008', order_id: 'ORD-002', user_id: 'front-001', user_name: '前台-王芳', content: '客户反映电池使用不到半天就没电', created_at: '2026-01-12 10:20:00' },
      { id: 'NT-009', order_id: 'ORD-002', user_id: 'front-001', user_name: '前台-王芳', content: '维修师陈刚已接单', created_at: '2026-01-12 10:30:00' },
      { id: 'NT-010', order_id: 'ORD-002', user_id: 'tech-002', user_name: '维修师-陈刚', content: '【系统自动】提交质检报告：外观轻微划痕，屏幕正常，电池鼓包严重', created_at: '2026-01-12 14:00:00' },
      { id: 'NT-011', order_id: 'ORD-003', user_id: 'front-002', user_name: '前台-李明', content: '客户刚买的新机，摄像头有问题', created_at: '2026-01-13 08:50:00' },
      { id: 'NT-012', order_id: 'ORD-003', user_id: 'front-002', user_name: '前台-李明', content: '维修师刘强已接单', created_at: '2026-01-13 09:00:00' },
      { id: 'NT-013', order_id: 'ORD-004', user_id: 'tech-001', user_name: '维修师-刘强', content: '【系统自动】提交质检报告：外观良好，屏幕正常，电池正常', created_at: '2026-01-14 13:00:00' },
      { id: 'NT-014', order_id: 'ORD-004', user_id: 'mgr-001', user_name: '店长-张伟', content: '【系统自动】确认售后保修：店铺保修，30天，店铺负责', created_at: '2026-01-14 13:30:00' },
      { id: 'NT-015', order_id: 'ORD-004', user_id: 'tech-001', user_name: '维修师-刘强', content: '领用备件：充电接口-通用 x1', created_at: '2026-01-14 14:00:00' },
      { id: 'NT-016', order_id: 'ORD-004', user_id: 'tech-001', user_name: '维修师-刘强', content: '正在更换充电接口，预计半小时完成', created_at: '2026-01-14 14:15:00' },
      { id: 'NT-017', order_id: 'ORD-005', user_id: 'front-001', user_name: '前台-王芳', content: '等待维修师接单', created_at: '2026-01-15 09:05:00' }
    ]

    inspectionPhotos = [
      { id: 'PH-001', order_id: 'ORD-001', file_path: '/uploads/ORD-001-1.jpg', description: '屏幕竖线问题', created_at: '2026-01-10 10:20:00' },
      { id: 'PH-002', order_id: 'ORD-001', file_path: '/uploads/ORD-001-2.jpg', description: '设备外观', created_at: '2026-01-10 10:22:00' },
      { id: 'PH-003', order_id: 'ORD-002', file_path: '/uploads/ORD-002-1.jpg', description: '电池鼓包', created_at: '2026-01-12 13:50:00' },
      { id: 'PH-004', order_id: 'ORD-004', file_path: '/uploads/ORD-004-1.jpg', description: '充电接口', created_at: '2026-01-14 12:50:00' }
    ]

    spareParts = [
      { id: 'SP-001', name: 'iPhone 15 Pro 屏幕总成', sku: 'IP15-PRO-SCREEN', quantity: 9, location: 'A区-01', created_at: '2026-01-01 00:00:00', updated_at: '2026-01-11 10:00:00' },
      { id: 'SP-002', name: '华为 Mate60 Pro 电池', sku: 'HW-MATE60-BATT', quantity: 8, location: 'A区-02', created_at: '2026-01-01 00:00:00', updated_at: '2026-01-12 16:00:00' },
      { id: 'SP-003', name: '充电接口-通用', sku: 'USB-C-PORT', quantity: 49, location: 'B区-01', created_at: '2026-01-01 00:00:00', updated_at: '2026-01-14 14:00:00' },
      { id: 'SP-004', name: '小米14 Ultra 摄像头模组', sku: 'MI14-ULTRA-CAM', quantity: 5, location: 'A区-03', created_at: '2026-01-05 00:00:00', updated_at: '2026-01-05 00:00:00' },
      { id: 'SP-005', name: 'vivo X100 Pro 扬声器', sku: 'VIVOX100-SPK', quantity: 12, location: 'B区-02', created_at: '2026-01-01 00:00:00', updated_at: '2026-01-01 00:00:00' }
    ]

    sparePartUsages = [
      { id: 'SU-001', order_id: 'ORD-001', spare_part_id: 'SP-001', spare_part_name: 'iPhone 15 Pro 屏幕总成', spare_part_sku: 'IP15-PRO-SCREEN', quantity: 1, used_by: 'tech-001', used_by_name: '维修师-刘强', used_at: '2026-01-11 10:00:00' },
      { id: 'SU-002', order_id: 'ORD-004', spare_part_id: 'SP-003', spare_part_name: '充电接口-通用', spare_part_sku: 'USB-C-PORT', quantity: 1, used_by: 'tech-001', used_by_name: '维修师-刘强', used_at: '2026-01-14 14:00:00' }
    ]

    console.log('Sample data inserted')
    resolve()
  })
}