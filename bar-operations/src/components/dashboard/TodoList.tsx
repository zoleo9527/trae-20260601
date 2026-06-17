import { Clock, AlertCircle, ArrowRight } from 'lucide-react'

interface TodoItem {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dueTime?: string
}

interface TodoListProps {
  items: TodoItem[]
}

const priorityColors = {
  high: 'bg-[#FF6B6B]/20 text-[#FF6B6B] border-[#FF6B6B]',
  medium: 'bg-[#F5A623]/20 text-[#F5A623] border-[#F5A623]',
  low: 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]',
}

const priorityText = {
  high: '紧急',
  medium: '中等',
  low: '一般',
}

export function TodoList({ items }: TodoListProps) {
  return (
    <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] overflow-hidden">
      <div className="p-4 border-b border-[#2D3748] flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">待办事项</h3>
        <span className="text-sm text-[#A0AEC0]">{items.length} 项待处理</span>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-[#0D1117] rounded-lg border border-[#2D3748] hover:border-[#00D9FF]/50 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[item.priority]}`}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {priorityText[item.priority]}
                  </span>
                  {item.dueTime && (
                    <span className="flex items-center gap-1 text-xs text-[#A0AEC0]">
                      <Clock className="w-3 h-3" />
                      {item.dueTime}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-white mb-1 group-hover:text-[#00D9FF] transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-[#A0AEC0]">{item.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#A0AEC0] group-hover:text-[#00D9FF] group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}