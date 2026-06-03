import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Clock, FileText, GitCompare, Check, AlertCircle, History, Bell, Plus, CreditCard, Volume2, Route, Package } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge, ChangeTypeBadge, ImpactScopeBadge, PriorityBadge } from '@/components/Badges';
import TableLayout from '@/components/TableLayout';
import MaterialList from '@/components/MaterialList';
import PlanForm from '@/components/PlanForm';
import type { PlanVersion, ConfirmItem } from '@shared/types';

const typeLabels: Record<string, { label: string; icon: string }> = {
  wedding: { label: '婚宴', icon: '💒' },
  annual: { label: '年会', icon: '🏢' },
  birthday: { label: '寿宴', icon: '🎂' },
  other: { label: '其他', icon: '🎉' },
};

const confirmItemLabels: Record<ConfirmItem, { label: string; icon: typeof Check; color: string }> = {
  plan: { label: '方案整体', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  table_cards: { label: '台卡安排', icon: CreditCard, color: 'bg-purple-100 text-purple-700' },
  sound_system: { label: '音响设备', icon: Volume2, color: 'bg-orange-100 text-orange-700' },
  motion_lines: { label: '动线规划', icon: Route, color: 'bg-cyan-100 text-cyan-700' },
  materials: { label: '物资清单', icon: Package, color: 'bg-amber-100 text-amber-700' },
};

export default function BanquetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBanquet, fetchBanquet, clearCurrentBanquet, loading, currentRole, acknowledgeAlert, confirmBanquet } = useAppStore();
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [compareVersion, setCompareVersion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'materials' | 'versions' | 'confirmations'>('layout');
  const [showPlanForm, setShowPlanForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBanquet(id);
    }
    return () => clearCurrentBanquet();
  }, [id, fetchBanquet, clearCurrentBanquet]);

  if (loading && !currentBanquet) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-champagne-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!currentBanquet) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">宴会不存在</h3>
        <Link to="/" className="text-wine-600 hover:text-wine-800">返回列表</Link>
      </div>
    );
  }

  const typeConfig = typeLabels[currentBanquet.type] || typeLabels.other;
  const currentPlan: PlanVersion | undefined = selectedVersion
    ? currentBanquet.versions.find(v => v.version === selectedVersion)
    : currentBanquet.versions[currentBanquet.versions.length - 1];

  const unreadAlerts = currentBanquet.alerts.filter(a => !a.acknowledged && (currentRole === 'kitchen_manager' ? (a.scope === 'kitchen' || a.scope === 'both') : true));

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCompare = () => {
    if (compareVersion !== null) {
      navigate(`/banquet/${currentBanquet.id}/compare?v1=${compareVersion}&v2=${currentBanquet.currentVersion}`);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    const confirmer = currentRole === 'hall_manager' ? '厅面主管' : currentRole === 'kitchen_manager' ? '后厨主管' : '销售经理';
    await acknowledgeAlert(alertId, confirmer);
  };

  const handleConfirmItem = async (item: ConfirmItem) => {
    if (!currentPlan) return;
    const role = currentRole;
    const confirmer = role === 'hall_manager' ? '厅面主管' : role === 'kitchen_manager' ? '后厨主管' : '销售经理';
    await confirmBanquet(currentBanquet.id, {
      version: currentPlan.version,
      role,
      confirmer,
      remark: `确认${confirmItemLabels[item].label}`,
      confirmItem: item,
    });
  };

  const isItemConfirmed = (item: ConfirmItem, role: string) => {
    if (!currentPlan) return false;
    return currentBanquet.confirmRecords.some(
      r => r.version === currentPlan.version && r.confirmItem === item && r.role === role
    );
  };

  const getConfirmableItems = () => {
    if (!currentPlan) return [];
    const items: Array<{ item: ConfirmItem; label: string; icon: typeof Check; allowed: boolean; color: string }> = [];

    if (currentRole === 'sales') {
      items.push({ item: 'plan', label: '方案整体', icon: FileText, allowed: true, color: 'bg-blue-100 text-blue-700' });
    }
    if (currentRole === 'hall_manager') {
      items.push({ item: 'table_cards', label: '台卡安排', icon: CreditCard, allowed: true, color: 'bg-purple-100 text-purple-700' });
      items.push({ item: 'sound_system', label: '音响设备', icon: Volume2, allowed: true, color: 'bg-orange-100 text-orange-700' });
      items.push({ item: 'motion_lines', label: '动线规划', icon: Route, allowed: true, color: 'bg-cyan-100 text-cyan-700' });
      items.push({ item: 'materials', label: '物资清单', icon: Package, allowed: true, color: 'bg-amber-100 text-amber-700' });
    }
    if (currentRole === 'kitchen_manager') {
      items.push({ item: 'materials', label: '备餐物资', icon: Package, allowed: true, color: 'bg-forest-100 text-forest-700' });
    }
    return items;
  };

  const tabs = [
    { key: 'layout', label: '会场方案', icon: MapPin },
    { key: 'materials', label: '物资清单', icon: FileText },
    { key: 'versions', label: '版本历史', icon: History },
    { key: 'confirmations', label: '确认记录', icon: Check },
  ] as const;

  const confirmableItems = getConfirmableItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-wine-700 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>返回列表</span>
        </button>
        <button
          onClick={() => setShowPlanForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-wine-700 to-wine-800 text-white rounded-lg hover:from-wine-800 hover:to-wine-900 transition-all shadow-md hover:shadow-lg text-sm font-medium"
        >
          <Plus size={16} />
          提交新方案
        </button>
      </div>

      {showPlanForm && (
        <PlanForm
          banquetId={currentBanquet.id}
          existingHall={currentBanquet.hall}
          onClose={() => setShowPlanForm(false)}
        />
      )}

      {unreadAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell className="text-red-500 flex-shrink-0 mt-0.5 animate-pulse-slow" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-3">重要变更提醒 ({unreadAlerts.length} 项)</h4>
              <div className="space-y-2">
                {unreadAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between bg-white/70 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <ChangeTypeBadge type={alert.type} />
                      <ImpactScopeBadge scope={alert.scope} />
                      <PriorityBadge priority={alert.priority} />
                      <span className="text-sm text-gray-700">{alert.description}</span>
                    </div>
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="text-sm text-wine-600 hover:text-wine-800 font-medium"
                    >
                      确认收到
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-wine-800 via-wine-700 to-wine-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-champagne-500/10 rounded-full -translate-y-48 translate-x-48"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{typeConfig.icon}</span>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-champagne-500/20 text-champagne-300 text-xs font-medium px-3 py-1 rounded-full">
                    {typeConfig.label}
                  </span>
                  <StatusBadge status={currentBanquet.status} />
                  <span className="text-xs text-champagne-300/80">方案 v{currentBanquet.currentVersion}</span>
                </div>
                <h1 className="font-display text-3xl font-bold mb-2">{currentBanquet.name}</h1>
                <p className="text-champagne-200/90">客户：{currentBanquet.customer} · {currentBanquet.customerContact}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentBanquet.versions.length > 1 && (
                <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                  <select
                    value={compareVersion ?? ''}
                    onChange={(e) => setCompareVersion(e.target.value ? Number(e.target.value) : null)}
                    className="bg-transparent text-white border border-white/30 rounded px-3 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="" className="text-gray-800">选择对比版本</option>
                    {currentBanquet.versions
                      .filter(v => v.version !== currentBanquet.currentVersion)
                      .map(v => (
                        <option key={v.version} value={v.version} className="text-gray-800">
                          v{v.version} - {new Date(v.createdAt).toLocaleDateString('zh-CN')}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleCompare}
                    disabled={compareVersion === null}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-champagne-500 text-wine-900 rounded-lg text-sm font-medium hover:bg-champagne-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <GitCompare size={14} />
                    版本对比
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-champagne-400" />
              </div>
              <div>
                <p className="text-xs text-champagne-200/70">日期</p>
                <p className="font-medium">{new Date(currentBanquet.startTime).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-champagne-400" />
              </div>
              <div>
                <p className="text-xs text-champagne-200/70">时间</p>
                <p className="font-medium">
                  {new Date(currentBanquet.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(currentBanquet.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-champagne-400" />
              </div>
              <div>
                <p className="text-xs text-champagne-200/70">厅房</p>
                <p className="font-medium">{currentBanquet.hall}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-champagne-400" />
              </div>
              <div>
                <p className="text-xs text-champagne-200/70">规模</p>
                <p className="font-medium">{currentBanquet.guestCount}位宾客 · {currentBanquet.tableCount}桌</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentBanquet.specialRequirements && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FileText className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">客户特殊要求</h4>
              <p className="text-amber-700 text-sm">{currentBanquet.specialRequirements}</p>
            </div>
          </div>
        </div>
      )}

      {confirmableItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-champagne-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Check size={18} className="text-wine-700" />
            <h3 className="font-display text-lg font-semibold text-gray-800">确认项（方案 v{currentBanquet.currentVersion}）</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {confirmableItems.map(({ item, label, icon: ItemIcon, color }) => {
              const confirmed = isItemConfirmed(item, currentRole);
              const Icon = confirmed ? Check : ItemIcon;
              return (
                <button
                  key={item}
                  onClick={() => !confirmed && handleConfirmItem(item)}
                  disabled={confirmed}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    confirmed
                      ? 'border-forest-300 bg-forest-50'
                      : 'border-champagne-200 bg-white hover:border-wine-300 hover:bg-wine-50 cursor-pointer'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    confirmed ? 'bg-forest-200 text-forest-700' : color
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${confirmed ? 'text-forest-700' : 'text-gray-800'}`}>{label}</p>
                    <p className="text-xs text-gray-400">
                      {confirmed ? '已确认' : '点击确认'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentBanquet.versions.length > 1 && (
        <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-champagne-100 shadow-sm">
          <span className="text-sm text-gray-600 font-medium">查看版本：</span>
          <div className="flex gap-2 flex-wrap">
            {currentBanquet.versions.map(v => (
              <button
                key={v.version}
                onClick={() => setSelectedVersion(selectedVersion === v.version ? null : v.version)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  (selectedVersion === v.version || (!selectedVersion && v.version === currentBanquet.currentVersion))
                    ? 'bg-wine-700 text-white shadow-md'
                    : 'bg-champagne-50 text-wine-700 hover:bg-champagne-100'
                }`}
              >
                v{v.version}
                {v.version === currentBanquet.currentVersion && ' (当前)'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-champagne-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-wine-600 text-wine-700 bg-wine-50/30'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'layout' && currentPlan && (
            <div className="space-y-6">
              <TableLayout
                tables={currentPlan.tableLayout}
                soundSystem={currentPlan.soundSystem}
                motionLines={currentPlan.motionLines}
                hallName={currentPlan.hall}
              />

              {currentPlan.tableCards.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <CreditCard size={16} />
                    台卡安排
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentPlan.tableCards.map(card => (
                      <span
                        key={card.id}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          card.type === 'vip' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          card.type === 'family' ? 'bg-pink-100 text-pink-800 border border-pink-300' :
                          'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {card.type === 'vip' ? '⭐' : card.type === 'family' ? '👨‍👩‍👧‍👦' : '👤'} {card.content}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentPlan.remark && (
                <div className="bg-champagne-50 rounded-xl p-4 border border-champagne-100">
                  <h4 className="font-semibold text-wine-800 mb-2">方案备注</h4>
                  <p className="text-gray-700">{currentPlan.remark}</p>
                </div>
              )}

              {currentPlan.soundSystem.some(s => s.status === 'missing') && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    设备缺失警告
                  </h4>
                  <div className="space-y-1">
                    {currentPlan.soundSystem
                      .filter(s => s.status === 'missing')
                      .map(s => (
                        <div key={s.id} className="flex items-center gap-2 text-red-700 text-sm">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          {s.name} 设备缺失，请尽快协调
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && currentPlan && (
            <MaterialList
              materials={currentPlan.materials}
              banquetId={currentBanquet.id}
              version={currentPlan.version}
              showKitchen={true}
            />
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-champagne-200"></div>
                <div className="space-y-6">
                  {[...currentBanquet.versions].reverse().map((version, index) => (
                    <div key={version.id} className="relative pl-12">
                      <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-wine-700 text-white' : 'bg-champagne-100 text-wine-700'
                      }`}>
                        {index === 0 ? <Check size={14} /> : version.version}
                      </div>
                      <div className={`bg-white border rounded-xl p-5 ${
                        index === 0 ? 'border-wine-300 shadow-md' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                              方案 v{version.version}
                              {index === 0 && (
                                <span className="text-xs bg-wine-100 text-wine-700 px-2 py-0.5 rounded-full">当前版本</span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDateTime(version.createdAt)} · {version.createdBy}
                            </p>
                          </div>
                          <div className="text-sm text-gray-600">
                            {version.hall} · {version.tableLayout.length}桌
                          </div>
                        </div>
                        <div className="bg-champagne-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-wine-700">变更说明：</span>
                            {version.changeDescription}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>物资 {version.materials.length} 项</span>
                          <span>设备 {version.soundSystem.length} 项</span>
                          <span>台卡 {version.tableCards.length} 项</span>
                          <span>动线 {version.motionLines.length} 条</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'confirmations' && (
            <div className="space-y-4">
              {currentBanquet.confirmRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Check size={48} className="mx-auto mb-3 opacity-30" />
                  <p>暂无确认记录</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentBanquet.confirmRecords.map(record => {
                    const roleLabels: Record<string, { label: string; color: string }> = {
                      sales: { label: '宴会销售', color: 'bg-blue-100 text-blue-700' },
                      hall_manager: { label: '厅面主管', color: 'bg-amber-100 text-amber-700' },
                      kitchen_manager: { label: '后厨主管', color: 'bg-forest-100 text-forest-700' },
                    };
                    const roleConfig = roleLabels[record.role] || roleLabels.sales;
                    const itemConfig = confirmItemLabels[record.confirmItem] || confirmItemLabels.plan;

                    return (
                      <div key={record.id} className="flex items-start gap-4 p-5 bg-champagne-50/50 rounded-xl border border-champagne-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-wine-500 to-wine-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {record.confirmer.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-800">{record.confirmer}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${roleConfig.color}`}>
                              {roleConfig.label}
                            </span>
                            <span className="text-xs text-gray-500">确认 v{record.version}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${itemConfig.color}`}>
                              {record.confirmItem === 'plan' ? '📋' :
                               record.confirmItem === 'table_cards' ? '🪧' :
                               record.confirmItem === 'sound_system' ? '🔊' :
                               record.confirmItem === 'motion_lines' ? '🚶' :
                               record.confirmItem === 'materials' ? '📦' : '📝'}
                              {itemConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{record.remark}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock size={12} />
                            <span>{formatDateTime(record.confirmTime)}</span>
                          </div>
                        </div>
                        <div className="text-forest-600 flex items-center gap-1">
                          <Check size={16} />
                          <span className="text-sm font-medium">已确认</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
