import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { SalesView } from './views/SalesView'
import { DesignerView } from './views/DesignerView'
import { ProductionView } from './views/ProductionView'
import { WORKSPACE_VIEWS } from './types'

export default function App() {
  const {
    workspace,
    loading,
    error,
    initApp,
    setError,
  } = useAppStore()

  useEffect(() => {
    initApp()
  }, [])

  const renderView = () => {
    if (!workspace) return null

    switch (workspace.current_view) {
      case WORKSPACE_VIEWS.SALES_DASHBOARD:
      case WORKSPACE_VIEWS.SALES_NEW_ORDER:
      case WORKSPACE_VIEWS.SALES_QUOTE:
      case WORKSPACE_VIEWS.SALES_CUSTOMERS:
        return <SalesView />
      case WORKSPACE_VIEWS.DESIGNER_DASHBOARD:
      case WORKSPACE_VIEWS.DESIGNER_ALL_PROOFS:
        return <DesignerView />
      case WORKSPACE_VIEWS.PRODUCTION_DASHBOARD:
      case WORKSPACE_VIEWS.PRODUCTION_MACHINES:
      case WORKSPACE_VIEWS.PRODUCTION_NEW_SCHEDULE:
        return <ProductionView />
      default:
        return <SalesView />
    }
  }

  if (loading && !workspace) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-factory-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-factory-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-factory-text text-sm">正在加载生产管理系统...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex bg-factory-bg overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 max-w-md bg-red-900/90 border border-red-700 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">操作失败</p>
              <p className="text-red-200 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-200 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
