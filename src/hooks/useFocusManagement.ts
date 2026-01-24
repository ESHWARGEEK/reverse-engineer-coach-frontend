import { useEffect, useRef, useCallback } from 'react';

interface FocusManagementOptions {
  restoreFocus?: boolean;
  trapFocus?: boolean;
  autoFocus?: boolean;
}

export const useFocusManagement = (
  isActive: boolean,
  options: FocusManagementOptions = {}
) => {
  const {
    restoreFocus = true,
    trapFocus = false,
    autoFocus = true
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Store the previously focused element when component becomes active
  useEffect(() => {
    if (isActive) {
      previousActiveElement.current = document.activeElement;
      
      if (autoFocus && containerRef.current) {
        // Focus the first focusable element or the container itself
        const firstFocusable = getFocusableElements(containerRef.current)[0];
        if (firstFocusable) {
          (firstFocusable as HTMLElement).focus();
        } else if (containerRef.current.tabIndex >= 0) {
          containerRef.current.focus();
        }
      }
    }

    return () => {
      // Restore focus when component becomes inactive
      if (restoreFocus && previousActiveElement.current && !isActive) {
        (previousActiveElement.current as HTMLElement).focus?.();
      }
    };
  }, [isActive, autoFocus, restoreFocus]);

  // Handle focus trapping
  useEffect(() => {
    if (!isActive || !trapFocus || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current!);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, trapFocus]);

  return containerRef;
};

// Get all focusable elements within a container
const getFocusableElements = (container: HTMLElement): Element[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)).filter(
    (element) => {
      const htmlElement = element as HTMLElement;
      return (
        htmlElement.offsetWidth > 0 &&
        htmlElement.offsetHeight > 0 &&
        !htmlElement.hidden &&
        window.getComputedStyle(htmlElement).visibility !== 'hidden'
      );
    }
  );
};

// Hook for managing keyboard navigation
export const useKeyboardNavigation = (
  items: any[],
  onSelect?: (index: number, item: any) => void,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
  } = {}
) => {
  const { loop = true, orientation = 'vertical', disabled = false } = options;
  const activeIndexRef = useRef(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled || items.length === 0) return;

    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    let newIndex = activeIndexRef.current;

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        newIndex = loop 
          ? (activeIndexRef.current + 1) % items.length
          : Math.min(activeIndexRef.current + 1, items.length - 1);
        break;
      
      case prevKey:
        event.preventDefault();
        newIndex = loop
          ? (activeIndexRef.current - 1 + items.length) % items.length
          : Math.max(activeIndexRef.current - 1, 0);
        break;
      
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (onSelect) {
          onSelect(activeIndexRef.current, items[activeIndexRef.current]);
        }
        return;
      
      default:
        return;
    }

    activeIndexRef.current = newIndex;
    if (onSelect) {
      onSelect(newIndex, items[newIndex]);
    }
  }, [items, onSelect, loop, orientation, disabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const setActiveIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      activeIndexRef.current = index;
    }
  }, [items.length]);

  return {
    activeIndex: activeIndexRef.current,
    setActiveIndex,
    handleKeyDown
  };
};

// Hook for managing skip links
export const useSkipLinks = () => {
  useEffect(() => {
    const skipLinks = document.querySelectorAll('[data-skip-link]');
    
    const handleSkipLinkClick = (event: Event) => {
      event.preventDefault();
      const target = (event.target as HTMLElement).getAttribute('href');
      if (target) {
        const targetElement = document.querySelector(target);
        if (targetElement) {
          (targetElement as HTMLElement).focus();
          (targetElement as HTMLElement).scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    skipLinks.forEach(link => {
      link.addEventListener('click', handleSkipLinkClick);
    });

    return () => {
      skipLinks.forEach(link => {
        link.removeEventListener('click', handleSkipLinkClick);
      });
    };
  }, []);
};

// Hook for managing reduced motion preferences
export const useReducedMotion = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  useEffect(() => {
    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [prefersReducedMotion]);

  return prefersReducedMotion;
};

// Hook for managing high contrast preferences
export const useHighContrast = () => {
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  
  useEffect(() => {
    if (prefersHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [prefersHighContrast]);

  return prefersHighContrast;
};