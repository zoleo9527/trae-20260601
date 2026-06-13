import { useState } from 'react'
import { api } from '../utils/api'
import { RotateCcw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

export default function DataReset() {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      await api.reset.data()
      setSuccess(true)
    } finally {
      setLoading(false)
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">数据重置</h1>
        <p className="text-gray-500 mt-1">重置测试数据，恢复到初始状态</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="w-10 h-10 text-orange-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-4">重置测试数据</h2>
          <p className="text-gray-600 mb-6">
            此操作将清除所有岗位和面试数据，并恢复为初始测试数据。
            请谨慎操作，此操作不可撤销。
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-yellow-800">注意事项</p>
                <p className="text-xs text-yellow-700 mt-1">
                  重置后将恢复以下测试数据：5个岗位（含待审核、已通过、已发布、已退回状态）和4条面试记录（含待面试、已完成、已爽约状态）。
                </p>
              </div>
            </div>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 text-white bg-orange-600 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              开始重置
            </button>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                  <span className="text-gray-600">正在重置...</span>
                </div>
              ) : success ? (
                <div className="flex items-center justify-center gap-3 py-3 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>数据重置成功！</span>
                </div>
              ) : (
                <>
                  <p className="text-red-600 mb-4">确定要重置所有数据吗？此操作不可撤销。</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 text-white bg-red-600 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      确认重置
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}