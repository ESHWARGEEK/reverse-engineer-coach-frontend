import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:transform active:scale-95'
  ];

  const variantClasses = {
    primary: [
      'bg-blue-600 text-white border border-blue-600',
      'hover:bg-blue-700 hover:border-blue-700',
      'focus:ring-blue-500',
      'disabled:hover:bg-blue-600 disabled:hover:border-blue-600'
    ],
    secondary: [
      'bg-gray-600 text-white border border-gray-600',
      'hover:bg-gray-700 hover:border-gray-700',
      'focus:ring-gray-500',
      'disabled:hover:bg-gray-600 disabled:hover:border-gray-600'
    ],
    outline: [
      'bg-transparent text-gray-300 border border-gray-600',
      'hover:bg-gray-700 hover:text-white hover:border-gray-500',
      'focus:ring-gray-500',
      'disabled:hover:bg-transparent disabled:hover:text-gray-300 disabled:hover:border-gray-600'
    ],
    ghost: [
      'bg-transparent text-gray-300 border border-transparent',
      'hover:bg-gray-700 hover:text-white',
      'focus:ring-gray-500',
      'disabled:hover:bg-transparent disabled:hover:text-gray-300'
    ],
    danger: [
      'bg-red-600 text-white border border-red-600',
      'hover:bg-red-700 hover:border-red-700',
      'focus:ring-red-500',
      'disabled:hover:bg-red-600 disabled:hover:border-red-600'
    ]
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const isDisabled = disabled || isLoading;
  const displayText = isLoading && loadingText ? loadingText : children;

  return (
    <button
      ref={ref}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner 
          size="sm" 
          color="white" 
          className="mr-2" 
        />
      )}
      
      {!isLoading && leftIcon && (
        <span className="mr-2 flex-shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      
      <span className={isLoading ? 'opacity-75' : ''}>
        {displayText}
      </span>
      
      {!isLoading && rightIcon && (
        <span className="ml-2 flex-shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';