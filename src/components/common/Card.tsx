import { ReactNode } from 'react';
import { Card as AntCard } from 'antd';

interface CardProps {
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  extra?: ReactNode;
}

export function Card({ title, children, className, extra }: CardProps) {
  return (
    <AntCard title={title} className={className} extra={extra}>
      {children}
    </AntCard>
  );
}
