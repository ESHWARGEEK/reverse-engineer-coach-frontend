import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSimpleAppStore } from '../../store/simpleStore';
import { simpleAuthService } from '../../services/simpleAuthService';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

// Programming languages and frameworks
const PROGRAMMING_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
];

const FRAMEWORKS_BY_LANGUAGE: Record<string, Array<{ value: string; label: string }>> = {
  python: [
    { value: 'fastapi', label: 'FastAPI' },
    { value: 'django', label: 'Django' },
    { value: 'flask', label: 'Flask' },
  ],
  typescript: [
    { value: 'react', label: 'React' },
    { value: 'nextjs', label: 'Next.js' },
    { value: 'nestjs', label: 'NestJS' },
  ],
  javascript: [
    { value: 'react', label: 'React' },
    { value: 'express', label: 'Express' },
    { value: 'nextjs', label: 'Next.js' },
  ],
  go: [
    { value: 'gin', label: 'Gin' },
    { value: 'echo', label: 'Echo' },
    { value: 'fiber', label: 'Fiber' },
  ],
  rust: [
    { value: 'actix', label: 'Actix' },
    { value: 'warp', label: 'Warp' },
  ],
  java: [
    { value: 'spring', label: 'Spring' },
    { value: 'quarkus', label: 'Quarkus' },
  ],
  cpp: [],
  csharp: [
    { value: 'aspnet', label: 'ASP.NET' },
  ],
};

export const SimpleRegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { isLoading, error, setLoading, setError, setUser, setToken, setAuthenticated } = useSimpleAppStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    preferredAiProvider: 'openai',
    preferredLanguage: 'python',
    preferredFrameworks: [] as string[],
    openaiApiKey: '',
    geminiApiKey: '',
    githubToken: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; errors: string[] }>({ isValid: false, errors: [] });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!simpleAuthService.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = simpleAuthService.validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors[0];
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // API key validation based on provider
    if (formData.preferredAiProvider === 'openai' && !formData.openaiApiKey) {
      errors.openaiApiKey = 'OpenAI API key is required when OpenAI is selected';
    } else if (formData.preferredAiProvider === 'openai' && formData.openaiApiKey && !simpleAuthService.validateApiKey(formData.openaiApiKey, 'openai')) {
      errors.openaiApiKey = 'Invalid OpenAI API key format (should start with sk-)';
    }

    if (formData.preferredAiProvider === 'gemini' && !formData.geminiApiKey) {
      errors.geminiApiKey = 'Gemini API key is required when Gemini is selected';
    } else if (formData.preferredAiProvider === 'gemini' && formData.geminiApiKey && !simpleAuthService.validateApiKey(formData.geminiApiKey, 'gemini')) {
      errors.geminiApiKey = 'Invalid Gemini API key format';
    }

    // GitHub token validation (optional)
    if (formData.githubToken && !simpleAuthService.validateApiKey(formData.githubToken, 'github')) {
      errors.githubToken = 'Invalid GitHub token format (should start with ghp_ or github_pat_)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Register user
      const user = await simpleAuthService.register({
        email: formData.email,
        password: formData.password,
        github_token: formData.githubToken || undefined,
        openai_api_key: formData.openaiApiKey || undefined,
        gemini_api_key: formData.geminiApiKey || undefined,
        preferred_ai_provider: formData.preferredAiProvider,
        preferred_language: formData.preferredLanguage,
        preferred_frameworks: formData.preferredFrameworks.length > 0 ? formData.preferredFrameworks : undefined,
      });

      // Auto-login after registration
      const authResponse = await simpleAuthService.login({
        email: formData.email,
        password: formData.password,
      });
      
      setToken(authResponse.access_token);
      setUser(user);
      setAuthenticated(true);
      
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Update password strength for password field
    if (field === 'password') {
      setPasswordStrength(simpleAuthService.validatePassword(value));
    }
  };

  const handleLanguageChange = (language: string) => {
    setFormData(prev => ({
      ...prev,
      preferredLanguage: language,
      preferredFrameworks: [], // Reset frameworks when language changes
    }));
  };

  const handleFrameworkToggle = (framework: string) => {
    const currentFrameworks = formData.preferredFrameworks;
    const newFrameworks = currentFrameworks.includes(framework)
      ? currentFrameworks.filter(f => f !== framework)
      : [...currentFrameworks, framework];
    
    setFormData(prev => ({ ...prev, preferredFrameworks: newFrameworks }));
  };

  const availableFrameworks = FRAMEWORKS_BY_LANGUAGE[formData.preferredLanguage] || [];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join the Reverse Engineer Coach platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
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
              Password *
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
                placeholder="Create a strong password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
            {formData.password && !passwordStrength.isValid && (
              <div className="mt-2 text-sm text-yellow-400">
                <p className="font-medium mb-1">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  {passwordStrength.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`
                  block w-full pl-10 pr-12 py-3 border rounded-lg
                  bg-gray-700 text-white placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'}
                `}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* AI Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preferred AI Provider *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${formData.preferredAiProvider === 'openai' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600'}`}>
                <input
                  type="radio"
                  name="aiProvider"
                  value="openai"
                  checked={formData.preferredAiProvider === 'openai'}
                  onChange={(e) => handleInputChange('preferredAiProvider', e.target.value)}
                  className="mr-3"
                  disabled={isLoading}
                />
                <div>
                  <div className="font-medium text-white">OpenAI</div>
                  <div className="text-sm text-gray-400">GPT-4, GPT-3.5</div>
                </div>
              </label>
              <label className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${formData.preferredAiProvider === 'gemini' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600'}`}>
                <input
                  type="radio"
                  name="aiProvider"
                  value="gemini"
                  checked={formData.preferredAiProvider === 'gemini'}
                  onChange={(e) => handleInputChange('preferredAiProvider', e.target.value)}
                  className="mr-3"
                  disabled={isLoading}
                />
                <div>
                  <div className="font-medium text-white">Google Gemini</div>
                  <div className="text-sm text-gray-400">Gemini Pro</div>
                </div>
              </label>
            </div>
          </div>

          {/* Programming Language Selection */}
          <div>
            <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-300 mb-2">
              Preferred Programming Language *
            </label>
            <select
              id="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="block w-full px-3 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              {PROGRAMMING_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Framework Selection */}
          {availableFrameworks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preferred Frameworks (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableFrameworks.map((framework) => (
                  <label key={framework.value} className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.preferredFrameworks.includes(framework.value)}
                      onChange={() => handleFrameworkToggle(framework.value)}
                      className="mr-3"
                      disabled={isLoading}
                    />
                    <span className="text-white">{framework.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* API Keys Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="flex items-center justify-between w-full p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              <div className="flex items-center">
                <Key className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium text-white">API Keys *</span>
              </div>
              {showApiKeys ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {showApiKeys && (
              <div className="mt-4 space-y-4 p-4 bg-gray-700 rounded-lg">
                {/* OpenAI API Key */}
                <div>
                  <label htmlFor="openaiApiKey" className="block text-sm font-medium text-gray-300 mb-2">
                    OpenAI API Key {formData.preferredAiProvider === 'openai' && '*'}
                  </label>
                  <input
                    id="openaiApiKey"
                    type="password"
                    value={formData.openaiApiKey}
                    onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                    className={`
                      block w-full px-3 py-3 border rounded-lg
                      bg-gray-600 text-white placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${validationErrors.openaiApiKey ? 'border-red-500' : 'border-gray-500'}
                    `}
                    placeholder="sk-..."
                    disabled={isLoading}
                  />
                  {validationErrors.openaiApiKey && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.openaiApiKey}
                    </p>
                  )}
                </div>

                {/* Gemini API Key */}
                <div>
                  <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-300 mb-2">
                    Gemini API Key {formData.preferredAiProvider === 'gemini' && '*'}
                  </label>
                  <input
                    id="geminiApiKey"
                    type="password"
                    value={formData.geminiApiKey}
                    onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                    className={`
                      block w-full px-3 py-3 border rounded-lg
                      bg-gray-600 text-white placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${validationErrors.geminiApiKey ? 'border-red-500' : 'border-gray-500'}
                    `}
                    placeholder="Enter your Gemini API key"
                    disabled={isLoading}
                  />
                  {validationErrors.geminiApiKey && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.geminiApiKey}
                    </p>
                  )}
                </div>

                {/* GitHub Token */}
                <div>
                  <label htmlFor="githubToken" className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Personal Access Token (Optional)
                  </label>
                  <input
                    id="githubToken"
                    type="password"
                    value={formData.githubToken}
                    onChange={(e) => handleInputChange('githubToken', e.target.value)}
                    className={`
                      block w-full px-3 py-3 border rounded-lg
                      bg-gray-600 text-white placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${validationErrors.githubToken ? 'border-red-500' : 'border-gray-500'}
                    `}
                    placeholder="ghp_... or github_pat_..."
                    disabled={isLoading}
                  />
                  {validationErrors.githubToken && (
                    <p className="mt-1 text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.githubToken}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Used for accessing private repositories and higher API rate limits
                  </p>
                </div>
              </div>
            )}
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
            disabled={isLoading}
            className="w-full py-3 text-lg font-medium"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-medium"
              disabled={isLoading}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};