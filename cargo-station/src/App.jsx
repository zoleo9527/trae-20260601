import { useState } from 'react'
import AcceptanceForm from './components/AcceptanceForm'
import CustomerServiceView from './components/CustomerServiceView'
import LoadingImpactView from './components/LoadingImpactView'
import VerificationReview from './components/VerificationReview'

const ROLES = [
  { key: 'clerk', label: '货运员', desc: '托运受理·货品录入' },
  { key: 'loading_supervisor', label: '装卸班长', desc: '装车影响评估' },
  { key: 'customer_service', label: '客服', desc: '票据退回查询' },
]

const STATUS_MAP = {
  accepted: { label: '已受理', className: 'status-accepted' },
  reviewing: { label: '复核中', className: 'status-reviewing' },
  approved: { label: '已通过', className: 'status-approved' },
  rejected: { label: '已退回', className: 'status-rejected' },
  supplementing: { label: '补资料中', className: 'status-supplementing' },
}

export { STATUS_MAP }

export default function App() {
  const [role, setRole] = useState('clerk')
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-wide">铁路货运站</h1>
              <p className="text-blue-200 text-sm mt-0.5">托运受理与票据复核</p>
            </div>
            <div className="flex gap-1">
              {ROLES.map(r => (
                <button
                  key={r.key}
                  onClick={() => { setRole(r.key); setShowForm(false) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    role === r.key
                      ? 'bg-white text-blue-900 shadow'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <span>{r.label}</span>
                  <span className="ml-1 text-xs opacity-70">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {role === 'clerk' && !showForm && (
          <div className="mb-4">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + 新增托运受理
            </button>
          </div>
        )}

        {role === 'clerk' && showForm && (
          <AcceptanceForm onClose={() => setShowForm(false)} />
        )}

        {role === 'loading_supervisor' && <LoadingImpactView />}
        {role === 'customer_service' && <CustomerServiceView />}

        {!(role === 'clerk' && showForm) && (
          <VerificationReview role={role} />
        )}
      </main>
    </div>
  )
}
