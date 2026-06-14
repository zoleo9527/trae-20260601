import { useTicketStore } from '../store/ticketStore'
import { TicketCard } from './TicketCard'
import { EmptyState } from './EmptyState'

interface TicketListProps {
  onCreateClick?: () => void
}

export function TicketList({ onCreateClick }: TicketListProps) {
  const { getFilteredTickets, selectedTicket, selectTicket, currentUser } = useTicketStore()
  const tickets = getFilteredTickets()

  const canCreateTicket = currentUser.role === 'clerk' || currentUser.role === 'manager'

  if (tickets.length === 0) {
    return <EmptyState onCreateClick={canCreateTicket ? onCreateClick : undefined} />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-320px)] overflow-y-auto pr-2">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onClick={() => selectTicket(ticket)}
          isSelected={selectedTicket?.id === ticket.id}
        />
      ))}
    </div>
  )
}
