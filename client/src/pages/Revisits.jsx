import React, { useEffect, useState } from 'react';
import {
  Table, Card, Space, Button, Tag, Input, Drawer, Descriptions
} from 'antd';
import {
  SearchOutlined, EyeOutlined, AuditOutlined,
  CheckCircleOutlined, CloseCircleOutlined, HomeOutlined,
  WarningOutlined, UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api.js';
import { SEVERITY_MAP } from '../constants.js';

const resultMap = {
  rectified: { text: '整改合格', color: 'green', icon: <CheckCircleOutlined /> },
  partial: { text: '部分整改', color: 'orange', icon: <WarningOutlined /> },
  refused: { text: '拒不整改', color: 'magenta', icon: <CloseCircleOutlined /> },
  missed: { text: '未遇用户', color: 'purple', icon: <HomeOutlined /> }
};

const Revisits = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/revisits').then(res => {
      if (keyword) {
        res = res.filter(r =>
          (r.revisit_no || '').includes(keyword) ||
          (r.customer_name || '').includes(keyword) ||
          (r.hazard_name || '').includes(keyword) ||
          (r.inspector_name || '').includes(keyword)
        );
      }
      setData(res);
    }).finally(() => setLoading(false));
  }, [keyword]);

  const columns = [
    {
      title: '复查编号', dataIndex: 'revisit_no', width: 170,
      render: t => <code style={{ color: '#13c2c2' }}>{t}</code>
    },
    {
      title: '客户', dataIndex: 'customer_name', width: 120,
      render: (t, r) => (
        <Space direction="vertical" size={1}>
          <span style={{ fontWeight: 500 }}><UserOutlined style={{ marginRight: 4 }} />{t}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{r.customer_phone}</span>
        </Space>
      )
    },
    {
      title: '复查隐患', dataIndex: 'hazard_name',
      render: t => t || '综合复查'
    },
    {
      title: '复查结果', dataIndex: 'rectify_result', width: 110,
      render: t => {
        const m = resultMap[t];
        return <Tag color={m?.color} icon={m?.icon}>{m?.text || t}</Tag>;
      }
    },
    {
      title: '是否在家', dataIndex: 'is_user_at_home', width: 90,
      render: t => t ? <Tag color="green">在家</Tag> : <Tag color="orange">未遇</Tag>
    },
    {
      title: '上门安检员', dataIndex: 'inspector_name', width: 110
    },
    {
      title: '复查时间', dataIndex: 'revisit_date', width: 160,
      sorter: (a, b) => dayjs(a.revisit_date).valueOf() - dayjs(b.revisit_date).valueOf(),
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作', width: 100, fixed: 'right',
      render: (_, r) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <AuditOutlined style={{ color: '#722ed1', marginRight: 8 }} />
          复查记录台账
        </div>
        <Tag color="purple">安检现场验收 · 结果归档</Tag>
      </div>

      <div className="filter-bar">
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索编号/客户/隐患/安检员"
            style={{ width: 300 }}
            allowClear
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </Space>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条复查记录` }}
        />
      </Card>

      <Drawer
        title="复查记录详情"
        open={!!detail}
        onClose={() => setDetail(null)}
        width={600}
      >
        {detail && (
          <div>
            <Card
              style={{
                marginBottom: 16, borderRadius: 8,
                borderLeft: `4px solid ${resultMap[detail.rectify_result]?.color === 'green' ? '#52c41a' : resultMap[detail.rectify_result]?.color === 'magenta' ? '#eb2f96' : '#faad14'}`
              }}
            >
              <Space direction="vertical" size={6}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {resultMap[detail.rectify_result]?.icon} {resultMap[detail.rectify_result]?.text}
                </div>
                <code style={{ color: '#13c2c2' }}>复查编号：{detail.revisit_no}</code>
              </Space>
            </Card>

            <div className="section-title">基本信息</div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="客户姓名">{detail.customer_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.customer_phone}</Descriptions.Item>
              <Descriptions.Item label="用户住址">{detail.customer_address}</Descriptions.Item>
              <Descriptions.Item label="复查隐患">{detail.hazard_name}
                {detail.appointment_no && <Tag style={{ marginLeft: 8 }}>预约号 {detail.appointment_no}</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="上门安检员">{detail.inspector_name}</Descriptions.Item>
              <Descriptions.Item label="复查时间">{dayjs(detail.revisit_date).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="用户是否在家">
                {detail.is_user_at_home ? <Tag color="green">✓ 在家，配合检查</Tag> : <Tag color="orange">✗ 仍未遇用户</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="复查结论">
                <Tag color={resultMap[detail.rectify_result]?.color} icon={resultMap[detail.rectify_result]?.icon}>
                  {resultMap[detail.rectify_result]?.text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div className="section-title">现场情况描述</div>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa', whiteSpace: 'pre-wrap', minHeight: 60 }}>
              {detail.description || '（无详细描述）'}
            </Card>

            {detail.next_action && (
              <>
                <div className="section-title">后续处理</div>
                <Card size="small" style={{ background: '#fff7e6', whiteSpace: 'pre-wrap' }}>
                  {detail.next_action}
                </Card>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Revisits;
