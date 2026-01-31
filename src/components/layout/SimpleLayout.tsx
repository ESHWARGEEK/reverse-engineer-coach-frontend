import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface SimpleLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

// Simple navigation function
const navigate = (path: string) => {
  window.location.hash = path;
};

export const SimpleLayout: React.FC<SimpleLayoutProps> = ({ 
  children, 
  showNavigation = true 
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Check authentication from localStorage
  const token = localStorage.getItem('auth_token');
  const email = localStorage.getItem('user_email');
  const isAuthenticated = !!token && !!email;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {showNavigation && (
        <nav className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Logo/Brand */}
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-md px-2 py-1"
                >
                  <span className="text-xl font-bold text-white">
                    Reverse Engineer Coach
                  </span>
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4 ml-8">
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    Home
                  </button>
                  
                  {isAuthenticated && (
                    <>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                      >
                        Dashboard
                      </button>
                      
                      <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                      >
                        Projects
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Right side - User menu or auth buttons */}
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-300 text-sm">Welcome, {email}</span>
                    <Button
                      onClick={handleLogout}
                      variant="secondary"
                      size="sm"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => navigate('/auth')}
                    variant="primary"
                    size="sm"
                  >
                    Sign In
                  </Button>
                )}

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    {showMobileMenu ? (
                      <span className="w-6 h-6">✕</span>
                    ) : (
                      <span className="w-6 h-6">☰</span>
                    )}
                  </button>

                  {/* Mobile Navigation Menu */}
                  {showMobileMenu && (
                    <div className="absolute right-4 top-16 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/');
                            setShowMobileMenu(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          Home
                        </button>
                        
                        {isAuthenticated && (
                          <>
                            <button
                              onClick={() => {
                                navigate('/dashboard');
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              Dashboard
                            </button>
                            
                            <button
                              onClick={() => {
                                navigate('/projects');
                                setShowMobileMenu(false);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              Projects
                            </button>
                            
                            <div className="border-t border-gray-700">
                              <button
                                onClick={() => {
                                  handleLogout();
                                  setShowMobileMenu(false);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                Logout
                              </button>
                            </div>
                          </>
                        )}
                        
                        {!isAuthenticated && (
                          <button
                            onClick={() => {
                              navigate('/auth');
                              setShowMobileMenu(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                          >
                            Sign In
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <main role="main">
        {children}
      </main>
    </div>
  );
};