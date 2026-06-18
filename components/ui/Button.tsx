import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'emergency'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed touch-target',
          {
            // variants
            'bg-calm-400 text-white hover:bg-calm-500 shadow-md hover:shadow-lg': variant === 'primary',
            'bg-calm-100 text-calm-800 hover:bg-calm-200': variant === 'secondary',
            'bg-transparent text-calm-600 hover:bg-calm-100': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 shadow-md': variant === 'danger',
            'bg-coral text-white hover:opacity-90 shadow-xl text-xl font-extrabold': variant === 'emergency',
            // sizes
            'text-sm px-3 py-2 min-h-[40px]': size === 'sm',
            'text-base px-5 py-3 min-h-[52px]': size === 'md',
            'text-lg px-6 py-4 min-h-[60px]': size === 'lg',
            'text-2xl px-8 py-6 min-h-[80px] w-full': size === 'xl',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
