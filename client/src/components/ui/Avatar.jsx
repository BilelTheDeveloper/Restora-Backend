const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const colors = [
  'bg-orange-500', 'bg-blue-500', 'bg-green-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
];

function getColor(name = '') {
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[code % colors.length];
}

export default function Avatar({ src, name = '', size = 'md', className = '' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={[
        'rounded-full flex items-center justify-center shrink-0 font-semibold text-white overflow-hidden',
        sizes[size],
        src ? '' : getColor(name),
        className,
      ].filter(Boolean).join(' ')}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials || '?'
      )}
    </div>
  );
}
