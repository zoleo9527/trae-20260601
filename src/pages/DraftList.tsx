import { Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useApi } from '@/services/api';
import { useWorkflow } from '@/hooks/useWorkflow';
import { statusDisplayMap } from '@/utils/stateMachine';
import ActionButtons from '@/components/ActionButtons';
import AuditTimeline from '@/components/AuditTimeline';
import type { ColumnsType } from 'antd/es/table';
import type { CustomerDraft } from '@/types';

export default function DraftList() {
  const api = useApi();
  const workflow = useWorkflow();
  const drafts = api.getDrafts();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<{ open: boolean; draft: CustomerDraft | null }>({
    open: false,
    draft: null,
  });
  const [form] = Form.useForm();

  const handleCreate = () => {
    form.validateFields().then((values) => {
      api.createDraft({
        ...values,
        orderNo: api.generateOrderNo('DD'),
        draftUrl: '/drafts/default.jpg',
        createdBy: api.getCurrentUser().id,
      });
      message.success('稿件创建成功');
      setModalOpen(false);
      form.resetFields();
    });
  };

  const columns: ColumnsType<CustomerDraft> = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '尺寸',
      key: 'size',
      render: (_, record) => (
        <span>
          {record.width} × {record.height} {record.unit}
        </span>
      ),
    },
    {
      title: '材料类型',
      dataIndex: 'materialType',
      key: 'materialType',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={statusDisplayMap[s]?.color}>{statusDisplayMap[s]?.text}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => setDetailModal({ open: true, draft: record })}>
            查看详情
          </Button>
          {record.status === 'approved' && (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                if (api.getCurrentUser().role === 'processor') {
                  message.error('处理人员不能提交排产');
                  return;
                }
                const schedules = api.getSchedulesByDraftId(record.id);
                if (schedules.length > 0) {
                  message.error('该稿件已有排产');
                  return;
                }
                Modal.confirm({
                  title: '提交喷绘排产',
                  content: '确定要将此稿件提交喷绘排产吗？',
                  onOk: () => {
                    workflow.submitScheduleFromDraft(record.id, 1, 'normal');
                  },
                });
              }}
            >
              提交排产
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const selectedDraft = detailModal.draft;
  const logs = selectedDraft ? api.getAuditLogsByEntity('draft', selectedDraft.id) : [];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>客户稿件列表</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建稿件
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={drafts}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div>
              <p><strong>联系电话:</strong> {record.customerPhone}</p>
              <p><strong>颜色要求:</strong> {record.colorRequirement}</p>
              <p><strong>安装地址:</strong> {record.installationAddress}</p>
              <p><strong>预计安装日期:</strong> {record.scheduledInstallDate}</p>
              {record.remark && <p><strong>备注:</strong> {record.remark}</p>}
              <div style={{ marginTop: 16 }}>
                <h4>可用操作</h4>
                <ActionButtons
                  actions={workflow.getDraftAvailableActions(record.status)}
                  onAction={(target, remark) => {
                    if (target === 'size_issue' && remark) {
                      return workflow.reportSizeIssue(record.id, remark);
                    }
                    if (target === 'color_issue' && remark) {
                      return workflow.reportColorIssue(record.id, remark);
                    }
                    return workflow.transitionDraft(
                      record.id,
                      target as CustomerDraft['status'],
                      remark
                    );
                  }}
                  entityType="draft"
                  entityId={record.id}
                />
              </div>
            </div>
          ),
        }}
      />

      <Modal
        title="新建客户稿件"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customerName" label="客户名称" rules={[{ required: true }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="customerPhone" label="联系电话" rules={[{ required: true }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input placeholder="请输入喷绘内容" />
          </Form.Item>
          <Space>
            <Form.Item name="width" label="宽度(cm)" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="height" label="高度(cm)" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="unit" label="单位" initialValue="cm">
              <Select
                options={[
                  { value: 'cm', label: '厘米' },
                  { value: 'm', label: '米' },
                ]}
              />
            </Form.Item>
          </Space>
          <Form.Item name="materialType" label="材料类型" rules={[{ required: true }]}>
            <Select
              options={[
                { value: '户外背胶', label: '户外背胶' },
                { value: '相纸', label: '相纸' },
                { value: '灯箱片', label: '灯箱片' },
                { value: '550喷绘布', label: '550喷绘布' },
                { value: '相纸+X展架', label: '相纸+X展架' },
              ]}
            />
          </Form.Item>
          <Form.Item name="colorRequirement" label="颜色要求">
            <Input.TextArea rows={2} placeholder="请输入颜色要求" />
          </Form.Item>
          <Form.Item name="installationAddress" label="安装地址" rules={[{ required: true }]}>
            <Input placeholder="请输入安装地址" />
          </Form.Item>
          <Form.Item name="scheduledInstallDate" label="预计安装日期" rules={[{ required: true }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="稿件详情"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, draft: null })}
        footer={null}
        width={800}
      >
        {selectedDraft && (
          <div>
            <p><strong>订单编号:</strong> {selectedDraft.orderNo}</p>
            <p><strong>客户名称:</strong> {selectedDraft.customerName}</p>
            <p><strong>联系电话:</strong> {selectedDraft.customerPhone}</p>
            <p><strong>内容:</strong> {selectedDraft.content}</p>
            <p><strong>尺寸:</strong> {selectedDraft.width} × {selectedDraft.height} {selectedDraft.unit}</p>
            <p><strong>材料类型:</strong> {selectedDraft.materialType}</p>
            <p><strong>颜色要求:</strong> {selectedDraft.colorRequirement}</p>
            <p><strong>安装地址:</strong> {selectedDraft.installationAddress}</p>
            <p><strong>预计安装日期:</strong> {selectedDraft.scheduledInstallDate}</p>
            <p><strong>状态:</strong> <Tag color={statusDisplayMap[selectedDraft.status]?.color}>{statusDisplayMap[selectedDraft.status]?.text}</Tag></p>
            {selectedDraft.remark && <p><strong>备注:</strong> {selectedDraft.remark}</p>}
            <h4 style={{ marginTop: 16 }}>操作留痕</h4>
            <AuditTimeline logs={logs} />
          </div>
        )}
      </Modal>
    </div>
  );
}
