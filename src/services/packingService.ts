import { PackingRecord, PackingFilter, PageRequest, PageResponse, ActionLog } from '../types';
import { createPackingRecord, shipPackingRecord, getPackingRecordById, getPackingRecords, createActionLog, getActionLogs, getUserById, getEggGradeRecordById, updateEggGradeRecordStatus } from '../database/repository';
export class PackingService {
 async confirmPacking(eggGradeRecordId: string, boxCount: number, eggsPerBox: number, destination: string, transporter: string, managerId: string): Promise<PackingRecord> {
 const manager = await getUserById(managerId);
 if (!manager) {
 throw new Error('场长不存在');
 }
 if (manager.role !== 'manager') {
 throw new Error('只有场长可以确认装箱发货');
 }
 const gradeRecord = await getEggGradeRecordById(eggGradeRecordId);
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
 const packingRecord = await createPackingRecord({
 eggGradeRecordId,
 batchNumber: gradeRecord.batchNumber,
 boxCount,
 eggsPerBox,
 totalEggs,
 destination,
 transporter,
 managerId,
 managerName: manager.name,
 sortedById: gradeRecord.sorterId!,
 sortedByName: gradeRecord.sorterName!,
 status: 'confirmed'
 });
 await updateEggGradeRecordStatus(eggGradeRecordId, 'packed');
 await createActionLog({
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
 async shipPacking(packingId: string, operatorId: string): Promise<PackingRecord> {
 const operator = await getUserById(operatorId);
 if (!operator) {
 throw new Error('操作人不存在');
 }
 const packingRecord = await getPackingRecordById(packingId);
 if (!packingRecord) {
 throw new Error('装箱记录不存在');
 }
 if (packingRecord.status !== 'confirmed') {
 throw new Error('只能对已确认的装箱记录进行发货');
 }
 const record = await shipPackingRecord(packingId);
 if (!record) {
 throw new Error('发货失败，记录状态已变更');
 }
 await createActionLog({
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
 async getPackingRecordById(id: string): Promise<PackingRecord | null> {
 return await getPackingRecordById(id);
 }
 async getPackingRecords(filter: PackingFilter, pageRequest: PageRequest): Promise<PageResponse<PackingRecord>> {
 return await getPackingRecords(filter, pageRequest);
 }
 async getPackingRecordLogs(packingId: string): Promise<ActionLog[]> {
 return await getActionLogs('packing', packingId);
 }
}
export const packingService = new PackingService();