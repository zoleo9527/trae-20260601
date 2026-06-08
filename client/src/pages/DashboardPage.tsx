import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { fetchItems, fetchTodos } from '../api'
import type { LostItem, TodoItem, ItemStatus } from '../types'
import { STATUS_LABELS, ROLE_LABELS } from '../types'
import dayjs from 'dayjs'

export default function DashboardPage() {
  const { role, staff } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<LostItem[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    loadData()
  }, [role, staff])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { role }
      if (staff?.id) params.staff_id = staff.id
      const [itemData, todoData] = await Promise.all([
        fetchItems(params),
        fetchTodos({ role, staff_id: staff?.id }),
      ])
      setItems(itemData)
      setTodos(todoData)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const TODO_TYPE_TO_STATUS: Record<string, string> = {
    review: 'registered',
    dispute: 'disputed',
    verify_claim: 'claimed',
    handover: 'registered',
    pickup: 'registered',
    exception: 'disputed',
  }

  const handleTodoClick = (t: TodoItem) => {
    const target = TODO_TYPE_TO_STATUS[t.type]
    if (target) {
      setFilter(target)
      setKeyword('')
    }
  }

  const isOverdue = (item: LostItem) => {
    if (item.status !== 'registered') return false
    return dayjs().diff(dayjs(item.found_at), 'hour') >= 24
  }

  const kw = keyword.trim().toLowerCase()

  const filteredItems = items.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false
    if (!kw) return true
    return (
      i.room_number.toLowerCase().includes(kw) ||
      i.item_name.toLowerCase().includes(kw) ||
      i.found_by.toLowerCase().includes(kw)
    )
  })

  const overdueCount = items.filter(i => isOverdue(i)).length

  const statusOptions = ['all', 'registered', 'claimed', 'returned', 'disputed']

  const emptyHint: Record<string, string> = {
    all: '当前视角下暂无遗留物记录',
    registered: '暂无待处理遗留物',
    claimed: '暂无已认领记录',
    returned: '暂无已退回记录',
    disputed: '暂无争议记录',
  }

  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.pageTitle}>{ROLE_LABELS[role]}工作台</h2>
          <p style={styles.pageSubtitle}>
            当前视角：{ROLE_LABELS[role]}
            {role !== staff?.role && (
              <span style={styles.roleHint}>（你的实际身份是{ROLE_LABELS[staff!.role]}，已切换视角）</span>
            )}
          </p>
        </div>
        <button onClick={() => navigate('/register')} style={styles.registerBtn}>
          + 登记遗留物
        </button>
      </div>

      {todos.length > 0 && (
        <div style={styles.todoGrid}>
          {todos.map(t => (
            <div
              key={t.type}
              onClick={() => handleTodoClick(t)}
              style={styles.todoCard}
            >
              <div style={styles.todoCount}>{t.count}</div>
              <div style={styles.todoLabel}>{t.label}</div>
            </div>
          ))}
          {overdueCount > 0 && (
            <div
              onClick={() => { setFilter('registered'); setKeyword('') }}
              style={styles.todoCardOverdue}
            >
              <div style={styles.todoCountOverdue}>{overdueCount}</div>
              <div style={styles.todoLabelOverdue}>超 24h 未处理</div>
            </div>
          )}
        </div>
      )}

      <div style={styles.filterRow}>
        <div style={styles.filterBar}>
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={filter === s ? styles.filterBtnActive : styles.filterBtn}
            >
              {s === 'all' ? '全部' : STATUS_LABELS[s as ItemStatus]}
            </button>
          ))}
        </div>
        <div style={styles.searchWrap}>
          <input
            type="text"
            placeholder="搜索房间号 / 物品 / 发现人"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={styles.searchInput}
          />
          {keyword && (
            <button onClick={() => setKeyword('')} style={styles.searchClear}>✕</button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={styles.empty}>加载中…</div>
      ) : filteredItems.length === 0 ? (
        <div style={styles.empty}>
          <div>{kw ? `未找到与"${kw}"匹配的记录` : (emptyHint[filter] || '暂无记录')}</div>
          {filter === 'registered' && !kw && overdueCount === 0 && (
            <div style={styles.emptySub}>所有已登记遗留物均已在 24 小时内处理</div>
          )}
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>编号</th>
                <th style={styles.th}>房间</th>
                <th style={styles.th}>物品</th>
                <th style={styles.th}>分类</th>
                <th style={styles.th}>发现人</th>
                <th style={styles.th}>发现时间</th>
                <th style={styles.th}>状态</th>
                <th style={styles.th}>异常</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/items/${item.id}`)}
                  style={styles.row}
                >
                  <td style={styles.td}>{item.id}</td>
                  <td style={styles.td}>{item.room_number}</td>
                  <td style={styles.td}>
                    <span style={styles.itemName}>{item.item_name}</span>
                    {item.item_description && (
                      <span style={styles.itemDesc}>{item.item_description}</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.categoryTag,
                      background: item.category === '贵重物品' ? '#f3e8ff' : item.category === '危险品' ? '#fef2f2' : '#ecfeff',
                      color: item.category === '贵重物品' ? 'var(--color-tag-valuable)' : item.category === '危险品' ? 'var(--color-tag-danger)' : 'var(--color-tag-normal)',
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={styles.td}>{item.found_by}</td>
                  <td style={styles.td}>{dayjs(item.found_at).format('MM-DD HH:mm')}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusTag,
                      background: statusBg(item.status),
                      color: statusColor(item.status),
                    }}>
                      {STATUS_LABELS[item.status]}
                    </span>
                    {isOverdue(item) && (
                      <span style={styles.overdueTag}>超时</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {item.exception_type ? (
                      <span style={styles.exceptionTag}>{item.exception_type}</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  roleHint: {
    color: 'var(--color-warning)',
    fontStyle: 'italic',
  },
  registerBtn: {
    padding: '8px 20px',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  todoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 20,
  },
  todoCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius)',
    padding: '16px 20px',
    boxShadow: 'var(--shadow)',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
  },
  todoCardOverdue: {
    background: '#fef2f2',
    borderRadius: 'var(--radius)',
    padding: '16px 20px',
    boxShadow: 'var(--shadow)',
    cursor: 'pointer',
    border: '1px solid #fecaca',
  },
  todoCount: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--color-primary)',
  },
  todoCountOverdue: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--color-danger)',
  },
  todoLabel: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginTop: 4,
  },
  todoLabelOverdue: {
    fontSize: 13,
    color: 'var(--color-danger)',
    marginTop: 4,
  },
  filterBar: {
    display: 'flex',
    gap: 6,
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  searchInput: {
    padding: '6px 32px 6px 12px',
    borderRadius: 20,
    border: '1px solid var(--color-border)',
    fontSize: 13,
    width: 240,
    outline: 'none',
  },
  searchClear: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'none',
    color: 'var(--color-text-secondary)',
    fontSize: 12,
    padding: 0,
    lineHeight: 1,
  },
  filterBtn: {
    padding: '5px 14px',
    borderRadius: 20,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  },
  filterBtnActive: {
    padding: '5px 14px',
    borderRadius: 20,
    border: '1px solid var(--color-primary)',
    background: '#eff6ff',
    fontSize: 13,
    color: 'var(--color-primary)',
    fontWeight: 500,
  },
  tableWrap: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    padding: '10px 14px',
    borderBottom: '2px solid var(--color-border)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  row: {
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid var(--color-border)',
    verticalAlign: 'top',
  },
  itemName: {
    fontWeight: 500,
    display: 'block',
  },
  itemDesc: {
    display: 'block',
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    marginTop: 2,
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoryTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
  },
  statusTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
  },
  exceptionTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    background: '#fffbeb',
    color: 'var(--color-warning)',
  },
  overdueTag: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 600,
    background: '#fef2f2',
    color: 'var(--color-danger)',
    marginLeft: 4,
    verticalAlign: 'middle',
  },
  empty: {
    textAlign: 'center' as const,
    padding: 40,
    color: 'var(--color-text-secondary)',
    fontSize: 14,
  },
  emptySub: {
    fontSize: 12,
    color: 'var(--color-success)',
    marginTop: 6,
  },
}
