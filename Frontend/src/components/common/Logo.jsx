import React, { forwardRef } from 'react';

/**
 * Centralized Logo Component
 * Usage: <Logo className="h-8 w-auto" />
 * Supports ref for animations
 */
const Logo = forwardRef(({ className = "text-xl font-bold text-gray-900", ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      Civil connect
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
