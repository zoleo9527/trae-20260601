import { useState } from "react"
import type { CompensationType, Complaint } from "@/types"
import { COMPENSATION_LABELS } from "@/types"
import { useComplaintStore, useCurrentRole } from "@/store/complaintStore"
import { resolvePersonName } from "@/utils/resolvePersonName"
import { Check, Gift, Banknote, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

const compensationTypes: CompensationType[] = ["reflower", "refund", "coupon"]
const compensationIcons: Record<CompensationType, React.ReactNode> = {
  reflower: <Gift className="w-4 h-4" />,
  refund: <Banknote className="w-4 h-4" />,
  coupon: <Ticket className="w-4 h-4" />,
}

const suggestedAmounts: Record<CompensationType, number[]> = {
  reflower: [0],
  refund: [128, 258, 388],
  coupon: [30, 50, 80, 128],
}

interface CompensationPanelProps {
  complaint: Complaint
}

export default function CompensationPanel({ complaint }: CompensationPanelProps) {
  const { setCompensation, confirmCompensation } = useComplaintStore()
  const currentRole = useCurrentRole((s) => s.currentRole)
  const [selectedType, setSelectedType] = useState<CompensationType>(complaint.compensation?.type || "coupon")
  const [amount, setAmount] = useState(complaint.compensation?.amount || 0)
  const [reason, setReason] = useState(complaint.compensation?.reason || "")
  const [saved, setSaved] = useState(!!complaint.compensation)

  const handleSave = () => {
    setCompensation(complaint.id, {
      type: selectedType,
      amount,
      reason,
      confirmedBy: "",
      confirmedAt: null,
    })
    setSaved(true)
  }

  const handleConfirm = () => {
    const personName = resolvePersonName(complaint, currentRole)
    confirmCompensation(complaint.id, personName, currentRole)
  }

  const isConfirmed = !!complaint.compensation?.confirmedAt

  return (
    <div className="bg-white rounded-xl border border-moss-100 p-5">
      <h3 className="font-serif text-lg font-semibold text-moss-900 mb-4">补偿决策</h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {compensationTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type)
              setSaved(false)
              if (type === "reflower") setAmount(0)
            }}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
              selectedType === type
                ? "border-brand-500 bg-brand-50 text-brand-600"
                : "border-moss-100 bg-white text-moss-600 hover:border-brand-200"
            )}
          >
            {compensationIcons[type]}
            <span className="text-sm font-medium">{COMPENSATION_LABELS[type]}</span>
          </button>
        ))}
      </div>

      {selectedType !== "reflower" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-moss-700 mb-2">金额</label>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-moss-500 text-sm">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(Number(e.target.value))
                setSaved(false)
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-moss-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {suggestedAmounts[selectedType].map((a) => (
              <button
                key={a}
                onClick={() => {
                  setAmount(a)
                  setSaved(false)
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-colors",
                  amount === a
                    ? "bg-brand-50 text-brand-600 border-brand-300"
                    : "bg-white text-moss-500 border-moss-200 hover:border-brand-200"
                )}
              >
                ¥{a}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-moss-700 mb-2">补偿原因</label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setSaved(false)
          }}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-moss-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 resize-none"
          placeholder="填写补偿原因…"
        />
      </div>

      <div className="flex gap-3">
        {!saved ? (
          <button
            onClick={handleSave}
            disabled={!reason}
            className="flex-1 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            保存方案
          </button>
        ) : !isConfirmed ? (
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-moss-600 text-white text-sm font-medium hover:bg-moss-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            确认补偿
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-moss-50 text-moss-600 text-sm">
            <Check className="w-4 h-4" />
            补偿已确认 · {complaint.compensation?.confirmedBy}
          </div>
        )}
      </div>
    </div>
  )
}
