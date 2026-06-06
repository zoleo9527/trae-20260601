import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import { useSupplyStore } from '@/store/useSupplyStore';
import { useUserStore } from '@/store/useUserStore';
import StatusTag from '@/components/StatusTag/StatusTag';
import Modal from '@/components/Modal/Modal';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatAnimalType, formatCurrency } from '@/utils/format';
import { SupplyUsage, SupplyItem } from '@/types';
import {
  ArrowLeft,
  Package,
  Search,
  Plus,
  Send,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Home,
  Clock,
  User
} from 'lucide-react';

export default function SupplyUsagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const caseData = useCaseStore((state) => state.getCaseById(id || ''));
  const fosterRecords = useCaseStore((state) => state.getFosterRecordsByCaseId(id || ''));
  const supplyUsages = useCaseStore((state) => state.getSupplyUsagesByCaseId(id || ''));
  const addSupplyUsage = useCaseStore((state) => state.addSupplyUsage);
  const addTimelineEvent = useCaseStore((state) => state.addTimelineEvent);
  const supplyItems = useSupplyStore((state) => state.items);
  const searchItems = useSupplyStore((state) => state.searchItems);
  const currentUser = useUserStore((state) => state.currentUser);
  const getUserName = useUserStore((state) => state.getUserName);

  const [showUsageModal, setShowUsageModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedItem, setSelectedItem] = useState<SupplyItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [usageReason, setUsageReason] = useState('');

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-warm-500">个案不存在</p>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
          返回工作台
        </button>
      </div>
    );
  }

  const activeFoster = fosterRecords.find(f => f.status === 'active');
  const filteredItems = searchKeyword ? searchItems(searchKeyword) : supplyItems;

  const handleSubmitUsage = () => {
    if (!selectedItem || !usageReason) return;

    const newUsage: SupplyUsage = {
      id: `su_${Date.now()}`,
      caseId: caseData.id,
      supplyItemId: selectedItem.id,
      supplyName: selectedItem.name,
      quantity,
      unit: selectedItem.unit,
      usageReason,
      fosterJudgmentRef: activeFoster?.keyJudgment || '',
      requestedBy: currentUser.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    addSupplyUsage(newUsage);
    addTimelineEvent({
      id: `te_${Date.now()}`,
      caseId: caseData.id,
      type: 'supply',
      title: '物资领用申请',
      description: `申请领用${selectedItem.name} ${quantity}${selectedItem.unit}，原因：${usageReason}`,
      operator: currentUser.id,
      timestamp: new Date().toISOString(),
    });

    setShowUsageModal(false);
    setSelectedItem(null);
    setQuantity(1);
    setUsageReason('');
    setSearchKeyword('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`/case/${id}`)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-warm-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-warm-800 font-serif">物资领用</h1>
          <p className="text-warm-500 mt-1">
            {caseData.animalName} · {caseData.caseNo} · {formatAnimalType(caseData.animalType)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {activeFoster && (
            <div className="card p-6 bg-gradient-to-r from-primary-50 to-amber-50 border-primary-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-warm-800 mb-2 flex items-center gap-2">
                    寄养关键判断
                    <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded">
                      来自寄养安排
                    </span>
                  </h3>
                  <p className="text-warm-700 bg-white/60 p-3 rounded-lg">
                    {activeFoster.keyJudgment}
                  </p>
                  <p className="text-xs text-warm-500 mt-2 flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    寄养家庭：{activeFoster.fosterFamilyName}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title mb-0">领用记录</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowUsageModal(true)}
              >
                <Plus className="w-4 h-4" />
                申请领用
              </button>
            </div>

            {supplyUsages.length > 0 ? (
              <div className="space-y-3">
                {supplyUsages.map((usage) => (
                  <div key={usage.id} className="p-4 bg-warm-50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Package className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-warm-800">{usage.supplyName}</h4>
                          <p className="text-sm text-warm-500">
                            数量：{usage.quantity} {usage.unit}
                          </p>
                        </div>
                      </div>
                      <StatusTag type="supply" status={usage.status} />
                    </div>
                    <p className="text-sm text-warm-600 mb-2">
                      <span className="text-warm-400">用途：</span>{usage.usageReason}
                    </p>
                    {usage.fosterJudgmentRef && (
                      <div className="bg-primary-50 p-2 rounded-lg text-sm text-primary-700 mb-2">
                        <span className="text-primary-500 font-medium">关联寄养判断：</span>
                        {usage.fosterJudgmentRef}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-warm-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          申请人：{getUserName(usage.requestedBy)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(usage.createdAt)}
                        </span>
                      </div>
                      {usage.approvedBy && (
                        <span>审批人：{getUserName(usage.approvedBy)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-warm-300 mx-auto mb-3" />
                <p className="text-warm-500">暂无领用记录</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">库存概览</h3>
            <div className="space-y-3">
              {supplyItems.slice(0, 5).map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-warm-400'}`} />
                      <span className="text-sm text-warm-700">{item.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${isLow ? 'text-red-600' : 'text-warm-600'}`}>
                      {item.stock} {item.unit}
                      {isLow && <span className="ml-1 text-xs">库存不足</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">领用须知</h3>
            <div className="space-y-3 text-sm text-warm-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>领用物资前请参考上方寄养关键判断，确保物资匹配需求</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>领用申请提交后需物资管理员审批，审批通过后方可领取</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>特殊物资（如处方药品）需兽医确认后方可领用</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">快捷跳转</h3>
            <div className="space-y-2">
              <Link to={`/case/${id}/foster`} className="flex items-center justify-between p-3 rounded-lg hover:bg-warm-50 transition-colors">
                <span className="text-warm-700">查看寄养安排</span>
                <span className="text-warm-400">→</span>
              </Link>
              <Link to={`/case/${id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-warm-50 transition-colors">
                <span className="text-warm-700">返回个案详情</span>
                <span className="text-warm-400">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showUsageModal}
        onClose={() => setShowUsageModal(false)}
        title="申请物资领用"
        size="xl"
      >
        <div className="space-y-4">
          {activeFoster && (
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
              <p className="text-sm text-primary-700 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>寄养关键判断参考：</strong>
                  {activeFoster.keyJudgment}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="label">搜索物资</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="输入物资名称或分类搜索..."
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">选择物资 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isLow = item.stock <= item.minStock;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-warm-100 hover:border-warm-200'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-warm-800">{item.name}</span>
                      <span className={`text-xs ${isLow ? 'text-red-500' : 'text-warm-500'}`}>
                        库存：{item.stock}{item.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-warm-500">{item.category}</span>
                      <span className="text-xs text-warm-400">{formatCurrency(item.unitPrice)}/{item.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedItem && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">领用数量 <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={selectedItem.stock}
                    className="input"
                  />
                  <span className="text-warm-500">{selectedItem.unit}</span>
                </div>
              </div>
              <div>
                <label className="label">预计费用</label>
                <div className="input bg-warm-50">
                  {formatCurrency(selectedItem.unitPrice * quantity)}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label">领用用途 <span className="text-red-500">*</span></label>
            <textarea
              value={usageReason}
              onChange={(e) => setUsageReason(e.target.value)}
              placeholder="请详细填写领用用途，便于审批..."
              className="input min-h-[80px] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
            <button 
              className="btn btn-outline"
              onClick={() => setShowUsageModal(false)}
            >
              取消
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSubmitUsage}
              disabled={!selectedItem || !usageReason}
            >
              <Send className="w-4 h-4" />
              提交申请
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
