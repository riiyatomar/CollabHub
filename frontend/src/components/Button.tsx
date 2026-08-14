import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-white hover:bg-blue-600 focus:ring-primary",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500 text-gray-700",
      ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2",
          variants[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
