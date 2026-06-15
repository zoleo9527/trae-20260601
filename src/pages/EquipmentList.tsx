import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Space,
  Popconfirm,
  message,
  App as AntdApp,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { api } from '../api';
import { Equipment, EQUIPMENT_STATUS_LABELS } from '@shared/types';
import dayjs from 'dayjs';

const { Option } = Select;

const EquipmentList: React.FC = () => {
  const { message: msg } = AntdApp.useApp();
  const [list, setList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getEquipment();
    setList(data);
    setLoading(false);
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      idle: 'green',
      rented: 'blue',
      maintenance: 'orange',
      returned: 'cyan',
    };
    return map[status] || 'default';
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'idle' });
    setModalOpen(true);
  };

  const handleEdit = (record: Equipment) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.updateEquipment(editing.id, values);
        msg.success('修改成功');
      } else {
        await api.createEquipment(values);
        msg.success('添加成功');
      }
      setModalOpen(false);
      loadData();
    } catch (e: any) {
      msg.error(e?.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteEquipment(id);
      msg.success('删除成功');
      loadData();
    } catch (e: any) {
      msg.error('删除失败：该设备可能有关联合同');
    }
  };

  const filteredList = list.filter(
    (e) =>
      !searchText ||
      e.name.includes(searchText) ||
      e.model.includes(searchText) ||
      (e.serialNumber || '').includes(searchText) ||
      (e.category || '').includes(searchText)
  );

  return (
    <div className="page-card">
      <div className="page-title">
        <span>设备管理</span>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索设备名称/型号/编号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增设备
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredList}
        rowKey="id"
        loading={loading}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 60 },
          { title: '设备名称', dataIndex: 'name', width: 180 },
          { title: '型号', dataIndex: 'model', width: 140 },
          { title: '出厂编号', dataIndex: 'serialNumber', width: 180 },
          { title: '类别', dataIndex: 'category', width: 120 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (v: keyof typeof EQUIPMENT_STATUS_LABELS) => <Tag color={statusColor(v)}>{EQUIPMENT_STATUS_LABELS[v]}</Tag>,
          },
          {
            title: '入库时间',
            dataIndex: 'createdAt',
            width: 160,
            render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
          },
          { title: '备注', dataIndex: 'remark', ellipsis: true },
          {
            title: '操作',
            width: 160,
            fixed: 'right',
            render: (_, r) => (
              <Space>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>
                  编辑
                </Button>
                <Popconfirm title="确定删除该设备？" onConfirm={() => handleDelete(r.id)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? '编辑设备' : '新增设备'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
            <Input placeholder="如：CAT 320D 挖掘机" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="model" label="型号" rules={[{ required: true }]}>
              <Input placeholder="如：320D" />
            </Form.Item>
            <Form.Item name="serialNumber" label="出厂编号">
              <Input placeholder="出厂序列号" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="category" label="设备类别" rules={[{ required: true }]}>
              <Select placeholder="请选择类别">
                <Option value="挖掘机">挖掘机</Option>
                <Option value="小型挖掘机">小型挖掘机</Option>
                <Option value="起重机">起重机</Option>
                <Option value="装载机">装载机</Option>
                <Option value="推土机">推土机</Option>
                <Option value="压路机">压路机</Option>
                <Option value="叉车">叉车</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                <Option value="idle">闲置</Option>
                <Option value="rented">出租中</Option>
                <Option value="maintenance">维修中</Option>
                <Option value="returned">已回场</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="设备说明、特性等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentList;
