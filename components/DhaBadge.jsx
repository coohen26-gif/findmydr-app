import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const DhaBadge = React.forwardRef(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full font-bold border',
        'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400',
        'text-white border-amber-300 shadow-sm shadow-amber-200/50',
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      {...props}
    >
      <ShieldCheck className={cn(
        size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
      )} />
      DHA Vérifié
    </div>
  );
});
DhaBadge.displayName = 'DhaBadge';

export { DhaBadge };
