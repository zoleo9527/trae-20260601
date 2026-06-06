import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import { useUserStore } from '@/store/useUserStore';
import StatusTag from '@/components/StatusTag/StatusTag';
import Timeline from '@/components/Timeline/Timeline';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatAnimalType, formatCurrency, formatUserRole } from '@/utils/format';
import {
  ArrowLeft,
  PawPrint,
  Home,
  Stethoscope,
  Package,
  Heart,
  CheckCircle,
  Edit3,
  RotateCcw,
  Calendar,
  MapPin,
  User,
  FileText,
  DollarSign,
  Clock,
  ChevronRight
} from 'lucide-react';

type TabType = 'overview' | 'foster' | 'medical' | 'supply' | 'adoption' | 'review';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const caseData = useCaseStore((state) => state.getCaseById(id || ''));
  const fosterRecords = useCaseStore((state) => state.getFosterRecordsByCaseId(id || ''));
  const medicalRecords = useCaseStore((state) => state.getMedicalRecordsByCaseId(id || ''));
  const supplyUsages = useCaseStore((state) => state.getSupplyUsagesByCaseId(id || ''));
  const adoptionRecord = useCaseStore((state) => state.getAdoptionRecordByCaseId(id || ''));
  const reviewLogs = useCaseStore((state) => state.getReviewLogsByCaseId(id || ''));
  const timelineEvents = useCaseStore((state) => state.getTimelineEventsByCaseId(id || ''));
  const getUserName = useUserStore((state) => state.getUserName);
  const getUserById = useUserStore((state) => state.getUserById);

  const currentTab = 'overview';

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

  const assigneeUser = getUserById(caseData.assignee);
  const totalMedicalCost = medicalRecords.reduce((sum, r) => sum + r.cost, 0);
  const activeFoster = fosterRecords.find(f => f.status === 'active');

  const tabs = [
    { id: 'overview', label: '概览', icon: FileText },
    { id: 'foster', label: '寄养安排', icon: Home },
    { id: 'medical', label: '医疗记录', icon: Stethoscope },
    { id: 'supply', label: '物资领用', icon: Package },
    { id: 'adoption', label: '领养回访', icon: Heart },
    { id: 'review', label: '复核记录', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-warm-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-warm-800 font-serif">{caseData.animalName}</h1>
            <StatusTag type="case" status={caseData.status} />
            <StatusTag type="medical" status={caseData.medicalStatus} />
          </div>
          <p className="text-warm-500 mt-1">
            {caseData.caseNo} · {formatAnimalType(caseData.animalType)} · {caseData.breed}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/case/${id}/foster`} className="btn btn-outline">
            <Home className="w-4 h-4" />
            寄养安排
          </Link>
          <Link to={`/case/${id}/supply`} className="btn btn-primary">
            <Package className="w-4 h-4" />
            物资领用
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex gap-1 border-b border-warm-100 mb-6">
              {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600 font-medium'
                      : 'border-transparent text-warm-500 hover:text-warm-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="section-title mb-4">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-warm-500">动物品种</p>
                    <p className="font-medium text-warm-800">{caseData.breed}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-warm-500">年龄</p>
                    <p className="font-medium text-warm-800">{caseData.age}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-warm-500">救助地点</p>
                    <p className="font-medium text-warm-800">{caseData.rescueLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-warm-500">负责人</p>
                    <p className="font-medium text-warm-800">
                      {getUserName(caseData.assignee)}
                      {assigneeUser && (
                        <span className="text-xs text-warm-400 ml-2">
                          {formatUserRole(assigneeUser.role)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              </div>

              <div>
                <h3 className="section-title mb-4">情况描述</h3>
                <p className="text-warm-600 bg-warm-50 p-4 rounded-lg">
                  {caseData.description}
                </p>
              </div>

              {activeFoster && (
                <div className="bg-gradient-to-r from-primary-50 to-orange-50 p-4 rounded-xl border border-primary-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary-600" />
                      <h4 className="font-semibold text-warm-800">当前寄养</h4>
                    </div>
                    <StatusTag type="foster" status={activeFoster.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-warm-500">寄养家庭</p>
                      <p className="font-medium text-warm-800">{activeFoster.fosterFamilyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-warm-500">开始时间</p>
                      <p className="font-medium text-warm-800">{formatDate(activeFoster.startDate)}</p>
                    </div>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg">
                    <p className="text-xs text-warm-500 mb-1">关键判断</p>
                    <p className="text-sm text-warm-700">{activeFoster.keyJudgment}</p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-title mb-0">时间线</h3>
                  <span className="text-sm text-warm-500">共 {timelineEvents.length} 条记录</span>
                </div>
                <Timeline events={timelineEvents} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">数据概览</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-warm-600">累计医疗费用</span>
                </div>
                <span className="font-bold text-warm-800">{formatCurrency(totalMedicalCost)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-warm-600">物资领用次数</span>
                </div>
                <span className="font-bold text-warm-800">{supplyUsages.length} 次</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-warm-600">诊疗记录</span>
                </div>
                <span className="font-bold text-warm-800">{medicalRecords.length} 条</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-warm-600">救助天数</span>
                </div>
                <span className="font-bold text-warm-800">
                  {Math.ceil((new Date().getTime() - new Date(caseData.rescueDate).getTime()) / (1000 * 60 * 60 * 24))} 天
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">快捷操作</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-warm-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Edit3 className="w-4 h-4 text-secondary-500" />
                  <span className="text-warm-700">补录信息</span>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-warm-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 text-orange-500" />
                  <span className="text-warm-700">退回处理</span>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-warm-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-secondary-500" />
                  <span className="text-warm-700">申请复核</span>
                </div>
                <ChevronRight className="w-4 h-4 text-warm-400" />
              </button>
            </div>
          </div>

          {reviewLogs.length > 0 && (
            <div className="card p-6">
              <h3 className="section-title mb-4">最近复核</h3>
              <div className="space-y-3">
                {reviewLogs.slice(-3).reverse().map((log) => (
                  <div key={log.id} className="p-3 bg-warm-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <StatusTag type="review" status={log.status} />
                      <span className="text-xs text-warm-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-warm-600">{log.reviewNotes}</p>
                    {log.supplementReason && (
                      <p className="text-xs text-orange-600 mt-1">
                      补录原因：{log.supplementReason}
                    </p>
                    )}
                    <p className="text-xs text-warm-400 mt-1">
                      复核人：{getUserName(log.reviewer)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
