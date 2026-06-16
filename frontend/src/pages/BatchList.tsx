import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Package, AlertTriangle } from 'lucide-react'
import { batchApi } from '@/services/api'
import type { Batch } from '@/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function BatchList() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    setLoading(true)
    try {
      const response = await batchApi.list()
      if (response.success) {
        setBatches(response.data)
      }
    } catch (error) {
      console.error('Failed to load batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await batchApi.list({
        search: search || undefined,
      })
      if (response.success) {
        setBatches(response.data)
      }
    } catch (error) {
      console.error('Failed to search batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusLabels: Record<string, string> = {
    normal: '正常',
    expiring: '即将过期',
    expired: '已过期',
  }

  const statusStyles: Record<string, string> = {
    normal: 'bg-green-100 text-green-700',
    expiring: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
  }

  const filteredBatches = batches.filter((batch) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      batch.batch_number.toLowerCase().includes(searchLower) ||
      (batch.supplier && batch.supplier.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">批号管理</h1>
          <p className="text-gray-500 mt-1">奶粉批号追溯与有效期管理</p>
        </div>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索批号、供应商..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button type="submit" className="btn btn-primary ml-4">
            搜索
          </button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无批号数据</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  批号
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  供应商
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  生产日期
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  有效期至
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  数量
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                  状态
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className="table-row border-b border-gray-100"
                >
                  <td className="py-3 px-4">
                    <Link
                      to={`/batches/${batch.id}`}
                      className="font-mono font-medium text-gray-800 hover:text-primary"
                    >
                      {batch.batch_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {batch.supplier || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {batch.production_date
                      ? format(
                          new Date(batch.production_date),
                          'yyyy-MM-dd',
                          { locale: zhCN }
                        )
                      : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span className="text-gray-600">
                        {batch.expiry_date
                          ? format(
                              new Date(batch.expiry_date),
                              'yyyy-MM-dd',
                              { locale: zhCN }
                            )
                          : '-'}
                      </span>
                      {batch.status === 'expiring' && (
                        <AlertTriangle
                          size={16}
                          className="ml-2 text-yellow-500"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {batch.quantity}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[batch.status]}`}
                    >
                      {statusLabels[batch.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
