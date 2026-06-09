import { useState, useEffect } from 'react';
import { useStore } from '../stores/appStore';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export default function SalesNew() {
  const navigate = useNavigate();
  const { currentUser, pesticides, customers, inventory, createSale, submitSale, error, clearError } = useStore();

  const [formData, setFormData] = useState({
    customerId: '',
    isCredit: false,
    items: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [creditWarning, setCreditWarning] = useState(null);

  const totalAmount = formData.items.reduce((sum, item) => sum + item.subtotal, 0);

  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { pesticideId: '', quantity: 1, unitPrice: 0, subtotal: 0 }],
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      if (field === 'pesticideId') {
        const pesticide = pesticides.find(p => p.id === value);
        if (pesticide) {
          newItems[index].unitPrice = 10; // 默认价格
        }
      }

      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].subtotal = newItems[index].quantity * newItems[index].unitPrice;
      }

      return { ...prev, items: newItems };
    });
  };

  const handleCustomerChange = async (customerId) => {
    setFormData(prev => ({ ...prev, customerId }));

    if (formData.isCredit && customerId) {
      const status = await useStore.getState().checkCustomerOverdue(customerId);
      if (status.hasOverdue) {
        setCreditWarning({
          message: `该客户有 ${status.count} 笔逾期赊账，合计 ${status.totalDue} 元`,
          status,
        });
      } else {
        setCreditWarning(null);
      }
    }
  };

  const handleSubmit = async (e, submitNow = false) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('请选择客户');
      return;
    }

    if (formData.items.length === 0) {
      alert('请添加至少一个农药');
      return;
    }

    for (const item of formData.items) {
      if (!item.pesticideId || !item.quantity) {
        alert('请完善农药信息');
        return;
      }
    }

    if (creditWarning && !confirm(creditWarning.message + '，是否继续？')) {
      return;
    }

    setSubmitting(true);

    try {
      const sale = await createSale({
        customerId: formData.customerId,
        createdBy: currentUser.id,
        isCredit: formData.isCredit,
        items: formData.items,
      });

      if (submitNow) {
        await submitSale(sale.id, currentUser.id);
        alert('销售单已提交！');
      } else {
        alert('销售单已保存为草稿');
      }

      navigate('/sales/list');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStockInfo = (pesticideId) => {
    const inv = inventory.find(i => i.pesticide_id === pesticideId);
    return inv ? `${inv.quantity} ${inv.unit}` : '无库存';
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">新建销售单</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">客户信息</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择客户 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">请选择客户</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支付方式
                </label>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.isCredit}
                      onChange={() => setFormData(prev => ({ ...prev, isCredit: false }))}
                      className="w-4 h-4 text-primary"
                    />
                    <span>现结</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.isCredit}
                      onChange={() => setFormData(prev => ({ ...prev, isCredit: true }))}
                      className="w-4 h-4 text-primary"
                    />
                    <span>赊账</span>
                  </label>
                </div>
              </div>
            </div>

            {creditWarning && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-red-800">赊账逾期警告</p>
                  <p className="text-sm text-red-600 mt-1">{creditWarning.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">农药明细</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus size={18} />
                添加农药
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                暂无农药，请点击上方按钮添加
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg">
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">农药</label>
                      <select
                        value={item.pesticideId}
                        onChange={(e) => updateItem(index, 'pesticideId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      >
                        <option value="">选择农药</option>
                        {pesticides.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">数量</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">单价</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">小计</label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                        ¥{item.subtotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {item.pesticideId && (
                      <div className="col-span-12 text-xs text-gray-400">
                        当前库存：{getStockInfo(item.pesticideId)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-6 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-500">订单总金额</p>
                <p className="text-3xl font-bold text-primary">¥{totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/sales/list')}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={submitting}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              保存草稿
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={submitting}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交审核'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
