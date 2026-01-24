import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuthStore } from '../../store/authStore';
import { useAuthInit } from '../../hooks/useAuthInit';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize auth state
  useAuthInit();

  // Handle redirect after successful authentication
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from || '/dashboard';
      onAuthSuccess?.();
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.state, onAuthSuccess]);

  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Reverse Engineer Coach
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Learn software architecture by reverse engineering real-world applications with AI-powered guidance
          </p>
        </div>

        {/* Auth Forms */}
        <div className="flex justify-center">
          {isLogin ? (
            <LoginForm 
              onSwitchToRegister={handleSwitchToRegister}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterForm 
              onSwitchToLogin={handleSwitchToLogin}
              onSuccess={handleAuthSuccess}
            />
          )}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Language Support</h3>
            <p className="text-gray-400 text-sm">
              Learn architecture patterns in Python, TypeScript, Go, Rust, Java, and more
            </p>
          </div>

          <div className="text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Learning</h3>
            <p className="text-gray-400 text-sm">
              Get personalized guidance from OpenAI GPT-4 or Google Gemini
            </p>
          </div>

          <div className="text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Real Repositories</h3>
            <p className="text-gray-400 text-sm">
              Analyze and learn from actual open-source projects on GitHub
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>
            Secure authentication • Encrypted API keys • Privacy focused
          </p>
        </div>
      </div>
    </div>
  );
};