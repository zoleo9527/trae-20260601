"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeService = exports.GradeService = void 0;
const repository_1 = require("../database/repository");
class GradeService {
    async submitGradeRecord(batchNumber, grade, quantity, weight, breederId) {
        const breeder = await (0, repository_1.getUserById)(breederId);
        if (!breeder) {
            throw new Error('饲养员不存在');
        }
        if (breeder.role !== 'breeder') {
            throw new Error('只有饲养员可以提交蛋品分级');
        }
        const record = await (0, repository_1.createEggGradeRecord)({
            batchNumber,
            grade: grade,
            quantity,
            weight,
            breederId,
            breederName: breeder.name
        });
        await (0, repository_1.createActionLog)({
            targetType: 'grade',
            targetId: record.id,
            action: 'submit',
            operatorId: breederId,
            operatorName: breeder.name,
            operatorRole: 'breeder',
            details: `饲养员 ${breeder.name} 提交蛋品分级记录: 批次号 ${batchNumber}, 等级 ${grade}, 数量 ${quantity}, 重量 ${weight}kg`
        });
        return record;
    }
    async verifyGradeRecord(recordId, sorterId) {
        const sorter = await (0, repository_1.getUserById)(sorterId);
        if (!sorter) {
            throw new Error('分拣员不存在');
        }
        if (sorter.role !== 'sorter') {
            throw new Error('只有分拣员可以确认蛋品分级');
        }
        const existingRecord = await (0, repository_1.getEggGradeRecordById)(recordId);
        if (!existingRecord) {
            throw new Error('蛋品分级记录不存在');
        }
        if (existingRecord.status !== 'pending') {
            throw new Error('只能确认待确认状态的记录');
        }
        const record = await (0, repository_1.verifyEggGradeRecord)(recordId, sorterId, sorter.name);
        if (!record) {
            throw new Error('确认失败，记录状态已变更');
        }
        await (0, repository_1.createActionLog)({
            targetType: 'grade',
            targetId: recordId,
            action: 'verify',
            operatorId: sorterId,
            operatorName: sorter.name,
            operatorRole: 'sorter',
            details: `分拣员 ${sorter.name} 确认蛋品分级记录: 批次号 ${record.batchNumber}, 等级 ${record.grade}`
        });
        return record;
    }
    async getGradeRecordById(id) {
        return await (0, repository_1.getEggGradeRecordById)(id);
    }
    async getGradeRecords(filter, pageRequest) {
        return await (0, repository_1.getEggGradeRecords)(filter, pageRequest);
    }
    async getGradeRecordLogs(recordId) {
        return await (0, repository_1.getActionLogs)('grade', recordId);
    }
    async updateStatusToPacked(recordId) {
        return await (0, repository_1.updateEggGradeRecordStatus)(recordId, 'packed');
    }
}
exports.GradeService = GradeService;
exports.gradeService = new GradeService();
