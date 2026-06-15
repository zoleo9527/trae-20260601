import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useStore';
import { X, Plus, Trash2, Download, Upload, CheckCircle } from 'lucide-react';

const BatchEntryModal: React.FC = () => {
  const { showBatchEntry, setShowBatchEntry, batchCreateOrders } = useAppStore();

  interface BatchRow {
    id: string;
    customerName: string;
    customerPhone: string;
    address: string;
    productType: string;
    productModel: string;
    appointmentDate: string;
    appointmentTime: string;
    priority: 'normal' | 'urgent' | 'vip';
    remarks: string;
  }

  const createEmptyRow = (): BatchRow => ({
    id: crypto.randomUUID(),
    customerName: '',
    customerPhone: '',
    address: '',
    productType: '',
    productModel: '',
    appointmentDate: '',
    appointmentTime: '',
    priority: 'normal',
    remarks: '',
  });

  const [rows, setRows] = useState<BatchRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  const lastInputRef = useRef<HTMLInputElement>(null);

  const handleRowChange = (id: string, field: keyof BatchRow, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows((prev) => prev.filter((row) => row.id !== id));
    }
  };

  const handleSubmit = () => {
    const validRows = rows.filter(
      (row) => row.customerName && row.customerPhone && row.appointmentDate
    );

    if (validRows.length > 0) {
      batchCreateOrders(validRows);
      setShowBatchEntry(false);
      setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    }
  };

  const validCount = rows.filter(
    (row) => row.customerName && row.customerPhone && row.appointmentDate
  ).length;

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, fieldIndex: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const fields = [
        'customerName',
        'customerPhone',
        'address',
        'productType',
        'productModel',
        'appointmentDate',
        'appointmentTime',
        'priority',
        'remarks',
      ];

      let nextFieldIndex = fieldIndex + 1;
      let nextRowIndex = rowIndex;

      if (nextFieldIndex >= fields.length) {
        nextFieldIndex = 0;
        nextRowIndex = rowIndex + 1;

        if (nextRowIndex >= rows.length) {
          addRow();
        }
      }

      setTimeout(() => {
        const inputs = document.querySelectorAll('.batch-input');
        const targetIndex = nextRowIndex * fields.length + nextFieldIndex;
        const target = inputs[targetIndex] as HTMLInputElement;
        if (target) {
          target.focus();
        }
      }, 10);
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const fields = 9;
      const nextRowIndex = rowIndex + 1;
      if (nextRowIndex < rows.length) {
        setTimeout(() => {
          const inputs = document.querySelectorAll('.batch-input');
          const targetIndex = nextRowIndex * fields + fieldIndex;
          const target = inputs[targetIndex] as HTMLInputElement;
          if (target) {
            target.focus();
          }
        }, 10);
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const fields = 9;
      const prevRowIndex = rowIndex - 1;
      if (prevRowIndex >= 0) {
        setTimeout(() => {
          const inputs = document.querySelectorAll('.batch-input');
          const targetIndex = prevRowIndex * fields + fieldIndex;
          const target = inputs[targetIndex] as HTMLInputElement;
          if (target) {
            target.focus();
          }
        }, 10);
      }
    }
  };

  if (!showBatchEntry) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowBatchEntry(false)}>
      <div
        className="modal-content"
        style={{ width: '95vw', maxWidth: '1200px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="modal-title">批量录入安装预约</div>
            <div className="text-xs text-muted mt-1">
              支持快捷键：Enter 下移一格、方向键上下移动
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowBatchEntry(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body p-4">
          <div className="flex items-center gap-3 mb-3">
            <button className="btn btn-secondary btn-sm" onClick={addRow}>
              <Plus size={14} />
              添加一行
            </button>
            <button className="btn btn-secondary btn-sm">
              <Upload size={14} />
              导入Excel
            </button>
            <button className="btn btn-secondary btn-sm">
              <Download size={14} />
              导出模板
            </button>
            <div className="text-sm text-muted ml-auto">
              有效记录：
              <span className="font-semibold text-primary">{validCount}</span> / {rows.length}
            </div>
          </div>

          <div
            className="border rounded-lg overflow-auto"
            style={{ maxHeight: '500px' }}
          >
            <table className="batch-entry-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>客户姓名 *</th>
                  <th>联系电话 *</th>
                  <th>安装地址</th>
                  <th>产品类型</th>
                  <th>产品型号</th>
                  <th style={{ width: '130px' }}>预约日期 *</th>
                  <th style={{ width: '110px' }}>预约时间</th>
                  <th style={{ width: '80px' }}>优先级</th>
                  <th>备注</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.id} className="batch-entry-row">
                    <td className="text-center text-muted text-xs">{rowIndex + 1}</td>
                    <td>
                      <input
                        className="batch-input"
                        placeholder="输入姓名"
                        value={row.customerName}
                        onChange={(e) => handleRowChange(row.id, 'customerName', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                      />
                    </td>
                    <td>
                      <input
                        className="batch-input"
                        placeholder="输入电话"
                        value={row.customerPhone}
                        onChange={(e) => handleRowChange(row.id, 'customerPhone', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                      />
                    </td>
                    <td>
                      <input
                        className="batch-input"
                        placeholder="输入地址"
                        value={row.address}
                        onChange={(e) => handleRowChange(row.id, 'address', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 2)}
                      />
                    </td>
                    <td>
                      <input
                        className="batch-input"
                        placeholder="如：智能马桶"
                        value={row.productType}
                        onChange={(e) => handleRowChange(row.id, 'productType', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 3)}
                      />
                    </td>
                    <td>
                      <input
                        className="batch-input"
                        placeholder="型号"
                        value={row.productModel}
                        onChange={(e) => handleRowChange(row.id, 'productModel', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 4)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="batch-input"
                        value={row.appointmentDate}
                        onChange={(e) => handleRowChange(row.id, 'appointmentDate', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 5)}
                      />
                    </td>
                    <td>
                      <input
                        className="batch-input"
                        placeholder="如：09:00-11:00"
                        value={row.appointmentTime}
                        onChange={(e) => handleRowChange(row.id, 'appointmentTime', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 6)}
                      />
                    </td>
                    <td>
                      <select
                        className="batch-input"
                        style={{ padding: '4px 6px', fontSize: '12px' }}
                        value={row.priority}
                        onChange={(e) => handleRowChange(row.id, 'priority', e.target.value)}
                      >
                        <option value="normal">普通</option>
                        <option value="urgent">加急</option>
                        <option value="vip">VIP</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="batch-input"
                        placeholder="备注"
                        value={row.remarks}
                        onChange={(e) => handleRowChange(row.id, 'remarks', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 8)}
                      />
                    </td>
                    <td className="text-center">
                      <button
                        className="remove-row-btn text-muted hover:text-danger"
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">快捷填写提示</div>
            <div className="text-xs text-muted grid grid-cols-2 gap-2">
              <div>• 按 Enter 键快速移动到下一个输入框</div>
              <div>• 按上下方向键在同行列间移动</div>
              <div>• 带 * 号的为必填项</div>
              <div>• 支持从 Excel 复制粘贴批量导入</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowBatchEntry(false)}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={validCount === 0}
          >
            <CheckCircle size={16} />
            确认录入 ({validCount} 条)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchEntryModal;
