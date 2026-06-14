import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/Input';
import { useData } from '../../contexts/DataContext';
import { DISPATCHER_SIDEBAR, CAR_BRANDS } from '../../utils/constants';
import { InspectionType } from '../../types';

export function VehicleRegister() {
  const navigate = useNavigate();
  const { addVehicle, addTask } = useData();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    plateNumber: '',
    ownerName: '',
    ownerPhone: '',
    ownerIdCard: '',
    brand: '',
    model: '',
    vinCode: '',
    registerDate: '',
    inspectionType: '初检' as InspectionType,
    remark: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vehicle = addVehicle({
        ...formData,
        status: '待检测',
      });

      addTask({
        vehicleId: vehicle.id,
        inspectorId: 'I001',
        inspectorName: '张检测',
        status: '待执行',
      });

      setTimeout(() => {
        setLoading(false);
        navigate('/dispatcher/tasks');
      }, 500);
    } catch (error) {
      setLoading(false);
      console.error('Failed to register vehicle:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout role="dispatcher" sidebarItems={DISPATCHER_SIDEBAR}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">车辆登记</h1>
            <p className="text-gray-500 mt-1">为到店车辆创建检测任务</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">车主信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="车主姓名 *"
                value={formData.ownerName}
                onChange={(e) => handleChange('ownerName', e.target.value)}
                required
                placeholder="请输入车主姓名"
              />
              
              <Input
                label="联系电话 *"
                value={formData.ownerPhone}
                onChange={(e) => handleChange('ownerPhone', e.target.value)}
                required
                placeholder="请输入手机号码"
              />
              
              <div className="md:col-span-2">
                <Input
                  label="身份证号"
                  value={formData.ownerIdCard}
                  onChange={(e) => handleChange('ownerIdCard', e.target.value)}
                  placeholder="请输入身份证号码"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">车辆信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="车牌号 *"
                value={formData.plateNumber}
                onChange={(e) => handleChange('plateNumber', e.target.value)}
                required
                placeholder="例如：京A·12345"
              />
              
              <Select
                label="车辆品牌 *"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                options={[
                  { value: '', label: '请选择品牌' },
                  ...CAR_BRANDS.map(brand => ({ value: brand, label: brand }))
                ]}
                required
              />
              
              <Input
                label="车型"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                placeholder="例如：BMW 525Li"
              />
              
              <Input
                label="注册日期"
                type="date"
                value={formData.registerDate}
                onChange={(e) => handleChange('registerDate', e.target.value)}
              />
              
              <div className="md:col-span-2">
                <Input
                  label="VIN码"
                  value={formData.vinCode}
                  onChange={(e) => handleChange('vinCode', e.target.value)}
                  placeholder="车辆识别代号"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">检测信息</h2>
            <div className="space-y-4">
              <Select
                label="检测类型 *"
                value={formData.inspectionType}
                onChange={(e) => handleChange('inspectionType', e.target.value as InspectionType)}
                options={[
                  { value: '初检', label: '初检' },
                  { value: '复检', label: '复检' },
                  { value: '变更', label: '变更' },
                ]}
                required
              />
              
              <Textarea
                label="备注信息"
                value={formData.remark}
                onChange={(e) => handleChange('remark', e.target.value)}
                placeholder="如有特殊要求或注意事项，请在此说明"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              <Save className="w-4 h-4" />
              保存并分配任务
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
