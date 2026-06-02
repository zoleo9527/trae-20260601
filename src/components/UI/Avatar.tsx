import { forwardRef, type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: AvatarSize
  fallback?: string
}

const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, size = 'md', fallback, src, alt, ...props }, ref) => {
    const sizes: Record<AvatarSize, string> = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-12 h-12 text-base',
      lg: 'w-16 h-16 text-xl',
      xl: 'w-24 h-24 text-3xl',
    }

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    const fallbackInitials = fallback ? getInitials(fallback) : '?'

    return (
      <div
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold shadow-soft',
          sizes[size],
          className
        )}
      >
        {src ? (
          <img
            ref={ref}
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            {...props}
          />
        ) : (
          <span className="select-none">{fallbackInitials}</span>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
