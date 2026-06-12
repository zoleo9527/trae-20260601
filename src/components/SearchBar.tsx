import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  defaultValue?: string
  className?: string
  debounceMs?: number
}

export default function SearchBar({
  placeholder = '搜索...',
  onSearch,
  defaultValue = '',
  className,
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      const timer = setTimeout(() => {
        onSearch(value)
      }, debounceMs)
      
      setDebounceTimer(timer)
    },
    [onSearch, debounceMs, debounceTimer]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    handleSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
        >
          <X size={16} className="text-gray-400" />
        </button>
      )}
    </div>
  )
}