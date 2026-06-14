import { useState } from 'react'
import { Header } from './components/Header'
import { StatsCard } from './components/StatsCard'
import { FilterBar } from './components/FilterBar'
import { TicketList } from './components/TicketList'
import { SidebarDetail } from './components/SidebarDetail'
import { CreateTicketModal } from './components/CreateTicketModal'

export default function App() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      
      <main className="flex-1 flex">
        <div className="flex-1 p-6">
          <StatsCard />
          <FilterBar onCreateClick={() => setShowCreateModal(true)} />
          <TicketList onCreateClick={() => setShowCreateModal(true)} />
        </div>
        
        <SidebarDetail />
      </main>

      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
