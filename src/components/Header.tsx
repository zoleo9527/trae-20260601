import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../store/useAppStore'

export const Header: React.FC = () => {
  const { currentUser, workspace, saveWorkspace, exportData, importData, loadOrders } = useAppStore()
  const [searchValue, setSearchValue] = useState(workspace?.search_query || '')

  useEffect(() => {
    setSearchValue(workspace?.search_query || '')
  }, [workspace?.search_query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    saveWorkspace({ search_query: searchValue })
    loadOrders(undefined, searchValue || undefined)
  }

  const handleClearSearch = () => {
    setSearchValue('')
    saveWorkspace({ search_query: '' })
    loadOrders(undefined, undefined)
  }

  const handleExport = async () => {
    const success = await exportData()
    if (success) {
      alert('数据导出成功！')
    }
  }

  const handleImport = async () => {
    const result = await importData()
    if (result.success) {
      alert(`数据导入成功！共导入 ${result.count || 0} 条记录`)
    } else if (result.count === undefined) {
      // 用户取消了
    } else {
      alert('数据导入失败！')
    }
  }

  return (
    <div className="h-14 bg-factory-panel border-b border-factory-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-factory-muted">📅</span>
          <span className="text-factory-text font-mono">
            {dayjs().format('YYYY-MM-DD dddd')}
          </span>
        </div>
        
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="搜索订单号、客户、产品..."
              className="w-64 factory-input text-xs pr-7"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-factory-muted hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="factory-btn text-xs">
            🔍 搜索
          </button>
        </form>
      </div>

      <div className="flex items-center gap-3">
        {currentUser && (
          <div className="text-right">
            <div className="text-xs text-factory-muted">
              {dayjs().format('HH:mm:ss')}
            </div>
          </div>
        )}
        
        <div className="h-8 w-px bg-factory-border" />
        
        <button onClick={handleExport} className="factory-btn text-xs">
          📤 导出
        </button>
        <button onClick={handleImport} className="factory-btn text-xs">
          📥 导入
        </button>
      </div>
    </div>
  )
}
