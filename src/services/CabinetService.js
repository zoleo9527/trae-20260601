import { Op } from 'sequelize';
import { Cabinet, Cell } from '../models/index.js';
import { CELL_STATUS, CABINET_STATUS } from '../utils/constants.js';
import { canTransitionCell } from './StateMachineService.js';

export async function createCabinet(data) {
  const cabinet = await Cabinet.create(data);
  return cabinet;
}

export async function updateCabinet(id, data) {
  const cabinet = await Cabinet.findByPk(id);
  if (!cabinet) {
    throw new Error('柜机不存在');
  }
  await cabinet.update(data);
  return cabinet;
}

export async function getCabinetList(params = {}) {
  const { page = 1, pageSize = 20, status, keyword } = params;
  const where = {};
  if (status) where.status = status;
  if (keyword) {
    where[Op.or] = [
      { cabinetNo: { [Op.like]: `%${keyword}%` } },
      { name: { [Op.like]: `%${keyword}%` } },
      { location: { [Op.like]: `%${keyword}%` } },
    ];
  }
  const { count, rows } = await Cabinet.findAndCountAll({
    where,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    order: [['createdAt', 'DESC']],
  });
  return { total: count, list: rows, page, pageSize };
}

export async function getCabinetDetail(id) {
  const cabinet = await Cabinet.findByPk(id, {
    include: [{ model: Cell, as: 'cells' }],
  });
  if (!cabinet) {
    throw new Error('柜机不存在');
  }
  return cabinet;
}

export async function updateCabinetStatus(id, status, remark = '') {
  const cabinet = await Cabinet.findByPk(id);
  if (!cabinet) {
    throw new Error('柜机不存在');
  }
  await cabinet.update({ status, lastHeartbeat: new Date(), remark });
  return cabinet;
}

export async function heartbeat(cabinetNo, ipAddress) {
  const cabinet = await Cabinet.findOne({ where: { cabinetNo } });
  if (!cabinet) {
    throw new Error('柜机不存在');
  }
  await cabinet.update({
    lastHeartbeat: new Date(),
    ipAddress,
    status: CABINET_STATUS.ONLINE,
  });
  return cabinet;
}

export async function addCells(cabinetId, cells) {
  const cabinet = await Cabinet.findByPk(cabinetId);
  if (!cabinet) {
    throw new Error('柜机不存在');
  }
  const createdCells = await Cell.bulkCreate(
    cells.map(c => ({ ...c, cabinetId }))
  );
  const totalCells = await Cell.count({ where: { cabinetId } });
  const availableCells = await Cell.count({
    where: { cabinetId, status: CELL_STATUS.AVAILABLE },
  });
  await cabinet.update({ totalCells, availableCells });
  return createdCells;
}

export async function updateCellStatus(cellId, status, remark = '') {
  const cell = await Cell.findByPk(cellId);
  if (!cell) {
    throw new Error('格口不存在');
  }
  if (!canTransitionCell(cell.status, status)) {
    throw new Error(`无法从 ${cell.status} 转换到 ${status}`);
  }
  await cell.update({ status, lastStatusChange: new Date(), remark });
  const cabinet = await Cabinet.findByPk(cell.cabinetId);
  if (cabinet) {
    const availableCells = await Cell.count({
      where: { cabinetId: cell.cabinetId, status: CELL_STATUS.AVAILABLE },
    });
    await cabinet.update({ availableCells });
  }
  return cell;
}

export async function updateCellHardwareStatus(cellId, lockStatus, doorStatus) {
  const cell = await Cell.findByPk(cellId);
  if (!cell) {
    throw new Error('格口不存在');
  }
  await cell.update({ lockStatus, doorStatus });
  return cell;
}

export async function getCellList(cabinetId, params = {}) {
  const { status, page = 1, pageSize = 50 } = params;
  const where = { cabinetId };
  if (status) where.status = status;
  const { count, rows } = await Cell.findAndCountAll({
    where,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    order: [['cellNo', 'ASC']],
  });
  return { total: count, list: rows, page, pageSize };
}

export async function getCellDetail(id) {
  const cell = await Cell.findByPk(id, {
    include: [{ model: Cabinet, as: 'cabinet' }],
  });
  if (!cell) {
    throw new Error('格口不存在');
  }
  return cell;
}

export async function findAvailableCell(cabinetId, size = 'medium') {
  const cell = await Cell.findOne({
    where: {
      cabinetId,
      status: CELL_STATUS.AVAILABLE,
      size,
    },
    order: [['cellNo', 'ASC']],
  });
  return cell;
}
