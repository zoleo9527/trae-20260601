import React, { useEffect, useState } from 'react';
import {
  Table, Card, Space, Button, Tag, Input, Select, Drawer,
  Descriptions, Badge, Tooltip
} from 'antd';
import {
  SearchOutlined, EyeOutlined, FileTextOutlined,
  PrinterOutlined, MailOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api.js';
import { SEVERITY_MAP } from '../constants.js';

const Notices = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [method, setMethod] = useState('all');
  const [detail, setDetail] = useState(null);

  const methodMap = {
    onsite: { text: '当面送达', color: 'green' },
    phone: { text: '电话告知', color: 'blue' },
    sms: { text: '短信通知', color: 'cyan' },
    sticker: { text: '门上贴条', color: 'orange' },
    registered: { text: '挂号信', color: 'purple' }
  };

  const fetchData = () => {
    setLoading(true);
    api.get('/notices').then(res => {
      let list = res;
      if (keyword) {
        list = list.filter(n =>
          n.notice_no.includes(keyword) ||
          (n.customer_name || '').includes(keyword) ||
          (n.customer_phone || '').includes(keyword) ||
          (n.hazard_name || '').includes(keyword)
        );
      }
      if (method !== 'all') {
        list = list.filter(n => n.notice_method === method);
      }
      setData(list);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [keyword, method]);

  const columns = [
    {
      title: '通知编号', dataIndex: 'notice_no', width: 170,
      render: t => <code style={{ color: '#1677ff' }}>{t}</code>
    },
    {
      title: '客户信息',
      render: (_, r) => (
        <Space direction="vertical" size={1}>
          <span style={{ fontWeight: 500 }}>
            {r.customer_name}
            {r.customer_signature && (
              <Tag color="green" style={{ marginLeft: 8 }} icon={<CheckCircleOutlined />}>
                已签收：{r.customer_signature}
              </Tag>
            )}
          </span>
          <span style={{ color: '#999', fontSize: 12 }}>📞 {r.customer_phone}</span>
        </Space>
      )
    },
    {
      title: '涉及隐患',
      render: (_, r) => (
        <Space>
          <FileTextOutlined style={{ color: '#ff4d4f' }} />
          <span>{r.hazard_name || '-'}</span>
        </Space>
      )
    },
    {
      title: '送达方式', dataIndex: 'notice_method', width: 110,
      render: t => {
        const m = methodMap[t];
        const icon = t === 'onsite' ? null : t === 'phone' ? <MailOutlined /> : null;
        return <Tag color={m?.color} icon={icon}>{m?.text || t}</Tag>;
      }
    },
    {
      title: '出具日期', dataIndex: 'issue_date', width: 160,
      render: t => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '整改期限', dataIndex: 'deadline', width: 110,
      render: t => {
        if (!t) return '-';
        const over = dayjs(t).isBefore(dayjs(), 'day');
        return (
          <Badge status={over ? 'error' : 'processing'} text={
            <span style={{ color: over ? '#ff4d4f' : '#666' }}>
              {dayjs(t).format('YYYY-MM-DD')}
            </span>
          } />
        );
      }
    },
    {
      title: '经办人', dataIndex: 'operator_name', width: 100,
      render: t => t || '-'
    },
    {
      title: '操作', width: 140, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Tooltip title="查看完整通知书">
            <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
          </Tooltip>
          <Tooltip title="打印/导出">
            <Button type="link" icon={<PrinterOutlined />}>打印</Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <FileTextOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          整改通知管理
        </div>
        <Tag color="blue">客服出具 · 送达备案</Tag>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="客户姓名/电话/编号/隐患"
            style={{ width: 280 }}
            allowClear
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Select
            style={{ width: 160 }}
            value={method}
            onChange={setMethod}
            options={[
              { value: 'all', label: '全部送达方式' },
              { value: 'onsite', label: '当面送达' },
              { value: 'phone', label: '电话告知' },
              { value: 'sms', label: '短信通知' },
              { value: 'sticker', label: '门上贴条' },
              { value: 'registered', label: '挂号信' }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchData}>查询</Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 份通知书` }}
        />
      </Card>

      <Drawer
        title="整改通知书详情"
        open={!!detail}
        onClose={() => setDetail(null)}
        width={640}
        extra={<Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印通知书</Button>}
      >
        {detail && (
          <div style={{ background: '#fff', padding: 24, border: '1px solid #eee', borderRadius: 6 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#d4380d' }}>
                城镇燃气安全隐患整改通知书
              </div>
              <div style={{ marginTop: 6, color: '#666', fontSize: 13 }}>
                编号：{detail.notice_no}
              </div>
            </div>

            <div style={{ marginBottom: 16, fontSize: 14, lineHeight: 1.8 }}>
              <p><strong>尊敬的 {detail.customer_name} 客户：</strong></p>
              <p style={{ textIndent: '2em' }}>
                我司于 <span style={{ fontWeight: 600, textDecoration: 'underline' }}>
                  {dayjs(detail.issue_date).format('YYYY 年 MM 月 DD 日')}
                </span> 对您位于 <span style={{ fontWeight: 600, textDecoration: 'underline' }}>
                  {detail.customer_address}
                </span> 的燃气设施进行入户安全检查时，发现存在以下安全隐患：
              </p>
            </div>

            <Card
              size="small"
              style={{ marginBottom: 16, background: '#fff2e8', borderColor: '#ffd591' }}
              title={
                <Space>
                  <span style={{ color: '#d4380d' }}>⚠️ 安全隐患清单</span>
                  {detail.hazard_name && <Tag color="red">{detail.hazard_name}</Tag>}
                </Space>
              }
            >
              <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                {detail.hazard_desc || '详见安检记录'}
              </p>
            </Card>

            <div style={{ marginBottom: 16, fontSize: 14, lineHeight: 1.8 }}>
              <p style={{ textIndent: '2em' }}>
                依据《城镇燃气管理条例》（国务院令第583号）及相关安全规定，现责令您于
                <span style={{
                  color: '#d4380d', fontWeight: 700, padding: '0 6px',
                  background: '#fff1f0', borderRadius: 3, margin: '0 4px'
                }}>
                  {dayjs(detail.deadline).format('YYYY 年 MM 月 DD 日')}
                </span>
                前完成上述隐患的整改工作。逾期未整改所产生的一切安全责任由您自行承担，我司将按规定上报相关主管部门。
              </p>
              <p><strong>📋 整改要求：</strong></p>
              <div style={{
                background: '#f6ffed', padding: 12, borderLeft: '3px solid #52c41a',
                borderRadius: 4, whiteSpace: 'pre-wrap', lineHeight: 1.8
              }}>
                {detail.rectify_requirement}
              </div>
            </div>

            <Descriptions column={2} size="small" style={{ marginBottom: 24 }} bordered>
              <Descriptions.Item label="送达方式">
                <Tag color={methodMap[detail.notice_method]?.color}>
                  {methodMap[detail.notice_method]?.text || detail.notice_method}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.customer_phone}</Descriptions.Item>
              <Descriptions.Item label="经办人">{detail.operator_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="出具日期">{dayjs(detail.issue_date).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>

            <Row gutter={24}>
              <div style={{ flex: 1 }}>
                <div>燃气公司（盖章）：</div>
                <div style={{ marginTop: 40, borderTop: '1px dashed #999', paddingTop: 6, fontSize: 12, color: '#999' }}>
                  日期：{dayjs(detail.issue_date).format('YYYY 年 MM 月 DD 日')}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div>用户签收（签字确认已知晓）：</div>
                <div style={{ marginTop: 40, borderTop: '1px dashed #999', paddingTop: 6, fontSize: 12, color: '#999' }}>
                  {detail.customer_signature ? `签字：${detail.customer_signature}` : '（用户拒签或无法联系，已通过其他方式送达）'}
                </div>
              </div>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Notices;
