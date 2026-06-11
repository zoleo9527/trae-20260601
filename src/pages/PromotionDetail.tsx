import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  User,
  Clock,
  FileText,
  ShoppingCart,
  Plus
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessStepper } from '@/components/promotion/ProcessStepper';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RoleBadge } from '@/components/common/RoleBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { PROMOTION_TYPES, COUNTERS, BRANDS, ROLE_LABELS } from '@/types';
import { formatDate, formatDateTime, formatCurrency, formatRelativeTime } from '@/utils/format';
import { PromotionService } from '@/services/promotion';

export function PromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { 
    currentRole, 
    promotions, 
    addRecentItem,
    createPromotion,
    updatePromotion,
    processPromotion,
    addRemark,
    addSalesData
  } = useAppStore();

  const promotion = !isNew ? promotions.find(p => p.id === id) : undefined;

  const [formData, setFormData] = useState({
    title: '',
    counter: '',
    brand: '',
    type: '',
    startDate: '',
    endDate: '',
    budget: '',
    description: '',
  });

  const [processingComment, setProcessingComment] = useState('');
  const [remarkContent, setRemarkContent] = useState('');
  const [showRemarkInput, setShowRemarkInput] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [salesData, setSalesData] = useState({
    actualSales: '',
    targetSales: '',
    customerCount: '',
    comment: '',
  });
  const [operatorName, setOperatorName] = useState('');

  useEffect(() => {
    if (promotion && !isNew) {
      addRecentItem(promotion.id, promotion.title);
      setFormData({
        title: promotion.title,
        counter: promotion.counter,
        brand: promotion.brand,
        type: promotion.type,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        budget: promotion.budget.toString(),
        description: promotion.description,
      });
      if (promotion.salesData) {
        setSalesData({
          actualSales: promotion.salesData.actualSales.toString(),
          targetSales: promotion.salesData.targetSales.toString(),
          customerCount: promotion.salesData.customerCount.toString(),
          comment: promotion.salesData.comment,
        });
      }
    }
  }, [promotion, isNew, addRecentItem]);

  if (!isNew && !promotion) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          title="促销单不存在"
          description="您访问的促销单可能已被删除或不存在。"
        />
      </div>
    );
  }

  const canProcess = promotion && PromotionService.canProcess(promotion, currentRole);
  const availableActions = promotion ? PromotionService.getAvailableActions(promotion, currentRole) : [];

  const handleSaveDraft = () => {
    if (!validateForm()) return;
    
    const newPromotion = createPromotion({
      ...formData,
      budget: Number(formData.budget),
      operator: operatorName || '未署名',
    });
    
    navigate(`/promotion/${newPromotion.id}`);
  };

  const handleSubmit = (action: 'submit' | 'approve' | 'reject' | 'complete') => {
    if (!promotion) return;
    
    if (action === 'submit' && !validateForm()) return;

    if (isEditable && action === 'submit') {
      updatePromotion({
        promotionId: promotion.id,
        title: formData.title,
        counter: formData.counter,
        brand: formData.brand,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: Number(formData.budget),
        description: formData.description,
      });
    }
    
    const result = processPromotion({
      promotionId: promotion.id,
      role: currentRole,
      action,
      operator: operatorName || '未署名',
      comment: processingComment,
      remarkContent: remarkContent || undefined,
    });
    
    if (result) {
      setProcessingComment('');
      setRemarkContent('');
      setShowRemarkInput(false);
    }
  };

  const handleAddRemark = () => {
    if (!promotion || !remarkContent.trim()) return;
    
    addRemark({
      promotionId: promotion.id,
      role: currentRole,
      content: remarkContent,
      operator: operatorName || '未署名',
    });
    
    setRemarkContent('');
    setShowRemarkInput(false);
  };

  const handleSaveSalesData = () => {
    if (!promotion) return;
    
    addSalesData({
      promotionId: promotion.id,
      actualSales: Number(salesData.actualSales),
      targetSales: Number(salesData.targetSales),
      customerCount: Number(salesData.customerCount),
      operator: operatorName || '未署名',
      comment: salesData.comment,
    });
    
    setShowSalesForm(false);
  };

  const handleCompleteWithSales = () => {
    handleSaveSalesData();
    handleSubmit('complete');
  };

  const validateForm = () => {
    if (!formData.title.trim()) { alert('请输入活动标题'); return false; }
    if (!formData.counter) { alert('请选择专柜'); return false; }
    if (!formData.brand) { alert('请选择品牌'); return false; }
    if (!formData.type) { alert('请选择活动类型'); return false; }
    if (!formData.startDate) { alert('请选择开始日期'); return false; }
    if (!formData.endDate) { alert('请选择结束日期'); return false; }
    if (!formData.budget || Number(formData.budget) <= 0) { alert('请输入有效预算'); return false; }
    return true;
  };

  const isEditable = isNew || (promotion?.status === 'draft' && currentRole === 'counterManager');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-navy-500">
            {isNew ? '新建促销活动' : (promotion?.title || '促销活动详情')}
          </h1>
          {promotion && (
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={promotion.status} />
              <RoleBadge role={promotion.currentRole} />
              <span className="text-sm text-slate-400">
                更新于 {formatRelativeTime(promotion.updatedAt)}
              </span>
            </div>
          )}
        </div>
        {!isNew && promotion && (
          <Link 
            to={`/sales/${promotion.id}`}
            className="btn btn-secondary gap-2"
          >
            <FileText size={18} />
            查看销售核对
          </Link>
        )}
      </div>

      {promotion && <ProcessStepper promotion={promotion} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-serif text-lg font-semibold text-navy-500 mb-5 flex items-center gap-2">
              <FileText size={20} className="text-amber-500" />
              活动信息
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="label">活动标题 *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={!isEditable}
                  placeholder="如：618年中大促 - 满300减50"
                />
              </div>
              
              <div>
                <label className="label">专柜 *</label>
                <select
                  className="input"
                  value={formData.counter}
                  onChange={(e) => setFormData({ ...formData, counter: e.target.value })}
                  disabled={!isEditable}
                >
                  <option value="">请选择专柜</option>
                  {COUNTERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div>
                <label className="label">品牌 *</label>
                <select
                  className="input"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  disabled={!isEditable}
                >
                  <option value="">请选择品牌</option>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              
              <div>
                <label className="label">活动类型 *</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  disabled={!isEditable}
                >
                  <option value="">请选择类型</option>
                  {PROMOTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              <div>
                <label className="label">预算金额 (元) *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  disabled={!isEditable}
                  placeholder="50000"
                />
              </div>
              
              <div>
                <label className="label">开始日期 *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  disabled={!isEditable}
                />
              </div>
              
              <div>
                <label className="label">结束日期 *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={!isEditable}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="label">活动描述</label>
                <textarea
                  className="input min-h-[100px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isEditable}
                  placeholder="详细描述活动内容、执行要求、注意事项等..."
                />
              </div>
            </div>
            
            {isNew && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">您的姓名</label>
                    <input
                      type="text"
                      className="input"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder="请输入您的姓名"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={handleSaveDraft} className="btn btn-secondary gap-2">
                    <Save size={18} />
                    保存草稿
                  </button>
                </div>
              </div>
            )}
          </div>

          {promotion && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-navy-500 flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-500" />
                    备注记录
                    <span className="text-sm font-normal text-slate-400 ml-2">
                      ({promotion.remarks.length} 条)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 ml-7">
                    💡 所有备注将全程延续，销售核对环节可见
                  </p>
                </div>
                <button
                  onClick={() => setShowRemarkInput(!showRemarkInput)}
                  className="btn btn-secondary text-sm gap-1"
                >
                  <Plus size={16} />
                  添加备注
                </button>
              </div>

              {showRemarkInput && (
                <div className="mb-5 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-600 mb-3 flex items-center gap-1">
                    <MessageSquare size={12} />
                    此备注将自动延续到销售核对环节，所有角色可见
                  </p>
                  <div className="mb-3">
                    <label className="label">您的姓名</label>
                    <input
                      type="text"
                      className="input"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder="请输入您的姓名"
                    />
                  </div>
                  <textarea
                    className="input min-h-[80px] mb-3"
                    value={remarkContent}
                    onChange={(e) => setRemarkContent(e.target.value)}
                    placeholder="如：活动执行细节、库存情况、需销售核对关注的要点等..."
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddRemark} className="btn btn-primary text-sm" disabled={!remarkContent.trim()}>
                      保存备注
                    </button>
                    <button 
                      onClick={() => { setShowRemarkInput(false); setRemarkContent(''); }}
                      className="btn btn-secondary text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {promotion.remarks.length > 0 ? (
                <div className="space-y-4">
                  {promotion.remarks.map((remark, index) => (
                    <div 
                      key={remark.id} 
                      className="flex gap-4 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        remark.role === 'counterManager' ? 'bg-amber-100' :
                        remark.role === 'floorSupervisor' ? 'bg-blue-100' : 'bg-emerald-100'
                      }`}>
                        <User size={18} className={`${
                          remark.role === 'counterManager' ? 'text-amber-600' :
                          remark.role === 'floorSupervisor' ? 'text-blue-600' : 'text-emerald-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <RoleBadge role={remark.role} />
                          <span className="text-xs text-slate-400">
                            {formatDateTime(remark.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
                          {remark.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="暂无备注"
                  description="点击右上角添加备注，这些备注将在销售核对环节可见。"
                />
              )}
            </div>
          )}

          {promotion && (
            <div className="card p-6">
              <h2 className="font-serif text-lg font-semibold text-navy-500 mb-5 flex items-center gap-2">
                <Clock size={20} className="text-purple-500" />
                处理记录
              </h2>
              
              <div className="relative pl-4">
                <div className="timeline-line" />
                <div className="space-y-6">
                  {promotion.steps.map((step, index) => (
                    <div key={step.id} className="relative">
                      <div className={`timeline-dot top-1.5 ${
                        step.action === 'create' ? 'bg-slate-400' :
                        step.action === 'submit' ? 'bg-amber-500' :
                        step.action === 'approve' ? 'bg-emerald-500' :
                        step.action === 'reject' ? 'bg-red-500' : 'bg-purple-500'
                      }`} />
                      <div className="ml-10">
                        <div className="flex items-center gap-2 mb-1">
                          <RoleBadge role={step.role} />
                          <span className="text-sm font-medium text-slate-700">
                            {step.operator}
                          </span>
                          <span className="text-xs text-slate-400">
                            · {formatDateTime(step.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">
                            {step.action === 'create' ? '创建' :
                             step.action === 'submit' ? '提交' :
                             step.action === 'approve' ? '通过' :
                             step.action === 'reject' ? '驳回' : '完成'}
                          </span>
                          {step.comment && `：${step.comment}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {promotion && (promotion.status === 'active' || promotion.status === 'salesPending' || promotion.salesData) && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-base font-semibold text-navy-500 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-purple-500" />
                  销售数据
                </h3>
                {!promotion.salesData && currentRole === 'brandSupervisor' && (
                  <button
                    onClick={() => setShowSalesForm(!showSalesForm)}
                    className="text-xs text-navy-500 hover:text-amber-600"
                  >
                    {showSalesForm ? '收起' : '录入'}
                  </button>
                )}
              </div>

              {showSalesForm && (
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="label">您的姓名</label>
                    <input
                      type="text"
                      className="input"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder="请输入您的姓名"
                    />
                  </div>
                  <div>
                    <label className="label">目标销售 (元)</label>
                    <input
                      type="number"
                      className="input"
                      value={salesData.targetSales}
                      onChange={(e) => setSalesData({ ...salesData, targetSales: e.target.value })}
                      placeholder="400000"
                    />
                  </div>
                  <div>
                    <label className="label">实际销售 (元)</label>
                    <input
                      type="number"
                      className="input"
                      value={salesData.actualSales}
                      onChange={(e) => setSalesData({ ...salesData, actualSales: e.target.value })}
                      placeholder="458600"
                    />
                  </div>
                  <div>
                    <label className="label">客单数</label>
                    <input
                      type="number"
                      className="input"
                      value={salesData.customerCount}
                      onChange={(e) => setSalesData({ ...salesData, customerCount: e.target.value })}
                      placeholder="1286"
                    />
                  </div>
                  <div>
                    <label className="label">销售备注</label>
                    <textarea
                      className="input min-h-[60px]"
                      value={salesData.comment}
                      onChange={(e) => setSalesData({ ...salesData, comment: e.target.value })}
                      placeholder="销售情况说明..."
                    />
                  </div>
                  <div className="flex gap-2">
                    {promotion.status === 'salesPending' ? (
                      <button 
                        onClick={handleCompleteWithSales} 
                        className="btn btn-success text-sm flex-1"
                      >
                        保存并完成
                      </button>
                    ) : (
                      <button 
                        onClick={handleSaveSalesData} 
                        className="btn btn-primary text-sm flex-1"
                      >
                        保存
                      </button>
                    )}
                    <button 
                      onClick={() => setShowSalesForm(false)}
                      className="btn btn-secondary text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {promotion.salesData && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">目标销售</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(promotion.salesData.targetSales)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">实际销售</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(promotion.salesData.actualSales)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">达成率</span>
                    <span className={`font-semibold ${
                      promotion.salesData.actualSales >= promotion.salesData.targetSales 
                        ? 'text-emerald-600' 
                        : 'text-amber-600'
                    }`}>
                      {((promotion.salesData.actualSales / promotion.salesData.targetSales) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        promotion.salesData.actualSales >= promotion.salesData.targetSales 
                          ? 'bg-emerald-500' 
                          : 'bg-amber-500'
                      }`}
                      style={{ 
                        width: `${Math.min((promotion.salesData.actualSales / promotion.salesData.targetSales) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">客单数</span>
                    <span className="font-semibold text-slate-700">
                      {promotion.salesData.customerCount} 单
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">客单价</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(Math.round(promotion.salesData.actualSales / promotion.salesData.customerCount))}
                    </span>
                  </div>
                  {promotion.salesData.comment && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-600">
                        {promotion.salesData.comment}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        — {promotion.salesData.operator}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {promotion && canProcess && (
            <div className="card p-5 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Send size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-navy-500">
                    当前处理
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentRole === 'counterManager' && '提交后将流转至楼层主管审核'}
                    {currentRole === 'floorSupervisor' && '审核通过后将流转至品牌督导确认'}
                    {currentRole === 'brandSupervisor' && promotion.status === 'pendingBrand' && '确认通过后活动正式生效'}
                    {currentRole === 'brandSupervisor' && promotion.status === 'active' && '活动完成后进入销售核对环节'}
                    {currentRole === 'brandSupervisor' && promotion.status === 'salesPending' && '完成后整个流程归档'}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="label">您的姓名 *</label>
                <input
                  type="text"
                  className="input"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="请输入您的姓名"
                />
              </div>
              
              <div className="mb-4">
                <label className="label">处理意见</label>
                <textarea
                  className="input min-h-[80px]"
                  value={processingComment}
                  onChange={(e) => setProcessingComment(e.target.value)}
                  placeholder="请输入处理意见，将记录在流程中..."
                />
              </div>

              <div className="mb-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRemarkInput}
                    onChange={(e) => setShowRemarkInput(e.target.checked)}
                    className="rounded border-slate-300 text-navy-500 focus:ring-navy-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-slate-700 font-medium">同时添加备注</span>
                    <p className="text-xs text-blue-600 mt-0.5">
                      💡 此备注将延续到销售核对环节，便于后续追溯
                    </p>
                  </div>
                </label>
                {showRemarkInput && (
                  <textarea
                    className="input min-h-[60px] mt-3"
                    value={remarkContent}
                    onChange={(e) => setRemarkContent(e.target.value)}
                    placeholder="如：需要销售核对时关注库存损耗、客流异常等情况..."
                  />
                )}
              </div>
              
              <div className="space-y-2">
                {availableActions.includes('submit') && (
                  <button 
                    onClick={() => handleSubmit('submit')} 
                    className="btn btn-amber w-full gap-2"
                  >
                    <Send size={16} />
                    提交主管审核
                  </button>
                )}
                {availableActions.includes('approve') && currentRole === 'floorSupervisor' && (
                  <button 
                    onClick={() => handleSubmit('approve')} 
                    className="btn btn-success w-full gap-2"
                  >
                    <CheckCircle size={16} />
                    通过并流转至督导
                  </button>
                )}
                {availableActions.includes('approve') && currentRole === 'brandSupervisor' && (
                  <button 
                    onClick={() => handleSubmit('approve')} 
                    className="btn btn-success w-full gap-2"
                  >
                    <CheckCircle size={16} />
                    确认通过，活动生效
                  </button>
                )}
                {availableActions.includes('reject') && (
                  <button 
                    onClick={() => handleSubmit('reject')} 
                    className="btn btn-danger w-full gap-2"
                  >
                    <XCircle size={16} />
                    驳回到上一环节
                  </button>
                )}
                {availableActions.includes('complete') && promotion.status === 'active' && (
                  <button 
                    onClick={() => {
                      processPromotion({
                        promotionId: promotion.id,
                        role: currentRole,
                        action: 'complete',
                        operator: operatorName || '未署名',
                        comment: processingComment || '活动执行完成，待录入销售数据',
                      });
                      setProcessingComment('');
                    }} 
                    className="btn btn-primary w-full gap-2"
                  >
                    <CheckCircle size={16} />
                    标记活动完成，进入销售核对
                  </button>
                )}
                {availableActions.includes('complete') && promotion.status === 'salesPending' && promotion.salesData && (
                  <button 
                    onClick={() => handleSubmit('complete')} 
                    className="btn btn-success w-full gap-2"
                  >
                    <CheckCircle size={16} />
                    完成销售核对，归档
                  </button>
                )}
                {availableActions.includes('complete') && promotion.status === 'salesPending' && !promotion.salesData && (
                  <p className="text-sm text-amber-600 text-center p-3 bg-amber-50 rounded-lg">
                    ⚠️ 请先在左侧录入销售数据后再完成核对
                  </p>
                )}
              </div>
            </div>
          )}

          {promotion && !canProcess && promotion.status !== 'completed' && (
            <div className="card p-5 bg-amber-50 border-amber-200">
              <h3 className="font-serif text-base font-semibold text-amber-700 mb-2">
                等待处理
              </h3>
              <p className="text-sm text-amber-600">
                当前需由 <RoleBadge role={promotion.currentRole} /> 处理。
                切换角色后可继续操作。
              </p>
            </div>
          )}

          {promotion && promotion.status === 'completed' && (
            <div className="card p-5 bg-emerald-50 border-emerald-200">
              <h3 className="font-serif text-base font-semibold text-emerald-700 mb-2">
                已完成
              </h3>
              <p className="text-sm text-emerald-600">
                此促销活动已完成全部流程，可在销售核对中查看完整记录。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
