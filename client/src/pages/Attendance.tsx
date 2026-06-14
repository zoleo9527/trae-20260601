import { Table, Tag, Card, Select, Button, Modal, Form, Input, Checkbox, Slider } from 'antd';
import { CheckOutlined, XOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { useStore } from '../store';

export default function Attendance() {
  const { rehearsals, programs, students, attendances, updateAttendance, userRole } = useStore();
  const [selectedRehearsal, setSelectedRehearsal] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<any>(null);
  const [form] = Form.useForm();

  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));
  const rehearsalOptions = useMemo(() => {
    if (!selectedRehearsal) return [];
    return rehearsals
      .filter((r) => r.programId === selectedRehearsal)
      .map((r) => ({ value: r.id, label: `${r.date} ${r.startTime}-${r.endTime}` }));
  }, [selectedRehearsal, rehearsals]);

  const filteredAttendances = useMemo(() => {
    if (!selectedRehearsal) return [];
    const programRehearsals = rehearsals.filter((r) => r.programId === selectedRehearsal);
    return attendances.filter((a) => programRehearsals.some((r) => r.id === a.rehearsalId));
  }, [selectedRehearsal, rehearsals, attendances]);

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || '';
  };

  const getRehearsalInfo = (rehearsalId: string) => {
    return rehearsals.find((r) => r.id === rehearsalId);
  };

  const handleEdit = (record: any) => {
    setCurrentAttendance(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      updateAttendance(currentAttendance.id, values);
      setIsModalVisible(false);
    });
  };

  const columns = [
    { title: '排练日期', dataIndex: 'rehearsalId', key: 'rehearsalId', render: (text: string) => {
      const rehearsal = getRehearsalInfo(text);
      return rehearsal ? `${rehearsal.date} ${rehearsal.startTime}` : '';
    }},
    { title: '学生姓名', dataIndex: 'studentId', key: 'studentId', render: (text: string) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <UserOutlined />
        {getStudentName(text)}
      </span>
    )},
    { title: '出勤状态', dataIndex: 'present', key: 'present', render: (text: boolean) => (
      text ? (
        <Tag color="green"><CheckOutlined /> 出勤</Tag>
      ) : (
        <Tag color="red"><XOutlined /> 缺勤</Tag>
      )
    )},
    { title: '缺勤原因', dataIndex: 'reason', key: 'reason' },
    { title: '动作完成度', dataIndex: 'actionCompletion', key: 'actionCompletion', render: (text: number) => (
      <div>
        <Slider disabled value={text} style={{ width: '100px', marginRight: '8px' }} />
        <span>{text}%</span>
      </div>
    )},
    { title: '已补训', dataIndex: 'makeupCompleted', key: 'makeupCompleted', render: (text: boolean) => (
      text ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>
    )},
    { title: '已领服装', dataIndex: 'costumeCollected', key: 'costumeCollected', render: (text: boolean) => (
      text ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>
    )},
    { title: '家长确认', dataIndex: 'parentConfirmed', key: 'parentConfirmed', render: (text: boolean) => (
      text ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>
    )},
    { title: '操作', key: 'action', render: (_, record) => (
      (userRole === 'admin' || userRole === 'teacher') && (
        <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
      )
    )},
  ];

  return (
    <div>
      <Card title="排练签到管理" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <Select
            placeholder="选择节目"
            options={programOptions}
            value={selectedRehearsal}
            onChange={(value) => setSelectedRehearsal(value)}
            style={{ width: '200px' }}
          />
          <Select
            placeholder="选择排练"
            options={rehearsalOptions}
            style={{ width: '250px' }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredAttendances}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="编辑签到记录"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSave}>保存</Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="出勤状态" name="present" valuePropName="checked">
            <Checkbox>出勤</Checkbox>
          </Form.Item>
          <Form.Item label="缺勤原因" name="reason">
            <Input placeholder="请输入缺勤原因" />
          </Form.Item>
          <Form.Item label="动作完成度" name="actionCompletion">
            <Slider min={0} max={100} />
          </Form.Item>
          <Form.Item label="已补训" name="makeupCompleted" valuePropName="checked">
            <Checkbox>已完成补训</Checkbox>
          </Form.Item>
          <Form.Item label="已领服装" name="costumeCollected" valuePropName="checked">
            <Checkbox>已领取服装</Checkbox>
          </Form.Item>
          <Form.Item label="家长确认" name="parentConfirmed" valuePropName="checked">
            <Checkbox>家长已确认</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
