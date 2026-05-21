import { forwardRef } from 'react';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-orange-500 hover:bg-orange-600 text-white border-transparent shadow-sm',
  secondary: 'bg-transparent hover:bg-orange-50 dark:hover:bg-orange-950 text-orange-500 border-orange-500',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 border-transparent',
  danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent shadow-sm',
  'danger-ghost': 'bg-transparent hover:bg-red-50 dark:hover:bg-red-950 text-red-500 border-transparent',
};

const sizes = {
  xs: 'h-7 px-3 text-xs gap-1.5',
  sm: 'h-8 px-3.5 text-sm gap-2',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2.5',
  xl: 'h-12 px-6 text-base gap-2.5',
};

const iconSizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 };

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  fullWidth = false,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg border',
        'transition-all duration-150 select-none cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'primary' || variant === 'danger' ? 'white' : 'orange'} />
      ) : Icon ? (
        <Icon size={iconSizes[size]} className="shrink-0" />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight size={iconSizes[size]} className="shrink-0" />}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
