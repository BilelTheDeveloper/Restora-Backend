const variants = {
  default:  'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300',
  primary:  'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
  success:  'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  warning:  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  error:    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  info:     'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

const dotColors = {
  default: 'bg-gray-400',
  primary: 'bg-orange-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
};

export default function Badge({ children, variant = 'default', size = 'md', dot = false, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
