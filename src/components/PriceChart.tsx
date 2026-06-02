import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { PriceHistoryItem } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

interface PriceChartProps {
  priceHistory: PriceHistoryItem[];
  currentPrice: number;
  expectedPrice: number;
}

export default function PriceChart({ priceHistory, currentPrice, expectedPrice }: PriceChartProps) {
  const chartData = [
    {
      date: '寄卖预期',
      price: expectedPrice,
      type: '预期',
    },
    ...priceHistory.map((item) => ({
      date: formatDate(item.timestamp),
      price: item.newPrice,
      type: '调整',
      reason: item.reason,
    })),
    {
      date: '当前',
      price: currentPrice,
      type: '当前',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-ivory-200 shadow-luxury p-3 rounded-luxury">
          <p className="text-xs text-charcoal-500">{data.date}</p>
          <p className="text-lg font-semibold text-luxury-800">{formatCurrency(data.price)}</p>
          {data.reason && <p className="text-xs text-charcoal-600 mt-1">{data.reason}</p>}
        </div>
      );
    }
    return null;
  };

  if (priceHistory.length === 0) {
    return (
      <div className="card p-6">
        <h4 className="font-display font-semibold text-luxury-800 mb-4">价格历史</h4>
        <div className="text-center py-8 text-charcoal-500">
          <p>暂无价格调整记录</p>
          <p className="text-sm mt-2">预期售价：{formatCurrency(expectedPrice)}</p>
          <p className="text-sm">当前售价：{formatCurrency(currentPrice)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h4 className="font-display font-semibold text-luxury-800 mb-4">价格走势</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D3" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B6B6B' }} axisLine={{ stroke: '#E9E3D3' }} />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B6B6B' }}
              axisLine={{ stroke: '#E9E3D3' }}
              tickFormatter={(value) => `¥${(value / 10000).toFixed(1)}万`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#C9A961"
              strokeWidth={3}
              dot={{ fill: '#C9A961', strokeWidth: 2, r: 5 }}
              activeDot={{ fill: '#1A3A3A', r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-4 text-sm">
        <div>
          <span className="text-charcoal-500">预期价格：</span>
          <span className="text-charcoal-700">{formatCurrency(expectedPrice)}</span>
        </div>
        <div>
          <span className="text-charcoal-500">当前价格：</span>
          <span className="text-champagne-600 font-semibold">{formatCurrency(currentPrice)}</span>
        </div>
        <div>
          <span className="text-charcoal-500">调整次数：</span>
          <span className="text-charcoal-700">{priceHistory.length} 次</span>
        </div>
      </div>
    </div>
  );
}
