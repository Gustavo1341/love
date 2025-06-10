import React from 'react';

export const Button = React.forwardRef(({ className, variant, size, children, ...props }, ref) => {
  // Estilos muito básicos para começar
  const baseStyle = "px-4 py-2 rounded font-semibold transition-colors";
  const variantStyle = variant === "destructive" ? "bg-red-500 hover:bg-red-600 text-white"
                     : variant === "ghost" ? "hover:bg-gray-700"
                     : "bg-primary hover:bg-primary/90 text-white"; // Adicionando a cor primária
  const sizeStyle = size === "icon" ? "p-2" : "";

  // Remova cn(...) se não tiver a função cn (clsx + tailwind-merge)
  return <button className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ''}`} ref={ref} {...props}>{children}</button>;
});
Button.displayName = "Button";