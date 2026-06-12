import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, User, FileText, Send } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { formatCurrency, generateId } from '@/utils/formatters';
import type { SurrenderApplication } from '@/types';

export default function NewApplication() {
  const navigate = useNavigate();
  const addApplication = useAppStore((s) => s.addApplication);

  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    contactPhone: '',
    contractNo: '',
    floorRoom: '',
    area: '',
    depositAmount: '',
    startDate: '',
    endDate: '',
    dailyRent: '',
    reason: '合同到期不再续租',
    expectedMoveOutDate: '',
    remark: '',
    applicant: '李顾问',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const estimatedDeposit = (Number(form.area) || 0) * 600;
  const estimatedDailyRent = (Number(form.area) || 0) * 3.8;

  const handleSubmit = () => {
    const app = {
      tenant: {
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        contactPhone: form.contactPhone,
      },
      contract: {
        contractNo: form.contractNo,
        floorRoom: form.floorRoom,
        area: Number(form.area) || 0,
        depositAmount: Number(form.depositAmount) || estimatedDeposit,
        startDate: form.startDate,
        endDate: form.endDate,
        dailyRent: Number(form.dailyRent) || estimatedDailyRent,
      },
      surrenderInfo: {
        reason: form.reason,
        expectedMoveOutDate: form.expectedMoveOutDate,
        remark: form.remark,
        applicant: form.applicant,
      },
    } as Omit<SurrenderApplication, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'confirmation'>;

    addApplication(app);
    navigate('/');
  };

  return (
    <div className="animate-fade-in opacity-0">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-lg bg-white border border-navy-100 flex items-center justify-center text-navy-600 hover:bg-navy-50 transition-colors"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2} />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">新建退租申请</h1>
          <p className="text-sm text-navy-500 mt-1">由租赁顾问录入租户和合同信息，发起退租流程</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 animate-fade-in-up opacity-0 stagger-1">
            <h2 className="section-title">
              <Building2 className="w-5 h-5 text-navy-600" />
              租户信息
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="label-field">公司名称 *</label>
                <input
                  className="input-field"
                  placeholder="请输入公司全称"
                  value={form.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">联系人 *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" strokeWidth={2} />
                  <input
                    className="input-field pl-9"
                    placeholder="联系人姓名"
                    value={form.contactPerson}
                    onChange={(e) => update('contactPerson', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label-field">联系电话 *</label>
                <input
                  className="input-field"
                  placeholder="手机号码"
                  value={form.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-2">
            <h2 className="section-title">
              <FileText className="w-5 h-5 text-navy-600" />
              合同信息
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-field">合同编号 *</label>
                <input
                  className="input-field"
                  placeholder="如 HT-2024-0892"
                  value={form.contractNo}
                  onChange={(e) => update('contractNo', e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">租赁楼层/房号 *</label>
                <input
                  className="input-field"
                  placeholder="如 A座 23层 2301"
                  value={form.floorRoom}
                  onChange={(e) => update('floorRoom', e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">租赁面积（㎡）</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="520"
                  value={form.area}
                  onChange={(e) => update('area', e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">押金金额（元）</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="留空将按面积×600估算"
                  value={form.depositAmount}
                  onChange={(e) => update('depositAmount', e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">合同起始日期</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">合同到期日期</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">日租金（元/天）</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="留空将按面积×3.8估算"
                  value={form.dailyRent}
                  onChange={(e) => update('dailyRent', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-3">
            <h2 className="section-title">
              <Send className="w-5 h-5 text-navy-600" />
              退租信息
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-field">退租原因</label>
                <select
                  className="input-field"
                  value={form.reason}
                  onChange={(e) => update('reason', e.target.value)}
                >
                  <option>合同到期不再续租</option>
                  <option>业务调整搬迁</option>
                  <option>公司解散清算</option>
                  <option>业务缩减</option>
                  <option>其他原因</option>
                </select>
              </div>
              <div>
                <label className="label-field">预计退场日期 *</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.expectedMoveOutDate}
                  onChange={(e) => update('expectedMoveOutDate', e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">租赁顾问</label>
                <input
                  className="input-field"
                  value={form.applicant}
                  onChange={(e) => update('applicant', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">备注说明</label>
                <textarea
                  className="input-field min-h-[90px] resize-none"
                  placeholder="其他需要说明的情况..."
                  value={form.remark}
                  onChange={(e) => update('remark', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 sticky top-6 animate-fade-in-up opacity-0 stagger-4">
            <h3 className="font-serif text-base font-semibold text-navy-800 mb-4">信息预览</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500">押金估算</span>
                <span className="money-text text-navy-800 font-semibold">
                  {formatCurrency(Number(form.depositAmount) || estimatedDeposit)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500">日租金</span>
                <span className="money-text text-navy-800">
                  {formatCurrency(Number(form.dailyRent) || estimatedDailyRent)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500">租赁面积</span>
                <span className="text-navy-800">{form.area || '--'} ㎡</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-navy-500">预计退场</span>
                <span className="text-navy-800">{form.expectedMoveOutDate || '--'}</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-navy-100 space-y-3">
              <button onClick={handleSubmit} className="btn-primary w-full">
                <Save className="w-4 h-4" />
                保存并发起流程
              </button>
              <button onClick={() => navigate('/')} className="btn-secondary w-full">
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
