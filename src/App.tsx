import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import './styles/global.css'

type PageType = 'dashboard' | 'projects' | 'projectDetail'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType)
    setSelectedProjectId(null)
  }

  const handleViewProject = (projectId: number) => {
    setSelectedProjectId(projectId)
    setCurrentPage('projectDetail')
  }

  const handleBack = () => {
    setCurrentPage('projects')
    setSelectedProjectId(null)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <>
            <div className="page-header">
              <div className="page-title">工作台</div>
            </div>
            <Dashboard onViewProject={handleViewProject} />
          </>
        )
      case 'projects':
        return <ProjectList onViewProject={handleViewProject} />
      case 'projectDetail':
        return selectedProjectId ? (
          <ProjectDetail projectId={selectedProjectId} onBack={handleBack} />
        ) : null
      default:
        return null
    }
  }

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage === 'projectDetail' ? 'projects' : currentPage} onNavigate={handleNavigate} />
      <div className="main-content">
        {renderPage()}
      </div>
    </div>
  )
}

export default App
