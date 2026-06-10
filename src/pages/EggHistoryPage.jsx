import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, DatePicker, Row, Col, Table, Statistic, Tag, Space } from 'antd';
import { HistoryOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, SHIFT_LABELS, EGG_STATUS, INSPECTION_STATUS, SYSTEM_STATUS_LABELS } from '../api';

const { Title, Text } = Typography;

export default function EggHistoryPage() {
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.dashboard.houses().then(d => {
      setHouses(d.houses);
      if (d.houses.length > 0) setSelectedHouse(d.houses[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedHouse) return;
    setLoading(true);
    api.eggRecords.history({
      house_id: selectedHouse,
      start_date: dateRange[0]?.format('YYYY-MM-DD'),
      end_date: dateRange[1]?.format('YYYY-MM-DD'),
    }).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [selectedHouse, dateRange]);

  const houseInfo = data?.house;
  const records = data?.records || [];

  const totalEggs = records.reduce((s, r) => s + r.total_count, 0);
  const totalGradeA = records.reduce((s, r) => s + r.grade_a, 0);
  const avgRate = records.length > 0 ? Math.round(totalEggs / records.length) : 0;
  const abnormalCount = records.filter(r => r.status === 'abnormal').length;

  const columns = [
    {
      title: '日期', dataIndex: 'date', width: 110,
      render: v => <Text strong style={{ color: '#e0e0e0' }}>{v}</Text>,
    },
    {
      title: '班次', dataIndex: 'shift', width: 70,
      render: v => <Tag style={{ background: 'rgba(22,33,62,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#e0e0e0' }}>{SHIFT_LABELS[v]}</Tag>,
    },
    {
      title: '总数', dataIndex: 'total_count', width: 80,
      render: v => <Text strong style={{ color: '#e0e0e0' }}>{v}</Text>,
    },
    {
      title: 'A级', dataIndex: 'grade_a', width: 65,
      render: v => <Text style={{ color: '#e0e0e0' }}>{v}</Text>,
    },
    {
      title: 'B级', dataIndex: 'grade_b', width: 65,
      render: v => <Text style={{ color: '#e0e0e0' }}>{v}</Text>,
    },
    {
      title: 'C级', dataIndex: 'grade_c', width: 65,
      render: v => <Text style={{ color: '#e0e0e0' }}>{v}</Text>,
    },
    {
      title: '破损+脏+软', width: 110,
      render: (_, r) => <Space><Tag color="error">{r.cracked}</Tag><Tag color="warning">{r.dirty}</Tag><Tag>{r.soft_shell}</Tag></Space>,
    },
    {
      title: '产蛋状态', dataIndex: 'status', width: 90,
      render: v => <Tag color={v === 'confirmed' ? 'success' : v === 'abnormal' ? 'error' : 'warning'}>{EGG_STATUS[v]}</Tag>,
    },
    {
      title: '巡检状态', dataIndex: 'inspection_status', width: 90,
      render: v => v ? <Tag color={v === 'completed' ? 'success' : v === 'abnormal' ? 'error' : 'processing'}>{INSPECTION_STATUS[v]}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: '温度/湿度', width: 100,
      render: (_, r) => r.temperature ? <Text style={{ color: '#4fc3f7' }}>{r.temperature}°C / {r.humidity}%</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '分拣员', dataIndex: 'sorter_name', width: 80,
      render: v => <Text style={{ color: '#e0e0e0' }}>{v}</Text>,
    },
    {
      title: '饲养员', dataIndex: 'feeder_name', width: 80,
      render: v => <Text style={{ color: '#e0e0e0' }}>{v}</Text>,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16, color: '#e0e0e0' }}>
        <HistoryOutlined style={{ color: '#ff6b35', marginRight: 8 }} />产蛋回看
      </Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="选择鸡舍" style={{ width: 180 }}
            value={selectedHouse}
            onChange={setSelectedHouse}
            options={houses.map(h => ({ value: h.id, label: `${h.code} ${h.name}（${h.breed} ${h.age_weeks}周龄）` }))}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={v => setDateRange(v)}
          />
        </Space>
      </Card>

      {houseInfo && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" className="pressure-stat-card warn">
              <Statistic title="总产蛋量" value={totalEggs} suffix="枚" valueStyle={{ color: '#ff6b35' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="pressure-stat-card ok">
              <Statistic title="A级占比" value={totalEggs > 0 ? Math.round(totalGradeA / totalEggs * 100) : 0} suffix="%"
                valueStyle={{ color: '#2ec4b6' }}
                prefix={totalEggs > 0 && totalGradeA / totalEggs > 0.8 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="pressure-stat-card ok">
              <Statistic title="平均单班产蛋" value={avgRate} suffix="枚" valueStyle={{ color: '#e0e0e0' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className={abnormalCount > 0 ? 'pressure-stat-card danger' : 'pressure-stat-card ok'}>
              <Statistic title="异常次数" value={abnormalCount} suffix="次"
                valueStyle={{ color: abnormalCount > 0 ? '#e63946' : '#2ec4b6' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card size="small">
        <Table
          dataSource={records}
          columns={columns}
          loading={loading}
          rowKey={(r, i) => `${r.date}_${r.shift}_${i}`}
          size="small"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20 }}
          rowClassName={r => r.status === 'abnormal' ? 'ant-table-row-danger' : r.inspection_status === 'abnormal' ? 'ant-table-row-warning' : ''}
        />
      </Card>
    </div>
  );
}
