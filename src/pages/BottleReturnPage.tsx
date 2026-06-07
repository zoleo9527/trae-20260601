import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Check, X, AlertTriangle, Clock, MapPin, User, ChevronDown, ChevronUp, Wallet, FileText } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { StatusTag } from '@/components/StatusTag';
import { BottleReturnStatus, UserRole } from '@/types';
import { formatDate, cn } from '@/lib/utils';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onConfirm: (remark: string, extra?: any) => void;
  placeholder?: string;
  showReasonInput?: boolean;
}

function ActionModal({ isOpen, onClose, title, onConfirm, placeholder, showReasonInput = true }: ActionModalProps) {
  const [remark, setRemark] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {showReasonInput && (
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={placeholder || '请输入备注说明...'}
            className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm(remark);
              setRemark('');
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

interface BottleCardProps {
  record: any;
  currentRole: UserRole;
}

function BottleCard({ record, currentRole }: BottleCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState<{ type: string; title: string } | null>(null);
  const { updateBottleReturnStatus, createDepositReconciliation, depositReconciliations, setLogFilters, getRelatedLogsByBottleId } = useAppStore();

  const handleViewLogs = () => {
    setLogFilters({ targetType: 'bottle_return', targetId: record.id });
    navigate('/logs', { state: { bottleReturnId: record.id } });
  };

  const linkedDeposit = depositReconciliations.find(d => d.bottleReturnRecordId === record.id);
  const canCreateDeposit = currentRole === 'station_clerk' && 
    record.status === 'returned_to_station' && 
    !linkedDeposit;
  const canCollect = currentRole === 'delivery_person' && record.status === 'pending_collection';
  const canReturnToStation = currentRole === 'delivery_person' && record.status === 'collected';
  const canVerify = currentRole === 'station_clerk' && record.status === 'returned_to_station';
  const canDispute = (currentRole === 'station_clerk' || currentRole === 'customer_service') && 
    ['collected', 'returned_to_station', 'verified'].includes(record.status);
  const canReject = currentRole === 'station_clerk' && record.status === 'returned_to_station';
  const canUnstick = (currentRole === 'station_clerk' || currentRole === 'customer_service') && record.status === 'stuck';
  const canStick = (currentRole === 'station_clerk') && 
    ['collected', 'returned_to_station', 'disputed'].includes(record.status);

  const handleAction = (type: string, remark: string) => {
    switch (type) {
      case 'collect':
        updateBottleReturnStatus(record.id, 'collected', remark || '已回收空瓶');
        break;
      case 'return_to_station':
        updateBottleReturnStatus(record.id, 'returned_to_station', remark || '已运回站点');
        break;
      case 'verify':
        updateBottleReturnStatus(record.id, 'verified', remark || '核验通过');
        break;
      case 'dispute':
        updateBottleReturnStatus(record.id, 'disputed', remark, { disputeReason: remark });
        break;
      case 'reject':
        updateBottleReturnStatus(record.id, 'rejected', remark, { rejectedReason: remark });
        break;
      case 'unstick':
        updateBottleReturnStatus(record.id, 'returned_to_station', remark, { stuckReason: undefined, stuckAt: undefined });
        break;
      case 'stick':
        updateBottleReturnStatus(record.id, 'stuck', remark, { stuckReason: remark });
        break;
      case 'create_deposit':
        createDepositReconciliation(record.id);
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{record.customer.name}</h4>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {record.customer.address}
              </p>
              <p className="text-sm text-gray-500">
                路线: {record.route.name}
              </p>
            </div>
          </div>
          <StatusTag type="bottle" status={record.status} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-bold text-gray-900">{record.expectedBottles}</p>
            <p className="text-xs text-gray-500">预期数量</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-bold text-gray-900">{record.returnedBottles}</p>
            <p className="text-xs text-gray-500">实收数量</p>
          </div>
          <div className={cn(
            'rounded-lg p-2',
            record.expectedBottles !== record.returnedBottles ? 'bg-red-50' : 'bg-green-50'
          )}>
            <p className={cn(
              'text-lg font-bold',
              record.expectedBottles !== record.returnedBottles ? 'text-red-600' : 'text-green-600'
            )}>
              {record.returnedBottles - record.expectedBottles >= 0 ? '+' : ''}
              {record.returnedBottles - record.expectedBottles}
            </p>
            <p className="text-xs text-gray-500">差异</p>
          </div>
        </div>

        {record.reason && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-700">
              <span className="font-medium">原因:</span> {record.reason}
            </p>
          </div>
        )}

        {record.stuckReason && (
          <div className="mt-3 p-2 bg-red-50 rounded-lg">
            <p className="text-xs text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-medium">卡住原因:</span> {record.stuckReason}
            </p>
            {record.stuckAt && (
              <p className="text-xs text-red-600 mt-1">
                卡住时间: {formatDate(record.stuckAt)}
              </p>
            )}
          </div>
        )}

        {record.disputeReason && (
          <div className="mt-3 p-2 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-700">
              <span className="font-medium">争议说明:</span> {record.disputeReason}
            </p>
          </div>
        )}

        {linkedDeposit && (
          <div className="mt-3 p-2 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-700 flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              <span className="font-medium">关联押金核对:</span>
              <span className="ml-1">差额 {linkedDeposit.difference >= 0 ? '+' : ''}¥{linkedDeposit.difference}</span>
            </p>
            <div className="mt-1">
              <StatusTag type="deposit" status={linkedDeposit.status} />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {canCollect && (
            <button
              onClick={() => setModal({ type: 'collect', title: '确认回收空瓶' })}
              className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> 回收
            </button>
          )}
          {canReturnToStation && (
            <button
              onClick={() => setModal({ type: 'return_to_station', title: '确认运回站点' })}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" /> 运回站点
            </button>
          )}
          {canVerify && (
            <button
              onClick={() => setModal({ type: 'verify', title: '确认核验通过' })}
              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> 核验通过
            </button>
          )}
          {canCreateDeposit && (
            <button
              onClick={() => setModal({ type: 'create_deposit', title: '发起押金核对' })}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
            >
              <Wallet className="w-4 h-4" /> 发起押金核对
            </button>
          )}
          {canDispute && (
            <button
              onClick={() => setModal({ type: 'dispute', title: '发起争议' })}
              className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" /> 发起争议
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setModal({ type: 'reject', title: '退回回收记录' })}
              className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" /> 退回
            </button>
          )}
          {canUnstick && (
            <button
              onClick={() => setModal({ type: 'unstick', title: '解除卡住状态' })}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> 解除卡住
            </button>
          )}
          {canStick && (
            <button
              onClick={() => setModal({ type: 'stick', title: '标记为卡住' })}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <Clock className="w-4 h-4" /> 标记卡住
            </button>
          )}
          <button
            onClick={handleViewLogs}
            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-1"
          >
            <FileText className="w-4 h-4" /> 查看日志
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto px-2 py-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h5 className="text-sm font-medium text-gray-700 mb-2">详细信息</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">创建时间:</span>
              <span className="text-gray-900 ml-1">{formatDate(record.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">更新时间:</span>
              <span className="text-gray-900 ml-1">{formatDate(record.updatedAt)}</span>
            </div>
            {record.collectedAt && (
              <div>
                <span className="text-gray-500">回收时间:</span>
                <span className="text-gray-900 ml-1">{formatDate(record.collectedAt)}</span>
              </div>
            )}
            {record.returnedToStationAt && (
              <div>
                <span className="text-gray-500">运回站点:</span>
                <span className="text-gray-900 ml-1">{formatDate(record.returnedToStationAt)}</span>
              </div>
            )}
            {record.verifiedAt && (
              <div>
                <span className="text-gray-500">核验时间:</span>
                <span className="text-gray-900 ml-1">{formatDate(record.verifiedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <ActionModal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title || ''}
        onConfirm={(remark) => modal && handleAction(modal.type, remark)}
      />
    </div>
  );
}

export default function BottleReturnPage() {
  const { getFilteredBottleReturns, bottleReturnRecords, setBottleReturnFilters, bottleReturnFilters, currentUser } = useAppStore();
  const [showStuckOnly, setShowStuckOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BottleReturnStatus | ''>('');

  const filteredRecords = bottleReturnRecords.filter(r => {
    if (showStuckOnly && r.status !== 'stuck') return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const stuckCount = bottleReturnRecords.filter(r => r.status === 'stuck').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">空瓶回收处理</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredRecords.length} 条记录
            {stuckCount > 0 && (
              <span className="text-red-500 ml-2">
                ({stuckCount} 条卡住)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowStuckOnly(!showStuckOnly)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              showStuckOnly
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            只看卡住的 ({stuckCount})
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BottleReturnStatus | '')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="pending_collection">待回收</option>
            <option value="collected">已回收</option>
            <option value="returned_to_station">已运回站点</option>
            <option value="verified">已核验</option>
            <option value="disputed">有争议</option>
            <option value="stuck">已卡住</option>
            <option value="rejected">已退回</option>
          </select>
        </div>
      </div>

      {currentUser?.role === 'delivery_person' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-700">
            💡 提示: 作为配送员，您可以回收空瓶并将其运回站点。如果发现数量不符，请及时记录原因。
          </p>
        </div>
      )}

      {currentUser?.role === 'station_clerk' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700">
            💡 提示: 作为站点文员，您可以核验回收的空瓶、发起押金核对、标记卡住或退回有问题的记录。
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {filteredRecords.map(record => (
          <BottleCard
            key={record.id}
            record={record}
            currentRole={currentUser?.role || 'station_clerk'}
          />
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无符合条件的空瓶回收记录</p>
        </div>
      )}
    </div>
  );
}
