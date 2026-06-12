import Card from '@/components/Card'
import DataTable from '@/components/DataTable'
import FilterPanel from '@/components/FilterPanel'
import SearchBar from '@/components/SearchBar'
import StatusBadge from '@/components/StatusBadge'
import { usePermissions } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { noteService } from '@/services/noteService'
import type { Note, NoteTypeLabels } from '@/types/types'
import { formatDateTime } from '@/utils/formatDate'
import { Filter, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const typeOptions = [
  { label: '一般备注', value: 'general' },
  { label: '交接备注', value: 'handover' },
  { label: '续约备注', value: 'renewal' },
  { label: '问题备注', value: 'issue' },
]

export default function Notes() {
  const navigate = useNavigate()
  const { canAddNote } = usePermissions()
  const { page, pageSize, total, totalPages, setTotal, setPage, setPageSize, paginationParams } = usePagination()
  
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await noteService.getNotes({
        ...paginationParams,
        search,
        ...filters,
      })
      if (response.success && response.data) {
        setNotes(response.data.items)
        setTotal(response.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }, [paginationParams, search, filters, setTotal])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch('')
  }

  const columns = [
    {
      key: 'title',
      header: '标题',
      render: (note: Note) => (
        <span className="font-medium text-gray-900">{note.title}</span>
      ),
    },
    {
      key: 'customer',
      header: '客户',
      render: (note: Note) => (
        <span
          className="text-blue-600 hover:text-blue-700 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/customers/${note.customerId}`)
          }}
        >
          {note.customer?.name || '未知客户'}
        </span>
      ),
    },
    {
      key: 'type',
      header: '类型',
      render: (note: Note) => (
        <StatusBadge
          status={note.type}
          label={NoteTypeLabels[note.type]}
          size="sm"
        />
      ),
    },
    {
      key: 'content',
      header: '内容',
      render: (note: Note) => (
        <span className="text-gray-600 truncate max-w-xs block">
          {note.content.length > 50 ? `${note.content.slice(0, 50)}...` : note.content}
        </span>
      ),
    },
    {
      key: 'user',
      header: '创建人',
      render: (note: Note) => note.user?.name || '-',
    },
    {
      key: 'createdAt',
      header: '创建时间',
      sortable: true,
      render: (note: Note) => formatDateTime(note.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">历史备注</h1>
        {canAddNote && (
          <button
            onClick={() => navigate('/notes/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            新增备注
          </button>
        )}
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <SearchBar
              placeholder="搜索备注标题、内容..."
              onSearch={setSearch}
              defaultValue={search}
              className="w-64"
            />
            <button
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={18} />
              筛选
            </button>
          </div>
        </div>

        <FilterPanel
          fields={[
            { key: 'type', label: '备注类型', type: 'select', options: typeOptions },
          ]}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          collapsible={false}
        />
      </Card>

      <DataTable
        columns={columns}
        data={notes}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        rowKey={(note) => note.id}
      />
    </div>
  )
}