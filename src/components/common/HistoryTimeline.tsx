import { Card, List, Tag, Typography } from 'antd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { HistoryNote } from '@/types';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface HistoryTimelineProps {
  notes: HistoryNote[];
}

const actionColors: Record<string, string> = {
  '入库登记': 'blue',
  '库位分配': 'cyan',
  '温度达标确认': 'green',
  '日常巡检': 'default',
  '温度异常发现': 'orange',
  '设备检查': 'purple',
  '异常上报': 'red',
  '出库准备': 'gold',
  '处理完成': 'green',
  '抽检': 'cyan',
  '异常标记': 'red',
  '数据恢复': 'purple',
};

const HistoryTimeline = ({ notes }: HistoryTimelineProps) => {
  const sortedNotes = [...notes].sort(
    (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
  );

  return (
    <Card title="操作历史" size="small">
      <List
        dataSource={sortedNotes}
        renderItem={(note) => (
          <List.Item>
            <List.Item.Meta
              avatar={<ClockCircleOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              title={
                <div className="flex items-center gap-2">
                  <Tag color={actionColors[note.action] || 'default'}>{note.action}</Tag>
                  <Text type="secondary" className="text-sm">
                    <UserOutlined /> {note.operator}
                  </Text>
                  <Text type="secondary" className="text-sm">
                    {dayjs(note.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </Text>
                </div>
              }
              description={<Paragraph style={{ marginBottom: 0 }}>{note.content}</Paragraph>}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default HistoryTimeline;
