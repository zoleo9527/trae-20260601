
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tag,
  Descriptions,
  Spin,
  message,
  Input,
  Space,
  Divider,
  Modal,
  Alert,
  Timeline as AntdTimeline,
  Tabs,
} from 'antd';
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  RotateCcw,
  ThumbsUp,
  XCircle,
  Link as LinkIcon,
  History,
} from 'lucide-react';
import { inspectionApi } from '../api/client';
import { useUserStore } from '../store/userStore';
import type { InspectionRectification, OperationHistory, Remark } from '../../shared/types';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InspectionRectification | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await inspectionApi.getById(id);
      setData(detail);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待整改', icon: <Clock size={14} className="inline mr-1" /> },
      processing: { color: 'blue', text: '整改中', icon: <MessageSquare size={14} className="inline mr-1" /> },
      reviewing: { color: 'purple', text: '待审核', icon: <Clock size={14} className="inline mr-1" /> },
      completed: { color: 'green', text: '已完成', icon: <CheckCircle size={14} className="inline mr-1" /> },
      rejected: { color: 'red', text: '已退回', icon: <XCircle size={14} className="inline mr-1" /> },
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
      await inspectionApi.addRemark(id, {
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

  const handleSubmitReply = async () => {
    if (!id || !replyText.trim() || !user) return;
    setSubmittingReply(true);
    try {
      await inspectionApi.reply(id, {
        content: replyText.trim(),
        images: [],
        userId: user.id,
        userName: user.name,
        userRole: user.role,
      });
      setReplyText('');
      message.success('整改回复已提交，等待督导审核');
      loadData();
    } catch (error: any) {
      message.error(error.message || '提交失败');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleApprove = async () => {
    if (!id || !user) return;
    try {
      await inspectionApi.updateStatus(id, 'completed', undefined, user.id, user.name, user.role);
      message.success('整改审核通过');
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim() || !user) {
      message.warning('请填写退回原因');
      return;
    }
    try {
      const res = await inspectionApi.updateStatus(id, 'rejected', rejectReason.trim(), user.id, user.name, user.role);
      if (res.rejected) {
        message.error('整改已退回，店长将收到提醒', 3);
      }
      setRejectModalVisible(false);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleStartProcessing = async () => {
    if (!id || !user) return;
    try {
      await inspectionApi.updateStatus(id, 'processing', undefined, user.id, user.name, user.role);
      message.success('已开始整改');
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const canReply = user?.role === 'store_manager' && (data?.status === 'pending' || data?.status === 'rejected' || data?.status === 'processing');
  const canAudit = user?.role === 'supervisor' && data?.status === 'reviewing';
  const canStartProcessing = user?.role === 'store_manager' && data?.status === 'pending';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">巡店整改不存在</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => navigate('/inspection')} className="mb-4">
          返回列表
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{data.title}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              {getStatusTag(data.status)}
              <span className="text-gray-500">{data.storeName}</span>
              {data.promotionTitle && (
                <Tag color="blue" icon={<LinkIcon size={12} />}>
                  关联：{data.promotionTitle}
                </Tag>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {canStartProcessing && (
              <Button type="primary" onClick={handleStartProcessing}>
                开始整改
              </Button>
            )}
            {canAudit && (
              <>
                <Button type="primary" icon={<ThumbsUp size={16} />} onClick={handleApprove}>
                  审核通过
                </Button>
                <Button danger icon={<RotateCcw size={16} />} onClick={() => setRejectModalVisible(true)}>
                  退回整改
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {data.status === 'rejected' && data.lastRejectReason && (
        <Alert
          message="整改被退回"
          description={`退回原因：${data.lastRejectReason}`}
          type="error"
          showIcon
          icon={<XCircle size={20} />}
          className="mb-6"
        />
      )}

      {data.rejectCount > 0 && (
        <Alert
          message={`该整改已被退回 ${data.rejectCount} 次，请认真对待`}
          type="warning"
          showIcon
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="问题描述" className="border-0 shadow-sm">
            <p className="text-gray-700 mb-4">{data.description}</p>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="整改要求">{data.requirement}</Descriptions.Item>
              <Descriptions.Item label="督导">{data.supervisorName}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(data.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="截止日期">{dayjs(data.deadline).format('YYYY-MM-DD')}</Descriptions.Item>
            </Descriptions>
          </Card>

          {data.replyContent && (
            <Card title="店长整改回复" className="border-0 shadow-sm">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-gray-700">{data.replyContent}</p>
                <p className="text-xs text-gray-500 mt-2">回复时间：{dayjs(data.replyAt).format('YYYY-MM-DD HH:mm')}</p>
              </div>
            </Card>
          )}

          {canReply && (
            <Card title="提交整改回复" className="border-0 shadow-sm">
              <TextArea
                rows={4}
                placeholder="详细描述整改情况，可上传整改后照片..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="mb-4"
              />
              <Button
                type="primary"
                onClick={handleSubmitReply}
                loading={submittingReply}
                disabled={!replyText.trim()}
              >
                提交整改回复
              </Button>
            </Card>
          )}

          <Card 
            title="沟通记录与操作历史" 
            className="border-0 shadow-sm"
            extra={
              <Tag color="blue" icon={<LinkIcon size={12} />}>
                含关联促销陈列备注
              </Tag>
            }
          >
            <Tabs
              defaultActiveKey="remarks"
              items={[
                {
                  key: 'remarks',
                  label: '沟通记录',
                  children: (
                    <div>
                      <AntdTimeline
                        items={data.remarks.map((remark: Remark) => ({
                          color: remark.source === 'promotion' ? 'blue' : 'gray',
                          dot: remark.source === 'promotion' ? <LinkIcon size={14} /> : <MessageSquare size={14} />,
                          children: (
                            <div className={`p-3 rounded-lg ${remark.source === 'promotion' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-gray-800">
                                  {remark.userName}
                                  {remark.source === 'promotion' && (
                                    <Tag color="blue" className="ml-2">来自促销陈列</Tag>
                                  )}
                                </span>
                                <span className="text-xs text-gray-400">{dayjs(remark.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                              </div>
                              <p className="text-gray-600 text-sm">{remark.content}</p>
                              {remark.source === 'promotion' && data.promotionId && (
                                <Button 
                                  type="link" 
                                  size="small" 
                                  className="p-0 h-auto mt-2 text-blue-600"
                                  onClick={() => navigate(`/promotion/${data.promotionId}`)}
                                >
                                  查看促销陈列详情 →
                                </Button>
                              )}
                            </div>
                          ),
                        }))}
                      />
                      {data.remarks.length === 0 && (
                        <p className="text-gray-400 text-center py-4">暂无沟通记录</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'history',
                  label: '操作历史',
                  children: (
                    <div>
                      <AntdTimeline
                        items={(data as any)?.operationHistory?.map((h: OperationHistory) => ({
                          color: h.action === 'status_update' 
                            ? (h.rejectReason ? 'red' : 'blue') 
                            : h.action === 'create' 
                            ? 'green' 
                            : h.action === 'reply' 
                            ? 'purple' 
                            : 'gray',
                          children: (
                            <div className="text-sm">
                              <p className="font-medium text-gray-800">{h.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span>{h.userName}</span>
                                <span>·</span>
                                <span>{dayjs(h.createdAt).format('MM-DD HH:mm')}</span>
                              </div>
                              {h.rejectReason && (
                                <p className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                                  <XCircle size={12} className="inline mr-1" />
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
                    </div>
                  ),
                },
              ]}
            />
            <Divider />
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                rows={2}
                placeholder="添加沟通备注（所有相关人员可见）..."
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
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1">督导</p>
                <p className="text-xs text-orange-600">发起整改、审核整改结果、退回不合格项</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">店长</p>
                <p className="text-xs text-green-600">执行整改、提交整改回复、查看退回原因</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">商品专员</p>
                <p className="text-xs text-blue-600">查看关联促销的整改情况</p>
              </div>
            </div>
          </Card>

          {data.promotionId && (
            <Card title="关联促销陈列" className="border-0 shadow-sm">
              <div
                className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => navigate(`/promotion/${data.promotionId}`)}
              >
                <p className="font-medium text-blue-800">{data.promotionTitle}</p>
                <p className="text-xs text-blue-600 mt-1">点击查看促销陈列详情 →</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        title="退回整改"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="确认退回"
        okButtonProps={{ danger: true }}
      >
        <p className="mb-3 text-gray-600">请填写退回原因，店长将收到提醒：</p>
        <TextArea
          rows={4}
          placeholder="请详细说明整改不合格的地方..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
