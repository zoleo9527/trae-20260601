import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { createItem } from '../api'
import { CATEGORY_OPTIONS, EXCEPTION_TYPE_OPTIONS } from '../types'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { staff } = useAuth()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    room_number: '',
    item_name: '',
    item_description: '',
    category: '普通物品',
    location_detail: '',
    storage_location: '客房中心',
    found_by: staff!.name,
    found_by_role: staff!.role,
    exception_type: '',
    exception_note: '',
  })

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.room_number || !form.item_name) {
      alert('房间号和物品名称必填')
      return
    }
    setSaving(true)
    try {
      const created = await createItem({
        ...form,
        exception_type: form.exception_type || undefined,
        exception_note: form.exception_note || undefined,
      } as any)
      navigate(`/items/${created.id}`)
    } catch {
      alert('登记失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={styles.topBar}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>← 返回</button>
        <h2 style={styles.title}>登记遗留物</h2>
      </div>

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.formGrid}>
          <label style={styles.formLabel}>
            房间号 <span style={styles.required}>*</span>
            <input
              required
              value={form.room_number}
              onChange={e => set('room_number', e.target.value)}
              style={styles.formInput}
              placeholder="如 1201"
            />
          </label>

          <label style={styles.formLabel}>
            物品名称 <span style={styles.required}>*</span>
            <input
              required
              value={form.item_name}
              onChange={e => set('item_name', e.target.value)}
              style={styles.formInput}
              placeholder="如 黑色钱包"
            />
          </label>

          <label style={styles.formLabel}>
            分类
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              style={styles.formSelect}
            >
              {CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label style={styles.formLabel}>
            发现人
            <input
              value={form.found_by}
              onChange={e => set('found_by', e.target.value)}
              style={styles.formInput}
            />
          </label>

          <label style={styles.formLabel}>
            具体位置
            <input
              value={form.location_detail}
              onChange={e => set('location_detail', e.target.value)}
              style={styles.formInput}
              placeholder="如 床头柜抽屉内"
            />
          </label>

          <label style={styles.formLabel}>
            存放地点
            <input
              value={form.storage_location}
              onChange={e => set('storage_location', e.target.value)}
              style={styles.formInput}
              placeholder="如 客房中心、前台保险柜"
            />
          </label>

          <label style={{ ...styles.formLabel, gridColumn: '1 / -1' }}>
            物品描述
            <textarea
              value={form.item_description}
              onChange={e => set('item_description', e.target.value)}
              rows={3}
              style={styles.formTextarea}
              placeholder="物品外观、特征、数量等"
            />
          </label>

          <div style={{ ...styles.divider, gridColumn: '1 / -1' }}>
            <span>异常情况（选填）</span>
          </div>

          <label style={styles.formLabel}>
            异常类型
            <select
              value={form.exception_type}
              onChange={e => set('exception_type', e.target.value)}
              style={styles.formSelect}
            >
              <option value="">无异常</option>
              {EXCEPTION_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label style={styles.formLabel}>
            异常说明
            <input
              value={form.exception_note}
              onChange={e => set('exception_note', e.target.value)}
              style={styles.formInput}
              placeholder="简要说明异常情况"
            />
          </label>
        </div>

        <div style={styles.actionRow}>
          <button type="button" onClick={() => navigate('/')} style={styles.cancelBtn}>
            取消
          </button>
          <button type="submit" disabled={saving} style={saving ? styles.submitDisabled : styles.submit}>
            {saving ? '提交中…' : '确认登记'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  backBtn: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: '24px 28px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px 20px',
  },
  formLabel: {
    display: 'block',
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  required: {
    color: 'var(--color-danger)',
  },
  formInput: {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    fontSize: 14,
  },
  formSelect: {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    fontSize: 14,
    background: '#fff',
  },
  formTextarea: {
    display: 'block',
    width: '100%',
    marginTop: 4,
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    fontSize: 14,
    resize: 'vertical' as const,
  },
  divider: {
    borderTop: '1px dashed var(--color-border)',
    paddingTop: 12,
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid var(--color-border)',
  },
  cancelBtn: {
    padding: '8px 20px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontSize: 14,
  },
  submit: {
    padding: '8px 24px',
    borderRadius: 6,
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
  },
  submitDisabled: {
    padding: '8px 24px',
    borderRadius: 6,
    border: 'none',
    background: 'var(--color-border)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'not-allowed' as const,
  },
}
