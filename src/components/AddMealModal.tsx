import { useOrderStore } from '@/store/useOrderStore'
import type { MealType, SubsidyType } from '@/types'
import { MEAL_TYPE_LABELS, SUBSIDY_TYPE_LABELS } from '@/types'
import { FileText, MapPin, Phone, Plus, Tag, User, Utensils, X } from 'lucide-react'
import { useState } from 'react'

const defaultForm = {
  elderName: '',
  mealType: 'lunch' as MealType,
  dishName: '',
  subsidyType: 'none' as SubsidyType,
  deliveryAddress: '',
  note: '',
  phone: '',
}

export default function AddMealModal() {
  const { showAddMealModal, setShowAddMealModal, addTemporaryMeal } = useOrderStore()
  const [form, setForm] = useState(defaultForm)

  if (!showAddMealModal) return null

  const handleSubmit = () => {
    if (!form.elderName.trim() || !form.dishName.trim() || !form.deliveryAddress.trim()) return
    addTemporaryMeal(form)
    setForm(defaultForm)
  }

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <Plus size={18} className="text-teal-600" />
            </div>
            <h3 className="text-base font-bold text-stone-800">临时加餐登记</h3>
          </div>
          <button
            onClick={() => setShowAddMealModal(false)}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5">
              <User size={13} />
              姓名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.elderName}
              onChange={(e) => update('elderName', e.target.value)}
              placeholder="请输入老人姓名"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 placeholder:text-stone-400"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5">
              <Phone size={13} />
              联系电话
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="请输入联系电话"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 placeholder:text-stone-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5">
                <Utensils size={13} />
                餐类 <span className="text-red-400">*</span>
              </label>
              <select
                value={form.mealType}
                onChange={(e) => update('mealType', e.target.value as MealType)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 bg-white"
              >
                {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((key) => (
                  <option key={key} value={key}>
                    {MEAL_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5">
                <Tag size={13} />
                补贴类型
              </label>
              <select
                value={form.subsidyType}
                onChange={(e) => update('subsidyType', e.target.value as SubsidyType)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 bg-white"
              >
                {(Object.keys(SUBSIDY_TYPE_LABELS) as SubsidyType[]).map((key) => (
                  <option key={key} value={key}>
                    {SUBSIDY_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5">
              <Utensils size={13} />
              菜品 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.dishName}
              onChange={(e) => update('dishName', e.target.value)}
              placeholder="如：红烧肉+青菜+米饭"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 placeholder:text-stone-400"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5">
              <MapPin size={13} />
              送餐地址 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.deliveryAddress}
              onChange={(e) => update('deliveryAddress', e.target.value)}
              placeholder="请输入送餐地址"
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 placeholder:text-stone-400"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-1.5">
              <FileText size={13} />
              备注
            </label>
            <textarea
              value={form.note}
              onChange={(e) => update('note', e.target.value)}
              placeholder="饮食要求、特殊情况等"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 placeholder:text-stone-400 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            onClick={() => setShowAddMealModal(false)}
            className="px-5 py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.elderName.trim() || !form.dishName.trim() || !form.deliveryAddress.trim()}
            className="px-5 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认加餐
          </button>
        </div>
      </div>
    </div>
  )
}
