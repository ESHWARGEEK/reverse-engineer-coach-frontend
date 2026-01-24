import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion, useHighContrast, useSkipLinks } from '../../hooks/useFocusManagement';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from '../auth/UserProfile';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Home,
  FolderOpen,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

// Simple navigation function to avoid react-router-dom
const navigateTo = (path: string) => {
  window.location.hash = path;
};

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showNavigation = true 
}) => {
  const [currentPath, setCurrentPath] = React.useState(window.location.hash.slice(1) || '/');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuthStore();
  const prefersReducedMotion = useReducedMotion();
  const prefersHighContrast = useHighContrast();
  
  // Initialize skip links
  useSkipLinks();
  
  const navigationItems = [
    { path: '/', label: 'Home', exact: true, icon: Home, public: true },
    { path: '/dashboard', label: 'Dashboard', exact: true, icon: BarChart3, requireAuth: true },
    { path: '/projects', label: 'Projects', exact: false, icon: FolderOpen, requireAuth: true },
  ];

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen for profile modal events
  useEffect(() => {
    const handleOpenProfile = () => {
      setShowProfileModal(true);
    };

    window.addEventListener('openProfile', handleOpenProfile);
    return () => window.removeEventListener('openProfile', handleOpenProfile);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (!target.closest('.mobile-menu-container')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Announce page changes to screen readers
  useEffect(() => {
    const pageTitle = document.title;
    const announcement = `Navigated to ${pageTitle}`;
    
    // Create a live region for announcements
    const liveRegion = document.getElementById('page-announcement') || 
      (() => {
        const region = document.createElement('div');
        region.id = 'page-announcement';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        document.body.appendChild(region);
        return region;
      })();
    
    liveRegion.textContent = announcement;
    
    // Clear the announcement after a short delay
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }, [currentPath]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigateTo('/');
  };

  const handleOpenProfile = () => {
    setShowProfileModal(true);
    setShowUserMenu(false);
  };

  // Filter navigation items based on authentication
  const visibleNavItems = navigationItems.filter(item => {
    if (item.requireAuth && !isAuthenticated) return false;
    return true;
  });

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/' }];

    if (pathSegments.length > 0) {
      let currentPathBuild = '';
      pathSegments.forEach((segment, index) => {
        currentPathBuild += `/${segment}`;
        
        // Map path segments to readable labels
        let label = segment;
        switch (segment) {
          case 'dashboard':
            label = 'Dashboard';
            break;
          case 'projects':
            label = 'Projects';
            break;
          case 'workspace':
            label = 'Workspace';
            break;
          case 'auth':
            label = 'Authentication';
            break;
          default:
            // For dynamic segments like project IDs, keep as is or truncate
            if (segment.length > 8) {
              label = `${segment.substring(0, 8)}...`;
            }
        }

        breadcrumbs.push({ label, path: currentPathBuild });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  
  return (
    <div className={clsx(
      "min-h-screen bg-gray-900 text-gray-100",
      prefersReducedMotion && "motion-reduce",
      prefersHighContrast && "high-contrast"
    )}>
      {/* Skip Links */}
      <div className="sr-only focus-within:not-sr-only">
        <a 
          href="#main-content" 
          className="skip-to-content"
          data-skip-link
        >
          Skip to main content
        </a>
        {showNavigation && (
          <a 
            href="#navigation" 
            className="skip-to-content"
            data-skip-link
          >
            Skip to navigation
          </a>
        )}
      </div>

      {showNavigation && (
        <nav 
          id="navigation"
          className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Logo/Brand */}
                <button
                  onClick={() => navigateTo('/')}
                  className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-md px-2 py-1"
                  aria-label="Reverse Engineer Coach - Home"
                >
                  <span className="text-xl font-bold text-white">
                    Reverse Engineer Coach
                  </span>
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-4 ml-8" role="menubar">
                  {visibleNavItems.map((item) => {
                    const isActive = item.exact 
                      ? currentPath === item.path
                      : currentPath.startsWith(item.path) && item.path !== '/';
                    const Icon = item.icon;
                      
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigateTo(item.path)}
                        role="menuitem"
                        aria-current={isActive ? 'page' : undefined}
                        className={clsx(
                          'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800',
                          isActive
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        )}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Right side - User menu or auth buttons */}
              <div className="flex items-center space-x-4">
                {isAuthenticated && user ? (
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                      aria-expanded={showUserMenu}
                      aria-haspopup="true"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="hidden sm:block">{user.email}</span>
                      <ChevronDown className={clsx(
                        "w-4 h-4 transition-transform",
                        showUserMenu && "rotate-180"
                      )} />
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                        <div className="py-1" role="menu">
                          <div className="px-4 py-2 border-b border-gray-700">
                            <p className="text-sm text-white font-medium">{user.email}</p>
                            <p className="text-xs text-gray-400">
                              {user.preferred_ai_provider} • {user.preferred_language}
                            </p>
                          </div>
                          
                          <button
                            onClick={handleOpenProfile}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            role="menuitem"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Account Settings
                          </button>
                          
                          <button
                            onClick={() => {
                              navigateTo('/dashboard');
                              setShowUserMenu(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            role="menuitem"
                          >
                            <BarChart3 className="w-4 h-4 mr-3" />
                            Dashboard
                          </button>
                          
                          <div className="border-t border-gray-700">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              role="menuitem"
                            >
                              <LogOut className="w-4 h-4 mr-3" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateTo('/auth')}
                      className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-md"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                {/* Mobile menu button */}
                <div className="md:hidden mobile-menu-container">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    aria-expanded={showMobileMenu}
                    aria-label="Toggle mobile menu"
                  >
                    {showMobileMenu ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Menu className="w-6 h-6" />
                    )}
                  </button>

                  {/* Mobile Navigation Menu */}
                  {showMobileMenu && (
                    <div className="absolute right-4 top-16 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                      <div className="py-2">
                        {visibleNavItems.map((item) => {
                          const isActive = item.exact 
                            ? currentPath === item.path
                            : currentPath.startsWith(item.path) && item.path !== '/';
                          const Icon = item.icon;
                            
                          return (
                            <button
                              key={item.path}
                              onClick={() => {
                                navigateTo(item.path);
                                setShowMobileMenu(false);
                              }}
                              className={clsx(
                                'flex items-center w-full px-4 py-2 text-sm font-medium',
                                isActive
                                  ? 'bg-gray-700 text-white'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              )}
                            >
                              <Icon className="w-4 h-4 mr-3" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Breadcrumb Navigation */}
      {showNavigation && breadcrumbs.length > 1 && (
        <nav className="bg-gray-800/50 border-b border-gray-700/50" aria-label="Breadcrumb">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  {index > 0 && (
                    <span className="text-gray-500">/</span>
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-300 font-medium" aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <button
                      onClick={() => navigateTo(crumb.path)}
                      className="text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded px-1"
                    >
                      {crumb.label}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </nav>
      )}
      
      <main 
        id="main-content"
        className={clsx(showNavigation ? 'pt-0' : '')}
        role="main"
        tabIndex={-1}
      >
        {children}
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <UserProfile onClose={() => setShowProfileModal(false)} />
        </div>
      )}

      {/* Live region for dynamic announcements */}
      <div 
        id="live-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />
    </div>
  );
};