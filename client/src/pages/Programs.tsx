import { Table, Tag, Card, Badge, Button, Modal, Form, Input, Select } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useStore } from '../store';

export default function Programs() {
  const { programs, rehearsals, userRole } = useStore();
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const getProgramRehearsals = (programId: string) => {
    return rehearsals.filter((r) => r.programId === programId);
  };

  const columns = [
    { title: '节目名称', dataIndex: 'name', key: 'name' },
    { title: '舞蹈类型', dataIndex: 'type', key: 'type' },
    { title: '时长', dataIndex: 'duration', key: 'duration' },
    { title: '难度', dataIndex: 'difficulty', key: 'difficulty', render: (text: string) => (
      <Tag color={text === 'hard' ? 'red' : text === 'medium' ? 'orange' : 'green'}>
        {text === 'hard' ? '高' : text === 'medium' ? '中' : '低'}
      </Tag>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: (text: string) => (
      <Badge status={text === 'ready' ? 'success' : text === 'rehearsing' ? 'processing' : 'warning'} />
    )},
    { title: '参演人数', dataIndex: 'performerCount', key: 'performerCount' },
    { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', render: (text: string) => (
      <Tag color={text === 'high' ? 'red' : text === 'medium' ? 'orange' : 'green'}>
        {text === 'high' ? '高风险' : text === 'medium' ? '中风险' : '低风险'}
      </Tag>
    )},
    { title: '操作', key: 'action', render: (_, record) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button icon={<EyeOutlined />} onClick={() => {
          setSelectedProgram(record);
          setIsModalVisible(true);
        }}>详情</Button>
        {userRole === 'admin' && <Button icon={<EditOutlined />}>编辑</Button>}
      </div>
    )},
  ];

  return (
    <div>
      <Card title="演出节目列表" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={programs}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={`节目详情 - ${selectedProgram?.name}`}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedProgram && (
          <div>
            <Form form={form} initialValues={selectedProgram} layout="vertical">
              <Form.Item label="节目名称">
                <Input disabled value={selectedProgram.name} />
              </Form.Item>
              <Form.Item label="舞蹈类型">
                <Input disabled value={selectedProgram.type} />
              </Form.Item>
              <Form.Item label="时长">
                <Input disabled value={selectedProgram.duration} />
              </Form.Item>
              <Form.Item label="难度">
                <Select disabled value={selectedProgram.difficulty}>
                  <Select.Option value="easy">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="hard">高</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="参演人数">
                <Input disabled value={selectedProgram.performerCount} />
              </Form.Item>
              <Form.Item label="风险等级">
                <Tag color={selectedProgram.riskLevel === 'high' ? 'red' : selectedProgram.riskLevel === 'medium' ? 'orange' : 'green'}>
                  {selectedProgram.riskLevel === 'high' ? '高风险' : selectedProgram.riskLevel === 'medium' ? '中风险' : '低风险'}
                </Tag>
              </Form.Item>
              <Form.Item label="备注">
                <Input.TextArea disabled value={selectedProgram.notes} rows={3} />
              </Form.Item>
              <Form.Item label="关联排练">
                <div>
                  {getProgramRehearsals(selectedProgram.id).map((r) => (
                    <div key={r.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                      <div>{r.date} {r.startTime}-{r.endTime}</div>
                      <div style={{ color: '#666', fontSize: '12px' }}>{r.location} - {r.status === 'completed' ? '已完成' : r.status === 'in-progress' ? '进行中' : '待开始'}</div>
                    </div>
                  ))}
                </div>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
