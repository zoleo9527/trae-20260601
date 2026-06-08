import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchItem, claimItem, handleItem, markException } from '../api'
import { useAuth } from '../AuthContext'
import type { LostItem } from '../types'
import { STATUS_LABELS, ROLE_LABELS, ID_TYPE_OPTIONS, EXCEPTION_TYPE_OPTIONS } from '../types'
import dayjs from 'dayjs'

type DrawerMode = 'none' | 'claim' | 'handle' | 'exception'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { staff, role } = useAuth()
  const [item, setItem] = useState<LostItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState<DrawerMode>('none')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) loadItem()
  }, [id])

  const loadItem = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await fetchItem(id)
      setItem(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  if (loading || !item) {
    return <div style={styles.empty}>加载中…</div>
  }

  return (
    <div>
      <div style={styles.topBar}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          ← 返回列表
        </button>
        <h2 style={styles.title}>
          {item.room_number} · {item.item_name}
          <span style={{
            ...styles.statusTag,
            background: statusBg(item.status),
            color: statusColor(item.status),
          }}>
            {STATUS_LABELS[item.status]}
          </span>
          {item.exception_type && (
            <span style={styles.exTag}>{item.exception_type}</span>
          )}
        </h2>
      </div>

      <div style={styles.grid}>
        <div style={styles.leftCol}>
          <Section title="遗留物登记信息">
            <FieldGroup>
              <Field label="房间号" value={item.room_number} />
              <Field label="物品名称" value={item.item_name} />
              <Field label="物品描述" value={item.item_description || '无'} />
              <Field label="分类" value={item.category} />
              <Field label="发现人" value={`${item.found_by}（${ROLE_LABELS[item.found_by_role]}）`} />
              <Field label="发现时间" value={dayjs(item.found_at).format('YYYY-MM-DD HH:mm')} />
              <Field label="具体位置" value={item.location_detail || '未填写'} />
              <Field label="存放地点" value={item.storage_location} />
            </FieldGroup>
          </Section>

          <Section title="客人认领信息">
            {item.claimant_name ? (
              <FieldGroup>
                <Field label="认领人" value={item.claimant_name} />
                <Field label="证件类型" value={item.claimant_id_type || ''} />
                <Field label="证件号" value={item.claimant_id_number || ''} />
                <Field label="联系电话" value={item.contact_phone || '未留'} />
                <Field label="认领时间" value={item.claim_at ? dayjs(item.claim_at).format('YYYY-MM-DD HH:mm') : ''} />
                <Field label="核验人" value={item.verified_by || '未核验'} />
              </FieldGroup>
            ) : (
              <div style={styles.noData}>
                尚无人认领
                {role === 'supervisor' && item.status === 'registered' && (
                  <button
                    onClick={() => setDrawer('claim')}
                    style={styles.inlineAction}
                  >
                    登记认领
                  </button>
                )}
              </div>
            )}
          </Section>

          <Section title="退回 / 处理">
            {item.handled_by ? (
              <FieldGroup>
                <Field label="退回原因" value={item.return_reason || '未填写'} />
                <Field label="处理人" value={item.handled_by} />
                <Field label="处理时间" value={item.handled_at ? dayjs(item.handled_at).format('YYYY-MM-DD HH:mm') : ''} />
              </FieldGroup>
            ) : (
              <div style={styles.noData}>
                {item.status === 'claimed'
                  ? '认领已登记，待主管确认退回'
                  : item.status === 'registered'
                    ? '待认领后处理'
                    : '待处理'}
                {role === 'supervisor' && (item.status === 'claimed' || item.status === 'registered') && (
                  <button
                    onClick={() => setDrawer('handle')}
                    style={styles.inlineAction}
                  >
                    处理退回
                  </button>
                )}
              </div>
            )}
          </Section>

          <Section title="补充备注">
            {item.supplementary_notes ? (
              <p style={styles.noteText}>{item.supplementary_notes}</p>
            ) : (
              <p style={styles.noData}>无</p>
            )}
          </Section>

          <Section title="异常标记">
            {item.exception_type ? (
              <FieldGroup>
                <Field label="异常类型" value={item.exception_type} />
                {item.exception_note && (
                  <div style={styles.exceptionNote}>
                    <strong>异常说明：</strong>{item.exception_note}
                  </div>
                )}
              </FieldGroup>
            ) : (
              <div style={styles.noData}>
                无异常
                {role === 'supervisor' && item.status === 'registered' && (
                  <button
                    onClick={() => setDrawer('exception')}
                    style={styles.inlineAction}
                  >
                    标记异常
                  </button>
                )}
              </div>
            )}
          </Section>
        </div>

        <div style={styles.rightCol}>
          <Section title="快速操作">
            <div style={styles.actionStack}>
              {role === 'supervisor' && item.status === 'registered' && !item.claimant_name && (
                <ActionButton label="登记客人认领" onClick={() => setDrawer('claim')} primary />
              )}
              {role === 'supervisor' && (item.status === 'claimed' || item.status === 'registered') && (
                <ActionButton label="处理退回 / 处置" onClick={() => setDrawer('handle')} />
              )}
              {role === 'supervisor' && item.status === 'registered' && !item.exception_type && (
                <ActionButton label="标记异常" onClick={() => setDrawer('exception')} variant="warning" />
              )}
              {role === 'cleaner' && item.found_by_role === 'cleaner' && item.status === 'registered' && (
                <div style={styles.hintBox}>
                  保洁员可查看自己登记的物品状态，等待主管审核或客人认领。
                </div>
              )}
              {role === 'engineer' && (
                <div style={styles.hintBox}>
                  工程师可查看与维修相关的遗留物及异常记录。
                </div>
              )}
            </div>
          </Section>

          <Section title="操作记录">
            <div style={styles.timeline}>
              <TimelineEntry
                label="登记"
                time={item.found_at}
                detail={`${item.found_by} 在 ${item.room_number} 房间发现 ${item.item_name}`}
              />
              {item.claim_at && (
                <TimelineEntry
                  label="认领"
                  time={item.claim_at}
                  detail={`${item.claimant_name} 申请认领，核验人：${item.verified_by || '待核验'}`}
                />
              )}
              {item.handled_at && (
                <TimelineEntry
                  label="处理"
                  time={item.handled_at}
                  detail={`${item.handled_by} 处理，原因：${item.return_reason || '无'}`}
                />
              )}
              {item.exception_type && (
                <TimelineEntry
                  label="异常"
                  time={item.updated_at}
                  detail={`${item.exception_type}：${item.exception_note || '无详细说明'}`}
                  variant="warning"
                />
              )}
            </div>
          </Section>
        </div>
      </div>

      {drawer !== 'none' && (
        <DrawerOverlay
          mode={drawer}
          item={item}
          staffName={staff!.name}
          saving={saving}
          onClose={() => setDrawer('none')}
          onSubmit={async (payload) => {
            setSaving(true)
            try {
              if (drawer === 'claim') {
                const updated = await claimItem(item.id, payload as any)
                setItem(updated)
              } else if (drawer === 'handle') {
                const updated = await handleItem(item.id, payload as any)
                setItem(updated)
              } else if (drawer === 'exception') {
                const updated = await markException(item.id, payload as any)
                setItem(updated)
              }
              setDrawer('none')
            } catch {
              alert('操作失败，请重试')
            } finally {
              setSaving(false)
            }
          }}
        />
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <span style={styles.fieldValue}>{value}</span>
    </div>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={styles.fieldGrid}>{children}</div>
}

function ActionButton({ label, onClick, primary, variant }: {
  label: string
  onClick: () => void
  primary?: boolean
  variant?: 'warning'
}) {
  const bg = variant === 'warning'
    ? 'var(--color-warning)'
    : primary
      ? 'var(--color-primary)'
      : 'var(--color-surface)'
  const color = (primary || variant === 'warning') ? '#fff' : 'var(--color-text)'
  const border = (primary || variant === 'warning') ? 'none' : '1px solid var(--color-border)'

  return (
    <button onClick={onClick} style={{ ...styles.actionBtn, background: bg, color, border }}>
      {label}
    </button>
  )
}

function TimelineEntry({ label, time, detail, variant }: {
  label: string
  time: string
  detail: string
  variant?: 'warning'
}) {
  return (
    <div style={styles.timelineEntry}>
      <div style={{
        ...styles.timelineDot,
        background: variant === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)',
      }} />
      <div style={styles.timelineContent}>
        <div style={styles.timelineHeader}>
          <span style={{ ...styles.timelineLabel, color: variant === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)' }}>
            {label}
          </span>
          <span style={styles.timelineTime}>{dayjs(time).format('MM-DD HH:mm')}</span>
        </div>
        <div style={styles.timelineDetail}>{detail}</div>
      </div>
    </div>
  )
}

function DrawerOverlay({ mode, item, staffName, saving, onClose, onSubmit }: {
  mode: DrawerMode
  item: LostItem
  staffName: string
  saving: boolean
  onClose: () => void
  onSubmit: (payload: Record<string, string>) => void
}) {
  const [form, setForm] = useState<Record<string, string>>({})

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  const titles: Record<string, string> = {
    claim: '登记客人认领',
    handle: '处理退回 / 处置',
    exception: '标记异常',
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'claim') {
      onSubmit({
        claimant_name: form.claimant_name || '',
        claimant_id_type: form.claimant_id_type || '',
        claimant_id_number: form.claimant_id_number || '',
        contact_phone: form.contact_phone || '',
        verified_by: staffName,
        supplementary_notes: form.supplementary_notes || '',
      })
    } else if (mode === 'handle') {
      onSubmit({
        return_reason: form.return_reason || '',
        supplementary_notes: form.supplementary_notes || '',
        handled_by: staffName,
        new_status: form.new_status || 'returned',
      })
    } else if (mode === 'exception') {
      onSubmit({
        exception_type: form.exception_type || '',
        exception_note: form.exception_note || '',
      })
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={e => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <h3>{titles[mode]}</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {mode === 'claim' && (
          <div style={styles.contextBox}>
            <strong>登记信息参考：</strong>
            {item.room_number} · {item.item_name} · {item.category}
            {item.item_description && <><br />{item.item_description}</>}
            {item.location_detail && <><br />发现于：{item.location_detail}</>}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'claim' && (
            <>
              <FormInput label="认领人姓名" required value={form.claimant_name || ''} onChange={v => set('claimant_name', v)} />
              <FormSelect label="证件类型" required value={form.claimant_id_type || ''} onChange={v => set('claimant_id_type', v)} options={ID_TYPE_OPTIONS} />
              <FormInput label="证件号" required value={form.claimant_id_number || ''} onChange={v => set('claimant_id_number', v)} />
              <FormInput label="联系电话" value={form.contact_phone || ''} onChange={v => set('contact_phone', v)} />
            </>
          )}
          {mode === 'handle' && (
            <>
              <FormSelect label="处理结果" value={form.new_status || 'returned'} onChange={v => set('new_status', v)} options={['returned', 'disposed', 'expired']} optionLabels={['已退回', '已处置', '已过期']} />
              <FormInput label="退回原因" value={form.return_reason || ''} onChange={v => set('return_reason', v)} />
            </>
          )}
          {mode === 'exception' && (
            <>
              <FormSelect label="异常类型" required value={form.exception_type || ''} onChange={v => set('exception_type', v)} options={EXCEPTION_TYPE_OPTIONS} />
              <FormTextarea label="异常说明" value={form.exception_note || ''} onChange={v => set('exception_note', v)} />
            </>
          )}
          <FormTextarea label="补充备注" value={form.supplementary_notes || ''} onChange={v => set('supplementary_notes', v)} />
          <button type="submit" disabled={saving} style={saving ? styles.submitDisabled : styles.submit}>
            {saving ? '提交中…' : '确认提交'}
          </button>
        </form>
      </div>
    </div>
  )
}

function FormInput({ label, required, value, onChange }: {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label style={styles.formLabel}>
      {label}{required && <span style={styles.required}>*</span>}
      <input
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={styles.formInput}
      />
    </label>
  )
}

function FormSelect({ label, required, value, onChange, options, optionLabels }: {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  options: string[]
  optionLabels?: string[]
}) {
  return (
    <label style={styles.formLabel}>
      {label}{required && <span style={styles.required}>*</span>}
      <select
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={styles.formSelect}
      >
        <option value="">请选择</option>
        {options.map((o, i) => (
          <option key={o} value={o}>{optionLabels?.[i] || o}</option>
        ))}
      </select>
    </label>
  )
}

function FormTextarea({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label style={styles.formLabel}>
      {label}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        style={styles.formTextarea}
      />
    </label>
  )
}

function statusBg(s: string) {
  switch (s) {
    case 'registered': return '#eff6ff'
    case 'claimed': return '#f0fdf4'
    case 'returned': return '#f9fafb'
    case 'disputed': return '#fffbeb'
    default: return '#f9fafb'
  }
}

function statusColor(s: string) {
  switch (s) {
    case 'registered': return 'var(--color-tag-registered)'
    case 'claimed': return 'var(--color-tag-claimed)'
    case 'returned': return 'var(--color-tag-returned)'
    case 'disputed': return 'var(--color-tag-disputed)'
    default: return 'var(--color-text-secondary)'
  }
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    textAlign: 'center' as const,
    padding: 40,
    color: 'var(--color-text-secondary)',
  },
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
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusTag: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
  },
  exTag: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    background: '#fffbeb',
    color: 'var(--color-warning)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 20,
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    position: 'sticky' as const,
    top: 76,
  },
  section: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    padding: '16px 20px',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px 20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: 500,
  },
  noData: {
    fontSize: 14,
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  inlineAction: {
    padding: '2px 10px',
    borderRadius: 4,
    border: '1px solid var(--color-primary)',
    background: '#eff6ff',
    color: 'var(--color-primary)',
    fontSize: 12,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap' as const,
  },
  exceptionNote: {
    gridColumn: '1 / -1',
    padding: '10px 14px',
    background: '#fffbeb',
    borderRadius: 6,
    fontSize: 13,
    lineHeight: 1.6,
    color: '#92400e',
  },
  actionStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  actionBtn: {
    padding: '8px 16px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    transition: 'opacity 0.15s',
  },
  hintBox: {
    padding: '10px 14px',
    background: 'var(--color-bg)',
    borderRadius: 6,
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    paddingLeft: 8,
  },
  timelineEntry: {
    display: 'flex',
    gap: 10,
    position: 'relative' as const,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    marginTop: 5,
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: 600,
  },
  timelineTime: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
  },
  timelineDetail: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.4,
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  drawer: {
    width: 480,
    maxWidth: '100%',
    background: 'var(--color-surface)',
    height: '100vh',
    overflow: 'auto',
    padding: '24px 28px',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: 18,
    color: 'var(--color-text-secondary)',
  },
  contextBox: {
    padding: '12px 16px',
    background: '#eff6ff',
    borderRadius: 6,
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 20,
    color: '#1e40af',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  },
  formLabel: {
    display: 'block',
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginBottom: 4,
  },
  required: {
    color: 'var(--color-danger)',
    marginLeft: 2,
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
  submit: {
    padding: '10px 0',
    borderRadius: 6,
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    marginTop: 8,
  },
  submitDisabled: {
    padding: '10px 0',
    borderRadius: 6,
    border: 'none',
    background: 'var(--color-border)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    marginTop: 8,
    cursor: 'not-allowed' as const,
  },
}
