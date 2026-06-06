import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, message, Spin, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { appointmentsApi } from '../services/api';
import { Appointment, StatusTextMap, StatusColorMap } from '../types';
import StatusTimeline from '../components/StatusTimeline';

const AppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await appointmentsApi.getDetail(id);
      setAppointment(data);
    } catch (error) {
      message.error('获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!appointment) {
    return <div style={{ padding: 40 }}>预约不存在</div>;
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h2 style={{ margin: 0 }}>预约详情</h2>
          <Tag color={StatusColorMap[appointment.status]}>
            {StatusTextMap[appointment.status]}
          </Tag>
        </Space>
      </Card>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="预约单号">{appointment.orderNo}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={StatusColorMap[appointment.status]}>
              {StatusTextMap[appointment.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="承运商">{appointment.carrierName}</Descriptions.Item>
          <Descriptions.Item label="司机姓名">{appointment.driverName}</Descriptions.Item>
          <Descriptions.Item label="司机电话">{appointment.driverPhone}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{appointment.plateNumber}</Descriptions.Item>
          <Descriptions.Item label="预计到车时间">
            {dayjs(appointment.scheduledArrivalTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="实际到车时间">
            {appointment.actualArrivalTime
              ? dayjs(appointment.actualArrivalTime).format('YYYY-MM-DD HH:mm')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="货物类型">{appointment.cargoType}</Descriptions.Item>
          <Descriptions.Item label="货物重量">{appointment.cargoWeight} 吨</Descriptions.Item>
          <Descriptions.Item label="仓库区域">{appointment.warehouseZone || '-'}</Descriptions.Item>
          <Descriptions.Item label="分配月台">
            {appointment.dock ? `${appointment.dock.code} ${appointment.dock.name}` : '未分配'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {appointment.rejectionReason && (
        <Card title="驳回信息" type="inner" style={{ marginBottom: 16, borderColor: '#ffccc7' }}>
          <p style={{ color: '#ff4d4f', margin: 0 }}>
            <strong>驳回原因：</strong>{appointment.rejectionReason}
          </p>
        </Card>
      )}

      {appointment.supplementNote && (
        <Card title="补录说明" type="inner" style={{ marginBottom: 16, borderColor: '#87e8de' }}>
          <p style={{ color: '#13c2c2', margin: 0 }}>
            <strong>补录说明：</strong>{appointment.supplementNote}
          </p>
        </Card>
      )}

      <Divider orientation="left">操作时间线</Divider>
      <Card title="状态流转记录">
        {appointment.statusLogs && appointment.statusLogs.length > 0 ? (
          <StatusTimeline logs={appointment.statusLogs} />
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            暂无操作记录
          </div>
        )}
      </Card>
    </div>
  );
};

export default AppointmentDetail;
