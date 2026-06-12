import Card from '@/components/Card'
import DataTable from '@/components/DataTable'
import FilterPanel from '@/components/FilterPanel'
import SearchBar from '@/components/SearchBar'
import StatusBadge from '@/components/StatusBadge'
import { usePermissions } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { handoverService } from '@/services/handoverService'
import type { Handover, HandoverStatusLabels } from '@/types/types'
import { formatDate } from '@/utils/formatDate'
import { Filter, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
]

export default function Handovers() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { canCreateHandover } = usePermissions()
  const { page, pageSize, total, totalPages, setTotal, setPage, setPageSize, paginationParams } = usePagination()
  
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<Record<string, string>>({
    status: searchParams.get('status') || '',
  })

  const fetchHandovers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await handoverService.getHandovers({
        ...paginationParams,
        ...filters,
      })
      if (response.success && response.data) {
        setHandovers(response.data.items)
        setTotal(response.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch handovers:', error)
    } finally {
      setLoading(false)
    }
  }, [paginationParams, filters, setTotal])

  useEffect(() => {
    fetchHandovers()
  }, [fetchHandovers])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch('')
  }

  const columns = [
    {
      key: 'customer',
      header: '客户名称',
      render: (handover: Handover) => (
        <span className="font-medium text-gray-900">
          {handover.customer?.name || '未知客户'}
        </span>
      ),
    },
    {
      key: 'fromUser',
      header: '交接人',
      render: (handover: Handover) => handover.fromUser?.name || '-',
    },
    {
      key: 'toUser',
      header: '接收人',
      render: (handover: Handover) => handover.toUser?.name || '-',
    },
    {
      key: 'fromUserRole',
      header: '交接角色',
      render: (handover: Handover) =>
        handover.fromUserRole === 'accountant' ? '会计' : '客户经理',
    },
    {
      key: 'createdAt',
      header: '创建时间',
      sortable: true,
      render: (handover: Handover) => formatDate(handover.createdAt),
    },
    {
      key: 'status',
      header: '状态',
      render: (handover: Handover) => (
        <StatusBadge
          status={handover.status}
          label={HandoverStatusLabels[handover.status]}
          size="sm"
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">交接管理</h1>
        {canCreateHandover && (
          <button
            onClick={() => navigate('/handovers/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            创建交接清单
          </button>
        )}
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <SearchBar
              placeholder="搜索客户名称..."
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
            { key: 'status', label: '交接状态', type: 'select', options: statusOptions },
          ]}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          collapsible={false}
        />
      </Card>

      <DataTable
        columns={columns}
        data={handovers}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        rowKey={(handover) => handover.id}
        onRowClick={(handover) => navigate(`/handovers/${handover.id}`)}
      />
    </div>
  )
}