import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  border?: boolean;
}

export function Card({ children, className = '', hover = false, border = true }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm ${border ? 'border border-neutral-200' : ''} ${hover ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5' : ''} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-neutral-200 ${className}`}>
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

Card.Body = function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

Card.Footer = function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
};
