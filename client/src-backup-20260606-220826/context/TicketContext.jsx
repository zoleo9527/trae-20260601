import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const TicketContext = createContext()

export const useTickets = () => {
  const context = useContext(TicketContext)
  if (!context) throw new Error('useTickets must be used within TicketProvider')
  return context
}

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [constants, setConstants] = useState(null)
  const { user } = useAuth()

  const fetchTickets = useCallback(async (filters = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filters).toString()
      const res = await fetch(`/api/tickets${params ? '?' + params : ''}`)
      const data = await res.json()
      setTickets(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTicket = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/tickets/${id}`)
      return await res.json()
    } catch (e) {
      console.error(e)
      return null
    }
  }, [])

  const fetchConstants = useCallback(async () => {
    try {
      const res = await fetch('/api/constants')
      const data = await res.json()
      setConstants(data)
      return data
    } catch (e) {
      console.error(e)
      return null
    }
  }, [])

  const createTicket = useCallback(async (ticketData) => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ticketData,
          operatorName: user?.name,
          operatorRole: user?.role
        })
      })
      return await res.json()
    } catch (e) {
      console.error(e)
      return null
    }
  }, [user])

  const updateTicketStatus = useCallback(async (id, status, action, remark) => {
    try {
      const res = await fetch(`/api/tickets/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status, action, remark,
          operatorName: user?.name,
          operatorRole: user?.role
        })
      })
      return await res.json()
    } catch (e) {
      console.error(e)
      return null
    }
  }, [user])

  return (
    <TicketContext.Provider value={{
      tickets, loading, constants,
      fetchTickets, fetchTicket, fetchConstants,
      createTicket, updateTicketStatus
    }}>
      {children}
    </TicketContext.Provider>
  )
}
