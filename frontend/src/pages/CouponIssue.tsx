import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Send, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { couponApi, memberApi, policyApi, batchApi } from '@/services/api'
import type { Member, Policy, Batch } from '@/types'

export default function CouponIssue() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [members, setMembers] = useState<Member[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [batches, setBatches] = useState<Batch[]>([])

  const [formData, setFormData] = useState({
    member_id: '',
    policy_id: '',
    batch_id: '',
    expiry_date: '',
    issue_remarks: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [membersRes, policiesRes, batchesRes] = await Promise.all([
        memberApi.list({ limit: 100 }),
        policyApi.list({ status: 'active' }),
        batchApi.list({ status: 'normal,expiring' }),
      ])

      if (membersRes.success) setMembers(membersRes.data.items)
      if (policiesRes.success) setPolicies(policiesRes.data)
      if (batchesRes.success) setBatches(batchesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNum === 1) {
      if (!formData.member_id) {
        newErrors.member_id = '请选择会员'
      }
    }

    if (stepNum === 2) {
      if (!formData.policy_id) {
        newErrors.policy_id = '请选择促销政策'
      }
      if (!formData.expiry_date) {
        newErrors.expiry_date = '请选择有效期'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (submitType: 'save' | 'submit') => {
    if (submitType === 'submit' && !validateStep(2)) {
      return
    }

    setSubmitting(true)
    try {
      const data: Record<string, any> = {
        member_id: parseInt(formData.member_id),
        policy_id: parseInt(formData.policy_id),
        expiry_date: formData.expiry_date,
        issue_remarks: formData.issue_remarks,
      }

      if (formData.batch_id) {
        data.batch_id = parseInt(formData.batch_id)
      }

      const response = await couponApi.create(data)

      if (response.success && response.data) {
        if (submitType === 'submit') {
          await couponApi.submit(response.data.id)
        }
        navigate(`/coupons/${response.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create coupon:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedMember = members.find((m) => m.id === parseInt(formData.member_id))
  const selectedPolicy = policies.find((p) => p.id === parseInt(formData.policy_id))

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/coupons"
            className="p-2 hover:bg-gray-100 rounded-lg mr-4 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">新建发放</h1>
            <p className="text-gray-500 mt-1">填写促销券发放信息</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            1
          </div>
          <div
            className={`w-24 h-1 ${
              step >= 2 ? 'bg-primary' : 'bg-gray-200'
            }`}
          ></div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            2
          </div>
          <div
            className={`w-24 h-1 ${
              step >= 3 ? 'bg-primary' : 'bg-gray-200'
            }`}
          ></div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            3
          </div>
        </div>
      </div>

      <div className="card max-w-4xl mx-auto">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              选择会员
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会员 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.member_id}
                  onChange={(e) =>
                    setFormData({ ...formData, member_id: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">请选择会员</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.phone}
                      {member.baby_name && ` (宝宝: ${member.baby_name})`}
                    </option>
                  ))}
                </select>
                {errors.member_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.member_id}</p>
                )}
              </div>

              {selectedMember && (
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <h3 className="font-medium text-gray-800 mb-3">会员信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">姓名：</span>
                      <span className="ml-2">{selectedMember.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">手机：</span>
                      <span className="ml-2">{selectedMember.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">宝宝：</span>
                      <span className="ml-2">
                        {selectedMember.baby_name || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">等级：</span>
                      <span className="ml-2 capitalize">
                        {selectedMember.tier}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">积分：</span>
                      <span className="ml-2">{selectedMember.points}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              选择政策与有效期
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  促销政策 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {policies.map((policy) => (
                    <label
                      key={policy.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.policy_id === policy.id.toString()
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="policy"
                        value={policy.id}
                        checked={formData.policy_id === policy.id.toString()}
                        onChange={(e) =>
                          setFormData({ ...formData, policy_id: e.target.value })
                        }
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-800">
                            {policy.name}
                          </h3>
                          <span className="text-lg font-bold text-primary">
                            ¥{policy.discount_amount}
                          </span>
                        </div>
                        {policy.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {policy.description}
                          </p>
                        )}
                        {policy.start_date && policy.end_date && (
                          <p className="text-xs text-gray-400 mt-2">
                            有效期：{policy.start_date} 至 {policy.end_date}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.policy_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.policy_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  券有效期至 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expiry_date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {errors.expiry_date && (
                  <p className="mt-1 text-sm text-red-500">{errors.expiry_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关联奶粉批号
                </label>
                <div className="relative">
                  <Package
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <select
                    value={formData.batch_id}
                    onChange={(e) =>
                      setFormData({ ...formData, batch_id: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">不关联</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batch_number} - {batch.supplier}
                        {batch.expiry_date && ` (到期: ${batch.expiry_date})`}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  如有购买奶粉，可关联批号以便追溯
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              填写备注与确认
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发放备注
                </label>
                <textarea
                  value={formData.issue_remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, issue_remarks: e.target.value })
                  }
                  rows={4}
                  placeholder="请填写发放备注，这些信息将在复核时展示给店长..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <div className="mt-2 flex items-start space-x-2 text-xs text-primary-600 bg-primary-50 p-2 rounded">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>这些备注将自动流转至复核环节，店长可以查看完整备注历史。请详细填写发放原因、顾客需求等信息。</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-4">发放信息确认</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">会员</span>
                    <span className="font-medium">{selectedMember?.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">促销政策</span>
                    <span className="font-medium">
                      {selectedPolicy?.name} (¥{selectedPolicy?.discount_amount})
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">有效期至</span>
                    <span className="font-medium">{formData.expiry_date}</span>
                  </div>
                  {formData.batch_id && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-500">关联批号</span>
                      <span className="font-medium">
                        {batches.find((b) => b.id === parseInt(formData.batch_id))
                          ?.batch_number || '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={step === 1 ? () => navigate('/coupons') : handleBack}
            className="btn btn-secondary"
          >
            {step === 1 ? '取消' : '上一步'}
          </button>

          <div className="space-x-3">
            {step < 3 ? (
              <button onClick={handleNext} className="btn btn-primary">
                下一步
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSubmit('save')}
                  disabled={submitting}
                  className="btn btn-secondary"
                >
                  <Save size={18} className="mr-2 inline" />
                  保存草稿
                </button>
                <button
                  onClick={() => handleSubmit('submit')}
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  <Send size={18} className="mr-2 inline" />
                  提交复核
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
