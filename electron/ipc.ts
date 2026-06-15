import { ipcMain, dialog, app } from 'electron';
import { getDb, getPhotosDir } from './database';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

function rowToEquipment(row: any): any {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    serialNumber: row.serial_number,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    remark: row.remark,
  };
}

function rowToContract(row: any, equipmentName?: string): any {
  return {
    id: row.id,
    contractNo: row.contract_no,
    equipmentId: row.equipment_id,
    equipmentName,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    rentStartDate: row.rent_start_date,
    plannedReturnDate: row.planned_return_date,
    dailyRate: row.daily_rate,
    monthlyRate: row.monthly_rate,
    deposit: row.deposit,
    contractManager: row.contract_manager,
    status: row.status,
    createdAt: row.created_at,
    remark: row.remark,
  };
}

function rowToReturnRecord(row: any, contractNo?: string, equipmentName?: string, customerName?: string): any {
  return {
    id: row.id,
    contractId: row.contract_id,
    contractNo,
    equipmentId: row.equipment_id,
    equipmentName,
    customerName,
    returnTime: row.return_time,
    actualReturnDate: row.actual_return_date,
    dispatcher: row.dispatcher,
    contractManager: row.contract_manager,
    endFuelLevel: row.end_fuel_level,
    fuelDifference: row.fuel_difference,
    fuelCostPerUnit: row.fuel_cost_per_unit,
    fuelCompensation: row.fuel_compensation,
    endWorkingHours: row.end_working_hours,
    workingHoursUsed: row.working_hours_used,
    workingHoursOverLimit: row.working_hours_over_limit,
    overHoursRate: row.over_hours_rate,
    overHoursCost: row.over_hours_cost,
    cleaningStatus: row.cleaning_status,
    cleaningCost: row.cleaning_cost,
    rentDays: row.rent_days,
    totalRent: row.total_rent,
    extraDays: row.extra_days,
    extraDaysCost: row.extra_days_cost,
    totalDamageDeductible: row.total_damage_deductible,
    totalDeductions: row.total_deductions,
    deposit: row.deposit,
    depositRefund: row.deposit_refund,
    additionalPayment: row.additional_payment,
    status: row.status,
    dispatchPhotoIds: row.dispatch_photo_ids ? JSON.parse(row.dispatch_photo_ids) : [],
    returnPhotoIds: row.return_photo_ids ? JSON.parse(row.return_photo_ids) : [],
    customerRemark: row.customer_remark,
    settlementRemark: row.settlement_remark,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    customerConfirmedAt: row.customer_confirmed_at,
  };
}

function rowToDamage(row: any): any {
  return {
    id: row.id,
    returnRecordId: row.return_record_id,
    category: row.category,
    description: row.description,
    severity: row.severity,
    needRepair: row.need_repair === 1,
    repairCost: row.repair_cost,
    deductible: row.deductible,
    repairer: row.repairer,
    photoIds: row.photo_ids ? JSON.parse(row.photo_ids) : [],
    remark: row.remark,
  };
}

function rowToPhoto(row: any): any {
  return {
    id: row.id,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    uploadTime: row.upload_time,
    type: row.type,
    relatedId: row.related_id,
    remark: row.remark,
  };
}

export function registerIpcHandlers() {
  const db = getDb();

  ipcMain.handle('stats:get', () => {
    const stats = {
      equipmentCount: (db.prepare('SELECT COUNT(*) as c FROM equipment').get() as any).c,
      contractCount: (db.prepare('SELECT COUNT(*) as c FROM contracts').get() as any).c,
      returnRecordCount: (db.prepare('SELECT COUNT(*) as c FROM return_records').get() as any).c,
      pendingCount: (db.prepare("SELECT COUNT(*) as c FROM return_records WHERE status IN ('pending', 'confirmed')").get() as any).c,
      totalRevenue: (db.prepare('SELECT COALESCE(SUM(total_rent + extra_days_cost + fuel_compensation + over_hours_cost + cleaning_cost), 0) as total FROM return_records').get() as any).total,
    };
    return stats;
  });

  ipcMain.handle('equipment:list', () => {
    const rows = db.prepare('SELECT * FROM equipment ORDER BY created_at DESC').all();
    return rows.map(rowToEquipment);
  });

  ipcMain.handle('equipment:get', (_e, id: number) => {
    const row = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
    return row ? rowToEquipment(row) : null;
  });

  ipcMain.handle('equipment:create', (_e, data: any) => {
    const stmt = db.prepare(`
      INSERT INTO equipment (name, model, serial_number, category, status, remark)
      VALUES (@name, @model, @serialNumber, @category, @status, @remark)
    `);
    const result = stmt.run({
      name: data.name,
      model: data.model,
      serialNumber: data.serialNumber,
      category: data.category,
      status: data.status || 'idle',
      remark: data.remark,
    });
    return result.lastInsertRowid;
  });

  ipcMain.handle('equipment:update', (_e, id: number, data: any) => {
    const stmt = db.prepare(`
      UPDATE equipment SET
        name = @name,
        model = @model,
        serial_number = @serialNumber,
        category = @category,
        status = @status,
        remark = @remark
      WHERE id = @id
    `);
    stmt.run({
      id,
      name: data.name,
      model: data.model,
      serialNumber: data.serialNumber,
      category: data.category,
      status: data.status,
      remark: data.remark,
    });
    return true;
  });

  ipcMain.handle('equipment:delete', (_e, id: number) => {
    db.prepare('DELETE FROM equipment WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('contract:list', (_e, filters?: any) => {
    let sql = `
      SELECT c.*, e.name as equipment_name
      FROM contracts c
      LEFT JOIN equipment e ON c.equipment_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.status) {
      sql += ' AND c.status = ?';
      params.push(filters.status);
    }
    if (filters?.search) {
      sql += ' AND (c.contract_no LIKE ? OR c.customer_name LIKE ? OR e.name LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY c.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map((r: any) => rowToContract(r, r.equipment_name));
  });

  ipcMain.handle('contract:get', (_e, id: number) => {
    const row = db.prepare(`
      SELECT c.*, e.name as equipment_name
      FROM contracts c
      LEFT JOIN equipment e ON c.equipment_id = e.id
      WHERE c.id = ?
    `).get(id) as any;
    return row ? rowToContract(row, row.equipment_name) : null;
  });

  ipcMain.handle('contract:create', (_e, data: any) => {
    const stmt = db.prepare(`
      INSERT INTO contracts (contract_no, equipment_id, customer_name, customer_phone,
        customer_address, rent_start_date, planned_return_date, daily_rate, monthly_rate,
        deposit, contract_manager, status, remark)
      VALUES (@contractNo, @equipmentId, @customerName, @customerPhone,
        @customerAddress, @rentStartDate, @plannedReturnDate, @dailyRate, @monthlyRate,
        @deposit, @contractManager, @status, @remark)
    `);
    const result = stmt.run({
      contractNo: data.contractNo,
      equipmentId: data.equipmentId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      rentStartDate: data.rentStartDate,
      plannedReturnDate: data.plannedReturnDate,
      dailyRate: data.dailyRate,
      monthlyRate: data.monthlyRate,
      deposit: data.deposit,
      contractManager: data.contractManager,
      status: data.status || 'active',
      remark: data.remark,
    });
    if (data.status === 'active') {
      db.prepare("UPDATE equipment SET status = 'rented' WHERE id = ?").run(data.equipmentId);
    }
    return result.lastInsertRowid;
  });

  ipcMain.handle('contract:update', (_e, id: number, data: any) => {
    const stmt = db.prepare(`
      UPDATE contracts SET
        contract_no = @contractNo,
        equipment_id = @equipmentId,
        customer_name = @customerName,
        customer_phone = @customerPhone,
        customer_address = @customerAddress,
        rent_start_date = @rentStartDate,
        planned_return_date = @plannedReturnDate,
        daily_rate = @dailyRate,
        monthly_rate = @monthlyRate,
        deposit = @deposit,
        contract_manager = @contractManager,
        status = @status,
        remark = @remark
      WHERE id = @id
    `);
    stmt.run({
      id,
      contractNo: data.contractNo,
      equipmentId: data.equipmentId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      rentStartDate: data.rentStartDate,
      plannedReturnDate: data.plannedReturnDate,
      dailyRate: data.dailyRate,
      monthlyRate: data.monthlyRate,
      deposit: data.deposit,
      contractManager: data.contractManager,
      status: data.status,
      remark: data.remark,
    });
    if (data.status === 'active') {
      db.prepare("UPDATE equipment SET status = 'rented' WHERE id = ?").run(data.equipmentId);
    } else if (data.status === 'completed') {
      db.prepare("UPDATE equipment SET status = 'returned' WHERE id = ?").run(data.equipmentId);
    }
    return true;
  });

  ipcMain.handle('contract:delete', (_e, id: number) => {
    db.prepare('DELETE FROM contracts WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('dispatch:list', (_e, contractId?: number) => {
    let sql = 'SELECT * FROM dispatch_records';
    const params: any[] = [];
    if (contractId) {
      sql += ' WHERE contract_id = ?';
      params.push(contractId);
    }
    sql += ' ORDER BY dispatch_time DESC';
    return db.prepare(sql).all(...params).map((r: any) => ({
      id: r.id,
      contractId: r.contract_id,
      dispatchTime: r.dispatch_time,
      dispatcher: r.dispatcher,
      operatorName: r.operator_name,
      startFuelLevel: r.start_fuel_level,
      startWorkingHours: r.start_working_hours,
      remark: r.remark,
    }));
  });

  ipcMain.handle('dispatch:create', (_e, data: any) => {
    const stmt = db.prepare(`
      INSERT INTO dispatch_records (contract_id, dispatch_time, dispatcher, operator_name,
        start_fuel_level, start_working_hours, remark)
      VALUES (@contractId, @dispatchTime, @dispatcher, @operatorName,
        @startFuelLevel, @startWorkingHours, @remark)
    `);
    return stmt.run(data).lastInsertRowid;
  });

  ipcMain.handle('return:list', (_e, filters?: any) => {
    let sql = `
      SELECT r.*, c.contract_no, e.name as equipment_name, c.customer_name
      FROM return_records r
      LEFT JOIN contracts c ON r.contract_id = c.id
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.status) {
      sql += ' AND r.status = ?';
      params.push(filters.status);
    }
    if (filters?.search) {
      sql += ' AND (c.contract_no LIKE ? OR c.customer_name LIKE ? OR e.name LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY r.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map((r: any) => rowToReturnRecord(r, r.contract_no, r.equipment_name, r.customer_name));
  });

  ipcMain.handle('return:get', (_e, id: number) => {
    const row = db.prepare(`
      SELECT r.*, c.contract_no, e.name as equipment_name, c.customer_name
      FROM return_records r
      LEFT JOIN contracts c ON r.contract_id = c.id
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ?
    `).get(id) as any;
    if (!row) return null;
    const record = rowToReturnRecord(row, row.contract_no, row.equipment_name, row.customer_name);
    const damages = db.prepare('SELECT * FROM damage_items WHERE return_record_id = ?').all(id).map(rowToDamage);
    record.damageItems = damages;
    return record;
  });

  ipcMain.handle('return:create', (_e, data: any) => {
    const stmt = db.prepare(`
      INSERT INTO return_records (contract_id, equipment_id, return_time, actual_return_date,
        dispatcher, contract_manager, end_fuel_level, fuel_difference, fuel_cost_per_unit,
        fuel_compensation, end_working_hours, working_hours_used, working_hours_over_limit,
        over_hours_rate, over_hours_cost, cleaning_status, cleaning_cost, rent_days, total_rent,
        extra_days, extra_days_cost, total_damage_deductible, total_deductions, deposit,
        deposit_refund, additional_payment, status, dispatch_photo_ids, return_photo_ids,
        customer_remark, settlement_remark)
      VALUES (@contractId, @equipmentId, @returnTime, @actualReturnDate,
        @dispatcher, @contractManager, @endFuelLevel, @fuelDifference, @fuelCostPerUnit,
        @fuelCompensation, @endWorkingHours, @workingHoursUsed, @workingHoursOverLimit,
        @overHoursRate, @overHoursCost, @cleaningStatus, @cleaningCost, @rentDays, @totalRent,
        @extraDays, @extraDaysCost, @totalDamageDeductible, @totalDeductions, @deposit,
        @depositRefund, @additionalPayment, @status, @dispatchPhotoIds, @returnPhotoIds,
        @customerRemark, @settlementRemark)
    `);
    const result = stmt.run({
      contractId: data.contractId,
      equipmentId: data.equipmentId,
      returnTime: data.returnTime,
      actualReturnDate: data.actualReturnDate,
      dispatcher: data.dispatcher,
      contractManager: data.contractManager,
      endFuelLevel: data.endFuelLevel,
      fuelDifference: data.fuelDifference,
      fuelCostPerUnit: data.fuelCostPerUnit,
      fuelCompensation: data.fuelCompensation,
      endWorkingHours: data.endWorkingHours,
      workingHoursUsed: data.workingHoursUsed,
      workingHoursOverLimit: data.workingHoursOverLimit,
      overHoursRate: data.overHoursRate,
      overHoursCost: data.overHoursCost,
      cleaningStatus: data.cleaningStatus,
      cleaningCost: data.cleaningCost,
      rentDays: data.rentDays,
      totalRent: data.totalRent,
      extraDays: data.extraDays,
      extraDaysCost: data.extraDaysCost,
      totalDamageDeductible: data.totalDamageDeductible,
      totalDeductions: data.totalDeductions,
      deposit: data.deposit,
      depositRefund: data.depositRefund,
      additionalPayment: data.additionalPayment,
      status: data.status || 'pending',
      dispatchPhotoIds: JSON.stringify(data.dispatchPhotoIds || []),
      returnPhotoIds: JSON.stringify(data.returnPhotoIds || []),
      customerRemark: data.customerRemark,
      settlementRemark: data.settlementRemark,
    });
    db.prepare("UPDATE equipment SET status = 'returned' WHERE id = ?").run(data.equipmentId);
    db.prepare("UPDATE contracts SET status = 'completed' WHERE id = ?").run(data.contractId);
    return result.lastInsertRowid;
  });

  ipcMain.handle('return:update', (_e, id: number, data: any) => {
    const updateFields: string[] = [];
    const params: any = { id };

    const fieldMap: Record<string, string> = {
      contractId: 'contract_id', equipmentId: 'equipment_id', returnTime: 'return_time',
      actualReturnDate: 'actual_return_date', dispatcher: 'dispatcher',
      contractManager: 'contract_manager', endFuelLevel: 'end_fuel_level',
      fuelDifference: 'fuel_difference', fuelCostPerUnit: 'fuel_cost_per_unit',
      fuelCompensation: 'fuel_compensation', endWorkingHours: 'end_working_hours',
      workingHoursUsed: 'working_hours_used', workingHoursOverLimit: 'working_hours_over_limit',
      overHoursRate: 'over_hours_rate', overHoursCost: 'over_hours_cost',
      cleaningStatus: 'cleaning_status', cleaningCost: 'cleaning_cost',
      rentDays: 'rent_days', totalRent: 'total_rent', extraDays: 'extra_days',
      extraDaysCost: 'extra_days_cost', totalDamageDeductible: 'total_damage_deductible',
      totalDeductions: 'total_deductions', deposit: 'deposit', depositRefund: 'deposit_refund',
      additionalPayment: 'additional_payment', status: 'status',
      customerRemark: 'customer_remark', settlementRemark: 'settlement_remark',
    };

    Object.keys(fieldMap).forEach((k) => {
      if (data[k] !== undefined) {
        updateFields.push(`${fieldMap[k]} = @${k}`);
        params[k] = data[k];
      }
    });

    if (data.dispatchPhotoIds !== undefined) {
      updateFields.push('dispatch_photo_ids = @dispatchPhotoIds');
      params.dispatchPhotoIds = JSON.stringify(data.dispatchPhotoIds);
    }
    if (data.returnPhotoIds !== undefined) {
      updateFields.push('return_photo_ids = @returnPhotoIds');
      params.returnPhotoIds = JSON.stringify(data.returnPhotoIds);
    }
    if (data.status === 'confirmed') {
      updateFields.push('confirmed_at = @confirmedAt');
      params.confirmedAt = new Date().toISOString();
    }
    if (data.status === 'customer_confirmed') {
      updateFields.push('customer_confirmed_at = @customerConfirmedAt');
      params.customerConfirmedAt = new Date().toISOString();
    }

    if (updateFields.length > 0) {
      const sql = `UPDATE return_records SET ${updateFields.join(', ')} WHERE id = @id`;
      db.prepare(sql).run(params);
    }
    return true;
  });

  ipcMain.handle('return:delete', (_e, id: number) => {
    const record = db.prepare('SELECT contract_id, equipment_id FROM return_records WHERE id = ?').get(id) as any;
    db.prepare('DELETE FROM return_records WHERE id = ?').run(id);
    if (record) {
      db.prepare("UPDATE equipment SET status = 'rented' WHERE id = ?").run(record.equipment_id);
      db.prepare("UPDATE contracts SET status = 'active' WHERE id = ?").run(record.contract_id);
    }
    return true;
  });

  ipcMain.handle('damage:list', (_e, returnRecordId: number) => {
    return db.prepare('SELECT * FROM damage_items WHERE return_record_id = ? ORDER BY id')
      .all(returnRecordId)
      .map(rowToDamage);
  });

  ipcMain.handle('damage:create', (_e, data: any) => {
    const stmt = db.prepare(`
      INSERT INTO damage_items (return_record_id, category, description, severity,
        need_repair, repair_cost, deductible, repairer, photo_ids, remark)
      VALUES (@returnRecordId, @category, @description, @severity,
        @needRepair, @repairCost, @deductible, @repairer, @photoIds, @remark)
    `);
    return stmt.run({
      returnRecordId: data.returnRecordId,
      category: data.category,
      description: data.description,
      severity: data.severity,
      needRepair: data.needRepair ? 1 : 0,
      repairCost: data.repairCost,
      deductible: data.deductible,
      repairer: data.repairer,
      photoIds: JSON.stringify(data.photoIds || []),
      remark: data.remark,
    }).lastInsertRowid;
  });

  ipcMain.handle('damage:update', (_e, id: number, data: any) => {
    const stmt = db.prepare(`
      UPDATE damage_items SET
        category = @category,
        description = @description,
        severity = @severity,
        need_repair = @needRepair,
        repair_cost = @repairCost,
        deductible = @deductible,
        repairer = @repairer,
        photo_ids = @photoIds,
        remark = @remark
      WHERE id = @id
    `);
    stmt.run({
      id,
      category: data.category,
      description: data.description,
      severity: data.severity,
      needRepair: data.needRepair ? 1 : 0,
      repairCost: data.repairCost,
      deductible: data.deductible,
      repairer: data.repairer,
      photoIds: JSON.stringify(data.photoIds || []),
      remark: data.remark,
    });
    return true;
  });

  ipcMain.handle('damage:delete', (_e, id: number) => {
    db.prepare('DELETE FROM damage_items WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('photo:upload', async (_e, filePath: string, type: string, relatedId?: number, remark?: string) => {
    const photosDir = getPhotosDir();
    const ext = path.extname(filePath);
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const destPath = path.join(photosDir, fileName);

    fs.copyFileSync(filePath, destPath);
    const stat = fs.statSync(destPath);

    const stmt = db.prepare(`
      INSERT INTO photos (file_path, file_name, file_size, type, related_id, remark)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(destPath, fileName, stat.size, type, relatedId ?? null, remark ?? null);
    return { id: result.lastInsertRowid, filePath: destPath, fileName };
  });

  ipcMain.handle('photo:list', (_e, type?: string, relatedId?: number) => {
    let sql = 'SELECT * FROM photos WHERE 1=1';
    const params: any[] = [];
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (relatedId !== undefined) {
      sql += ' AND related_id = ?';
      params.push(relatedId);
    }
    sql += ' ORDER BY upload_time DESC';
    return db.prepare(sql).all(...params).map(rowToPhoto);
  });

  ipcMain.handle('photo:getPath', (_e, id: number) => {
    const row = db.prepare('SELECT file_path FROM photos WHERE id = ?').get(id) as any;
    return row ? row.file_path : null;
  });

  ipcMain.handle('photo:delete', (_e, id: number) => {
    const row = db.prepare('SELECT file_path FROM photos WHERE id = ?').get(id) as any;
    if (row && fs.existsSync(row.file_path)) {
      fs.unlinkSync(row.file_path);
    }
    db.prepare('DELETE FROM photos WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('dialog:selectFile', async (_e, options?: any) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options?.filters || [
        { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('export:settlement', async (_e, returnRecordId: number, outputPath: string) => {
    const row = db.prepare(`
      SELECT r.*, c.contract_no, e.name as equipment_name, c.customer_name
      FROM return_records r
      LEFT JOIN contracts c ON r.contract_id = c.id
      LEFT JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ?
    `).get(returnRecordId) as any;
    if (!row) return false;
    const record = rowToReturnRecord(row, row.contract_no, row.equipment_name, row.customer_name);
    const damages = db.prepare('SELECT * FROM damage_items WHERE return_record_id = ?').all(returnRecordId).map(rowToDamage);
    record.damageItems = damages;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('回场结算单');

    worksheet.columns = [
      { header: '项目', key: 'item', width: 25 },
      { header: '明细', key: 'detail', width: 40 },
      { header: '金额 (元)', key: 'amount', width: 18 },
    ];

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(record.contractId) as any;
    const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(record.equipmentId) as any;
    const dispatch = db.prepare('SELECT * FROM dispatch_records WHERE contract_id = ? ORDER BY dispatch_time DESC LIMIT 1').get(record.contractId) as any;

    worksheet.addRow(['工程机械租赁回场结算单', '', '']);
    worksheet.addRow(['', '', '']);
    worksheet.addRow(['合同编号', record.contractNo, '']);
    worksheet.addRow(['客户名称', record.customerName, '']);
    worksheet.addRow(['联系电话', contract?.customer_phone || '', '']);
    worksheet.addRow(['设备名称', record.equipmentName, '']);
    worksheet.addRow(['设备型号', equipment?.model || '', '']);
    worksheet.addRow(['出厂编号', equipment?.serial_number || '', '']);
    worksheet.addRow(['', '', '']);

    worksheet.addRow(['--- 租期与租金 ---', '', '']);
    worksheet.addRow(['租赁起始日期', contract?.rent_start_date || '', '']);
    worksheet.addRow(['计划归还日期', contract?.planned_return_date || '', '']);
    worksheet.addRow(['实际归还时间', record.returnTime ? new Date(record.returnTime).toLocaleString('zh-CN') : '', '']);
    worksheet.addRow(['租赁天数', `${record.rentDays} 天`, '']);
    worksheet.addRow(['日租金单价', '', contract?.daily_rate || 0]);
    worksheet.addRow(['超期天数', `${record.extraDays} 天`, '']);
    worksheet.addRow(['超期费用', '', record.extraDaysCost]);
    worksheet.addRow(['租金小计', '', record.totalRent]);
    worksheet.addRow(['', '', '']);

    worksheet.addRow(['--- 油量核算 ---', '', '']);
    worksheet.addRow(['出场油量', `${dispatch?.start_fuel_level || 0} %`, '']);
    worksheet.addRow(['回场油量', `${record.endFuelLevel} %`, '']);
    worksheet.addRow(['油量差值', `${record.fuelDifference} %`, '']);
    worksheet.addRow(['燃油单价 (元/L)', '', record.fuelCostPerUnit]);
    worksheet.addRow(['油量补偿', '', record.fuelCompensation]);
    worksheet.addRow(['', '', '']);

    worksheet.addRow(['--- 工时核算 ---', '', '']);
    worksheet.addRow(['出场工时', `${dispatch?.start_working_hours || 0} h`, '']);
    worksheet.addRow(['回场工时', `${record.endWorkingHours} h`, '']);
    worksheet.addRow(['使用工时', `${record.workingHoursUsed} h`, '']);
    worksheet.addRow(['超限工时', `${record.workingHoursOverLimit} h`, '']);
    worksheet.addRow(['超限费率 (元/h)', '', record.overHoursRate]);
    worksheet.addRow(['超时费用', '', record.overHoursCost]);
    worksheet.addRow(['', '', '']);

    worksheet.addRow(['--- 清洗费用 ---', '', '']);
    const cleanLabels: Record<string, string> = { clean: '清洁', slightly_dirty: '轻度污渍', dirty: '较脏', needs_wash: '需要清洗' };
    worksheet.addRow(['清洗状态', cleanLabels[record.cleaningStatus as string] || record.cleaningStatus, '']);
    worksheet.addRow(['清洗费用', '', record.cleaningCost]);
    worksheet.addRow(['', '', '']);

    worksheet.addRow(['--- 损耗与扣费 ---', '', '']);
    const catLabels: Record<string, string> = {
      appearance: '外观损伤', structure: '结构损伤', hydraulic: '液压系统',
      engine: '发动机', electrical: '电气系统', tire: '轮胎/履带',
      accessory: '附属配件', other: '其他',
    };
    const sevLabels: Record<string, string> = { minor: '轻微', moderate: '中等', severe: '严重' };
    if (record.damageItems && record.damageItems.length > 0) {
      record.damageItems.forEach((d: any, i: number) => {
        worksheet.addRow([
          `损耗项 ${i + 1}`,
          `${catLabels[d.category] || d.category} - ${d.description} [${sevLabels[d.severity] || d.severity}]`,
          d.deductible
        ]);
      });
    } else {
      worksheet.addRow(['无损耗项', '', '']);
    }
    worksheet.addRow(['损耗扣费合计', '', record.totalDamageDeductible]);
    worksheet.addRow(['', '', '']);

    worksheet.addRow(['--- 结算汇总 ---', '', '']);
    worksheet.addRow(['租金总额', '', record.totalRent]);
    worksheet.addRow(['费用加项 (油+工时+清洗)', '', record.fuelCompensation + record.overHoursCost + record.cleaningCost]);
    worksheet.addRow(['损耗扣费', '', record.totalDamageDeductible]);
    worksheet.addRow(['扣款合计', '', record.totalDeductions]);
    worksheet.addRow(['', '', '']);
    worksheet.addRow(['合同押金', '', record.deposit]);
    if (record.depositRefund > 0) {
      worksheet.addRow(['应退押金', '', record.depositRefund]);
    }
    if (record.additionalPayment > 0) {
      worksheet.addRow(['客户需补款', '', record.additionalPayment]);
    }
    worksheet.addRow(['', '', '']);
    const statusLabels: Record<string, string> = {
      pending: '待确认', confirmed: '已确认', customer_confirmed: '客户已确认',
      disputed: '有异议', settled: '已结算'
    };
    worksheet.addRow(['结算状态', statusLabels[record.status as string] || record.status, '']);
    worksheet.addRow(['', '', '']);
    worksheet.addRow(['调度签字: ______________', '', '']);
    worksheet.addRow(['租赁经理签字: ______________', '', '']);
    worksheet.addRow(['客户签字: ______________', '', '']);
    worksheet.addRow(['日期: ' + new Date().toLocaleDateString('zh-CN'), '', '']);

    worksheet.getColumn('amount').numFmt = '#,##0.00';

    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 18, color: { argb: 'FF1F4E79' } };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:C1');

    const sectionRows = [10, 19, 26, 33, 38, 44];
    sectionRows.forEach((r) => {
      const row = worksheet.getRow(r);
      row.font = { bold: true, color: { argb: 'FF2E75B6' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
    });

    const outputFile = path.join(outputPath, `结算单_${record.contractNo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    await workbook.xlsx.writeFile(outputFile);
    return outputFile;
  });
}
