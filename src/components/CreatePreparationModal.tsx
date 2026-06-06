import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface CreatePreparationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface SkuItem {
  sku: string;
  skuName: string;
  quantity: string;
}

const warehouseOptions = [
  { name: '美国洛杉矶仓', code: 'WH_US_LA' },
  { name: '德国法兰克福仓', code: 'WH_DE_FR' },
  { name: '日本东京仓', code: 'WH_JP_TK' },
  { name: '英国伦敦仓', code: 'WH_UK_LN' },
];

export const CreatePreparationModal: React.FC<CreatePreparationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [warehouse, setWarehouse] = useState('');
  const [items, setItems] = useState<SkuItem[]>([{ sku: '', skuName: '', quantity: '' }]);
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setWarehouse('');
      setItems([{ sku: '', skuName: '', quantity: '' }]);
      setRemark('');
      setErrors({});
    }
  }, [visible]);

  const handleAddItem = () => {
    setItems([...items, { sku: '', skuName: '', quantity: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof SkuItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!warehouse) {
      newErrors.warehouse = '请选择仓库';
    }

    const validItems = items.filter((item) => item.sku.trim() || item.skuName.trim() || item.quantity.trim());
    
    if (validItems.length === 0) {
      newErrors.items = '至少添加一行SKU明细';
    } else {
      validItems.forEach((item, index) => {
        if (!item.sku.trim()) {
          newErrors[`sku_${index}`] = 'SKU编码不能为空';
        }
        if (!item.quantity.trim()) {
          newErrors[`quantity_${index}`] = '数量不能为空';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const selectedWarehouse = warehouseOptions.find((w) => w.name === warehouse);
    const validItems = items.filter((item) => item.sku.trim() && item.quantity.trim());
    const totalQuantity = validItems.reduce((sum, item) => sum + parseInt(item.quantity) || 0, 0);

    const submitData = {
      warehouseCode: selectedWarehouse?.code || '',
      warehouseName: warehouse,
      items: validItems.map((item) => ({
        sku: item.sku.trim(),
        skuName: item.skuName.trim(),
        quantity: parseInt(item.quantity) || 0,
        unitPrice: 0,
      })),
      remark: remark.trim(),
      totalQuantity,
      totalAmount: 0,
    };

    onSubmit(submitData);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">新建备货单</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仓库选择 <span className="text-red-500">*</span>
              </label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.warehouse ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">请选择仓库</option>
                {warehouseOptions.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
              {errors.warehouse && (
                <p className="mt-1 text-sm text-red-500">{errors.warehouse}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  SKU明细 <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加SKU
                </button>
              </div>
              {errors.items && (
                <p className="mb-2 text-sm text-red-500">{errors.items}</p>
              )}
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                        SKU编码
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                        SKU名称
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                        数量
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.sku}
                            onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                            placeholder="请输入SKU编码"
                            className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`sku_${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`sku_${index}`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`sku_${index}`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.skuName}
                            onChange={(e) => handleItemChange(index, 'skuName', e.target.value)}
                            placeholder="请输入SKU名称"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            placeholder="数量"
                            min="1"
                            className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`quantity_${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`quantity_${index}`] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`quantity_${index}`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className={`p-1.5 rounded transition-colors ${
                              items.length <= 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入备注信息"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
};
