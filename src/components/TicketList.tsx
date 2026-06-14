
import { useTicketStore } from '../store/ticketStore'
import { TicketCard } from './TicketCard'
import { EmptyState } from './EmptyState'

export function TicketList() {
  const { getFilteredTickets, selectedTicket, selectTicket } = useTicketStore()
  const tickets = getFilteredTickets()

  if (tickets.length === 0) {
    return <EmptyState />
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
