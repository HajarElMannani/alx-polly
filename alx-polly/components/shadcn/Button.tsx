import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: "button" | "a";
  variant?: "default" | "ghost";
  href?: string;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  as = "button",
  variant = "default",
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2";
  const variants: Record<string, string> = {
    default: "bg-primary text-white hover:opacity-90",
    ghost: "bg-transparent border border-gray-200",
  };

  const Component = as;

  return (
    <Component className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
};

export default Button;
