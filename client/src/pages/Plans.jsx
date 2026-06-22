import React, { useEffect, useState } from 'react';
import {
  Table, Card, Space, Button, Tag, Input, Select, DatePicker,
  Modal, Form, message, Popconfirm, Tooltip
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined,
  CheckCircleOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api.js';
import { PLAN_STATUS_MAP } from '../constants.js';

const Plans = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [inspectors, setInspectors] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    api.get('/plans', { params: { status } }).then(res => {
      let list = res;
      if (keyword) {
        list = list.filter(p =>
          p.plan_name.includes(keyword) || p.plan_no.includes(keyword) ||
          (p.inspector_name || '').includes(keyword)
        );
      }
      setData(list);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get('/inspectors').then(setInspectors);
  }, [status]);

  const handleCreate = () => {
    form.validateFields().then(values => {
      const plan_no = `PLAN${dayjs().format('YYYYMMDDHHmmss')}`;
      api.post('/plans', {
        plan_no,
        plan_name: values.plan_name,
        inspector_id: values.inspector_id,
        plan_date: dayjs(values.plan_date).format('YYYY-MM-DD'),
        area: values.area,
        remark: values.remark
      }).then(() => {
        message.success('计划创建成功');
        setCreateModal(false);
        form.resetFields();
        fetchData();
      });
    });
  };

  const updateStatus = (id, s) => {
    api.patch(`/plans/${id}`, { status: s }).then(() => {
      message.success('状态已更新');
      fetchData();
    });
  };

  const columns = [
    {
      title: '计划编号', dataIndex: 'plan_no', width: 180,
      render: (t, r) => <a onClick={() => navigate(`/plans/${r.id}`)}>{t}</a>
    },
    { title: '计划名称', dataIndex: 'plan_name', ellipsis: true },
    { title: '安检区域', dataIndex: 'area', width: 160 },
    {
      title: '负责安检员', dataIndex: 'inspector_name', width: 110,
      render: t => t || <span style={{ color: '#999' }}>未指派</span>
    },
    {
      title: '计划日期', dataIndex: 'plan_date', width: 110,
      sorter: (a, b) => dayjs(a.plan_date).valueOf() - dayjs(b.plan_date).valueOf(),
      render: t => dayjs(t).format('YYYY-MM-DD')
    },
    {
      title: '执行进度', width: 200,
      render: (_, r) => {
        const total = r.total_count || 0;
        const done = r.completed_count || 0;
        const missed = r.missed_count || 0;
        const pending = total - done - missed;
        const pct = total > 0 ? Math.round(done * 100 / total) : 0;
        return (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <Tag color="green">完成 {done}</Tag>
              <Tag color="orange">未遇 {missed}</Tag>
              {pending > 0 && <Tag color="default">待访 {pending}</Tag>}
            </div>
            <div style={{ background: '#f0f0f0', height: 6, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: pct === 100 ? '#52c41a' : '#1677ff',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        );
      }
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: t => {
        const m = PLAN_STATUS_MAP[t];
        return <Tag color={m?.color}>{m?.text || t}</Tag>;
      }
    },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/plans/${r.id}`)}>
              详情
            </Button>
          </Tooltip>
          {r.status === 'pending' && (
            <Tooltip title="启动计划">
              <Button type="link" icon={<PlayCircleOutlined />} onClick={() => updateStatus(r.id, 'in_progress')}>
                启动
              </Button>
            </Tooltip>
          )}
          {r.status === 'in_progress' && (
            <Popconfirm title="确认该计划所有户已完成检查？" onConfirm={() => updateStatus(r.id, 'completed')}>
              <Button type="link" icon={<CheckCircleOutlined />}>结项</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">入户计划管理</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          新建计划
        </Button>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索计划名称/编号/安检员"
            style={{ width: 260 }}
            allowClear
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={fetchData}
          />
          <Select
            style={{ width: 140 }}
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'pending', label: '待执行' },
              { value: 'in_progress', label: '进行中' },
              { value: 'completed', label: '已完成' }
            ]}
          />
          <Button type="primary" onClick={fetchData} icon={<SearchOutlined />}>查询</Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title="新建入户安检计划"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={handleCreate}
        okText="创建"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="plan_name"
            label="计划名称"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="如：望京新城A区6月安检计划" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="plan_date"
              label="计划日期"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请选择计划日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="inspector_id" label="负责安检员" style={{ flex: 1 }}>
              <Select
                placeholder="选择安检员"
                options={inspectors.map(i => ({ value: i.id, label: `${i.name} · ${i.area || ''}` }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="area" label="安检区域">
            <Input placeholder="如：望京新城A区" />
          </Form.Item>
          <Form.Item name="remark" label="备注说明">
            <Input.TextArea rows={3} placeholder="重点排查内容、注意事项等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Plans;
