import { Timeline } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { DifferenceHistoryItem, AnalysisHistoryItem } from '@/types';

interface HistoryTimelineProps {
  items: (DifferenceHistoryItem | AnalysisHistoryItem)[];
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ items }) => {
  return (
    <Timeline
      mode="left"
      items={[...items].reverse().map((item) => ({
        color: 'blue',
        dot: <ClockCircleOutlined />,
        children: (
          <div>
            <div className="font-medium">{item.action}</div>
            <div className="text-gray-600 text-sm mt-1">{item.content}</div>
            <div className="text-gray-400 text-xs mt-1">
              {item.timestamp} · {item.operator}
            </div>
          </div>
        ),
      }))}
    />
  );
};
