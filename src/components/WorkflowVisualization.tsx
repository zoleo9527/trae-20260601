import { Steps, Tag, Tooltip } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ClockCircleOutlined } from '@ant-design/icons';
import { ExamBatchStatus, StudentNotificationStatus, EXAM_BATCH_STATUS_MAP, STUDENT_NOTIFICATION_STATUS_MAP } from '../types';

interface WorkflowStep {
  title: string;
  description?: string;
  status: 'wait' | 'process' | 'finish' | 'error';
  icon?: React.ReactNode;
}

export const ExamBatchWorkflowSteps = ({ 
  status, 
  submitterName,
  submitTime,
  confirmerName,
  confirmTime
}: { 
  status: ExamBatchStatus;
  submitterName?: string;
  submitTime?: string;
  confirmerName?: string;
  confirmTime?: string;
}) => {
  const getBatchSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [
      {
        title: '创建批次',
        description: '由报名员创建',
        status: 'finish',
      },
      {
        title: '提交批次',
        description: submitterName ? `${submitterName} 提交于 ${submitTime}` : '待提交',
        status: status === 'pending' ? 'process' : 'finish',
      },
      {
        title: '确认批次',
        description: status === 'pending' ? '等待提交' : 
                     status === 'submitted' ? '待确认' :
                     confirmerName ? `${confirmerName} 确认于 ${confirmTime}` : '-',
        status: status === 'confirmed' || status === 'exam_completed' ? 'finish' :
                status === 'submitted' ? 'process' : 'wait',
      },
      {
        title: status === 'exam_completed' ? '考试完成' : 
                   status === 'cancelled' ? '已取消' : '进行中',
        description: status === 'exam_completed' ? '考试已完成' :
                     status === 'cancelled' ? '批次已取消' :
                     '等待考试',
        status: status === 'exam_completed' ? 'finish' :
                status === 'cancelled' ? 'error' : 
                status === 'confirmed' ? 'process' : 'wait',
      },
    ];
    return steps;
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ marginBottom: '12px' }}>批次处理流程</h4>
      <Steps 
        current={
          status === 'pending' ? 1 :
          status === 'submitted' ? 2 :
          status === 'confirmed' ? 3 :
          status === 'exam_completed' ? 3 :
          status === 'cancelled' ? 3 : 0
        }
        status={
          status === 'cancelled' ? 'error' : 'process'
        }
        size="small"
        items={getBatchSteps().map(step => ({
          title: step.title,
          description: step.description,
          status: step.status,
        }))}
      />
    </div>
  );
};

export const NotificationWorkflowSteps = ({ 
  status,
  notifierName,
  notifyTime,
  confirmerName,
  confirmTime
}: { 
  status: StudentNotificationStatus;
  notifierName?: string;
  notifyTime?: string;
  confirmerName?: string;
  confirmTime?: string;
}) => {
  const getNotificationSteps = (): WorkflowStep[] => {
    const steps: WorkflowStep[] = [
      {
        title: '待通知',
        description: '等待发送通知',
        status: status === 'pending' ? 'process' : 
                ['notified', 'confirmed', 'completed', 'absent'].includes(status) ? 'finish' : 'wait',
      },
      {
        title: '已通知',
        description: notifierName ? `${notifierName} 发送于 ${notifyTime}` : '待发送',
        status: status === 'notified' ? 'process' :
                ['confirmed', 'completed', 'absent'].includes(status) ? 'finish' : 'wait',
      },
      {
        title: status === 'absent' ? '缺考' : '已确认',
        description: status === 'absent' ? '学员缺考' :
                    status === 'confirmed' || status === 'completed' ? 
                    `${confirmerName} 确认于 ${confirmTime}` : '待确认',
        status: status === 'confirmed' || status === 'completed' ? 'finish' :
                status === 'notified' ? 'process' :
                status === 'absent' ? 'error' : 'wait',
      },
      {
        title: status === 'completed' ? '已完成' : status === 'absent' ? '已标记' : '进行中',
        description: status === 'completed' ? '通知流程完成' : '等待完成',
        status: status === 'completed' ? 'finish' :
                status === 'absent' ? 'finish' :
                status === 'confirmed' ? 'process' : 'wait',
      },
    ];
    return steps;
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ marginBottom: '12px' }}>通知处理流程</h4>
      <Steps 
        current={
          status === 'pending' ? 0 :
          status === 'notified' ? 1 :
          status === 'confirmed' ? 2 :
          ['completed', 'absent'].includes(status) ? 3 : 0
        }
        status={
          status === 'absent' ? 'error' : 'process'
        }
        size="small"
        items={getNotificationSteps().map(step => ({
          title: step.title,
          description: step.description,
          status: step.status,
        }))}
      />
    </div>
  );
};

export const WorkflowStatusBadge = ({ 
  type, 
  status 
}: { 
  type: 'batch' | 'notification' | 'exception';
  status: string;
}) => {
  const getColor = () => {
    if (type === 'batch') {
      const colors: Record<string, string> = {
        pending: 'gold',
        submitted: 'blue',
        confirmed: 'green',
        exam_completed: 'purple',
        cancelled: 'red',
      };
      return colors[status] || 'default';
    } else if (type === 'notification') {
      const colors: Record<string, string> = {
        pending: 'gold',
        notified: 'blue',
        confirmed: 'green',
        absent: 'red',
        completed: 'purple',
      };
      return colors[status] || 'default';
    } else {
      return status === 'resolved' ? 'green' : 'red';
    }
  };

  const getLabel = () => {
    if (type === 'batch') {
      return EXAM_BATCH_STATUS_MAP[status as ExamBatchStatus] || status;
    } else if (type === 'notification') {
      return STUDENT_NOTIFICATION_STATUS_MAP[status as StudentNotificationStatus] || status;
    } else {
      return status === 'resolved' ? '已处理' : '待处理';
    }
  };

  return <Tag color={getColor()}>{getLabel()}</Tag>;
};
