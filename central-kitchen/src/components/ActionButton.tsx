import { useState } from 'react'
import clsx from 'clsx'
import { Button } from './Button'
import { StatusTransition } from '@/constants/statusMachine'
import { Modal } from './Modal'

interface ActionButtonProps {
  transitions: StatusTransition[]
  onAction: (toStatus: string, remark: string) => void
  className?: string
}

export function ActionButton({ transitions, onAction, className }: ActionButtonProps) {
  const [selectedTransition, setSelectedTransition] = useState<StatusTransition | null>(null)
  const [remark, setRemark] = useState('')

  if (transitions.length === 0) return null

  const handleConfirm = () => {
    if (selectedTransition?.requiresRemark && !remark.trim()) {
      return
    }
    onAction(selectedTransition!.to as string, remark)
    setSelectedTransition(null)
    setRemark('')
  }

  const getButtonStyle = (action: string) => {
    if (action.includes('驳回') || action.includes('不通过')) return 'danger'
    if (action.includes('确认') || action.includes('通过') || action.includes('完成')) return 'success'
    if (action.includes('补发') || action.includes('重提')) return 'warning'
    return 'primary'
  }

  return (
    <>
      <div className={clsx('flex flex-wrap gap-2', className)}>
        {transitions.map((transition) => (
          <Button
            key={transition.to as string}
            variant={getButtonStyle(transition.action) as any}
            onClick={() => {
              if (transition.requiresRemark) {
                setSelectedTransition(transition)
                setRemark('')
              } else {
                onAction(transition.to as string, '')
              }
            }}
          >
            {transition.action}
          </Button>
        ))}
      </div>

      <Modal
        open={!!selectedTransition}
        onClose={() => {
          setSelectedTransition(null)
          setRemark('')
        }}
        title={selectedTransition?.action || ''}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedTransition(null)
                setRemark('')
              }}
            >
              取消
            </Button>
            <Button
              variant={selectedTransition ? getButtonStyle(selectedTransition.action) as any : 'primary'}
              onClick={handleConfirm}
              disabled={selectedTransition?.requiresRemark && !remark.trim()}
            >
              确认
            </Button>
          </>
        }
      >
        {selectedTransition && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              您确定要执行「{selectedTransition.action}」操作吗？
            </p>
            <div>
              <label className="label">
                {selectedTransition.remarkLabel || '备注'}
                {selectedTransition.requiresRemark && (
                  <span className="text-danger-500 ml-1">*</span>
                )}
              </label>
              <textarea
                className="input min-h-[100px]"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={selectedTransition.requiresRemark ? '请输入必填内容...' : '选填'}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
