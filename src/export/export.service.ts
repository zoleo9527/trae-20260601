import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InMemoryStore } from '../common/store/in-memory.store';
import { ExportTask } from '../common/types/export-task.type';
import { User, UserRole } from '../common/types/user.type';
import { CreateExportTaskDto, QueryExportListDto } from './dto/export.dto';
import { LeaveRequest } from '../common/types/leave.type';
import { MakeupCoordination } from '../common/types/makeup.type';

@Injectable()
export class ExportService {
  private readonly exportDir: string;

  constructor(private readonly store: InMemoryStore) {
    this.exportDir = path.join(os.tmpdir(), 'music-leave-makeup-exports');
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  async createTask(dto: CreateExportTaskDto, creator: User): Promise<ExportTask> {
    const now = new Date().toISOString();
    const task: ExportTask = {
      id: uuidv4(),
      taskNo: `EXPORT-${now.slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`,
      type: dto.type,
      format: dto.format,
      status: 'PROCESSING',
      requestedBy: creator.id,
      requestedByName: creator.name,
      filters: dto.filters || {},
      fileUrl: null,
      createdAt: now,
      completedAt: null,
    };
    this.store.saveExportTask(task);

    setImmediate(() => this.runExport(task));
    return task;
  }

  getTask(id: string): ExportTask {
    const t = this.store.getExportTask(id);
    if (!t) throw new NotFoundException('导出任务不存在');
    return t;
  }

  listTasks(query: QueryExportListDto, viewer: User): ExportTask[] {
    let tasks = this.store.listExportTasks();
    if (viewer.role !== UserRole.AFFAIRS) {
      tasks = tasks.filter((t) => t.requestedBy === viewer.id);
    }
    if (query.type) tasks = tasks.filter((t) => t.type === query.type);
    if (query.status) tasks = tasks.filter((t) => t.status === query.status);
    return tasks;
  }

  private async runExport(task: ExportTask) {
    try {
      const rows = this.buildRows(task);
      let fileUrl: string;

      if (task.format === 'CSV') {
        fileUrl = this.writeCsv(task, rows);
      } else {
        fileUrl = await this.writeExcel(task, rows);
      }

      task.status = 'COMPLETED';
      task.fileUrl = fileUrl;
      task.completedAt = new Date().toISOString();
      this.store.saveExportTask(task);
    } catch (err) {
      task.status = 'FAILED';
      task.fileUrl = null;
      task.completedAt = new Date().toISOString();
      (task as any)._error = String(err);
      this.store.saveExportTask(task);
    }
  }

  private buildRows(task: ExportTask): any[] {
    const f = task.filters || {};
    if (task.type === 'LEAVE') {
      let list: LeaveRequest[] = this.store.listLeaves();
      if (f.statuses && f.statuses.length) list = list.filter((l) => f.statuses.includes(l.status));
      if (f.teacherId) list = list.filter((l) => l.teacherId === f.teacherId);
      return list.map((l) => ({
        请假编号: l.requestNo,
        任课老师: l.teacherName,
        请假类型: l.type,
        开始日期: l.startDate,
        结束日期: l.endDate,
        涉及课节: l.lessonCount,
        当前状态: l.status,
        当前处理人: `${l.currentHandlerName}(${l.currentHandlerRole})`,
        阻塞原因: l.blockReason || '',
        需补材料: (l.materialRequired || []).join('、'),
        被催促次数: l.urgencyCount,
        创建时间: l.createdAt,
        最后更新: l.updatedAt,
        审批人: l.approverName || '',
        审批时间: l.approvedAt || '',
        请假理由: l.reason,
      }));
    } else {
      let list: MakeupCoordination[] = this.store.listMakeups();
      if (f.statuses && f.statuses.length) list = list.filter((m) => f.statuses.includes(m.status));
      if (f.teacherId) list = list.filter((m) => m.teacherId === f.teacherId);
      return list.map((m) => ({
        协调编号: m.coordinationNo,
        关联请假: m.leaveRequestNo,
        任课老师: m.teacherName,
        学员数量: m.studentIds.length,
        代课老师: m.proposedMakeupTeacherName || '',
        原始课次: (m.originalLessonDates || []).join(' | '),
        提议补课时间: (m.proposedMakeupDates || []).join(' | '),
        当前状态: m.status,
        当前处理人: `${m.currentHandlerName}(${m.currentHandlerRole})`,
        '阻塞/备注': m.blockReason || '',
        创建时间: m.createdAt,
        最后更新: m.updatedAt,
        完成时间: m.completedAt || '',
      }));
    }
  }

  private writeCsv(task: ExportTask, rows: any[]): string {
    if (rows.length === 0) throw new BadRequestException('没有可导出的数据');
    const headers = Object.keys(rows[0]);
    const esc = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      return `"${s.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };
    const lines: string[] = [];
    lines.push(headers.map(esc).join(','));
    rows.forEach((r) => lines.push(headers.map((h) => esc(r[h])).join(',')));
    const filePath = path.join(this.exportDir, `${task.taskNo}.csv`);
    fs.writeFileSync(filePath, '\ufeff' + lines.join('\n'), 'utf8');
    return `/exports/${task.taskNo}.csv`;
  }

  private async writeExcel(task: ExportTask, rows: any[]): Promise<string> {
    if (rows.length === 0) throw new BadRequestException('没有可导出的数据');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(task.type === 'LEAVE' ? '请假记录' : '补课协调');
    const headers = Object.keys(rows[0]);
    sheet.columns = headers.map((h) => ({ header: h, key: h, width: Math.max(12, Math.min(40, h.length * 2 + 8)) }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
    const filePath = path.join(this.exportDir, `${task.taskNo}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return `/exports/${task.taskNo}.xlsx`;
  }
}
