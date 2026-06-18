import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, Clock, MapPin, Check, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, StatusTag } from '@/components/common';
import { MaterialStatusFlow } from '@/components/material';
import { useMaterialStore, useScheduleStore } from '@/store';
import { mockMaterials } from '@/data/mockMaterials';
import { MaterialCategory } from '@/types';
import dayjs from 'dayjs';

export const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentMaterial, fetchMaterialById, transitionMaterial, acknowledgeMaterial, isLoading } = useMaterialStore();
  const { fetchScheduleById } = useScheduleStore();

  React.useEffect(() => {
    if (id) {
      fetchMaterialById(id);
    }
  }, [id]);

  const material = currentMaterial || mockMaterials.find(m => m.id === id);

  if (!material) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">物料清单不存在</p>
        <Button className="mt-4" onClick={() => navigate('/materials')}>
          返回列表
        </Button>
      </div>
    );
  }

  const handleTransition = async (action: string) => {
    if (!id) return;

    const actionLabels: Record<string, string> = {
      START_PREPARE: '开始准备',
      MARK_READY: '确认就绪',
      MARK_BLOCKED: '标记受阻',
      IN_USE: '开始使用',
      RETURN: '确认归还',
    };

    if (confirm(`确定要${actionLabels[action]}吗？`)) {
      await transitionMaterial(id, { action });
    }
  };

  const handleAcknowledge = async (acknowledged: boolean) => {
    if (!id) return;

    const message = acknowledged ? '确认物料符合要求' : '需要调整物料';
    if (confirm(`${message}吗？`)) {
      await acknowledgeMaterial(id, acknowledged);
    }
  };

  const categoryLabels: Record<MaterialCategory, string> = {
    DEMO: '演示类',
    OPERATION: '操作类',
    DISPLAY: '展示类',
  };

  const itemStatusLabels = {
    PENDING: '待准备',
    PREPARED: '已准备',
    DAMAGED: '损坏',
    MISSING: '缺失',
  };

  const groupedMaterials = material.materials.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<MaterialCategory, typeof material.materials>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/materials')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-gray-900">物料清单详情</h1>
          <p className="text-gray-600 mt-1">ID: {material.id}</p>
        </div>
        <StatusTag status={material.status} type="material" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold">排班信息</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">讲师</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {material.scheduleSnapshot.lecturerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">计划时间</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {dayjs(material.scheduleSnapshot.scheduledAt).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">活动地点</p>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {material.scheduleSnapshot.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">预计人数</p>
                  <p className="font-medium">{material.scheduleSnapshot.expectedParticipants}人</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold">物料明细</h3>
              </div>
            </CardHeader>
            <CardBody>
              <MaterialStatusFlow currentStatus={material.status} />

              <div className="mt-6 space-y-6">
                {Object.entries(groupedMaterials).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="font-medium text-gray-900 mb-3">
                      {categoryLabels[category as MaterialCategory]}
                    </h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} {item.unit}
                              {item.remarks && ` - ${item.remarks}`}
                            </p>
                          </div>
                          <span
                            className={`
                              px-2 py-1 rounded text-xs font-medium
                              ${item.status === 'PREPARED' ? 'bg-green-100 text-green-700' : ''}
                              ${item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : ''}
                              ${item.status === 'DAMAGED' ? 'bg-red-100 text-red-700' : ''}
                              ${item.status === 'MISSING' ? 'bg-red-100 text-red-700' : ''}
                            `}
                          >
                            {itemStatusLabels[item.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">操作</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {material.status === 'NOT_STARTED' && (
                <Button
                  className="w-full"
                  onClick={() => handleTransition('START_PREPARE')}
                >
                  开始准备
                </Button>
              )}
              {material.status === 'IN_PROGRESS' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleTransition('MARK_READY')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    确认就绪
                  </Button>
                  <Button
                    className="w-full"
                    variant="danger"
                    onClick={() => handleTransition('MARK_BLOCKED')}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    标记受阻
                  </Button>
                </>
              )}
              {material.status === 'BLOCKED' && (
                <Button
                  className="w-full"
                  onClick={() => handleTransition('START_PREPARE')}
                >
                  继续准备
                </Button>
              )}
              {material.status === 'READY' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleTransition('IN_USE')}
                  >
                    开始使用
                  </Button>
                  {!material.isAcknowledged && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">讲师确认</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAcknowledge(true)}
                        >
                          符合要求
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => handleAcknowledge(false)}
                        >
                          需调整
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {material.status === 'IN_USE' && (
                <Button
                  className="w-full"
                  onClick={() => handleTransition('RETURN')}
                >
                  确认归还
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">准备进度</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  {material.materials.filter(m => m.status === 'PREPARED').length}/
                  {material.materials.length}
                </span>
                <span className="text-sm font-medium">
                  {Math.round(
                    (material.materials.filter(m => m.status === 'PREPARED').length /
                      material.materials.length) *
                      100
                  )}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      (material.materials.filter(m => m.status === 'PREPARED').length /
                        material.materials.length) *
                      100
                    }%`,
                  }}
                />
              </div>

              {material.preparedByName && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">准备人</p>
                  <p className="font-medium">{material.preparedByName}</p>
                </div>
              )}

              {material.startedAt && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">开始时间</p>
                  <p className="font-medium">
                    {dayjs(material.startedAt).format('YYYY-MM-DD HH:mm')}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {material.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold">附件</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {material.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm flex-1 truncate">
                        {attachment.fileName}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
