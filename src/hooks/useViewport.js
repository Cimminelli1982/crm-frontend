import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoints for responsive design
 * Mobile: < 768px
 * Tablet: 768px - 1024px
 * Desktop: > 1024px
 */
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

/**
 * Hook per gestire il viewport e i breakpoint responsive
 *
 * @returns {Object} {
 *   width,          // current viewport width
 *   height,         // current viewport height
 *   isMobile,       // true if width < 768px
 *   isTablet,       // true if 768px <= width <= 1024px
 *   isDesktop,      // true if width > 1024px
 *   isPortrait,     // true if height > width
 *   isLandscape,    // true if width >= height
 *   breakpoint,     // 'mobile' | 'tablet' | 'desktop'
 * }
 */
export const useViewport = () => {
  const getViewport = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const isMobile = width < BREAKPOINTS.mobile;
    const isTablet = width >= BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet;
    const isDesktop = width > BREAKPOINTS.tablet;

    let breakpoint = 'desktop';
    if (isMobile) breakpoint = 'mobile';
    else if (isTablet) breakpoint = 'tablet';

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      isPortrait: height > width,
      isLandscape: width >= height,
      breakpoint,
    };
  }, []);

  const [viewport, setViewport] = useState(getViewport);

  useEffect(() => {
    let timeoutId = null;

    const handleResize = () => {
      // Debounce resize events for performance
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setViewport(getViewport());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [getViewport]);

  return viewport;
};

export default useViewport;
