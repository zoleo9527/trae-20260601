import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api.js'
import { useRole } from '../context/RoleContext.jsx'
import TodoCard from '../components/TodoCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import RiskBadge from '../components/RiskBadge.jsx'

export default function Home() {
  const { role, current } = useRole()
  const [data, setData] = useState({ todos: [], risks: { high: 0, medium: 0, low: 0 }, recent: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getStats(role).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [role])

  return (
    <div>
      <h2 className="page-title">你好，{current.userName} 👋</h2>
      <p className="page-desc">当前以 <b>{current.name}</b> 身份查看。切换右上角角色可体验不同岗位的待办视角。</p>

      <section className="section">
        <h3 className="section-title">
          <span>📌 我的待办<span className="count">{data.todos.length}</span></span>
          <Link to="/tasks" className="btn btn-ghost btn-sm">查看全部 →</Link>
        </h3>
        {loading ? (
          <div className="empty">加载中...</div>
        ) : data.todos.length === 0 ? (
          <div className="empty">🎉 暂无待办事项</div>
        ) : (
          <div className="todo-grid">
            {data.todos.map(r => <TodoCard key={r.id} record={r} />)}
          </div>
        )}
      </section>

      <section className="section">
        <h3 className="section-title"><span>⚠️ 风险项分布</span></h3>
        <div className="risk-row">
          <div className="risk-stat">
            <div className="risk-stat-icon high">🔴</div>
            <div>
              <div className="risk-stat-num">{data.risks.high}</div>
              <div className="risk-stat-label">高风险项</div>
            </div>
          </div>
          <div className="risk-stat">
            <div className="risk-stat-icon medium">🟠</div>
            <div>
              <div className="risk-stat-num">{data.risks.medium}</div>
              <div className="risk-stat-label">中风险项</div>
            </div>
          </div>
          <div className="risk-stat">
            <div className="risk-stat-icon low">🟢</div>
            <div>
              <div className="risk-stat-num">{data.risks.low}</div>
              <div className="risk-stat-label">低风险项</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h3 className="section-title"><span>🕒 最近变更</span></h3>
        <div className="changes-list">
          {data.recent.map(r => (
            <Link key={r.id} to={`/tasks/${r.id}`} className="change-item">
              <div className="change-dot"></div>
              <div className="change-body">
                <div className="change-title">
                  {r.title}
                  <StatusBadge status={r.status} />
                  <RiskBadge level={r.riskLevel} />
                </div>
                <div className="change-meta">
                  📍 {r.location} · 🆔 {r.id} · 更新于 {r.updatedAt}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
