import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import { useUserStore } from '@/store/useUserStore';
import StatusTag from '@/components/StatusTag/StatusTag';
import Modal from '@/components/Modal/Modal';
import { mockFosterFamilies } from '@/mock/fosterFamilies';
import { formatDate } from '@/utils/date';
import { formatAnimalType } from '@/utils/format';
import { FosterRecord } from '@/types';
import {
  ArrowLeft,
  Home,
  Star,
  MapPin,
  User,
  Phone,
  Plus,
  Send,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function FosterArrangement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const caseData = useCaseStore((state) => state.getCaseById(id || ''));
  const fosterRecords = useCaseStore((state) => state.getFosterRecordsByCaseId(id || ''));
  const addFosterRecord = useCaseStore((state) => state.addFosterRecord);
  const addTimelineEvent = useCaseStore((state) => state.addTimelineEvent);
  const currentUser = useUserStore((state) => state.currentUser);
  
  const [showArrangeModal, setShowArrangeModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [keyJudgment, setKeyJudgment] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [returnReason, setReturnReason] = useState('');

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

  const handleArrangeFoster = () => {
    if (!selectedFamily || !keyJudgment) return;
    
    const family = mockFosterFamilies.find(f => f.id === selectedFamily);
    if (!family) return;

    const newRecord: FosterRecord = {
      id: `fr_${Date.now()}`,
      caseId: caseData.id,
      fosterFamilyId: family.id,
      fosterFamilyName: family.name,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      keyJudgment,
      specialRequirements,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    addFosterRecord(newRecord);
    addTimelineEvent({
      id: `te_${Date.now()}`,
      caseId: caseData.id,
      type: 'foster',
      title: '安排寄养家庭',
      description: `安排到${family.name}寄养，关键判断：${keyJudgment.substring(0, 50)}...`,
      operator: currentUser.id,
      timestamp: new Date().toISOString(),
    });

    setShowArrangeModal(false);
    setSelectedFamily(null);
    setKeyJudgment('');
    setSpecialRequirements('');
  };

  const handleReturnFoster = () => {
    if (!returnReason || !activeFoster) return;

    addTimelineEvent({
      id: `te_${Date.now()}`,
      caseId: caseData.id,
      type: 'return',
      title: '寄养退回',
      description: `${activeFoster.fosterFamilyName}退回，原因：${returnReason}`,
      operator: currentUser.id,
      timestamp: new Date().toISOString(),
    });

    setShowReturnModal(false);
    setReturnReason('');
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
          <h1 className="text-2xl font-bold text-warm-800 font-serif">寄养安排</h1>
          <p className="text-warm-500 mt-1">
            {caseData.animalName} · {caseData.caseNo} · {formatAnimalType(caseData.animalType)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {activeFoster && (
            <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-warm-800">当前寄养</h3>
                    <p className="text-sm text-warm-500">{activeFoster.fosterFamilyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusTag type="foster" status={activeFoster.status} />
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="btn btn-outline text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    退回
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-warm-500">开始时间</p>
                  <p className="font-medium text-warm-800">{formatDate(activeFoster.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-warm-500">特殊要求</p>
                  <p className="font-medium text-warm-800">{activeFoster.specialRequirements || '无'}</p>
                </div>
              </div>
              <div className="bg-white/70 p-4 rounded-xl">
                <p className="text-xs text-warm-500 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  关键判断
                </p>
                <p className="text-warm-700">{activeFoster.keyJudgment}</p>
              </div>
            </div>
          )}

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title mb-0">寄养家庭</h2>
              {!activeFoster && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowArrangeModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  安排寄养
                </button>
              )}
            </div>
            <div className="space-y-4">
              {mockFosterFamilies.map((family) => {
                const isAvailable = family.currentCount < family.capacity;
                const isSelected = selectedFamily === family.id;
                return (
                  <div 
                    key={family.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-50' 
                        : isAvailable 
                          ? 'border-transparent bg-warm-50 hover:bg-warm-100 cursor-pointer'
                          : 'border-transparent bg-warm-50 opacity-60'
                    }`}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedFamily(family.id);
                        setShowArrangeModal(true);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Home className="w-6 h-6 text-primary-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-warm-800">{family.name}</h4>
                          {isAvailable ? (
                            <span className="tag bg-green-100 text-green-700">可接收</span>
                          ) : (
                            <span className="tag bg-warm-100 text-warm-600">已满</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-warm-600 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {family.contact}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {family.phone}
                          </div>
                          <div className="flex items-center gap-1 col-span-2">
                            <MapPin className="w-3 h-3" />
                            {family.address}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-warm-700 font-medium">{family.rating}</span>
                          </div>
                          <span className="text-warm-500">
                            容量：{family.currentCount}/{family.capacity}
                          </span>
                          {family.hasExperience && (
                            <span className="tag bg-blue-100 text-blue-700">有经验</span>
                          )}
                        </div>
                        <p className="text-xs text-warm-500 mt-2">{family.notes}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {fosterRecords.length > 0 && (
            <div className="card p-6">
              <h2 className="section-title mb-4">寄养历史</h2>
              <div className="space-y-3">
                {fosterRecords.filter(f => f.status !== 'active').map((record) => (
                  <div key={record.id} className="p-4 bg-warm-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-warm-500" />
                        <span className="font-medium text-warm-800">{record.fosterFamilyName}</span>
                      </div>
                      <StatusTag type="foster" status={record.status} />
                    </div>
                    <div className="text-sm text-warm-600 mb-2">
                      {formatDate(record.startDate)} 
                      {record.endDate && ` - ${formatDate(record.endDate)}`}
                    </div>
                    {record.returnReason && (
                      <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                        退回原因：{record.returnReason}
                      </p>
                    )}
                    <p className="text-xs text-warm-500 mt-2">
                      关键判断：{record.keyJudgment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">操作提示</h3>
            <div className="space-y-3 text-sm text-warm-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>安排寄养前请认真填写关键判断，这将作为后续物资领用的重要参考</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>特殊要求请详细说明，便于寄养家庭配合执行</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>寄养退回时请务必填写详细原因，便于后续改进和责任追溯</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">快捷跳转</h3>
            <div className="space-y-2">
              <Link to={`/case/${id}/supplies`} className="flex items-center justify-between p-3 rounded-lg hover:bg-warm-50 transition-colors">
                <span className="text-warm-700">前往物资领用</span>
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
        isOpen={showArrangeModal}
        onClose={() => setShowArrangeModal(false)}
        title="安排寄养家庭"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">选择寄养家庭</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mockFosterFamilies.filter(f => f.currentCount < f.capacity).map((family) => (
                <div
                  key={family.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFamily === family.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-warm-100 hover:border-warm-200'
                  }`}
                  onClick={() => setSelectedFamily(family.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-warm-800">{family.name}</p>
                      <p className="text-xs text-warm-500">{family.contact} · {family.phone}</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-yellow-500" />
                      {family.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">关键判断 <span className="text-red-500">*</span></label>
            <textarea
              value={keyJudgment}
              onChange={(e) => setKeyJudgment(e.target.value)}
              placeholder="请填写对该动物寄养的关键判断，包括性格特点、健康状况注意事项、物资需求建议等..."
              className="input min-h-[100px] resize-none"
            />
            <p className="text-xs text-warm-500 mt-1">
              此判断将作为后续物资领用的重要参考，请详细填写
            </p>
          </div>

          <div>
            <label className="label">特殊要求</label>
            <textarea
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="需要寄养家庭配合的特殊要求，如用药时间、饮食限制等..."
              className="input min-h-[80px] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
            <button 
              className="btn btn-outline"
              onClick={() => setShowArrangeModal(false)}
            >
              取消
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleArrangeFoster}
              disabled={!selectedFamily || !keyJudgment}
            >
              <Send className="w-4 h-4" />
              确认安排
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="退回寄养"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <p className="text-sm text-orange-700">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              退回寄养后，该动物将重新进入待寄养状态。请填写详细退回原因。
            </p>
          </div>
          
          <div>
            <label className="label">退回原因 <span className="text-red-500">*</span></label>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="请详细填写退回原因..."
              className="input min-h-[120px] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
            <button 
              className="btn btn-outline"
              onClick={() => setShowReturnModal(false)}
            >
              取消
            </button>
            <button 
              className="btn btn-primary bg-orange-500 hover:bg-orange-600"
              onClick={handleReturnFoster}
              disabled={!returnReason}
            >
              <RotateCcw className="w-4 h-4" />
              确认退回
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
