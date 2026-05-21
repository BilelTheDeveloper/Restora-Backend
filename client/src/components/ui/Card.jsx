export default function Card({ children, className = '', padding = true, hoverable = false }) {
  return (
    <div
      className={[
        'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl',
        'transition-shadow duration-200',
        padding ? 'p-5' : '',
        hoverable ? 'hover:shadow-md cursor-pointer' : 'shadow-sm',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-gray-200 dark:border-white/10 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-t border-gray-200 dark:border-white/10 ${className}`}>
      {children}
    </div>
  );
}
