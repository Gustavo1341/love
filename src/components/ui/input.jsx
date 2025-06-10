import React from 'react';

export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return <input type={type} className={`p-2 border border-gray-600 rounded bg-gray-700 text-white w-full ${className || ''}`} ref={ref} {...props} />;
});
Input.displayName = "Input";