import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({ label, error, options = [], placeholder, className = '', required = false, ...props }, ref) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </label>
    )}
    <div className="relative">
      <select
        ref={ref}
        className={[
          'w-full h-10 ps-3 pe-9 rounded-lg border text-sm appearance-none',
          'bg-white dark:bg-white/5',
          'text-gray-900 dark:text-gray-100',
          'transition-colors duration-150',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 dark:border-white/10 focus:border-orange-500 focus:ring-orange-200 dark:focus:ring-orange-900',
          'focus:outline-none focus:ring-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(({ value, label: lbl }) => (
          <option key={value} value={value}>{lbl}</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute inset-y-0 end-3 my-auto text-gray-400 pointer-events-none" />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

Select.displayName = 'Select';
export default Select;
