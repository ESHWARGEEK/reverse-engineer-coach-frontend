import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { 
    formData, 
    isLoading, 
    error, 
    showPassword,
    updateFormData, 
    togglePasswordVisibility,
    setError,
    clearError,
    login 
  } = useAuthStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Real-time form validation
  useEffect(() => {
    const emailValid = formData.email && authService.validateEmail(formData.email);
    const passwordValid = formData.password && formData.password.length > 0;
    
    setIsFormValid(!!emailValid && !!passwordValid);

    // Update validation errors
    const errors: Record<string, string> = {};
    
    if (formData.email && !authService.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.password && formData.password.length === 0) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
  }, [formData.email, formData.password]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!authService.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password, rememberMe);
      onSuccess?.();
    } catch (error) {
      // Error is already handled in the store
      console.error('Login failed:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    updateFormData(field, value);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Sign in to continue your learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`
                  block w-full pl-10 pr-3 py-3 border rounded-lg
                  bg-gray-700 text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${validationErrors.email ? 'border-red-500' : 'border-gray-600'}
                `}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`
                  block w-full pl-10 pr-12 py-3 border rounded-lg
                  bg-gray-700 text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${validationErrors.password ? 'border-red-500' : 'border-gray-600'}
                `}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-300">Remember me for 30 days</span>
            </label>
            <button
              type="button"
              className="text-sm text-blue-400 hover:text-blue-300"
              disabled={isLoading}
              onClick={() => {
                // TODO: Implement forgot password functionality
                setError('Forgot password functionality coming soon');
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full py-3 text-lg font-medium"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Switch to Register */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-400 hover:text-blue-300 font-medium"
              disabled={isLoading}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};