
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Descriptions, Spin, message, Input, Space, Divider, Modal, Select, Timeline } from 'antd';
import { ArrowLeft, Send, AlertTriangle, CheckCircle, Clock, MessageSquare, History, Link as LinkIcon } from 'lucide-react';
import { promotionApi, inspectionApi } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { PromotionDisplay, OperationHistory } from '../../shared/types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

export default function PromotionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PromotionDisplay | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await promotionApi.getById(id);
      setData(detail);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待处理', icon: <Clock size={14} className="inline mr-1" /> },
      processing: { color: 'blue', text: '处理中', icon: <MessageSquare size={14} className="inline mr-1" /> },
      completed: { color: 'green', text: '已完成', icon: <CheckCircle size={14} className="inline mr-1" /> },
      has_issue: { color: 'red', text: '有问题', icon: <AlertTriangle size={14} className="inline mr-1" /> },
    };
    const s = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={s.color}>
        {s.icon}
        {s.text}
      </Tag>
    );
  };

  const handleAddRemark = async () => {
    if (!id || !remarkText.trim() || !user) return;
    setSubmittingRemark(true);
    try {
      await promotionApi.addRemark(id, {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        content: remarkText.trim(),
      });
      setRemarkText('');
      message.success('备注添加成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '添加失败');
    } finally {
      setSubmittingRemark(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!id || !newStatus || !user) return;
    try {
      await promotionApi.updateStatus(id, newStatus, user.id, user.name, user.role);
      message.success('状态更新成功');
      setStatusModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  const canUpdateStatus = user?.role === 'product_specialist' || user?.role === 'store_manager';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">促销陈列不存在</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => navigate('/promotion')} className="mb-4">
          返回列表
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{data.title}</h1>
            <div className="flex items-center gap-4">
              {getStatusTag(data.status)}
              <span className="text-gray-500">{data.storeName}</span>
            </div>
          </div>
          {canUpdateStatus && (
            <Button type="primary" onClick={() => setStatusModalVisible(true)}>
              更新状态
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="基本信息" className="border-0 shadow-sm">
            <Descriptions column={1}>
              <Descriptions.Item label="任务描述">{data.description}</Descriptions.Item>
              <Descriptions.Item label="商品专员">{data.productSpecialistName}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="截止日期">{dayjs(data.deadline).format('YYYY-MM-DD')}</Descriptions.Item>
            </Descriptions>

            {data.inspectionCount > 0 && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center text-orange-700">
                  <AlertTriangle size={18} className="mr-2" />
                  <span className="font-medium">该促销陈列关联 {data.inspectionCount} 条巡店整改</span>
                </div>
                <Button type="link" className="p-0 h-auto mt-2" onClick={() => navigate('/inspection')}>
                  查看关联的巡店整改 →
                </Button>
              </div>
            )}
          </Card>

          <Card title="沟通备注" className="border-0 shadow-sm">
            <div className="space-y-4 mb-4">
              {data.remarks.length === 0 ? (
                <p className="text-gray-400 text-center py-4">暂无备注</p>
              ) : (
                data.remarks.map((remark) => (
                  <div key={remark.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{remark.userName}</span>
                      <span className="text-xs text-gray-400">{dayjs(remark.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                    <p className="text-gray-600">{remark.content}</p>
                  </div>
                ))
              )}
            </div>
            <Divider />
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                rows={3}
                placeholder="添加备注..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
              />
              <Button
                type="primary"
                icon={<Send size={16} />}
                onClick={handleAddRemark}
                loading={submittingRemark}
                disabled={!remarkText.trim()}
              >
                发送
              </Button>
            </Space.Compact>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="责任说明" className="border-0 shadow-sm">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">商品专员</p>
                <p className="text-xs text-blue-600">创建任务、提供陈列指导、最终确认效果</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">店长</p>
                <p className="text-xs text-green-600">按要求执行陈列、反馈执行进度、处理相关问题</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1">督导</p>
                <p className="text-xs text-orange-600">巡店检查执行情况、发起整改要求</p>
              </div>
            </div>
          </Card>

          <Card 
            title={
              <div className="flex items-center">
                <History size={18} className="mr-2 text-gray-600" />
                操作历史
              </div>
            } 
            className="border-0 shadow-sm"
          >
            <Timeline
              items={(data as any)?.operationHistory?.map((h: OperationHistory) => ({
                color: h.action === 'status_update' ? 'blue' : h.action === 'create' ? 'green' : 'gray',
                children: (
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">{h.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{h.userName}</span>
                      <span>·</span>
                      <span>{dayjs(h.createdAt).format('MM-DD HH:mm')}</span>
                    </div>
                    {h.rejectReason && (
                      <p className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded">
                        退回原因：{h.rejectReason}
                      </p>
                    )}
                  </div>
                ),
              }))}
            />
            {(!(data as any)?.operationHistory || (data as any).operationHistory.length === 0) && (
              <p className="text-gray-400 text-center py-4 text-sm">暂无操作记录</p>
            )}
          </Card>
        </div>
      </div>

      <Modal
        title="更新状态"
        open={statusModalVisible}
        onOk={handleUpdateStatus}
        onCancel={() => setStatusModalVisible(false)}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="选择新状态"
          value={newStatus}
          onChange={setNewStatus}
        >
          <Option value="pending">待处理</Option>
          <Option value="processing">处理中</Option>
          <Option value="completed">已完成</Option>
          <Option value="has_issue">有问题</Option>
        </Select>
      </Modal>
    </div>
  );
}
