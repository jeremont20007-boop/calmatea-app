import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-calm-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-3 rounded-xl border-2 border-calm-200 bg-white text-calm-800 font-medium',
            'placeholder:text-calm-400 focus:outline-none focus:border-calm-500 focus:ring-2 focus:ring-calm-500/30 transition-colors',
            'min-h-[52px] text-base',
            error && 'border-red-400 focus:border-red-400',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...props}
        />
        {error && <p id={errorId} className="mt-1 text-sm text-red-700">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
