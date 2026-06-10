import { useState } from 'react'
import { useUserStore } from './store/userStore'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import CattleList from './components/CattleList'
import CattleDetail from './components/CattleDetail'
import BreedingList from './components/BreedingList'
import BreedingDetail from './components/BreedingDetail'
import { Cattle, BreedingRecord } from './types'

type PageType = 'cattle' | 'cattle-detail' | 'breeding' | 'breeding-detail'

export default function App() {
  const user = useUserStore((state) => state.user)
  const [currentPage, setCurrentPage] = useState<PageType>('cattle')
  const [selectedCattle, setSelectedCattle] = useState<Cattle | null>(null)
  const [selectedBreedingRecord, setSelectedBreedingRecord] = useState<BreedingRecord | null>(null)

  if (!user) {
    return <LoginPage />
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page as PageType)
    setSelectedCattle(null)
    setSelectedBreedingRecord(null)
  }

  const handleSelectCattle = (cattle: Cattle) => {
    setSelectedCattle(cattle)
    setCurrentPage('cattle-detail')
  }

  const handleSelectBreedingRecord = (record: BreedingRecord) => {
    setSelectedBreedingRecord(record)
    setCurrentPage('breeding-detail')
  }

  const handleBack = () => {
    if (currentPage === 'cattle-detail') {
      setCurrentPage('cattle')
    } else if (currentPage === 'breeding-detail') {
      setCurrentPage('breeding')
    }
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'cattle':
        return <CattleList onSelectCattle={handleSelectCattle} />
      case 'cattle-detail':
        return selectedCattle ? (
          <CattleDetail cattle={selectedCattle} onBack={handleBack} />
        ) : null
      case 'breeding':
        return <BreedingList onSelectRecord={handleSelectBreedingRecord} />
      case 'breeding-detail':
        return selectedBreedingRecord ? (
          <BreedingDetail record={selectedBreedingRecord} onBack={handleBack} />
        ) : null
      default:
        return <CattleList onSelectCattle={handleSelectCattle} />
    }
  }

  const layoutPage = currentPage === 'cattle-detail' ? 'cattle' : currentPage === 'breeding-detail' ? 'breeding' : currentPage

  return (
    <Layout currentPage={layoutPage} onPageChange={handlePageChange}>
      {renderContent()}
    </Layout>
  )
}