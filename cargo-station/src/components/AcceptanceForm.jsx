import { useState } from 'react'

const EMPTY_ITEM = { name: '', category: '普通货物', weight: '', unit: '吨', packaging: '' }

export default function AcceptanceForm({ onClose }) {
  const [form, setForm] = useState({
    shipperName: '',
    shipperContact: '',
    shipperDocs: [''],
    items: [{ ...EMPTY_ITEM }],
    destinationStation: '',
    remark: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items]
      items[idx] = { ...items[idx], [field]: value }
      return { ...prev, items }
    })
    setError('')
  }

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }))
  }

  const removeItem = (idx) => {
    if (form.items.length <= 1) return
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  }

  const updateDoc = (idx, value) => {
    setForm(prev => {
      const docs = [...prev.shipperDocs]
      docs[idx] = value
      return { ...prev, shipperDocs: docs }
    })
  }

  const addDoc = () => {
    setForm(prev => ({ ...prev, shipperDocs: [...prev.shipperDocs, ''] }))
  }

  const removeDoc = (idx) => {
    setForm(prev => ({ ...prev, shipperDocs: prev.shipperDocs.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = async () => {
    if (!form.shipperName.trim()) { setError('请填写货主名称'); return }
    if (!form.destinationStation.trim()) { setError('请填写到站'); return }
    if (form.items.some(i => !i.name.trim() || !i.weight)) { setError('请完善货品信息（名称和重量为必填）'); return }

    const payload = {
      ...form,
      shipperDocs: form.shipperDocs.filter(d => d.trim()),
      items: form.items.map(i => ({ ...i, weight: parseFloat(i.weight) || 0 }))
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/acceptances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || '提交失败')
      } else {
        onClose()
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">新增托运受理</h2>
        <button className="btn btn-outline text-sm" onClick={onClose}>取消</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label>货主名称 *</label>
          <input value={form.shipperName} onChange={e => updateForm('shipperName', e.target.value)} placeholder="例：顺达物流有限公司" />
        </div>
        <div>
          <label>联系方式</label>
          <input value={form.shipperContact} onChange={e => updateForm('shipperContact', e.target.value)} placeholder="例：王建国 13800138001" />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="!mb-0">提交资料</label>
          <button className="text-blue-600 text-sm hover:underline" onClick={addDoc}>+ 添加资料</button>
        </div>
        {form.shipperDocs.map((doc, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input value={doc} onChange={e => updateDoc(idx, e.target.value)} placeholder="资料名称，如：营业执照复印件" />
            {form.shipperDocs.length > 1 && (
              <button className="text-red-500 text-sm shrink-0" onClick={() => removeDoc(idx)}>删除</button>
            )}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="!mb-0">货品信息 *</label>
          <button className="text-blue-600 text-sm hover:underline" onClick={addItem}>+ 添加货品</button>
        </div>
        {form.items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-end">
            <div className="col-span-1">
              {idx === 0 && <label>货品名称</label>}
              <input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="品名" />
            </div>
            <div className="col-span-1">
              {idx === 0 && <label>类别</label>}
              <select value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}>
                <option>普通货物</option>
                <option>危险品-第1类爆炸品</option>
                <option>危险品-第2类气体</option>
                <option>危险品-第3类易燃液体</option>
                <option>危险品-第4类易燃固体</option>
                <option>危险品-第5类氧化剂</option>
                <option>危险品-第6类毒害品</option>
                <option>危险品-第7类放射性物品</option>
                <option>危险品-第8类腐蚀品</option>
              </select>
            </div>
            <div>
              {idx === 0 && <label>重量</label>}
              <input type="number" value={item.weight} onChange={e => updateItem(idx, 'weight', e.target.value)} placeholder="0" />
            </div>
            <div>
              {idx === 0 && <label>包装</label>}
              <input value={item.packaging} onChange={e => updateItem(idx, 'packaging', e.target.value)} placeholder="散装/袋装/箱装" />
            </div>
            <div className="flex items-end gap-1">
              {form.items.length > 1 && (
                <button className="text-red-500 text-sm" onClick={() => removeItem(idx)}>删除</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label>到站 *</label>
          <input value={form.destinationStation} onChange={e => updateForm('destinationStation', e.target.value)} placeholder="例：郑州北站" />
        </div>
        <div>
          <label>备注</label>
          <input value={form.remark} onChange={e => updateForm('remark', e.target.value)} placeholder="特殊说明" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-outline" onClick={onClose}>取消</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '提交中...' : '提交受理'}
        </button>
      </div>
    </div>
  )
}
