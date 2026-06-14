import { useState, useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { ConsultationList } from './components/ConsultationList';
import { ConsultationDetail } from './components/ConsultationDetail';
import { Dashboard } from './components/Dashboard';
import { DocumentListPage } from './components/DocumentListPage';
import {
  CreateConsultationModal,
  AddDocumentModal,
  BatchCreateModal,
} from './components/Modals';
import { Plus, Upload, LayoutDashboard } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);

  const {
    loadUsers,
    loadConsultations,
    currentDetail,
    loadDetail,
    clearDetail,
    consultations,
    loadDashboardStats,
    currentUser,
  } = useAppStore();

  useEffect(() => {
    loadUsers();
    loadConsultations();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDashboardStats();
    }
  }, [currentUser, loadDashboardStats]);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    loadDetail(id);
    setShowDetail(true);
    setActiveTab('list');
  };

  const handleBack = () => {
    setShowDetail(false);
    clearDetail();
  };

  const handleStatusChange = () => {
    loadConsultations();
    loadDashboardStats();
    if (currentDetail) {
      loadDetail(currentDetail.consultation.id);
    }
  };

  if (activeTab === 'dashboard') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <LayoutDashboard size={22} className="text-blue-600" />
                工作台
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                快速掌握咨询受理进度与资料清单完成情况
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                新建咨询
              </button>
              <button
                onClick={() => {
                  setActiveTab('batch');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Upload size={16} />
                批量录入
              </button>
            </div>
          </header>

          <Dashboard onSelectConsultation={handleSelect} />
        </div>

        <CreateConsultationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        <BatchCreateModal
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
        />
      </div>
    );
  }

  if (activeTab === 'users') {
    return <UsersPage activeTab={activeTab} onTabChange={setActiveTab} />;
  }

  if (activeTab === 'batch') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">批量录入</h1>
              <p className="text-sm text-gray-500 mt-1">
                适合高频录入咨询，可一次创建多条记录
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                新建咨询
              </button>
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Upload size={16} />
                批量录入
              </button>
            </div>
          </header>

          <BatchEntryPage />
        </div>

        <CreateConsultationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        <BatchCreateModal
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
        />
      </div>
    );
  }

  if (activeTab === 'documents') {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">资料清单</h1>
              <p className="text-sm text-gray-500 mt-1">
                查看所有资料项的进度，支持批量操作和快捷筛选
              </p>
            </div>
          </header>

          <DocumentListPage onSelectConsultation={handleSelect} />
        </div>

        <AddDocumentModal
          isOpen={showAddDocModal}
          onClose={() => setShowAddDocModal(false)}
          consultationId={currentDetail?.consultation.id || 0}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {showDetail ? '咨询详情' : '咨询受理列表'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {showDetail ? '查看咨询详情，处理流程和资料清单' : `共 ${consultations.length} 条记录`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!showDetail && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                新建咨询
              </button>
            )}
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Upload size={16} />
              批量录入
            </button>
          </div>
        </header>

        {activeTab === 'list' && !showDetail && (
          <>
            <FilterBar />
            <div className="flex-1 overflow-hidden">
              <ConsultationList
                onSelect={handleSelect}
                selectedId={selectedId}
              />
            </div>
          </>
        )}

        {activeTab === 'list' && showDetail && (
          <ConsultationDetail
            onBack={handleBack}
            onStatusChange={handleStatusChange}
            onAddDocument={() => setShowAddDocModal(true)}
          />
        )}
      </div>

      <CreateConsultationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <AddDocumentModal
        isOpen={showAddDocModal}
        onClose={() => setShowAddDocModal(false)}
        consultationId={currentDetail?.consultation.id || 0}
      />

      <BatchCreateModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
      />
    </div>
  );
}

function BatchEntryPage() {
  const { batchCreate, users, loadConsultations, loadDashboardStats } = useAppStore();
  const [count, setCount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerateDemo = async () => {
    setSubmitting(true);
    setResult(null);

    try {
      const clients = ['华润集团', '万科地产', '华为技术', '腾讯科技', '阿里巴巴', '字节跳动', '京东集团', '百度在线', '美团点评', '小米科技', '网易公司', '比亚迪股份', '宁德时代', '中国移动', '平安保险'];
      const taxTypes = ['增值税', '企业所得税', '个人所得税', '土地增值税', '房产税', '印花税', '契税', '其他'];
      const descriptions = [
        '年度汇算清缴咨询',
        '税务筹划方案制定',
        '股权转让税务处理',
        '研发费用加计扣除',
        '资产损失税前扣除',
        '关联交易同期资料',
        '税务稽查应对',
        '税收优惠申请',
        '跨境税务咨询',
        '并购重组税务规划',
        '出口退税咨询',
        '增值税进项抵扣',
        '发票合规性审查',
        '股权激励税务处理',
        '土地增值税清算',
      ];

      const consultants = users.filter((u) => u.role === 'consultant');
      const managers = users.filter((u) => u.role === 'project_manager');
      const finances = users.filter((u) => u.role === 'client_finance');

      const items = Array.from({ length: count }, () => ({
        clientName: clients[Math.floor(Math.random() * clients.length)],
        taxType: taxTypes[Math.floor(Math.random() * taxTypes.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        consultantId: consultants.length > 0 ? consultants[Math.floor(Math.random() * consultants.length)].id : undefined,
        projectManagerId: managers.length > 0 ? managers[Math.floor(Math.random() * managers.length)].id : undefined,
        clientFinanceId: finances.length > 0 ? finances[Math.floor(Math.random() * finances.length)].id : undefined,
        deadline: new Date(Date.now() + (Math.random() - 0.3) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: [1, 2, 3][Math.floor(Math.random() * 3)] as 1 | 2 | 3,
        amount: Math.random() > 0.5 ? Math.floor(Math.random() * 100000) + 1000 : undefined,
        remarks: Math.random() > 0.7 ? '客户要求本周内给出初步方案' : undefined,
      }));

      const result = await batchCreate(items);
      setResult(`成功创建 ${result.length} 条咨询记录`);
      loadConsultations();
      loadDashboardStats();
    } catch (error) {
      setResult('创建失败: ' + String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">快速批量录入（演示）</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生成记录数量
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4 p-4 bg-yellow-50 rounded text-sm text-yellow-700">
            <p>此功能用于演示，将生成随机的咨询记录。实际使用时，可从Excel导入或粘贴数据。</p>
          </div>

          <button
            onClick={handleGenerateDemo}
            disabled={submitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? '创建中...' : '生成演示数据'}
          </button>

          {result && (
            <div
              className={`mt-4 p-4 rounded ${
                result.includes('成功')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {result}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">系统功能说明</h3>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <strong className="text-gray-900">谁在处理？</strong>
                <p className="mt-1">每条记录明确显示当前处理人及其角色（税务顾问/项目经理/客户财务），责任清晰可追溯。</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <strong className="text-gray-900">咨询受理卡在哪里？</strong>
                <p className="mt-1">通过状态标记（待受理/已受理/待补录/补录中/待复核/复核通过/已退回）快速定位瓶颈，每个状态流转均需填写原因并记录日志。</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <strong className="text-gray-900">资料清单为什么还没完成？</strong>
                <p className="mt-1">资料清单逐项追踪，每个资料项有独立状态、不完整原因、提供人/接收人和操作时间，批量操作快速处理。</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-3">主流程状态流转：</h4>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { label: '待受理', color: 'bg-gray-100 text-gray-700' },
                  '→',
                  { label: '已受理', color: 'bg-blue-100 text-blue-700' },
                  '⇄',
                  { label: '待补录', color: 'bg-yellow-100 text-yellow-700' },
                  '→',
                  { label: '补录中', color: 'bg-orange-100 text-orange-700' },
                  '→',
                  { label: '待复核', color: 'bg-purple-100 text-purple-700' },
                  '⇄',
                  { label: '复核通过', color: 'bg-green-100 text-green-700' },
                  '→',
                  { label: '资料清单完成', color: 'bg-emerald-100 text-emerald-700' },
                ].map((s, i) =>
                  typeof s === 'string' ? (
                    <span key={i} className="text-gray-400 font-bold">
                      {s}
                    </span>
                  ) : (
                    <span
                      key={i}
                      className={`px-2.5 py-1 rounded font-medium ${s.color}`}
                    >
                      {s.label}
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                注：<strong>⇄</strong> 表示可退回（<strong>已退回</strong>为系统状态）。
                退回、发起补录、提交复核等关键操作<strong>必须填写原因</strong>。
                所有状态变化、责任人、时间点和原因均写入<strong>操作日志</strong>和<strong>数据字段</strong>，不依赖页面临时显示。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersPage({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (t: string) => void;
}) {
  const { users } = useAppStore();
  const roles = [
    { key: 'consultant', label: '税务顾问', color: 'blue', iconBg: 'bg-blue-500', iconText: '顾' },
    { key: 'project_manager', label: '项目经理', color: 'purple', iconBg: 'bg-purple-500', iconText: '项' },
    { key: 'client_finance', label: '客户财务', color: 'green', iconBg: 'bg-emerald-500', iconText: '财' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">人员管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            管理系统用户及其角色权限，支持角色切换模拟不同视角操作
          </p>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-3 gap-6">
            {roles.map((role) => {
              const roleUsers = users.filter((u) => u.role === role.key);
              return (
                <div
                  key={role.key}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold ${role.iconBg}`}
                    >
                      {role.iconText}
                    </div>
                    <h3 className="font-semibold text-gray-900">{role.label}</h3>
                    <span className="ml-auto text-sm text-gray-500">
                      {roleUsers.length} 人
                    </span>
                  </div>

                  <div className="space-y-2">
                    {roleUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${role.iconBg}`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {user.department}
                          </p>
                        </div>
                        {user.phone && (
                          <span className="text-sm text-gray-400 font-mono text-xs">
                            {user.phone}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
