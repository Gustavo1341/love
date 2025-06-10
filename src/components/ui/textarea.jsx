import React from 'react';

export const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return <textarea className={`p-2 border border-gray-600 rounded bg-gray-700 text-white w-full min-h-[80px] ${className || ''}`} ref={ref} {...props} />;
});
Textarea.displayName = "Textarea";