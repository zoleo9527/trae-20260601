"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packingService = exports.PackingService = void 0;
const repository_1 = require("../database/repository");
class PackingService {
    async confirmPacking(eggGradeRecordId, boxCount, eggsPerBox, destination, transporter, managerId) {
        const manager = await (0, repository_1.getUserById)(managerId);
        if (!manager) {
            throw new Error('场长不存在');
        }
        if (manager.role !== 'manager') {
            throw new Error('只有场长可以确认装箱发货');
        }
        const gradeRecord = await (0, repository_1.getEggGradeRecordById)(eggGradeRecordId);
        if (!gradeRecord) {
            throw new Error('蛋品分级记录不存在');
        }
        if (gradeRecord.status !== 'verified') {
            throw new Error('只能对已确认的蛋品分级记录进行装箱');
        }
        const totalEggs = boxCount * eggsPerBox;
        if (totalEggs !== gradeRecord.quantity) {
            throw new Error(`装箱数量(${totalEggs})与分级数量(${gradeRecord.quantity})不一致`);
        }
        const sortedById = gradeRecord.sorterId || '';
        const sortedByName = gradeRecord.sorterName || '';
        if (!sortedById || !sortedByName) {
            throw new Error('分拣员信息不完整');
        }
        const packingRecord = await (0, repository_1.createPackingRecord)({
            eggGradeRecordId,
            batchNumber: gradeRecord.batchNumber,
            boxCount,
            eggsPerBox,
            totalEggs,
            destination,
            transporter,
            managerId,
            managerName: manager.name,
            sortedById,
            sortedByName,
            status: 'confirmed'
        });
        await (0, repository_1.updateEggGradeRecordStatus)(eggGradeRecordId, 'packed');
        await (0, repository_1.createActionLog)({
            targetType: 'packing',
            targetId: packingRecord.id,
            action: 'confirm',
            operatorId: managerId,
            operatorName: manager.name,
            operatorRole: 'manager',
            details: `场长 ${manager.name} 确认装箱发货: 批次号 ${packingRecord.batchNumber}, 箱数 ${boxCount}, 每箱 ${eggsPerBox} 个, 目的地 ${destination}`
        });
        return packingRecord;
    }
    async shipPacking(packingId, operatorId) {
        const operator = await (0, repository_1.getUserById)(operatorId);
        if (!operator) {
            throw new Error('操作人不存在');
        }
        const packingRecord = await (0, repository_1.getPackingRecordById)(packingId);
        if (!packingRecord) {
            throw new Error('装箱记录不存在');
        }
        if (packingRecord.status !== 'confirmed') {
            throw new Error('只能对已确认的装箱记录进行发货');
        }
        const record = await (0, repository_1.shipPackingRecord)(packingId);
        if (!record) {
            throw new Error('发货失败，记录状态已变更');
        }
        await (0, repository_1.createActionLog)({
            targetType: 'packing',
            targetId: packingId,
            action: 'ship',
            operatorId,
            operatorName: operator.name,
            operatorRole: operator.role,
            details: `${operator.role === 'manager' ? '场长' : '操作员'} ${operator.name} 执行发货: 批次号 ${record.batchNumber}, 目的地 ${record.destination}`
        });
        return record;
    }
    async getPackingRecordById(id) {
        return await (0, repository_1.getPackingRecordById)(id);
    }
    async getPackingRecords(filter, pageRequest) {
        return await (0, repository_1.getPackingRecords)(filter, pageRequest);
    }
    async getPackingRecordLogs(packingId) {
        return await (0, repository_1.getActionLogs)('packing', packingId);
    }
}
exports.PackingService = PackingService;
exports.packingService = new PackingService();
