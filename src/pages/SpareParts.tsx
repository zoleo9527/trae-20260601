import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Package,
  AlertCircle,
  X,
  Save
} from 'lucide-react'
import { sparePartApi } from '../api'
import { useAppStore } from '../store'
import type { SparePart } from '../types'

export default function SpareParts() {
  const spareParts = useAppStore(state => state.spareParts)
  const setSpareParts = useAppStore(state => state.setSpareParts)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPart, setEditingPart] = useState<SparePart | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    quantity: 0,
    location: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sparePartApi.getAll().then(data => {
      setSpareParts(data)
      setLoading(false)
    })
  }, [setSpareParts])

  const handleCreate = () => {
    sparePartApi.create(formData).then(() => {
      sparePartApi.getAll().then(data => setSpareParts(data))
      resetForm()
    })
  }

  const handleUpdate = () => {
    if (!editingPart) return
    sparePartApi.update(editingPart.id, formData).then(() => {
      sparePartApi.getAll().then(data => setSpareParts(data))
      resetForm()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个备件吗？')) {
      sparePartApi.delete(id).then(() => {
        sparePartApi.getAll().then(data => setSpareParts(data))
      })
    }
  }

  const resetForm = () => {
    setFormData({ name: '', sku: '', quantity: 0, location: '' })
    setEditingPart(null)
    setShowCreateModal(false)
  }

  const openEditModal = (part: SparePart) => {
    setEditingPart(part)
    setFormData({
      name: part.name,
      sku: part.sku,
      quantity: part.quantity,
      location: part.location
    })
    setShowCreateModal(true)
  }

  const filteredParts = spareParts.filter(part => 
    part.name.includes(searchTerm) || part.sku.includes(searchTerm)
  )

  const getStockStatus = (quantity: number) => {
    if (quantity <= 5) return { label: '库存不足', color: 'text-red-600', bgColor: 'bg-red-50' }
    if (quantity <= 10) return { label: '库存偏低', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    return { label: '库存充足', color: 'text-green-600', bgColor: 'bg-green-50' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索备件名称或SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
          />
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加备件
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备件名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">库存数量</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">存放位置</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">库存状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : filteredParts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">暂无备件</td>
              </tr>
            ) : (
              filteredParts.map((part: SparePart) => {
                const stockStatus = getStockStatus(part.quantity)
                return (
                  <tr key={part.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-800">{part.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{part.sku}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${part.quantity <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                        {part.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{part.location}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(part)}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(part.id)}
                          className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editingPart ? '编辑备件' : '添加备件'}</h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备件名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存数量 *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">存放位置</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：A区-01"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={editingPart ? handleUpdate : handleCreate}
                  disabled={!formData.name || !formData.sku || formData.quantity < 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingPart ? '保存修改' : '添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {spareParts.some(p => p.quantity <= 5) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">库存预警</p>
              <p className="text-sm text-red-700 mt-1">
                以下备件库存不足5件：{spareParts.filter(p => p.quantity <= 5).map(p => p.name).join('、')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}