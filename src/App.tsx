import { Info, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { AppNotification } from './components/AppNotification'
import { Header } from './components/Header'
import { PurchaseList } from './components/PurchaseList'
import { AcceptanceDrawer } from './components/drawers/AcceptanceDrawer'
import { ExceptionDrawer } from './components/drawers/ExceptionDrawer'
import { ResubmitDrawer } from './components/drawers/ResubmitDrawer'
import { SampleDrawer } from './components/drawers/SampleDrawer'
import { useStore } from './store/useStore'

function App() {
  const { activeDrawer, currentUser, fetchPurchases, fetchUsers, loading } = useStore()

  useEffect(() => {
    fetchPurchases()
    fetchUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">完整接力链路说明</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>采购员下单 → 食堂管理员验收 → （驳回/补充 → 采购员补录重提 → 重验）→ 留样登记 → 班主任确认</strong></li>
                <li>• <strong>争议处理：</strong>任一方可发起争议，由班主任介入仲裁</li>
                <li>• <strong>当前身份：</strong>{currentUser.name}，可在右上角切换角色体验不同视角</li>
                <li>• <strong>数据持久化：</strong>所有操作通过后端API，数据保存在JSON文件中</li>
              </ul>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-blue-600 ml-auto">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">处理中...</span>
              </div>
            )}
          </div>
        </div>

        <PurchaseList />
      </main>

      <AppNotification />
      {activeDrawer === 'acceptance' && <AcceptanceDrawer />}
      {activeDrawer === 'sample' && <SampleDrawer />}
      {activeDrawer === 'exception' && <ExceptionDrawer />}
      {activeDrawer === 'resubmit' && <ResubmitDrawer />}
    </div>
  )
}

export default App
