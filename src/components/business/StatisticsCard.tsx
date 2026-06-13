import React from 'react';
import { Card as AntCard } from 'antd';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, AlertTriangle } from 'lucide-react';

interface StatisticsCardProps {
  title: string;
  value: number | string;
  icon: 'trending-up' | 'trending-down' | 'dollar' | 'users' | 'file' | 'alert';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red';
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'trending-up':
        return <TrendingUp className="w-6 h-6" />;
      case 'trending-down':
        return <TrendingDown className="w-6 h-6" />;
      case 'dollar':
        return <DollarSign className="w-6 h-6" />;
      case 'users':
        return <Users className="w-6 h-6" />;
      case 'file':
        return <FileText className="w-6 h-6" />;
      case 'alert':
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'green':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'orange':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'red':
        return 'bg-red-50 text-red-600 border-red-200';
    }
  };

  return (
    <AntCard className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs 上月</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${getColorClasses()}`}>
          {getIcon()}
        </div>
      </div>
    </AntCard>
  );
};

export default StatisticsCard;