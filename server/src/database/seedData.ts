import { db } from './db'

export const seedData = () => {
  db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        console.error('查询用户表失败:', err.message)
        return
      }
      if (row && row.count === 0) {
        const users = [
          { id: 'U001', name: '李经理', role: 'manager', phone: '138****0001' },
          { id: 'U002', name: '王经理', role: 'manager', phone: '138****0002' },
          { id: 'U003', name: '张经理', role: 'manager', phone: '138****0003' },
          { id: 'U004', name: '陈吧台', role: 'bartender', phone: '138****0004' },
          { id: 'U005', name: '刘客服', role: 'customer_service', phone: '138****0005' }
        ]

        const userStmt = db.prepare('INSERT INTO users (id, name, role, phone) VALUES (?, ?, ?, ?)')
        users.forEach(user => {
          userStmt.run(user.id, user.name, user.role, user.phone)
        })
        userStmt.finalize()
        console.log('用户数据已初始化')
      }
    })

    db.get('SELECT COUNT(*) as count FROM tables', (err, row) => {
      if (err) {
        console.error('查询桌台表失败:', err.message)
        return
      }
      if (row && row.count === 0) {
        const tables = [
          { id: 'T001', number: 'A01', area: 'A区', capacity: 4, status: 'occupied' },
          { id: 'T002', number: 'A02', area: 'A区', capacity: 6, status: 'occupied' },
          { id: 'T003', number: 'A08', area: 'A区', capacity: 8, status: 'available' },
          { id: 'T004', number: 'B05', area: 'B区', capacity: 4, status: 'occupied' },
          { id: 'T005', number: 'B12', area: 'B区', capacity: 10, status: 'available' },
          { id: 'T006', number: 'C03', area: 'C区', capacity: 6, status: 'occupied' },
          { id: 'T007', number: 'D01', area: 'D区', capacity: 12, status: 'occupied' }
        ]

        const tableStmt = db.prepare('INSERT INTO tables (id, number, area, capacity, status) VALUES (?, ?, ?, ?, ?)')
        tables.forEach(table => {
          tableStmt.run(table.id, table.number, table.area, table.capacity, table.status)
        })
        tableStmt.finalize()
        console.log('桌台数据已初始化')
      }
    })

    db.get('SELECT COUNT(*) as count FROM complaints', (err, row) => {
      if (err) {
        console.error('查询投诉表失败:', err.message)
        return
      }
      if (row && row.count === 0) {
        const complaints = [
          {
            id: 'C001',
            tableNumber: 'A01',
            customerName: '张先生',
            customerPhone: '138****1234',
            complaintType: 'duplicate_booking',
            complaintReason: '同一桌位被重复预订，导致客人到店后无法入座',
            status: 'pending',
            createdAt: '2024-01-15 20:30:00',
            updatedAt: '2024-01-15 20:30:00',
            managerName: '李经理',
            tableArea: 'A区'
          },
          {
            id: 'C002',
            tableNumber: 'B05',
            customerName: '王女士',
            customerPhone: '139****5678',
            complaintType: 'schedule_change',
            complaintReason: '驻唱临时改期，客人表示不满',
            status: 'compensated',
            createdAt: '2024-01-15 21:15:00',
            updatedAt: '2024-01-15 21:45:00',
            managerName: '李经理',
            tableArea: 'B区'
          },
          {
            id: 'C003',
            tableNumber: 'C03',
            customerName: '刘先生',
            customerPhone: '137****9012',
            complaintType: 'storage_dispute',
            complaintReason: '寄存酒水数量与记录不符，客人声称少了2瓶',
            status: 'followup',
            createdAt: '2024-01-15 19:45:00',
            updatedAt: '2024-01-15 22:00:00',
            managerName: '王经理',
            tableArea: 'C区'
          },
          {
            id: 'C004',
            tableNumber: 'A08',
            customerName: '赵女士',
            customerPhone: '136****3456',
            complaintType: 'over_limit',
            complaintReason: '赠饮超出权限，当班经理赠送过多酒水',
            status: 'compensated',
            createdAt: '2024-01-15 22:30:00',
            updatedAt: '2024-01-15 22:50:00',
            managerName: '张经理',
            tableArea: 'A区'
          },
          {
            id: 'C005',
            tableNumber: 'B12',
            customerName: '孙先生',
            customerPhone: '135****7890',
            complaintType: 'duplicate_booking',
            complaintReason: '线上线下同时预订同一桌位',
            status: 'resolved',
            createdAt: '2024-01-14 21:00:00',
            updatedAt: '2024-01-14 23:00:00',
            managerName: '李经理',
            tableArea: 'B区'
          },
          {
            id: 'C006',
            tableNumber: 'D01',
            customerName: '周女士',
            customerPhone: '134****2345',
            complaintType: 'schedule_change',
            complaintReason: '原定DJ表演取消，未提前通知',
            status: 'followup',
            createdAt: '2024-01-15 23:00:00',
            updatedAt: '2024-01-15 23:20:00',
            managerName: '王经理',
            tableArea: 'D区'
          }
        ]

        const complaintStmt = db.prepare(`
          INSERT INTO complaints (id, tableNumber, customerName, customerPhone, complaintType, complaintReason, status, createdAt, updatedAt, managerName, tableArea)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        complaints.forEach(complaint => {
          complaintStmt.run(
            complaint.id,
            complaint.tableNumber,
            complaint.customerName,
            complaint.customerPhone,
            complaint.complaintType,
            complaint.complaintReason,
            complaint.status,
            complaint.createdAt,
            complaint.updatedAt,
            complaint.managerName,
            complaint.tableArea
          )
        })
        complaintStmt.finalize()
        console.log('投诉数据已初始化')
      }
    })

    db.get('SELECT COUNT(*) as count FROM compensations', (err, row) => {
      if (err) {
        console.error('查询核销表失败:', err.message)
        return
      }
      if (row && row.count === 0) {
        const compensations = [
          {
            id: 'K001',
            complaintId: 'C002',
            type: 'drinks',
            amount: 3,
            description: '赠送鸡尾酒3杯',
            authorizedBy: '李经理',
            authorizedAt: '2024-01-15 21:45:00',
            verifiedBy: '陈吧台',
            verifiedAt: '2024-01-15 21:50:00',
            isAbnormal: false
          },
          {
            id: 'K002',
            complaintId: 'C003',
            type: 'drinks',
            amount: 2,
            description: '补送威士忌2瓶',
            authorizedBy: '王经理',
            authorizedAt: '2024-01-15 22:00:00',
            verifiedBy: '陈吧台',
            verifiedAt: '2024-01-15 22:05:00',
            isAbnormal: false
          },
          {
            id: 'K003',
            complaintId: 'C004',
            type: 'drinks',
            amount: 10,
            description: '赠送酒水10杯（超出权限）',
            authorizedBy: '张经理',
            authorizedAt: '2024-01-15 22:50:00',
            verifiedBy: '陈吧台',
            verifiedAt: '2024-01-15 22:55:00',
            isAbnormal: true,
            abnormalReason: '单次赠饮超过5杯上限'
          },
          {
            id: 'K004',
            complaintId: 'C005',
            type: 'discount',
            amount: 50,
            description: '给予50元折扣',
            authorizedBy: '李经理',
            authorizedAt: '2024-01-14 21:30:00',
            verifiedBy: '陈吧台',
            verifiedAt: '2024-01-14 21:35:00',
            isAbnormal: false
          },
          {
            id: 'K005',
            complaintId: 'C006',
            type: 'free_entry',
            amount: 4,
            description: '赠送4人次免费入场券',
            authorizedBy: '王经理',
            authorizedAt: '2024-01-15 23:20:00',
            isAbnormal: false
          }
        ]

        const compensationStmt = db.prepare(`
          INSERT INTO compensations (id, complaintId, type, amount, description, authorizedBy, authorizedAt, verifiedBy, verifiedAt, isAbnormal, abnormalReason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        compensations.forEach(compensation => {
          compensationStmt.run(
            compensation.id,
            compensation.complaintId,
            compensation.type,
            compensation.amount,
            compensation.description,
            compensation.authorizedBy,
            compensation.authorizedAt,
            compensation.verifiedBy || null,
            compensation.verifiedAt || null,
            compensation.isAbnormal ? 1 : 0,
            compensation.abnormalReason || null
          )
        })
        compensationStmt.finalize()
        console.log('核销数据已初始化')
      }
    })
  })
}