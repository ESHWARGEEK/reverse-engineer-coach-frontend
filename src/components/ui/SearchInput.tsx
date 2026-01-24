import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface SearchInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  suggestions?: string[];
  error?: string;
  helperText?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  label,
  placeholder = "Search...",
  value = "",
  onChange,
  onFocus,
  onBlur,
  className,
  disabled = false,
  autoFocus = false,
  suggestions = [],
  error,
  helperText
}) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={clsx("relative", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
          "dark:focus:ring-blue-400 dark:focus:border-blue-400",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500"
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};