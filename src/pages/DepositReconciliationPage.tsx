import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Check, X, AlertTriangle, Clock, ChevronDown, ChevronUp, User, Plus, FileText } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { StatusTag } from '@/components/StatusTag';
import { DepositReconciliationStatus, UserRole } from '@/types';
import { formatDate, cn } from '@/lib/utils';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onConfirm: (remark: string) => void;
  placeholder?: string;
}

function ActionModal({ isOpen, onClose, title, onConfirm, placeholder }: ActionModalProps) {
  const [remark, setRemark] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder={placeholder || '请输入备注说明...'}
          className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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

interface DepositCardProps {
  record: any;
  currentRole: UserRole;
}

function DepositCard({ record, currentRole }: DepositCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState<{ type: string; title: string } | null>(null);
  const { updateDepositStatus, createDepositReconciliation, setLogFilters } = useAppStore();

  const handleViewLogs = () => {
    setLogFilters({ targetType: 'deposit_reconciliation', targetId: record.id });
    navigate('/logs', { state: { depositId: record.id } });
  };

  const canMatch = currentRole === 'station_clerk' && record.status === 'pending';
  const canMismatch = currentRole === 'station_clerk' && record.status === 'pending';
  const canVerify = currentRole === 'station_clerk' && record.status === 'pending_verification';
  const canDispute = (currentRole === 'station_clerk' || currentRole === 'customer_service') && 
    ['matched', 'mismatched', 'verified'].includes(record.status);
  const canUnstick = (currentRole === 'station_clerk' || currentRole === 'customer_service') && record.status === 'stuck';
  const canStick = (currentRole === 'station_clerk') && 
    ['pending', 'matched', 'mismatched', 'disputed'].includes(record.status);

  const handleAction = (type: string, remark: string) => {
    switch (type) {
      case 'match':
        updateDepositStatus(record.id, 'matched', remark || '核对一致');
        break;
      case 'mismatch':
        updateDepositStatus(record.id, 'mismatched', remark, { reason: remark });
        break;
      case 'verify':
        updateDepositStatus(record.id, 'verified', remark || '核验通过');
        break;
      case 'dispute':
        updateDepositStatus(record.id, 'disputed', remark, { disputeReason: remark });
        break;
      case 'unstick':
        updateDepositStatus(record.id, 'pending_verification', remark, { stuckReason: undefined, stuckAt: undefined });
        break;
      case 'stick':
        updateDepositStatus(record.id, 'stuck', remark, { stuckReason: remark });
        break;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{record.customer.name}</h4>
              <p className="text-sm text-gray-500">{record.customer.address}</p>
              <p className="text-sm text-gray-500">
                关联空瓶: 预期 {record.bottleReturnRecord?.expectedBottles || 0} 个 / 
                实收 {record.bottleReturnRecord?.returnedBottles || 0} 个
              </p>
            </div>
          </div>
          <StatusTag type="deposit" status={record.status} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-bold text-gray-900">¥{record.expectedDeposit}</p>
            <p className="text-xs text-gray-500">预期押金</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-bold text-gray-900">¥{record.actualDeposit}</p>
            <p className="text-xs text-gray-500">实收押金</p>
          </div>
          <div className={cn(
            'rounded-lg p-2',
            record.difference !== 0 ? 'bg-red-50' : 'bg-green-50'
          )}>
            <p className={cn(
              'text-lg font-bold',
              record.difference !== 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {record.difference >= 0 ? '+' : ''}¥{record.difference}
            </p>
            <p className="text-xs text-gray-500">差额</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-bold text-gray-900">{record.customer.depositBalance}</p>
            <p className="text-xs text-gray-500">账户余额</p>
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

        <div className="mt-4 flex flex-wrap gap-2">
          {canMatch && (
            <button
              onClick={() => setModal({ type: 'match', title: '确认核对一致' })}
              className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> 核对一致
            </button>
          )}
          {canMismatch && (
            <button
              onClick={() => setModal({ type: 'mismatch', title: '标记核对不一致' })}
              className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" /> 核对不一致
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
          {canDispute && (
            <button
              onClick={() => setModal({ type: 'dispute', title: '发起争议' })}
              className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" /> 发起争议
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
            {record.verifiedAt && (
              <div>
                <span className="text-gray-500">核验时间:</span>
                <span className="text-gray-900 ml-1">{formatDate(record.verifiedAt)}</span>
              </div>
            )}
            {record.verifiedBy && (
              <div>
                <span className="text-gray-500">核验人:</span>
                <span className="text-gray-900 ml-1">{record.verifiedBy}</span>
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

export default function DepositReconciliationPage() {
  const { depositReconciliations, currentUser, bottleReturnRecords } = useAppStore();
  const [showStuckOnly, setShowStuckOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DepositReconciliationStatus | ''>('');
  const [hasDifference, setHasDifference] = useState(false);

  const filteredRecords = depositReconciliations.filter(r => {
    if (showStuckOnly && r.status !== 'stuck') return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (hasDifference && r.difference === 0) return false;
    return true;
  });

  const stuckCount = depositReconciliations.filter(r => r.status === 'stuck').length;
  const pendingCount = depositReconciliations.filter(r => r.status === 'pending' || r.status === 'pending_verification').length;

  const unverifiedBottles = bottleReturnRecords.filter(r => 
    r.status === 'returned_to_station' && 
    !depositReconciliations.some(d => d.bottleReturnRecordId === r.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">押金核对回看</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredRecords.length} 条记录
            {stuckCount > 0 && <span className="text-red-500 ml-2">({stuckCount} 条卡住)</span>}
            {pendingCount > 0 && <span className="text-yellow-600 ml-2">({pendingCount} 条待处理)</span>}
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
          <button
            onClick={() => setHasDifference(!hasDifference)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              hasDifference
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            有差额的
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DepositReconciliationStatus | '')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="pending">待核对</option>
            <option value="matched">核对一致</option>
            <option value="mismatched">核对不一致</option>
            <option value="pending_verification">待核验</option>
            <option value="verified">已核验</option>
            <option value="disputed">有争议</option>
            <option value="stuck">已卡住</option>
          </select>
        </div>
      </div>

      {currentUser?.role === 'station_clerk' && unverifiedBottles.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">
                有 {unverifiedBottles.length} 条空瓶回收记录待发起押金核对
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                点击发起核对后将自动计算押金差额
              </p>
            </div>
          </div>
        </div>
      )}

      {currentUser?.role === 'station_clerk' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700">
            💡 提示: 作为站点文员，您可以核对押金、标记差异、发起核验。如有争议可标记为卡住或发起争议。
          </p>
        </div>
      )}

      {currentUser?.role === 'customer_service' && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-purple-700">
            💡 提示: 作为客服，您可以处理争议、协助解除卡住的单子，确保客户问题得到妥善解决。
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {filteredRecords.map(record => (
          <DepositCard
            key={record.id}
            record={record}
            currentRole={currentUser?.role || 'station_clerk'}
          />
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无符合条件的押金核对记录</p>
        </div>
      )}
    </div>
  );
}
