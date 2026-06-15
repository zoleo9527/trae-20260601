import { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Space, message, Select, InputNumber } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { Location } from '@/types';
import { LOCATION_STATUS_MAP } from '@/types';
import { api } from '@/api/mockApi';

export function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await api.locations.list();
      setLocations(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const values = form.getFieldsValue();
    const newLocation: Location = {
      id: `loc${Date.now()}`,
      code: `${values.zone}-${values.row}-${values.shelf}-${values.level}`,
      zone: values.zone,
      row: values.row,
      shelf: values.shelf,
      level: values.level,
      status: 'empty',
      capacity: values.capacity,
      currentQty: 0,
      updatedAt: new Date().toLocaleString('zh-CN'),
    };
    locations.push(newLocation);
    setLocations([...locations]);
    message.success('库位创建成功');
    setShowModal(false);
    form.resetFields();
  };

  const filteredLocations = locations.filter(loc => 
    loc.code.toLowerCase().includes(searchText.toLowerCase()) ||
    loc.zone.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnType<Location>[] = [
    { title: '库位编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '区域', dataIndex: 'zone', key: 'zone', width: 60 },
    { title: '排', dataIndex: 'row', key: 'row', width: 60 },
    { title: '架', dataIndex: 'shelf', key: 'shelf', width: 60 },
    { title: '层', dataIndex: 'level', key: 'level', width: 60 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => (
      <Tag color={s === 'occupied' ? 'blue' : s === 'reserved' ? 'orange' : s === 'locked' ? 'red' : 'default'}>
        {LOCATION_STATUS_MAP[s as keyof typeof LOCATION_STATUS_MAP]}
      </Tag>
    )},
    { title: '容量', dataIndex: 'capacity', key: 'capacity', width: 80 },
    { title: '当前库存', dataIndex: 'currentQty', key: 'currentQty', width: 80 },
    { title: '所属订单', dataIndex: 'orderId', key: 'orderId', width: 150, render: (id?: string) => id || '-' },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
  ];

  const zoneOptions = ['A', 'B', 'C', 'D'];
  const rowOptions = ['01', '02', '03', '04'];
  const shelfOptions = ['01', '02', '03'];
  const levelOptions = ['01', '02', '03', '04'];

  const stats = {
    total: locations.length,
    empty: locations.filter(l => l.status === 'empty').length,
    occupied: locations.filter(l => l.status === 'occupied').length,
    reserved: locations.filter(l => l.status === 'reserved').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">库位管理</h2>
          <Space>
            <Tag color="default">总库位: {stats.total}</Tag>
            <Tag color="green">空: {stats.empty}</Tag>
            <Tag color="blue">占用: {stats.occupied}</Tag>
            <Tag color="orange">预留: {stats.reserved}</Tag>
          </Space>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="搜索库位编码或区域" 
              className="pl-10 w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowModal(true)}>
            新增库位
          </Button>
        </div>
      </div>

      <Table
        loading={loading}
        dataSource={filteredLocations}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 15 }}
        scroll={{ x: 1000 }}
      />

      <Modal title="新增库位" open={showModal} onCancel={() => setShowModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="区域" name="zone" rules={[{ required: true }]}>
            <Select>
              {zoneOptions.map(z => <Select.Option key={z} value={z}>{z}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="排" name="row" rules={[{ required: true }]}>
            <Select>
              {rowOptions.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="架" name="shelf" rules={[{ required: true }]}>
            <Select>
              {shelfOptions.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="层" name="level" rules={[{ required: true }]}>
            <Select>
              {levelOptions.map(l => <Select.Option key={l} value={l}>{l}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="容量" name="capacity" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item className="flex justify-end">
            <Space>
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}