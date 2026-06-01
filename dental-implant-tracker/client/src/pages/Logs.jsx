import { Card, Select, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import api from '../utils/api';

const { Text } = Typography;

const ROLE_LABELS = { frontdesk: '前台', doctor: '医生', warehouse: '库管' };

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientFilter, setPatientFilter] = useState('');
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchPatients();
  }, [patientFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (patientFilter) params.patient_id = patientFilter;
      const { data } = await api.get('/logs', { params });
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else if (data.items && Array.isArray(data.items)) {
        setLogs(data.items);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/patients');
      setPatients(Array.isArray(data) ? data : data.items || []);
    } catch {
      setPatients([]);
    }
  };

  const patientMap = {};
  patients.forEach((p) => { patientMap[p.id] = p.name; });

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    { title: '操作人', dataIndex: 'user_name', key: 'user_name', width: 90 },
    {
      title: '角色',
      dataIndex: 'user_role',
      key: 'user_role',
      width: 80,
      render: (v) => ROLE_LABELS[v] || v,
    },
    { title: '操作', dataIndex: 'action', key: 'action', width: 140 },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
      render: (v) => <Text style={{ fontSize: 13 }}>{v || '-'}</Text>,
    },
    {
      title: '关联患者',
      dataIndex: 'patient_id',
      key: 'patient_id',
      width: 100,
      render: (v) => (v ? patientMap[v] || `ID:${v}` : '-'),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="按患者筛选"
          allowClear
          showSearch
          style={{ width: 240 }}
          value={patientFilter || undefined}
          onChange={(v) => setPatientFilter(v || '')}
          filterOption={(input, option) => option.children?.toLowerCase().includes(input.toLowerCase())}
        >
          {patients.map((p) => (
            <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
          ))}
        </Select>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={logs}
        loading={loading}
        pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 780 }}
      />
    </Card>
  );
}
