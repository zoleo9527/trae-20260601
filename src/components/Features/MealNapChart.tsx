import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { cn, isToday, sortByTimeAsc } from '@/lib/utils';
import type { DailyRecord } from '@/types';
import Empty from '../Empty';

interface MealNapChartProps {
  records: DailyRecord[];
  className?: string;
}

interface MealData {
  name: string;
  value: number;
  color: string;
}

interface NapData {
  name: string;
  duration: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const MEAL_NAMES: globalThis.Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  snack: '点心',
  dinner: '晚餐',
};

export default function MealNapChart({ records, className }: MealNapChartProps) {
  const todayRecords = records.filter((r) => isToday(r.time));

  const parseMealAmount = (content: string): number => {
    if (content.includes('全部吃完') || content.includes('食量100%')) return 100;
    if (content.includes('吃了一半') || content.includes('吃了约50%')) return 50;
    if (content.includes('吃了约70%')) return 70;
    if (content.includes('食欲一般')) return 60;
    if (content.includes('食欲好')) return 90;
    return 80;
  };

  const parseMealType = (content: string): string => {
    if (content.includes('早餐')) return 'breakfast';
    if (content.includes('午餐')) return 'lunch';
    if (content.includes('点心') || content.includes('下午茶')) return 'snack';
    if (content.includes('晚餐')) return 'dinner';
    return 'lunch';
  };

  const parseNapDuration = (content: string): number => {
    const hourMatch = content.match(/睡了(\d+(?:\.\d+)?)\s*小时/);
    const minuteMatch = content.match(/睡了(\d+)\s*分钟/);
    const hourMinuteMatch = content.match(/睡了(\d+)\s*小时(\d+)\s*分钟/);

    if (hourMinuteMatch) {
      return parseInt(hourMinuteMatch[1]) * 60 + parseInt(hourMinuteMatch[2]);
    }
    if (hourMatch) {
      return parseFloat(hourMatch[1]) * 60;
    }
    if (minuteMatch) {
      return parseInt(minuteMatch[1]);
    }
    return 0;
  };

  const mealRecords = sortByTimeAsc(todayRecords.filter((r) => r.type === 'meal'));
  const napRecords = sortByTimeAsc(todayRecords.filter((r) => r.type === 'nap'));

  const mealData: MealData[] = mealRecords.map((record, index) => {
    const type = parseMealType(record.content);
    return {
      name: MEAL_NAMES[type] || `餐食${index + 1}`,
      value: parseMealAmount(record.content),
      color: COLORS[index % COLORS.length],
    };
  });

  const napData: NapData[] = napRecords.map((record, index) => ({
    name: `午睡${index + 1}`,
    duration: parseNapDuration(record.content),
  }));

  const totalMealAmount = mealData.reduce((sum, m) => sum + m.value, 0);
  const avgMealAmount = mealData.length > 0 ? Math.round(totalMealAmount / mealData.length) : 0;
  const totalNapDuration = napData.reduce((sum, n) => sum + n.duration, 0);

  if (mealRecords.length === 0 && napRecords.length === 0) {
    return (
      <div className={cn('h-64', className)}>
        <Empty />
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)}>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">今日饮食量</h3>
          <span className="text-sm text-gray-500">平均: {avgMealAmount}%</span>
        </div>
        {mealData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mealData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {mealData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, '食量']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend
                  formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-gray-400">
            暂无饮食记录
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">午睡时长</h3>
          <span className="text-sm text-gray-500">
            总计: {Math.floor(totalNapDuration / 60)}小时{totalNapDuration % 60}分钟
          </span>
        </div>
        {napData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={napData} barCategoryGap="40%">
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  unit="分"
                />
                <Tooltip
                  formatter={(value: number) => [`${value}分钟`, '时长']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar
                  dataKey="duration"
                  fill="#8B5CF6"
                  radius={[6, 6, 0, 0]}
                  name="午睡时长"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center text-gray-400">
            暂无午睡记录
          </div>
        )}
      </div>
    </div>
  );
}
