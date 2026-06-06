import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore, RescueStatus, Role } from '@/store';
import StatusBadge from '@/components/StatusBadge';
import Timeline from '@/components/Timeline';
import {
  ArrowLeft,
  Edit,
  PawPrint,
  MapPin,
  User,
  Phone,
  Calendar,
  Home,
  Stethoscope,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Plus,
  Send,
} from 'lucide-react';

export default function RescueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    animals,
    medicalRecords,
    historyRecords,
    updateAnimalStatus,
    addFollowUp,
    currentRole,
  } = useStore();

  const animal = animals.find((a) => a.id === id);
  const animalMedicalRecords = medicalRecords.filter((m) => m.animalId === id);
  const animalHistory = historyRecords.filter((h) => h.animalId === id).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<RescueStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpContent, setFollowUpContent] = useState('');

  if (!animal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">未找到该救助记录</p>
        <button
          onClick={() => navigate('/rescue')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const availableStatuses = [
    { value: RescueStatus.REGISTERED, label: '确认登记', icon: CheckCircle, roles: [Role.VOLUNTEER, Role.ADOPTION_REVIEWER] },
    { value: RescueStatus.FOSTERING, label: '转寄养', icon: Home, roles: [Role.VOLUNTEER] },
    { value: RescueStatus.TREATING, label: '转入治疗', icon: Stethoscope, roles: [Role.VET, Role.VOLUNTEER] },
    { value: RescueStatus.READY_FOR_ADOPTION, label: '待领养', icon: PawPrint, roles: [Role.VET, Role.VOLUNTEER] },
    { value: RescueStatus.ADOPTED, label: '确认领养', icon: Home, roles: [Role.ADOPTION_REVIEWER] },
    { value: RescueStatus.RETURNED, label: '退回', icon: RotateCcw, roles: [Role.ADOPTION_REVIEWER, Role.VOLUNTEER] },
    { value: RescueStatus.CLOSED, label: '关闭', icon: XCircle, roles: [Role.VOLUNTEER, Role.ADOPTION_REVIEWER] },
  ];

  const handleStatusChange = () => {
    if (selectedStatus && statusNote.trim()) {
      updateAnimalStatus(animal.id, selectedStatus, statusNote);
      setShowStatusModal(false);
      setSelectedStatus(null);
      setStatusNote('');
    }
  };

  const handleAddFollowUp = () => {
    if (followUpDate && followUpContent.trim()) {
      addFollowUp({
        animalId: animal.id,
        date: followUpDate,
        content: followUpContent,
        operator: '当前用户',
        isCompleted: false,
      });
      setShowFollowUpModal(false);
      setFollowUpDate('');
      setFollowUpContent('');
    }
  };

  const canChangeStatus = availableStatuses.some((s) => s.roles.includes(currentRole));

  const totalCost = animalMedicalRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

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
              <h2 className="text-xl font-semibold text-gray-900">{animal.name}</h2>
              <StatusBadge status={animal.status} type="rescue" />
              <StatusBadge status={animal.medicalStatus} type="medical" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {animal.species} · {animal.breed} · {animal.age} · {animal.gender}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/medical/${animal.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Stethoscope size={18} />
            医疗记录
          </Link>
          {canChangeStatus && (
            <>
              <button
                onClick={() => setShowFollowUpModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock size={18} />
                添加回访
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit size={18} />
                变更状态
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PawPrint size={18} className="text-blue-600" />
              基本信息
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
                <p className="text-xs text-gray-500 mb-1">性别</p>
                <p className="text-sm font-medium text-gray-900">{animal.gender}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">体重</p>
                <p className="text-sm font-medium text-gray-900">{animal.weight || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">毛色</p>
                <p className="text-sm font-medium text-gray-900">{animal.color || '-'}</p>
              </div>
            </div>
            {animal.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">情况描述</p>
                <p className="text-sm text-gray-700">{animal.description}</p>
              </div>
            )}
          </div>

          {/* Rescue Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-green-600" />
              救助信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">发现地点</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  {animal.foundLocation}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">发现日期</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  {animal.foundDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">救助人</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <User size={14} className="text-gray-400" />
                  {animal.rescuerName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">救助人电话</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Phone size={14} className="text-gray-400" />
                  {animal.rescuerPhone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">当前位置</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Home size={14} className="text-gray-400" />
                  {animal.currentLocation}
                </p>
              </div>
            </div>
            {animal.fostererName && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">寄养人</p>
                  <p className="text-sm font-medium text-gray-900">{animal.fostererName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">寄养人电话</p>
                  <p className="text-sm font-medium text-gray-900">{animal.fostererPhone}</p>
                </div>
              </div>
            )}
            {animal.adopterName && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">领养人</p>
                  <p className="text-sm font-medium text-gray-900">{animal.adopterName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">领养日期</p>
                  <p className="text-sm font-medium text-gray-900">{animal.adoptionDate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Medical Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Stethoscope size={18} className="text-red-600" />
                医疗记录摘要
              </h3>
              <Link
                to={`/medical/${animal.id}`}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                查看全部
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">就诊次数</p>
                <p className="text-lg font-semibold text-gray-900">{animalMedicalRecords.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">累计费用</p>
                <p className="text-lg font-semibold text-red-600">¥{totalCost}</p>
              </div>
            </div>
            {animalMedicalRecords.length > 0 && (
              <div className="space-y-2">
                {animalMedicalRecords.slice(0, 3).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.title}</p>
                      <p className="text-xs text-gray-500">
                        {record.date} · {record.veterinarian}
                      </p>
                    </div>
                    {record.cost && (
                      <span className="text-sm font-medium text-gray-700">¥{record.cost}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-purple-600" />
              操作历史
            </h3>
            <Timeline records={animalHistory} />
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">常用操作</h3>
            <div className="space-y-2">
              {availableStatuses
                .filter((s) => s.roles.includes(currentRole) && s.value !== animal.status)
                .slice(0, 5)
                .map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.value}
                      onClick={() => {
                        setSelectedStatus(action.value);
                        setShowStatusModal(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Icon size={18} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </button>
                  );
                })}
              <Link
                to={`/medical/${animal.id}`}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Stethoscope size={18} className="text-red-600" />
                <span className="text-sm font-medium text-gray-700">添加医疗记录</span>
              </Link>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">生命周期</h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {[
                  { status: RescueStatus.PENDING, label: '待处理' },
                  { status: RescueStatus.REGISTERED, label: '已登记' },
                  { status: RescueStatus.TREATING, label: '治疗中' },
                  { status: RescueStatus.FOSTERING, label: '寄养中' },
                  { status: RescueStatus.READY_FOR_ADOPTION, label: '待领养' },
                  { status: RescueStatus.ADOPTED, label: '已领养' },
                  { status: RescueStatus.CLOSED, label: '已关闭' },
                ].map((step, index) => {
                  const isActive = step.status === animal.status;
                  const isPast =
                    [
                      RescueStatus.PENDING,
                      RescueStatus.REGISTERED,
                      RescueStatus.TREATING,
                      RescueStatus.FOSTERING,
                      RescueStatus.READY_FOR_ADOPTION,
                      RescueStatus.ADOPTED,
                      RescueStatus.CLOSED,
                    ].indexOf(animal.status) > index;
                  return (
                    <div key={step.status} className="relative pl-8">
                      <div
                        className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600'
                            : isPast
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      >
                        {(isActive || isPast) && (
                          <CheckCircle size={12} className="text-white" />
                        )}
                      </div>
                      <p
                        className={`text-sm ${
                          isActive
                            ? 'font-medium text-blue-600'
                            : isPast
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">变更救助状态</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标状态
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableStatuses
                    .filter((s) => s.roles.includes(currentRole))
                    .map((s) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.value}
                          onClick={() => setSelectedStatus(s.value)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedStatus === s.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Icon
                            size={18}
                            className={
                              selectedStatus === s.value ? 'text-blue-600' : 'text-gray-400'
                            }
                          />
                          <p
                            className={`text-sm mt-1 ${
                              selectedStatus === s.value ? 'text-blue-700 font-medium' : 'text-gray-600'
                            }`}
                          >
                            {s.label}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  变更说明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="请说明变更原因和详情..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus(null);
                  setStatusNote('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!selectedStatus || !statusNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                确认变更
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加回访计划</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  回访日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  回访内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={followUpContent}
                  onChange={(e) => setFollowUpContent(e.target.value)}
                  rows={3}
                  placeholder="请输入回访内容和注意事项..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFollowUpModal(false);
                  setFollowUpDate('');
                  setFollowUpContent('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddFollowUp}
                disabled={!followUpDate || !followUpContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={16} />
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
