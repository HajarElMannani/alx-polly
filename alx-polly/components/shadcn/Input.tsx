import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input: React.FC<InputProps> = ({ label, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      <input
        className="rounded-md border border-gray-200 px-3 py-2 focus:ring-2 w-full"
        {...props}
      />
    </div>
  );
};

export default Input;
