import { useState } from 'react'
import { 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { resetApi } from '../api'
import { useAppStore } from '../store'

export default function ResetData() {
  const [resetting, setResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const currentUser = useAppStore(state => state.currentUser)
  const setOrders = useAppStore(state => state.setOrders)
  const setSpareParts = useAppStore(state => state.setSpareParts)

  const handleReset = () => {
    setResetting(true)
    setMessage(null)
    resetApi.resetData().then(() => {
      setMessage({ type: 'success', text: '数据重置成功！已恢复到初始样例数据。' })
      setOrders([])
      setSpareParts([])
    }).catch(() => {
      setMessage({ type: 'error', text: '数据重置失败，请重试。' })
    }).finally(() => {
      setResetting(false)
      setShowConfirm(false)
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-600 to-gray-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">数据重置</h2>
          <p className="text-gray-200 text-sm mt-1">恢复系统到初始状态</p>
        </div>

        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">危险操作</p>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• 此操作将清除所有现有数据</li>
                  <li>• 恢复到系统预置的样例数据</li>
                  <li>• 包含5条带历史备注的工单记录</li>
                  <li>• 包含5种常用备件库存数据</li>
                </ul>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-6 rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </span>
              </div>
            </div>
          )}

          <div className="border border-gray-100 rounded-lg p-6">
            <h4 className="font-medium text-gray-800 mb-4">样例数据说明</h4>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-blue-800">工单数据（5条）</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• ORD-001: iPhone 15 Pro - 屏幕竖线问题（已完成）</li>
                  <li>• ORD-002: 华为 Mate60 Pro - 电池鼓包（待保修确认）</li>
                  <li>• ORD-003: 小米14 Ultra - 摄像头对焦问题（待质检）</li>
                  <li>• ORD-004: OPPO Find X7 - 充电接口松动（维修中）</li>
                  <li>• ORD-005: vivo X100 Pro - 扬声器杂音（待接单）</li>
                </ul>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="font-medium text-orange-800">历史备注（10条）</p>
                <p className="text-sm text-orange-700 mt-2">
                  每条工单都包含完整的操作记录，记录了前台、维修师、店长的操作轨迹
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="font-medium text-green-800">备件数据（5种）</p>
                <p className="text-sm text-green-700 mt-2">
                  包含屏幕总成、电池、充电接口、摄像头模组、扬声器等常用备件
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            {showConfirm ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      重置中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      确认重置
                    </>
                  )}
                </button>
              </div>
            ) : currentUser.role === 'manager' ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                重置数据
              </button>
            ) : (
              <div className="text-gray-400 text-sm">
                只有店长角色可以执行此操作
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}