import { Check, Clock, FileText, AlertTriangle, ChefHat, ShoppingCart, GraduationCap } from 'lucide-react'
import { PurchaseOrder, Role } from '../types'
import { cn, formatDateTime } from '../utils'

interface ProcessTimelineProps {
  purchase: PurchaseOrder
  currentRole: Role
}

const steps = [
  { key: 'purchase', label: '采购员下单', role: 'purchaser' as Role, icon: ShoppingCart },
  { key: 'acceptance', label: '食堂管理员验收', role: 'admin' as Role, icon: ChefHat },
  { key: 'sample', label: '留样登记', role: 'admin' as Role, icon: FileText },
  { key: 'confirm', label: '班主任确认', role: 'teacher' as Role, icon: GraduationCap },
]

export function ProcessTimeline({ purchase, currentRole }: ProcessTimelineProps) {
  const getStepStatus = (stepKey: string) => {
    switch (stepKey) {
      case 'purchase':
        return 'completed'
      case 'acceptance':
        if (purchase.acceptanceRecords.length > 0) {
          const lastRecord = purchase.acceptanceRecords[purchase.acceptanceRecords.length - 1]
          if (lastRecord.action === 'accept') return 'completed'
          if (lastRecord.action === 'reject' || lastRecord.action === 'supplement') return 'error'
        }
        return purchase.status === 'pending_acceptance' ? 'current' : 'pending'
      case 'sample':
        if (purchase.sampleRecord) return 'completed'
        if (purchase.status === 'sample_pending') return 'current'
        if (purchase.status === 'sample_completed') return 'completed'
        return 'pending'
      case 'confirm':
        if (purchase.sampleRecord && purchase.sampleRecord.status === 'completed') return 'completed'
        return 'pending'
      default:
        return 'pending'
    }
  }

  const roleIcons: Record<Role, React.ReactNode> = {
    admin: <ChefHat className="w-3.5 h-3.5" />,
    purchaser: <ShoppingCart className="w-3.5 h-3.5" />,
    teacher: <GraduationCap className="w-3.5 h-3.5" />
  }

  return (
    <div className="card p-5">
      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        流程接力
      </h4>
      
      <div className="relative">
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="space-y-6">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key)
            const isMyTurn = step.role === currentRole && status === 'current'
            
            return (
              <div key={step.key} className="relative flex items-start gap-4">
                <div className={cn(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm',
                  status === 'completed' ? 'bg-green-500' :
                  status === 'current' ? 'bg-primary-500 animate-pulse' :
                  status === 'error' ? 'bg-red-500' :
                  'bg-gray-300'
                )}>
                  {status === 'completed' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <step.icon className="w-4 h-4 text-white" />
                  )}
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium',
                      status === 'completed' ? 'text-green-700' :
                      status === 'current' ? 'text-primary-700' :
                      status === 'error' ? 'text-red-700' :
                      'text-gray-500'
                    )}>
                      {step.label}
                    </span>
                    <span className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                      step.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      step.role === 'purchaser' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    )}>
                      {roleIcons[step.role]}
                      {step.role === 'admin' ? '管理员' : step.role === 'purchaser' ? '采购员' : '班主任'}
                    </span>
                    {isMyTurn && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        轮到你了
                      </span>
                    )}
                  </div>
                  
                  {step.key === 'acceptance' && purchase.acceptanceRecords.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {purchase.acceptanceRecords[purchase.acceptanceRecords.length - 1].operatorName} · 
                      {formatDateTime(purchase.acceptanceRecords[purchase.acceptanceRecords.length - 1].timestamp)}
                    </p>
                  )}
                  
                  {step.key === 'sample' && purchase.sampleRecord && (
                    <p className="text-xs text-gray-500 mt-1">
                      {purchase.sampleRecord.operatorName} · 
                      {formatDateTime(purchase.sampleRecord.sampleTime)}
                    </p>
                  )}
                  
                  {status === 'error' && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-1.5 text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>有异常需要处理</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
