import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { Textarea } from '../../components/common/Input';
import { useData } from '../../contexts/DataContext';
import { INSPECTOR_SIDEBAR, INSPECTION_ITEMS } from '../../utils/constants';
import { InspectionItem, InspectionResult } from '../../types';

export function InspectionForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, tasks, updateTask, submitReport } = useData();
  const [submitting, setSubmitting] = useState(false);

  const task = tasks.find(t => t.id === id);
  const vehicle = task ? vehicles.find(v => v.id === task.vehicleId) : null;
  
  const [items, setItems] = useState<InspectionItem[]>(
    INSPECTION_ITEMS.map(item => ({
      id: item.id,
      name: item.name,
      result: '合格' as InspectionResult,
      remark: '',
    }))
  );
  
  const [remark, setRemark] = useState('');
  const [conclusion, setConclusion] = useState<'合格' | '不合格' | '需复检'>('合格');

  if (!task || !vehicle) {
    return (
      <AppLayout role="inspector" sidebarItems={INSPECTOR_SIDEBAR}>
        <div className="text-center py-16">
          <p className="text-gray-500">未找到检测任务</p>
        </div>
      </AppLayout>
    );
  }

  const handleItemResultChange = (itemId: string, result: InspectionResult) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, result } : item
    ));
  };

  const handleItemRemarkChange = (itemId: string, remark: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, remark } : item
    ));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const hasUnqualified = items.some(item => item.result === '不合格');
      const finalConclusion = hasUnqualified ? '不合格' : conclusion;

      const report = submitReport({
        vehicleId: task.vehicleId,
        taskId: task.id,
        inspectorName: task.inspectorName,
        status: '待审核',
        items,
        conclusion: finalConclusion,
        photos: [],
        remark,
        submittedAt: new Date().toISOString(),
      });

      updateTask(task.id, {
        status: '已完成',
        endTime: new Date().toISOString(),
        reportId: report.id,
      });

      setTimeout(() => {
        setSubmitting(false);
        navigate('/inspector/tasks');
      }, 1000);
    } catch (error) {
      setSubmitting(false);
      console.error('Failed to submit report:', error);
    }
  };

  return (
    <AppLayout role="inspector" sidebarItems={INSPECTOR_SIDEBAR}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">车辆检测</h1>
            <p className="text-gray-500 mt-1">{vehicle.plateNumber}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">车辆信息</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">车牌号</p>
                <p className="font-medium text-gray-900">{vehicle.plateNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">车主</p>
                <p className="font-medium text-gray-900">{vehicle.ownerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">品牌车型</p>
                <p className="font-medium text-gray-900">{vehicle.brand} {vehicle.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">检测类型</p>
                <p className="font-medium text-gray-900">{vehicle.inspectionType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">检测项目</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => {
                const itemInfo = INSPECTION_ITEMS.find(i => i.id === item.id);
                return (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {itemInfo?.description && (
                          <p className="text-sm text-gray-500">{itemInfo.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      {(['合格', '不合格', '不适用'] as InspectionResult[]).map((result) => (
                        <button
                          key={result}
                          onClick={() => handleItemResultChange(item.id, result)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            item.result === result
                              ? result === '合格'
                                ? 'bg-green-500 text-white'
                                : result === '不合格'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {result}
                        </button>
                      ))}
                    </div>

                    {item.result === '不合格' && (
                      <input
                        type="text"
                        placeholder="请说明不合格原因..."
                        value={item.remark || ''}
                        onChange={(e) => handleItemRemarkChange(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">检测结论</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  综合结论
                </label>
                <div className="flex gap-2">
                  {(['合格', '不合格', '需复检'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setConclusion(c)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        conclusion === c
                          ? c === '合格'
                            ? 'bg-green-500 text-white'
                            : c === '不合格'
                              ? 'bg-red-500 text-white'
                              : 'bg-yellow-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="备注信息"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="如有特殊情况或说明，请在此填写"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            取消
          </Button>
          <Button
            className="bg-inspector hover:bg-inspector-dark"
            loading={submitting}
            onClick={handleSubmit}
          >
            <Send className="w-4 h-4" />
            提交审核
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
