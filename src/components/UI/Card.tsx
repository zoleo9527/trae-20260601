import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type CardPadding = 'sm' | 'md' | 'lg' | 'none'
type CardShadow = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
  shadow?: CardShadow
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', shadow = 'md', children, ...props }, ref) => {
    const paddings: Record<CardPadding, string> = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
    }

    const shadows: Record<CardShadow, string> = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-soft',
      lg: 'shadow-soft-lg',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-3xl',
          paddings[padding],
          shadows[shadow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }
