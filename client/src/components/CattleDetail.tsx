import { useState, useEffect } from 'react';
import { Card, Tag, Button, Form, Input, Select, DatePicker, Modal, message, Table, Space } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, CheckOutlined, CloseOutlined, AlertCircleOutlined } from '@ant-design/icons';
import { Cattle, CattleNote, NoteType, NoteStatus, UserRole } from '../types';
import { cattleNotesApi, authApi, cattleApi } from '../api';
import { getStatusText, getNoteTypeText, formatDate, formatDateTime } from '../utils/format';
import { useUserStore } from '../store/userStore';
const { TextArea } = Input;
const { Option } = Select;
interface CattleDetailProps {
 cattle: Cattle;
 onBack: () => void;
}
export default function CattleDetail({ cattle, onBack }: CattleDetailProps) {
 const [notes, setNotes] = useState<CattleNote[]>([]);
 const [loading, setLoading] = useState(false);
 const [showNoteModal, setShowNoteModal] = useState(false);
 const [showStatusModal, setShowStatusModal] = useState(false);
 const [noteForm] = Form.useForm();
 const [users, setUsers] = useState<{
 id: number;
 name: string;
 role: UserRole;
 }[]>([]);
 const user = useUserStore((state) => state.user);
 useEffect(() => {
 loadNotes();
 loadUsers();
 }, [cattle.id]);
 const loadNotes = async () => {
 setLoading(true);
 try {
 const response = await cattleNotesApi.getNotes({ cattleId: cattle.id });
 setNotes(response.data);
 }
 catch (error) {
 message.error('加载备注失败');
 }
 finally {
 setLoading(false);
 }
 };
 const loadUsers = async () => {
 try {
 const response = await authApi.getUsers();
 setUsers(response.data);
 }
 catch (error) {
 message.error('加载用户列表失败');
 }
 };
 const handleCreateNote = async (values: {
 type: NoteType;
 content: string;
 assigneeId?: number;
 dueDate?: string;
 }) => {
 try {
 await cattleNotesApi.createNote({
 cattleId: cattle.id,
 authorId: user!.id,
 type: values.type,
 content: values.content,
 assigneeId: values.assigneeId,
 dueDate: values.dueDate,
 status: 'pending',
 });
 message.success('添加备注成功');
 setShowNoteModal(false);
 noteForm.resetFields();
 loadNotes();
 }
 catch (error) {
 message.error('添加备注失败');
 }
 };
 const handleUpdateNoteStatus = async (noteId: number, status: NoteStatus) => {
 try {
 await cattleNotesApi.updateNote(noteId, { status });
 message.success(`备注已${status === 'resolved' ? '解决' : status === 'rejected' ? '退回' : '处理中'}`);
 loadNotes();
 }
 catch (error) {
 message.error('更新备注状态失败');
 }
 };
 const handleUpdateCattleStatus = async (values: { status: string }) => {
  try {
    await cattleApi.updateCattle(cattle.id, { status: values.status });
    message.success(`牛只状态已更新为${getStatusText(values.status, 'cattle')}`);
    setShowStatusModal(false);
  }
  catch (error) {
    message.error('更新状态失败');
  }
};
 const statusColors: Record<string, string> = {
 healthy: 'green',
 sick: 'red',
 pregnant: 'purple',
 calving: 'orange',
 sold: 'gray',
 dead: 'red',
 };
 const noteStatusColors: Record<string, string> = {
 pending: 'orange',
 processing: 'blue',
 resolved: 'green',
 rejected: 'red',
 };
 const noteColumns = [
 {
 title: '类型',
 dataIndex: 'type',
 key: 'type',
 width: 100,
 render: (type: string) => <Tag>{getNoteTypeText(type)}</Tag>,
 },
 {
 title: '内容',
 dataIndex: 'content',
 key: 'content',
 },
 {
 title: '状态',
 dataIndex: 'status',
 key: 'status',
 width: 80,
 render: (status: string) => (<Tag color={noteStatusColors[status]}>
 {getStatusText(status, 'note')}
 </Tag>),
 },
 {
 title: '负责人',
 dataIndex: 'assigneeId',
 key: 'assigneeId',
 width: 80,
 render: (id: number) => users.find((u) => u.id === id)?.name || '-',
 },
 {
 title: '截止日期',
 dataIndex: 'dueDate',
 key: 'dueDate',
 width: 100,
 render: (date: string) => date ? formatDate(date) : '-',
 },
 {
 title: '创建时间',
 dataIndex: 'createdAt',
 key: 'createdAt',
 width: 150,
 render: (date: string) => formatDateTime(date),
 },
 {
 title: '创建人',
 dataIndex: 'author',
 key: 'author',
 width: 80,
 render: (author: {
 name: string;
 }) => author?.name || '-',
 },
 {
 title: '操作',
 key: 'actions',
 width: 150,
 render: (_, record: CattleNote) => (<Space>
 {record.status === 'pending' && (<Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleUpdateNoteStatus(record.id, 'processing')}>
 接单
 </Button>)}
 {record.status === 'processing' && (<>
 <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleUpdateNoteStatus(record.id, 'resolved')}>
 完成
 </Button>
 <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleUpdateNoteStatus(record.id, 'rejected')}>
 退回
 </Button>
 </>)}
 </Space>),
 },
 ];
 const canAddNote = user?.role === 'manager' || user?.role === 'milker' || user?.role === 'vet';
 const canHandleNote = user?.role === 'manager' || user?.role === 'vet';
 return (<div>
 <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 16 }}>
 返回列表
 </Button>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
 <Card title={`牛只档案 - ${cattle.tagNumber}`}>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
 <div>
 <p><strong>品种：</strong>{cattle.breed}</p>
 <p><strong>出生日期：</strong>{formatDate(cattle.birthDate)}</p>
 <p><strong>性别：</strong>{cattle.gender}</p>
 <p><strong>体重：</strong>{cattle.weight || '-'} kg</p>
 </div>
 <div>
 <p><strong>位置：</strong>{cattle.location || '-'}</p>
 <p><strong>状态：</strong><Tag color={statusColors[cattle.status]}>
 {getStatusText(cattle.status, 'cattle')}
 </Tag></p>
 <p><strong>母亲：</strong>{cattle.motherId ? `C${String(cattle.motherId).padStart(3, '0')}` : '-'}</p>
 <p><strong>父亲：</strong>{cattle.fatherId ? `C${String(cattle.fatherId).padStart(3, '0')}` : '-'}</p>
 </div>
 </div>
 {cattle.description && (<div style={{ marginTop: 16 }}>
 <p><strong>备注：</strong>{cattle.description}</p>
 </div>)}
 <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
 <Button type="primary" onClick={() => setShowStatusModal(true)}>
 更新状态
 </Button>
 </div>
 </Card>

 <Card title="档案备注记录" extra={canAddNote ? (<Button type="primary" icon={<PlusOutlined />} onClick={() => setShowNoteModal(true)}>
 添加备注
 </Button>) : null}>
 <Table dataSource={notes} columns={noteColumns} loading={loading} rowKey="id" pagination={{ pageSize: 5 }} scroll={{ x: true }}/>

 {notes.length === 0 && (<div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
 <AlertCircleOutlined style={{ fontSize: 48, marginBottom: 16 }}/>
 <p>暂无备注记录</p>
 </div>)}
 </Card>
 </div>

 <Modal title="添加档案备注" open={showNoteModal} onCancel={() => setShowNoteModal(false)} footer={null}>
 <Form form={noteForm} onFinish={handleCreateNote} layout="vertical">
 <Form.Item name="type" label="备注类型" rules={[{ required: true }]}>
 <Select>
 <Option value="health">健康记录</Option>
 <Option value="breeding">繁育记录</Option>
 <Option value="feeding">喂养记录</Option>
 <Option value="treatment">治疗记录</Option>
 <Option value="other">其他</Option>
 </Select>
 </Form.Item>

 <Form.Item name="content" label="备注内容" rules={[{ required: true }]}>
 <TextArea rows={4} placeholder="请输入备注内容" />
 </Form.Item>

 <Form.Item name="assigneeId" label="负责人">
 <Select placeholder="选择负责人">
 {users.map((u) => (<Option key={u.id} value={u.id}>
 {u.name} ({getStatusText(u.role, 'note')})
 </Option>))}
 </Select>
 </Form.Item>

 <Form.Item name="dueDate" label="截止日期">
 <DatePicker style={{ width: '100%' }}/>
 </Form.Item>

 <Form.Item>
 <Button type="primary" htmlType="submit">
 保存
 </Button>
 <Button onClick={() => setShowNoteModal(false)} style={{ marginLeft: 8 }}>
 取消
 </Button>
 </Form.Item>
 </Form>
 </Modal>

 <Modal title="更新牛只状态" open={showStatusModal} onCancel={() => setShowStatusModal(false)} footer={null}>
 <Form layout="vertical" onFinish={handleUpdateCattleStatus}>
 <Form.Item name="status" label="状态" rules={[{ required: true }]}>
 <Select>
 <Option value="healthy">健康</Option>
 <Option value="sick">生病</Option>
 <Option value="pregnant">怀孕</Option>
 <Option value="calving">待产</Option>
 <Option value="sold">已出售</Option>
 <Option value="dead">已死亡</Option>
 </Select>
 </Form.Item>

 <Form.Item>
 <Button type="primary" htmlType="submit">
 确认更新
 </Button>
 <Button onClick={() => setShowStatusModal(false)} style={{ marginLeft: 8 }}>
 取消
 </Button>
 </Form.Item>
 </Form>
 </Modal>
 </div>);
}

