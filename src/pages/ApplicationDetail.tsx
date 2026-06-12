import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, User, FileText, Calendar, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import StepNavigator from '@/components/common/StepNavigator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function ApplicationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const app = useAppStore((s) => s.getApplicationById(id || ''));

  if (!app) {
    return (
      <div className="text-center py-20 text-navy-500">
        申请记录不存在
        <button onClick={() => navigate('/')} className="btn-primary mt-4 mx-auto block">
          返回工作台
        </button>
      </div>
    );
  }

  const nextStep = () => {
    if (app.status === 'pending' || app.status === 'inspecting') {
      navigate(`/application/${app.id}/inspection`);
    } else if (app.inspection) {
      navigate(`/application/${app.id}/cost`);
    } else {
      navigate(`/application/${app.id}/confirm`);
    }
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
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold text-navy-900">退租申请详情</h1>
          <p className="text-sm text-navy-500 mt-1">申请编号 {app.id}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <StepNavigator currentStep={0} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 animate-fade-in-up opacity-0 stagger-1">
            <h2 className="section-title">
              <Building2 className="w-5 h-5 text-navy-600" />
              租户信息
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-navy-400 mb-1">公司名称</p>
                <p className="text-navy-800 font-medium">{app.tenant.companyName}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">联系人 / 电话</p>
                <p className="text-navy-800 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-navy-400" strokeWidth={2} />
                  {app.tenant.contactPerson} · {app.tenant.contactPhone}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-2">
            <h2 className="section-title">
              <FileText className="w-5 h-5 text-navy-600" />
              合同信息
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-navy-400 mb-1">合同编号</p>
                <p className="text-navy-800 font-medium font-mono text-sm">{app.contract.contractNo}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">租赁位置</p>
                <p className="text-navy-800">{app.contract.floorRoom}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">租赁面积</p>
                <p className="text-navy-800">{app.contract.area} ㎡</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">押金金额</p>
                <p className="text-amber-600 font-serif text-lg font-semibold money-text">
                  {formatCurrency(app.contract.depositAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">日租金</p>
                <p className="text-navy-800 money-text">{formatCurrency(app.contract.dailyRent)}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  合同期限
                </p>
                <p className="text-navy-800 text-sm">
                  {formatDate(app.contract.startDate)} ~ {formatDate(app.contract.endDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-3">
            <h2 className="section-title">
              <Calendar className="w-5 h-5 text-navy-600" />
              退租信息
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-navy-400 mb-1">退租原因</p>
                <p className="text-navy-800">{app.surrenderInfo.reason}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">预计退场日期</p>
                <p className="text-navy-800">{formatDate(app.surrenderInfo.expectedMoveOutDate)}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">申请时间</p>
                <p className="text-navy-800">{formatDate(app.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">租赁顾问</p>
                <p className="text-navy-800">{app.surrenderInfo.applicant}</p>
              </div>
              {app.surrenderInfo.remark && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-navy-400 mb-1">备注</p>
                  <p className="text-navy-700 bg-navy-50 rounded px-3 py-2 text-sm">
                    {app.surrenderInfo.remark}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 sticky top-6 animate-fade-in-up opacity-0 stagger-4">
            <h3 className="font-serif text-base font-semibold text-navy-800 mb-4">流程进度</h3>
            <div className="space-y-4">
              {[
                { label: '退租申请已提交', done: true, time: app.createdAt },
                {
                  label: '退场验收',
                  done: !!app.inspection && !!app.inspection.inspectionDate,
                  time: app.inspection?.inspectionDate,
                  path: `inspection`,
                },
                {
                  label: '费用明细核算',
                  done: !!app.costBreakdown,
                  time: app.costBreakdown?.preparedAt,
                  path: 'cost',
                },
                {
                  label: '客户确认',
                  done: app.confirmation?.finalConfirmed,
                  time: app.confirmation?.confirmedAt,
                  path: 'confirm',
                },
              ].map((step, idx, arr) => (
                <div key={idx} className="flex gap-3 group">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-medium transition-all ${
                        step.done
                          ? 'bg-sage-500 text-white shadow-md shadow-sage-200'
                          : 'bg-navy-100 text-navy-400'
                      }`}
                    >
                      {step.done ? '✓' : idx + 1}
                    </div>
                    {idx < arr.length - 1 && (
                      <div
                        className={`w-px flex-1 my-1 ${step.done ? 'bg-sage-300' : 'bg-navy-100'}`}
                      ></div>
                    )}
                  </div>
                  <div
                    className={`flex-1 pb-4 cursor-pointer ${
                      step.path && (step.done || idx <= 2)
                        ? 'hover:text-navy-700 group-hover:translate-x-0.5 transition-all'
                        : ''
                    }`}
                    onClick={() => step.path && navigate(`/application/${app.id}/${step.path}`)}
                  >
                    <p
                      className={`text-sm font-medium ${
                        step.done ? 'text-sage-700' : 'text-navy-700'
                      } flex items-center gap-1`}
                    >
                      {step.label}
                      {step.path && <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </p>
                    {step.time && (
                      <p className="text-xs text-navy-400 mt-0.5">{formatDate(step.time)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-navy-100">
              <button onClick={nextStep} className="btn-primary w-full">
                进入下一步
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
