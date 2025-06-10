import React from 'react';

export const Label = React.forwardRef(({ className, ...props }, ref) => {
  return <label className={`block text-sm font-medium text-gray-300 mb-1 ${className || ''}`} ref={ref} {...props} />;
});
Label.displayName = "Label";