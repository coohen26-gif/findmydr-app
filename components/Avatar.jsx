import * as React from 'react';
import { cn, initials, getAvatarColor } from '../lib/utils';
import { ShieldCheck } from 'lucide-react';

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
  '2xl': 'h-32 w-32 text-4xl',
};

const Avatar = React.forwardRef(({ className, name, src, size = 'md', verified = false, ...props }, ref) => {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const colorClass = getAvatarColor(name);
  return (
    <div ref={ref} className={cn('relative inline-flex flex-shrink-0', className)} {...props}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || 'avatar'}
          className={cn('rounded-full object-cover ring-2 ring-white', sizeClass)}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white ring-2 ring-white shadow-sm',
            colorClass,
            sizeClass
          )}
        >
          {initials(name)}
        </div>
      )}
      {verified && (
        <div
          className="absolute -bottom-1 -right-1 rounded-full bg-success text-white ring-2 ring-white flex items-center justify-center"
          style={{ width: size === 'sm' ? '14px' : size === 'md' ? '18px' : '24px', height: size === 'sm' ? '14px' : size === 'md' ? '18px' : '24px' }}
        >
          <ShieldCheck style={{ width: '60%', height: '60%' }} />
        </div>
      )}
    </div>
  );
});
Avatar.displayName = 'Avatar';

export { Avatar };
