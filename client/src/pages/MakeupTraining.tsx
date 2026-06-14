import { Table, Tag, Card, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { useStore } from '../store';
import dayjs from 'dayjs';

export default function MakeupTraining() {
  const { students, programs, attendances, rehearsals, makeupTrainings, addMakeupTraining, updateMakeupTraining, userRole } = useStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTraining, setCurrentTraining] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [form] = Form.useForm();

  const studentOptions = students.map((s) => ({ value: s.id, label: s.name }));
  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));

  const getAbsentAttendances = useMemo(() => {
    const absent = attendances.filter((a) => !a.present);
    const assignedIds = makeupTrainings
      .filter((m) => !isEditing || m.id !== currentTraining?.id)
      .map((m) => m.attendanceId)
      .filter(Boolean);
    return absent.filter((a) => !assignedIds.includes(a.id));
  }, [attendances, makeupTrainings, isEditing, currentTraining]);

  const attendanceOptions = useMemo(() => {
    let filtered = getAbsentAttendances;
    if (selectedStudent) {
      filtered = filtered.filter((a) => a.studentId === selectedStudent);
    }
    if (selectedProgram) {
      const programRehearsals = rehearsals.filter((r) => r.programId === selectedProgram);
      filtered = filtered.filter((a) => programRehearsals.some((r) => r.id === a.rehearsalId));
    }
    return filtered.map((a) => {
      const rehearsal = rehearsals.find((r) => r.id === a.rehearsalId);
      const student = students.find((s) => s.id === a.studentId);
      return {
        value: a.id,
        label: `${student?.name || ''} - ${rehearsal?.date || ''} ${rehearsal?.startTime || ''} (${a.reason})`,
      };
    });
  }, [getAbsentAttendances, selectedStudent, selectedProgram, rehearsals, students]);

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.name || '';
  };

  const getProgramName = (programId: string) => {
    return programs.find((p) => p.id === programId)?.name || '';
  };

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentTraining(null);
    setSelectedStudent('');
    setSelectedProgram('');
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setIsEditing(true);
    setCurrentTraining(record);
    setSelectedStudent(record.studentId);
    setSelectedProgram(record.programId);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
      startTime: record.startTime ? dayjs(record.startTime, 'HH:mm') : null,
      endTime: record.endTime ? dayjs(record.endTime, 'HH:mm') : null,
    });
    setIsModalVisible(true);
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudent(value);
    form.setFieldsValue({ studentId: value });
  };

  const handleProgramChange = (value: string) => {
    setSelectedProgram(value);
    form.setFieldsValue({ programId: value });
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      const attendanceValue = values.attendanceId;
      const data = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime ? values.startTime.format('HH:mm') : '',
        endTime: values.endTime ? values.endTime.format('HH:mm') : '',
        attendanceId: attendanceValue || undefined,
      };
      if (isEditing) {
        updateMakeupTraining(currentTraining.id, data);
      } else {
        addMakeupTraining(data);
      }
      setIsModalVisible(false);
    });
  };

  const columns = [
    { title: '学生姓名', dataIndex: 'studentId', key: 'studentId', render: (text: string) => getStudentName(text) },
    { title: '所属节目', dataIndex: 'programId', key: 'programId', render: (text: string) => getProgramName(text) },
    { title: '补训日期', dataIndex: 'date', key: 'date' },
    { title: '时间', dataIndex: 'startTime', key: 'time', render: (_: any, record: any) => `${record.startTime}-${record.endTime}` },
    { title: '补训内容', dataIndex: 'content', key: 'content' },
    { title: '负责老师', dataIndex: 'teacher', key: 'teacher' },
    { title: '完成状态', dataIndex: 'completed', key: 'completed', render: (text: boolean) => (
      text ? (
        <Tag color="green"><CheckOutlined /> 已完成</Tag>
      ) : (
        <Tag color="orange">待完成</Tag>
      )
    )},
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        {userRole === 'admin' && <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>}
        {!record.completed && userRole === 'teacher' && (
          <Button onClick={() => updateMakeupTraining(record.id, { completed: true })}>完成</Button>
        )}
      </div>
    )},
  ];

  const uncompletedTrainings = makeupTrainings.filter((m) => !m.completed);
  const completedTrainings = makeupTrainings.filter((m) => m.completed);

  return (
    <div>
      <Card 
        title="缺勤补训安排" 
        extra={userRole === 'admin' && <Button icon={<PlusOutlined />} onClick={handleAdd}>添加补训</Button>}
        style={{ marginBottom: '24px' }}
      >
        <h4 style={{ marginBottom: '16px', color: '#fa8c16' }}>待完成补训 ({uncompletedTrainings.length})</h4>
        <Table
          columns={columns}
          dataSource={uncompletedTrainings}
          rowKey="id"
          pagination={false}
          style={{ marginBottom: '24px' }}
        />
        <h4 style={{ marginBottom: '16px', color: '#52c41a' }}>已完成补训 ({completedTrainings.length})</h4>
        <Table
          columns={columns}
          dataSource={completedTrainings}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={isEditing ? '编辑补训安排' : '添加补训安排'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSave}>保存</Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="学生" name="studentId" rules={[{ required: true, message: '请选择学生' }]}>
            <Select 
              options={studentOptions} 
              placeholder="请选择学生" 
              onChange={handleStudentChange}
              value={selectedStudent || undefined}
            />
          </Form.Item>
          <Form.Item label="节目" name="programId" rules={[{ required: true, message: '请选择节目' }]}>
            <Select 
              options={programOptions} 
              placeholder="请选择节目" 
              onChange={handleProgramChange}
              value={selectedProgram || undefined}
            />
          </Form.Item>
          <Form.Item label="关联缺勤记录" name="attendanceId">
            <Select 
              options={attendanceOptions} 
              placeholder="选择关联的缺勤记录（可选）"
              allowClear
            />
          </Form.Item>
          <Form.Item label="补训日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item label="开始时间" name="startTime" rules={[{ required: true, message: '请选择开始时间' }]}>
              <TimePicker style={{ width: '120px' }} />
            </Form.Item>
            <Form.Item label="结束时间" name="endTime" rules={[{ required: true, message: '请选择结束时间' }]}>
              <TimePicker style={{ width: '120px' }} />
            </Form.Item>
          </div>
          <Form.Item label="补训内容" name="content" rules={[{ required: true, message: '请输入补训内容' }]}>
            <Input.TextArea rows={3} placeholder="请输入补训内容" />
          </Form.Item>
          <Form.Item label="负责老师" name="teacher" rules={[{ required: true, message: '请输入老师姓名' }]}>
            <Input placeholder="请输入老师姓名" />
          </Form.Item>
          {isEditing && (
            <Form.Item label="完成状态" name="completed" valuePropName="checked">
              <Checkbox>已完成</Checkbox>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}