import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, PhoneMissed, PhoneOff } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Textarea } from '../../components/common/Input';
import { useData } from '../../contexts/DataContext';
import { ADMIN_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { ContactResult, FollowupResult } from '../../types';

export function FollowupForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, reports, followups, updateFollowup, completeFollowup } = useData();
  const [submitting, setSubmitting] = useState(false);

  const followup = followups.find(f => f.id === id);
  const vehicle = followup ? vehicles.find(v => v.id === followup.vehicleId) : null;
  const report = followup ? reports.find(r => r.id === followup.reportId) : null;

  const [formData, setFormData] = useState<{
    reportReceived: boolean;
    serviceSatisfaction: '非常满意' | '满意' | '一般' | '不满意';
    processSatisfaction: '满意' | '基本满意' | '不满意';
    feedback: string;
  }>({
    reportReceived: true,
    serviceSatisfaction: '满意',
    processSatisfaction: '满意',
    feedback: '',
  });

  const [contactResult, setContactResult] = useState<ContactResult | null>(null);

  if (!followup || !vehicle) {
    return (
      <AppLayout role="admin" sidebarItems={ADMIN_SIDEBAR}>
        <div className="text-center py-16">
          <p className="text-gray-500">未找到回访任务</p>
        </div>
      </AppLayout>
    );
  }

  const handleContactResult = (result: ContactResult) => {
    setContactResult(result);
    
    if (result !== '成功') {
      updateFollowup(followup.id, {
        attempts: followup.attempts + 1,
        status: result === '号码错误' ? '无法联系' : '待回访',
      });
    }
  };

  const handleSubmit = async () => {
    if (contactResult !== '成功') return;
    
    setSubmitting(true);

    const result: FollowupResult = {
      reportReceived: formData.reportReceived,
      serviceSatisfaction: formData.serviceSatisfaction,
      processSatisfaction: formData.processSatisfaction,
      feedback: formData.feedback,
      conclusion: formData.serviceSatisfaction === '非常满意' || formData.serviceSatisfaction === '满意' 
        ? '满意' : '需改进' as string,
      completedAt: new Date().toISOString(),
    };

    completeFollowup(followup.id, result);

    setTimeout(() => {
      setSubmitting(false);
      navigate('/admin/followup');
    }, 1000);
  };

  return (
    <AppLayout role="admin" sidebarItems={ADMIN_SIDEBAR}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">执行回访</h1>
            <p className="text-gray-500 mt-1">{vehicle.plateNumber}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">车主信息</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">车牌号</p>
                <p className="font-medium text-gray-900">{vehicle.plateNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">车主姓名</p>
                <p className="font-medium text-gray-900">{vehicle.ownerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">联系电话</p>
                <p className="font-medium text-gray-900">{vehicle.ownerPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">车辆品牌</p>
                <p className="font-medium text-gray-900">{vehicle.brand} {vehicle.model}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">报告信息</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">检测结论</p>
                <p className={`font-medium ${
                  report?.conclusion === '合格' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {report?.conclusion}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">发放时间</p>
                <p className="font-medium text-gray-900">
                  {formatDate(followup.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">联系结果</h2>
          </CardHeader>
          <CardContent>
            {contactResult === null ? (
              <div className="space-y-3">
                <p className="text-gray-600 mb-4">请记录本次联系的结果：</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="success"
                    onClick={() => handleContactResult('成功')}
                    className="h-16 flex-col"
                  >
                    <CheckCircle className="w-6 h-6 mb-1" />
                    <span>成功联系</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleContactResult('无人接听')}
                    className="h-16 flex-col"
                  >
                    <PhoneMissed className="w-6 h-6 mb-1" />
                    <span>无人接听</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleContactResult('号码错误')}
                    className="h-16 flex-col"
                  >
                    <PhoneOff className="w-6 h-6 mb-1" />
                    <span>号码错误</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleContactResult('拒绝回访')}
                    className="h-16 flex-col"
                  >
                    <PhoneOff className="w-6 h-6 mb-1" />
                    <span>拒绝回访</span>
                  </Button>
                </div>
              </div>
            ) : contactResult !== '成功' ? (
              <div className="text-center py-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  contactResult === '无人接听' ? 'bg-orange-100' : 'bg-red-100'
                }`}>
                  {contactResult === '无人接听' ? (
                    <PhoneMissed className="w-8 h-8 text-orange-600" />
                  ) : (
                    <PhoneOff className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {contactResult === '无人接听' ? '暂时未能联系上车主' : 
                   contactResult === '号码错误' ? '电话号码可能有误' : '车主拒绝回访'}
                </h3>
                <p className="text-gray-500 mb-4">
                  联系次数已更新为 {followup.attempts + 1} 次
                </p>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/admin/followup')}
                >
                  返回列表
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">成功联系到车主</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    车主是否收到检测报告？
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, reportReceived: true }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.reportReceived
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      是，已收到
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, reportReceived: false }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !formData.reportReceived
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      否，未收到
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    对工作人员服务态度评价
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['非常满意', '满意', '一般', '不满意'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setFormData(prev => ({ ...prev, serviceSatisfaction: level }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.serviceSatisfaction === level
                            ? 'bg-admin text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    对检测过程满意吗？
                  </label>
                  <div className="flex gap-2">
                    {(['满意', '基本满意', '不满意'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setFormData(prev => ({ ...prev, processSatisfaction: level }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.processSatisfaction === level
                            ? 'bg-admin text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  label="其他意见或建议"
                  value={formData.feedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="请记录车主的其他反馈..."
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/admin/followup')}
                  >
                    取消
                  </Button>
                  <Button
                    className="bg-admin hover:bg-admin-dark"
                    loading={submitting}
                    onClick={handleSubmit}
                  >
                    提交回访结果
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
