import { useState } from "react"
import type { Complaint } from "@/types"
import { useComplaintStore, useCurrentRole } from "@/store/complaintStore"
import { ROLE_LABELS } from "@/types"
import { MessageSquarePlus, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddNoteProps {
  complaint: Complaint
}

export default function AddNote({ complaint }: AddNoteProps) {
  const addTimelineEntry = useComplaintStore((s) => s.addTimelineEntry)
  const currentRole = useCurrentRole((s) => s.currentRole)
  const [content, setContent] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = () => {
    if (!content.trim()) return
    addTimelineEntry(complaint.id, {
      id: `tl-${Date.now()}`,
      role: currentRole,
      author: ROLE_LABELS[currentRole],
      content: content.trim(),
      timestamp: new Date().toLocaleString("zh-CN"),
      isInternal,
    })
    setContent("")
    setIsInternal(false)
    setIsExpanded(false)
  }

  return (
    <div className="bg-white rounded-xl border border-moss-100 p-5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-serif text-lg font-semibold text-moss-900">追加备注</h3>
        <MessageSquarePlus
          className={cn(
            "w-5 h-5 text-moss-400 transition-transform",
            isExpanded && "rotate-45"
          )}
        />
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-moss-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-200 resize-none"
            placeholder="输入备注内容…"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="w-4 h-4 rounded border-moss-300 text-moss-600 focus:ring-moss-200"
              />
              <Lock className="w-3.5 h-3.5 text-moss-400" />
              <span className="text-sm text-moss-500">内部备注（客户不可见）</span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              提交备注
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
