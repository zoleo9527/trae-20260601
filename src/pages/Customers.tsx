import Card from '@/components/Card'
import DataTable from '@/components/DataTable'
import FilterPanel from '@/components/FilterPanel'
import RiskBadge from '@/components/RiskBadge'
import SearchBar from '@/components/SearchBar'
import StatusBadge from '@/components/StatusBadge'
import { usePermissions } from '@/hooks/useAuth'
import { usePagination } from '@/hooks/usePagination'
import { customerService } from '@/services/customerService'
import type { Customer, CustomerStatusLabels, RiskLevel } from '@/types/types'
import { formatDate, getExpiryLabel } from '@/utils/formatDate'
import { Filter, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const statusOptions = [
  { label: '正常服务', value: 'active' },
  { label: '即将到期', value: 'expiring' },
  { label: '已到期', value: 'expired' },
  { label: '服务暂停', value: 'suspended' },
]

const riskOptions = [
  { label: '高风险', value: 'high' },
  { label: '中风险', value: 'medium' },
  { label: '低风险', value: 'low' },
  { label: '无风险', value: 'none' },
]

export default function Customers() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { canManageCustomers } = usePermissions()
  const { page, pageSize, setTotal, setPage, setPageSize, paginationParams } = usePagination()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<Record<string, string>>({
    status: searchParams.get('status') || '',
    riskLevel: searchParams.get('riskLevel') || '',
  })

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await customerService.getCustomers({
        ...paginationParams,
        search,
        ...filters,
      })
      if (response.success && response.data) {
        setCustomers(response.data.items)
        setTotal(response.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }, [paginationParams, search, filters, setTotal])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearch('')
  }

  const columns = [
    {
      key: 'name',
      header: '客户名称',
      sortable: true,
      render: (customer: Customer) => (
        <span className="font-medium text-gray-900">{customer.name}</span>
      ),
    },
    {
      key: 'contactPerson',
      header: '联系人',
      render: (customer: Customer) => customer.contactPerson || '-',
    },
    {
      key: 'phone',
      header: '联系电话',
      render: (customer: Customer) => customer.phone || '-',
    },
    {
      key: 'contractEndDate',
      header: '合同到期',
      sortable: true,
      render: (customer: Customer) => (
        <div>
          <p className="text-sm">{formatDate(customer.contractEndDate)}</p>
          <p className="text-xs text-gray-500">{getExpiryLabel(customer.contractEndDate)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (customer: Customer) => (
        <StatusBadge
          status={customer.status}
          label={CustomerStatusLabels[customer.status]}
          size="sm"
        />
      ),
    },
    {
      key: 'riskLevel',
      header: '风险等级',
      render: (customer: Customer) => (
        <RiskBadge level={customer.riskLevel as RiskLevel} size="sm" />
      ),
    },
    {
      key: 'accountant',
      header: '负责会计',
      render: (customer: Customer) => customer.accountant?.name || '-',
    },
    {
      key: 'manager',
      header: '客户经理',
      render: (customer: Customer) => customer.manager?.name || '-',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
        {canManageCustomers && (
          <button
            onClick={() => navigate('/customers/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            新增客户
          </button>
        )}
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <SearchBar
              placeholder="搜索客户名称、联系人..."
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
            { key: 'status', label: '客户状态', type: 'select', options: statusOptions },
            { key: 'riskLevel', label: '风险等级', type: 'select', options: riskOptions },
          ]}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          collapsible={false}
        />
      </Card>

      <DataTable
        columns={columns}
        data={customers}
        page={page}
        pageSize={pageSize}
        total={0}
        totalPages={0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        rowKey={(customer) => customer.id}
        onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
      />
    </div>
  )
}