import React, { forwardRef } from 'react';

/**
 * Doormeets Logo Component
 * Uses /doormeets-logo.png from public/ folder
 * Usage: <Logo className="h-12 w-auto" />
 */
const Logo = forwardRef(({ className = "h-12 w-auto", iconOnly = false, ...props }, ref) => {
  return (
    <img
      ref={ref}
      src="/doormeets-logo.png"
      alt="Doormeets"
      className={className}
      {...props}
    />
  );
});

Logo.displayName = 'Logo';

export default Logo;
