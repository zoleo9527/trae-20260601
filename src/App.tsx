import { Info } from 'lucide-react'
import { AppNotification } from './components/AppNotification'
import { AcceptanceDrawer } from './components/drawers/AcceptanceDrawer'
import { ExceptionDrawer } from './components/drawers/ExceptionDrawer'
import { SampleDrawer } from './components/drawers/SampleDrawer'
import { Header } from './components/Header'
import { PurchaseList } from './components/PurchaseList'
import { useStore } from './store/useStore'

function App() {
  const { activeDrawer, currentUser } = useStore()

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
              <h3 className="font-medium text-blue-900 mb-1">操作说明</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>流程接力：</strong>采购员下单 → 食堂管理员验收 → 留样登记 → 班主任确认</li>
                <li>• <strong>点击卡片：</strong>根据状态自动打开验收/留样/异常处理抽屉，减少菜单跳转</li>
                <li>• <strong>当前身份：</strong>{currentUser.name}，可在右上角切换角色体验不同视角</li>
                <li>• <strong>样例数据：</strong>包含正常推进、退回补充、逾期未处理、责任争议4类场景</li>
              </ul>
            </div>
          </div>
        </div>

        <PurchaseList />
      </main>

      <AppNotification />
      {activeDrawer === 'acceptance' && <AcceptanceDrawer />}
      {activeDrawer === 'sample' && <SampleDrawer />}
      {activeDrawer === 'exception' && <ExceptionDrawer />}
    </div>
  )
}

export default App
