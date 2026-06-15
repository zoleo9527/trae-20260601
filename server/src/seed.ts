import { initDb } from './db.js';
import Database from 'better-sqlite3';

const db = initDb() as Database.Database;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function seed() {
  console.log('Seeding database...');

  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO sales_orders (id, order_no, customer_name, customer_phone, address, total_amount, status, created_at, delivered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT OR IGNORE INTO order_items (id, order_id, product_name, product_code, quantity, unit_price, unit, warehouse_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLocation = db.prepare(`
    INSERT OR IGNORE INTO warehouse_locations (id, location_code, location_name, area, capacity, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertReceipt = db.prepare(`
    INSERT OR IGNORE INTO delivery_receipts (id, order_id, receipt_no, driver_name, driver_phone, vehicle_no, delivery_date, status, signer_name, sign_time, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRequest = db.prepare(`
    INSERT OR IGNORE INTO return_exchange_requests (id, request_no, order_id, type, status, reason, reason_category, applicant, applicant_role, warehouse_confirmer, warehouse_confirm_time, reissue_handler, reissue_handle_time, completer, complete_time, created_at, updated_at, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReturnItem = db.prepare(`
    INSERT OR IGNORE INTO return_items (id, request_id, product_name, product_code, quantity, unit, warehouse_location, actual_quantity, inspection_result, inspection_remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReissue = db.prepare(`
    INSERT OR IGNORE INTO reissue_tracking (id, request_id, tracking_no, status, handler, handler_role, warehouse_location, driver_name, vehicle_no, estimated_delivery_date, actual_delivery_date, signer_name, sign_time, created_at, updated_at, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReissueItem = db.prepare(`
    INSERT OR IGNORE INTO reissue_items (id, reissue_id, product_name, product_code, quantity, unit, warehouse_location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLog = db.prepare(`
    INSERT OR IGNORE INTO operation_logs (id, request_id, reissue_id, action, operator, operator_role, detail, old_status, new_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAttachment = db.prepare(`
    INSERT OR IGNORE INTO attachments (id, request_id, reissue_id, file_name, file_type, file_size, file_path, placeholder, uploaded_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const locations = [
    { id: generateId(), code: 'A-01-01', name: 'A区1排1位', area: 'A区', capacity: 500 },
    { id: generateId(), code: 'A-01-02', name: 'A区1排2位', area: 'A区', capacity: 500 },
    { id: generateId(), code: 'A-02-01', name: 'A区2排1位', area: 'A区', capacity: 300 },
    { id: generateId(), code: 'B-01-01', name: 'B区1排1位', area: 'B区', capacity: 800 },
    { id: generateId(), code: 'B-01-02', name: 'B区1排2位', area: 'B区', capacity: 800 },
    { id: generateId(), code: 'C-01-01', name: 'C区1排1位', area: 'C区', capacity: 200 },
  ];

  for (const loc of locations) {
    insertLocation.run(loc.id, loc.code, loc.name, loc.area, loc.capacity, 'active');
  }

  const orders = [
    {
      id: generateId(),
      order_no: 'SO20260601001',
      customer_name: '恒大建筑工程有限公司',
      customer_phone: '13800138001',
      address: '上海市浦东新区张江高科技园区博云路2号',
      total_amount: 125800,
      items: [
        { name: '32.5级复合硅酸盐水泥', code: 'PC-32.5', qty: 200, price: 420, unit: '袋', location: 'A-01-01' },
        { name: 'HRB400E螺纹钢Φ16mm', code: 'REBAR-16', qty: 50, price: 3800, unit: '吨', location: 'B-01-01' },
        { name: '中粗砂', code: 'SAND-M', qty: 80, price: 120, unit: '方', location: 'C-01-01' },
      ],
      delivered_at: '2026-06-02 14:30:00',
    },
    {
      id: generateId(),
      order_no: 'SO20260605002',
      customer_name: '绿地建设集团',
      customer_phone: '13900139002',
      address: '上海市徐汇区虹梅路1801号',
      total_amount: 89600,
      items: [
        { name: '42.5级普通硅酸盐水泥', code: 'PO-42.5', qty: 150, price: 520, unit: '袋', location: 'A-01-02' },
        { name: 'HRB400E螺纹钢Φ20mm', code: 'REBAR-20', qty: 20, price: 3900, unit: '吨', location: 'B-01-02' },
      ],
      delivered_at: '2026-06-06 10:15:00',
    },
    {
      id: generateId(),
      order_no: 'SO20260610003',
      customer_name: '中建八局第三建设有限公司',
      customer_phone: '13700137003',
      address: '上海市杨浦区四平路1239号',
      total_amount: 256000,
      items: [
        { name: '32.5级复合硅酸盐水泥', code: 'PC-32.5', qty: 300, price: 420, unit: '袋', location: 'A-01-01' },
        { name: '42.5级普通硅酸盐水泥', code: 'PO-42.5', qty: 200, price: 520, unit: '袋', location: 'A-01-02' },
        { name: 'HRB400E螺纹钢Φ25mm', code: 'REBAR-25', qty: 40, price: 4000, unit: '吨', location: 'B-01-01' },
        { name: '粉煤灰砖', code: 'BRICK-FLY', qty: 5000, price: 0.8, unit: '块', location: 'C-01-01' },
      ],
      delivered_at: '2026-06-11 16:45:00',
    },
    {
      id: generateId(),
      order_no: 'SO20260612004',
      customer_name: '上海建工五建集团',
      customer_phone: '13600136004',
      address: '上海市静安区共和新路1301号',
      total_amount: 67200,
      items: [
        { name: '32.5级复合硅酸盐水泥', code: 'PC-32.5', qty: 100, price: 420, unit: '袋', location: 'A-01-01' },
        { name: '中粗砂', code: 'SAND-M', qty: 120, price: 120, unit: '方', location: 'C-01-01' },
        { name: '碎石5-25mm', code: 'GRAVEL-25', qty: 150, price: 90, unit: '方', location: 'C-01-01' },
      ],
      delivered_at: '2026-06-13 09:20:00',
    },
  ];

  const receipts = [
    { receipt_no: 'DR20260602001', driver: '张建国', phone: '13811112222', vehicle: '沪A·D8526', date: '2026-06-02', signer: '李经理' },
    { receipt_no: 'DR20260606001', driver: '王卫东', phone: '13822223333', vehicle: '沪B·F3891', date: '2026-06-06', signer: '陈主任' },
    { receipt_no: 'DR20260611001', driver: '张建国', phone: '13811112222', vehicle: '沪A·D8526', date: '2026-06-11', signer: '刘工' },
    { receipt_no: 'DR20260613001', driver: '李明辉', phone: '13833334444', vehicle: '沪C·G7215', date: '2026-06-13', signer: '赵总' },
  ];

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    insertOrder.run(
      order.id, order.order_no, order.customer_name, order.customer_phone,
      order.address, order.total_amount, 'delivered',
      `2026-0${i + 1}-0${i + 1} 10:00:00`, order.delivered_at
    );

    for (const item of order.items) {
      insertOrderItem.run(
        generateId(), order.id, item.name, item.code, item.qty, item.price, item.unit, item.location
      );
    }

    const receipt = receipts[i];
    insertReceipt.run(
      generateId(), order.id, receipt.receipt_no, receipt.driver, receipt.phone,
      receipt.vehicle, receipt.date, 'delivered', receipt.signer,
      order.delivered_at, '正常签收'
    );
  }

  const requests = [
    {
      id: generateId(),
      request_no: 'RE20260603001',
      order_id: orders[0].id,
      type: 'exchange',
      status: 'completed',
      reason: '部分水泥包装袋破损，需要更换',
      reason_category: '包装破损',
      applicant: '陈客服',
      applicant_role: 'customer_service',
      warehouse_confirmer: '王主管',
      warehouse_confirm_time: '2026-06-03 14:20:00',
      reissue_handler: '李仓管',
      reissue_handle_time: '2026-06-03 15:30:00',
      completer: '陈客服',
      complete_time: '2026-06-04 11:00:00',
      created_at: '2026-06-03 10:15:00',
      updated_at: '2026-06-04 11:00:00',
      remarks: '客户要求次日送达',
      returnItems: [
        { name: '32.5级复合硅酸盐水泥', code: 'PC-32.5', qty: 10, unit: '袋', location: 'A-01-01', actualQty: 10, result: '包装破损' },
      ],
      reissue: {
        tracking_no: 'BH20260603001',
        status: 'delivered',
        handler: '李仓管',
        handler_role: 'warehouse_manager',
        location: 'A-01-01',
        driver: '张建国',
        vehicle: '沪A·D8526',
        estDate: '2026-06-04',
        actDate: '2026-06-04',
        signer: '李经理',
        signTime: '2026-06-04 10:30:00',
        items: [
          { name: '32.5级复合硅酸盐水泥', code: 'PC-32.5', qty: 10, unit: '袋', location: 'A-01-01' },
        ],
      },
    },
    {
      id: generateId(),
      request_no: 'RE20260607002',
      order_id: orders[1].id,
      type: 'return',
      status: 'warehouse_confirmed',
      reason: '多发货，客户实际只需要10吨',
      reason_category: '数量差异',
      applicant: '林客服',
      applicant_role: 'customer_service',
      warehouse_confirmer: '王主管',
      warehouse_confirm_time: '2026-06-08 09:45:00',
      created_at: '2026-06-07 16:30:00',
      updated_at: '2026-06-08 09:45:00',
      remarks: '退货退款处理',
      returnItems: [
        { name: 'HRB400E螺纹钢Φ20mm', code: 'REBAR-20', qty: 10, unit: '吨', location: 'B-01-02', actualQty: 10, result: '完好，可二次销售' },
      ],
      reissue: null,
    },
    {
      id: generateId(),
      request_no: 'RE20260612003',
      order_id: orders[2].id,
      type: 'exchange',
      status: 'reissuing',
      reason: '水泥强度检测不达标，要求更换批次',
      reason_category: '质量问题',
      applicant: '黄客服',
      applicant_role: 'customer_service',
      warehouse_confirmer: '张主管',
      warehouse_confirm_time: '2026-06-12 11:30:00',
      reissue_handler: '赵仓管',
      reissue_handle_time: '2026-06-12 14:00:00',
      created_at: '2026-06-12 09:00:00',
      updated_at: '2026-06-12 14:00:00',
      remarks: '客户要求尽快补发，影响工期',
      returnItems: [
        { name: '42.5级普通硅酸盐水泥', code: 'PO-42.5', qty: 50, unit: '袋', location: 'A-01-02', actualQty: 50, result: '强度检测不合格' },
      ],
      reissue: {
        tracking_no: 'BH20260612001',
        status: 'out_for_delivery',
        handler: '赵仓管',
        handler_role: 'warehouse_manager',
        location: 'A-01-02',
        driver: '王卫东',
        vehicle: '沪B·F3891',
        estDate: '2026-06-13',
        items: [
          { name: '42.5级普通硅酸盐水泥', code: 'PO-42.5', qty: 50, unit: '袋', location: 'A-01-02' },
        ],
      },
    },
    {
      id: generateId(),
      request_no: 'RE20260614004',
      order_id: orders[3].id,
      type: 'exchange',
      status: 'pending_warehouse',
      reason: '砂的含泥量过高，不符合要求',
      reason_category: '质量问题',
      applicant: '周客服',
      applicant_role: 'customer_service',
      created_at: '2026-06-14 08:45:00',
      updated_at: '2026-06-14 08:45:00',
      remarks: '客户要求今天上门验货',
      returnItems: [
        { name: '中粗砂', code: 'SAND-M', qty: 30, unit: '方', location: 'C-01-01' },
      ],
      reissue: null,
    },
    {
      id: generateId(),
      request_no: 'RE20260614005',
      order_id: orders[0].id,
      type: 'return',
      status: 'draft',
      reason: '',
      reason_category: '',
      applicant: '吴客服',
      applicant_role: 'customer_service',
      created_at: '2026-06-14 15:20:00',
      updated_at: '2026-06-14 15:20:00',
      remarks: '草稿，尚未提交',
      returnItems: [
        { name: 'HRB400E螺纹钢Φ16mm', code: 'REBAR-16', qty: 5, unit: '吨', location: 'B-01-01' },
      ],
      reissue: null,
    },
  ];

  for (const req of requests) {
    insertRequest.run(
      req.id, req.request_no, req.order_id, req.type, req.status,
      req.reason, req.reason_category, req.applicant, req.applicant_role,
      req.warehouse_confirmer, req.warehouse_confirm_time,
      req.reissue_handler, req.reissue_handle_time,
      req.completer, req.complete_time,
      req.created_at, req.updated_at, req.remarks
    );

    for (const item of req.returnItems) {
      const returnItem = item as any;
      insertReturnItem.run(
        generateId(), req.id, returnItem.name, returnItem.code, returnItem.qty, returnItem.unit,
        returnItem.location, returnItem.actualQty ?? null, returnItem.result ?? null, null
      );
    }

    if (req.reissue) {
      const reissueId = generateId();
      const r = req.reissue;
      insertReissue.run(
        reissueId, req.id, r.tracking_no, r.status, r.handler, r.handler_role,
        r.location, r.driver, r.vehicle, r.estDate, r.actDate ?? null,
        r.signer ?? null, r.signTime ?? null,
        '2026-06-12 14:00:00', '2026-06-12 14:00:00', null
      );

      for (const item of r.items) {
        insertReissueItem.run(
          generateId(), reissueId, item.name, item.code, item.qty, item.unit, item.location
        );
      }

      insertLog.run(generateId(), req.id, reissueId, '创建补发单', r.handler, r.handler_role, '创建补发跟踪单', null, r.status, '2026-06-12 14:00:00');
    }

    if (req.status === 'completed') {
      insertLog.run(generateId(), req.id, null, '提交申请', req.applicant, req.applicant_role, '提交退换货申请', 'draft', 'pending_warehouse', req.created_at);
      insertLog.run(generateId(), req.id, null, '仓库确认', req.warehouse_confirmer!, 'warehouse_manager', '确认收到退货，验收完成', 'pending_warehouse', 'warehouse_confirmed', req.warehouse_confirm_time!);
      insertLog.run(generateId(), req.id, null, '安排补发', req.reissue_handler!, 'warehouse_manager', '已安排补发，等待配送', 'warehouse_confirmed', 'reissuing', req.reissue_handle_time!);
      insertLog.run(generateId(), req.id, null, '完成', req.completer!, req.applicant_role, '客户已签收，退换货完成', 'reissuing', 'completed', req.complete_time!);
    } else if (req.status === 'warehouse_confirmed') {
      insertLog.run(generateId(), req.id, null, '提交申请', req.applicant, req.applicant_role, '提交退换货申请', 'draft', 'pending_warehouse', req.created_at);
      insertLog.run(generateId(), req.id, null, '仓库确认', req.warehouse_confirmer!, 'warehouse_manager', '确认收到退货，验收完成', 'pending_warehouse', 'warehouse_confirmed', req.warehouse_confirm_time!);
    } else if (req.status === 'reissuing') {
      insertLog.run(generateId(), req.id, null, '提交申请', req.applicant, req.applicant_role, '提交退换货申请', 'draft', 'pending_warehouse', req.created_at);
      insertLog.run(generateId(), req.id, null, '仓库确认', req.warehouse_confirmer!, 'warehouse_manager', '确认收到退货，验收完成', 'pending_warehouse', 'warehouse_confirmed', req.warehouse_confirm_time!);
      insertLog.run(generateId(), req.id, null, '安排补发', req.reissue_handler!, 'warehouse_manager', '已安排补发，等待配送', 'warehouse_confirmed', 'reissuing', req.reissue_handle_time!);
    } else if (req.status === 'pending_warehouse') {
      insertLog.run(generateId(), req.id, null, '提交申请', req.applicant, req.applicant_role, '提交退换货申请，等待仓库确认', 'draft', 'pending_warehouse', req.created_at);
    }
  }

  const attachments = [
    { request_idx: 0, fileName: '水泥破损现场照片.jpg', fileType: 'image/jpeg', size: 2048000, placeholder: false },
    { request_idx: 0, fileName: '送货回单扫描件.pdf', fileType: 'application/pdf', size: 512000, placeholder: false },
    { request_idx: 2, fileName: '质量检测报告.pdf', fileType: 'application/pdf', size: 1024000, placeholder: false },
    { request_idx: 2, fileName: '现场照片1.jpg', fileType: 'image/jpeg', size: 3072000, placeholder: false },
    { request_idx: 2, fileName: '现场照片2.jpg', fileType: 'image/jpeg', size: 2816000, placeholder: false },
    { request_idx: 3, fileName: '客户投诉函.pdf', fileType: 'application/pdf', size: 256000, placeholder: true },
  ];

  for (const att of attachments) {
    insertAttachment.run(
      generateId(),
      requests[att.request_idx].id,
      null,
      att.fileName, att.fileType, att.size,
      att.placeholder ? null : `/uploads/${att.fileName}`,
      att.placeholder ? 1 : 0,
      '陈客服',
      '2026-06-03 10:20:00'
    );
  }

  console.log('Database seeded successfully');
  console.log('  - 仓库库位: 6个');
  console.log('  - 销售订单: 4个');
  console.log('  - 退换货申请: 5个');
  console.log('  - 补发跟踪: 3个');
  console.log('  - 附件记录: 6个');
}

seed();
