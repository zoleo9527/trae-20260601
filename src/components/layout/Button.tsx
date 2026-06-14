import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1a2e]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            primary:
              'bg-[#e94560] text-white hover:bg-[#d63850] focus:ring-[#e94560]',
            secondary:
              'bg-[#0f3460] text-[#eaeaea] hover:bg-[#0a2545] focus:ring-[#0f3460]',
            danger:
              'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
            ghost:
              'bg-transparent text-[#a0a0a0] hover:bg-[#16213e] hover:text-[#eaeaea] focus:ring-[#16213e]',
          }[variant],
          {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base',
          }[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
