import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Tag,
  Space,
  Popconfirm,
  App as AntdApp,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { api } from '../api';
import { Contract, Equipment, CONTRACT_STATUS_LABELS } from '@shared/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const ContractList: React.FC = () => {
  const { message: msg } = AntdApp.useApp();
  const [list, setList] = useState<Contract[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [viewing, setViewing] = useState<Contract | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [statusFilter, searchText]);

  useEffect(() => {
    api.getEquipment().then(setEquipmentList);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getContracts({
      status: statusFilter,
      search: searchText || undefined,
    });
    setList(data);
    setLoading(false);
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      active: 'blue',
      completed: 'green',
      cancelled: 'default',
    };
    return map[status] || 'default';
  };

  const idleEquipment = equipmentList.filter((e) => e.status === 'idle' || (editing && e.id === editing.equipmentId));

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      dailyRate: 1000,
      deposit: 20000,
      contractNo: `HT-${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 900) + 100)}`,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: Contract) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      rentRange: [dayjs(record.rentStartDate), dayjs(record.plannedReturnDate)],
    });
    setModalOpen(true);
  };

  const handleView = (record: Contract) => {
    setViewing(record);
    setDetailOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.rentRange;
      const data = {
        ...values,
        rentStartDate: start.format('YYYY-MM-DD'),
        plannedReturnDate: end.format('YYYY-MM-DD'),
      };
      delete data.rentRange;

      if (editing) {
        await api.updateContract(editing.id, data);
        msg.success('修改成功');
      } else {
        await api.createContract(data);
        msg.success('创建成功');
      }
      setModalOpen(false);
      loadData();
      api.getEquipment().then(setEquipmentList);
    } catch (e: any) {
      msg.error(e?.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteContract(id);
      msg.success('删除成功');
      loadData();
    } catch (e: any) {
      msg.error('删除失败');
    }
  };

  return (
    <div className="page-card">
      <div className="page-title">
        <span>租赁合同管理</span>
        <Space>
          <Select
            placeholder="合同状态"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            style={{ width: 140 }}
          >
            <Option value="active">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索合同号/客户/设备"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建合同
          </Button>
        </Space>
      </div>

      <Table
        dataSource={list}
        rowKey="id"
        loading={loading}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 60 },
          { title: '合同编号', dataIndex: 'contractNo', width: 160, fixed: 'left' },
          { title: '客户名称', dataIndex: 'customerName', width: 180 },
          { title: '联系电话', dataIndex: 'customerPhone', width: 130 },
          { title: '租赁设备', dataIndex: 'equipmentName', width: 160 },
          {
            title: '租期',
            width: 220,
            render: (_, r) => (
              <Space direction="vertical" size={0}>
                <span>起：{dayjs(r.rentStartDate).format('YYYY-MM-DD')}</span>
                <span>止：{dayjs(r.plannedReturnDate).format('YYYY-MM-DD')}</span>
              </Space>
            ),
          },
          {
            title: '日租金',
            dataIndex: 'dailyRate',
            width: 100,
            align: 'right',
            render: (v) => `¥${v?.toFixed(0) || 0}`,
          },
          {
            title: '押金',
            dataIndex: 'deposit',
            width: 110,
            align: 'right',
            render: (v) => `¥${(v || 0).toLocaleString()}`,
          },
          { title: '经理', dataIndex: 'contractManager', width: 100 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (v: keyof typeof CONTRACT_STATUS_LABELS) => <Tag color={statusColor(v)}>{CONTRACT_STATUS_LABELS[v]}</Tag>,
          },
          {
            title: '操作',
            width: 200,
            fixed: 'right',
            render: (_, r) => (
              <Space>
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(r)}>
                  详情
                </Button>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
                  编辑
                </Button>
                <Popconfirm title="确定删除该合同？" onConfirm={() => handleDelete(r.id)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        scroll={{ x: 1400 }}
      />

      <Modal
        title={editing ? '编辑合同' : '新建租赁合同'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="contractNo" label="合同编号" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="equipmentId" label="租赁设备" rules={[{ required: true, message: '请选择设备' }]}>
              <Select
                placeholder="选择设备（仅显示闲置设备）"
                showSearch
                optionFilterProp="children"
              >
                {idleEquipment.map((e) => (
                  <Option key={e.id} value={e.id}>
                    {e.name} ({e.model}) [{e.serialNumber || '无编号'}]
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Form.Item name="customerName" label="客户名称" rules={[{ required: true }]}>
              <Input placeholder="公司或个人名称" />
            </Form.Item>
            <Form.Item name="customerPhone" label="联系电话" rules={[{ required: true }]}>
              <Input placeholder="手机号" />
            </Form.Item>
          </div>
          <Form.Item name="customerAddress" label="客户地址">
            <Input placeholder="详细地址" />
          </Form.Item>
          <Form.Item name="rentRange" label="租赁期限" rules={[{ required: true, message: '请选择租期' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Form.Item name="dailyRate" label="日租金 (元)" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="monthlyRate" label="月租金 (元)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="deposit" label="押金 (元)" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="contractManager" label="租赁经理" rules={[{ required: true }]}>
              <Input placeholder="负责人姓名" />
            </Form.Item>
            <Form.Item name="status" label="合同状态" rules={[{ required: true }]}>
              <Select>
                <Option value="active">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="其他约定事项" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span><FileTextOutlined /> 合同详情</span>}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[<Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>]}
        width={640}
      >
        {viewing && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="合同编号" span={2}>{viewing.contractNo}</Descriptions.Item>
            <Descriptions.Item label="客户名称" span={2}>{viewing.customerName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{viewing.customerPhone}</Descriptions.Item>
            <Descriptions.Item label="租赁经理">{viewing.contractManager}</Descriptions.Item>
            <Descriptions.Item label="客户地址" span={2}>{viewing.customerAddress || '-'}</Descriptions.Item>
            <Descriptions.Item label="租赁设备" span={2}>{viewing.equipmentName}</Descriptions.Item>
            <Descriptions.Item label="起租日期">{dayjs(viewing.rentStartDate).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="计划归还">{dayjs(viewing.plannedReturnDate).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="日租金">¥{viewing.dailyRate?.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="押金">¥{(viewing.deposit || 0).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="合同状态">
              <Tag color={statusColor(viewing.status)}>{CONTRACT_STATUS_LABELS[viewing.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(viewing.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{viewing.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ContractList;
