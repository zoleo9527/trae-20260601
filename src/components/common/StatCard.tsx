import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  bgColor: string;
  textColor: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  bgColor,
  textColor,
  icon,
}) => {
  return (
    <div
      className={`${bgColor} rounded-lg p-4 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${textColor} opacity-90 font-medium`}>{title}</p>
          <p className={`text-3xl font-bold ${textColor} mt-1 font-mono`}>
            {value}
          </p>
        </div>
        {icon && <div className={`${textColor} opacity-80`}>{icon}</div>}
      </div>
    </div>
  );
};
