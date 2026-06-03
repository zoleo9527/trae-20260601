import { Cell, Cabinet } from '../models/index.js';
import { CELL_STATUS, CABINET_STATUS } from '../utils/constants.js';
import { canTransitionCell } from './StateMachineService.js';

export async function uploadCellStatus(cabinetNo, cellStatuses) {
  const cabinet = await Cabinet.findOne({
    where: { cabinetNo },
    include: [{ model: Cell, as: 'cells' }],
  });
  if (!cabinet) {
    throw new Error('柜机不存在');
  }
  const results = [];
  for (const statusData of cellStatuses) {
    const { cellNo, status, lockStatus, doorStatus } = statusData;
    const cell = cabinet.cells.find(c => c.cellNo === cellNo);
    if (!cell) {
      results.push({ cellNo, success: false, error: '格口不存在' });
      continue;
    }
    try {
      const updateData = {};
      if (status && canTransitionCell(cell.status, status)) {
        updateData.status = status;
        updateData.lastStatusChange = new Date();
      }
      if (lockStatus !== undefined) {
        updateData.lockStatus = lockStatus;
      }
      if (doorStatus !== undefined) {
        updateData.doorStatus = doorStatus;
      }
      if (Object.keys(updateData).length > 0) {
        await cell.update(updateData);
      }
      results.push({ cellNo, success: true, cell });
    } catch (error) {
      results.push({ cellNo, success: false, error: error.message });
    }
  }
  const availableCells = await Cell.count({
    where: { cabinetId: cabinet.id, status: CELL_STATUS.AVAILABLE },
  });
  await cabinet.update({
    availableCells,
    lastHeartbeat: new Date(),
    status: CABINET_STATUS.ONLINE,
  });
  return { cabinet, results };
}

export async function getCabinetRealTimeStatus(cabinetId) {
  const cabinet = await Cabinet.findByPk(cabinetId, {
    include: [{ model: Cell, as: 'cells' }],
  });
  if (!cabinet) {
    throw new Error('柜机不存在');
  }
  const cells = cabinet.cells;
  const statusSummary = {
    total: cells.length,
    available: cells.filter(c => c.status === CELL_STATUS.AVAILABLE).length,
    occupied: cells.filter(c => c.status === CELL_STATUS.OCCUPIED).length,
    delivered: cells.filter(c => c.status === CELL_STATUS.DELIVERED).length,
    malfunction: cells.filter(c => c.status === CELL_STATUS.MALFUNCTION).length,
    maintenance: cells.filter(c => c.status === CELL_STATUS.MAINTENANCE).length,
  };
  return { cabinet, cells, statusSummary };
}
