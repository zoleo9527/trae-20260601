import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore, MedicalStatus, Role } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import Timeline from '@/components/Timeline';
import {
  ArrowLeft,
  Stethoscope,
  Plus,
  PawPrint,
  MapPin,
  Home,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  Send,
  X,
  Pill,
  Syringe,
  Heart,
} from 'lucide-react';

export default function MedicalDetail() {
  const { animalId } = useParams<{ animalId: string }>();
  const navigate = useNavigate();
  const {
    animals,
    medicalRecords,
    historyRecords,
    addMedicalRecord,
    updateAnimal,
    currentRole,
  } = useStore();

  const animal = animals.find((a) => a.id === animalId);
  const animalRecords = medicalRecords
    .filter((m) => m.animalId === animalId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const animalHistory = historyRecords.filter((h) => h.animalId === animalId).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [recordType, setRecordType] = useState<'ASSESSMENT' | 'TREATMENT' | 'FOLLOW_UP' | 'VACCINATION' | 'DEWORMING'>('ASSESSMENT');
  const [recordForm, setRecordForm] = useState({
    title: '',
    description: '',
    diagnosis: '',
    prescription: '',
    cost: '',
    veterinarian: '',
    date: new Date().toISOString().split('T')[0],
    nextFollowUp: '',
  });

  if (!animal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">未找到该动物记录</p>
        <button
          onClick={() => navigate('/medical')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const totalCost = animalRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

  const typeConfig = {
    ASSESSMENT: { label: '评估', icon: Stethoscope, color: 'text-blue-600 bg-blue-100' },
    TREATMENT: { label: '治疗', icon: Pill, color: 'text-red-600 bg-red-100' },
    FOLLOW_UP: { label: '回访', icon: Heart, color: 'text-green-600 bg-green-100' },
    VACCINATION: { label: '疫苗', icon: Syringe, color: 'text-purple-600 bg-purple-100' },
    DEWORMING: { label: '驱虫', icon: Syringe, color: 'text-yellow-600 bg-yellow-100' },
  };

  const handleAddRecord = () => {
    if (recordForm.title && recordForm.veterinarian) {
      addMedicalRecord({
        animalId: animal.id,
        type: recordType,
        title: recordForm.title,
        description: recordForm.description,
        diagnosis: recordForm.diagnosis || undefined,
        prescription: recordForm.prescription || undefined,
        cost: recordForm.cost ? Number(recordForm.cost) : undefined,
        veterinarian: recordForm.veterinarian,
        date: recordForm.date,
        nextFollowUp: recordForm.nextFollowUp || undefined,
      });

      if (recordType === 'ASSESSMENT') {
        updateAnimal(animal.id, { medicalStatus: MedicalStatus.ASSESSING });
      } else if (recordType === 'TREATMENT') {
        updateAnimal(animal.id, { medicalStatus: MedicalStatus.TREATING });
      } else if (recordType === 'FOLLOW_UP' && animal.medicalStatus === MedicalStatus.TREATING) {
        updateAnimal(animal.id, { medicalStatus: MedicalStatus.RECOVERED });
      }

      setShowAddModal(false);
      setRecordForm({
        title: '',
        description: '',
        diagnosis: '',
        prescription: '',
        cost: '',
        veterinarian: '',
        date: new Date().toISOString().split('T')[0],
        nextFollowUp: '',
      });
    }
  };

  const canAddRecord = currentRole === Role.VET || currentRole === Role.VOLUNTEER;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">{animal.name} - 医疗档案</h2>
              <StatusBadge status={animal.medicalStatus} type="medical" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {animal.species} · {animal.breed} · {animal.age} · {animal.gender}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/rescue/${animal.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText size={18} />
            救助档案
          </Link>
          {canAddRecord && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus size={18} />
              添加记录
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Stethoscope size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">就诊次数</p>
              <p className="text-xl font-bold text-gray-900">{animalRecords.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">累计费用</p>
              <p className="text-xl font-bold text-red-600">¥{totalCost}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">最近就诊</p>
              <p className="text-lg font-bold text-gray-900">
                {animalRecords.length > 0 ? animalRecords[0].date : '-'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Home size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">当前位置</p>
              <p className="text-sm font-bold text-gray-900 truncate">{animal.currentLocation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medical Records */}
        <div className="lg:col-span-2 space-y-6">
          {/* Animal Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PawPrint size={18} className="text-blue-600" />
              动物基本信息
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">物种</p>
                <p className="text-sm font-medium text-gray-900">{animal.species}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">品种</p>
                <p className="text-sm font-medium text-gray-900">{animal.breed || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">年龄</p>
                <p className="text-sm font-medium text-gray-900">{animal.age || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">体重</p>
                <p className="text-sm font-medium text-gray-900">{animal.weight || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">毛色</p>
                <p className="text-sm font-medium text-gray-900">{animal.color || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">发现地点</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  {animal.foundLocation}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Records List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-red-600" />
              医疗记录
              <span className="text-sm font-normal text-gray-500">({animalRecords.length})</span>
            </h3>
            {animalRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Stethoscope size={48} className="mx-auto mb-3 text-gray-300" />
                <p>暂无医疗记录</p>
                {canAddRecord && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + 添加第一条记录
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {animalRecords.map((record) => {
                  const config = typeConfig[record.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{record.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                                {config.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {record.date} · {record.veterinarian}
                            </p>
                          </div>
                        </div>
                        {record.cost && (
                          <span className="text-lg font-semibold text-red-600">¥{record.cost}</span>
                        )}
                      </div>
                      {record.description && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">描述</p>
                          <p className="text-sm text-gray-700">{record.description}</p>
                        </div>
                      )}
                      {record.diagnosis && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">诊断</p>
                          <p className="text-sm text-gray-700">{record.diagnosis}</p>
                        </div>
                      )}
                      {record.prescription && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">处方</p>
                          <p className="text-sm text-gray-700">{record.prescription}</p>
                        </div>
                      )}
                      {record.nextFollowUp && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <Calendar size={14} />
                          下次回访: {record.nextFollowUp}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">费用明细</h3>
            <div className="space-y-3">
              {Object.entries(
                animalRecords.reduce((acc, r) => {
                  acc[r.type] = (acc[r.type] || 0) + (r.cost || 0);
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, cost]) => {
                const config = typeConfig[type as keyof typeof typeConfig];
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${config.color}`}>
                        <config.icon size={12} />
                      </div>
                      <span className="text-sm text-gray-600">{config.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">¥{cost}</span>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="font-medium text-gray-900">合计</span>
                <span className="text-lg font-bold text-red-600">¥{totalCost}</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-purple-600" />
              操作历史
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <Timeline records={animalHistory.slice(0, 10)} />
            </div>
          </div>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">添加医疗记录</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  记录类型
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(typeConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setRecordType(key as typeof recordType)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          recordType === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon
                          size={20}
                          className={`mx-auto ${
                            recordType === key ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        />
                        <p
                          className={`text-xs mt-1 ${
                            recordType === key ? 'text-blue-700 font-medium' : 'text-gray-600'
                          }`}
                        >
                          {config.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recordForm.title}
                    onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
                    placeholder="如：初步检查评估"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={recordForm.date}
                    onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    医生 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recordForm.veterinarian}
                    onChange={(e) => setRecordForm({ ...recordForm, veterinarian: e.target.value })}
                    placeholder="主治医生姓名"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    费用
                  </label>
                  <input
                    type="number"
                    value={recordForm.cost}
                    onChange={(e) => setRecordForm({ ...recordForm, cost: e.target.value })}
                    placeholder="金额（元）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={recordForm.description}
                  onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
                  rows={2}
                  placeholder="详细描述本次就诊情况..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    诊断结果
                  </label>
                  <textarea
                    value={recordForm.diagnosis}
                    onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                    rows={2}
                    placeholder="诊断结论"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    处方/治疗方案
                  </label>
                  <textarea
                    value={recordForm.prescription}
                    onChange={(e) => setRecordForm({ ...recordForm, prescription: e.target.value })}
                    rows={2}
                    placeholder="用药和治疗方案"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  下次回访日期
                </label>
                <input
                  type="date"
                  value={recordForm.nextFollowUp}
                  onChange={(e) => setRecordForm({ ...recordForm, nextFollowUp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddRecord}
                disabled={!recordForm.title || !recordForm.veterinarian}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                保存记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
