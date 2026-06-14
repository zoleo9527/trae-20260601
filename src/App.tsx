import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { Applications } from '@/pages/Applications'
import { RiskData } from '@/pages/RiskData'
import { Collection } from '@/pages/Collection'
import { QuotaSuggestion } from '@/pages/QuotaSuggestion'
import { QuotaReview } from '@/pages/QuotaReview'
import { RiskReview } from '@/pages/RiskReview'
import { Workflow } from '@/pages/Workflow'
import { Statistics } from '@/pages/Statistics'
import { useStore } from '@/store/useStore'

function App() {
  const [activeMenu, setActiveMenu] = useState('applications')
  const {
    currentUser,
    applications,
    riskData,
    collectionRecords,
    quotaSuggestions,
    workflowRecords,
    notifications,
    switchUser,
    updateApplicationStatus,
    addCollectionRecord,
    updateQuotaSuggestion,
    dismissNotification,
  } = useStore()

  const renderContent = () => {
    switch (activeMenu) {
      case 'applications':
        return <Applications applications={applications} onUpdateStatus={updateApplicationStatus} />
      case 'risk-data':
        return <RiskData riskData={riskData} applications={applications} />
      case 'collection':
        return <Collection collectionRecords={collectionRecords} applications={applications} onAddRecord={addCollectionRecord} />
      case 'quota-review':
        return <QuotaReview quotaSuggestions={quotaSuggestions} applications={applications} riskData={riskData} collectionRecords={collectionRecords} workflowRecords={workflowRecords} />
      case 'risk-review':
        return <RiskReview applications={applications} riskData={riskData} onUpdateStatus={updateApplicationStatus} />
      case 'quota-suggestion':
        return <QuotaSuggestion quotaSuggestions={quotaSuggestions} applications={applications} riskData={riskData} collectionRecords={collectionRecords} workflowRecords={workflowRecords} onUpdateQuota={updateQuotaSuggestion} />
      case 'workflow':
        return <Workflow workflowRecords={workflowRecords} applications={applications} />
      case 'statistics':
        return <Statistics applications={applications} quotaSuggestions={quotaSuggestions} collectionRecords={collectionRecords} />
      default:
        return <Applications applications={applications} onUpdateStatus={updateApplicationStatus} />
    }
  }

  return (
    <Layout
      header={
        <Header
          currentUser={currentUser}
          notifications={notifications}
          onSwitchUser={switchUser}
          onDismissNotification={dismissNotification}
        />
      }
      sider={<Sidebar currentUser={currentUser.role} activeMenu={activeMenu} onMenuChange={setActiveMenu} />}
    >
      {renderContent()}
    </Layout>
  )
}

export default App
