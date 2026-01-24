import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'white' | 'gray';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-transparent border-t-current',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  children,
  className
}) => {
  return (
    <div className={clsx('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center space-y-4 border border-gray-700">
            <LoadingSpinner size="lg" color="primary" />
            <p className="text-white text-sm font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showPercentage = false,
  color = 'primary',
  size = 'md'
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const colorClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx(
        'w-full bg-gray-700 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className={clsx(
            'h-full transition-all duration-300 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${clampedProgress}%`}
        />
      </div>
      {showPercentage && (
        <div className="mt-1 text-xs text-gray-400 text-right">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number; // For text variant
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-gray-700 rounded';
  
  if (variant === 'text') {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              baseClasses,
              'h-4 mb-2 last:mb-0',
              index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
            )}
            style={{ width, height }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={clsx(baseClasses, 'rounded-full', className)}
        style={{ 
          width: width || height || '40px', 
          height: height || width || '40px' 
        }}
      />
    );
  }

  return (
    <div
      className={clsx(baseClasses, className)}
      style={{ width, height }}
    />
  );
};