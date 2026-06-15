import { useState } from 'react';
import { Package, Search, AlertTriangle, Plus, X, Minus, PlusCircle } from 'lucide-react';
import { PartsInventory as PartsType } from '../types';
import { partsAPI } from '../api';

interface PartsInventoryProps {
  parts: PartsType[];
  onUpdate: () => void;
}

export function PartsInventory({ parts, onUpdate }: PartsInventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartsType | null>(null);
  const [issueForm, setIssueForm] = useState({
    quantity: 1,
    recipient: '',
    purpose: '',
  });

  const filteredParts = parts.filter(part => 
    part.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLowStock = (part: PartsType) => part.quantity <= part.minStock;

  const handleIssue = async () => {
    if (!selectedPart || issueForm.quantity <= 0) return;
    
    await partsAPI.issue(selectedPart.id, issueForm.quantity, issueForm.recipient, issueForm.purpose);
    setShowIssueModal(false);
    setSelectedPart(null);
    setIssueForm({ quantity: 1, recipient: '', purpose: '' });
    onUpdate();
  };

  const openIssueModal = (part: PartsType) => {
    setSelectedPart(part);
    setShowIssueModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">配件库存</h1>
          <p className="text-gray-500 mt-1">管理配件库存和发放记录</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="搜索配件编号、名称..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">配件编号</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">名称/品牌</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">适用型号</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">库存数量</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">最低库存</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">位置</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">单价</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map(part => (
                <tr key={part.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isLowStock(part) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-primary-600">{part.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{part.name} / {part.brand}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{part.model}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isLowStock(part) ? 'text-red-600' : 'text-gray-800'}`}>
                        {part.quantity}
                      </span>
                      <span className="text-gray-500 text-sm">{part.unit}</span>
                      {isLowStock(part) && (
                        <AlertTriangle className="w-4 h-4 text-red-500" title="库存不足" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{part.minStock} {part.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{part.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">¥{part.price}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openIssueModal(part)}
                      disabled={part.quantity === 0}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3 h-3" />
                      发放
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showIssueModal && selectedPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">发放配件</h2>
              <button
                onClick={() => { setShowIssueModal(false); setSelectedPart(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{selectedPart.name}</p>
                  <p className="text-sm text-gray-500">编号: {selectedPart.code} | 当前库存: {selectedPart.quantity} {selectedPart.unit}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发放数量</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIssueForm({ ...issueForm, quantity: Math.max(1, issueForm.quantity - 1) })}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={issueForm.quantity}
                    onChange={(e) => setIssueForm({ ...issueForm, quantity: Math.min(selectedPart.quantity, Math.max(1, parseInt(e.target.value) || 1)) })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-center"
                    min={1}
                    max={selectedPart.quantity}
                  />
                  <button
                    onClick={() => setIssueForm({ ...issueForm, quantity: Math.min(selectedPart.quantity, issueForm.quantity + 1) })}
                    className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">领取人</label>
                <input
                  type="text"
                  value={issueForm.recipient}
                  onChange={(e) => setIssueForm({ ...issueForm, recipient: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="输入领取人姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用途</label>
                <input
                  type="text"
                  value={issueForm.purpose}
                  onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="如：设备CPCD30-001保养"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowIssueModal(false); setSelectedPart(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleIssue}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                <Minus className="w-4 h-4" />
                确认发放
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
