import { Check, Clock, AlertTriangle, ChefHat, ShoppingCart, GraduationCap, FileUp } from 'lucide-react'
import { PurchaseOrder, Role, ProcessStep } from '../types'
import { cn, formatDateTime } from '../utils'

interface ProcessTimelineProps {
  purchase: PurchaseOrder
  currentRole: Role
}

const stepIcons: Record<string, React.ReactNode> = {
  purchase_created: <ShoppingCart className="w-4 h-4" />,
  acceptance_pending: <ChefHat className="w-4 h-4" />,
  acceptance_completed: <Check className="w-4 h-4" />,
  supplement_requested: <AlertTriangle className="w-4 h-4" />,
  supplement_submitted: <FileUp className="w-4 h-4" />,
  sample_pending: <ChefHat className="w-4 h-4" />,
  sample_completed: <Check className="w-4 h-4" />,
  sample_confirmed: <GraduationCap className="w-4 h-4" />,
  dispute_raised: <AlertTriangle className="w-4 h-4" />,
  dispute_resolved: <Check className="w-4 h-4" />,
  completed: <Check className="w-4 h-4" />,
}

const roleIcons: Record<Role, React.ReactNode> = {
  admin: <ChefHat className="w-3.5 h-3.5" />,
  purchaser: <ShoppingCart className="w-3.5 h-3.5" />,
  teacher: <GraduationCap className="w-3.5 h-3.5" />
}

export function ProcessTimeline({ purchase, currentRole }: ProcessTimelineProps) {
  const displaySteps = purchase.processSteps.filter(
    step => step.status !== 'pending' || isStepRelevant(step.key, purchase.status)
  )

  return (
    <div className="card p-5">
      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        流程接力
      </h4>
      
      <div className="relative">
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
        
        <div className="space-y-6">
          {displaySteps.map((step, index) => {
            const isMyTurn = step.role === currentRole && step.status === 'current'
            
            return (
              <div key={step.key} className="relative flex items-start gap-4">
                <div className={cn(
                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm',
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'current' ? 'bg-primary-500 animate-pulse' :
                  step.status === 'error' ? 'bg-red-500' :
                  'bg-gray-300'
                )}>
                  {step.status === 'completed' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-white">{stepIcons[step.key] || <Clock className="w-4 h-4" />}</span>
                  )}
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'font-medium',
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'current' ? 'text-primary-700' :
                      step.status === 'error' ? 'text-red-700' :
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
                  
                  {(step.timestamp || step.operatorName) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.operatorName && <span>操作人: {step.operatorName}</span>}
                      {step.timestamp && step.operatorName && ' · '}
                      {step.timestamp && <span>{formatDateTime(step.timestamp)}</span>}
                    </p>
                  )}
                  {step.remark && (
                    <p className="text-sm text-gray-600 mt-1">{step.remark}</p>
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

function isStepRelevant(stepKey: string, status: string): boolean {
  const relevantSteps = new Set([
    'purchase_created',
    'acceptance_pending',
    'acceptance_completed',
    'sample_pending',
    'sample_completed',
    'sample_confirmed',
    'completed'
  ])
  
  if (status === 'supplementing' || status === 'supplement_submitted') {
    relevantSteps.add('supplement_requested')
    relevantSteps.add('supplement_submitted')
  }
  
  if (status.startsWith('dispute')) {
    relevantSteps.add('dispute_raised')
    relevantSteps.add('dispute_resolved')
  }
  
  return relevantSteps.has(stepKey)
}
