import { EggGradeRecord, EggGradeFilter, PageRequest, PageResponse, ActionLog, Role } from '../types';
import { createEggGradeRecord, verifyEggGradeRecord, getEggGradeRecordById, getEggGradeRecords, updateEggGradeRecordStatus, createActionLog, getActionLogs, getUserById } from '../database/repository';
export class GradeService {
 async submitGradeRecord(batchNumber: string, grade: string, quantity: number, weight: number, breederId: string): Promise<EggGradeRecord> {
 const breeder = await getUserById(breederId);
 if (!breeder) {
 throw new Error('饲养员不存在');
 }
 if (breeder.role !== 'breeder') {
 throw new Error('只有饲养员可以提交蛋品分级');
 }
 const record = await createEggGradeRecord({
 batchNumber,
 grade: grade as any,
 quantity,
 weight,
 breederId,
 breederName: breeder.name
 });
 await createActionLog({
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
 async verifyGradeRecord(recordId: string, sorterId: string): Promise<EggGradeRecord> {
 const sorter = await getUserById(sorterId);
 if (!sorter) {
 throw new Error('分拣员不存在');
 }
 if (sorter.role !== 'sorter') {
 throw new Error('只有分拣员可以确认蛋品分级');
 }
 const existingRecord = await getEggGradeRecordById(recordId);
 if (!existingRecord) {
 throw new Error('蛋品分级记录不存在');
 }
 if (existingRecord.status !== 'pending') {
 throw new Error('只能确认待确认状态的记录');
 }
 const record = await verifyEggGradeRecord(recordId, sorterId, sorter.name);
 if (!record) {
 throw new Error('确认失败，记录状态已变更');
 }
 await createActionLog({
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
 async getGradeRecordById(id: string): Promise<EggGradeRecord | null> {
 return await getEggGradeRecordById(id);
 }
 async getGradeRecords(filter: EggGradeFilter, pageRequest: PageRequest): Promise<PageResponse<EggGradeRecord>> {
 return await getEggGradeRecords(filter, pageRequest);
 }
 async getGradeRecordLogs(recordId: string): Promise<ActionLog[]> {
 return await getActionLogs('grade', recordId);
 }
 async updateStatusToPacked(recordId: string): Promise<boolean> {
 return await updateEggGradeRecordStatus(recordId, 'packed');
 }
}
export const gradeService = new GradeService();