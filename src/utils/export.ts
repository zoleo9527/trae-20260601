import * as XLSX from 'xlsx';
import type { Order } from '../types/order';

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
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 25 },
    { wch: 10 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 18 },
    { wch: 8 },
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
