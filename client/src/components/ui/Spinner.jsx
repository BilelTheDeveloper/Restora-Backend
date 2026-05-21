const sizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colors = {
  orange: 'border-orange-500',
  white: 'border-white',
  gray: 'border-gray-400',
};

export default function Spinner({ size = 'md', color = 'orange', className = '' }) {
  return (
    <div
      className={[
        'rounded-full border-2 border-transparent animate-spin',
        sizes[size],
        colors[color],
        'border-t-current',
        className,
      ].join(' ')}
      role="status"
      aria-label="loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm z-50">
      <Spinner size="xl" />
    </div>
  );
}
