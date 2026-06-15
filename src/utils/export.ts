import * as XLSX from 'xlsx';
import type { Order, OrderStatus, ChargeMethod } from '../types/order';

const FIELD_MAP: Record<string, string> = {
  '工单编号': 'id',
  'id': 'id',
  '创建时间': 'createdAt',
  'createdAt': 'createdAt',
  '状态': 'status',
  'status': 'status',
  '客户姓名': 'customerName',
  '客户': 'customerName',
  '联系电话': 'customerPhone',
  '电话': 'customerPhone',
  '手机': 'customerPhone',
  '地址': 'customerAddress',
  'address': 'customerAddress',
  '家电类型': 'applianceType',
  '类型': 'applianceType',
  '品牌': 'applianceBrand',
  'brand': 'applianceBrand',
  '型号': 'applianceModel',
  'model': 'applianceModel',
  '故障描述': 'applianceFault',
  '故障': 'applianceFault',
  'fault': 'applianceFault',
  '分配工程师': 'assignedTo',
  '工程师': 'assignedTo',
  'assignedTo': 'assignedTo',
  '收费金额': 'chargeAmount',
  '金额': 'chargeAmount',
  'amount': 'chargeAmount',
  '收费方式': 'chargeMethod',
  '收款方式': 'chargeMethod',
  'method': 'chargeMethod',
  '收费时间': 'chargePaidAt',
  'paidAt': 'chargePaidAt',
  '配件退回': 'partReturnHasReturn',
  '退回': 'partReturnHasReturn',
  '退回原因': 'partReturnReason',
  'reason': 'partReturnReason',
  '备注': 'noteContent',
  '备注内容': 'noteContent',
};

const STATUS_MAP: Record<string, OrderStatus> = {
  '待派单': 'pending_assign',
  'pending_assign': 'pending_assign',
  '待施工': 'pending_work',
  'pending_work': 'pending_work',
  '施工中': 'working',
  'working': 'working',
  '待收费': 'pending_charge',
  'pending_charge': 'pending_charge',
  '待回单': 'pending_receipt',
  'pending_receipt': 'pending_receipt',
  '待配件退回': 'pending_return',
  'pending_return': 'pending_return',
  '待审核': 'pending_review',
  'pending_review': 'pending_review',
  '已完成': 'completed',
  'completed': 'completed',
};

const METHOD_MAP: Record<string, ChargeMethod> = {
  '微信': '微信',
  '支付宝': '支付宝',
  '现金': '现金',
  '转账': '转账',
};

const generateId = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `AS${dateStr}${random}`;
};

const formatDateTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

function normalizeKey(key: string): string {
  const trimmed = key.trim();
  return FIELD_MAP[trimmed] || trimmed;
}

function mapRowToOrder(row: Record<string, unknown>): Order {
  const mapped: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    mapped[normalizeKey(k)] = v;
  }

  const rawStatus = String(mapped.status || 'pending_assign');
  const status = STATUS_MAP[rawStatus] || 'pending_assign';

  const rawMethod = String(mapped.chargeMethod || '微信');
  const chargeMethod = METHOD_MAP[rawMethod] || '微信';

  const chargeAmount = Number(mapped.chargeAmount) || 0;

  const hasReturnStr = String(mapped.partReturnHasReturn || '');
  const hasReturn = ['有退回', '是', 'true', '1', 'yes'].includes(hasReturnStr.toLowerCase());

  const noteContent = mapped.noteContent ? String(mapped.noteContent) : '';

  const order: Order = {
    id: String(mapped.id || generateId()),
    createdAt: String(mapped.createdAt || formatDateTime(new Date())),
    status,
    customer: {
      name: String(mapped.customerName || ''),
      phone: String(mapped.customerPhone || ''),
      address: String(mapped.customerAddress || ''),
    },
    appliance: {
      type: String(mapped.applianceType || ''),
      brand: String(mapped.applianceBrand || ''),
      model: String(mapped.applianceModel || ''),
      fault: String(mapped.applianceFault || ''),
    },
    assignedTo: String(mapped.assignedTo || ''),
    parts: [],
    charge: {
      amount: chargeAmount,
      method: chargeMethod,
      paidAt: mapped.chargePaidAt ? String(mapped.chargePaidAt) : (chargeAmount > 0 ? formatDateTime(new Date()) : null),
      confirmedBy: chargeAmount > 0 ? String(mapped.assignedTo || '') : null,
      confirmedAt: chargeAmount > 0 ? formatDateTime(new Date()) : null,
    },
    receipt: {
      images: [],
      uploadedAt: null,
      confirmedBy: null,
      confirmedAt: null,
    },
    partReturn: {
      hasReturn,
      reason: String(mapped.partReturnReason || ''),
      status: 'pending',
      submittedBy: null,
      submittedAt: null,
      returnedAt: null,
      confirmedBy: null,
      confirmedAt: null,
    },
    notes: noteContent
      ? [
          {
            id: `n_${Date.now()}`,
            role: '客服' as const,
            author: '导入',
            content: noteContent,
            createdAt: formatDateTime(new Date()),
          },
        ]
      : [],
    closedAt: status === 'completed' ? formatDateTime(new Date()) : null,
  };

  return order;
}

export const importFromExcelOrCSV = (file: File): Promise<Order[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('文件中没有工作表'));
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        if (rows.length === 0) {
          reject(new Error('工作表中没有数据'));
          return;
        }
        const orders = rows.map(mapRowToOrder);
        resolve(orders);
      } catch (err) {
        reject(new Error('文件解析失败：' + (err as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

export const downloadImportTemplate = () => {
  const templateData = [
    {
      '工单编号': 'AS20240601001',
      '创建时间': '2024-06-01 09:30:00',
      '状态': '待派单',
      '客户姓名': '张伟',
      '联系电话': '138****1234',
      '地址': '朝阳区建国路88号',
      '家电类型': '空调',
      '品牌': '格力',
      '型号': 'KFR-35GW',
      '故障描述': '制冷效果差',
      '分配工程师': '',
      '收费金额': 0,
      '收费方式': '微信',
      '收费时间': '',
      '配件退回': '无退回',
      '退回原因': '',
      '备注': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '导入模板');

  ws['!cols'] = [
    { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
    { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 10 },
    { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 18 }, { wch: 10 }, { wch: 20 }, { wch: 25 },
  ];

  XLSX.writeFile(wb, '家电售后工单导入模板.xlsx');
};

export const exportToExcel = (orders: Order[], filename = '工单数据.xlsx') => {
  const exportData = orders.map((order) => ({
    '工单编号': order.id,
    '创建时间': order.createdAt,
    '状态': order.status,
    '客户姓名': order.customer.name,
    '联系电话': order.customer.phone,
    '地址': order.customer.address,
    '家电类型': order.appliance.type,
    '品牌': order.appliance.brand,
    '型号': order.appliance.model,
    '故障描述': order.appliance.fault,
    '分配工程师': order.assignedTo,
    '配件清单': order.parts.map((p) => `${p.name}×${p.quantity}`).join('；'),
    '收费金额': order.charge.amount,
    '收费方式': order.charge.method,
    '收费时间': order.charge.paidAt || '',
    '回单状态': order.receipt.images.length > 0 ? '已上传' : '未上传',
    '配件退回': order.partReturn.hasReturn ? '有退回' : '无退回',
    '退回原因': order.partReturn.reason,
    '结案时间': order.closedAt || '',
    '备注数量': order.notes.length,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '工单列表');

  ws['!cols'] = [
    { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 10 },
    { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 10 },
    { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 30 },
    { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 10 },
    { wch: 10 }, { wch: 20 }, { wch: 18 }, { wch: 8 },
  ];

  XLSX.writeFile(wb, filename);
};

export const exportToJSON = (orders: Order[], filename = '工单数据.json') => {
  const dataStr = JSON.stringify(orders, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<Order[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data as Order[]);
      } catch (err) {
        reject(new Error('JSON 文件格式错误'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};

export const exportNotesToText = (order: Order): string => {
  const lines = [
    `工单编号：${order.id}`,
    `客户：${order.customer.name} (${order.customer.phone})`,
    `地址：${order.customer.address}`,
    `家电：${order.appliance.brand} ${order.appliance.type} ${order.appliance.model}`,
    `故障：${order.appliance.fault}`,
    ``,
    `=== 历史备注 ===`,
    ...order.notes.map(
      (n) => `[${n.createdAt}] ${n.role} - ${n.author}：${n.content}`
    ),
  ];
  return lines.join('\n');
};

export const downloadTextFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
