import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  User,
  Phone,
  CreditCard,
  FileText,
  Package,
  Calendar,
  Stethoscope,
  Heart,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'

export default function ContractNew() {
  const navigate = useNavigate()
  const { currentRole, currentUser } = useAppStore()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    resident_name: '',
    resident_id_card: '',
    resident_phone: '',
    contract_type: '家庭签约',
    service_package: '基础服务包',
    period_start: new Date().toISOString().slice(0, 10),
    period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    team_doctor: currentUser,
    team_nurse: '',
  })
  const [note, setNote] = useState('')

  const handleSubmit = async () => {
    if (!form.resident_name.trim()) {
      alert('请填写居民姓名')
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      const contract = await api.contracts.create({
        ...form,
        created_by: currentUser,
        period_start: new Date(form.period_start).toISOString(),
        period_end: new Date(form.period_end).toISOString(),
      })
      if (note.trim()) {
        await api.contracts.addNote(contract.id, {
          content: note.trim(),
          createdBy: currentUser,
          createdByRole: currentRole,
        })
      }
      navigate(`/contracts/${contract.id}`)
    } catch (e) {
      alert(e instanceof Error ? e.message : '创建失败')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contracts')} className="btn-ghost">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-semibold text-zinc-900">创建家庭签约</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/contracts" className="btn-secondary">取消</Link>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            <Save size={14} />
            保存草稿
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">居民信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <User size={10} /> 居民姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入居民姓名"
                value={form.resident_name}
                onChange={(e) => setForm({ ...form, resident_name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <CreditCard size={10} /> 身份证号
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入身份证号"
                value={form.resident_id_card}
                onChange={(e) => setForm({ ...form, resident_id_card: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <Phone size={10} /> 联系电话
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入联系电话"
                value={form.resident_phone}
                onChange={(e) => setForm({ ...form, resident_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <FileText size={10} /> 签约类型
              </label>
              <select
                className="select-field"
                value={form.contract_type}
                onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
              >
                <option value="家庭签约">家庭签约</option>
                <option value="个人签约">个人签约</option>
              </select>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-zinc-700 mb-4 mt-6">签约信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <Package size={10} /> 服务包
              </label>
              <select
                className="select-field"
                value={form.service_package}
                onChange={(e) => setForm({ ...form, service_package: e.target.value })}
              >
                <option value="基础服务包">基础服务包</option>
                <option value="老年人服务包">老年人服务包</option>
                <option value="慢性病管理包">慢性病管理包</option>
                <option value="孕产妇服务包">孕产妇服务包</option>
              </select>
            </div>
            <div />
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <Calendar size={10} /> 签约起始日期
              </label>
              <input
                type="date"
                className="input-field"
                value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <Calendar size={10} /> 签约截止日期
              </label>
              <input
                type="date"
                className="input-field"
                value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <Stethoscope size={10} /> 全科医生
              </label>
              <input
                type="text"
                className="input-field"
                value={form.team_doctor}
                onChange={(e) => setForm({ ...form, team_doctor: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <Heart size={10} /> 护士
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入护士姓名"
                value={form.team_nurse}
                onChange={(e) => setForm({ ...form, team_nurse: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">初始备注</h3>
            <p className="text-[10px] text-zinc-400 mb-2">
              添加的备注将随签约一起流转至建档流程，建档侧可直接查看
            </p>
            <textarea
              className="input-field min-h-[120px] resize-y"
              placeholder="输入签约相关备注信息..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">操作说明</h3>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                <span>保存后签约状态为"草稿"，可继续编辑</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                <span>点击"提交审核"后，护士将收到待办通知</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                <span>备注信息将自动携带至后续建档流程</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
