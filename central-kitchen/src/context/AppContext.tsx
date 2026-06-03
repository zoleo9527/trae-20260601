import React, { createContext, useContext, useState, useCallback } from 'react'
import type { Banquet, TableChangeRequest, ShortageRecord } from '../types'
import {
  banquetList as initialBanquets,
  changeRequestList as initialRequests,
  shortageRecordList as initialShortages,
} from '../data/mockData'

interface AppContextType {
  banquets: Banquet[]
  changeRequests: TableChangeRequest[]
  shortages: ShortageRecord[]
  addChangeRequest: (request: TableChangeRequest) => void
  updateChangeRequest: (id: string, updates: Partial<TableChangeRequest>) => void
  updateBanquet: (id: string, updates: Partial<Banquet>) => void
  addShortage: (shortage: ShortageRecord) => void
  updateShortage: (id: string, updates: Partial<ShortageRecord>) => void
}

const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [banquets, setBanquets] = useState<Banquet[]>(initialBanquets)
  const [changeRequests, setChangeRequests] = useState<TableChangeRequest[]>(initialRequests)
  const [shortages, setShortages] = useState<ShortageRecord[]>(initialShortages)

  const addChangeRequest = useCallback((request: TableChangeRequest) => {
    setChangeRequests(prev => [request, ...prev])
  }, [])

  const updateChangeRequest = useCallback((id: string, updates: Partial<TableChangeRequest>) => {
    setChangeRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, ...updates, updateTime: new Date().toISOString() } : req)),
    )
  }, [])

  const updateBanquet = useCallback((id: string, updates: Partial<Banquet>) => {
    setBanquets(prev =>
      prev.map(bq => (bq.id === id ? { ...bq, ...updates, updateTime: new Date().toISOString() } : bq)),
    )
  }, [])

  const addShortage = useCallback((shortage: ShortageRecord) => {
    setShortages(prev => [shortage, ...prev])
  }, [])

  const updateShortage = useCallback((id: string, updates: Partial<ShortageRecord>) => {
    setShortages(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s)),
    )
  }, [])

  return (
    <AppContext.Provider
      value={{
        banquets,
        changeRequests,
        shortages,
        addChangeRequest,
        updateChangeRequest,
        updateBanquet,
        addShortage,
        updateShortage,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
