import { Table, Tag, Space, Button } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useApi } from '@/services/api';
import { useWorkflow } from '@/hooks/useWorkflow';
import { statusDisplayMap } from '@/utils/stateMachine';
import ActionButtons from '@/components/ActionButtons';
import AuditTimeline from '@/components/AuditTimeline';
import type { ColumnsType } from 'antd/es/table';
import type { InstallationRecord } from '@/types';

export default function InstallationList() {
  const api = useApi();
  const workflow = useWorkflow();
  const installations = api.getInstallations();

  const columns: ColumnsType<InstallationRecord> = [
    {
      title: '排产编号',
      dataIndex: 'scheduleNo',
      key: 'scheduleNo',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '安装状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={statusDisplayMap[s]?.color}>{statusDisplayMap[s]?.text}</Tag>
      ),
    },
    {
      title: '计划安装日期',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
    },
    {
      title: '实际安装日期',
      dataIndex: 'actualDate',
      key: 'actualDate',
      render: (v) => v || '-',
    },
    {
      title: '安装人员',
      dataIndex: 'installers',
      key: 'installers',
      render: (v) => (v.length > 0 ? v.join('、') : '待安排'),
    },
    {
      title: '客户签字',
      dataIndex: 'customerSigned',
      key: 'customerSigned',
      render: (v, record) =>
        v ? (
          <span style={{ color: 'green' }}>已签字 ({record.signerName})</span>
        ) : (
          <span style={{ color: '#999' }}>未签字</span>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>安装记录列表</h2>
      </div>
      <Table
        columns={columns}
        dataSource={installations}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => {
            const logs = api.getAuditLogsByEntity('installation', record.id);
            const schedule = api.getScheduleById(record.scheduleId);
            return (
              <div>
                {schedule && (
                  <>
                    <p><strong>客户:</strong> {schedule.customerName}</p>
                    <p><strong>内容:</strong> {schedule.content}</p>
                    <p><strong>安装地址:</strong> {schedule.installationAddress}</p>
                  </>
                )}
                {record.photos.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>安装照片:</strong>
                    <Space style={{ marginLeft: 8 }}>
                      {record.photos.map((photo, idx) => (
                        <Button
                          key={idx}
                          icon={<CameraOutlined />}
                          size="small"
                        >
                          照片 {idx + 1}
                        </Button>
                      ))}
                    </Space>
                  </div>
                )}
                {record.remark && (
                  <p style={{ marginTop: 8 }}>
                    <strong>备注:</strong> {record.remark}
                  </p>
                )}
                <div style={{ marginTop: 16 }}>
                  <h4>可用操作</h4>
                  <ActionButtons
                    actions={workflow.getInstallationAvailableActions(record.status)}
                    onAction={(target, remark) =>
                      workflow.transitionInstallation(record.id, target as any, { remark })
                    }
                    entityType="installation"
                    entityId={record.id}
                  />
                </div>
                <div style={{ marginTop: 16 }}>
                  <h4>操作留痕</h4>
                  <AuditTimeline logs={logs} />
                </div>
              </div>
            );
          },
        }}
      />
    </div>
  );
}
