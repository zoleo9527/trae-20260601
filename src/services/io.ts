import * as XLSX from 'xlsx';
import type { Promotion, PromotionStatus, Role } from '@/types';
import { StorageService } from './storage';

interface ImportResult {
  success: boolean;
  data?: Promotion[];
  count?: number;
  error?: string;
}

export class IOService {
  static exportJSON(promotions: Promotion[]): string {
    return JSON.stringify(promotions, null, 2);
  }

  static exportToJSON(): void {
    const data = StorageService.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    this.downloadBlob(blob, `促销活动数据_${this.getDateStr()}.json`);
  }

  static exportPromotionToJSON(promotionId: string): void {
    const promotion = StorageService.getPromotion(promotionId);
    if (!promotion) return;
    
    const data = JSON.stringify(promotion, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    this.downloadBlob(blob, `促销单_${promotion.title}_${this.getDateStr()}.json`);
  }

  static exportExcel(promotions: Promotion[], filename: string): void {
    const wb = XLSX.utils.book_new();

    const promotionData = promotions.map(p => ({
      '促销单编号': p.id,
      '活动标题': p.title,
      '专柜': p.counter,
      '品牌': p.brand,
      '活动类型': p.type,
      '开始日期': p.startDate,
      '结束日期': p.endDate,
      '预算金额': p.budget,
      '状态': this.getStatusLabel(p.status),
      '当前处理人': this.getRoleLabel(p.currentRole),
      '创建时间': p.createdAt,
      '更新时间': p.updatedAt,
      '描述': p.description,
      '实际销售': p.salesData?.actualSales ?? '',
      '目标销售': p.salesData?.targetSales ?? '',
      '客单数': p.salesData?.customerCount ?? '',
      '销售备注': p.salesData?.comment ?? '',
    }));

    const ws1 = XLSX.utils.json_to_sheet(promotionData);
    XLSX.utils.book_append_sheet(wb, ws1, '促销活动');

    const stepData = promotions.flatMap(p => 
      p.steps.map(s => ({
        '促销单编号': p.id,
        '活动标题': p.title,
        '步骤编号': s.id,
        '处理角色': this.getRoleLabel(s.role),
        '操作类型': this.getActionLabel(s.action),
        '操作人': s.operator,
        '处理意见': s.comment,
        '处理时间': s.createdAt,
      }))
    );

    const ws2 = XLSX.utils.json_to_sheet(stepData);
    XLSX.utils.book_append_sheet(wb, ws2, '处理记录');

    const remarkData = promotions.flatMap(p =>
      p.remarks.map(r => ({
        '促销单编号': p.id,
        '活动标题': p.title,
        '备注编号': r.id,
        '所属步骤': r.stepId || '独立备注',
        '角色': this.getRoleLabel(r.role),
        '操作人': r.operator,
        '备注内容': r.content,
        '附件': r.attachments.join('; '),
        '创建时间': r.createdAt,
      }))
    );

    const ws3 = XLSX.utils.json_to_sheet(remarkData);
    XLSX.utils.book_append_sheet(wb, ws3, '备注记录');

    XLSX.writeFile(wb, filename);
  }

  static exportToExcel(): void {
    const promotions = StorageService.getPromotions();
    const wb = XLSX.utils.book_new();

    const promotionData = promotions.map(p => ({
      '促销单编号': p.id,
      '活动标题': p.title,
      '专柜': p.counter,
      '品牌': p.brand,
      '活动类型': p.type,
      '开始日期': p.startDate,
      '结束日期': p.endDate,
      '预算金额': p.budget,
      '状态': this.getStatusLabel(p.status),
      '当前处理人': this.getRoleLabel(p.currentRole),
      '创建时间': p.createdAt,
      '更新时间': p.updatedAt,
      '描述': p.description,
      '实际销售': p.salesData?.actualSales ?? '',
      '目标销售': p.salesData?.targetSales ?? '',
      '客单数': p.salesData?.customerCount ?? '',
      '销售备注': p.salesData?.comment ?? '',
    }));

    const ws1 = XLSX.utils.json_to_sheet(promotionData);
    XLSX.utils.book_append_sheet(wb, ws1, '促销活动');

    const stepData = promotions.flatMap(p => 
      p.steps.map(s => ({
        '促销单编号': p.id,
        '活动标题': p.title,
        '步骤编号': s.id,
        '处理角色': this.getRoleLabel(s.role),
        '操作类型': this.getActionLabel(s.action),
        '操作人': s.operator,
        '处理意见': s.comment,
        '处理时间': s.createdAt,
      }))
    );

    const ws2 = XLSX.utils.json_to_sheet(stepData);
    XLSX.utils.book_append_sheet(wb, ws2, '处理记录');

    const remarkData = promotions.flatMap(p =>
      p.remarks.map(r => ({
        '促销单编号': p.id,
        '活动标题': p.title,
        '备注编号': r.id,
        '所属步骤': r.stepId || '独立备注',
        '角色': this.getRoleLabel(r.role),
        '备注内容': r.content,
        '附件': r.attachments.join('; '),
        '创建时间': r.createdAt,
      }))
    );

    const ws3 = XLSX.utils.json_to_sheet(remarkData);
    XLSX.utils.book_append_sheet(wb, ws3, '备注记录');

    XLSX.writeFile(wb, `促销活动数据_${this.getDateStr()}.xlsx`);
  }

  static importJSON(jsonStr: string): ImportResult {
    try {
      const data = JSON.parse(jsonStr);
      
      if (Array.isArray(data)) {
        return {
          success: true,
          data: data as Promotion[],
          count: data.length,
        };
      }
      
      if (data.promotions && Array.isArray(data.promotions)) {
        return {
          success: true,
          data: data.promotions as Promotion[],
          count: data.promotions.length,
        };
      }
      
      return {
        success: false,
        error: 'JSON 格式不正确，无法找到促销活动数据。',
      };
    } catch {
      return {
        success: false,
        error: 'JSON 解析失败，请检查文件格式。',
      };
    }
  }

  static importExcel(buffer: ArrayBuffer): ImportResult {
    try {
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets['促销活动'];
      if (!ws) {
        return {
          success: false,
          error: 'Excel 文件中未找到"促销活动"工作表。',
        };
      }
      
      const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
      const promotions: Promotion[] = jsonData.map(row => {
        const now = new Date().toISOString();
        return {
          id: row['促销单编号'] || this.generateId(),
          title: row['活动标题'] || '',
          counter: row['专柜'] || '',
          brand: row['品牌'] || '',
          type: row['活动类型'] || '其他',
          startDate: row['开始日期'] || now.split('T')[0],
          endDate: row['结束日期'] || now.split('T')[0],
          budget: Number(row['预算金额']) || 0,
          description: row['描述'] || '',
          status: (this.parseStatus(row['状态']) as PromotionStatus) || 'draft',
          currentRole: (this.parseRole(row['当前处理人']) as Role) || 'counterManager',
          createdAt: row['创建时间'] || now,
          updatedAt: row['更新时间'] || now,
          steps: [],
          remarks: [],
        };
      });
      
      return {
        success: true,
        data: promotions,
        count: promotions.length,
      };
    } catch {
      return {
        success: false,
        error: 'Excel 解析失败，请检查文件格式。',
      };
    }
  }

  static importFromJSON(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const success = StorageService.importAll(content);
          resolve(success);
        } catch {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }

  static importFromExcel(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets['促销活动'];
          if (!ws) {
            resolve(false);
            return;
          }
          
          const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
          const promotions: Promotion[] = jsonData.map(row => {
            const now = new Date().toISOString();
            return {
              id: row['促销单编号'] || this.generateId(),
              title: row['活动标题'] || '',
              counter: row['专柜'] || '',
              brand: row['品牌'] || '',
              type: row['活动类型'] || '其他',
              startDate: row['开始日期'] || now.split('T')[0],
              endDate: row['结束日期'] || now.split('T')[0],
              budget: Number(row['预算金额']) || 0,
              description: row['描述'] || '',
              status: (this.parseStatus(row['状态']) as PromotionStatus) || 'draft',
              currentRole: (this.parseRole(row['当前处理人']) as Role) || 'counterManager',
              createdAt: row['创建时间'] || now,
              updatedAt: row['更新时间'] || now,
              steps: [],
              remarks: [],
            };
          });
          
          StorageService.savePromotions(promotions);
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file);
    });
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static getDateStr(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }

  private static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: '草稿',
      pendingSupervisor: '待主管审核',
      pendingBrand: '待督导确认',
      active: '活动进行中',
      salesPending: '待销售核对',
      completed: '已完成',
      rejected: '已驳回',
    };
    return labels[status] || status;
  }

  private static getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      counterManager: '柜长',
      floorSupervisor: '楼层主管',
      brandSupervisor: '品牌督导',
    };
    return labels[role] || role;
  }

  private static getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: '创建',
      submit: '提交',
      approve: '通过',
      reject: '驳回',
      complete: '完成',
    };
    return labels[action] || action;
  }

  private static parseStatus(label: string): string | null {
    const statuses: Record<string, string> = {
      '草稿': 'draft',
      '待主管审核': 'pendingSupervisor',
      '待督导确认': 'pendingBrand',
      '活动进行中': 'active',
      '待销售核对': 'salesPending',
      '已完成': 'completed',
      '已驳回': 'rejected',
    };
    return statuses[label] || null;
  }

  private static parseRole(label: string): string | null {
    const roles: Record<string, string> = {
      '柜长': 'counterManager',
      '楼层主管': 'floorSupervisor',
      '品牌督导': 'brandSupervisor',
    };
    return roles[label] || null;
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}
