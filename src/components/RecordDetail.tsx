import { useState } from 'react'
import {
  X,
  FileText,
  Calculator,
  Handshake,
  AlertTriangle,
  MessageSquare,
  Send,
  CheckCircle,
  RotateCcw,
  Scale,
} from 'lucide-react'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import {
  STATUS_LABELS,
  SETTLEMENT_STATUS_LABELS,
  RECONCILIATION_STATUS_LABELS,
  ROLE_LABELS,
} from '@/types'
import type { OperationRecord } from '@/types'
import StatusTag from './StatusTag'
import { formatMoney, formatDate } from '@/utils/cn'

function SettlementPanel({ record }: { record: OperationRecord }) {
  const { updateSettlementStatus, addReturnReason } = useWorkbenchStore()
  const [note, setNote] = useState('')
  const s = record.settlement

  const canProcess = s.status === 'pending' || s.status === 'returned'
  const canConfirm = s.status === 'processing'
  const canReturn = s.status === 'processing' || s.status === 'confirmed'
  const canDispute = s.status === 'confirmed'

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <Calculator className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">工资结算</span>
        <StatusTag type="settlement" status={s.status} label={SETTLEMENT_STATUS_LABELS[s.status]} />
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="text-gray-400 text-xs">结算周期</span><p className="font-medium">{s.period}</p></div>
          <div><span className="text-gray-400 text-xs">人数</span><p className="font-medium">{s.headcount} 人</p></div>
          <div><span className="text-gray-400 text-xs">应发合计</span><p className="font-medium text-emerald-700">{formatMoney(s.totalGross)}</p></div>
          <div><span className="text-gray-400 text-xs">扣款合计</span><p className="font-medium text-red-600">{formatMoney(s.totalDeduction)}</p></div>
          <div><span className="text-gray-400 text-xs">实发合计</span><p className="font-bold text-blue-700">{formatMoney(s.totalNet)}</p></div>
          <div><span className="text-gray-400 text-xs">处理人</span><p className="font-medium">{s.processedBy || '-'}</p></div>
          <div><span className="text-gray-400 text-xs">处理时间</span><p className="font-medium">{formatDate(s.processedAt)}</p></div>
        </div>
        {s.returnedReason && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-center gap-1 text-xs text-amber-700 font-medium mb-1">
              <RotateCcw className="w-3 h-3" /> 退回原因
            </div>
            <p className="text-xs text-amber-800">{s.returnedReason}</p>
          </div>
        )}
        {s.supplementNote && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-1 text-xs text-blue-700 font-medium mb-1">
              <MessageSquare className="w-3 h-3" /> 补充备注
            </div>
            <p className="text-xs text-blue-800">{s.supplementNote}</p>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="输入处理备注..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="flex items-center gap-2 mt-2">
            {canProcess && (
              <button
                onClick={() => { updateSettlementStatus(record.id, 'processing', note); setNote('') }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Send className="w-3 h-3" /> 开始处理
              </button>
            )}
            {canConfirm && (
              <button
                onClick={() => { updateSettlementStatus(record.id, 'confirmed', note); setNote('') }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-3 h-3" /> 确认结算
              </button>
            )}
            {canReturn && (
              <button
                onClick={() => { updateSettlementStatus(record.id, 'returned', note); setNote('') }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> 退回
              </button>
            )}
            {canDispute && (
              <button
                onClick={() => { updateSettlementStatus(record.id, 'disputed', note); setNote('') }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
              >
                <Scale className="w-3 h-3" /> 标记争议
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReconciliationPanel({ record }: { record: OperationRecord }) {
  const { updateReconciliationStatus } = useWorkbenchStore()
  const [note, setNote] = useState('')
  const r = record.reconciliation

  const canSend = r.status === 'pending'
  const canConfirm = r.status === 'sent'
  const canDiscrepancy = r.status === 'sent' || r.status === 'confirmed'
  const canDispute = r.status === 'discrepancy' || r.status === 'confirmed'

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <Handshake className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium text-gray-700">客户对账</span>
        <StatusTag type="reconciliation" status={r.status} label={RECONCILIATION_STATUS_LABELS[r.status]} />
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="text-gray-400 text-xs">对账周期</span><p className="font-medium">{r.period}</p></div>
          <div><span className="text-gray-400 text-xs">客户名称</span><p className="font-medium">{r.clientName}</p></div>
          <div><span className="text-gray-400 text-xs">合同金额</span><p className="font-medium">{formatMoney(r.contractAmount)}</p></div>
          <div><span className="text-gray-400 text-xs">开票金额</span><p className="font-medium">{formatMoney(r.billedAmount)}</p></div>
          <div><span className="text-gray-400 text-xs">差异</span>
            <p className={`font-bold ${r.variance !== 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {r.variance !== 0 ? formatMoney(r.variance) : '无差异'}
            </p>
          </div>
          <div><span className="text-gray-400 text-xs">发送时间</span><p className="font-medium">{formatDate(r.sentAt)}</p></div>
          <div><span className="text-gray-400 text-xs">确认时间</span><p className="font-medium">{formatDate(r.confirmedAt)}</p></div>
          {r.disputedBy && (
            <div><span className="text-gray-400 text-xs">争议方</span><p className="font-medium text-purple-700">{r.disputedBy}</p></div>
          )}
        </div>
        {r.discrepancyNote && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-center gap-1 text-xs text-amber-700 font-medium mb-1">
              <AlertTriangle className="w-3 h-3" /> 差异说明
            </div>
            <p className="text-xs text-amber-800">{r.discrepancyNote}</p>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="输入对账备注..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="flex items-center gap-2 mt-2">
            {canSend && (
              <button
                onClick={() => { updateReconciliationStatus(record.id, 'sent', note); setNote('') }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Send className="w-3 h-3" /> 发送对账单
              </button>
            )}
            {canConfirm && (
              <button
                onClick={() => { updateReconciliationStatus(record.id, 'confirmed', note); setNote('') }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-3 h-3" /> 确认对账
              </button>
            )}
            {canDiscrepancy && (
              <button
                onClick={() => { updateReconciliationStatus(record.id, 'discrepancy', note); setNote('') }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="w-3 h-3" /> 标记差异
              </button>
            )}
            {canDispute && (
              <button
                onClick={() => { updateReconciliationStatus(record.id, 'disputed', note); setNote('') }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
              >
                <Scale className="w-3 h-3" /> 标记争议
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RecordDetail() {
  const { selectedRecordId, records, selectRecord, addSupplementNote } = useWorkbenchStore()
  const [supplementInput, setSupplementInput] = useState('')
  const record = records.find((r) => r.id === selectedRecordId)

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
        <FileText className="w-12 h-12 mb-3 text-gray-300" />
        <p className="text-sm">选择一条记录查看详情</p>
        <p className="text-xs mt-1">工资结算、客户对账、退回原因和补充备注将在此展示</p>
      </div>
    )
  }

  const handleAddSupplement = () => {
    if (supplementInput.trim()) {
      addSupplementNote(record.id, supplementInput.trim())
      setSupplementInput('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{record.id}</h3>
          <p className="text-xs text-gray-500">{record.batchNo}</p>
        </div>
        <button
          onClick={() => selectRecord(null)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <span className="text-gray-400 text-xs">员工</span>
            <p className="font-medium">{record.employeeName}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">客户</span>
            <p className="font-medium">{record.clientName}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">项目</span>
            <p className="font-medium">{record.projectName}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">负责人角色</span>
            <p className="font-medium">{ROLE_LABELS[record.role]}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">记录状态</span>
            <p><StatusTag type="record" status={record.recordStatus} label={STATUS_LABELS[record.recordStatus]} /></p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">更新时间</span>
            <p className="font-medium">{record.updatedAt}</p>
          </div>
        </div>
      </div>

      {record.disputeDetail && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-purple-800 mb-2">
            <Scale className="w-4 h-4" /> 责任争议详情
          </div>
          <p className="text-xs text-purple-900 leading-relaxed">{record.disputeDetail}</p>
        </div>
      )}

      {record.returnedReason && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
            <RotateCcw className="w-4 h-4" /> 退回原因
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">{record.returnedReason}</p>
        </div>
      )}

      {record.supplementNote && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-2">
            <MessageSquare className="w-4 h-4" /> 补充备注
          </div>
          <p className="text-xs text-blue-900 leading-relaxed">{record.supplementNote}</p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="w-4 h-4" /> 添加补充备注
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={supplementInput}
            onChange={(e) => setSupplementInput(e.target.value)}
            placeholder="输入补充说明..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSupplement()}
          />
          <button
            onClick={handleAddSupplement}
            disabled={!supplementInput.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            添加
          </button>
        </div>
      </div>

      <SettlementPanel record={record} />
      <ReconciliationPanel record={record} />
    </div>
  )
}
