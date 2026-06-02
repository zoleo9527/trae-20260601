import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>

export interface ButtonProps extends MotionButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants: globalThis.Record<ButtonVariant, string> = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-soft hover:shadow-soft-lg',
      secondary: 'bg-white text-primary-600 border-2 border-primary-200 hover:border-primary-400 hover:bg-primary-50',
      danger: 'bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 shadow-soft',
      ghost: 'bg-transparent text-primary-600 hover:bg-primary-100 active:bg-primary-200',
    }

    const sizes: globalThis.Record<ButtonSize, string> = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <motion.button
        ref={ref as any}
        className={cn(
          'font-semibold rounded-2xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        whileTap={{ scale: 0.96 }}
        whileHover={{ y: -1 }}
        {...(props as any)}
      >
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
