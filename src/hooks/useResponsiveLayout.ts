import { useState, useEffect } from 'react';

export interface ResponsiveLayoutConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  showLeftPane: boolean;
  showRightPane: boolean;
  stackVertically: boolean;
}

export const useResponsiveLayout = (): ResponsiveLayoutConfig => {
  const [config, setConfig] = useState<ResponsiveLayoutConfig>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    showLeftPane: true,
    showRightPane: true,
    stackVertically: false,
  });

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      setConfig({
        isMobile,
        isTablet,
        isDesktop,
        showLeftPane: !isMobile,
        showRightPane: isDesktop,
        stackVertically: isMobile,
      });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  return config;
};